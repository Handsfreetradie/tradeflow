import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Sun, Wind, Wrench, Plug, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useJobsStore } from '@/lib/store/jobs-store'

const thumbnailIcon: Record<string, LucideIcon> = {
  switchboard: Zap,
  solar: Sun,
  aircon: Wind,
  fitout: Wrench,
  power: Plug,
}

const filters = ['All', 'Active', 'Completed', 'On Hold'] as const

export function JobOverviewCard() {
  const { jobs } = useJobsStore()
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const navigate = useNavigate()

  const jobCounts = useMemo(
    () => ({
      total: jobs.length,
      inProgress: jobs.filter((j) => j.status === 'In Progress').length,
      completed: jobs.filter((j) => j.status === 'Completed').length,
      onHold: jobs.filter((j) => j.status === 'On Hold').length,
      cancelled: jobs.filter((j) => j.status === 'Cancelled').length,
    }),
    [jobs]
  )

  const filtered = useMemo(() => {
    let result = jobs
    if (filter === 'Active') result = jobs.filter((j) => j.status === 'In Progress' || j.status === 'Scheduled')
    else if (filter === 'Completed') result = jobs.filter((j) => j.status === 'Completed')
    else if (filter === 'On Hold') result = jobs.filter((j) => j.status === 'On Hold')
    return result.slice(0, 5)
  }, [jobs, filter])

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Job Overview</CardTitle>
          <p className="text-sm text-muted-foreground">Track your jobs from quote to completion.</p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            {filters.map((f) => (
              <TabsTrigger key={f} value={f}>
                {f}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-5 gap-3 border-b border-border pb-4">
          {[
            { label: 'Total Jobs', value: jobCounts.total },
            { label: 'In Progress', value: jobCounts.inProgress, tone: 'text-primary' },
            { label: 'Completed', value: jobCounts.completed, tone: 'text-success' },
            { label: 'On Hold', value: jobCounts.onHold, tone: 'text-purple' },
            { label: 'Cancelled', value: jobCounts.cancelled, tone: 'text-destructive' },
          ].map((c) => (
            <div key={c.label}>
              <p className={cn('text-xl font-semibold tracking-tight', c.tone)}>{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Wrench} title="No jobs in this view" description="Try a different filter." />
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((job) => {
              const Icon = thumbnailIcon[job.thumbnail] ?? Wrench
              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-secondary/60 first:pt-0 last:pb-0"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">{job.number}</span>
                      <p className="truncate text-sm font-medium">{job.title}</p>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {job.customer} · {job.address}
                    </p>
                  </div>
                  <StatusBadge status={job.status} className="hidden sm:inline-flex" />
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium">{formatCurrency(job.value)}</p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(job.dueDate)}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              )
            })}
          </div>
        )}

        <button
          onClick={() => navigate('/jobs')}
          className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all jobs
          <ChevronRight className="size-3.5" />
        </button>
      </CardContent>
    </Card>
  )
}
