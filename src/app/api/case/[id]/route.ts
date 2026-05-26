import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const c = await prisma.case.findUnique({
      where: { id: params.id },
      include: {
        checklistItems: { orderBy: { sortOrder: 'asc' } },
        timelineEvents: { orderBy: { eventDate: 'desc' }, take: 5 },
        deadlineEvents: { orderBy: { dueDate: 'asc' } },
        documents:      { orderBy: { uploadedAt: 'desc' } },
      },
    })

    if (!c) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Ownership check
    if (c.userId !== session.user.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, organizationId: true },
      })
      const isAdmin =
        user?.role === 'admin' &&
        user.organizationId !== null &&
        user.organizationId === c.organizationId

      if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json(c)
  } catch (err: any) {
    console.error('Case API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}