import { useEffect, useState } from 'react'
import { getProductSources, type ProductSource } from '@/lib/api/productSearch'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'
import { formatDate } from '@/lib/utils'

/** "MM Electrical" / "MM Electrical + 2 other lists" — null until loaded or when there are no products. */
export function useProductSources(): { sources: ProductSource[]; label: string | null; updated: string | null } {
  const { activeBusinessId } = useActiveBusiness()
  const [sources, setSources] = useState<ProductSource[]>([])

  useEffect(() => {
    if (!activeBusinessId) return
    let cancelled = false
    getProductSources()
      .then((s) => !cancelled && setSources(s))
      .catch(() => !cancelled && setSources([]))
    return () => {
      cancelled = true
    }
  }, [activeBusinessId])

  if (sources.length === 0) return { sources, label: null, updated: null }
  const names = sources.map((s) => s.source)
  const label = names.length <= 2 ? names.join(' and ') : `${names[0]} and ${names.length - 1} other sources`
  const latest = sources.map((s) => s.lastPriceUpdate).filter((d): d is string => !!d).sort().at(-1) ?? null
  return { sources, label, updated: latest ? formatDate(latest, { day: 'numeric', month: 'short', year: 'numeric' }) : null }
}
