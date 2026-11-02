import { Eye, EyeOff, Send } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

const stamp: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }

/** "Sent 28 Oct, 2:15 pm" and "Opened 29 Oct, 8:02 am" for an invoice, as two small lines (or one row). */
export function SentViewedInfo({
  status,
  sentAt,
  firstViewedAt,
  viewCount,
  layout = 'stack',
  className,
}: {
  status: string
  sentAt?: string
  firstViewedAt?: string
  viewCount: number
  layout?: 'stack' | 'row'
  className?: string
}) {
  const wasSent = status !== 'Draft' || !!sentAt
  if (!wasSent) return <p className={cn('text-xs text-muted-foreground', className)}>Not sent yet</p>

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
