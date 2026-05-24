import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? 'ImmigAI <noreply@immigai.com>'

interface SendOptions {
  to: string
  subject: string
  html: string
}

async function send({ to, subject, html }: SendOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', to)
    return
  }
  return resend.emails.send({ from: FROM, to, subject, html })
}

export async function sendWelcomeEmail(to: string, name: string) {
  await send({
    to,
    subject: 'Welcome to ImmigAI',
    html: `
      <h1>Welcome, ${name}!</h1>
      <p>Your ImmigAI account is ready. Start by creating your first immigration case.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Go to Dashboard →</a></p>
    `,
  })
}

export async function sendRFEDeadlineAlert(
  to: string,
  name: string,
  caseRef: string,
  daysLeft: number
) {
  await send({
    to,
    subject: `⚠️ RFE Deadline Alert — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`,
    html: `
      <h2>RFE Response Deadline Alert</h2>
      <p>Hi ${name},</p>
      <p>Case <strong>${caseRef}</strong> has an RFE response due in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/cases">View case →</a></p>
    `,
  })
}

export async function sendSubscriptionConfirmation(
  to: string,
  name: string,
  plan: string
) {
  await send({
    to,
    subject: `You're now on the ${plan} plan 🎉`,
    html: `
      <h2>Subscription Activated</h2>
      <p>Hi ${name}, your <strong>${plan}</strong> subscription is now active.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage subscription →</a></p>
    `,
  })
}

export async function sendNewCaseNotification(
  to: string,
  applicantName: string,
  visaCategory: string
) {
  await send({
    to,
    subject: `New case opened — ${applicantName} (${visaCategory})`,
    html: `
      <h2>New Immigration Case</h2>
      <p>A new case has been created for <strong>${applicantName}</strong> — ${visaCategory}.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/cases">View cases →</a></p>
    `,
  })
}
