import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useJobsStore } from '@/lib/store/jobs-store'
import type { JobStatus } from '@/lib/demo-data'

const statusDot: Record<JobStatus, string> = {
  'In Progress': 'bg-primary',
  Scheduled: 'bg-success',
  Completed: 'bg-muted-foreground',
  'On Hold': 'bg-purple',
  Cancelled: 'bg-destructive',
}

export function UpcomingJobsCard() {
  const { jobs } = useJobsStore()
  const navigate = useNavigate()

  const upcoming = useMemo(
    () =>
      jobs
        .filter((j) => j.status === 'Scheduled' || j.status === 'In Progress' || j.status === 'On Hold')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 4),
    [jobs]
  )

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Upcoming Jobs</CardTitle>
        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View calendar
          <ChevronRight className="size-3.5" />
        </button>
      </CardHeader>
      <CardContent className="space-y-1">
        {upcoming.map((job) => {
          const date = new Date(job.dueDate)
          const day = new Intl.DateTimeFormat('en-AU', { weekday: 'short' }).format(date).toUpperCase()
          const dateNum = new Intl.DateTimeFormat('en-AU', { day: 'numeric' }).format(date)
          return (
            <button
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-secondary"
            >
              <div className="flex w-11 shrink-0 flex-col items-center rounded-lg bg-secondary py-1.5">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground">{day}</span>
                <span className="text-sm font-semibold">{dateNum}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {job.title} — {job.customer}
                </p>
                <p className="text-xs text-muted-foreground">{job.scheduledTime ?? `Due ${new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short' }).format(date)}`}</p>
              </div>
              <span className={cn('mt-0.5 size-2 shrink-0 rounded-full', statusDot[job.status])} />
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
