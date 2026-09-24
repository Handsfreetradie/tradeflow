import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface TeamMember {
  id: string
  fullName: string
  role: 'owner' | 'employee'
  email: string
  hourlyRate: number | null
}

interface TeamContextValue {
  team: TeamMember[]
  loading: boolean
  refresh: () => void
  updateRate: (id: string, hourlyRate: number | null) => Promise<void>
}

const TeamContext = createContext<TeamContextValue | null>(null)

export function TeamProvider({ children }: { children: ReactNode }) {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    supabase
      .from('profiles')
      .select('id, full_name, role, email, hourly_rate')
      .order('full_name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) {
          setTeam(
            data.map((p) => ({ id: p.id, fullName: p.full_name, role: p.role as 'owner' | 'employee', email: p.email, hourlyRate: p.hourly_rate }))
          )
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const updateRate = useCallback(async (id: string, hourlyRate: number | null) => {
    const { error } = await supabase.from('profiles').update({ hourly_rate: hourlyRate }).eq('id', id)
    if (error) throw new Error(error.message)
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, hourlyRate } : m)))
  }, [])

  const value = useMemo(() => ({ team, loading, refresh, updateRate }), [team, loading, refresh, updateRate])

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeamStore() {
  const ctx = useContext(TeamContext)
  if (!ctx) throw new Error('useTeamStore must be used within TeamProvider')
  return ctx
}
