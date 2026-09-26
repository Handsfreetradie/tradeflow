import { useMemo } from 'react'
import { toast } from 'sonner'
import { Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useOnCallStore, mondayOf } from '@/lib/store/on-call-store'
import { useTeamStore } from '@/lib/store/team-store'
import { formatDate } from '@/lib/utils'

const WEEKS_AHEAD = 10

function addDays(dateKey: string, days: number) {
  const d = new Date(dateKey)
  d.setDate(d.getDate() + days)
  return d
}

export default function OnCallRoster() {
  const { roster, loading, assignWeek } = useOnCallStore()
  const { team } = useTeamStore()
  const employees = team.filter((m) => m.role === 'employee')

  const weeks = useMemo(() => {
    const startOfThisWeek = mondayOf(new Date())
    return Array.from({ length: WEEKS_AHEAD }, (_, i) => addDays(startOfThisWeek, i * 7))
  }, [])

  const assign = async (weekStart: string, employeeId: string) => {
    try {
      await assignWeek(weekStart, employeeId === 'unassigned' ? null : employeeId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the roster')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">On-call roster</h1>
        <p className="mt-1 text-sm text-muted-foreground">Assign one employee per week — everyone can see who's on call.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            Weekly assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-sm text-muted-foreground">Loading…</p>
          ) : employees.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Add employees in Settings to build a roster.</p>
          ) : (
            <div className="divide-y divide-border">
              {weeks.map((weekDate) => {
                const weekStart = mondayOf(weekDate)
                const weekEnd = addDays(weekStart, 6)
                const isThisWeek = weekStart === mondayOf(new Date())
                const entry = roster.find((r) => r.weekStart === weekStart)
                return (
                  <div key={weekStart} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(weekStart, { day: 'numeric', month: 'short' })} – {formatDate(weekEnd, { day: 'numeric', month: 'short' })}
                        {isThisWeek && <span className="ml-2 text-xs font-medium text-primary">This week</span>}
                      </p>
                    </div>
                    <Select value={entry?.employeeId ?? 'unassigned'} onValueChange={(v) => assign(weekStart, v)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {employees.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
