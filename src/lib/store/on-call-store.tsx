import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { toDateKey } from '@/lib/utils'

export interface OnCallWeek {
  weekStart: string
  employeeId: string | null
  employeeName: string | null
}

interface OnCallContextValue {
  roster: OnCallWeek[]
  loading: boolean
  getOnCallFor: (dateKey: string) => OnCallWeek | null
  assignWeek: (weekStart: string, employeeId: string | null) => Promise<void>
  refresh: () => void
}

const OnCallContext = createContext<OnCallContextValue | null>(null)

/** Monday of the week containing this date, as a YYYY-MM-DD key — the roster's canonical unit. */
export function mondayOf(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toDateKey(d)
}

type RosterRow = {
  week_start: string
  employee_id: string | null
  employee: { full_name: string } | null
}

export function OnCallProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [roster, setRoster] = useState<OnCallWeek[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('on_call_roster')
      .select('week_start, employee_id, employee:profiles(full_name)')
      .order('week_start')
    if (!error && data) {
      setRoster(
        (data as unknown as RosterRow[]).map((r) => ({
          weekStart: r.week_start,
          employeeId: r.employee_id,
          employeeName: r.employee?.full_name ?? null,
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (session) load()
  }, [session, tick, load])

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const getOnCallFor = useCallback(
    (dateKey: string) => {
      const weekStart = mondayOf(new Date(dateKey))
      return roster.find((r) => r.weekStart === weekStart) ?? null
    },
    [roster]
  )

  const assignWeek = useCallback(
    async (weekStart: string, employeeId: string | null) => {
      const { error } = await supabase.from('on_call_roster').upsert({ week_start: weekStart, employee_id: employeeId }, { onConflict: 'week_start' })
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const value = useMemo(
    () => ({ roster, loading, getOnCallFor, assignWeek, refresh }),
    [roster, loading, getOnCallFor, assignWeek, refresh]
  )

  return <OnCallContext.Provider value={value}>{children}</OnCallContext.Provider>
}

export function useOnCallStore() {
  const ctx = useContext(OnCallContext)
  if (!ctx) throw new Error('useOnCallStore must be used within OnCallProvider')
  return ctx
}
