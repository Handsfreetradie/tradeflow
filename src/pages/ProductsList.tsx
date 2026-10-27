import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Package, Plus, Search, Pencil, Trash2, Upload, Boxes } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useProductsStore, type Product } from '@/lib/store/products-store'
import { useStockStore } from '@/lib/store/stock-store'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { useProductSearch } from '@/lib/useProductSearch'
import type { ProductHit } from '@/lib/api/productSearch'
import { formatMoney, withMarkup } from '@/lib/utils'

const UNITS = ['each', 'hour', 'metre', 'sqm', 'day', 'kit']

function ProductDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Product | null
  onSaved: () => void
}) {
  const { addProduct, updateProduct } = useProductsStore()
  const { suppliers } = useStockStore()
  const [trackStock, setTrackStock] = useState(editing?.trackStock ?? false)
  const [stockQty, setStockQty] = useState('')
  const [reorderLevel, setReorderLevel] = useState(editing?.reorderLevel.toString() ?? '')
  const [reorderQty, setReorderQty] = useState(editing?.reorderQty.toString() ?? '')
  const [supplierId, setSupplierId] = useState(editing?.supplierId ?? 'none')
  const [supplierCode, setSupplierCode] = useState(editing?.supplierCode ?? '')
  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [category, setCategory] = useState(editing?.category ?? '')
  const [unit, setUnit] = useState(editing?.unit ?? 'each')
  const [unitPrice, setUnitPrice] = useState(editing?.unitPrice.toString() ?? '')
  const [submitting, setSubmitting] = useState(false)

  const resetFor = (p: Product | null) => {
    setName(p?.name ?? '')
    setDescription(p?.description ?? '')
    setCategory(p?.category ?? '')
    setUnit(p?.unit ?? 'each')
    setUnitPrice(p?.unitPrice.toString() ?? '')
    setTrackStock(p?.trackStock ?? false)
    setStockQty('')
    setReorderLevel(p?.reorderLevel.toString() ?? '')
    setReorderQty(p?.reorderQty.toString() ?? '')
    setSupplierId(p?.supplierId ?? 'none')
    setSupplierCode(p?.supplierCode ?? '')
  }

  const canSubmit = name.trim().length > 0 && (!trackStock || Number(reorderQty) > 0)

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const input = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        unit,
        unitPrice: Number(unitPrice) || 0,
        trackStock,
        stockQty: Number(stockQty) || 0,
        reorderLevel: Number(reorderLevel) || 0,
        reorderQty: Number(reorderQty) || 0,
        supplierId: supplierId === 'none' ? null : supplierId,
        supplierCode: supplierCode.trim(),
      }
      if (editing) {
        await updateProduct(editing.id, input)
        toast.success('Product updated')
      } else {
        await addProduct(input)
        toast.success('Product added')
      }
      onOpenChange(false)
      resetFor(null)
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) resetFor(editing)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit product / service' : 'Add product / service'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. RCD Safety Switch (per circuit)" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description (optional)</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Switchboards" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Price ($)</label>
              <Input type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <Checkbox checked={trackStock} onCheckedChange={(v) => setTrackStock(v === true)} className="mt-0.5" />
              <span>
                <span className="block text-sm font-medium">Track stock and flag when it runs low</span>
                <span className="block text-xs text-muted-foreground">
                  Best for basics you use all the time. Materials your team adds to jobs from this item come off the count automatically.
                </span>
              </span>
            </label>
            {trackStock && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {!editing && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">In stock now</label>
                      <Input type="number" min="0" step="any" value={stockQty} onChange={(e) => setStockQty(e.target.value)} className="mt-1" />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Reorder when at or below</label>
                    <Input type="number" min="0" step="any" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Order quantity</label>
                    <Input type="number" min="0" step="any" value={reorderQty} onChange={(e) => setReorderQty(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Supplier</label>
                    <Select value={supplierId} onValueChange={setSupplierId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No supplier yet</SelectItem>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {suppliers.length === 0 && <p className="mt-1 text-[11px] text-muted-foreground">Add suppliers in Settings → Suppliers.</p>}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Supplier's product code</label>
                    <Input value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} placeholder="Optional" className="mt-1" />
                  </div>
                </div>
                {!(Number(reorderQty) > 0) && <p className="text-[11px] text-destructive">Set how many to order when it runs low.</p>}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit || submitting} onClick={submit}>
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteAllDialog({ open, count, onClose, onDone }: { open: boolean; count: number | null; onClose: () => void; onDone: () => void }) {
  const { deleteAllProducts } = useProductsStore()
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)

  const close = () => {
    setTyped('')
    onClose()
  }

  const run = async () => {
    setDeleting(true)
    try {
      await deleteAllProducts()
      toast.success('All products deleted')
      close()
      onDone()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{count === null ? 'Delete all products?' : `Delete all ${count.toLocaleString()} products?`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>This clears your whole products list, including stock counts and reorder settings. It can't be undone.</p>
          <p className="text-muted-foreground">
            Jobs, quotes and invoices that already used these products are not affected. Items waiting on the Stock orders list stay there as typed items.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Type DELETE to confirm</label>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} className="mt-1" autoFocus />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button variant="danger" disabled={typed.trim() !== 'DELETE' || deleting} onClick={run}>
            {deleting ? 'Deleting…' : 'Delete all'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StockCountDialog({ product, onClose, onSaved }: { product: ProductHit | null; onClose: () => void; onSaved: () => void }) {
  const { setStock } = useProductsStore()
  const [count, setCount] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!product || count.trim() === '' || !Number.isFinite(Number(count))) return
    setSaving(true)
    try {
      await setStock(product.id, Number(count))
      toast.success('Stock count updated')
      onClose()
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock count — {product?.name}</DialogTitle>
        </DialogHeader>
        <div>
          <p className="mb-2 text-xs text-muted-foreground">
            TradeFlow thinks you have {product?.stockQty} {product?.unit}. Type what's actually on the shelf / in the van. A delivery you ordered through
            Stock orders is added for you when you book it in.
          </p>
          <label className="text-xs font-medium text-muted-foreground">Count now</label>
          <Input type="number" step="any" autoFocus value={count} onChange={(e) => setCount(e.target.value)} className="mt-1" />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving || count.trim() === ''} onClick={save}>
            {saving ? 'Saving…' : 'Save count'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductsList() {
  const navigate = useNavigate()
  const { deleteProduct, loadProduct } = useProductsStore()
  const { settings } = useBusinessSettings()
  const markup = settings.materialsMarkupPercent
  const [search, setSearch] = useState('')
  const { items, total, loading, loadingMore, error, hasMore, loadMore, reload } = useProductSearch(search)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [removeTarget, setRemoveTarget] = useState<ProductHit | null>(null)
  const [countTarget, setCountTarget] = useState<ProductHit | null>(null)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)

  const searching = search.trim() !== ''

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = async (hit: ProductHit) => {
    try {
      setEditing(await loadProduct(hit.id))
      setDialogOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open that product')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products & Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your supplier price list. Prices here are what you pay{markup > 0 ? `; ${markup}% markup is added when you quote` : ''}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/import')}>
            <Upload />
            Import from supplier CSV
          </Button>
          {(total > 0 || searching) && (
            <Button variant="secondary" onClick={() => setDeleteAllOpen(true)}>
              <Trash2 />
              Delete all
            </Button>
          )}
          <Button onClick={openNew}>
            <Plus />
            Add product
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, size, code… e.g. 2.5 cable, 2g gpo white"
            className="pl-9"
            autoFocus
          />
        </div>
        {!loading && (
          <p className="text-xs text-muted-foreground">
            {searching ? `${total.toLocaleString()} match${total === 1 ? '' : 'es'}` : `${total.toLocaleString()} products`}
            {hasMore && ` · showing the first ${items.length}`}
          </p>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <p className="p-6 text-center text-sm text-destructive">{error}</p>
          ) : loading && items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Searching…</p>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Package}
              title={searching ? 'No products match your search' : 'No products yet'}
              description={searching ? 'Try fewer words, or part of the code.' : 'Import your supplier price list, or add the things you use often.'}
            />
          ) : (
            <div className="divide-y divide-border">
              {items.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[p.supplierCode, p.vendorPart && p.vendorPart !== p.supplierCode ? `Part ${p.vendorPart}` : '', `per ${p.unit}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {p.trackStock && p.stockQty !== null && (
                    <button
                      type="button"
                      onClick={() => setCountTarget(p)}
                      className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-secondary"
                      title="Update the stock count"
                    >
                      <Boxes className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{p.stockQty}</span>
                      <span className="text-muted-foreground">in stock</span>
                      {p.reorderLevel !== null && p.stockQty <= p.reorderLevel && <Badge variant="warning">Low</Badge>}
                    </button>
                  )}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium">{formatMoney(p.unitPrice ?? 0)}</p>
                    <p className="text-[11px] text-muted-foreground">{markup > 0 ? `sell ${formatMoney(withMarkup(p.unitPrice ?? 0, markup))}` : 'your cost'}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setRemoveTarget(p)}>
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
            {loadingMore ? 'Loading…' : 'Show more'}
          </Button>
        </div>
      )}

      <ProductDialog key={editing?.id ?? 'new'} open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} onSaved={reload} />
      <DeleteAllDialog open={deleteAllOpen} count={searching ? null : total} onClose={() => setDeleteAllOpen(false)} onDone={reload} />
      <StockCountDialog key={countTarget?.id ?? 'none'} product={countTarget} onClose={() => setCountTarget(null)} onSaved={reload} />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title={`Delete ${removeTarget?.name}?`}
        description="This only removes it from your catalog — it won't affect jobs, quotes or invoices that already used it."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() =>
          removeTarget &&
          deleteProduct(removeTarget.id)
            .then(reload)
            .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to delete'))
        }
      />
    </div>
  )
}
