import { useState } from 'react'
import { toast } from 'sonner'
import { ClipboardList, Copy, Plus, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { usePurchaseOrdersStore } from '@/lib/store/purchase-orders-store'
import { formatCurrency } from '@/lib/utils'
import type { Job, PurchaseOrderStatus } from '@/lib/demo-data'

const statusVariant: Record<PurchaseOrderStatus, BadgeProps['variant']> = {
  open: 'info',
  received: 'success',
  cancelled: 'default',
}

const statusLabel: Record<PurchaseOrderStatus, string> = {
  open: 'Awaiting invoice',
  received: 'Received',
  cancelled: 'Cancelled',
}

function copyNumber(number: string) {
  navigator.clipboard.writeText(number)
  toast.success(`${number} copied`)
}

export function JobPurchaseOrdersCard({ job }: { job: Job }) {
  const { purchaseOrders, addPurchaseOrder, cancelPurchaseOrder } = usePurchaseOrdersStore()
  const [open, setOpen] = useState(false)
  const [supplier, setSupplier] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<{ number: string } | null>(null)

  const jobPurchaseOrders = purchaseOrders.filter((po) => po.jobId === job.id)

  const openDialog = () => {
    setSupplier('')
    setDescription('')
    setAmount('')
    setCreated(null)
    setOpen(true)
  }

  const submit = async () => {
    setBusy(true)
    try {
      const po = await addPurchaseOrder({
        jobId: job.id,
        supplier: supplier.trim() || undefined,
        description: description.trim() || undefined,
        amount: amount ? Number(amount) : undefined,
      })
      setCreated({ number: po.number })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create purchase order')
    } finally {
      setBusy(false)
    }
  }

  const cancel = async (id: string) => {
    try {
      await cancelPurchaseOrder(id)
      toast.success('Purchase order cancelled')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel')
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" />
            Purchase Orders
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate a number to give a supplier when ordering — their invoice email gets matched to this job automatically.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={openDialog}>
          <Plus />
          New PO
        </Button>
      </CardHeader>
      <CardContent>
        {jobPurchaseOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No purchase orders for this job yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {jobPurchaseOrders.map((po) => (
              <div key={po.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <button
                    onClick={() => copyNumber(po.number)}
                    className="flex items-center gap-1.5 font-mono text-sm font-semibold hover:text-primary"
                    title="Copy PO number"
                  >
                    {po.number}
                    <Copy className="size-3.5 text-muted-foreground" />
                  </button>
                  <p className="truncate text-xs text-muted-foreground">
                    {po.supplier || 'No supplier noted'}
                    {po.description ? ` · ${po.description}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {po.amount != null && <span className="text-sm font-medium">{formatCurrency(po.amount)}</span>}
                  <Badge variant={statusVariant[po.status]}>{statusLabel[po.status]}</Badge>
                  {po.status === 'open' && (
                    <button onClick={() => cancel(po.id)} className="text-muted-foreground hover:text-destructive" title="Cancel PO">
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {created ? (
            <>
              <DialogHeader>
                <DialogTitle>PO created</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Give this number to the supplier and ask them to reference it on their invoice.</p>
                <button
                  onClick={() => copyNumber(created.number)}
                  className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/40 p-4 text-left hover:border-primary"
                >
                  <span className="font-mono text-xl font-semibold">{created.number}</span>
                  <Copy className="size-4 text-muted-foreground" />
                </button>
              </div>
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>New purchase order</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Supplier (optional)</label>
                  <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. CMI Electrical Wholesale" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">What's it for (optional)</label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Switchboard parts" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Estimated amount (optional)</label>
                  <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={busy} onClick={submit}>
                  {busy ? 'Creating…' : 'Generate PO number'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
