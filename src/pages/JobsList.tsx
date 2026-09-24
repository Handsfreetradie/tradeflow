import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, Briefcase, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useJobsStore } from '@/lib/store/jobs-store'
import type { JobStatus } from '@/lib/demo-data'
import { formatCurrency, formatDate } from '@/lib/utils'

type SortKey = 'dueDate' | 'value'

const statusFilters: (JobStatus | 'All')[] = ['All', 'Scheduled', 'In Progress', 'Completed', 'On Hold', 'Cancelled']

export default function JobsList() {
  const { jobs } = useJobsStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<JobStatus | 'All'>('All')
  const [sortKey, setSortKey] = useState<SortKey>('dueDate')
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    let result = jobs
    if (status !== 'All') result = result.filter((j) => j.status === status)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (j) => j.title.toLowerCase().includes(q) || j.customer.toLowerCase().includes(q) || j.number.toLowerCase().includes(q)
      )
    }
    return [...result].sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      if (sortKey === 'value') return (a.value - b.value) * dir
      return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * dir
    })
  }, [jobs, search, status, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">{jobs.length} jobs total</p>
        </div>
        <Button onClick={() => navigate('/jobs/new')}>
          <Plus />
          New Job
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs, customers..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as JobStatus | 'All')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'All' ? 'All statuses' : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs match your filters"
              description="Try a different search term or status."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead className="hidden lg:table-cell">Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort('value')} className="flex items-center gap-1 hover:text-foreground">
                      Value
                      <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort('dueDate')} className="flex items-center gap-1 hover:text-foreground">
                      Due
                      <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((job) => (
                  <TableRow key={job.id} className="cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                    <TableCell>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.number}</p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{job.customer}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{job.address}</TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(job.value)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(job.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
