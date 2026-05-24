import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { AlertCircle, CheckCircle2, ExternalLink, Bell } from 'lucide-react'

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-50 border-red-200 dark:bg-red-500/5 dark:border-red-500/20',
  high:     'bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20',
  medium:   'bg-blue-50 border-blue-200 dark:bg-blue-500/5 dark:border-blue-500/20',
  low:      'bg-slate-50 border-slate-200 dark:bg-white/[0.02] dark:border-white/[0.05]',
  info:     'bg-violet-50 border-violet-200 dark:bg-violet-500/5 dark:border-violet-500/20',
}

const SEVERITY_ICON_COLOR: Record<string, string> = {
  critical: 'text-red-500',
  high:     'text-amber-500',
  medium:   'text-blue-500',
  low:      'text-slate-400',
  info:     'text-violet-500',
}

export default async function AlertsPage() {
  const session = await getServerSession(authOptions)
  const userCases = await prisma.case.findMany({
    where:  { userId: session?.user?.id ?? '' },
    select: { visaCategory: true },
  })
  const myVisaTypes = userCases.map(c => c.visaCategory)

  const alerts = await prisma.regulatoryAlert.findMany({
    where:   { dismissedAt: null },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take:    50,
  })

  const annotated = alerts.map(alert => {
    const affected: string[] = (() => {
      try { return JSON.parse(alert.affectedVisaTypes as string || '[]') } catch { return [] }
    })()
    const affectsMe = alert.affectsAllCases || affected.some(t => myVisaTypes.includes(t))
    return { ...alert, affected, affectsMe }
  })

  const myAlerts    = annotated.filter(a => a.affectsMe)
  const otherAlerts = annotated.filter(a => !a.affectsMe)

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Regulatory Alerts</h1>
            <p className="text-slate-500 text-sm mt-1">Live USCIS and policy updates affecting your cases</p>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">{alerts.length} active</span>
          </div>
        </div>

        {myAlerts.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
              Affecting Your Cases ({myAlerts.length})
            </h2>
            <div className="space-y-3">
              {myAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} highlighted />
              ))}
            </div>
          </div>
        )}

        {otherAlerts.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
              General Updates ({otherAlerts.length})
            </h2>
            <div className="space-y-3">
              {otherAlerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        )}

        {alerts.length === 0 && (
          <div className="card p-12 flex flex-col items-center text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No active alerts</h3>
            <p className="text-slate-500 text-sm">All regulatory alerts have been addressed or dismissed.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function AlertCard({ alert, highlighted }: { alert: any; highlighted?: boolean }) {
  const style = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.low
  const iconColor = SEVERITY_ICON_COLOR[alert.severity] ?? 'text-slate-400'

  return (
    <div className={`rounded-xl border p-4 ${style}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-slate-900 dark:text-white">{alert.title}</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-white/10 capitalize">
              {alert.severity}
            </span>
            {highlighted && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                Affects your cases
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{alert.summary}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-slate-400">
              {alert.sourceName} · {alert.publishedAt
                ? new Date(alert.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent'}
            </span>
            {alert.sourceUrl && (
              <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:underline">
                Source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {alert.affected?.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {alert.affected.map((v: string) => (
                <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/10">
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
