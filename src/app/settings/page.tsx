'use client'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { CreditCard, Check, Loader2, User, Globe, Bell } from 'lucide-react'

const PLANS = [
  {
    key: 'pro', name: 'Professional', price: 79,
    features: ['Unlimited cases','500 AI credits/month','RFE drafting','Document OCR','Regulatory alerts','5-language assistant','Form auto-fill'],
  },
  {
    key: 'enterprise', name: 'Enterprise', price: 299,
    features: ['Everything in Pro','Unlimited AI credits','Multi-attorney orgs','Client portal','Admin audit logs','Interview prep','HR module','Priority support'],
  },
]

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [billingLoading, setBillingLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading]   = useState(false)
  const [tab, setTab] = useState<'account' | 'billing' | 'notifications'>('account')

  const subStatus   = (session?.user as any)?.subscriptionStatus ?? 'inactive'
  const isPro       = ['active', 'trialing'].includes(subStatus)
  const credits     = (session?.user as any)?.creditsRemaining ?? 0

  async function checkout(plan: string) {
    setBillingLoading(plan)
    const res  = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setBillingLoading(null)
  }

  async function portal() {
    setPortalLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    setPortalLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your account and subscription</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/[0.04] rounded-xl">
          {([['account', User, 'Account'], ['billing', CreditCard, 'Billing'], ['notifications', Bell, 'Notifications']] as const).map(([key, Icon, label]) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === key ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {tab === 'account' && (
          <div className="card p-6 space-y-5">
            <h2 className="font-semibold text-slate-900 dark:text-white">Account Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Full Name</label>
                <input className="input w-full" defaultValue={session?.user?.name ?? ''} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Email</label>
                <input className="input w-full" defaultValue={session?.user?.email ?? ''} disabled />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Role</label>
                <input className="input w-full" value={(session?.user as any)?.role ?? 'attorney'} disabled />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">Language Preference</label>
                <select className="input w-full">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="ar">العربية</option>
                  <option value="hi">हिंदी</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
            <Button>Save Changes</Button>
          </div>
        )}

        {tab === 'billing' && (
          <div className="space-y-5" id="billing">
            {isPro && (
              <div className="card p-5 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm">Active Subscription</span>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {credits > 9000 ? 'Unlimited' : credits.toLocaleString()} AI credits remaining this month
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={portal} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Manage Billing'}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {PLANS.map(plan => (
                <div key={plan.key} className={`card p-5 flex flex-col ${plan.key === 'enterprise' ? 'border-brand-300 dark:border-brand-500/30 bg-brand-50/30 dark:bg-brand-500/5' : ''}`}>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{plan.name}</span>
                      {plan.key === 'enterprise' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 font-medium">Popular</span>
                      )}
                    </div>
                    <span className="font-display font-bold text-2xl text-slate-900 dark:text-white">${plan.price}</span>
                    <span className="text-slate-400 text-xs">/month</span>
                  </div>
                  <ul className="space-y-1.5 flex-1 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.key === 'enterprise' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => checkout(plan.key)}
                    disabled={billingLoading === plan.key || isPro}
                    className="w-full"
                  >
                    {billingLoading === plan.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : isPro ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">Notification Preferences</h2>
            {[
              ['RFE deadline reminders', 'Email when RFE response is due in 14, 7, and 2 days'],
              ['Regulatory alerts', 'Email when new USCIS alerts affect your cases'],
              ['Case status updates', 'Email when case status changes'],
              ['Document expiration', 'Email when client documents are expiring within 60 days'],
              ['Weekly digest', 'Weekly summary of all case activity'],
            ].map(([label, desc]) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-white/[0.04] last:border-0">
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
                </div>
                <button className="w-10 h-5 rounded-full bg-brand-500 relative transition-colors flex-shrink-0">
                  <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" />
                </button>
              </div>
            ))}
            <Button>Save Preferences</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
