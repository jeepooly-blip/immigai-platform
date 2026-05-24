import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { question, answer, visaType } = await req.json()
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ feedback: 'Add ANTHROPIC_API_KEY for AI feedback.', score: 70 })
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514', max_tokens: 400,
    system: `Evaluate a ${visaType} interview answer. Score 0-100. Return ONLY JSON: {"score":number,"feedback":"2-3 sentence coaching feedback"}`,
    messages: [{ role: 'user', content: `Q: "${question}"\nA: "${answer}"` }],
  })
  const text = (response.content[0] as any).text.replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim()
  return NextResponse.json(JSON.parse(text))
}
