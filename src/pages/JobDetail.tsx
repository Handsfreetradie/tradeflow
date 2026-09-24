import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, Image as ImageIcon, MapPin, CalendarDays, Phone, Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineItemsTable } from '@/components/shared/LineItemsTable'
import { JobCostingCard } from '@/components/jobs/JobCostingCard'
import { JobCheckInCard } from '@/components/jobs/JobCheckInCard'
import { JobWorkflow } from '@/components/jobs/JobWorkflow'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useTeamStore } from '@/lib/store/team-store'
import type { JobStatus } from '@/lib/demo-data'
import { assigneeColor, initials } from '@/lib/assigneeColors'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

const allStatuses: JobStatus[] = ['Scheduled', 'In Progress', 'Completed', 'On Hold', 'Cancelled']

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading, getJob, updateJobStatus, updateAssignee, addNote } = useJobsStore()
  const { getCustomer } = useCustomersStore()
  const { team } = useTeamStore()
  const [noteText, setNoteText] = useState('')

  const job = id ? getJob(id) : undefined
  if (!loading && !job) return <Navigate to="/jobs" replace />
  if (!job) return null

  const customer = getCustomer(job.customerId)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/jobs')} className="-ml-2">
        <ArrowLeft />
        Back to jobs
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-muted-foreground">{job.number}</span>
            <StatusBadge status={job.status} />
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {job.address}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              Update status
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allStatuses.map((status) => (
              <DropdownMenuItem key={status} disabled={status === job.status} onClick={() => updateJobStatus(job.id, status)}>
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <JobWorkflow job={job} />

      <JobCheckInCard job={job} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scope of Work</CardTitle>
            </CardHeader>
            <CardContent>
              <LineItemsTable lineItems={job.lineItems} />
            </CardContent>
          </Card>

          <JobCostingCard job={job} />

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              {job.photos > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: job.photos }).map((_, i) => (
                    <div key={i} className="flex aspect-square items-center justify-center rounded-lg bg-secondary">
                      <ImageIcon className="size-5 text-muted-foreground" />
                    </div>
                  ))}
                  <button className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:bg-secondary">
                    <Camera className="size-5" />
                  </button>
                </div>
              ) : (
                <button className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-muted-foreground transition-colors hover:bg-secondary">
                  <Camera className="size-6" />
                  <span className="text-sm">Add job photos</span>
                </button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity & Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note about this job..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addNote(job.id, noteText)
                      setNoteText('')
                    }
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    addNote(job.id, noteText)
                    setNoteText('')
                  }}
                >
                  <Send />
                </Button>
              </div>

              <ul className="mt-5 space-y-4">
                {[...job.notes].reverse().map((note, i) => (
                  <li key={note.id} className="relative flex gap-3">
                    {i !== job.notes.length - 1 && (
                      <span className="absolute left-[15px] top-8 h-[calc(100%-4px)] w-px bg-border" />
                    )}
                    <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                      {note.author.split(' ').map((p) => p[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1 pb-0.5">
                      <p className="text-sm">
                        {note.type === 'status_change' ? <span className="font-medium">{note.text}</span> : note.text}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {note.author} · {note.timestamp}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => navigate(`/customers/${job.customerId}`)}
                className="text-left text-sm font-medium text-primary hover:underline"
              >
                {job.customer}
              </button>
              {customer && (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Phone className="size-3.5 shrink-0" />
                    {customer.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="size-3.5 shrink-0" />
                    {customer.email}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="size-3.5 shrink-0" />
                    {customer.address}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Assigned to</span>
                <Select
                  value={job.assignedToId ?? 'unassigned'}
                  onValueChange={(v) => {
                    if (v === 'unassigned') return updateAssignee(job.id, null, '')
                    const member = team.find((m) => m.id === v)
                    if (member) updateAssignee(job.id, member.id, member.fullName)
                  }}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue>
                      {job.assignedTo ? (
                        <span className="flex items-center gap-1.5">
                          <span className={cn('flex size-4 items-center justify-center rounded-full text-[9px] font-semibold', assigneeColor(job.assignedTo).bg, assigneeColor(job.assignedTo).text)}>
                            {initials(job.assignedTo)}
                          </span>
                          {job.assignedTo}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </SelectValue>
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
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  Due date
                </span>
                <span className="font-medium">{formatDate(job.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              {job.scheduledTime && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Scheduled time</span>
                  <span className="font-medium">{job.scheduledTime}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pricing type</span>
                <span className="font-medium">{job.pricingType}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">Contract value</span>
                <span className="font-semibold">{formatCurrency(job.value)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
