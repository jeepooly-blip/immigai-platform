import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import {
  buildSystemPrompt, generateDemoResponse, SUPPORTED_LANGUAGES,
  WELCOME_MESSAGES, extractIntakeFromMessages,
  type LanguageCode,
} from '@/lib/chatEngine'
import type { ChatMessage, IntakeData } from '@/types/prisma'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body    = await req.json()
    const {
      sessionId,
      message,
      language = 'en',
      caseId,
    }: {
      sessionId?: string
      message: string
      language: LanguageCode
      caseId?: string
    } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // ── Get or create session ────────────────────────────────
    let session_rec = sessionId
      ? await prisma.chatSession.findUnique({ where: { id: sessionId } })
      : null

    if (!session_rec) {
      session_rec = await prisma.chatSession.create({
        data: {
          userId:     session?.user?.id ?? null,
          caseId:     caseId ?? null,
          language,
          messages:   '[]',
          intakeData: '{}',
        },
      })
    }

    // Parse stored messages and intake
    const messages: ChatMessage[] = JSON.parse(session_rec.messages)
    const intakeData: IntakeData  = JSON.parse(session_rec.intakeData)

    // Add user message
    const userMsg: ChatMessage = {
      id:        uuidv4(),
      role:      'user',
      content:   message,
      contentEn: message, // assume English input for now; could translate if needed
      timestamp: new Date().toISOString(),
    }
    messages.push(userMsg)

    // ── Build AI conversation history ────────────────────────
    const apiKey      = process.env.ANTHROPIC_API_KEY
    let assistantText = ''

    if (apiKey) {
      // Real AI response
      const systemPrompt = buildSystemPrompt(language as LanguageCode, intakeData)

      // Build messages for Anthropic API (using English content for continuity)
      const apiMessages = messages.slice(-20).map(m => ({
        role:    m.role === 'assistant' ? 'assistant' : 'user',
        content: m.contentEn || m.content,
      }))

      const res = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type':       'application/json',
          'x-api-key':          apiKey,
          'anthropic-version':  '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system:     systemPrompt,
          messages:   apiMessages,
        }),
      })

      if (res.ok) {
        const data      = await res.json()
        assistantText = data.content?.[0]?.text?.trim() ?? ''
      } else {
        assistantText = generateDemoResponse(message, language as LanguageCode, intakeData)
      }
    } else {
      // Demo fallback
      assistantText = generateDemoResponse(message, language as LanguageCode, intakeData)
    }

    // Add assistant message
    const assistantMsg: ChatMessage = {
      id:        uuidv4(),
      role:      'assistant',
      content:   assistantText,
      contentEn: assistantText,
      timestamp: new Date().toISOString(),
    }
    messages.push(assistantMsg)

    // Extract any intake data from the conversation
    const updatedIntake = extractIntakeFromMessages(messages, intakeData)

    // Auto-generate session title from first user message
    const title = session_rec.title ?? message.slice(0, 60)

    // Save updated session
    await prisma.chatSession.update({
      where: { id: session_rec.id },
      data: {
        messages:   JSON.stringify(messages),
        intakeData: JSON.stringify(updatedIntake),
        language,
        title,
        updatedAt:  new Date(),
      },
    })

    return NextResponse.json({
      sessionId: session_rec.id,
      message:   assistantMsg,
      intakeData: updatedIntake,
    })
  } catch (err: any) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: err.message ?? 'Chat failed' }, { status: 500 })
  }
}

// ── Start new session (GET welcome message) ──────────────────
export async function GET(req: NextRequest) {
  const language = (req.nextUrl.searchParams.get('language') ?? 'en') as LanguageCode
  const session  = await getServerSession(authOptions)
  const caseId   = req.nextUrl.searchParams.get('caseId')

  const welcome: ChatMessage = {
    id:        uuidv4(),
    role:      'assistant',
    content:   WELCOME_MESSAGES[language] ?? WELCOME_MESSAGES.en,
    contentEn: WELCOME_MESSAGES.en,
    timestamp: new Date().toISOString(),
  }

  // Create session
  const chatSession = await prisma.chatSession.create({
    data: {
      userId:     session?.user?.id ?? null,
      caseId:     caseId ?? null,
      language,
      messages:   JSON.stringify([welcome]),
      intakeData: '{}',
    },
  })

  return NextResponse.json({
    sessionId: chatSession.id,
    message:   welcome,
  })
}
