import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'

export interface Trip {
  id: string
  date: string
  km: number
  fromLocation?: string
  toLocation?: string
  purpose: string
  jobId?: string
}

export interface NewTripInput {
  date: string
  km: number
  fromLocation?: string
  toLocation?: string
  purpose: string
  jobId?: string
}

interface TripsContextValue {
  trips: Trip[]
  loading: boolean
  addTrip: (input: NewTripInput) => Promise<Trip>
  deleteTrip: (id: string) => Promise<void>
}

const TripsContext = createContext<TripsContextValue | null>(null)

type TripRow = {
  id: string
  date: string
  km: number
  from_location: string | null
  to_location: string | null
  purpose: string
  job_id: string | null
}

function fromRow(row: TripRow): Trip {
  return {
    id: row.id,
    date: row.date,
    km: Number(row.km),
    fromLocation: row.from_location ?? undefined,
    toLocation: row.to_location ?? undefined,
    purpose: row.purpose,
    jobId: row.job_id ?? undefined,
  }
}

export function TripsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const { activeBusinessId } = useActiveBusiness()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || !activeBusinessId) {
      setTrips([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setTrips([])
    supabase
      .from('trips')
      .select('*')
      .eq('business_id', activeBusinessId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setTrips((data as TripRow[]).map(fromRow))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session, activeBusinessId])

  const addTrip = useCallback(
    async (input: NewTripInput) => {
      const { data: row, error } = await supabase
        .from('trips')
        .insert({
          business_id: activeBusinessId ?? undefined,
          date: input.date,
          km: input.km,
          from_location: input.fromLocation ?? null,
          to_location: input.toLocation ?? null,
          purpose: input.purpose,
          job_id: input.jobId ?? null,
        })
        .select('*')
        .single()
      if (error || !row) throw new Error(error?.message ?? 'Failed to log trip')
      const created = fromRow(row as TripRow)
      setTrips((prev) => [created, ...prev])
      return created
    },
    [activeBusinessId]
  )

  const deleteTrip = useCallback(async (id: string) => {
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setTrips((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(() => ({ trips, loading, addTrip, deleteTrip }), [trips, loading, addTrip, deleteTrip])

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>
}

export function useTripsStore() {
  const ctx = useContext(TripsContext)
  if (!ctx) throw new Error('useTripsStore must be used within TripsProvider')
  return ctx
}
