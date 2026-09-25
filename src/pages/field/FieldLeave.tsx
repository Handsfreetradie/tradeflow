import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LeaveStatusBadge } from '@/components/leave/LeaveStatusBadge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useLeaveStore, type LeaveType } from '@/lib/store/leave-store'
import { formatDate, toDateKey } from '@/lib/utils'

function businessDaysBetween(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  let count = 0
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return count
}

function formatHoursAsDays(hours: number, weeklyHours: number) {
  const hoursPerDay = weeklyHours / 5
  return hoursPerDay > 0 ? (hours / hoursPerDay).toFixed(1) : '0'
}

export default function FieldLeave() {
  const { session } = useAuth()
  const { employees, requests, loading, getBalance, requestLeave } = useLeaveStore()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<LeaveType>('annual')
  const [startDate, setStartDate] = useState(toDateKey(new Date()))
  const [endDate, setEndDate] = useState(toDateKey(new Date()))
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const myId = session?.user.id
  const me = employees.find((e) => e.id === myId)
  const balance = myId ? getBalance(myId) : null
  const myRequests = requests.filter((r) => r.employeeId === myId)

  if (loading) return <p className="p-5 text-sm text-muted-foreground">Loading…</p>

  if (!me || me.employmentType === 'casual') {
    return (
      <div className="p-5">
        <h1 className="text-xl font-semibold">Leave</h1>
        <p className="mt-4 text-sm text-muted-foreground">Leave tracking isn't set up for your employment type yet — check with the office.</p>
      </div>
    )
  }

  const hoursPerDay = me.weeklyHours / 5
  const requestedHours = businessDaysBetween(startDate, endDate) * hoursPerDay

  const submit = async () => {
    if (endDate < startDate || requestedHours <= 0) {
      toast.error('Pick a valid date range')
      return
    }
    setSubmitting(true)
    try {
      await requestLeave({ type, startDate, endDate, hours: requestedHours, note: note.trim() })
      toast.success('Leave request sent')
      setOpen(false)
      setNote('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Leave</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus />
          Request
        </Button>
      </div>

      {balance && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Annual leave</p>
            <p className="mt-1 text-2xl font-semibold">{formatHoursAsDays(balance.annualAvailableHours, me.weeklyHours)}</p>
            <p className="text-xs text-muted-foreground">days available</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Sick / personal</p>
            <p className="mt-1 text-2xl font-semibold">{formatHoursAsDays(balance.sickAvailableHours, me.weeklyHours)}</p>
            <p className="text-xs text-muted-foreground">days available</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold">Your requests</p>
        {myRequests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No leave requests yet.</div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {myRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-3.5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium capitalize">{r.type} leave</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="size-3 shrink-0" />
                    {formatDate(r.startDate, { day: 'numeric', month: 'short' })} – {formatDate(r.endDate, { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <LeaveStatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as LeaveType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual leave</SelectItem>
                  <SelectItem value="sick">Sick / personal leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Start date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">End date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {businessDaysBetween(startDate, endDate)} weekday{businessDaysBetween(startDate, endDate) === 1 ? '' : 's'} · {requestedHours.toFixed(1)} hours
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Family holiday" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={submitting} onClick={submit}>
              {submitting ? 'Sending…' : 'Send request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
