import { cn } from '@/lib/utils'

interface ApprovalMeterProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ApprovalMeter({ score, size = 'md', showLabel = true }: ApprovalMeterProps) {
  const clamped = Math.min(100, Math.max(0, score))

  const color =
    clamped >= 85
      ? { ring: 'text-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' }
      : clamped >= 70
      ? { ring: 'text-brand-400',   bg: 'bg-brand-500/10',   text: 'text-brand-400',   bar: 'bg-brand-500'   }
      : { ring: 'text-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   bar: 'bg-amber-500'   }

  const dimensions = { sm: 64, md: 88, lg: 112 }[size]
  const stroke = { sm: 5, md: 6, lg: 7 }[size]
  const radius = (dimensions - stroke * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dimensions, height: dimensions }}>
        <svg
          width={dimensions}
          height={dimensions}
          viewBox={`0 0 ${dimensions} ${dimensions}`}
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn('transition-all duration-700', color.ring)}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-display font-bold leading-none', color.text,
            size === 'sm' ? 'text-base' : size === 'md' ? 'text-xl' : 'text-2xl'
          )}>
            {clamped}%
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500">Approval probability</span>
      )}
    </div>
  )
}
