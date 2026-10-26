import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'
import { quarterFromDate, type BasQuarter } from '@/lib/bas'

export interface BasSnapshot {
  g1: number
  oneA: number
  oneB: number
  netGst: number
}

export interface LodgedPeriod extends BasSnapshot {
  year: number
  quarterIndex: 0 | 1 | 2 | 3
  lodgedAt: string
}

interface BasPeriodsContextValue {
  loading: boolean
  lodgedPeriods: LodgedPeriod[]
  isLocked: (quarter: Pick<BasQuarter, 'year' | 'quarterIndex'>) => boolean
  isDateLocked: (dateKey: string) => boolean
  lockQuarter: (quarter: BasQuarter, snapshot: BasSnapshot) => Promise<void>
  unlockQuarter: (quarter: BasQuarter) => Promise<void>
}

const BasPeriodsContext = createContext<BasPeriodsContextValue | null>(null)

function key(p: Pick<LodgedPeriod, 'year' | 'quarterIndex'>): string {
  return `${p.year}-${p.quarterIndex}`
}

export function BasPeriodsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const { activeBusinessId } = useActiveBusiness()
  const [lodgedPeriods, setLodgedPeriods] = useState<LodgedPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || !activeBusinessId) {
      setLodgedPeriods([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setLodgedPeriods([])
    supabase
      .from('bas_periods')
      .select('year, quarter_index, lodged_at, g1, one_a, one_b, net_gst')
      .eq('business_id', activeBusinessId)
      .then(({ data }) => {
        if (cancelled) return
        if (data) {
          setLodgedPeriods(
            data.map((r) => ({
              year: r.year,
              quarterIndex: r.quarter_index as 0 | 1 | 2 | 3,
              lodgedAt: r.lodged_at,
              g1: r.g1,
              oneA: r.one_a,
              oneB: r.one_b,
              netGst: r.net_gst,
            }))
          )
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session, activeBusinessId])

  const isLocked = useCallback(
    (quarter: Pick<BasQuarter, 'year' | 'quarterIndex'>) => lodgedPeriods.some((p) => key(p) === key(quarter)),
    [lodgedPeriods]
  )

  const isDateLocked = useCallback((dateKey: string) => isLocked(quarterFromDate(new Date(dateKey))), [isLocked])

  const lockQuarter = useCallback(async (quarter: BasQuarter, snapshot: BasSnapshot) => {
    const { data: row, error } = await supabase
      .from('bas_periods')
      .insert({
        business_id: activeBusinessId ?? '',
        year: quarter.year,
        quarter_index: quarter.quarterIndex,
        g1: snapshot.g1,
        one_a: snapshot.oneA,
        one_b: snapshot.oneB,
        net_gst: snapshot.netGst,
      })
      .select('lodged_at')
      .single()
    if (error || !row) throw new Error(error?.message ?? 'Failed to lock quarter')
    setLodgedPeriods((prev) => [...prev, { year: quarter.year, quarterIndex: quarter.quarterIndex, lodgedAt: row.lodged_at, ...snapshot }])
  }, [activeBusinessId])

  const unlockQuarter = useCallback(async (quarter: BasQuarter) => {
    const { error } = await supabase
      .from('bas_periods')
      .delete()
      .eq('business_id', activeBusinessId ?? '')
      .eq('year', quarter.year)
      .eq('quarter_index', quarter.quarterIndex)
    if (error) throw new Error(error.message)
    setLodgedPeriods((prev) => prev.filter((p) => key(p) !== key(quarter)))
  }, [activeBusinessId])

  const value = useMemo(
    () => ({ loading, lodgedPeriods, isLocked, isDateLocked, lockQuarter, unlockQuarter }),
    [loading, lodgedPeriods, isLocked, isDateLocked, lockQuarter, unlockQuarter]
  )

  return <BasPeriodsContext.Provider value={value}>{children}</BasPeriodsContext.Provider>
}

export function useBasPeriodsStore() {
  const ctx = useContext(BasPeriodsContext)
  if (!ctx) throw new Error('useBasPeriodsStore must be used within BasPeriodsProvider')
  return ctx
}
