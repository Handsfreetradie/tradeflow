import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import type { JobCheckIn, JobNote, JobStatus } from '@/lib/demo-data'

export interface FieldLineItem {
  id: string
  description: string
  qty: number
}

export interface FieldJob {
  id: string
  number: string
  title: string
  customerId: string
  customerName: string
  customerContact: string
  customerPhone: string
  address: string
  status: JobStatus
  dueDate: string
  scheduledTime?: string
  lineItems: FieldLineItem[]
  notes: JobNote[]
  checkIns: JobCheckIn[]
}

interface FieldJobsContextValue {
  jobs: FieldJob[]
  loading: boolean
  getJob: (id: string) => FieldJob | undefined
  addNote: (id: string, text: string) => Promise<void>
  startJob: (id: string) => Promise<void>
  finishJob: (id: string, note?: string) => Promise<void>
  refresh: () => void
}

const FieldJobsContext = createContext<FieldJobsContextValue | null>(null)

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function FieldJobsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [jobs, setJobs] = useState<FieldJob[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: jobRows, error } = await supabase.from('jobs_field_view').select('*').order('due_date')
    if (error || !jobRows) {
      setJobs([])
      setLoading(false)
      return
    }
    const jobIds = jobRows.map((j) => j.id).filter((id): id is string => !!id)
    if (jobIds.length === 0) {
      setJobs([])
      setLoading(false)
      return
    }

    const [{ data: customerRows }, { data: lineItemRows }, { data: noteRows }, { data: checkinRows }] = await Promise.all([
      supabase.from('customers_field_view').select('*'),
      supabase.from('job_line_items_field_view').select('*').in('job_id', jobIds).order('sort_order'),
      supabase.from('job_notes').select('*').in('job_id', jobIds).order('created_at'),
      supabase.from('job_checkins').select('*, employee:profiles(full_name)').in('job_id', jobIds).order('check_in'),
    ])

    const customersById = new Map((customerRows ?? []).map((c) => [c.id as string, c]))
    const lineItemsByJob = new Map<string, FieldLineItem[]>()
    for (const li of lineItemRows ?? []) {
      if (!li.job_id) continue
      const arr = lineItemsByJob.get(li.job_id) ?? []
      arr.push({ id: li.id!, description: li.description ?? '', qty: li.qty ?? 1 })
      lineItemsByJob.set(li.job_id, arr)
    }
    const notesByJob = new Map<string, JobNote[]>()
    for (const n of noteRows ?? []) {
      const arr = notesByJob.get(n.job_id) ?? []
      arr.push({ id: n.id, type: n.type as JobNote['type'], author: n.author_name, text: n.text, timestamp: formatTimestamp(n.created_at) })
      notesByJob.set(n.job_id, arr)
    }
    const checkinsByJob = new Map<string, JobCheckIn[]>()
    for (const ci of (checkinRows ?? []) as Array<{
      id: string
      job_id: string
      employee_id: string
      check_in: string
      check_out: string | null
      note: string | null
      employee: { full_name: string } | null
    }>) {
      const arr = checkinsByJob.get(ci.job_id) ?? []
      arr.push({
        id: ci.id,
        employeeId: ci.employee_id,
        employeeName: ci.employee?.full_name ?? 'You',
        checkIn: ci.check_in,
        checkOut: ci.check_out,
        note: ci.note ?? undefined,
      })
      checkinsByJob.set(ci.job_id, arr)
    }

    const assembled: FieldJob[] = jobRows.map((row) => {
      const customer = row.customer_id ? customersById.get(row.customer_id) : undefined
      return {
        id: row.id!,
        number: row.number ?? '',
        title: row.title ?? '',
        customerId: row.customer_id ?? '',
        customerName: customer?.name ?? '',
        customerContact: customer?.contact ?? '',
        customerPhone: customer?.phone ?? '',
        address: row.address ?? customer?.address ?? '',
        status: (row.status as JobStatus) ?? 'Scheduled',
        dueDate: row.due_date ?? '',
        scheduledTime: row.scheduled_time ?? undefined,
        lineItems: lineItemsByJob.get(row.id!) ?? [],
        notes: notesByJob.get(row.id!) ?? [],
        checkIns: checkinsByJob.get(row.id!) ?? [],
      }
    })
    setJobs(assembled)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (session) load()
  }, [session, tick, load])

  const getJob = useCallback((id: string) => jobs.find((j) => j.id === id), [jobs])
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const addNote = useCallback(
    async (id: string, text: string) => {
      if (!text.trim() || !session) return
      const { error } = await supabase
        .from('job_notes')
        .insert({ job_id: id, type: 'note', author_id: session.user.id, author_name: (session.user.user_metadata?.full_name as string) ?? 'Employee', text })
      if (error) throw new Error(error.message)
      refresh()
    },
    [session, refresh]
  )

  const startJob = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc('employee_start_job', { p_job_id: id })
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const finishJob = useCallback(
    async (id: string, note?: string) => {
      const { error } = await supabase.rpc('employee_finish_job', { p_job_id: id, p_note: note ?? undefined })
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const value = useMemo(
    () => ({ jobs, loading, getJob, addNote, startJob, finishJob, refresh }),
    [jobs, loading, getJob, addNote, startJob, finishJob, refresh]
  )

  return <FieldJobsContext.Provider value={value}>{children}</FieldJobsContext.Provider>
}

export function useFieldJobsStore() {
  const ctx = useContext(FieldJobsContext)
  if (!ctx) throw new Error('useFieldJobsStore must be used within FieldJobsProvider')
  return ctx
}
