import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Briefcase } from 'lucide-react'
import { useFieldJobsStore } from '@/lib/store/field-jobs-store'
import { toDateKey } from '@/lib/utils'

type Tab = 'today' | 'upcoming' | 'completed'

export default function FieldJobs() {
  const navigate = useNavigate()
  const { jobs, loading } = useFieldJobsStore()
  const [tab, setTab] = useState<Tab>('today')

  const todayKey = toDateKey(new Date())

  const filtered = useMemo(() => {
    if (tab === 'completed') return jobs.filter((j) => j.status === 'Completed')
    if (tab === 'today') return jobs.filter((j) => j.dueDate === todayKey && j.status !== 'Completed' && j.status !== 'Cancelled')
    return jobs.filter((j) => j.dueDate > todayKey && j.status !== 'Completed' && j.status !== 'Cancelled')
  }, [jobs, tab, todayKey])

  return (
    <div className="space-y-4 p-5">
      <h1 className="text-xl font-semibold">Jobs</h1>

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
