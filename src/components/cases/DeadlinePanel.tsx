'use client'

import { useTransition } from 'react'
import { Calendar, CheckCircle2, Circle, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toggleDeadline } from '@/lib/actions/cases'
import { DEADLINE_TYPE_COLORS } from '@/types'

interface DeadlineItem {
  id:           string
  deadlineType: string
  title:        string
  description:  string | null
  dueDate:      Date
  completed:    boolean
  alertDays:    number
}

function daysUntil(date: Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

function urgencyClass(days: number, completed: boolean): string {
  if (completed) return 'text-slate-600'
  if (days < 0)  return 'text-rose-400 font-bold'
  if (days <= 7) return 'text-rose-400'
  if (days <= 14) return 'text-amber-400'
  return 'text-slate-400'
}

function urgencyBg(days: number, completed: boolean): string {
  if (completed) return 'opacity-50'
  if (days < 0)  return 'border-rose-500/30 bg-rose-500/[0.04]'
  if (days <= 7) return 'border-amber-500/25'
  return ''
}

function deadlineLabel(days: number, completed: boolean): string {
  if (completed) return 'Done'
  if (days < 0)  return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `${days}d`
}

interface DeadlinePanelProps {
  deadlines: DeadlineItem[]
}

export function DeadlinePanel({ deadlines }: DeadlinePanelProps) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => { await toggleDeadline(id, !current) })
  }

  const sorted = [...deadlines].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  if (sorted.length === 0) {
    return <p className="text-slate-600 text-sm text-center py-6">No deadlines yet.</p>
  }

  return (
    <ul className="space-y-2">
      {sorted.map(dl => {
        const days = daysUntil(dl.dueDate)
        return (
          <li key={dl.id}
            onClick={() => !isPending && handleToggle(dl.id, dl.completed)}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] cursor-pointer',
              'hover:border-white/[0.12] transition-all duration-150 group',
              urgencyBg(days, dl.completed),
              isPending && 'pointer-events-none opacity-60'
            )}>
            <div className="flex-shrink-0 mt-0.5">
              {dl.completed
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : days < 0
                ? <AlertTriangle className="w-4 h-4 text-rose-400" />
                : <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className={cn('text-sm font-medium', dl.completed ? 'text-slate-600 line-through' : 'text-white')}>
                  {dl.title}
                </span>
                <span className={cn('text-xs whitespace-nowrap flex-shrink-0 tabular-nums', urgencyClass(days, dl.completed))}>
                  {deadlineLabel(days, dl.completed)}
                </span>
              </div>
              {dl.description && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{dl.description}</p>
              )}
              <div className="flex items-center gap-1 mt-1.5">
                <Calendar className="w-3 h-3 text-slate-700" />
                <span className="text-[10px] text-slate-700">
                  {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dl.dueDate))}
                </span>
                <span className={cn(
                  'ml-2 text-[10px] px-1.5 py-0.5 rounded-full border capitalize',
                  DEADLINE_TYPE_COLORS[dl.deadlineType] ? `${DEADLINE_TYPE_COLORS[dl.deadlineType]} bg-white/[0.04] border-current/20` : 'text-slate-600 border-white/[0.06]'
                )}>
                  {dl.deadlineType.replace('_', ' ')}
                </span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
