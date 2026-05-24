import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const QUESTION_BANK: Record<string, Array<{ q: string; tips: string; followUps: string[] }>> = {
  'H-1B': [
    { q: "Describe your job duties and how they require specialized knowledge.", tips: "Be specific about your specialty field and use technical terms relevant to your profession.", followUps: ["How long have you been in this role?", "Does your degree relate directly to your job?"] },
    { q: "How did you find this position with your U.S. employer?", tips: "Explain the recruitment process. Mention professional networks or how you were recruited.", followUps: ["Were other candidates considered?", "Do you have a written offer letter?"] },
    { q: "What is your salary and how was it determined?", tips: "Reference the LCA prevailing wage. Your salary must meet or exceed the prevailing wage.", followUps: ["How does this compare to others in your field?"] },
    { q: "Do you intend to return home after your H-1B expires?", tips: "H-1B is dual-intent. You can express intent to pursue permanent residence.", followUps: ["Do you have family abroad?", "Do you own property in your home country?"] },
    { q: "Tell me about your educational background.", tips: "Focus on your specialty degree. Mention credential evaluations if foreign credentials.", followUps: ["Was your degree evaluated for U.S. equivalency?"] },
  ],
  'F-1': [
    { q: "Why did you choose to study in the United States?", tips: "Emphasize academic reasons. Show home country ties and intent to return.", followUps: ["Why not study in your home country?"] },
    { q: "How will you fund your studies?", tips: "Be specific. Show bank statements, scholarships, sponsor letters.", followUps: ["Who is your financial sponsor?"] },
    { q: "What are your plans after completing your degree?", tips: "Show intent to return home. Mention ties to home country.", followUps: ["Do you have a job lined up at home?"] },
    { q: "How were you accepted to this university?", tips: "Explain the application process and mention your I-20.", followUps: ["Is this a SEVP-certified school?"] },
  ],
  'I-485 AOS': [
    { q: "Have you ever violated the terms of any visa?", tips: "Answer truthfully. If you overstayed, explain and have documentation.", followUps: ["Did you file any extension?"] },
    { q: "Have you ever been arrested or convicted of a crime?", tips: "Disclose everything, even expunged records. Have court records ready.", followUps: ["What was the outcome?"] },
    { q: "Have you traveled outside the U.S. since your last entry?", tips: "List all international travel and confirm advance parole validity.", followUps: ["Did you re-enter on advance parole?"] },
  ],
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { visaType, mode } = await req.json()
  const bank = QUESTION_BANK[visaType] ?? QUESTION_BANK['H-1B']
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ questions: bank })
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514', max_tokens: 2000,
      system: `Generate 6 interview questions for a ${visaType} immigration interview in ${mode} mode. Return ONLY valid JSON: {"questions":[{"q":"text","tips":"coaching tip","followUps":["follow-up"]}]}`,
      messages: [{ role: 'user', content: `Generate 6 realistic ${visaType} interview questions.` }],
    })
    const text = (response.content[0] as any).text.replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim()
    return NextResponse.json(JSON.parse(text))
  } catch { return NextResponse.json({ questions: bank }) }
}
