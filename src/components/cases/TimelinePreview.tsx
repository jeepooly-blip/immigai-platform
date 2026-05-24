import { cn } from '@/lib/utils'
import {
  FolderOpen, FileText, Bell, CheckCircle2,
  XCircle, AlertTriangle, MessageSquare, RefreshCw
} from 'lucide-react'
import type { TimelineEvent } from '@/types/prisma'

const EVENT_CONFIG: Record<string, {
  icon: React.ElementType
  color: string
  dot: string
}> = {
  created:          { icon: FolderOpen,    color: 'text-brand-400',   dot: 'bg-brand-500'   },
  stage_change:     { icon: RefreshCw,     color: 'text-violet-400',  dot: 'bg-violet-500'  },
  document_uploaded:{ icon: FileText,      color: 'text-teal-400',    dot: 'bg-teal-500'    },
  rfe:              { icon: AlertTriangle, color: 'text-amber-400',   dot: 'bg-amber-500'   },
  approval:         { icon: CheckCircle2,  color: 'text-emerald-400', dot: 'bg-emerald-500' },
  denial:           { icon: XCircle,       color: 'text-rose-400',    dot: 'bg-rose-500'    },
  note:             { icon: MessageSquare, color: 'text-slate-400',   dot: 'bg-slate-500'   },
}

function getConfig(eventType: string) {
  return EVENT_CONFIG[eventType] ?? EVENT_CONFIG.note
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(date))
}

interface TimelinePreviewProps {
  events: TimelineEvent[]
  maxItems?: number
  compact?: boolean
}

export function TimelinePreview({ events, maxItems = 4, compact = false }: TimelinePreviewProps) {
  const shown = events.slice(0, maxItems)

  if (shown.length === 0) {
    return (
      <div className="text-center py-6 text-slate-600 text-sm">
        No timeline events yet.
      </div>
    )
  }

  return (
    <ol className="relative">
      {shown.map((event, idx) => {
        const cfg = getConfig(event.eventType)
        const Icon = cfg.icon
        const isLast = idx === shown.length - 1

        return (
          <li key={event.id} className="flex gap-3 group">
            {/* Left — dot + connector */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn(
                'flex items-center justify-center rounded-full flex-shrink-0 ring-4 ring-[#0d1117]',
                compact ? 'w-6 h-6' : 'w-8 h-8',
                cfg.dot
              )}>
                <Icon className={cn('flex-shrink-0', compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5', 'text-white')} />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-white/[0.06] my-1" />
              )}
            </div>

            {/* Right — content */}
            <div className={cn('flex-1 min-w-0', isLast ? 'pb-0' : 'pb-4')}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <span className={cn('font-medium text-white', compact ? 'text-xs' : 'text-sm')}>
                  {event.title}
                </span>
                <span className="text-[10px] text-slate-600 whitespace-nowrap flex-shrink-0">
                  {formatDate(event.eventDate)}
                </span>
              </div>
              <p className={cn('text-slate-500 leading-relaxed mt-0.5', compact ? 'text-[11px]' : 'text-xs')}>
                {event.description}
              </p>
              {event.isAutomated && (
                <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-brand-500/70">
                  ✦ AI automated
                </span>
              )}
            </div>
          </li>
        )
      })}
      {events.length > maxItems && (
        <li className="text-xs text-slate-600 pl-11 pt-1">
          +{events.length - maxItems} more events
        </li>
      )}
    </ol>
  )
}
