import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'

export type LeaveType = 'annual' | 'sick'
export type LeaveStatus = 'pending' | 'approved' | 'declined'
export type EmploymentType = 'full_time' | 'part_time' | 'casual'

export interface LeaveEmployee {
  id: string
  fullName: string
  employmentType: EmploymentType
  weeklyHours: number
  employmentStartDate: string | null
}

export interface LeaveRequest {
  id: string
  employeeId: string
  employeeName: string
  type: LeaveType
  startDate: string
  endDate: string
  hours: number
  note: string
  status: LeaveStatus
  createdAt: string
}

export interface LeaveBalance {
  annualAccruedHours: number
  annualTakenHours: number
  annualAvailableHours: number
  sickAccruedHours: number
  sickTakenHours: number
  sickAvailableHours: number
}

interface LeaveContextValue {
  employees: LeaveEmployee[]
  requests: LeaveRequest[]
  loading: boolean
  getBalance: (employeeId: string) => LeaveBalance | null
  requestLeave: (input: { type: LeaveType; startDate: string; endDate: string; hours: number; note?: string }) => Promise<void>
  reviewRequest: (id: string, approve: boolean) => Promise<void>
  refresh: () => void
}

const LeaveContext = createContext<LeaveContextValue | null>(null)

/** Standard NES pro-rata entitlement, accrued daily since employment start. Annual = 4 weeks/yr, personal/sick = 2 weeks/yr. */
function computeBalance(employee: LeaveEmployee, requests: LeaveRequest[]): LeaveBalance | null {
  if (employee.employmentType === 'casual' || !employee.employmentStartDate) return null
  const daysEmployed = Math.max(0, (Date.now() - new Date(employee.employmentStartDate).getTime()) / 86_400_000)
  const yearsEmployed = daysEmployed / 365
  const annualAccruedHours = employee.weeklyHours * 4 * yearsEmployed
  const sickAccruedHours = employee.weeklyHours * 2 * yearsEmployed
  const own = requests.filter((r) => r.employeeId === employee.id && r.status === 'approved')
  const annualTakenHours = own.filter((r) => r.type === 'annual').reduce((sum, r) => sum + r.hours, 0)
  const sickTakenHours = own.filter((r) => r.type === 'sick').reduce((sum, r) => sum + r.hours, 0)
  return {
    annualAccruedHours,
    annualTakenHours,
    annualAvailableHours: annualAccruedHours - annualTakenHours,
    sickAccruedHours,
    sickTakenHours,
    sickAvailableHours: sickAccruedHours - sickTakenHours,
  }
}

export function LeaveProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [employees, setEmployees] = useState<LeaveEmployee[]>([])
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: profileRows }, { data: requestRows }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, employment_type, weekly_hours, employment_start_date'),
      supabase
        .from('leave_requests')
        .select('*, employee:profiles!leave_requests_employee_id_fkey(full_name)')
        .order('created_at', { ascending: false }),
    ])

    setEmployees(
      (profileRows ?? []).map((p) => ({
        id: p.id,
        fullName: p.full_name,
        employmentType: p.employment_type as EmploymentType,
        weeklyHours: p.weekly_hours,
        employmentStartDate: p.employment_start_date,
      }))
    )
    setRequests(
      ((requestRows ?? []) as unknown as Array<{
        id: string
        employee_id: string
        employee: { full_name: string } | null
        type: string
        start_date: string
        end_date: string
        hours: number
        note: string
        status: string
        created_at: string
      }>).map((r) => ({
        id: r.id,
        employeeId: r.employee_id,
        employeeName: r.employee?.full_name ?? 'Employee',
        type: r.type as LeaveType,
        startDate: r.start_date,
        endDate: r.end_date,
        hours: r.hours,
        note: r.note,
        status: r.status as LeaveStatus,
        createdAt: r.created_at,
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    if (session) load()
  }, [session, tick, load])

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const getBalance = useCallback(
    (employeeId: string) => {
      const employee = employees.find((e) => e.id === employeeId)
      if (!employee) return null
      return computeBalance(employee, requests)
    },
    [employees, requests]
  )

  const requestLeave = useCallback(
    async (input: { type: LeaveType; startDate: string; endDate: string; hours: number; note?: string }) => {
      const { error } = await supabase.rpc('request_leave', {
        p_type: input.type,
        p_start_date: input.startDate,
        p_end_date: input.endDate,
        p_hours: input.hours,
        p_note: input.note ?? '',
      })
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const reviewRequest = useCallback(
    async (id: string, approve: boolean) => {
      const { error } = await supabase.rpc('review_leave_request', { p_request_id: id, p_approve: approve })
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const value = useMemo(
    () => ({ employees, requests, loading, getBalance, requestLeave, reviewRequest, refresh }),
    [employees, requests, loading, getBalance, requestLeave, reviewRequest, refresh]
  )

  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>
}

export function useLeaveStore() {
  const ctx = useContext(LeaveContext)
  if (!ctx) throw new Error('useLeaveStore must be used within LeaveProvider')
  return ctx
}
