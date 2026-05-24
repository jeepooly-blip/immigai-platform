import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getFormSchema, calculateCompletion } from '@/lib/form-schemas'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const caseId = req.nextUrl.searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ error: 'caseId required' }, { status: 400 })

  const forms = await prisma.form.findMany({
    where: { caseId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ forms })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { caseId, formType } = await req.json()
  if (!caseId || !formType) return NextResponse.json({ error: 'caseId and formType required' }, { status: 400 })

  const existing = await prisma.form.findFirst({ where: { caseId, formType } })
  if (existing) return NextResponse.json({ form: existing })

  const schema = getFormSchema(formType)
  if (!schema) return NextResponse.json({ error: 'Unknown form type' }, { status: 400 })

  const form = await prisma.form.create({
    data: {
      caseId, formType,
      userId:   session.user.id,
      fieldData: '{}',
    },
  })

  return NextResponse.json({ form })
}
