import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCheckoutSession, PlanKey } from '@/lib/stripe'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  if (!['pro', 'enterprise'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const url = await createCheckoutSession(
    session.user.id,
    session.user.email,
    plan as PlanKey,
    process.env.NEXT_PUBLIC_APP_URL!
  )
  return NextResponse.json({ url })
}
