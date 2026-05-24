import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseId = req.nextUrl.searchParams.get('caseId')
    if (!caseId) {
      return NextResponse.json({ error: 'caseId required' }, { status: 400 })
    }

    // Verify case access
    const c = await prisma.case.findUnique({
      where: { id: caseId },
      select: { userId: true, organizationId: true },
    })
    if (!c) return NextResponse.json([], { status: 200 })

    const ownCase = c.userId === session.user.id
    if (!ownCase) {
      const user = await prisma.user.findUnique({
        where:  { id: session.user.id },
        select: { role: true, organizationId: true },
      })
      const isCorpAdmin =
        user?.role === 'corporate_admin' &&
        user.organizationId === c.organizationId
      if (!isCorpAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const docs = await prisma.document.findMany({
      where:   { caseId },
      orderBy: { uploadedAt: 'desc' },
    })

    return NextResponse.json(docs)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
