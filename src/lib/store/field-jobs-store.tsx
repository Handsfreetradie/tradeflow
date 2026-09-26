import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useOnline } from '@/lib/offline/online'
import { getCachedJobs, setCachedJobs } from '@/lib/offline/db'
import { enqueue, usePendingSyncCount } from '@/lib/offline/queue'
import { flushQueue } from '@/lib/offline/flush'
import type { JobCheckIn, JobNote, JobStage, JobStatus } from '@/lib/demo-data'

export interface FieldLineItem {
  id: string
  description: string
  qty: number
}

export interface FieldCrewMember {
  employeeId: string
  fullName: string
  tradeRole: string
  onSite: boolean
  checkInAt?: string
}

export interface JoinableJob {
  id: string
  number: string
  title: string
  address: string
  scheduledTime?: string
  status: JobStatus
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
  crew: FieldCrewMember[]
  stages: JobStage[]
}

interface FieldJobsContextValue {
  jobs: FieldJob[]
  loading: boolean
  offline: boolean
  pendingSyncCount: number
  joinableJobs: JoinableJob[]
  getJob: (id: string) => FieldJob | undefined
  addNote: (id: string, text: string) => Promise<void>
  startJob: (id: string) => Promise<void>
  finishJob: (id: string, note?: string, blocked?: boolean) => Promise<void>
  updateStage: (stageId: string, jobId: string, patch: { complete?: boolean; notes?: string }) => Promise<void>
  joinJob: (jobId: string) => Promise<void>
  refresh: () => void
}

const FieldJobsContext = createContext<FieldJobsContextValue | null>(null)

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

export function FieldJobsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const online = useOnline()
  const pendingSyncCount = usePendingSyncCount()
  const [jobs, setJobs] = useState<FieldJob[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const [joinableJobs, setJoinableJobs] = useState<JoinableJob[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (!navigator.onLine) throw new Error('offline')

      const { data: jobRows, error } = await supabase.from('jobs_field_view').select('*').order('due_date')
      if (error) throw new Error(error.message)
      const jobIds = (jobRows ?? []).map((j) => j.id).filter((id): id is string => !!id)
      if (jobIds.length === 0) {
        setJobs([])
        await setCachedJobs([])
        setLoading(false)
        return
      }

      const [{ data: customerRows }, { data: lineItemRows }, { data: noteRows }, { data: checkinRows }, { data: crewRows }, { data: stageRows }] =
        await Promise.all([
          supabase.from('customers_field_view').select('*'),
          supabase.from('job_line_items_field_view').select('*').in('job_id', jobIds).order('sort_order'),
          supabase.from('job_notes').select('*').in('job_id', jobIds).order('created_at'),
          supabase.from('job_checkins').select('*').in('job_id', jobIds).order('check_in'),
          supabase.rpc('get_job_crew', { p_job_ids: jobIds }),
          supabase.from('job_stages').select('*').in('job_id', jobIds).order('sort_order'),
        ])

      const crewByJob = new Map<string, FieldCrewMember[]>()
      const crewNameById = new Map<string, string>()
      for (const c of crewRows ?? []) {
        crewNameById.set(c.employee_id, c.full_name)
        const arr = crewByJob.get(c.job_id) ?? []
        arr.push({ employeeId: c.employee_id, fullName: c.full_name, tradeRole: c.trade_role ?? '', onSite: c.on_site ?? false, checkInAt: c.check_in ?? undefined })
        crewByJob.set(c.job_id, arr)
      }

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
      for (const ci of checkinRows ?? []) {
        const arr = checkinsByJob.get(ci.job_id) ?? []
        arr.push({
          id: ci.id,
          employeeId: ci.employee_id,
          employeeName: crewNameById.get(ci.employee_id) ?? 'Employee',
          checkIn: ci.check_in,
          checkOut: ci.check_out,
          note: ci.note ?? undefined,
        })
        checkinsByJob.set(ci.job_id, arr)
      }
      const stagesByJob = new Map<string, JobStage[]>()
      for (const s of stageRows ?? []) {
        const arr = stagesByJob.get(s.job_id) ?? []
        arr.push({
          id: s.id,
          name: s.name,
          targetDate: s.target_date ?? undefined,
          notes: s.notes,
          claimAmount: s.claim_amount ?? undefined,
          status: s.status as JobStage['status'],
          completedAt: s.completed_at ?? undefined,
          claimedInvoiceId: s.claimed_invoice_id ?? undefined,
          sortOrder: s.sort_order,
        })
        stagesByJob.set(s.job_id, arr)
      }

      const assembled: FieldJob[] = (jobRows ?? []).map((row) => {
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
          crew: crewByJob.get(row.id!) ?? [],
          stages: stagesByJob.get(row.id!) ?? [],
        }
      })
      setJobs(assembled)
      await setCachedJobs(assembled)
    } catch {
      const cached = await getCachedJobs()
      setJobs(cached ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadJoinable = useCallback(async () => {
    if (!navigator.onLine) return
    const { data, error } = await supabase.rpc('get_joinable_jobs')
    if (error || !data) return
    setJoinableJobs(
      data.map((row) => ({
        id: row.id,
        number: row.number,
        title: row.title,
        address: row.address ?? '',
        scheduledTime: row.scheduled_time ?? undefined,
        status: row.status as JobStatus,
      }))
    )
  }, [])

  useEffect(() => {
    if (session) load()
  }, [session, tick, load])

  useEffect(() => {
    if (session) loadJoinable()
  }, [session, tick, loadJoinable])

  useEffect(() => {
    if (!session || !online) return
    flushQueue().then(() => load())
  }, [session, online, load])

  const getJob = useCallback((id: string) => jobs.find((j) => j.id === id), [jobs])
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const addNote = useCallback(
    async (id: string, text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !session) return
      const authorName = (session.user.user_metadata?.full_name as string) ?? 'Employee'

      if (!navigator.onLine) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === id
              ? { ...j, notes: [...j.notes, { id: `pending-${crypto.randomUUID()}`, type: 'note', author: authorName, text: trimmed, timestamp: 'Pending sync' }] }
              : j
          )
        )
        await enqueue({ kind: 'add_note', jobId: id, text: trimmed, authorName })
        return
      }

      const { error } = await supabase
        .from('job_notes')
        .insert({ job_id: id, type: 'note', author_id: session.user.id, author_name: authorName, text: trimmed })
      if (error) throw new Error(error.message)
      refresh()
    },
    [session, refresh]
  )

  const startJob = useCallback(
    async (id: string) => {
      if (!navigator.onLine) {
        const nowIso = new Date().toISOString()
        setJobs((prev) =>
          prev.map((j) =>
            j.id === id
              ? {
                  ...j,
                  status: j.status === 'Scheduled' ? 'In Progress' : j.status,
                  checkIns: [
                    ...j.checkIns,
                    { id: `pending-${crypto.randomUUID()}`, employeeId: session?.user.id ?? '', employeeName: 'You', checkIn: nowIso, checkOut: null },
                  ],
                }
              : j
          )
        )
        await enqueue({ kind: 'start_job', jobId: id })
        return
      }
      const { error } = await supabase.rpc('employee_start_job', { p_job_id: id })
      if (error) throw new Error(error.message)
      refresh()
    },
    [session, refresh]
  )

  const finishJob = useCallback(
    async (id: string, note?: string, blocked?: boolean) => {
      if (!navigator.onLine) {
        const nowIso = new Date().toISOString()
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id !== id) return j
            const checkIns = [...j.checkIns]
            const openIdx = [...checkIns].reverse().findIndex((c) => c.employeeId === session?.user.id && c.checkOut === null)
            if (openIdx !== -1) {
              const realIdx = checkIns.length - 1 - openIdx
              checkIns[realIdx] = { ...checkIns[realIdx], checkOut: nowIso, note: note ?? checkIns[realIdx].note }
            }
            return { ...j, checkIns }
          })
        )
        await enqueue({ kind: 'finish_job', jobId: id, note, blocked: blocked ?? false })
        return
      }
      const { error } = await supabase.rpc('employee_finish_job', { p_job_id: id, p_note: note ?? undefined, p_blocked: blocked ?? false })
      if (error) throw new Error(error.message)
      refresh()
    },
    [session, refresh]
  )

  const updateStage = useCallback(
    async (stageId: string, jobId: string, patch: { complete?: boolean; notes?: string }) => {
      if (!navigator.onLine) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  stages: j.stages.map((s) =>
                    s.id === stageId
                      ? {
                          ...s,
                          status: patch.complete === undefined ? s.status : patch.complete ? 'complete' : 'pending',
                          completedAt: patch.complete === undefined ? s.completedAt : patch.complete ? new Date().toISOString() : undefined,
                          notes: patch.notes ?? s.notes,
                        }
                      : s
                  ),
                }
              : j
          )
        )
        await enqueue({ kind: 'update_stage', stageId, jobId, complete: patch.complete, notes: patch.notes })
        return
      }
      const { error } = await supabase.rpc('employee_update_stage', { p_stage_id: stageId, p_complete: patch.complete, p_notes: patch.notes })
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const joinJob = useCallback(
    async (jobId: string) => {
      const { error } = await supabase.rpc('employee_join_job', { p_job_id: jobId })
      if (error) throw new Error(error.message)
      refresh()
      loadJoinable()
    },
    [refresh, loadJoinable]
  )

  const value = useMemo(
    () => ({
      jobs,
      loading,
      offline: !online,
      pendingSyncCount,
      joinableJobs,
      getJob,
      addNote,
      startJob,
      finishJob,
      updateStage,
      joinJob,
      refresh,
    }),
    [jobs, loading, online, pendingSyncCount, joinableJobs, getJob, addNote, startJob, finishJob, updateStage, joinJob, refresh]
  )

  return <FieldJobsContext.Provider value={value}>{children}</FieldJobsContext.Provider>
}

export function useFieldJobsStore() {
  const ctx = useContext(FieldJobsContext)
  if (!ctx) throw new Error('useFieldJobsStore must be used within FieldJobsProvider')
  return ctx
}
