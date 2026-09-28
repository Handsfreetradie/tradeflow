import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { quarterFromDate, type BasQuarter } from '@/lib/bas'

interface LockedPeriod {
  year: number
  quarterIndex: 0 | 1 | 2 | 3
}

interface BasPeriodsContextValue {
  loading: boolean
  isLocked: (quarter: Pick<BasQuarter, 'year' | 'quarterIndex'>) => boolean
  isDateLocked: (dateKey: string) => boolean
  lockQuarter: (quarter: BasQuarter) => Promise<void>
  unlockQuarter: (quarter: BasQuarter) => Promise<void>
}

const BasPeriodsContext = createContext<BasPeriodsContextValue | null>(null)

function key(p: LockedPeriod): string {
  return `${p.year}-${p.quarterIndex}`
}

export function BasPeriodsProvider({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState<LockedPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('bas_periods')
      .select('year, quarter_index')
      .then(({ data }) => {
        if (cancelled) return
        if (data) setLocked(data.map((r) => ({ year: r.year, quarterIndex: r.quarter_index as 0 | 1 | 2 | 3 })))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isLocked = useCallback((quarter: Pick<BasQuarter, 'year' | 'quarterIndex'>) => locked.some((p) => key(p) === key(quarter)), [locked])

  const isDateLocked = useCallback((dateKey: string) => isLocked(quarterFromDate(new Date(dateKey))), [isLocked])

  const lockQuarter = useCallback(async (quarter: BasQuarter) => {
    const { error } = await supabase.from('bas_periods').insert({ year: quarter.year, quarter_index: quarter.quarterIndex })
    if (error) throw new Error(error.message)
    setLocked((prev) => [...prev, { year: quarter.year, quarterIndex: quarter.quarterIndex }])
  }, [])

  const unlockQuarter = useCallback(async (quarter: BasQuarter) => {
    const { error } = await supabase.from('bas_periods').delete().eq('year', quarter.year).eq('quarter_index', quarter.quarterIndex)
    if (error) throw new Error(error.message)
    setLocked((prev) => prev.filter((p) => key(p) !== key(quarter)))
  }, [])

  const value = useMemo(
    () => ({ loading, isLocked, isDateLocked, lockQuarter, unlockQuarter }),
    [loading, isLocked, isDateLocked, lockQuarter, unlockQuarter]
  )

  return <BasPeriodsContext.Provider value={value}>{children}</BasPeriodsContext.Provider>
}

export function useBasPeriodsStore() {
  const ctx = useContext(BasPeriodsContext)
  if (!ctx) throw new Error('useBasPeriodsStore must be used within BasPeriodsProvider')
  return ctx
}
