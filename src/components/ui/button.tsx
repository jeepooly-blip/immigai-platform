import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-brand-600 text-white hover:bg-brand-500 shadow-glow-sm',
        destructive:
          'bg-rose-600 text-white hover:bg-rose-500',
        outline:
          'border border-white/[0.1] bg-white/[0.04] text-white/80 hover:bg-white/[0.08] hover:text-white',
        secondary:
          'bg-white/[0.06] text-white/80 hover:bg-white/[0.1] border border-white/[0.08]',
        ghost:
          'text-slate-400 hover:bg-white/[0.06] hover:text-white',
        link:
          'text-brand-400 underline-offset-4 hover:underline hover:text-brand-300',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-500',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
