'use client'

import { useTransition } from 'react'
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toggleChecklistItem } from '@/lib/actions/cases'
import { Progress } from '@/components/ui/progress'
import type { ChecklistItem } from '@/types/prisma'

interface ChecklistPanelProps {
  items: ChecklistItem[]
}

export function ChecklistPanel({ items }: ChecklistPanelProps) {
  const [isPending, startTransition] = useTransition()

  const total = items.length
  const completed = items.filter(i => i.completed).length
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  const progressColor =
    pct >= 80 ? 'bg-emerald-500'
    : pct >= 50 ? 'bg-brand-500'
    : 'bg-amber-500'

  function handleToggle(itemId: string, current: boolean) {
    startTransition(async () => {
      await toggleChecklistItem(itemId, !current)
    })
  }

  return (
    <div>
      {/* Header with progress */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{completed}/{total} complete</span>
          <span className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            pct === 100
              ? 'bg-emerald-500/10 text-emerald-400'
              : pct >= 50
              ? 'bg-brand-500/10 text-brand-400'
              : 'bg-amber-500/10 text-amber-400'
          )}>
            {pct}%
          </span>
        </div>
      </div>

      <Progress
        value={pct}
        indicatorClassName={progressColor}
        className="mb-4 h-2"
      />

      {/* Items */}
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              'flex items-start gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-150 group',
              'hover:bg-white/[0.04]',
              isPending && 'opacity-70 pointer-events-none'
            )}
            onClick={() => handleToggle(item.id, item.completed)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className={cn(
                'text-sm transition-colors',
                item.completed ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-white'
              )}>
                {item.itemLabel}
              </span>
              {item.dueDate && (
                <div className="text-[10px] text-slate-600 mt-0.5">
                  Due: {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(item.dueDate))}
                </div>
              )}
            </div>

            {item.required && !item.completed && (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500/60 flex-shrink-0 mt-0.5" />
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
