import Link from 'next/link'
import { ChevronRight, Calendar, User, Building2, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CaseStatusBadge } from './CaseStatusBadge'
import { ApprovalMeter } from './ApprovalMeter'
import { cn } from '@/lib/utils'
import { CASE_TYPE_COLORS, CASE_TYPE_ICONS } from '@/types'

interface DeadlineItem { dueDate: Date; completed: boolean; title: string }
interface CaseData {
  id: string; applicantName: string; visaCategory: string; currentStage: string
  status: string; caseType: string; approvalProbabilityScore: number
  estimatedCompletionDate: Date | null; petitionerName: string | null; petitionerType: string | null
  checklistItems: { completed: boolean; required: boolean }[]
  timelineEvents:  { id: string; title: string }[]
  deadlineEvents:  DeadlineItem[]
}

const STAGE_ORDER = [
  'Intake','Petition Preparation','Document Collection','Attorney Review',
  'Form Preparation','USCIS Filing','USCIS Review','NVC Processing',
  'Embassy Interview','Biometrics','RFE Response','Decision Pending','Approved','Denied',
]

export function CaseCard({ caseData: c }: { caseData: CaseData }) {
  const total     = c.checklistItems.length
  const done      = c.checklistItems.filter((i: { completed: boolean }) => i.completed).length
  const checkPct  = total === 0 ? 0 : Math.round((done / total) * 100)
  const stageIdx  = STAGE_ORDER.indexOf(c.currentStage)
  const stagePct  = stageIdx === -1 ? 8 : Math.round(((stageIdx + 1) / STAGE_ORDER.length) * 100)
  const lastEvent = c.timelineEvents[0]
  const nextDl    = c.deadlineEvents?.filter(d => !d.completed).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]
  const dlDays    = nextDl ? Math.ceil((new Date(nextDl.dueDate).getTime() - Date.now()) / 86400000) : null
  const typeColor = CASE_TYPE_COLORS[c.caseType] ?? CASE_TYPE_COLORS.employment
  const typeEmoji = CASE_TYPE_ICONS[c.caseType] ?? '📁'
  const isUrgent  = c.status === 'rfe_received' || (dlDays !== null && dlDays <= 7)

  return (
    <Link href={`/case/${c.id}`}>
      <Card className={cn(
        'hover:border-white/[0.14] hover:bg-[#1a2035] transition-all duration-200 cursor-pointer group h-full',
        isUrgent && 'border-amber-500/25 hover:border-amber-500/40'
      )}>
        <CardContent className="p-5 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <CaseStatusBadge status={c.status} />
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize', typeColor)}>
                  {typeEmoji} {c.caseType}
                </span>
              </div>
              <h3 className="font-display font-semibold text-white text-sm truncate">{c.applicantName}</h3>
              <p className="text-xs mt-0.5">
                <span className="text-brand-400 font-medium">{c.visaCategory}</span>
                <span className="text-slate-700 mx-1">·</span>
                <span className="text-slate-500">{c.currentStage}</span>
              </p>
            </div>
            <ApprovalMeter score={c.approvalProbabilityScore} size="sm" showLabel={false} />
          </div>

          {/* Petitioner */}
          {c.petitionerName && (
            <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-500">
              {c.petitionerType === 'company' ? <Building2 className="w-3 h-3 flex-shrink-0" /> : <User className="w-3 h-3 flex-shrink-0" />}
              <span className="truncate">{c.petitionerName}</span>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-2 mb-3 flex-1">
            <div>
              <div className="flex justify-between text-[10px] text-slate-600 mb-1"><span>Stage</span><span>{stagePct}%</span></div>
              <Progress value={stagePct} className="h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-slate-600 mb-1"><span>Checklist</span><span>{done}/{total}</span></div>
              <Progress value={checkPct} className="h-1.5" indicatorClassName={checkPct === 100 ? 'bg-emerald-500' : 'bg-violet-500'} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
            {nextDl ? (
              <div className={cn('flex items-center gap-1 text-[10px]', dlDays !== null && dlDays <= 7 ? 'text-amber-400' : 'text-slate-600')}>
                <Clock className="w-2.5 h-2.5" />
                <span className="truncate max-w-[120px]">{nextDl.title}</span>
                <span className="whitespace-nowrap">{dlDays === 0 ? 'today' : `${dlDays}d`}</span>
              </div>
            ) : lastEvent ? (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block" />
                <span className="truncate max-w-[140px]">{lastEvent.title}</span>
              </div>
            ) : <span />}
            <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-500 transition-colors flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
