import { CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VERIFICATION_STATUS_CONFIG } from '@/types'

const ICONS = {
  pending:  Clock,
  verified: CheckCircle2,
  flagged:  AlertTriangle,
  expired:  XCircle,
}

interface VerificationBadgeProps {
  status: string
  size?: 'sm' | 'md'
  showIcon?: boolean
}

export function VerificationBadge({ status, size = 'sm', showIcon = true }: VerificationBadgeProps) {
  const cfg  = VERIFICATION_STATUS_CONFIG[status] ?? VERIFICATION_STATUS_CONFIG.pending
  const Icon = ICONS[status as keyof typeof ICONS] ?? Clock

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      cfg.color, cfg.bg, cfg.border,
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
    )}>
      {showIcon && <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />}
      {cfg.label}
    </span>
  )
}
