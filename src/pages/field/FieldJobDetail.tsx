import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Navigation, Phone, MapPin, Play, Square, Send, AlertTriangle, Users, ListChecks, Receipt, X, Clock, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SignaturePad } from '@/components/shared/SignaturePad'
import { JobPhotosCard } from '@/components/jobs/JobPhotosCard'
import { FieldMaterialsCard } from '@/components/field/FieldMaterials'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useFieldJobsStore, type NewFieldJobCostInput } from '@/lib/store/field-jobs-store'
import { uploadJobCostReceipt } from '@/lib/api/receipts'
import { formatDate } from '@/lib/utils'
import type { JobCheckIn, JobStage } from '@/lib/demo-data'

const MAX_RECEIPT_BYTES = 8 * 1024 * 1024

function formatDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

function FieldStageRow({
  jobId,
  stage,
  onUpdate,
}: {
  jobId: string
  stage: JobStage
  onUpdate: (stageId: string, jobId: string, patch: { complete?: boolean; notes?: string }) => Promise<void>
}) {
  const [notes, setNotes] = useState(stage.notes)

  const saveNotes = () => {
    if (notes === stage.notes) return
    onUpdate(stage.id, jobId, { notes }).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to save note'))
  }

  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-start gap-2.5">
        <Checkbox
          checked={stage.status === 'complete'}
          onCheckedChange={(v) => onUpdate(stage.id, jobId, { complete: v === true }).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to update'))}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className={stage.status === 'complete' ? 'text-sm font-medium line-through text-muted-foreground' : 'text-sm font-medium'}>{stage.name}</p>
          {stage.targetDate && <p className="text-xs text-muted-foreground">Target {formatDate(stage.targetDate, { day: 'numeric', month: 'short' })}</p>}
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Notes for this stage..." className="h-8 text-xs" />
        </div>
      </div>
    </div>
  )
}

function FieldLogExpenseDialog({
  jobId,
  open,
  onOpenChange,
  onSubmit,
}: {
  jobId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: NewFieldJobCostInput) => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<NewFieldJobCostInput['category']>('Materials')
  const [amount, setAmount] = useState('')
  const [supplier, setSupplier] = useState('')
  const [receiptPath, setReceiptPath] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => {
    setDescription('')
    setCategory('Materials')
    setAmount('')
    setSupplier('')
    setReceiptPath(null)
    setReceiptPreview(null)
    setSignature(null)
  }

  const handleReceiptSelected = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_RECEIPT_BYTES) {
      toast.error('Receipt photo is too large (max 8MB)')
      return
    }
    setReceiptPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      setReceiptPath(await uploadJobCostReceipt(jobId, file))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't upload that photo")
      setReceiptPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeReceipt = () => {
    setReceiptPath(null)
    setReceiptPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canSubmit = description.trim() && Number(amount) > 0 && !!signature

  const closeDialog = () => {
    reset()
    onOpenChange(false)
  }

  const submit = async () => {
    if (!canSubmit || !signature) return
    setSubmitting(true)
    try {
      await onSubmit({
        description: description.trim(),
        category,
        amount: Number(amount),
        supplier: supplier.trim() || undefined,
        receiptStoragePath: receiptPath ?? undefined,
        signatureDataUrl: signature,
      })
      toast.success('Expense logged')
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to log expense')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : closeDialog())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log an expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">What did you buy?</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Cable & fittings" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as NewFieldJobCostInput['category'])}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Materials">Materials</SelectItem>
                  <SelectItem value="Labour">Labour</SelectItem>
                  <SelectItem value="Subcontractor">Subcontractor</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount ($)</label>
              <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Supplier (optional)</label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. CMI Electrical Wholesale" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Receipt photo (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleReceiptSelected(e.target.files?.[0])}
            />
            {receiptPreview ? (
              <div className="mt-1 flex items-center gap-3">
                <img src={receiptPreview} alt="Receipt preview" className="h-14 w-14 rounded-lg border border-border object-cover" />
                <p className="flex-1 text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Photo attached'}</p>
                <Button variant="ghost" size="icon" onClick={removeReceipt} disabled={uploading}>
                  <X />
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" className="mt-1" onClick={() => fileInputRef.current?.click()}>
                <Receipt />
                Take a photo
              </Button>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Your signature</label>
            <div className="mt-1">
              <SignaturePad value={signature} onChange={setSignature} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={closeDialog}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || submitting || uploading} onClick={submit}>
            {submitting ? 'Logging…' : 'Log expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function toDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Add a session the employee forgot to start, or correct one of their own. The office sees it
 * flagged as manually entered, with this note. */
function FieldTimeDialog({
  open,
  onOpenChange,
  session,
  hasOpenSession,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The session being edited; undefined when adding a missed one. */
  session?: JobCheckIn
  hasOpenSession: boolean
  onSubmit: (input: { checkIn: string; checkOut: string | null; note: string; checkinId?: string }) => Promise<void>
}) {
  const [date, setDate] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [stillOnSite, setStillOnSite] = useState(false)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset the form each time the dialog opens, from the session being edited (or sensible defaults).
  useEffect(() => {
    if (!open) return
    const startDate = session ? new Date(session.checkIn) : new Date()
    setDate(toDateInput(startDate))
    setStart(session ? toTimeInput(startDate) : '07:00')
    setEnd(session?.checkOut ? toTimeInput(new Date(session.checkOut)) : session ? '' : toTimeInput(new Date()))
    setStillOnSite(session ? session.checkOut === null : false)
    setNote('')
  }, [open, session])

  const canSubmit = !!date && !!start && (stillOnSite || !!end) && note.trim().length > 0

  const submit = async () => {
    const checkIn = new Date(`${date}T${start}`)
    const checkOut = stillOnSite ? null : new Date(`${date}T${end}`)
    if (checkOut && checkOut <= checkIn) {
      toast.error('Finish time must be after the start time')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ checkIn: checkIn.toISOString(), checkOut: checkOut?.toISOString() ?? null, note: note.trim(), checkinId: session?.id })
      toast.success(session ? 'Time updated — the office has been flagged' : 'Time added — the office has been flagged')
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save your time')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session ? 'Change your time' : 'Add time you forgot to log'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Input type="date" value={date} max={toDateInput(new Date())} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Started</label>
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Finished</label>
              <Input type="time" value={end} disabled={stillOnSite} onChange={(e) => setEnd(e.target.value)} className="mt-1" />
            </div>
          </div>
          {(session ? session.checkOut === null : !hasOpenSession) ? (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={stillOnSite} onCheckedChange={(v) => setStillOnSite(v === true)} />
              I'm still on site (start the clock from this time)
            </label>
          ) : null}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Why? (required)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Forgot to press Start when I arrived" className="mt-1" />
          </div>
          <p className="text-xs text-muted-foreground">The office will see this was added by you, with your note.</p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || submitting} onClick={submit}>
            {submitting ? 'Saving…' : 'Save time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function FieldJobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { loading, getJob, addNote, startJob, finishJob, setJobTime, updateStage, addJobCost, leaveJob } = useFieldJobsStore()
  const [leaving, setLeaving] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishNote, setFinishNote] = useState('')
  const [cantComplete, setCantComplete] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [timeDialog, setTimeDialog] = useState<{ open: boolean; session?: JobCheckIn }>({ open: false })

  const job = id ? getJob(id) : undefined
  const myId = session?.user.id
  const openSession = job ? [...job.checkIns].reverse().find((c) => c.employeeId === myId && c.checkOut === null) : undefined

  useEffect(() => {
    if (!openSession) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [openSession])

  if (!loading && !job) return <Navigate to="/field/jobs" replace />
  if (!job) return <p className="p-5 text-sm text-muted-foreground">Loading…</p>

  const mySessions = job.checkIns.filter((c) => c.employeeId === myId).sort((a, b) => b.checkIn.localeCompare(a.checkIn))

  const totalMs = job.checkIns.reduce((sum, c) => {
    if (c.employeeId !== myId) return sum
    const start = new Date(c.checkIn).getTime()
    const end = c.checkOut ? new Date(c.checkOut).getTime() : now
    return sum + Math.max(0, end - start)
  }, 0)

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
      toast.success(cantComplete ? "Office has been notified you couldn't complete this job" : 'Job marked complete')
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

  const handleLeave = async () => {
    if (!window.confirm("Leave this job? The office will be notified.")) return
    setLeaving(true)
    try {
      await leaveJob(job.id)
      toast.success('Removed from job')
      navigate('/field/jobs')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not leave this job')
      setLeaving(false)
    }
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

      <div className="mx-5 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="size-3.5" />
            Your time on this job
          </p>
          <button
            type="button"
            onClick={() => setTimeDialog({ open: true })}
            className="text-xs font-medium text-primary"
          >
            Forgot to start? Add time
          </button>
        </div>
        {mySessions.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <div className="mt-2 space-y-1">
            {mySessions.map((c) => {
              const start = new Date(c.checkIn)
              const end = c.checkOut ? new Date(c.checkOut) : null
              return (
                <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} ·{' '}
                      {start.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })} –{' '}
                      {end ? end.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) : 'now'}
                    </p>
                    {(c.enteredManually || c.editedAt) && (
                      <p className="truncate text-xs text-warning">
                        {c.enteredManually ? 'Added by you' : 'Changed by you'}
                        {c.editNote ? ` — ${c.editNote}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{formatDuration((end ? end.getTime() : now) - start.getTime())}</span>
                    <button
                      type="button"
                      aria-label="Change this time"
                      onClick={() => setTimeDialog({ open: true, session: c })}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <FieldTimeDialog
        open={timeDialog.open}
        onOpenChange={(o) => setTimeDialog((prev) => ({ ...prev, open: o }))}
        session={timeDialog.session}
        hasOpenSession={!!openSession}
        onSubmit={(input) => setJobTime(job.id, input)}
      />

      <FieldMaterialsCard jobId={job.id} />

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

      <div className="mx-5">
        <button onClick={handleLeave} disabled={leaving} className="text-xs font-medium text-destructive">
          {leaving ? 'Leaving…' : 'Leave this job'}
        </button>
      </div>

      {job.stages.length > 0 && (
        <div className="mx-5 space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <ListChecks className="size-4 text-muted-foreground" />
            Stages
          </p>
          <div className="space-y-2">
            {job.stages.map((stage) => (
              <FieldStageRow key={stage.id} jobId={job.id} stage={stage} onUpdate={updateStage} />
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
        <p className="text-sm font-semibold">Expenses</p>
        <Button variant="secondary" className="mt-2 w-full" onClick={() => setExpenseOpen(true)}>
          <Receipt />
          Log an expense
        </Button>
      </div>

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
            <DialogTitle>{cantComplete ? "Can't complete this job" : 'Complete this job?'}</DialogTitle>
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
                <span className="text-xs text-muted-foreground">Notifies the office to follow up and reschedule — leaves the job open instead of completing it.</span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setFinishOpen(false)}>
              Cancel
            </Button>
            <Button variant={cantComplete ? 'danger' : 'primary'} disabled={busy} onClick={handleFinish}>
              {cantComplete ? 'Notify office' : 'Complete job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FieldLogExpenseDialog jobId={job.id} open={expenseOpen} onOpenChange={setExpenseOpen} onSubmit={(input) => addJobCost(job.id, input)} />
    </div>
  )
}
