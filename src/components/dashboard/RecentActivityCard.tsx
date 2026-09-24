import { useNavigate } from 'react-router-dom'
import { ChevronRight, CheckCircle2, RefreshCw, FileCheck2, Send, UserPlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { recentActivity, type ActivityItem } from '@/lib/demo-data'

const activityMeta: Record<ActivityItem['type'], { icon: LucideIcon; tone: string }> = {
  invoice_paid: { icon: CheckCircle2, tone: 'bg-success/10 text-success' },
  job_updated: { icon: RefreshCw, tone: 'bg-primary/10 text-primary' },
  quote_accepted: { icon: FileCheck2, tone: 'bg-purple/10 text-purple' },
  invoice_sent: { icon: Send, tone: 'bg-primary/10 text-primary' },
  customer_added: { icon: UserPlus, tone: 'bg-warning/10 text-warning' },
}

export function RecentActivityCard() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Recent Activity</CardTitle>
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all
          <ChevronRight className="size-3.5" />
        </button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {recentActivity.map((item, i) => {
            const meta = activityMeta[item.type]
            return (
              <li key={item.id} className="relative flex gap-3">
                {i !== recentActivity.length - 1 && (
                  <span className="absolute left-[15px] top-8 h-[calc(100%-4px)] w-px bg-border" />
                )}
                <div className={cn('relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full', meta.tone)}>
                  <meta.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1 pb-0.5">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.detail}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{item.timestamp}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
