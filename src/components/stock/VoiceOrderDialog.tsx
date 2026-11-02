import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Mic, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { parseOrderText } from '@/lib/api/orderVoice'
import { searchProducts, type ProductHit } from '@/lib/api/productSearch'
import { useProductsStore } from '@/lib/store/products-store'
import { useStockStore } from '@/lib/store/stock-store'
import { useSpeechToText } from '@/lib/useSpeechToText'

const CUSTOM = 'custom'

interface Row {
  id: number
  name: string
  qty: string
  unit: string
  candidates: ProductHit[]
  /** A candidate's product id, or CUSTOM to order it as worded. */
  choice: string
}

/** Say or type what you need; the list is built, matched to the price list, and added once the owner has checked it. */
export function VoiceOrderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items: orderItems, addItem } = useStockStore()
  const { loadProduct } = useProductsStore()
  const [text, setText] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [building, setBuilding] = useState(false)
  const [saving, setSaving] = useState(false)
  // What was already in the box when the mic was switched on, so dictation adds to it instead of replacing it.
  const baseRef = useRef('')
  const { supported, listening, error, start, stop } = useSpeechToText((transcript) => setText(`${baseRef.current}${baseRef.current ? ' ' : ''}${transcript}`))

  const toggleMic = () => {
    if (listening) {
      stop()
      return
    }
    baseRef.current = text.trim()
    start()
  }

  const build = async () => {
    if (listening) stop()
    if (!text.trim()) return
    setBuilding(true)
    try {
      const spoken = await parseOrderText(text.trim())
      const built = await Promise.all(
        spoken.map(async (s, i): Promise<Row> => {
          const found = await searchProducts(s.name, { limit: 5 }).catch(() => ({ items: [] as ProductHit[], total: 0 }))
          return {
            id: i,
            name: s.name,
            qty: String(s.qty),
            unit: s.unit,
            candidates: found.items,
            choice: found.items[0]?.id ?? CUSTOM,
          }
        })
      )
      setRows(built)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't build the list")
    } finally {
      setBuilding(false)
    }
  }

  const update = (id: number, patch: Partial<Row>) => setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? null)
  const remove = (id: number) => setRows((prev) => prev?.filter((r) => r.id !== id) ?? null)

  const onList = new Set(orderItems.map((i) => i.productId).filter(Boolean))
  const productOf = (r: Row) => r.candidates.find((c) => c.id === r.choice)
  const alreadyOn = (r: Row) => !!productOf(r) && onList.has(r.choice)
  const ready = (rows ?? []).filter((r) => Number(r.qty) > 0 && !alreadyOn(r))

  const save = async () => {
    if (!rows) return
    setSaving(true)
    let added = 0
    const usedProducts = new Set<string>()
    try {
      for (const r of ready) {
        const hit = productOf(r)
        if (hit && usedProducts.has(hit.id)) continue
        if (hit) usedProducts.add(hit.id)
        let supplierId: string | undefined
        let supplierCode = hit?.supplierCode
        if (hit) {
          // The search result is slim; the full product knows its usual supplier.
          try {
            const full = await loadProduct(hit.id)
            supplierId = full.supplierId ?? undefined
            supplierCode = full.supplierCode
          } catch {
            // fine — the supplier can be set from the order list
          }
        }
        await addItem({
          productId: hit?.id,
          description: hit ? hit.name : r.name,
          unit: hit ? hit.unit : r.unit,
          qty: Number(r.qty),
          supplierId,
          supplierCode,
        })
        added++
      }
      toast.success(`${added} ${added === 1 ? 'item' : 'items'} added to the order list`)
      close()
    } catch (e) {
      toast.error(e instanceof Error ? `${e.message}${added ? ` (${added} added before that)` : ''}` : 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const close = () => {
    if (listening) stop()
    setText('')
    setRows(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rows ? 'Check your order list' : 'Say what you need'}</DialogTitle>
        </DialogHeader>

        {!rows ? (
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="e.g. Twenty double power points white, two rolls of 2.5 TPS, a box of 20mm conduit clips and some LED downlights"
              className="w-full rounded-lg border border-input bg-white p-3 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              autoFocus
            />
            <div className="flex flex-wrap items-center gap-3">
              {supported && (
                <Button type="button" variant={listening ? 'danger' : 'secondary'} onClick={toggleMic}>
                  {listening ? <Square className="fill-current" /> : <Mic />}
                  {listening ? 'Stop' : 'Talk'}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                {listening ? 'Listening… say each item, then tap Stop.' : supported ? 'Tap Talk, or type — dictation apps like Wispr Flow work in this box too.' : 'Type it, or use your keyboard’s microphone or a dictation app.'}
              </p>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Fix anything that's wrong, then add them. Nothing is sent to a supplier from here.</p>
            {rows.length === 0 && <p className="text-sm text-muted-foreground">Nothing left on the list.</p>}
            {rows.map((r) => {
              const dup = alreadyOn(r)
              return (
                <div key={r.id} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted-foreground">You said: {r.name}</p>
                      <Select value={r.choice} onValueChange={(v) => update(r.id, { choice: v })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {r.candidates.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {[c.name, c.brand, c.supplierCode].filter(Boolean).join(' · ')}
                            </SelectItem>
                          ))}
                          <SelectItem value={CUSTOM}>{r.candidates.length ? 'None of these — order it as I said it' : 'No match — order it as I said it'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label={`Remove ${r.name}`}>
                      <X />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" min="0" step="any" value={r.qty} onChange={(e) => update(r.id, { qty: e.target.value })} className="h-8 w-24" aria-label={`Quantity of ${r.name}`} />
                    <span className="text-sm text-muted-foreground">{productOf(r)?.unit ?? r.unit}</span>
                    {dup && <Badge variant="warning">Already on the order list</Badge>}
                    {r.choice === CUSTOM && <Badge>Not in your price list</Badge>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <DialogFooter>
          {rows ? (
            <>
              <Button variant="secondary" onClick={() => setRows(null)} disabled={saving}>
                Back
              </Button>
              <Button disabled={saving || ready.length === 0} onClick={save}>
                {saving ? 'Adding…' : `Add ${ready.length} to the order list`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={close}>
                Cancel
              </Button>
              <Button disabled={building || !text.trim()} onClick={build}>
                {building ? <Loader2 className="animate-spin" /> : null}
                {building ? 'Building your list…' : 'Build my list'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
