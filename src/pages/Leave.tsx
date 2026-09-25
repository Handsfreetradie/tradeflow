import { useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { LeaveStatusBadge } from '@/components/leave/LeaveStatusBadge'
import { useLeaveStore } from '@/lib/store/leave-store'
import { formatDate } from '@/lib/utils'

function formatHoursAsDays(hours: number, weeklyHours: number) {
  const hoursPerDay = weeklyHours / 5
  return hoursPerDay > 0 ? (hours / hoursPerDay).toFixed(1) : '0'
}

export default function Leave() {
  const { employees, requests, loading, getBalance, reviewRequest } = useLeaveStore()
  const [busyId, setBusyId] = useState<string | null>(null)

  const pending = requests.filter((r) => r.status === 'pending')
  const history = requests.filter((r) => r.status !== 'pending')
  const trackedEmployees = employees.filter((e) => e.employmentType !== 'casual')

  const review = async (id: string, approve: boolean) => {
    setBusyId(id)
    try {
      await reviewRequest(id, approve)
      toast.success(approve ? 'Leave approved' : 'Leave declined')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update request')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <p className="p-6 text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leave</h1>
        <p className="mt-1 text-sm text-muted-foreground">Approve requests and see who's accrued what.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending requests</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No pending requests" />
          ) : (
            <div className="divide-y divide-border">
              {pending.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {r.employeeName} · <span className="capitalize">{r.type}</span> leave
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(r.startDate, { day: 'numeric', month: 'short' })} – {formatDate(r.endDate, { day: 'numeric', month: 'short' })}
                      {' · '}
                      {formatHoursAsDays(r.hours, employees.find((e) => e.id === r.employeeId)?.weeklyHours ?? 38)} days
                    </p>
                    {r.note && <p className="mt-0.5 text-xs text-muted-foreground">"{r.note}"</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" size="sm" disabled={busyId === r.id} onClick={() => review(r.id, false)}>
                      <X />
                      Decline
                    </Button>
                    <Button size="sm" disabled={busyId === r.id} onClick={() => review(r.id, true)}>
                      <Check />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team balances</CardTitle>
        </CardHeader>
        <CardContent>
          {trackedEmployees.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No employees on leave tracking" description="Casual staff don't accrue paid leave." />
          ) : (
            <div className="divide-y divide-border">
              {trackedEmployees.map((e) => {
                const balance = getBalance(e.id)
                return (
                  <div key={e.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium">{e.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{e.employmentType.replace('_', ' ')} · {e.weeklyHours} hrs/week</p>
                    </div>
                    {balance ? (
                      <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-xs text-muted-foreground">Annual</p>
                          <p className="font-medium">{formatHoursAsDays(balance.annualAvailableHours, e.weeklyHours)} days</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sick</p>
                          <p className="font-medium">{formatHoursAsDays(balance.sickAvailableHours, e.weeklyHours)} days</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Set employment start date</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {history.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {r.employeeName} · <span className="capitalize">{r.type}</span> leave
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(r.startDate, { day: 'numeric', month: 'short' })} – {formatDate(r.endDate, { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <LeaveStatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
