import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        danger: 'bg-destructive/10 text-destructive',
        info: 'bg-primary/10 text-primary',
        purple: 'bg-purple/10 text-purple',
        outline: 'border border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn('size-1.5 rounded-full', {
            'bg-secondary-foreground/50': variant === 'default' || !variant,
            'bg-success': variant === 'success',
            'bg-warning': variant === 'warning',
            'bg-destructive': variant === 'danger',
            'bg-primary': variant === 'info',
            'bg-purple': variant === 'purple',
          })}
        />
      )}
      {children}
    </span>
  )
}

/** Maps a job/quote/invoice status string to the right badge variant + label. */
export const statusBadgeVariant: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
  paid: 'success',
  completed: 'success',
  accepted: 'success',
  active: 'success',
  'in progress': 'info',
  scheduled: 'info',
  sent: 'info',
  draft: 'default',
  quoted: 'warning',
  partial: 'warning',
  overdue: 'danger',
  declined: 'danger',
  cancelled: 'danger',
  expired: 'danger',
  'on hold': 'purple',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase()
  return (
    <Badge variant={statusBadgeVariant[key] ?? 'default'} dot className={className}>
      {status}
    </Badge>
  )
}

export { Badge, badgeVariants }
