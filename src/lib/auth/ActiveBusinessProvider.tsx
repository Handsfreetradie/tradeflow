import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth, type Role } from '@/lib/auth/AuthProvider'
import { CHOSEN_KEY, LAST_USED_KEY, clearBusinessChoice, readChoice, writeChoice } from '@/lib/auth/business-choice'

export interface Membership {
  businessId: string
  businessName: string
  role: Role
}

interface ActiveBusinessState {
  memberships: Membership[]
  /** The business the app is currently showing. Null until memberships load, or if there are none. */
  activeBusinessId: string | null
  activeRole: Role | null
  activeBusinessName: string | null
  loading: boolean
  /** True when the person belongs to more than one business and hasn't picked one yet this session. */
  needsChoice: boolean
  /** Last business used on this device — only a convenience for pre-selecting in the chooser. */
  lastUsedBusinessId: string | null
  chooseBusiness: (businessId: string) => void
  /** Sends the person back to the chooser (the "switch business" action). */
  openChooser: () => void
}

const ActiveBusinessContext = createContext<ActiveBusinessState | undefined>(undefined)

export function ActiveBusinessProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [chosenId, setChosenId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setMemberships([])
      setChosenId(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setMemberships([])
    setChosenId(null)
    ;(async () => {
      const { data: rows } = await supabase.from('business_memberships').select('business_id, role').eq('person_id', userId)
      const ids = (rows ?? []).map((r) => r.business_id)
      const { data: businesses } = ids.length
        ? await supabase.from('businesses').select('id, name').in('id', ids)
        : { data: [] as { id: string; name: string }[] }
      if (cancelled) return
      const nameById = new Map((businesses ?? []).map((b) => [b.id, b.name]))
      const list: Membership[] = (rows ?? [])
        .map((r) => ({
          businessId: r.business_id,
          businessName: nameById.get(r.business_id) ?? 'My Business',
          role: r.role as Role,
        }))
        .sort((a, b) => a.businessName.localeCompare(b.businessName))
      setMemberships(list)
      const saved = readChoice('session', CHOSEN_KEY)
      setChosenId(saved && list.some((m) => m.businessId === saved) ? saved : null)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const chooseBusiness = useCallback((businessId: string) => {
    writeChoice('session', CHOSEN_KEY, businessId)
    writeChoice('local', LAST_USED_KEY, businessId)
    setChosenId(businessId)
  }, [])

  const openChooser = useCallback(() => {
    clearBusinessChoice()
    setChosenId(null)
  }, [])

  const value = useMemo<ActiveBusinessState>(() => {
    // One business: no choice to make. Several: wait for the person to pick.
    const activeId = memberships.length === 1 ? memberships[0].businessId : chosenId
    const active = memberships.find((m) => m.businessId === activeId) ?? null
    return {
      memberships,
      activeBusinessId: active?.businessId ?? null,
      activeRole: active?.role ?? null,
      activeBusinessName: active?.businessName ?? null,
      loading,
      needsChoice: !loading && memberships.length > 1 && !active,
      lastUsedBusinessId: readChoice('local', LAST_USED_KEY),
      chooseBusiness,
      openChooser,
    }
  }, [memberships, chosenId, loading, chooseBusiness, openChooser])

  return <ActiveBusinessContext.Provider value={value}>{children}</ActiveBusinessContext.Provider>
}

export function useActiveBusiness() {
  const ctx = useContext(ActiveBusinessContext)
  if (!ctx) throw new Error('useActiveBusiness must be used within ActiveBusinessProvider')
  return ctx
}

/** Remounts everything below it when the active business changes, so no store can keep
 * showing the previous business's data after a switch. */
export function BusinessScope({ children }: { children: ReactNode }) {
  const { activeBusinessId } = useActiveBusiness()
  return <Fragment key={activeBusinessId ?? 'none'}>{children}</Fragment>
}
