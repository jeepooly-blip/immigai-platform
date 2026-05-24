import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await prisma.form.findUnique({
    where: { id: params.id },
    include: {
      case: { select: { id: true, userId: true, organizationId: true, applicantName: true, visaCategory: true, caseType: true } },
    },
  })

  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Auth
  const ownForm = form.userId === session.user.id
  const ownCase = form.case.userId === session.user.id
  if (!ownForm && !ownCase) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, organizationId: true } })
    if (user?.role !== 'corporate_admin' || user.organizationId !== form.case.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  return NextResponse.json({ form })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { fieldData, currentSection } = body

  const form = await prisma.form.findUnique({ where: { id: params.id }, select: { userId: true, caseId: true } })
  if (!form || form.userId !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.form.update({
    where: { id: params.id },
    data: {
      fieldData:     JSON.stringify(fieldData),
      currentSection,
      lastSavedAt:   new Date(),
    },
  })

  return NextResponse.json({ form: updated })
}
