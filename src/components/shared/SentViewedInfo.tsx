import { Eye, EyeOff, Send } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

const stamp: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }
const dayOnly: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

/**
 * When an invoice was sent and whether the customer opened it. `compact` is for lists that already
 * have a Status column: just the sent date, plus a small "Opened" line only once they've looked.
 */
export function SentViewedInfo({
  status,
  sentAt,
  firstViewedAt,
  viewCount,
  layout = 'stack',
  compact = false,
  className,
}: {
  status: string
  sentAt?: string
  firstViewedAt?: string
  viewCount: number
  layout?: 'stack' | 'row'
  compact?: boolean
  className?: string
}) {
  const wasSent = status !== 'Draft' || !!sentAt
  if (!wasSent) return <p className={cn('text-xs text-muted-foreground', className)}>{compact ? '—' : 'Not sent yet'}</p>

  if (compact) {
    return (
      <div className={cn('space-y-0.5', className)}>
        <p className="text-sm text-muted-foreground">{sentAt ? formatDate(sentAt, dayOnly) : '—'}</p>
        {firstViewedAt && (
          <p className="flex items-center gap-1 text-xs font-medium text-success">
            <Eye className="size-3.5 shrink-0" />
            Opened {formatDate(firstViewedAt, { day: 'numeric', month: 'short' })}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn('text-xs', layout === 'row' ? 'flex flex-wrap items-center gap-x-4 gap-y-1' : 'space-y-1', className)}>
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <Send className="size-3.5 shrink-0" />
        {sentAt ? `Sent ${formatDate(sentAt, stamp)}` : 'Sent'}
      </p>
      {firstViewedAt ? (
        <p className="flex items-center gap-1.5 font-medium text-success">
          <Eye className="size-3.5 shrink-0" />
          Opened {formatDate(firstViewedAt, stamp)}
          {viewCount > 1 && <span className="font-normal text-muted-foreground"> · {viewCount} times</span>}
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          <EyeOff className="size-3.5 shrink-0" />
          Not opened yet
        </p>
      )}
    </div>
  )
}
