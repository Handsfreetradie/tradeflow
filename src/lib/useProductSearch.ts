import { useCallback, useEffect, useRef, useState } from 'react'
import { searchProducts, type ProductHit } from '@/lib/api/productSearch'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'

const PAGE_SIZE = 40
const DEBOUNCE_MS = 200

/** Live product search: type and the list updates; "load more" pages through big result sets. */
export function useProductSearch(query: string, opts: { enabled?: boolean; onlyTracked?: boolean } = {}) {
  const { enabled = true, onlyTracked = false } = opts
  const { activeBusinessId } = useActiveBusiness()
  const [items, setItems] = useState<ProductHit[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  // Only the newest request may update the screen (typing fast fires several).
  const requestId = useRef(0)

  useEffect(() => {
    if (!enabled || !activeBusinessId) return
    const id = ++requestId.current
    setLoading(true)
    const timer = setTimeout(() => {
      searchProducts(query, { limit: PAGE_SIZE, onlyTracked })
        .then((res) => {
          if (id !== requestId.current) return
          setItems(res.items)
          setTotal(res.total)
          setError(null)
        })
        .catch((e) => {
          if (id !== requestId.current) return
          setError(e instanceof Error ? e.message : 'Search failed')
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false)
        })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, enabled, onlyTracked, activeBusinessId, tick])

  const loadMore = useCallback(async () => {
    if (loadingMore) return
    const id = requestId.current
    setLoadingMore(true)
    try {
      const res = await searchProducts(query, { limit: PAGE_SIZE, offset: items.length, onlyTracked })
      if (id !== requestId.current) return
      setItems((prev) => [...prev, ...res.items.filter((r) => !prev.some((p) => p.id === r.id))])
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoadingMore(false)
    }
  }, [query, items.length, onlyTracked, loadingMore])

  const reload = useCallback(() => setTick((n) => n + 1), [])

  return { items, total, loading, loadingMore, error, hasMore: items.length < total, loadMore, reload }
}
