import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:    'bg-brand-500/10  text-brand-400  border-brand-500/20',
        active:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        submitted:  'bg-blue-500/10   text-blue-400   border-blue-500/20',
        approved:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        denied:     'bg-rose-500/10   text-rose-400   border-rose-500/20',
        rfe:        'bg-amber-500/10  text-amber-400  border-amber-500/20',
        outline:    'bg-transparent   text-slate-400  border-white/[0.1]',
        secondary:  'bg-white/[0.06]  text-slate-300  border-white/[0.08]',
        purple:     'bg-violet-500/10 text-violet-400 border-violet-500/20',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
