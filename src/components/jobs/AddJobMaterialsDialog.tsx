import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useProductSearch } from '@/lib/useProductSearch'
import { useProductSources } from '@/lib/useProductSources'
import { sectionCaption, type ProductHit } from '@/lib/api/productSearch'
import { formatMoney } from '@/lib/utils'

interface DraftItem {
  product: ProductHit
  qty: string
}

/** Owner picks materials from the price list; each is logged on the job at your cost × quantity. */
export function AddJobMaterialsDialog({ jobId, open, onClose }: { jobId: string; open: boolean; onClose: () => void }) {
  const { addMaterials } = useJobsStore()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<DraftItem[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { items: results, total, loading } = useProductSearch(search, { enabled: open })
  const { label: sourceLabel } = useProductSources()

  useEffect(() => {
    if (!open) return
    setSearch('')
    setItems([])
  }, [open])

  const add = (product: ProductHit) =>
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev.map((i) => (i === existing ? { ...i, qty: String(Number(i.qty || 0) + 1) } : i))
      return [...prev, { product, qty: '1' }]
    })

  const setQty = (id: string, qty: string) => setItems((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty } : i)))
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.product.id !== id))

  const lineCost = (i: DraftItem) => (i.product.unitPrice ?? 0) * Number(i.qty || 0)
  const total$ = items.reduce((sum, i) => sum + lineCost(i), 0)
  const canSubmit = items.length > 0 && items.every((i) => Number(i.qty) > 0)

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await addMaterials(
        jobId,
        items.map((i) => ({ productId: i.product.id, name: i.product.name, unit: i.product.unit, qty: Number(i.qty), unitCost: i.product.unitPrice ?? 0 }))
      )
      toast.success(items.length === 1 ? 'Material added to the job' : `${items.length} materials added to the job`)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add materials')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add materials</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search e.g. 2.5 cable, 2g gpo white" className="pl-9" autoFocus />
          </div>

          {sourceLabel && <p className="-mt-1 text-[11px] text-muted-foreground">From the {sourceLabel} price list — prices shown are what you pay.</p>}
          <div className="max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {loading && results.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Searching…</p>
            ) : results.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">Nothing matches — try fewer words, or log it as a cost instead.</p>
            ) : (
              results.map((p, i) => (
                <div key={p.id}>
                  {sectionCaption(results, i, search.trim() !== '') && (
                    <p className="bg-secondary/50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{sectionCaption(results, i, search.trim() !== '')}</p>
                  )}
                  <button type="button" onClick={() => add(p)} className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary/60">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{[p.brand, p.supplierCode, `${formatMoney(p.unitPrice ?? 0)} per ${p.unit}`].filter(Boolean).join(' · ')}</span>
                    </span>
                    <Plus className="size-4 shrink-0 text-primary" />
                  </button>
                </div>
              ))
            )}
            {total > results.length && (
              <p className="p-2 text-center text-[11px] text-muted-foreground">
                Showing {results.length} of {total.toLocaleString()} — type more to narrow it down
              </p>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Adding to this job</p>
              {items.map((i) => (
                <div key={i.product.id} className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm">{i.product.name}</p>
                  <Input type="number" min="0" step="any" value={i.qty} onChange={(e) => setQty(i.product.id, e.target.value)} className="h-8 w-20" aria-label={`Quantity of ${i.product.name}`} />
                  <span className="w-20 shrink-0 text-right text-sm">{formatMoney(lineCost(i))}</span>
                  <button type="button" onClick={() => remove(i.product.id)} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Remove ${i.product.name}`}>
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <div className="flex justify-between border-t border-border pt-2 text-sm font-medium">
                <span>Cost to you</span>
                <span>{formatMoney(total$)}</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || submitting} onClick={submit}>
            {submitting ? 'Adding…' : items.length > 1 ? `Add ${items.length} materials` : 'Add to job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
