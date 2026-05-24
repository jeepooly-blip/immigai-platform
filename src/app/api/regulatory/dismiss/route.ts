/**
 * POST /api/regulatory/dismiss
 * Body: { id: string }
 * Marks an alert as dismissed so it stops appearing.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  await prisma.regulatoryAlert.update({
    where: { id },
    data:  { dismissedAt: new Date(), updatedAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
