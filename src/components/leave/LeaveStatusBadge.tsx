import { Badge } from '@/components/ui/badge'
import type { LeaveStatus } from '@/lib/store/leave-store'

const variants: Record<LeaveStatus, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  declined: { variant: 'danger', label: 'Declined' },
}

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  const { variant, label } = variants[status]
  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  )
}
