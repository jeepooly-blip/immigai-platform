import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'

async function requireDraftAccess(id: string, userId: string) {
  const d = await prisma.aiDraft.findUnique({ where: { id }, include: { case: { select: { userId: true, organizationId: true } } } })
  if (!d) return null
  if (d.userId === userId || d.case.userId === userId) return d
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, organizationId: true } })
  if (u?.role === 'corporate_admin' && u.organizationId === d.case.organizationId) return d
  return null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const draft = await requireDraftAccess(params.id, session.user.id)
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ draft })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const draft = await requireDraftAccess(params.id, session.user.id)
  if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = await prisma.aiDraft.update({
    where: { id: params.id },
    data: {
      ...(body.userEdits     !== undefined && { userEdits:      body.userEdits      }),
      ...(body.reviewNotes   !== undefined && { reviewNotes:    body.reviewNotes    }),
      ...(body.status        !== undefined && { status:         body.status         }),
      ...(body.reviewedByUser !== undefined && { reviewedByUser: body.reviewedByUser }),
      updatedAt: new Date(),
    },
  })
  return NextResponse.json({ draft: updated })
}
