import { useEffect, useState } from 'react'
import { Play, Square, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useAuth } from '@/lib/auth/AuthProvider'
import { assigneeColor, initials } from '@/lib/assigneeColors'
import { cn } from '@/lib/utils'
import type { Job } from '@/lib/demo-data'

function formatDuration(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}

export function JobCheckInCard({ job }: { job: Job }) {
  const { startJob, finishJob } = useJobsStore()
  const { session, fullName } = useAuth()
  const [now, setNow] = useState(() => Date.now())
  const [finishOpen, setFinishOpen] = useState(false)
  const [note, setNote] = useState('')

  const myId = session?.user.id
  const employee = fullName ?? 'You'
  const openSession = [...job.checkIns].reverse().find((c) => c.employeeId === myId && c.checkOut === null)

  useEffect(() => {
    if (!openSession) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [openSession])

  const totalMs = job.checkIns.reduce((sum, c) => {
    const start = new Date(c.checkIn).getTime()
    const end = c.checkOut ? new Date(c.checkOut).getTime() : now
    return sum + Math.max(0, end - start)
  }, 0)

  const submitFinish = async () => {
    await finishJob(job.id, note.trim() || undefined)
    setNote('')
    setFinishOpen(false)
  }

  const color = assigneeColor(employee)
  const pastSessions = [...job.checkIns].reverse()

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle>On-Site Time</CardTitle>
          <p className="text-sm text-muted-foreground">Employee-only — never shown on invoices or reports.</p>
        </div>
        <span className={cn('flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium', color.bg, color.text)}>
          <span className="flex size-4 items-center justify-center rounded-full bg-white/60 text-[9px]">{initials(employee)}</span>
          {employee}
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-4">
          <div>
            <p className="text-xs text-muted-foreground">{openSession ? 'On site since' : 'Total time on job'}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {openSession ? formatDuration(now - new Date(openSession.checkIn).getTime()) : formatDuration(totalMs)}
            </p>
            {openSession && <p className="mt-0.5 text-xs text-muted-foreground">Total so far: {formatDuration(totalMs)}</p>}
          </div>
          {openSession ? (
            <Button variant="danger" onClick={() => setFinishOpen(true)}>
              <Square />
              Finish
            </Button>
          ) : (
            <Button onClick={() => startJob(job.id)}>
              <Play />
              Start Job
            </Button>
          )}
        </div>

        {pastSessions.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Clock className="size-3.5" />
              Session history
            </p>
            {pastSessions.map((c) => {
              const start = new Date(c.checkIn)
              const end = c.checkOut ? new Date(c.checkOut) : null
              return (
                <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/60">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} ·{' '}
                      {start.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })} –{' '}
                      {end ? end.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) : 'ongoing'}
                    </p>
                    {c.note && <p className="truncate text-xs text-muted-foreground">{c.note}</p>}
                  </div>
                  <p className="shrink-0 text-xs font-medium text-muted-foreground">
                    {formatDuration((end ? end.getTime() : now) - start.getTime())}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish on site</DialogTitle>
          </DialogHeader>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Waiting on parts, back tomorrow" className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setFinishOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submitFinish}>
              Finish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
