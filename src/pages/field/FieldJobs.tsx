import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Briefcase } from 'lucide-react'
import { useFieldJobsStore } from '@/lib/store/field-jobs-store'
import { toDateKey } from '@/lib/utils'

type Tab = 'today' | 'upcoming' | 'completed'

function timeSortValue(scheduledTime?: string) {
  if (!scheduledTime) return Number.POSITIVE_INFINITY
  const start = scheduledTime.split(/[-–—]/)[0].trim()
  const parsed = new Date(`2000-01-01 ${start}`)
  return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime()
}

export default function FieldJobs() {
  const navigate = useNavigate()
  const { jobs, loading, joinableJobs } = useFieldJobsStore()
  const [tab, setTab] = useState<Tab>('today')

  const todayKey = toDateKey(new Date())

  const filtered = useMemo(() => {
    let result: typeof jobs
    if (tab === 'completed') result = jobs.filter((j) => j.status === 'Completed')
    else if (tab === 'today') result = jobs.filter((j) => j.dueDate === todayKey && j.status !== 'Completed' && j.status !== 'Cancelled')
    else result = jobs.filter((j) => j.dueDate > todayKey && j.status !== 'Completed' && j.status !== 'Cancelled')
    return [...result].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || timeSortValue(a.scheduledTime) - timeSortValue(b.scheduledTime))
  }, [jobs, tab, todayKey])

  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Jobs</h1>
        <Button size="sm" variant="secondary" onClick={() => navigate('/field/find-job')}>
          <Search className="size-3.5" />
          Find a job{joinableJobs.length > 0 ? ` (${joinableJobs.length})` : ''}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">
            Today
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex-1">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs here" description="Nothing to show in this view." />
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => (
            <button
              key={job.id}
              onClick={() => navigate(`/field/jobs/${job.id}`)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors active:bg-secondary/60"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{job.customerName || job.title}</p>
                <p className="truncate text-xs text-muted-foreground">{job.title}</p>
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="size-3 shrink-0" />
                  {job.address}
                </p>
              </div>
              <StatusBadge status={job.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
