import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFieldJobsStore } from '@/lib/store/field-jobs-store'

export default function FieldFindJob() {
  const navigate = useNavigate()
  const { joinableJobs, joinJob } = useFieldJobsStore()
  const [joiningId, setJoiningId] = useState<string | null>(null)

  const join = async (jobId: string) => {
    setJoiningId(jobId)
    try {
      await joinJob(jobId)
      toast.success('Added — your boss has been notified')
      navigate(`/field/jobs/${jobId}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not join this job')
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="space-y-5 p-5">
      <button onClick={() => navigate(-1)} className="-ml-1 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div>
        <h1 className="text-xl font-semibold">Find a job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jobs happening today that you're not on. Join one if you're needed there — the office is notified straight away.
        </p>
      </div>

      {joinableJobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nothing else on today — you're already on every job scheduled.
        </div>
      ) : (
        <div className="space-y-2">
          {joinableJobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-border bg-card p-3.5">
              <p className="text-sm font-medium">{job.title}</p>
              {job.scheduledTime && <p className="text-xs text-muted-foreground">{job.scheduledTime}</p>}
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                {job.address}
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 w-full"
                disabled={joiningId === job.id}
                onClick={() => join(job.id)}
              >
                <UserPlus className="size-3.5" />
                {joiningId === job.id ? 'Joining…' : 'Join this job'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
