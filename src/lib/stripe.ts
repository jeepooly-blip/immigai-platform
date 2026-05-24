import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PLANS = {
  pro: {
    name: 'Professional',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    price: 79,
    credits: 500,
    features: [
      'Unlimited cases',
      '500 AI credits/month',
      'RFE response drafting',
      'Document OCR & analysis',
      'Regulatory alerts',
      'Multi-language assistant',
      'Form auto-fill (I-129, I-130, I-140, I-485)',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    price: 299,
    credits: -1, // unlimited
    features: [
      'Everything in Professional',
      'Unlimited AI credits',
      'Multi-attorney organizations',
      'Client portal access',
      'Admin audit logs',
      'Interview prep module',
      'HR immigration module',
      'Priority support',
      'Custom integrations',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  plan: PlanKey,
  returnUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${returnUrl}/settings?success=true`,
    cancel_url:  `${returnUrl}/settings?canceled=true`,
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
  })
  return session.url!
}

export async function createPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer:   stripeCustomerId,
    return_url: `${returnUrl}/settings`,
  })
  return session.url
}
