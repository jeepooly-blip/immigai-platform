import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ drafts: [] })
  const caseId = req.nextUrl.searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ drafts: [] })
  const c = await prisma.case.findUnique({ where: { id: caseId }, select: { userId: true } })
  if (!c || c.userId !== session.user.id) return NextResponse.json({ drafts: [] })
  const drafts = await prisma.aiDraft.findMany({ where: { caseId }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ drafts })
}
