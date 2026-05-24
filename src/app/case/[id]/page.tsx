import { notFound } from 'next/navigation'
import Link from 'next/link'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getCaseById } from '@/lib/actions/cases'
import { CaseStatusBadge } from '@/components/cases/CaseStatusBadge'
import { ApprovalMeter } from '@/components/cases/ApprovalMeter'
import { TimelinePreview } from '@/components/cases/TimelinePreview'
import { ChecklistPanel } from '@/components/cases/ChecklistPanel'
import { DeadlinePanel } from '@/components/cases/DeadlinePanel'
import { UpdateStageForm } from '@/components/cases/UpdateStageForm'
import { AddEventForm } from '@/components/cases/AddEventForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft, User, Building2, Calendar, Clock, FileText, Brain, FolderOpen,
  Shield, CheckSquare, Activity, Sparkles, AlertTriangle, CheckCircle2,
  Heart, Briefcase, DollarSign, GraduationCap
} from 'lucide-react'
import { CASE_TYPE_COLORS, CASE_TYPE_ICONS, CASE_STAGES } from '@/types'
import { cn } from '@/lib/utils'

function stageProgress(stage: string): number {
  const idx = CASE_STAGES.indexOf(stage as typeof CASE_STAGES[number])
  return idx === -1 ? 8 : Math.round(((idx + 1) / CASE_STAGES.length) * 100)
}

function fmtDate(d: Date | null) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(d))
}
function fmtShort(d: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

function RequiredActions({ caseData }: { caseData: any }) {
  const overdue = caseData.deadlineEvents.filter((d: any) => !d.completed && new Date(d.dueDate) < new Date())
  const soon    = caseData.deadlineEvents.filter((d: any) => !d.completed && new Date(d.dueDate) >= new Date() && ((new Date(d.dueDate).getTime() - Date.now()) / 86400000) <= 14)
  const incomplete = caseData.checklistItems.filter((i: any) => i.required && !i.completed)

  const actions = [
    ...overdue.map((d: any) => ({ severity: 'critical' as const, text: `OVERDUE: ${d.title}`, sub: `Due ${fmtShort(d.dueDate)}` })),
    ...soon.map((d: any)    => ({ severity: 'high' as const,     text: `Due soon: ${d.title}`, sub: `${Math.ceil((new Date(d.dueDate).getTime()-Date.now())/86400000)} days` })),
    ...(caseData.status === 'rfe_received' ? [{ severity: 'critical' as const, text: 'RFE response required', sub: 'Review AI draft and submit' }] : []),
    ...incomplete.slice(0, 3).map((i: any) => ({ severity: 'low' as const, text: `Pending: ${i.itemLabel}`, sub: i.formCode ? `Form ${i.formCode}` : 'Document required' })),
  ].slice(0, 5)

  if (actions.length === 0) return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <p className="text-emerald-400 text-sm font-medium">No required actions — case is on track</p>
    </div>
  )

  return (
    <div className="space-y-2">
      {actions.map((a, i) => (
        <div key={i} className={cn(
          'flex items-start gap-3 p-3 rounded-xl border',
          a.severity === 'critical' ? 'border-rose-500/30 bg-rose-500/[0.05]'
          : a.severity === 'high'   ? 'border-amber-500/25 bg-amber-500/[0.04]'
          :                           'border-white/[0.06] bg-white/[0.02]'
        )}>
          <AlertTriangle className={cn(
            'w-4 h-4 flex-shrink-0 mt-0.5',
            a.severity === 'critical' ? 'text-rose-400' : a.severity === 'high' ? 'text-amber-400' : 'text-slate-600'
          )} />
          <div>
            <p className={cn('text-sm font-medium', a.severity === 'critical' ? 'text-rose-300' : a.severity === 'high' ? 'text-amber-300' : 'text-slate-300')}>{a.text}</p>
            <p className="text-xs text-slate-600 mt-0.5">{a.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function CasePage({ params }: { params: { id: string } }) {
  const caseData = await getCaseById(params.id)
  if (!caseData) notFound()

  const total      = caseData.checklistItems.length
  const done       = caseData.checklistItems.filter((i: any) => i.completed).length
  const checkPct   = total === 0 ? 0 : Math.round((done / total) * 100)
  const stagePct   = stageProgress(caseData.currentStage)
  const isRfe      = caseData.status === 'rfe_received'
  const typeColor  = CASE_TYPE_COLORS[caseData.caseType] ?? CASE_TYPE_COLORS.employment
  const typeEmoji  = CASE_TYPE_ICONS[caseData.caseType]  ?? '📁'

  // Upcoming deadlines (next 30 days, not complete)
  const upcomingDeadlines = caseData.deadlineEvents
    .filter((d: any) => !d.completed)
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  // Checklist by category
  const byCategory = ['form', 'document', 'action', 'fee'].reduce((acc: Record<string, any[]>, cat) => {
    acc[cat] = caseData.checklistItems.filter((i: any) => i.category === cat)
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div className="max-w-[1340px] mx-auto">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-start gap-4">
            <Link href="/cases"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <CaseStatusBadge status={caseData.status} />
                <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', typeColor)}>
                  {typeEmoji} {caseData.caseType}
                </span>
                <Badge variant="purple">{caseData.visaCategory}</Badge>
                <span className="text-slate-700 text-xs font-mono">#{caseData.id.slice(0,8).toUpperCase()}</span>
              </div>
              <h1 className="font-display font-bold text-2xl text-white">{caseData.applicantName}</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {caseData.currentStage}
                {caseData.petitionerName && ` · ${caseData.petitionerName}`}
                {caseData.estimatedProcessingTime && ` · ~${caseData.estimatedProcessingTime}mo processing`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/case/${caseData.id}/documents`}>
              <Button variant="outline" size="sm"><FolderOpen className="w-4 h-4" /> Documents ({(caseData as any).documents?.length ?? 0})</Button>
            </Link>
            <Link href={`/case/${caseData.id}/documents`}>
            <Button variant="outline" size="sm"><FolderOpen className="w-4 h-4" /> Documents</Button>
          </Link>
            <Link href={`/case/${caseData.id}/rfe`}>
              <Button variant="outline" size="sm"><AlertTriangle className="w-4 h-4" /> RFE</Button>
            </Link>
            <Link href={`/case/${caseData.id}/forms`}>
              <Button variant="outline" size="sm"><FileText className="w-4 h-4" /> Forms</Button>
            </Link>
            <Button size="sm"><Sparkles className="w-4 h-4" /> AI Assist</Button>
          </div>
        </div>

        {/* ── RFE banner ───────────────────────────────────────────── */}
        {isRfe && (
          <div className="card border-rose-500/30 bg-rose-500/[0.04] p-4 mb-6 flex items-center gap-3">
            <Shield className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-rose-400 text-sm font-semibold">Request for Evidence — Immediate Action Required</p>
              <p className="text-slate-400 text-xs mt-0.5">USCIS issued an RFE. AI has prepared a draft response. Review and submit before the deadline.</p>
            </div>
            <Button size="sm" variant="destructive">Review Draft</Button>
          </div>
        )}

        {/* ── Stage pipeline ───────────────────────────────────────── */}
        <Card className="mb-6 p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <span className="text-sm font-medium text-white">Case Progress</span>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Stage {Math.max(1, CASE_STAGES.indexOf(caseData.currentStage as any) + 1)} of {CASE_STAGES.length}</span>
              <span className="text-brand-400 font-medium">{stagePct}%</span>
            </div>
          </div>
          <div className="relative h-2 bg-white/[0.05] rounded-full mb-4 overflow-hidden">
            <div className="absolute h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700" style={{ width: `${stagePct}%` }} />
          </div>
          {/* Stage dots row */}
          <div className="hidden md:flex justify-between px-0.5 overflow-x-auto">
            {CASE_STAGES.map(s => {
              const idx    = CASE_STAGES.indexOf(s as any)
              const curIdx = CASE_STAGES.indexOf(caseData.currentStage as any)
              return (
                <div key={s} className="flex flex-col items-center gap-1 min-w-0">
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0 transition-all',
                    idx < curIdx  ? 'bg-brand-600 scale-90'
                    : idx === curIdx ? 'bg-brand-400 ring-2 ring-brand-500/40 scale-110'
                    : 'bg-white/[0.08]'
                  )} />
                  <span className={cn('text-[9px] text-center w-14 truncate leading-tight',
                    idx === curIdx ? 'text-brand-400' : idx < curIdx ? 'text-slate-600' : 'text-slate-700'
                  )}>{s}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* ── Main 3-column grid ───────────────────────────────────── */}
        <div className="grid xl:grid-cols-3 gap-6">

          {/* ── Left col (spans 2) ─────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-6">

            {/* Required Actions */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <CardTitle>Required Actions</CardTitle>
                </div>
                <CardDescription>Items needing attention right now</CardDescription>
              </CardHeader>
              <CardContent><RequiredActions caseData={caseData} /></CardContent>
            </Card>

            {/* Metrics row */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="flex flex-col items-center justify-center py-6">
                <ApprovalMeter score={caseData.approvalProbabilityScore} size="md" />
              </Card>
              <Card className="p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-slate-400">Checklist</span>
                </div>
                <div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="font-display font-bold text-2xl text-violet-400">{checkPct}%</span>
                    <span className="text-slate-600 text-sm pb-0.5">{done}/{total}</span>
                  </div>
                  <Progress value={checkPct} indicatorClassName="bg-violet-500" className="h-1.5" />
                </div>
              </Card>
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-slate-400">Timeline</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Opened</span>
                    <span className="text-slate-300">{fmtShort(caseData.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Est. complete</span>
                    <span className={caseData.estimatedCompletionDate ? 'text-amber-400' : 'text-slate-600'}>
                      {caseData.estimatedCompletionDate ? fmtShort(caseData.estimatedCompletionDate) : 'TBD'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Processing</span>
                    <span className="text-slate-300">~{caseData.estimatedProcessingTime ?? '?'} months</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Deadlines */}
            {caseData.deadlineEvents.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <CardTitle>Deadlines</CardTitle>
                    </div>
                    <Badge variant="outline">{caseData.deadlineEvents.filter((d: any) => !d.completed).length} pending</Badge>
                  </div>
                  <CardDescription>Click any deadline to mark it complete</CardDescription>
                </CardHeader>
                <CardContent>
                  <DeadlinePanel deadlines={caseData.deadlineEvents} />
                </CardContent>
              </Card>
            )}

            {/* Checklist — grouped by category */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-violet-400" />
                    <CardTitle>Document Checklist</CardTitle>
                  </div>
                  <Badge variant="outline">{done}/{total} complete</Badge>
                </div>
                <CardDescription>Click any item to mark complete. ★ = required form.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'form',     label: '📄 Forms & Applications' },
                  { key: 'document', label: '🗂️ Supporting Documents' },
                  { key: 'action',   label: '✅ Required Actions' },
                  { key: 'fee',      label: '💳 Filing Fees' },
                ].filter(cat => byCategory[cat.key]?.length > 0).map(cat => (
                  <div key={cat.key}>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{cat.label}</h4>
                    <ChecklistPanel items={byCategory[cat.key]} />
                    {cat.key !== 'fee' && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-400" />
                  <CardTitle>Case Timeline</CardTitle>
                </div>
                <CardDescription>{caseData.timelineEvents.length} events — most recent first</CardDescription>
              </CardHeader>
              <CardContent>
                <TimelinePreview events={caseData.timelineEvents} maxItems={20} />
              </CardContent>
            </Card>
          </div>

          {/* ── Right col ──────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Case details */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-teal-400" /><CardTitle>Case Details</CardTitle></div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Applicant',      value: caseData.applicantName,                icon: User     },
                  { label: 'Email',          value: caseData.applicantEmail ?? '—',          icon: User     },
                  { label: 'Visa Category',  value: caseData.visaCategory,                  icon: FileText },
                  { label: 'Case Type',      value: `${typeEmoji} ${caseData.caseType}`,    icon: Briefcase},
                  { label: 'Current Stage',  value: caseData.currentStage,                  icon: Activity },
                  { label: 'Petitioner',     value: caseData.petitionerName ?? '—',          icon: caseData.petitionerType === 'company' ? Building2 : User },
                  { label: 'Est. Complete',  value: fmtDate(caseData.estimatedCompletionDate), icon: Calendar },
                ].map(row => {
                  const Icon = row.icon
                  return (
                    <div key={row.label} className="flex items-start gap-2.5">
                      <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-slate-600 text-[10px]">{row.label}</p>
                        <p className="text-slate-300 text-xs truncate capitalize">{row.value}</p>
                      </div>
                    </div>
                  )
                })}
                {caseData.notes && (<>
                  <Separator />
                  <div><p className="text-slate-600 text-[10px] mb-1">Notes</p><p className="text-slate-400 text-xs leading-relaxed">{caseData.notes}</p></div>
                </>)}
              </CardContent>
            </Card>

            {/* Update Stage */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-violet-400" /><CardTitle>Update Stage</CardTitle></div>
              </CardHeader>
              <CardContent>
                <UpdateStageForm caseId={caseData.id} currentStage={caseData.currentStage} currentStatus={caseData.status} />
              </CardContent>
            </Card>

            {/* Add event */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /><CardTitle>Log Event</CardTitle></div>
              </CardHeader>
              <CardContent><AddEventForm caseId={caseData.id} /></CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-brand-500/20 bg-brand-500/[0.03]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-brand-400" /><CardTitle>AI Insights</CardTitle></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs leading-relaxed">
                  <p className="text-white font-medium mb-1">Approval analysis</p>
                  <p className="text-slate-400">
                    {caseData.approvalProbabilityScore >= 85
                      ? 'Strong approval profile. Evidence appears complete and well-structured for this visa category.'
                      : caseData.approvalProbabilityScore >= 70
                      ? 'Moderate likelihood. Consider strengthening supporting evidence before filing.'
                      : 'Lower probability. Review case strategy carefully — consider RFE risk mitigation.'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs leading-relaxed">
                  <p className="text-white font-medium mb-1">Next action</p>
                  <p className="text-slate-400">
                    {done < total
                      ? `Complete the ${total - done} remaining checklist item${total - done !== 1 ? 's' : ''} — ${caseData.checklistItems.filter((i: any) => i.required && !i.completed).length} are required — before advancing.`
                      : 'All items complete. Case is ready to advance to the next stage.'}
                  </p>
                </div>
                {upcomingDeadlines.length > 0 && (
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs leading-relaxed">
                    <p className="text-white font-medium mb-1">Nearest deadline</p>
                    <p className="text-slate-400">
                      <span className="text-amber-400">{upcomingDeadlines[0].title}</span> — due {fmtShort(upcomingDeadlines[0].dueDate)}{' '}
                      ({Math.ceil((new Date(upcomingDeadlines[0].dueDate).getTime() - Date.now()) / 86400000)} days)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
