import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { NAV_ITEMS, type NavDef } from '@/lib/navItems'

interface NavPrefs {
  order: string[]
  hidden: string[]
}

interface NavPrefsState {
  /** Every item in the person's order, hidden ones included — for the customise screen. */
  allItems: NavDef[]
  /** What the sidebar and phone menu actually show. */
  visibleItems: NavDef[]
  isHidden: (key: string) => boolean
  save: (order: string[], hidden: string[]) => Promise<void>
  reset: () => Promise<void>
  customiseOpen: boolean
  openCustomise: () => void
  closeCustomise: () => void
}

const NavPrefsContext = createContext<NavPrefsState | undefined>(undefined)

const EMPTY: NavPrefs = { order: [], hidden: [] }
const cacheKey = (userId: string) => `tf-nav-prefs-${userId}`

function readCache(userId: string): NavPrefs {
  try {
    const raw = localStorage.getItem(cacheKey(userId))
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
  } catch {
    return EMPTY
  }
}

function writeCache(userId: string, prefs: NavPrefs) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(prefs))
  } catch {
    // private window / blocked storage — the saved copy in the database still works
  }
}

/** Saved order first (ignoring anything that no longer exists); items added to the app since go on the end. */
function applyOrder(order: string[]): NavDef[] {
  const byKey = new Map(NAV_ITEMS.map((i) => [i.key, i]))
  const seen = new Set<string>()
  const result: NavDef[] = []
  for (const key of order) {
    const item = byKey.get(key)
    if (item && !seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }
  for (const item of NAV_ITEMS) if (!seen.has(item.key)) result.push(item)
  return result
}

export function NavPrefsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const [prefs, setPrefs] = useState<NavPrefs>(EMPTY)
  const [customiseOpen, setCustomiseOpen] = useState(false)

  useEffect(() => {
    if (!userId) {
      setPrefs(EMPTY)
      return
    }
    setPrefs(readCache(userId))
    let cancelled = false
    supabase
      .from('user_nav_prefs')
      .select('item_order, hidden')
      .eq('person_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return
        const fromDb = { order: data.item_order, hidden: data.hidden }
        setPrefs(fromDb)
        writeCache(userId, fromDb)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const persist = useCallback(
    async (next: NavPrefs) => {
      if (!userId) return
      const previous = prefs
      setPrefs(next)
      writeCache(userId, next)
      const { error } = await supabase
        .from('user_nav_prefs')
        .upsert({ person_id: userId, item_order: next.order, hidden: next.hidden, updated_at: new Date().toISOString() })
      if (error) {
        setPrefs(previous)
        writeCache(userId, previous)
        throw new Error(error.message)
      }
    },
    [userId, prefs]
  )

  const value = useMemo<NavPrefsState>(() => {
    const allItems = applyOrder(prefs.order)
    const hidden = new Set(prefs.hidden)
    const isHidden = (key: string) => hidden.has(key) && !NAV_ITEMS.find((i) => i.key === key)?.locked
    return {
      allItems,
      visibleItems: allItems.filter((i) => !isHidden(i.key)),
      isHidden,
      save: (order, hiddenKeys) => persist({ order, hidden: hiddenKeys }),
      reset: () => persist(EMPTY),
      customiseOpen,
      openCustomise: () => setCustomiseOpen(true),
      closeCustomise: () => setCustomiseOpen(false),
    }
  }, [prefs, persist, customiseOpen])

  return <NavPrefsContext.Provider value={value}>{children}</NavPrefsContext.Provider>
}

export function useNavPrefs() {
  const ctx = useContext(NavPrefsContext)
  if (!ctx) throw new Error('useNavPrefs must be used within NavPrefsProvider')
  return ctx
}
