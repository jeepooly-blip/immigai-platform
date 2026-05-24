'use client'
import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  Shield, AlertTriangle, CheckCircle2, Clock, Bell, Globe,
  Brain, ExternalLink, RefreshCw, X, ChevronRight, Loader2
} from 'lucide-react'

interface RegulatoryAlert {
  id:               string
  alertType:        string
  severity:         string
  title:            string
  summary:          string
  sourceUrl:        string | null
  sourceName:       string
  affectedVisaTypes: string[]
  affectsAllCases:  boolean
  affectedCaseCount: number
  affectsUserCases: boolean
  publishedAt:      string | null
  createdAt:        string
}

const DEADLINES = [
  { case: 'Hassan, Omar — H-1B Ext.', deadline: 'Mar 29', daysLeft: 11, type: 'Filing',      priority: 'critical' },
  { case: 'Garcia, Ana — EB-2 RFE',   deadline: 'Apr 5',  daysLeft: 18, type: 'RFE Response',priority: 'high'     },
  { case: 'Zhang, Wei — I-94 Renewal',deadline: 'Apr 10', daysLeft: 23, type: 'Status',       priority: 'medium'   },
  { case: 'Dubois, Marc — H-1B Cap',  deadline: 'Apr 15', daysLeft: 28, type: 'Filing',       priority: 'medium'   },
  { case: 'Kim, Ji-Yeon — O-1 Renew', deadline: 'May 2',  daysLeft: 45, type: 'Renewal',      priority: 'low'      },
]

const CHECKS = [
  { category: 'H-1B Wage Level Compliance',   status: 'compliant', score: 100 },
  { category: 'EB-5 Investor Visas',           status: 'compliant', score: 98  },
  { category: 'Public Access Files',           status: 'compliant', score: 95  },
  { category: 'LCA Posting Requirements',      status: 'compliant', score: 97  },
  { category: 'I-9 E-Verify Records',          status: 'warning',   score: 82  },
  { category: 'Document Retention Policy',     status: 'warning',   score: 78  },
]

const severityStyle: Record<string, string> = {
  critical: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/25',
  high:     'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25',
  medium:   'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/25',
  low:      'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
  info:     'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
}

const severityDot: Record<string, string> = {
  critical: 'bg-rose-500',
  high:     'bg-amber-500',
  medium:   'bg-blue-500',
  low:      'bg-slate-400',
  info:     'bg-violet-500',
}

const deadlinePriority: Record<string, string> = {
  critical: 'text-rose-600 dark:text-rose-400',
  high:     'text-amber-600 dark:text-amber-400',
  medium:   'text-brand-600 dark:text-brand-400',
  low:      'text-slate-400',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Recently'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function CompliancePage() {
  const [alerts, setAlerts]         = useState<RegulatoryAlert[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]           = useState('')

  const loadAlerts = useCallback(async () => {
    try {
      const res  = await fetch('/api/regulatory?limit=20')
      const data = await res.json()
      setAlerts(data.alerts ?? [])
    } catch {
      setError('Could not load regulatory alerts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAlerts() }, [loadAlerts])

  async function handleRefresh() {
    setRefreshing(true)
    setError('')
    try {
      // Trigger a fresh fetch from RSS feeds
      await fetch('/api/regulatory/fetch', { method: 'POST' })
      await loadAlerts()
    } catch {
      setError('Refresh failed. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleDismiss(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
    await fetch('/api/regulatory/dismiss', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length
  const userCaseAlerts = alerts.filter(a => a.affectsUserCases)

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white">
              Compliance & Regulatory Monitor
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Live USCIS &amp; Federal Register monitoring — AI-analyzed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-2 text-sm">
              {refreshing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />}
              {refreshing ? 'Fetching…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Critical banner */}
        {criticalCount > 0 && (
          <div className="card border-amber-300 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/[0.03] p-4 mb-4 sm:mb-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-slate-900 dark:text-white text-sm font-semibold mb-0.5">
                {criticalCount} High-Priority Alert{criticalCount > 1 ? 's' : ''} Require Attention
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                {userCaseAlerts.length > 0
                  ? `${userCaseAlerts.length} alert${userCaseAlerts.length > 1 ? 's' : ''} may affect your active cases`
                  : 'Review the alerts below for regulatory updates'}
              </p>
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {[
            { label: 'Compliance Score', value: '96%',             icon: Shield,       color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            { label: 'Active Alerts',    value: String(alerts.length), icon: Bell,     color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-500/10'   },
            { label: 'Affect My Cases',  value: String(userCaseAlerts.length), icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
            { label: 'Sources Tracked',  value: '3',                icon: Globe,        color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-slate-500 text-xs leading-tight">{s.label}</span>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${s.color}`} />
                  </div>
                </div>
                <div className={`font-display font-bold text-2xl sm:text-3xl ${s.color}`}>{s.value}</div>
              </div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Regulatory alerts */}
          <div className="lg:col-span-2 card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Regulatory Alerts</h3>
              </div>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI monitoring active
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading regulatory alerts…</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center gap-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <div>
                  <p className="text-slate-900 dark:text-white font-medium text-sm">All clear</p>
                  <p className="text-slate-500 text-xs mt-1">
                    No active regulatory alerts. Click Refresh to fetch the latest updates.
                  </p>
                </div>
                <button onClick={handleRefresh} className="btn-primary text-xs flex items-center gap-1.5 mt-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Fetch Latest Alerts
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map(alert => (
                  <div key={alert.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      alert.affectsUserCases
                        ? 'bg-amber-50/50 dark:bg-white/[0.03] border-amber-200 dark:border-amber-500/20'
                        : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06]'
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${severityDot[alert.severity] ?? 'bg-slate-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                          <span className="text-slate-900 dark:text-white text-sm font-medium leading-snug">
                            {alert.title}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {alert.affectedCaseCount > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20">
                                {alert.affectedCaseCount} case{alert.affectedCaseCount > 1 ? 's' : ''}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${severityStyle[alert.severity] ?? ''}`}>
                              {alert.severity}
                            </span>
                            <button
                              onClick={() => handleDismiss(alert.id)}
                              className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-colors"
                              title="Dismiss alert">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed mb-2">
                          {alert.summary}
                        </p>
                        {alert.affectedVisaTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {alert.affectedVisaTypes.slice(0, 4).map(v => (
                              <span key={v} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-500">
                                {v}
                              </span>
                            ))}
                            {alert.affectedVisaTypes.length > 4 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-500">
                                +{alert.affectedVisaTypes.length - 4} more
                              </span>
                            )}
                            {alert.affectsAllCases && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                All visa types
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span>{timeAgo(alert.publishedAt ?? alert.createdAt)}</span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" /> {alert.sourceName}
                            </span>
                          </div>
                          {alert.sourceUrl && (
                            <a
                              href={alert.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1 hover:text-brand-500 transition-colors">
                              Source <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4 sm:space-y-6">

            {/* Deadlines */}
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Upcoming Deadlines</h3>
              </div>
              <div className="space-y-2.5">
                {DEADLINES.map(d => (
                  <div key={d.case} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
                    <div className="flex-1 min-w-0">
                      <div className="text-slate-900 dark:text-white text-xs font-medium truncate">{d.case}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">{d.type}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-xs font-bold ${deadlinePriority[d.priority]}`}>{d.daysLeft}d</div>
                      <div className="text-slate-400 text-[10px]">{d.deadline}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance checks */}
            <div className="card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Compliance Checks</h3>
              </div>
              <div className="space-y-3">
                {CHECKS.map(c => (
                  <div key={c.category} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.status === 'compliant' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{c.category}</span>
                        <span className={`text-xs font-medium ml-2 flex-shrink-0 ${c.score >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {c.score}%
                        </span>
                      </div>
                      <div className="h-1 bg-slate-200 dark:bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${c.score >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${c.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
