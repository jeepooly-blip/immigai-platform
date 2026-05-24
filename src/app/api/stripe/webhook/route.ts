import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendSubscriptionConfirmation } from '@/lib/email'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('[stripe/webhook] Invalid signature:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId  = session.metadata?.userId
      const plan    = session.metadata?.plan
      if (!userId) break

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId:   session.customer as string,
          subscriptionStatus: 'active',
          subscriptionId:     session.subscription as string,
          planId:             plan ?? undefined,
          creditsRemaining:   plan === 'enterprise' ? 99999 : 500,
        },
      })

      await sendSubscriptionConfirmation(user.email, user.name ?? 'Valued Client', plan ?? 'Pro')

      await prisma.payment.create({
        data: {
          userId,
          amount:   session.amount_total ?? 0,
          currency: session.currency ?? 'usd',
          status:   'succeeded',
          stripePaymentIntentId: session.payment_intent as string | undefined,
          description: `${plan} plan subscription`,
        },
      })
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data:  { subscriptionStatus: 'active' },
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data:  { subscriptionStatus: 'past_due' },
      })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await prisma.user.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data:  { subscriptionStatus: 'canceled', creditsRemaining: 0, planId: null },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
