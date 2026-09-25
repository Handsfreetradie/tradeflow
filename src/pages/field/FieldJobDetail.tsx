import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Navigation, Phone, MapPin, Play, Square, Send, AlertTriangle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { JobPhotosCard } from '@/components/jobs/JobPhotosCard'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useFieldJobsStore } from '@/lib/store/field-jobs-store'
import { formatDate } from '@/lib/utils'

function formatDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export default function FieldJobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { loading, getJob, addNote, startJob, finishJob } = useFieldJobsStore()
  const [noteText, setNoteText] = useState('')
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishNote, setFinishNote] = useState('')
  const [cantComplete, setCantComplete] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)

  const job = id ? getJob(id) : undefined
  if (!loading && !job) return <Navigate to="/field/jobs" replace />
  if (!job) return null

  const myId = session?.user.id
  const openSession = [...job.checkIns].reverse().find((c) => c.employeeId === myId && c.checkOut === null)
  const totalMs = job.checkIns.reduce((sum, c) => {
    if (c.employeeId !== myId) return sum
    const start = new Date(c.checkIn).getTime()
    const end = c.checkOut ? new Date(c.checkOut).getTime() : now
    return sum + Math.max(0, end - start)
  }, 0)

  useEffect(() => {
    if (!openSession) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [openSession])

  const handleStart = async () => {
    setBusy(true)
    try {
      await startJob(job.id)
      toast.success('Job started')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not start job')
    } finally {
      setBusy(false)
    }
  }

  const handleFinish = async () => {
    setBusy(true)
    try {
      await finishJob(job.id, finishNote.trim() || undefined, cantComplete)
      toast.success(cantComplete ? "Office has been notified you couldn't complete this job" : 'Job finished for now')
      setFinishNote('')
      setCantComplete(false)
      setFinishOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not finish job')
    } finally {
      setBusy(false)
    }
  }

  const submitNote = async () => {
    if (!noteText.trim()) return
    await addNote(job.id, noteText.trim())
    setNoteText('')
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="border-b border-border bg-card px-5 py-4">
        <button onClick={() => navigate(-1)} className="-ml-1 mb-2 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          <span className="text-xs text-muted-foreground">{job.number}</span>
        </div>
        <h1 className="mt-1 text-lg font-semibold">{job.title}</h1>
        <p className="text-sm text-muted-foreground">{job.customerName}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {job.address}
        </p>
        {job.scheduledTime && <p className="mt-0.5 text-sm text-muted-foreground">{job.scheduledTime} · {formatDate(job.dueDate, { day: 'numeric', month: 'short' })}</p>}

        <div className="mt-3 flex gap-2">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(job.address)}`}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Navigation className="size-4" />
            Navigate
          </a>
          {job.customerPhone && (
            <a
              href={`tel:${job.customerPhone}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-white py-2.5 text-sm font-medium"
            >
              <Phone className="size-4" />
              Call
            </a>
          )}
        </div>
      </div>

      <div className="mx-5 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{openSession ? 'On site since' : 'Total time on job'}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {openSession ? formatDuration(now - new Date(openSession.checkIn).getTime()) : formatDuration(totalMs)}
            </p>
            {openSession && <p className="mt-0.5 text-xs text-muted-foreground">Total so far: {formatDuration(totalMs)}</p>}
          </div>
          {openSession ? (
            <Button variant="danger" disabled={busy} onClick={() => setFinishOpen(true)}>
              <Square />
              End Job
            </Button>
          ) : (
            <Button disabled={busy} onClick={handleStart}>
              <Play />
              Start Job
            </Button>
          )}
        </div>
      </div>

      {job.crew.length > 1 && (
        <div className="mx-5 space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Users className="size-4 text-muted-foreground" />
            Crew on this job
          </p>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {job.crew.map((member) => (
              <div key={member.employeeId} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {member.fullName}
                    {member.employeeId === myId && ' (you)'}
                  </p>
                  {member.tradeRole && <p className="truncate text-xs text-muted-foreground">{member.tradeRole}</p>}
                </div>
                {member.onSite ? (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    On site{member.checkInAt ? ` since ${formatDate(member.checkInAt, { hour: 'numeric', minute: '2-digit' })}` : ''}
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">Not on site</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {job.lineItems.length > 0 && (
        <div className="mx-5 space-y-2">
          <p className="text-sm font-semibold">Scope of work</p>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {job.lineItems.map((li) => (
              <div key={li.id} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                <span>{li.description}</span>
                <span className="text-muted-foreground">×{li.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-5">
        <JobPhotosCard jobId={job.id} offlineCapable />
      </div>

      <div className="mx-5 space-y-2">
        <p className="text-sm font-semibold">Notes</p>
        <div className="flex gap-2">
          <Input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitNote()
            }}
          />
          <Button variant="secondary" onClick={submitNote}>
            <Send />
          </Button>
        </div>
        <div className="space-y-2">
          {[...job.notes].reverse().map((note) => (
            <div key={note.id} className="rounded-lg bg-secondary/50 px-3 py-2 text-sm">
              <p className={note.type === 'status_change' ? 'font-medium' : ''}>{note.text}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {note.author} · {note.timestamp}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish on site</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
              <Input value={finishNote} onChange={(e) => setFinishNote(e.target.value)} placeholder="e.g. Waiting on parts, back tomorrow" className="mt-1" />
            </div>
            <label className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
              <Checkbox checked={cantComplete} onCheckedChange={(v) => setCantComplete(v === true)} className="mt-0.5" />
              <span>
                <span className="flex items-center gap-1.5 font-medium text-warning">
                  <AlertTriangle className="size-3.5" />
                  Can't complete this job
                </span>
                <span className="text-xs text-muted-foreground">Notifies the office to follow up and reschedule.</span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setFinishOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={busy} onClick={handleFinish}>
              Finish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
