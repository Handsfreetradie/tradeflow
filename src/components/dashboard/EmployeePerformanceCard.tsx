import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatCurrency } from '@/lib/utils'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useTeamStore } from '@/lib/store/team-store'
import { supabase } from '@/lib/supabase'

type Range = '30' | 'month'

interface EmployeeStat {
  id: string
  name: string
  hours: number
  jobsCompleted: number
  revenue: number
  firstTimeFixRate: number | null
}

/** Employees raise this notification themselves via the "Can't complete this job" flow when a job needs a return visit — the only signal we have for a job not being fixed on the first attempt. */
function useBlockedJobCounts(sinceMs: number) {
  const [countsByEmployee, setCountsByEmployee] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    let cancelled = false
    supabase
      .from('notifications')
      .select('job_id, created_by')
      .eq('type', 'job_blocked')
      .gte('created_at', new Date(sinceMs).toISOString())
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        const seenPerEmployee = new Map<string, Set<string>>()
        for (const row of data) {
          if (!row.created_by || !row.job_id) continue
          const jobs = seenPerEmployee.get(row.created_by) ?? new Set<string>()
          jobs.add(row.job_id)
          seenPerEmployee.set(row.created_by, jobs)
        }
        setCountsByEmployee(new Map(Array.from(seenPerEmployee.entries()).map(([id, jobs]) => [id, jobs.size])))
      })
    return () => {
      cancelled = true
    }
  }, [sinceMs])

  return countsByEmployee
}

function startOfRange(range: Range) {
  const now = new Date()
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  const d = new Date(now)
  d.setDate(d.getDate() - 30)
  return d
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: EmployeeStat }> }) {
  if (!active || !payload?.length) return null
  const stat = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{stat.name}</p>
      <p className="mt-1 text-muted-foreground">{stat.hours.toFixed(1)}h on site</p>
      <p className="text-muted-foreground">
        {stat.jobsCompleted} job{stat.jobsCompleted === 1 ? '' : 's'} completed
      </p>
      {stat.firstTimeFixRate !== null && <p className="text-muted-foreground">{stat.firstTimeFixRate}% fixed first time</p>}
      <p className="text-muted-foreground">{formatCurrency(stat.revenue)} revenue</p>
    </div>
  )
}

export function EmployeePerformanceCard() {
  const [range, setRange] = useState<Range>('30')
  const { jobs } = useJobsStore()
  const { team } = useTeamStore()
  const since = useMemo(() => startOfRange(range), [range])
  const blockedCounts = useBlockedJobCounts(since.getTime())

  const stats = useMemo<EmployeeStat[]>(() => {
    const employees = team.filter((m) => m.role === 'employee')
    if (employees.length === 0) return []
    const now = Date.now()

    return employees
      .map((emp) => {
        let hours = 0
        let jobsCompleted = 0
        let revenue = 0

        for (const job of jobs) {
          const isAssigned = job.assignees.some((a) => a.id === emp.id)
          if (!isAssigned) continue

          for (const ci of job.checkIns) {
            if (ci.employeeId !== emp.id) continue
            const start = new Date(ci.checkIn).getTime()
            const end = ci.checkOut ? new Date(ci.checkOut).getTime() : now
            if (end < since.getTime()) continue
            const clampedStart = Math.max(start, since.getTime())
            hours += Math.max(0, end - clampedStart) / 3_600_000
          }

          if (job.status === 'Completed') {
            const completedInRange = job.checkIns.some(
              (ci) => ci.employeeId === emp.id && ci.checkOut && new Date(ci.checkOut).getTime() >= since.getTime()
            )
            if (completedInRange) {
              jobsCompleted += 1
              revenue += job.value / Math.max(1, job.assignees.length)
            }
          }
        }

        const blocked = Math.min(blockedCounts.get(emp.id) ?? 0, jobsCompleted)
        const firstTimeFixRate = jobsCompleted > 0 ? Math.round(((jobsCompleted - blocked) / jobsCompleted) * 100) : null

        return { id: emp.id, name: emp.fullName, hours, jobsCompleted, revenue, firstTimeFixRate }
      })
      .sort((a, b) => b.hours - a.hours)
  }, [team, jobs, since, blockedCounts])

  const hasEmployees = team.some((m) => m.role === 'employee')

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Employee Performance</CardTitle>
        <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
          <TabsList>
            <TabsTrigger value="30">30 days</TabsTrigger>
            <TabsTrigger value="month">This month</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {!hasEmployees ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Add employees in Settings to see performance here.</p>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} barGap={4} margin={{ left: 0, right: 8 }}>
                <CartesianGrid vertical={false} stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(215 16% 47%)" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="hsl(215 16% 47%)"
                  tickFormatter={(v) => `${v}h`}
                  width={40}
                />
                <RechartsTooltip cursor={{ fill: 'hsl(210 20% 95%)' }} content={<CustomTooltip />} />
                <Bar dataKey="hours" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {hasEmployees && stats.length > 0 && (
          <div className="mt-4 space-y-1 border-t border-border pt-3">
            {stats.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="min-w-0 truncate font-medium">{s.name}</span>
                <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    {s.jobsCompleted} job{s.jobsCompleted === 1 ? '' : 's'}
                  </span>
                  {s.firstTimeFixRate !== null ? (
                    <span
                      className={cn(
                        'font-medium',
                        s.firstTimeFixRate >= 90 ? 'text-success' : s.firstTimeFixRate >= 70 ? 'text-warning' : 'text-destructive'
                      )}
                    >
                      {s.firstTimeFixRate}% first-time fix
                    </span>
                  ) : (
                    <span>No jobs completed</span>
                  )}
                  <span className="font-medium text-foreground">{formatCurrency(s.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
