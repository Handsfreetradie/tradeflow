import { CalendarClock } from 'lucide-react'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { daysUntil, nextBasDueDate } from '@/lib/bas'
import { formatDate } from '@/lib/utils'

/** Countdown banner for the next BAS lodgment date — only relevant for GST-registered
 * businesses, and only shown once it's actually coming up. */
export function BasDueBanner() {
  const { settings, loading } = useBusinessSettings()
  if (loading || !settings.isGstRegistered) return null

  const dueDate = nextBasDueDate()
  const days = daysUntil(dueDate)
  if (days < 0 || days > 14) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
      <CalendarClock className="size-4 shrink-0 text-warning" />
      <p>
        <span className="font-medium text-warning">
          {days === 0 ? 'BAS due today' : `BAS due in ${days} day${days === 1 ? '' : 's'}`}
        </span>
        <span className="text-muted-foreground"> — lodge and pay by {formatDate(dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}.</span>
      </p>
    </div>
  )
}
