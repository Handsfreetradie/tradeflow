import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Package, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useProductsStore, type Product } from '@/lib/store/products-store'
import { formatCurrency } from '@/lib/utils'

const UNITS = ['each', 'hour', 'metre', 'sqm', 'day', 'kit']

function ProductDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Product | null
}) {
  const { addProduct, updateProduct } = useProductsStore()
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
  }

  const canSubmit = name.trim().length > 0

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const input = { name: name.trim(), description: description.trim(), category: category.trim(), unit, unitPrice: Number(unitPrice) || 0 }
      if (editing) {
        await updateProduct(editing.id, input)
        toast.success('Product updated')
      } else {
        await addProduct(input)
        toast.success('Product added')
      }
      onOpenChange(false)
      resetFor(null)
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

export default function ProductsList() {
  const { products, loading, deleteProduct } = useProductsStore()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
  }, [products, search])

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (p: Product) => {
    setEditing(p)
    setDialogOpen(true)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products & Services</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your reusable catalog — pick these straight into jobs, quotes and invoices.</p>
        </div>
        <Button onClick={openNew}>
          <Plus />
          Add product
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Package}
              title={products.length === 0 ? 'No products yet' : 'No products match your search'}
              description={products.length === 0 ? 'Add the things you sell often so you can add them to jobs in one click.' : undefined}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.category && `${p.category} · `}
                      {formatCurrency(p.unitPrice)} / {p.unit}
                    </p>
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

      <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title={`Delete ${removeTarget?.name}?`}
        description="This only removes it from your catalog — it won't affect jobs, quotes or invoices that already used it."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => removeTarget && deleteProduct(removeTarget.id).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to delete'))}
      />
    </div>
  )
}
