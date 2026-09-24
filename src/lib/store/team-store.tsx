import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface TeamMember {
  id: string
  fullName: string
  role: 'owner' | 'employee'
  email: string
}

interface TeamContextValue {
  team: TeamMember[]
  loading: boolean
  refresh: () => void
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
      .select('id, full_name, role, email')
      .order('full_name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) {
          setTeam(data.map((p) => ({ id: p.id, fullName: p.full_name, role: p.role as 'owner' | 'employee', email: p.email })))
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const value = useMemo(() => ({ team, loading, refresh: () => setTick((t) => t + 1) }), [team, loading])

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeamStore() {
  const ctx = useContext(TeamContext)
  if (!ctx) throw new Error('useTeamStore must be used within TeamProvider')
  return ctx
}
