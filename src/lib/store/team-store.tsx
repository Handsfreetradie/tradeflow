import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'

export type EmploymentType = 'full_time' | 'part_time' | 'casual'

export interface TeamMember {
  id: string
  fullName: string
  role: 'owner' | 'employee'
  email: string
  hourlyRate: number | null
  tradeRole: string
  employmentType: EmploymentType
  weeklyHours: number
  employmentStartDate: string | null
  /** Leave balance carried in from before this app tracked leave (e.g. migrating from another
   * system) — added to the NES accrual so employees don't have to start back at zero. */
  annualLeaveOpeningHours: number
  sickLeaveOpeningHours: number
}

interface TeamContextValue {
  team: TeamMember[]
  loading: boolean
  refresh: () => void
  updateRate: (id: string, hourlyRate: number | null) => Promise<void>
  updateTradeRole: (id: string, tradeRole: string) => Promise<void>
  updateEmployment: (
    id: string,
    patch: Partial<{
      employmentType: EmploymentType
      weeklyHours: number
      employmentStartDate: string | null
      annualLeaveOpeningHours: number
      sickLeaveOpeningHours: number
    }>
  ) => Promise<void>
}

const TeamContext = createContext<TeamContextValue | null>(null)

interface MembershipRow {
  person_id: string
  role: string
  hourly_rate: number | null
  trade_role: string
  employment_type: string
  weekly_hours: number
  employment_start_date: string | null
  annual_leave_opening_hours: number
  sick_leave_opening_hours: number
  person: { full_name: string; email: string } | null
}

// The team is "who belongs to the business I'm currently working in" — per-business details
// (role, rate, employment terms) live on the membership, because one person can work for several.
export function TeamProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const { activeBusinessId } = useActiveBusiness()
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!session || !activeBusinessId) {
      setTeam([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('business_memberships')
      .select(
        'person_id, role, hourly_rate, trade_role, employment_type, weekly_hours, employment_start_date, annual_leave_opening_hours, sick_leave_opening_hours, person:profiles!business_memberships_person_id_fkey(full_name, email)'
      )
      .eq('business_id', activeBusinessId)
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) {
          setTeam(
            (data as unknown as MembershipRow[])
              .map((m) => ({
                id: m.person_id,
                fullName: m.person?.full_name ?? 'Unknown',
                role: m.role as 'owner' | 'employee',
                email: m.person?.email ?? '',
                hourlyRate: m.hourly_rate,
                tradeRole: m.trade_role,
                employmentType: m.employment_type as EmploymentType,
                weeklyHours: m.weekly_hours,
                employmentStartDate: m.employment_start_date,
                annualLeaveOpeningHours: m.annual_leave_opening_hours,
                sickLeaveOpeningHours: m.sick_leave_opening_hours,
              }))
              .sort((x, y) => x.fullName.localeCompare(y.fullName))
          )
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session, activeBusinessId, tick])

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const updateRate = useCallback(async (id: string, hourlyRate: number | null) => {
    const { error } = await supabase.from('business_memberships').update({ hourly_rate: hourlyRate }).eq('person_id', id).eq('business_id', activeBusinessId ?? '')
    if (error) throw new Error(error.message)
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, hourlyRate } : m)))
  }, [activeBusinessId])

  const updateTradeRole = useCallback(async (id: string, tradeRole: string) => {
    const { error } = await supabase.from('business_memberships').update({ trade_role: tradeRole }).eq('person_id', id).eq('business_id', activeBusinessId ?? '')
    if (error) throw new Error(error.message)
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, tradeRole } : m)))
  }, [activeBusinessId])

  const updateEmployment = useCallback(
    async (
      id: string,
      patch: Partial<{
        employmentType: EmploymentType
        weeklyHours: number
        employmentStartDate: string | null
        annualLeaveOpeningHours: number
        sickLeaveOpeningHours: number
      }>
    ) => {
      const { error } = await supabase
        .from('business_memberships')
        .update({
          ...(patch.employmentType !== undefined ? { employment_type: patch.employmentType } : {}),
          ...(patch.weeklyHours !== undefined ? { weekly_hours: patch.weeklyHours } : {}),
          ...(patch.employmentStartDate !== undefined ? { employment_start_date: patch.employmentStartDate } : {}),
          ...(patch.annualLeaveOpeningHours !== undefined ? { annual_leave_opening_hours: patch.annualLeaveOpeningHours } : {}),
          ...(patch.sickLeaveOpeningHours !== undefined ? { sick_leave_opening_hours: patch.sickLeaveOpeningHours } : {}),
        })
        .eq('person_id', id)
        .eq('business_id', activeBusinessId ?? '')
      if (error) throw new Error(error.message)
      setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
    },
    [activeBusinessId]
  )

  const value = useMemo(
    () => ({ team, loading, refresh, updateRate, updateTradeRole, updateEmployment }),
    [team, loading, refresh, updateRate, updateTradeRole, updateEmployment]
  )

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeamStore() {
  const ctx = useContext(TeamContext)
  if (!ctx) throw new Error('useTeamStore must be used within TeamProvider')
  return ctx
}
