import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }  from 'next-auth'
import { authOptions }       from '@/lib/auth'
import { prisma }            from '@/lib/prisma'
import { parseRfeGrounds, extractRfeMetadata, calculateConfidenceScore, generateDemoDraft, buildRfeDraftPrompt } from '@/lib/rfeEngine'

async function requireCaseAccess(caseId: string, userId: string) {
  const c = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true, userId: true, organizationId: true, applicantName: true, petitionerName: true, visaCategory: true, caseType: true } })
  if (!c) throw new Error('Case not found')
  if (c.userId === userId) return c
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, organizationId: true } })
  if (u?.role === 'corporate_admin' && u.organizationId === c.organizationId) return c
  throw new Error('Unauthorized')
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { caseId, rfeText, draftType = 'rfe_response' } = await req.json()
    if (!caseId || !rfeText) return NextResponse.json({ error: 'caseId and rfeText required' }, { status: 400 })
    const caseData = await requireCaseAccess(caseId, session.user.id)
    const grounds  = parseRfeGrounds(rfeText)
    const metadata = extractRfeMetadata(rfeText)
    const apiKey   = process.env.ANTHROPIC_API_KEY
    let content = '', aiUsed = false
    if (apiKey) {
      try {
        const { system, user } = buildRfeDraftPrompt(draftType, rfeText, grounds, { applicantName: caseData.applicantName, petitionerName: caseData.petitionerName, visaCategory: caseData.visaCategory, caseType: caseData.caseType, receiptNumber: metadata.receiptNumber, deadlineText: metadata.deadlineText })
        const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, system, messages: [{ role: 'user', content: user }] }) })
        if (res.ok) { const data = await res.json(); content = data.content?.[0]?.text?.trim() ?? ''; aiUsed = true }
      } catch (e) { console.warn('AI failed, using demo', e) }
    }
    if (!content) content = generateDemoDraft(draftType, grounds, { applicantName: caseData.applicantName, petitionerName: caseData.petitionerName, visaCategory: caseData.visaCategory, receiptNumber: metadata.receiptNumber })
    const confidence = calculateConfidenceScore(grounds, rfeText.length, aiUsed)
    const draft = await prisma.aiDraft.create({
      data: {
        caseId, userId: session.user.id,
        draftType,
        title: `${draftType === 'rfe_response' ? 'RFE Response' : draftType.replace(/_/g,' ').replace(/\b\w/g,(ch:string)=>ch.toUpperCase())} — ${caseData.applicantName}`,
        rfeText, rfeGrounds: JSON.stringify(grounds),
        content, contentSections: JSON.stringify([]),
        confidenceScore: confidence, status: 'draft',
      },
    })
    await prisma.timelineEvent.create({ data: { caseId, eventType: 'rfe', title: `AI Draft Generated: ${draft.title}`, description: `AI generated a ${draftType.replace(/_/g,' ')} addressing ${grounds.length} ground${grounds.length !== 1 ? 's' : ''}. Confidence: ${confidence}%. Review required.`, eventDate: new Date(), isAutomated: true, notificationSent: false } })
    await prisma.case.update({ where: { id: caseId }, data: { status: 'rfe_received', updatedAt: new Date() } })
    return NextResponse.json({ draft, grounds, metadata, confidence })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Analysis failed' }, { status: 500 })
  }
}
