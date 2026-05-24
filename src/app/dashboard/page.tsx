import { getServerSession } from 'next-auth'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { getCasesForUser } from '@/lib/actions/cases'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { CaseCard } from '@/components/cases/CaseCard'
import { Button } from '@/components/ui/button'
import {
  FolderOpen, CheckCircle2, Clock, TrendingUp,
  Plus, AlertCircle, Brain, ArrowRight, Shield
} from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const cases   = await getCasesForUser()

  const firstName = session?.user?.name?.split(' ')[0] ?? 'there'

  const activeCases   = cases.filter((c: any) => c.status === 'active').length
  const approvedCount = cases.filter((c: any) => c.status === 'approved').length
  const rfeCount      = cases.filter((c: any) => c.status === 'rfe_received').length
  const avgApproval   = cases.length
    ? Math.round(cases.reduce((s: number, c: any) => s + c.approvalProbabilityScore, 0) / cases.length)
    : 0

  // Fetch live regulatory alerts — top 4, not dismissed
  const userVisaTypes = cases.map((c: any) => c.visaCategory)
  const liveAlerts = await prisma.regulatoryAlert.findMany({
    where:   { dismissedAt: null },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take:    4,
  })

  // Annotate each alert with whether it affects the user's cases
  const annotatedAlerts = liveAlerts.map(alert => {
    const affectedTypes: string[] = (() => {
      const raw = alert.affectedVisaTypes
      if (Array.isArray(raw)) return raw
      try { return JSON.parse(raw as string || '[]') } catch { return [] }
    })()
    const affectsUser = alert.affectsAllCases || affectedTypes.some(t => userVisaTypes.includes(t))
    return { ...alert, affectsUser, affectedTypes }
  })

  // Use live alerts if available, fall back to static hints
  const hasLiveAlerts = annotatedAlerts.length > 0

  const STATIC_ALERTS = [
    { msg: 'Garcia RFE response due in 5 days — draft available for review', color: 'text-amber-600 dark:text-amber-400', severity: 'high'   },
    { msg: 'USCIS processing times updated for EB-1A — avg now 8.2 months',  color: 'text-brand-600 dark:text-brand-400',  severity: 'medium' },
    { msg: 'Hassan H-1B extension deadline in 12 days — action required',    color: 'text-rose-600 dark:text-rose-400',    severity: 'high'   },
  ]

  const severityColor: Record<string, string> = {
    critical: 'text-rose-600 dark:text-rose-400',
    high:     'text-amber-600 dark:text-amber-400',
    medium:   'text-brand-600 dark:text-brand-400',
    low:      'text-slate-500',
    info:     'text-violet-600 dark:text-violet-400',
  }

  const urgentFirst = [...cases].sort((a, b) => {
    const rank: Record<string, number> = { rfe_received: 0, active: 1, submitted: 2, approved: 3, denied: 4 }
    return (rank[a.status] ?? 5) - (rank[b.status] ?? 5)
  })

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white">
              Good morning, {firstName} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {rfeCount > 0 && ` · ${rfeCount} RFE${rfeCount > 1 ? 's' : ''} need attention`}
            </p>
          </div>
          <Link href="/case/create">
            <Button className="flex items-center gap-2 whitespace-nowrap">
              <Plus className="w-4 h-4" /> New Case
            </Button>
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { label: 'Active Cases',  value: String(activeCases),   icon: FolderOpen,   color: 'text-brand-600 dark:text-brand-400',    bg: 'bg-brand-50 dark:bg-brand-500/10'    },
            { label: 'Approved',      value: String(approvedCount), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'RFE Pending',   value: String(rfeCount),      icon: Clock,        color: rfeCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400', bg: rfeCount > 0 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-slate-100 dark:bg-white/[0.04]' },
            { label: 'Avg. Approval', value: `${avgApproval}%`,     icon: TrendingUp,   color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-500/10'  },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-slate-500 text-xs sm:text-sm leading-tight">{s.label}</span>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.color}`} />
                  </div>
                </div>
                <div className={`font-display font-bold text-2xl sm:text-3xl ${s.color} mb-0.5`}>{s.value}</div>
                <div className="text-slate-400 text-xs">updated live</div>
              </div>
            )
          })}
        </div>

        {/* Cases + Insights */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 dark:text-white">Your Cases</h2>
              <Link href="/cases" className="text-brand-600 dark:text-brand-400 text-xs flex items-center gap-1 hover:text-brand-500 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {cases.length === 0 ? (
              <div className="card p-8 sm:p-12 flex flex-col items-center text-center">
                <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="text-slate-900 dark:text-white font-semibold mb-1">No cases yet</h3>
                <p className="text-slate-500 text-sm mb-5 max-w-xs">
                  Create your first immigration case to get started.
                </p>
                <Link href="/case/create">
                  <Button><Plus className="w-4 h-4" /> Create First Case</Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {urgentFirst.slice(0, 4).map((c: any) => (
                  <CaseCard key={c.id} caseData={c} />
                ))}
              </div>
            )}

            {cases.length > 4 && (
              <div className="mt-4 text-center">
                <Link href="/cases">
                  <Button variant="outline" size="sm">
                    View {cases.length - 4} more cases
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="space-y-4">

            {/* Regulatory Alerts — live from DB */}
            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Regulatory Alerts</h3>
                </div>
                <Link href="/compliance" className="text-brand-600 dark:text-brand-400 text-xs flex items-center gap-1 hover:text-brand-500 transition-colors">
                  All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {hasLiveAlerts ? (
                  annotatedAlerts.map(alert => (
                    <div key={alert.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03] ${
                        alert.affectsUser
                          ? 'border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/[0.03]'
                          : 'border-slate-200 dark:border-white/[0.05] bg-slate-50 dark:bg-white/[0.02]'
                      }`}>
                      <AlertCircle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${severityColor[alert.severity] ?? 'text-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-medium truncate">
                          {alert.title}
                        </p>
                        <p className="text-slate-500 text-[10px] mt-0.5 line-clamp-2">{alert.summary}</p>
                        {alert.affectsUser && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            ↑ Affects your cases
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  STATIC_ALERTS.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05]">
                      <AlertCircle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${a.color}`} />
                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{a.msg}</p>
                    </div>
                  ))
                )}
              </div>

              {!hasLiveAlerts && (
                <Link href="/compliance" className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors pt-2 border-t border-slate-200 dark:border-white/[0.05]">
                  <Brain className="w-3 h-3" /> Fetch live regulatory updates
                </Link>
              )}
            </div>

            {/* Quick Actions */}
            <div className="card p-4 sm:p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Quick Actions</h3>
              <div className="space-y-1.5">
                {[
                  { label: 'Open new case',      href: '/case/create' },
                  { label: 'Upload document',    href: '/documents'   },
                  { label: 'Ask AI assistant',   href: '/assistant'   },
                  { label: 'View compliance',    href: '/compliance'  },
                ].map(action => (
                  <Link key={action.href} href={action.href}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors group">
                    <span className="text-slate-600 dark:text-slate-400 text-xs group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
