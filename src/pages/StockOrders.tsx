import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Copy, Mail, PackageCheck, Plus, ShoppingCart, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useProductsStore } from '@/lib/store/products-store'
import { useStockStore, type OrderItem, type Supplier } from '@/lib/store/stock-store'
import { previewOrder, sendOrder, type OrderPreview } from '@/lib/api/stockOrders'

const NO_SUPPLIER = 'none'
const OTHER_ITEM = 'other'

function itemLine(i: OrderItem) {
  const unit = i.unit && i.unit !== 'each' ? ` (${i.unit})` : ''
  const code = i.supplierCode ? ` — code ${i.supplierCode}` : ''
  return `${i.qty} × ${i.description}${unit}${code}`
}

function ReviewDialog({ supplier, onClose }: { supplier: Supplier | null; onClose: () => void }) {
  const { refresh } = useStockStore()
  const [draft, setDraft] = useState<OrderPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!supplier) return
    let cancelled = false
    setDraft(null)
    setLoading(true)
    previewOrder(supplier.id)
      .then((d) => !cancelled && setDraft(d))
      .catch((e) => {
        if (cancelled) return
        toast.error(e instanceof Error ? e.message : "Couldn't build the order email")
        onClose()
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // onClose is a fresh function each render; the dialog only needs to reload when the supplier changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier?.id])

  const send = async () => {
    if (!supplier || !draft) return
    setSending(true)
    try {
      const res = await sendOrder(supplier.id, draft)
      toast.success(`Order sent to ${res.to}`)
      refresh()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send')
      refresh()
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={!!supplier} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Order from {supplier?.name}</DialogTitle>
        </DialogHeader>
        {loading || !draft ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Writing the email…</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">To</label>
              <p className="mt-1 rounded-lg bg-secondary px-3 py-2 text-sm">{draft.to}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Subject</label>
              <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Message</label>
              <textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                rows={12}
                className="mt-1 w-full resize-y rounded-lg border border-input bg-white p-2.5 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Read it over — it goes from your Gmail to the supplier, and the items then show as "On order".</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!draft || sending || !draft.subject.trim() || !draft.body.trim()} onClick={send}>
            <Mail />
            {sending ? 'Sending…' : 'Send order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddItemDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products } = useProductsStore()
  const { suppliers, addItem } = useStockStore()
  const [productId, setProductId] = useState(OTHER_ITEM)
  const [description, setDescription] = useState('')
  const [unit, setUnit] = useState('each')
  const [qty, setQty] = useState('')
  const [supplierId, setSupplierId] = useState(NO_SUPPLIER)
  const [supplierCode, setSupplierCode] = useState('')
  const [saving, setSaving] = useState(false)

  const product = products.find((p) => p.id === productId)

  const pickProduct = (id: string) => {
    setProductId(id)
    const p = products.find((x) => x.id === id)
    if (p) {
      setSupplierId(p.supplierId ?? NO_SUPPLIER)
      setSupplierCode(p.supplierCode)
      if (p.reorderQty > 0 && !qty) setQty(String(p.reorderQty))
    }
  }

  const canSave = Number(qty) > 0 && (product ? true : description.trim().length > 0)

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await addItem({
        productId: product?.id,
        description: product ? product.name : description.trim(),
        unit: product ? product.unit : unit.trim() || 'each',
        qty: Number(qty),
        supplierId: supplierId === NO_SUPPLIER ? undefined : supplierId,
        supplierCode: supplierCode.trim(),
      })
      toast.success('Added to the order list')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to the order list</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Item</label>
            <Select value={productId} onValueChange={pickProduct}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={OTHER_ITEM}>Something else (type it in)</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!product && (
            <div className="grid grid-cols-[1fr_6rem] gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">What do you need?</label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. 2.5mm TPS cable, 100m" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Unit</label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} className="mt-1" />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Quantity</label>
              <Input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Supplier's code (optional)</label>
              <Input value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Supplier</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SUPPLIER}>Pick later</SelectItem>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSave || saving} onClick={save}>
            {saving ? 'Adding…' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReceiveDialog({ item, onClose }: { item: OrderItem | null; onClose: () => void }) {
  const { receiveItem } = useStockStore()
  const [qty, setQty] = useState(item ? String(item.qty) : '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!item || !(Number(qty) > 0)) return
    setSaving(true)
    try {
      await receiveItem(item.id, Number(qty))
      toast.success(item.productId ? 'Delivery booked in — stock updated' : 'Marked as received')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to book in')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book in delivery</DialogTitle>
        </DialogHeader>
        <div>
          <p className="mb-2 text-sm">{item?.description}</p>
          <label className="text-xs font-medium text-muted-foreground">How many arrived?</label>
          <Input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1" />
          <p className="mt-1 text-[11px] text-muted-foreground">
            {item?.productId ? 'This is added to your stock count.' : 'This item isn\'t a tracked product, so no stock count changes.'} If only part of the order came, the rest
            is not chased — add it to the list again if you still need it.
          </p>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving || !(Number(qty) > 0)} onClick={save}>
            {saving ? 'Saving…' : 'Book in'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function QtyInput({ item }: { item: OrderItem }) {
  const { updateItem } = useStockStore()
  const [value, setValue] = useState(String(item.qty))
  useEffect(() => setValue(String(item.qty)), [item.qty])

  const commit = async () => {
    const n = Number(value)
    if (!(n > 0) || n === item.qty) {
      setValue(String(item.qty))
      return
    }
    try {
      await updateItem(item.id, { qty: n })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update')
      setValue(String(item.qty))
    }
  }

  return (
    <Input
      type="number"
      min="0"
      step="any"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      className="h-8 w-20"
      aria-label={`Quantity of ${item.description}`}
    />
  )
}

export default function StockOrders() {
  const { suppliers, items, loading, cancelItem, updateItem, refresh } = useStockStore()
  const { refresh: refreshProducts } = useProductsStore()
  const [reviewSupplier, setReviewSupplier] = useState<Supplier | null>(null)
  const [adding, setAdding] = useState(false)
  const [receiving, setReceiving] = useState<OrderItem | null>(null)

  // Stock moves when the team logs materials on jobs, so pick up the latest when this page opens.
  useEffect(() => {
    refresh()
    refreshProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const waiting = items.filter((i) => i.status === 'pending')
  const onOrder = items.filter((i) => i.status === 'ordered')

  const groups = useMemo(() => {
    const bySupplier = new Map<string, OrderItem[]>()
    for (const i of waiting) {
      const key = i.supplierId ?? NO_SUPPLIER
      bySupplier.set(key, [...(bySupplier.get(key) ?? []), i])
    }
    const known = suppliers.filter((s) => bySupplier.has(s.id)).map((s) => ({ supplier: s as Supplier | null, items: bySupplier.get(s.id)! }))
    const none = bySupplier.get(NO_SUPPLIER)
    return none ? [...known, { supplier: null, items: none }] : known
  }, [waiting, suppliers])

  const supplierName = (id?: string) => suppliers.find((s) => s.id === id)?.name ?? 'No supplier'

  const copyText = async (list: OrderItem[], name?: string) => {
    const text = `${name ? `Order for ${name}\n\n` : ''}${list.map((i) => `- ${itemLine(i)}`).join('\n')}`
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Order copied')
    } catch {
      toast.error("Couldn't copy — select the text and copy it instead")
    }
  }

  const remove = (i: OrderItem) => cancelItem(i.id).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to remove'))

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Items that have run low land here by themselves. Check them, then send the order to the supplier.
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus />
          Add item
        </Button>
      </div>

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : waiting.length === 0 && onOrder.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={ShoppingCart}
              title="Nothing to order"
              description="Turn on 'Track stock' for the basics you use often (Products & Services). When one runs low it shows up here."
            />
          </CardContent>
        </Card>
      ) : null}

      {groups.map(({ supplier, items: list }) => (
        <Card key={supplier?.id ?? NO_SUPPLIER}>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle>{supplier ? supplier.name : 'No supplier picked'}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {supplier
                  ? supplier.orderEmail || 'No order email saved for this supplier'
                  : 'Pick a supplier on each item to email it, or copy the list.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => copyText(list, supplier?.name)}>
                <Copy />
                Copy as text
              </Button>
              {supplier &&
                (supplier.orderEmail ? (
                  <Button size="sm" onClick={() => setReviewSupplier(supplier)}>
                    <Mail />
                    Review &amp; send
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" asChild>
                    <Link to="/settings">Add an order email</Link>
                  </Button>
                ))}
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {list.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {i.unit !== 'each' && `${i.unit} · `}
                    {i.supplierCode && `Code ${i.supplierCode} · `}
                    {i.source === 'low_stock' ? 'Ran low' : 'Added by hand'}
                  </p>
                </div>
                {!supplier && (
                  <Select value={NO_SUPPLIER} onValueChange={(v) => updateItem(i.id, { supplierId: v === NO_SUPPLIER ? null : v }).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed'))}>
                    <SelectTrigger className="h-8 w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SUPPLIER}>Pick supplier…</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <QtyInput item={i} />
                <Button variant="ghost" size="icon" onClick={() => remove(i)} aria-label={`Remove ${i.description}`}>
                  <X className="text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {onOrder.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>On order</CardTitle>
            <p className="text-xs text-muted-foreground">Sent to the supplier. Book it in when it arrives and your stock count goes up.</p>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {onOrder.map((i) => (
              <div key={i.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{itemLine(i)}</p>
                  <p className="truncate text-xs text-muted-foreground">{supplierName(i.supplierId)}</p>
                </div>
                <Badge variant="info">On order</Badge>
                <Button size="sm" onClick={() => setReceiving(i)}>
                  <PackageCheck />
                  Book in
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(i)} aria-label={`Cancel order of ${i.description}`}>
                  <X className="text-muted-foreground" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ReviewDialog supplier={reviewSupplier} onClose={() => setReviewSupplier(null)} />
      {adding && <AddItemDialog open onClose={() => setAdding(false)} />}
      {receiving && <ReceiveDialog key={receiving.id} item={receiving} onClose={() => setReceiving(null)} />}
    </div>
  )
}
