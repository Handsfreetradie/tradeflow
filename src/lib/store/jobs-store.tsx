import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import type { CocStatus, Job, JobCheckIn, JobCost, JobNote, JobStage, JobStatus, LineItem, PricingType } from '@/lib/demo-data'

export interface NewJobStageInput {
  name: string
  targetDate?: string
  claimAmount?: number
}

export interface NewJobInput {
  title: string
  customerId: string
  customer: string
  address?: string
  dueDate: string
  scheduledTime?: string
  pricingType?: PricingType
  lineItems?: LineItem[]
  quoteId?: string
  /** Profile ids of the employees to assign, or omit/empty for unassigned. */
  assigneeIds?: string[]
  /** Optional milestones — only set when the owner opts in at job creation. */
  stages?: NewJobStageInput[]
}

interface JobsContextValue {
  jobs: Job[]
  loading: boolean
  getJob: (id: string) => Job | undefined
  addJob: (input: NewJobInput) => Promise<Job>
  updateJobStatus: (id: string, status: JobStatus) => Promise<void>
  updateDueDate: (id: string, dueDate: string) => Promise<void>
  setAssignees: (id: string, employeeIds: string[]) => Promise<void>
  updateCoc: (id: string, patch: { cocStatus?: CocStatus; cocNumber?: string; cocIssuedDate?: string }) => Promise<void>
  addNote: (id: string, text: string) => Promise<void>
  addCost: (id: string, cost: Omit<JobCost, 'id'>) => Promise<void>
  startJob: (id: string) => Promise<void>
  finishJob: (id: string, note?: string) => Promise<void>
  addStage: (jobId: string, stage: NewJobStageInput) => Promise<void>
  updateStage: (stageId: string, jobId: string, patch: { name?: string; targetDate?: string | null; claimAmount?: number | null; notes?: string }) => Promise<void>
  toggleStage: (stageId: string, jobId: string, complete: boolean) => Promise<void>
  deleteStage: (stageId: string, jobId: string) => Promise<void>
  claimStages: (jobId: string, stageIds: string[], invoiceId: string) => Promise<void>
}

const JobsContext = createContext<JobsContextValue | null>(null)

function formatTimestamp(iso: string) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso))
}

type JobRow = {
  id: string
  number: string
  title: string
  customer_id: string
  address: string | null
  status: string
  value: number
  due_date: string
  scheduled_time: string | null
  quote_id: string | null
  pricing_type: string
  photos: number
  coc_status: string
  coc_number: string | null
  coc_issued_date: string | null
  customer: { name: string; address: string } | null
}

type StageRow = {
  id: string
  job_id: string
  name: string
  target_date: string | null
  notes: string
  claim_amount: number | null
  status: string
  completed_at: string | null
  claimed_invoice_id: string | null
  sort_order: number
}

function stageFromRow(row: StageRow): JobStage {
  return {
    id: row.id,
    name: row.name,
    targetDate: row.target_date ?? undefined,
    notes: row.notes,
    claimAmount: row.claim_amount ?? undefined,
    status: row.status as JobStage['status'],
    completedAt: row.completed_at ?? undefined,
    claimedInvoiceId: row.claimed_invoice_id ?? undefined,
    sortOrder: row.sort_order,
  }
}

function assembleJob(
  row: JobRow,
  lineItems: LineItem[],
  costs: JobCost[],
  notes: JobNote[],
  checkIns: JobCheckIn[],
  assignees: { id: string; fullName: string }[],
  stages: JobStage[]
): Job {
  return {
    id: row.id,
    number: row.number,
    title: row.title,
    customerId: row.customer_id,
    customer: row.customer?.name ?? '',
    address: row.address ?? row.customer?.address ?? '',
    status: row.status as JobStatus,
    value: row.value,
    dueDate: row.due_date,
    scheduledTime: row.scheduled_time ?? undefined,
    thumbnail: 'fitout',
    assignees,
    quoteId: row.quote_id ?? undefined,
    lineItems,
    pricingType: row.pricing_type as PricingType,
    costs,
    photos: row.photos,
    notes,
    checkIns,
    cocStatus: row.coc_status as CocStatus,
    cocNumber: row.coc_number ?? undefined,
    cocIssuedDate: row.coc_issued_date ?? undefined,
    stages,
  }
}

const JOB_SELECT = '*, customer:customers(name,address)'

async function fetchAssigneesByJob(jobIds: string[]): Promise<Map<string, { id: string; fullName: string }[]>> {
  const map = new Map<string, { id: string; fullName: string }[]>()
  if (jobIds.length === 0) return map
  const { data } = await supabase.from('job_assignees').select('job_id, employee:profiles(id, full_name)').in('job_id', jobIds)
  for (const row of (data ?? []) as Array<{ job_id: string; employee: { id: string; full_name: string } | null }>) {
    if (!row.employee) continue
    const arr = map.get(row.job_id) ?? []
    arr.push({ id: row.employee.id, fullName: row.employee.full_name })
    map.set(row.job_id, arr)
  }
  return map
}

async function fetchJobs(): Promise<Job[]> {
  const { data: jobRows, error } = await supabase.from('jobs').select(JOB_SELECT).order('due_date')
  if (error) throw new Error(error.message)
  const rows = (jobRows ?? []) as unknown as JobRow[]
  const jobIds = rows.map((r) => r.id)
  if (jobIds.length === 0) return []

  const [{ data: lineItemRows }, { data: costRows }, { data: noteRows }, { data: checkinRows }, assigneesByJob, { data: stageRows }] = await Promise.all([
    supabase.from('job_line_items').select('*').in('job_id', jobIds).order('sort_order'),
    supabase.from('job_costs').select('*').in('job_id', jobIds).order('date'),
    supabase.from('job_notes').select('*').in('job_id', jobIds).order('created_at'),
    supabase.from('job_checkins').select('*, employee:profiles(full_name)').in('job_id', jobIds).order('check_in'),
    fetchAssigneesByJob(jobIds),
    supabase.from('job_stages').select('*').in('job_id', jobIds).order('sort_order'),
  ])

  const lineItemsByJob = new Map<string, LineItem[]>()
  for (const li of lineItemRows ?? []) {
    const arr = lineItemsByJob.get(li.job_id) ?? []
    arr.push({ id: li.id, description: li.description, qty: li.qty, unitPrice: li.unit_price })
    lineItemsByJob.set(li.job_id, arr)
  }
  const costsByJob = new Map<string, JobCost[]>()
  for (const c of costRows ?? []) {
    const arr = costsByJob.get(c.job_id) ?? []
    arr.push({
      id: c.id,
      description: c.description,
      category: c.category as JobCost['category'],
      amount: c.amount,
      date: c.date,
      supplier: c.supplier ?? undefined,
      poNumber: c.po_number ?? undefined,
    })
    costsByJob.set(c.job_id, arr)
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
      employeeName: ci.employee?.full_name ?? 'Unknown',
      checkIn: ci.check_in,
      checkOut: ci.check_out,
      note: ci.note ?? undefined,
    })
    checkinsByJob.set(ci.job_id, arr)
  }
  const stagesByJob = new Map<string, JobStage[]>()
  for (const s of (stageRows ?? []) as StageRow[]) {
    const arr = stagesByJob.get(s.job_id) ?? []
    arr.push(stageFromRow(s))
    stagesByJob.set(s.job_id, arr)
  }

  return rows.map((row) =>
    assembleJob(
      row,
      lineItemsByJob.get(row.id) ?? [],
      costsByJob.get(row.id) ?? [],
      notesByJob.get(row.id) ?? [],
      checkinsByJob.get(row.id) ?? [],
      assigneesByJob.get(row.id) ?? [],
      stagesByJob.get(row.id) ?? []
    )
  )
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const { fullName } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchJobs()
      .then((data) => {
        if (!cancelled) setJobs(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const getJob = useCallback((id: string) => jobs.find((j) => j.id === id), [jobs])

  const refreshJob = useCallback(async (id: string) => {
    const { data: row, error } = await supabase.from('jobs').select(JOB_SELECT).eq('id', id).single()
    if (error || !row) return
    const [{ data: lineItemRows }, { data: costRows }, { data: noteRows }, { data: checkinRows }, assigneesByJob, { data: stageRows }] = await Promise.all([
      supabase.from('job_line_items').select('*').eq('job_id', id).order('sort_order'),
      supabase.from('job_costs').select('*').eq('job_id', id).order('date'),
      supabase.from('job_notes').select('*').eq('job_id', id).order('created_at'),
      supabase.from('job_checkins').select('*, employee:profiles(full_name)').eq('job_id', id).order('check_in'),
      fetchAssigneesByJob([id]),
      supabase.from('job_stages').select('*').eq('job_id', id).order('sort_order'),
    ])
    const lineItems = (lineItemRows ?? []).map((li) => ({ id: li.id, description: li.description, qty: li.qty, unitPrice: li.unit_price }))
    const costs = (costRows ?? []).map((c) => ({
      id: c.id,
      description: c.description,
      category: c.category as JobCost['category'],
      amount: c.amount,
      date: c.date,
      supplier: c.supplier ?? undefined,
      poNumber: c.po_number ?? undefined,
    }))
    const notes = (noteRows ?? []).map((n) => ({
      id: n.id,
      type: n.type as JobNote['type'],
      author: n.author_name,
      text: n.text,
      timestamp: formatTimestamp(n.created_at),
    }))
    const checkIns = ((checkinRows ?? []) as Array<{
      id: string
      job_id: string
      employee_id: string
      check_in: string
      check_out: string | null
      note: string | null
      employee: { full_name: string } | null
    }>).map((ci) => ({
      id: ci.id,
      employeeId: ci.employee_id,
      employeeName: ci.employee?.full_name ?? 'Unknown',
      checkIn: ci.check_in,
      checkOut: ci.check_out,
      note: ci.note ?? undefined,
    }))
    const stages = ((stageRows ?? []) as StageRow[]).map(stageFromRow)
    const updated = assembleJob(row as unknown as JobRow, lineItems, costs, notes, checkIns, assigneesByJob.get(id) ?? [], stages)
    setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)))
  }, [])

  const addJob = useCallback(
    async (input: NewJobInput) => {
      const { data: number, error: numberError } = await supabase.rpc('next_job_number')
      if (numberError || !number) throw new Error(numberError?.message ?? 'Failed to allocate job number')

      const items = input.lineItems ?? []
      const value = items.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
      const pricingType: PricingType = input.pricingType ?? (items.length > 0 ? 'Fixed Price' : 'Time & Materials')

      const { data: jobRow, error } = await supabase
        .from('jobs')
        .insert({
          number,
          title: input.title,
          customer_id: input.customerId,
          address: input.address ?? '',
          due_date: input.dueDate,
          scheduled_time: input.scheduledTime ?? null,
          pricing_type: pricingType,
          value,
          quote_id: input.quoteId ?? null,
        })
        .select(JOB_SELECT)
        .single()
      if (error || !jobRow) throw new Error(error?.message ?? 'Failed to create job')

      if (items.length > 0) {
        const { error: liError } = await supabase.from('job_line_items').insert(
          items.map((li, i) => ({ job_id: jobRow.id, description: li.description, qty: li.qty, unit_price: li.unitPrice, sort_order: i }))
        )
        if (liError) throw new Error(liError.message)
      }

      const assigneeIds = input.assigneeIds ?? []
      let assignees: { id: string; fullName: string }[] = []
      if (assigneeIds.length > 0) {
        const { error: assigneeError } = await supabase.from('job_assignees').insert(assigneeIds.map((employee_id) => ({ job_id: jobRow.id, employee_id })))
        if (assigneeError) throw new Error(assigneeError.message)
        const map = await fetchAssigneesByJob([jobRow.id])
        assignees = map.get(jobRow.id) ?? []
      }

      await supabase.from('job_notes').insert({
        job_id: jobRow.id,
        type: 'status_change',
        author_name: fullName ?? 'Owner',
        text: 'Job created and scheduled',
      })

      const stageInputs = input.stages ?? []
      let stages: JobStage[] = []
      if (stageInputs.length > 0) {
        const { data: stageRows, error: stageError } = await supabase
          .from('job_stages')
          .insert(
            stageInputs.map((s, i) => ({
              job_id: jobRow.id,
              name: s.name,
              target_date: s.targetDate || null,
              claim_amount: s.claimAmount ?? null,
              sort_order: i,
            }))
          )
          .select('*')
        if (stageError) throw new Error(stageError.message)
        stages = ((stageRows ?? []) as StageRow[]).map(stageFromRow)
      }

      const created = assembleJob(jobRow as unknown as JobRow, items, [], [
        { id: 'temp', type: 'status_change', author: fullName ?? 'Owner', text: 'Job created and scheduled', timestamp: formatTimestamp(new Date().toISOString()) },
      ], [], assignees, stages)
      setJobs((prev) => [created, ...prev])
      return created
    },
    [fullName]
  )

  const updateJobStatus = useCallback(
    async (id: string, status: JobStatus) => {
      const { error } = await supabase.from('jobs').update({ status }).eq('id', id)
      if (error) throw new Error(error.message)
      await supabase.from('job_notes').insert({ job_id: id, type: 'status_change', author_name: fullName ?? 'Owner', text: `Moved to ${status}` })
      await refreshJob(id)
    },
    [fullName, refreshJob]
  )

  const updateDueDate = useCallback(async (id: string, dueDate: string) => {
    const { error } = await supabase.from('jobs').update({ due_date: dueDate }).eq('id', id)
    if (error) throw new Error(error.message)
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, dueDate } : j)))
  }, [])

  const updateCoc = useCallback(async (id: string, patch: { cocStatus?: CocStatus; cocNumber?: string; cocIssuedDate?: string }) => {
    const { error } = await supabase
      .from('jobs')
      .update({
        ...(patch.cocStatus !== undefined ? { coc_status: patch.cocStatus } : {}),
        ...(patch.cocNumber !== undefined ? { coc_number: patch.cocNumber || null } : {}),
        ...(patch.cocIssuedDate !== undefined ? { coc_issued_date: patch.cocIssuedDate || null } : {}),
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  }, [])

  const setAssignees = useCallback(async (id: string, employeeIds: string[]) => {
    const { error: deleteError } = await supabase.from('job_assignees').delete().eq('job_id', id)
    if (deleteError) throw new Error(deleteError.message)
    if (employeeIds.length > 0) {
      const { error: insertError } = await supabase.from('job_assignees').insert(employeeIds.map((employee_id) => ({ job_id: id, employee_id })))
      if (insertError) throw new Error(insertError.message)
    }
    const map = await fetchAssigneesByJob([id])
    const assignees = map.get(id) ?? []
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, assignees } : j)))
  }, [])

  const addNote = useCallback(
    async (id: string, text: string) => {
      if (!text.trim()) return
      const { error } = await supabase.from('job_notes').insert({ job_id: id, type: 'note', author_name: fullName ?? 'Owner', text })
      if (error) throw new Error(error.message)
      await refreshJob(id)
    },
    [fullName, refreshJob]
  )

  const addCost = useCallback(
    async (id: string, cost: Omit<JobCost, 'id'>) => {
      const { error } = await supabase.from('job_costs').insert({
        job_id: id,
        description: cost.description,
        category: cost.category,
        amount: cost.amount,
        date: cost.date,
        supplier: cost.supplier ?? null,
        po_number: cost.poNumber ?? null,
      })
      if (error) throw new Error(error.message)
      await refreshJob(id)
    },
    [refreshJob]
  )

  const addStage = useCallback(
    async (jobId: string, stage: NewJobStageInput) => {
      const job = jobs.find((j) => j.id === jobId)
      const nextSort = (job?.stages.length ?? 0)
      const { error } = await supabase
        .from('job_stages')
        .insert({ job_id: jobId, name: stage.name, target_date: stage.targetDate || null, claim_amount: stage.claimAmount ?? null, sort_order: nextSort })
      if (error) throw new Error(error.message)
      await refreshJob(jobId)
    },
    [jobs, refreshJob]
  )

  const updateStage = useCallback(
    async (stageId: string, jobId: string, patch: { name?: string; targetDate?: string | null; claimAmount?: number | null; notes?: string }) => {
      const { error } = await supabase
        .from('job_stages')
        .update({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.targetDate !== undefined ? { target_date: patch.targetDate } : {}),
          ...(patch.claimAmount !== undefined ? { claim_amount: patch.claimAmount } : {}),
          ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        })
        .eq('id', stageId)
      if (error) throw new Error(error.message)
      await refreshJob(jobId)
    },
    [refreshJob]
  )

  const toggleStage = useCallback(
    async (stageId: string, jobId: string, complete: boolean) => {
      const { error } = await supabase
        .from('job_stages')
        .update({ status: complete ? 'complete' : 'pending', completed_at: complete ? new Date().toISOString() : null })
        .eq('id', stageId)
      if (error) throw new Error(error.message)
      await refreshJob(jobId)
    },
    [refreshJob]
  )

  const deleteStage = useCallback(
    async (stageId: string, jobId: string) => {
      const { error } = await supabase.from('job_stages').delete().eq('id', stageId)
      if (error) throw new Error(error.message)
      await refreshJob(jobId)
    },
    [refreshJob]
  )

  const claimStages = useCallback(
    async (jobId: string, stageIds: string[], invoiceId: string) => {
      if (stageIds.length === 0) return
      const { error } = await supabase.from('job_stages').update({ claimed_invoice_id: invoiceId }).in('id', stageIds)
      if (error) throw new Error(error.message)
      await refreshJob(jobId)
    },
    [refreshJob]
  )

  const startJob = useCallback(
    async (id: string) => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) throw new Error('Not signed in')
      const { error: ciError } = await supabase.from('job_checkins').insert({ job_id: id, employee_id: userId, check_in: new Date().toISOString() })
      if (ciError) throw new Error(ciError.message)
      const job = jobs.find((j) => j.id === id)
      const startingStatus = job?.status === 'Scheduled'
      if (startingStatus) await supabase.from('jobs').update({ status: 'In Progress' }).eq('id', id)
      await supabase.from('job_notes').insert({
        job_id: id,
        type: 'status_change',
        author_name: fullName ?? 'Employee',
        text: startingStatus ? `${fullName} started the job — moved to In Progress` : `${fullName} started the job`,
      })
      await refreshJob(id)
    },
    [jobs, fullName, refreshJob]
  )

  const finishJob = useCallback(
    async (id: string, note?: string) => {
      const { data: session } = await supabase.auth.getSession()
      const userId = session.session?.user.id
      if (!userId) throw new Error('Not signed in')
      const job = jobs.find((j) => j.id === id)
      const openCheckIn = [...(job?.checkIns ?? [])].reverse().find((c) => c.employeeId === userId && c.checkOut === null)
      if (!openCheckIn) throw new Error('No open check-in to finish')
      const { error } = await supabase
        .from('job_checkins')
        .update({ check_out: new Date().toISOString(), note: note ?? null })
        .eq('id', openCheckIn.id)
      if (error) throw new Error(error.message)
      await supabase.from('job_notes').insert({
        job_id: id,
        type: 'note',
        author_name: fullName ?? 'Employee',
        text: note ? `${fullName} finished on site: ${note}` : `${fullName} finished on site`,
      })
      await refreshJob(id)
    },
    [jobs, fullName, refreshJob]
  )

  const value = useMemo(
    () => ({
      jobs,
      loading,
      getJob,
      addJob,
      updateJobStatus,
      updateDueDate,
      setAssignees,
      updateCoc,
      addNote,
      addCost,
      startJob,
      finishJob,
      addStage,
      updateStage,
      toggleStage,
      deleteStage,
      claimStages,
    }),
    [
      jobs,
      loading,
      getJob,
      addJob,
      updateJobStatus,
      updateDueDate,
      setAssignees,
      updateCoc,
      addNote,
      addCost,
      startJob,
      finishJob,
      addStage,
      updateStage,
      toggleStage,
      deleteStage,
      claimStages,
    ]
  )

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
}

export function useJobsStore() {
  const ctx = useContext(JobsContext)
  if (!ctx) throw new Error('useJobsStore must be used within JobsProvider')
  return ctx
}
