import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useTeamStore } from '@/lib/store/team-store'
import type { Job, JobStatus } from '@/lib/demo-data'
import { assigneeColor, initials } from '@/lib/assigneeColors'
import { cn, formatCurrency, toDateKey } from '@/lib/utils'

const statusDot: Record<JobStatus, string> = {
  'In Progress': 'bg-primary',
  Scheduled: 'bg-success',
  Completed: 'bg-muted-foreground',
  'On Hold': 'bg-purple',
  Cancelled: 'bg-destructive',
}

function startOfMonthGrid(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const weekday = (first.getDay() + 6) % 7 // Monday = 0
  const start = new Date(first)
  start.setDate(first.getDate() - weekday)
  return start
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const { jobs, updateDueDate, updateAssignee } = useJobsStore()
  const { team } = useTeamStore()
  const teamMembers = team.map((m) => m.fullName)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(() => toDateKey(new Date()))
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [dragOverDay, setDragOverDay] = useState<string | null>(null)
  const [draggingJobId, setDraggingJobId] = useState<string | null>(null)

  const visibleJobs = useMemo(
    () => (assigneeFilter === 'all' ? jobs : jobs.filter((j) => j.assignedTo === assigneeFilter)),
    [jobs, assigneeFilter]
  )

  const jobsByDay = useMemo(() => {
    const map = new Map<string, Job[]>()
    for (const job of visibleJobs) map.set(job.dueDate, [...(map.get(job.dueDate) ?? []), job])
    return map
  }, [visibleJobs])

  const days = useMemo(() => {
    const start = startOfMonthGrid(month)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [month])

  const todayKey = toDateKey(new Date())
  const selectedJobs = jobsByDay.get(selectedDay) ?? []

  const handleDrop = (dayKey: string) => {
    setDragOverDay(null)
    if (!draggingJobId) return
    const job = jobs.find((j) => j.id === draggingJobId)
    setDraggingJobId(null)
    if (!job || job.dueDate === dayKey) return
    updateDueDate(job.id, dayKey)
    toast.success(`${job.title} moved to ${new Date(dayKey).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Jobs and appointments — drag a job to reschedule it.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              {teamMembers.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => navigate(`/jobs/new?dueDate=${selectedDay}`)}>
            <Plus />
            New Job
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">{month.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const now = new Date()
                    setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
                    setSelectedDay(toDateKey(now))
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-xs">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="bg-secondary px-2 py-1.5 text-center font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const key = toDateKey(day)
                const inMonth = day.getMonth() === month.getMonth()
                const dayJobs = jobsByDay.get(key) ?? []
                const isToday = key === todayKey
                const isSelected = key === selectedDay
                const isDragOver = key === dragOverDay
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDay(key)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (dragOverDay !== key) setDragOverDay(key)
                    }}
                    onDragLeave={() => setDragOverDay((prev) => (prev === key ? null : prev))}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleDrop(key)
                    }}
                    className={cn(
                      'flex min-h-[84px] flex-col items-start gap-1 bg-card p-1.5 text-left transition-colors hover:bg-secondary/60',
                      !inMonth && 'bg-secondary/30 text-muted-foreground',
                      isSelected && 'ring-2 ring-inset ring-primary',
                      isDragOver && 'bg-primary/10 ring-2 ring-inset ring-primary'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-5 items-center justify-center rounded-full text-[11px] font-medium',
                        isToday && 'bg-primary text-white'
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <div className="flex w-full flex-col gap-0.5">
                      {dayJobs.slice(0, 3).map((job) => {
                        const color = assigneeColor(job.assignedTo)
                        return (
                          <span
                            key={job.id}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation()
                              e.dataTransfer.effectAllowed = 'move'
                              setDraggingJobId(job.id)
                            }}
                            onDragEnd={() => setDraggingJobId(null)}
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/jobs/${job.id}`)
                            }}
                            className={cn(
                              'flex cursor-grab items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium active:cursor-grabbing',
                              color.bg,
                              color.text
                            )}
                            title={`${job.title} — ${job.assignedTo}`}
                          >
                            <span className={cn('size-1.5 shrink-0 rounded-full', statusDot[job.status])} />
                            <span className="truncate">{job.title}</span>
                          </span>
                        )
                      })}
                      {dayJobs.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayJobs.length - 3} more</span>}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Status:</span>
                {(Object.keys(statusDot) as JobStatus[]).map((s) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className={cn('size-2 rounded-full', statusDot[s])} />
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Team:</span>
                {teamMembers.map((m) => (
                  <span key={m} className="flex items-center gap-1.5">
                    <span className={cn('size-2 rounded-full', assigneeColor(m).dot)} />
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold">
              {new Date(selectedDay).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedJobs.length} job{selectedJobs.length === 1 ? '' : 's'} scheduled
            </p>

            <div
              className={cn('mt-4 rounded-lg transition-colors', dragOverDay === selectedDay && 'bg-primary/10 ring-2 ring-primary')}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverDay(selectedDay)
              }}
              onDragLeave={() => setDragOverDay((prev) => (prev === selectedDay ? null : prev))}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(selectedDay)
              }}
            >
              {selectedJobs.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No jobs this day" description="Schedule one, or drag a job here." />
              ) : (
                <div className="space-y-2 p-1">
                  {selectedJobs.map((job) => {
                    const color = assigneeColor(job.assignedTo)
                    return (
                      <div
                        key={job.id}
                        draggable
                        onDragStart={() => setDraggingJobId(job.id)}
                        onDragEnd={() => setDraggingJobId(null)}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="flex w-full cursor-grab flex-col gap-1.5 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/60 active:cursor-grabbing"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{job.title}</p>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">{job.customer}</p>
                        {job.scheduledTime && <p className="text-xs text-muted-foreground">{job.scheduledTime}</p>}
                        <div className="flex items-center justify-between gap-2">
                          <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                            <Select
                              value={job.assignedToId ?? 'unassigned'}
                              onValueChange={(v) => {
                                if (v === 'unassigned') return updateAssignee(job.id, null, '')
                                const member = team.find((m) => m.id === v)
                                if (member) updateAssignee(job.id, member.id, member.fullName)
                              }}
                            >
                              <SelectTrigger
                                className={cn(
                                  'h-auto w-auto gap-1 rounded-full border-none px-1.5 py-0.5 text-[11px] font-medium shadow-none',
                                  color.bg,
                                  color.text
                                )}
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className="flex size-4 items-center justify-center rounded-full bg-white/60 text-[9px]">
                                    {job.assignedTo ? initials(job.assignedTo) : '–'}
                                  </span>
                                  {job.assignedTo || 'Unassigned'}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {team.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-xs font-medium">{formatCurrency(job.value)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
