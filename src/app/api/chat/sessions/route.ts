import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ sessions: [] })

  const sessions = await prisma.chatSession.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 30,
    select: {
      id: true, title: true, language: true,
      createdAt: true, updatedAt: true, resolved: true,
      messages: false, intakeData: false,
    },
  })

  return NextResponse.json({ sessions })
}
