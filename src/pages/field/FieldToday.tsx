import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Navigation, MapPin, Bell, X, Users } from 'lucide-react'
import { StatusBadge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { useFieldJobsStore, type FieldCrewMember } from '@/lib/store/field-jobs-store'
import { toDateKey } from '@/lib/utils'
import { getExistingSubscription, isPushSupported, subscribeToPush } from '@/lib/push/subscribe'

const DISMISS_KEY = 'field-notif-banner-dismissed'

/** Free-text scheduled times (e.g. "9:00 AM – 11:00 AM") sort by their start time; jobs with no time go last. */
function timeSortValue(scheduledTime?: string) {
  if (!scheduledTime) return Number.POSITIVE_INFINITY
  const start = scheduledTime.split(/[-–—]/)[0].trim()
  const parsed = new Date(`2000-01-01 ${start}`)
  return Number.isNaN(parsed.getTime()) ? Number.POSITIVE_INFINITY : parsed.getTime()
}

function NotificationBanner() {
  const [visible, setVisible] = useState(false)
  const [enabling, setEnabling] = useState(false)

  useEffect(() => {
    if (!isPushSupported() || Notification.permission === 'denied' || localStorage.getItem(DISMISS_KEY)) return
    getExistingSubscription().then((sub) => setVisible(!sub))
  }, [])

  const enable = async () => {
    setEnabling(true)
    try {
      await subscribeToPush()
      toast.success("Notifications on — you'll get a ping when a same-day job comes in")
      setVisible(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not turn on notifications')
    } finally {
      setEnabling(false)
    }
  }

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="mx-5 flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
      <Bell className="size-4 shrink-0 text-primary" />
      <p className="flex-1 text-xs text-muted-foreground">Turn on notifications to hear about jobs added to your day.</p>
      <button onClick={enable} disabled={enabling} className="shrink-0 text-xs font-medium text-primary">
        {enabling ? 'Enabling…' : 'Enable'}
      </button>
      <button onClick={dismiss} className="shrink-0 text-muted-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  )
}

export default function FieldToday() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { jobs, loading } = useFieldJobsStore()
  const { settings } = useBusinessSettings()
  const myId = session?.user.id

  const todayKey = toDateKey(new Date())
  const todaysJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.dueDate === todayKey)
        .sort((a, b) => timeSortValue(a.scheduledTime) - timeSortValue(b.scheduledTime)),
    [jobs, todayKey]
  )
  const nextJob = todaysJobs.find((j) => j.status !== 'Completed' && j.status !== 'Cancelled') ?? todaysJobs[0]

  const otherCrew = (jobCrew: FieldCrewMember[]) => jobCrew.filter((c) => c.employeeId !== myId)

  return (
    <div className="space-y-5">
      <div className="bg-sidebar px-5 pb-6 pt-8 text-sidebar-foreground">
        {settings.logoUrl ? (
          <div className="inline-flex h-10 items-center rounded-lg bg-white/95 px-3">
            <img src={settings.logoUrl} alt={settings.businessName} className="h-6 w-auto object-contain" />
          </div>
        ) : (
          <h1 className="text-xl font-semibold">{settings.businessName}</h1>
        )}
        <p className="mt-2 text-sm text-sidebar-muted">Here's your schedule for today.</p>

        {nextJob && (
          <div className="mt-5 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-sidebar-muted">Next Job</p>
            <p className="mt-2 text-xs text-sidebar-muted">{nextJob.scheduledTime ?? 'Anytime today'}</p>
            <p className="mt-1 text-base font-semibold">{nextJob.customerName || nextJob.title}</p>
            <p className="text-sm text-sidebar-muted">{nextJob.title}</p>
            {otherCrew(nextJob.crew).length > 0 && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-sidebar-muted">
                <Users className="size-3 shrink-0" />
                With {otherCrew(nextJob.crew).map((c) => c.fullName).join(', ')}
              </p>
            )}
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

      <NotificationBanner />

      <div className="space-y-3 px-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Today's Jobs</p>
          <button onClick={() => navigate('/field/find-job')} className="text-xs font-medium text-primary">
            Not on your list? Find a job
          </button>
        </div>
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
                  <p className="truncate text-xs text-muted-foreground">
                    {job.scheduledTime ? `${job.scheduledTime} · ` : ''}
                    {job.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    {job.address}
                  </p>
                  {otherCrew(job.crew).length > 0 && (
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Users className="size-3 shrink-0" />
                      With {otherCrew(job.crew).map((c) => c.fullName).join(', ')}
                    </p>
                  )}
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
