import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages'

interface AIReviewResult {
  documentType:       string
  extractedFields:    Record<string, string>
  completenessScore:  number
  verificationStatus: 'verified' | 'flagged' | 'pending'
  flags:              string[]
  aiSummary:          string
}

async function runAIReview(
  ocrText: string,
  documentType: string,
  caseContext: { applicantName: string; visaCategory: string }
): Promise<AIReviewResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Fallback: basic heuristic review without AI
    return heuristicReview(ocrText, documentType)
  }

  const prompt = `You are an expert immigration document reviewer. Analyze the following OCR-extracted text from an immigration document.

Document type hint: ${documentType}
Case applicant name: ${caseContext.applicantName}
Visa category: ${caseContext.visaCategory}

OCR Text:
"""
${ocrText.slice(0, 4000)}
"""

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "documentType": "passport|birth_certificate|marriage_certificate|tax_return|bank_statement|employment_letter|degree_certificate|i130|i485|i140|i129|i864|i693|lca|other",
  "extractedFields": {
    "fullName": "",
    "dateOfBirth": "",
    "documentNumber": "",
    "expiryDate": "",
    "issueDate": "",
    "nationality": "",
    "issuingAuthority": "",
    "address": ""
  },
  "completenessScore": 0,
  "verificationStatus": "verified|flagged|pending",
  "flags": [],
  "aiSummary": ""
}

Rules:
- completenessScore: 0-100 based on how many required fields are present and legible
- verificationStatus: "verified" if name matches applicant and document looks genuine, "flagged" if name mismatch or suspicious, "pending" if unclear
- flags: list any issues like "Name mismatch", "Document expired", "Missing signature", "Poor image quality", etc.
- Only include fields that are actually present in the OCR text
- aiSummary: 1-2 sentence plain-English summary`

  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key':    apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages:   [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      console.warn('AI review API error:', res.status)
      return heuristicReview(ocrText, documentType)
    }

    const data    = await res.json()
    const content = data.content?.[0]?.text ?? ''

    // Strip any markdown code fences
    const cleaned = content.replace(/```json|```/g, '').trim()
    const parsed  = JSON.parse(cleaned) as AIReviewResult

    // Name consistency check
    const extractedName = parsed.extractedFields?.fullName ?? ''
    if (extractedName && caseContext.applicantName) {
      const lastName = caseContext.applicantName.split(',')[0].trim().toLowerCase()
      if (!extractedName.toLowerCase().includes(lastName) && parsed.verificationStatus !== 'flagged') {
        parsed.flags  = [...(parsed.flags ?? []), `Name mismatch: document shows "${extractedName}", case has "${caseContext.applicantName}"`]
        parsed.verificationStatus = 'flagged'
      }
    }

    return parsed
  } catch (e) {
    console.warn('AI review parse error:', e)
    return heuristicReview(ocrText, documentType)
  }
}

function heuristicReview(ocrText: string, documentType: string): AIReviewResult {
  const text     = ocrText.toLowerCase()
  const hasText  = ocrText.trim().length > 50
  const flags: string[] = []

  // Detect expiry
  const expiryMatch = ocrText.match(/expir[y|ation|ed]?\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  const dobMatch    = ocrText.match(/(?:dob|date of birth|born)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  const nameMatch   = ocrText.match(/(?:surname|last name|family name)\s*:?\s*([A-Z][A-Z\s]+)/i)
  const numMatch    = ocrText.match(/(?:passport|document|number|no\.?)\s*:?\s*([A-Z0-9]{6,12})/i)

  if (!hasText) flags.push('OCR extracted very little text — poor image quality')
  if (expiryMatch) {
    const expiry = new Date(expiryMatch[1])
    if (!isNaN(expiry.getTime()) && expiry < new Date()) {
      flags.push('Document appears expired')
    }
  }

  const extractedFields: Record<string, string> = {}
  if (nameMatch?.[1])   extractedFields.fullName       = nameMatch[1].trim()
  if (dobMatch?.[1])    extractedFields.dateOfBirth     = dobMatch[1]
  if (expiryMatch?.[1]) extractedFields.expiryDate      = expiryMatch[1]
  if (numMatch?.[1])    extractedFields.documentNumber  = numMatch[1]

  return {
    documentType,
    extractedFields,
    completenessScore: hasText ? (Object.keys(extractedFields).length / 4 * 100) : 20,
    verificationStatus: flags.length > 0 ? 'flagged' : hasText ? 'verified' : 'pending',
    flags,
    aiSummary: hasText
      ? `${documentType.replace('_', ' ')} document processed. ${Object.keys(extractedFields).length} fields extracted.`
      : 'Document uploaded. Limited text could be extracted — consider uploading a higher quality image.',
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body     = await req.json()
    const ocrText  = (body.ocrText as string) ?? ''

    // Fetch document + case context
    const doc = await prisma.document.findUnique({
      where: { id: params.id },
      include: { case: { select: { userId: true, organizationId: true, applicantName: true, visaCategory: true } } },
    })
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Auth check
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, organizationId: true } })
    const isOwner = doc.userId === session.user.id || doc.case.userId === session.user.id
    const isCorpAdmin = user?.role === 'admin' && user.organizationId === doc.case.organizationId
    if (!isOwner && !isCorpAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Run AI review
    const result = await runAIReview(ocrText, doc.documentType, {
      applicantName: doc.case.applicantName,
      visaCategory:  doc.case.visaCategory,
    })

    // Persist results
    const updated = await prisma.document.update({
      where: { id: params.id },
      data: {
        ocrText:            ocrText.slice(0, 10000),
        extractedFields:    JSON.stringify(result.extractedFields),
        aiSummary:          result.aiSummary,
        completenessScore:  Math.round(result.completenessScore),
        verificationStatus: result.verificationStatus,
        flags:              JSON.stringify(result.flags),
        verifiedAt:         result.verificationStatus === 'verified' ? new Date() : null,
        documentType:       result.documentType,
        updatedAt:          new Date(),
      },
    })

    // If expiry date extracted, update document record
    if (result.extractedFields?.expiryDate) {
      const expiry = new Date(result.extractedFields.expiryDate)
      if (!isNaN(expiry.getTime())) {
        await prisma.document.update({
          where: { id: params.id },
          data:  { expiryDate: expiry },
        })
      }
    }

    // Auto-complete linked checklist item if verified
    if (result.verificationStatus === 'verified' && doc.checklistItemId) {
      await prisma.checklistItem.update({
        where: { id: doc.checklistItemId },
        data:  { completed: true },
      }).catch(() => {})
    }

    // Timeline event for flagged documents
    if (result.verificationStatus === 'flagged') {
      await prisma.timelineEvent.create({
        data: {
          caseId:          doc.caseId,
          eventType:       'document',
          title:           'Document Flagged by AI',
          description:     `${doc.originalName}: ${result.flags.join('; ')}`,
          eventDate:       new Date(),
          isAutomated:     true,
          notificationSent: false,
        },
      })
    }

    return NextResponse.json({ success: true, result, document: updated })
  } catch (err: any) {
    console.error('Review error:', err)
    return NextResponse.json({ error: err.message || 'Review failed' }, { status: 500 })
  }
}
