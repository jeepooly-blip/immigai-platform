import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) }

export interface DocumentAnalysis {
  document_type: string
  extracted_fields: Record<string, string>
  verification_issues: string[]
  expiry_date?: string
  confidence: number
}

export async function classifyAndExtractDocument(fileBuffer: Buffer, mimeType: string, fileName: string): Promise<DocumentAnalysis> {
  const anthropic = getAnthropic()
  const base64 = fileBuffer.toString('base64')

  try {
    const content: Anthropic.MessageParam['content'] = mimeType === 'application/pdf'
      ? [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } } as Anthropic.DocumentBlockParam,
          { type: 'text', text: `Analyze this document: ${fileName}` },
        ]
      : [
          { type: 'image', source: { type: 'base64', media_type: mimeType as 'image/jpeg' | 'image/png', data: base64 } },
          { type: 'text', text: `Analyze this document: ${fileName}` },
        ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `Analyze this immigration document and respond ONLY with valid JSON:
{"document_type":"string","extracted_fields":{"full_name":"string","date_of_birth":"string","document_number":"string","issue_date":"string","expiry_date":"string","issuing_country":"string"},"verification_issues":[],"expiry_date":"string or null","confidence":0.9}`,
      messages: [{ role: 'user', content }],
    })

    const text = response.content[0]
    if (text.type !== 'text') throw new Error('Unexpected response')
    return JSON.parse(text.text.replace(/```json\n?|\n?```/g, '').trim()) as DocumentAnalysis
  } catch (err) {
    console.error('Document analysis failed:', err)
    return { document_type: 'unknown', extracted_fields: {}, verification_issues: ['Could not automatically analyze this document. Please verify manually.'], confidence: 0 }
  }
}

export function validateDocumentExpiry(expiryDate: string | null | undefined) {
  if (!expiryDate) return { isExpired: false, expiresWithin90Days: false, daysUntilExpiry: null }
  const diffDays = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return { isExpired: diffDays < 0, expiresWithin90Days: diffDays >= 0 && diffDays <= 90, daysUntilExpiry: diffDays }
}
