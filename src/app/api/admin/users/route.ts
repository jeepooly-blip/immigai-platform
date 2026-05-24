import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    throw new Error('Admin access required')
  }
  return session
}

export async function GET(req: Request) {
  try {
    const session = await requireAdmin()
    const { searchParams } = new URL(req.url)
    const page  = Number(searchParams.get('page')  ?? 1)
    const limit = Number(searchParams.get('limit') ?? 25)
    const q     = searchParams.get('q') ?? ''

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: q ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name:  { contains: q, mode: 'insensitive' } },
          ],
        } : {},
        select: {
          id: true, email: true, name: true, role: true, isAdmin: true,
          subscriptionStatus: true, planId: true, createdAt: true,
          _count: { select: { cases: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip:   (page - 1) * limit,
        take:   limit,
      }),
      prisma.user.count(),
    ])

    return NextResponse.json({ users, total, page, limit })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireAdmin()
    const { userId, action, data } = await req.json()

    let result: any
    if (action === 'set_role') {
      result = await prisma.user.update({ where: { id: userId }, data: { role: data.role } })
    } else if (action === 'set_admin') {
      result = await prisma.user.update({ where: { id: userId }, data: { isAdmin: data.isAdmin } })
    } else if (action === 'override_subscription') {
      result = await prisma.user.update({
        where: { id: userId },
        data:  { subscriptionStatus: data.status, creditsRemaining: data.credits ?? 0 },
      })
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    await prisma.adminLog.create({
      data: {
        adminUserId:      session.user.id,
        actionType:       `user.${action}`,
        targetResourceId: userId,
        targetType:       'user',
        details:          JSON.stringify(data),
      },
    })

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 403 })
  }
}
