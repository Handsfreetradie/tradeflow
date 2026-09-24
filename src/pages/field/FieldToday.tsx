import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigation, MapPin } from 'lucide-react'
import { StatusBadge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useFieldJobsStore } from '@/lib/store/field-jobs-store'
import { toDateKey } from '@/lib/utils'

export default function FieldToday() {
  const navigate = useNavigate()
  const { fullName } = useAuth()
  const { jobs, loading } = useFieldJobsStore()

  const todayKey = toDateKey(new Date())
  const todaysJobs = useMemo(() => jobs.filter((j) => j.dueDate === todayKey), [jobs, todayKey])
  const nextJob = todaysJobs.find((j) => j.status !== 'Completed' && j.status !== 'Cancelled') ?? todaysJobs[0]

  const firstName = (fullName ?? 'there').split(' ')[0]

  return (
    <div className="space-y-5">
      <div className="bg-sidebar px-5 pb-6 pt-8 text-sidebar-foreground">
        <h1 className="text-xl font-semibold">Good day, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-sidebar-muted">Here's your schedule for today.</p>

        {nextJob && (
          <div className="mt-5 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-sidebar-muted">Next Job</p>
            <p className="mt-2 text-xs text-sidebar-muted">{nextJob.scheduledTime ?? 'Anytime today'}</p>
            <p className="mt-1 text-base font-semibold">{nextJob.customerName || nextJob.title}</p>
            <p className="text-sm text-sidebar-muted">{nextJob.title}</p>
            <button
              onClick={() => navigate(`/field/jobs/${nextJob.id}`)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Navigation className="size-4" />
              View job
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 px-5">
        <p className="text-sm font-semibold">Today's Jobs</p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : todaysJobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No jobs scheduled today.
          </div>
        ) : (
          <div className="space-y-2">
            {todaysJobs.map((job) => (
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
    </div>
  )
}
