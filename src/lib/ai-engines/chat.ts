import Anthropic from '@anthropic-ai/sdk'
import { ChatMessage } from '../types'

function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) }

const SYSTEM_PROMPT = `You are Visa Guide AI, an immigration assistant. You provide INFORMATION and GUIDANCE only — never legal advice. Always recommend consulting a licensed immigration attorney for complex situations. Never guarantee outcomes. Respond in the user's language if they write in a non-English language.`

export async function streamChatResponse(messages: ChatMessage[], caseContext?: string, language?: string): Promise<ReadableStream<Uint8Array>> {
  const anthropic = getAnthropic()
  const system = (caseContext ? `${SYSTEM_PROMPT}\n\nCASE CONTEXT:\n${caseContext}` : SYSTEM_PROMPT)
    + (language && language !== 'en' ? `\n\nRespond in language: ${language}` : '')

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system,
    messages: messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  })

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      } catch (err) { controller.error(err) }
    },
  })
}

export async function generateDraft(draftType: string, caseContext: string, userInstructions?: string) {
  const anthropic = getAnthropic()
  const prompts: Record<string, string> = {
    cover_letter: 'Write a professional cover letter for this immigration case.',
    personal_statement: 'Write a compelling personal statement for this immigration case.',
    support_letter: 'Write a support letter from the employer/sponsor.',
    rfe_response: 'Draft a response to the Request for Evidence (RFE). Address each point with evidence.',
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `You are an immigration attorney drafting documents. ${prompts[draftType] ?? 'Write a professional immigration document.'} Start with "DRAFT - Please review with your attorney before submission". Use [PLACEHOLDER] for missing info.`,
    messages: [{ role: 'user', content: `Case Context:\n${caseContext}\n\n${userInstructions ? `Instructions: ${userInstructions}` : ''}` }],
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')
  const placeholderCount = (content.text.match(/\[PLACEHOLDER\]/g) || []).length
  return { content: content.text, confidence_score: Math.max(0.4, 1 - placeholderCount * 0.1) }
}
