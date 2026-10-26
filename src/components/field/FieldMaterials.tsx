import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Package, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth/AuthProvider'
import {
  useFieldJobsStore,
  type JobMaterial,
  type MaterialOption,
  type NewMaterialItem,
} from '@/lib/store/field-jobs-store'
import { formatDate } from '@/lib/utils'

interface DraftItem {
  key: string
  productId?: string
  name: string
  unit: string
  qty: string
}

const MAX_SEARCH_RESULTS = 30

function AddMaterialsDialog({ jobId, open, onOpenChange, onAdded }: { jobId: string; open: boolean; onOpenChange: (o: boolean) => void; onAdded: () => void }) {
  const { loadMaterialOptions, addMaterials } = useFieldJobsStore()
  const [options, setOptions] = useState<MaterialOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<DraftItem[]>([])
  const [otherName, setOtherName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setSearch('')
    setItems([])
    setOtherName('')
    setLoadingOptions(true)
    loadMaterialOptions()
      .then(setOptions)
      .catch(() => toast.error("Couldn't load the materials list"))
      .finally(() => setLoadingOptions(false))
  }, [open, loadMaterialOptions])

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    const matches = q ? options.filter((o) => `${o.name} ${o.category} ${o.description}`.toLowerCase().includes(q)) : options
    return matches.slice(0, MAX_SEARCH_RESULTS)
  }, [options, search])

  const addFromList = (o: MaterialOption) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === o.id)
      if (existing) return prev.map((i) => (i.key === existing.key ? { ...i, qty: String(Number(i.qty || 0) + 1) } : i))
      return [...prev, { key: o.id, productId: o.id, name: o.name, unit: o.unit, qty: '1' }]
    })
  }

  const addOther = () => {
    const name = otherName.trim()
    if (!name) return
    setItems((prev) => [...prev, { key: `other-${crypto.randomUUID()}`, name, unit: '', qty: '1' }])
    setOtherName('')
  }

  const setQty = (key: string, qty: string) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty } : i)))
  const removeItem = (key: string) => setItems((prev) => prev.filter((i) => i.key !== key))

  const canSubmit = items.length > 0 && items.every((i) => Number(i.qty) > 0)

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const payload: NewMaterialItem[] = items.map((i) => ({ productId: i.productId, name: i.productId ? undefined : i.name, unit: i.unit || undefined, qty: Number(i.qty) }))
      await addMaterials(jobId, payload)
      toast.success(items.length === 1 ? 'Material added to the job' : `${items.length} materials added to the job`)
      onAdded()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add materials')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add materials</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search the materials list" className="pl-9" />
          </div>

          <div className="max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {loadingOptions ? (
              <p className="p-3 text-sm text-muted-foreground">Loading…</p>
            ) : results.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">
                {options.length === 0 ? 'No materials on the list yet — add your own below.' : 'Nothing matches — add it below.'}
              </p>
            ) : (
              results.map((o) => (
                <button key={o.id} type="button" onClick={() => addFromList(o)} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-secondary/60">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{o.name}</span>
                    {(o.category || o.unit) && <span className="block truncate text-xs text-muted-foreground">{[o.category, o.unit && `per ${o.unit}`].filter(Boolean).join(' · ')}</span>}
                  </span>
                  <Plus className="size-4 shrink-0 text-primary" />
                </button>
              ))
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Not on the list?</p>
            <div className="mt-1 flex gap-2">
              <Input value={otherName} onChange={(e) => setOtherName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addOther()} placeholder="e.g. 20mm conduit saddles" />
              <Button type="button" variant="secondary" onClick={addOther} disabled={!otherName.trim()}>
                Add
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">The office will price anything typed in here.</p>
          </div>

          {items.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Going on this job</p>
              <div className="mt-1 divide-y divide-border rounded-lg border border-border">
                {items.map((i) => (
                  <div key={i.key} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{i.name}</p>
                      {!i.productId && <p className="text-xs text-warning">Not on the list</p>}
                    </div>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      value={i.qty}
                      onChange={(e) => setQty(i.key, e.target.value)}
                      className="w-20 text-right"
                      aria-label={`Quantity of ${i.name}`}
                    />
                    {i.unit && <span className="w-10 shrink-0 text-xs text-muted-foreground">{i.unit}</span>}
                    <button type="button" onClick={() => removeItem(i.key)} aria-label={`Remove ${i.name}`} className="shrink-0 text-muted-foreground">
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || submitting} onClick={submit}>
            {submitting ? 'Adding…' : items.length > 1 ? `Add ${items.length} items` : 'Add to job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The "Materials" card on the employee job screen: what the crew has added, plus a way to add more. */
export function FieldMaterialsCard({ jobId }: { jobId: string }) {
  const { session } = useAuth()
  const { listJobMaterials, removeMaterial } = useFieldJobsStore()
  const [materials, setMaterials] = useState<JobMaterial[]>([])
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const refresh = useCallback(() => {
    setNow(Date.now())
    listJobMaterials(jobId)
      .then(setMaterials)
      .catch(() => setMaterials([]))
  }, [listJobMaterials, jobId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const remove = async (m: JobMaterial) => {
    if (!window.confirm(`Remove "${m.description}" from this job?`)) return
    try {
      await removeMaterial(m.id)
      refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not remove that')
    }
  }

  const myId = session?.user.id

  return (
    <div className="mx-5 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Package className="size-3.5" />
          Materials
        </p>
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          <Plus />
          Add materials
        </Button>
      </div>

      {materials.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No materials added yet.</p>
      ) : (
        <div className="mt-2 divide-y divide-border">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{m.description}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.loggedByEmployeeId === myId ? 'You' : m.loggedByName} · {formatDate(m.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  {m.needsPricing ? ' · awaiting price' : ''}
                </p>
              </div>
              {m.loggedByEmployeeId === myId && now - new Date(m.createdAt).getTime() < 24 * 60 * 60 * 1000 && (
                <button type="button" onClick={() => remove(m)} aria-label={`Remove ${m.description}`} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AddMaterialsDialog jobId={jobId} open={open} onOpenChange={setOpen} onAdded={refresh} />
    </div>
  )
}
