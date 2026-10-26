import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStockStore, type Supplier } from '@/lib/store/stock-store'

const EMAIL_RE = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/

function SupplierDialog({ editing, open, onClose }: { editing: Supplier | null; open: boolean; onClose: () => void }) {
  const { addSupplier, updateSupplier } = useStockStore()
  const [name, setName] = useState(editing?.name ?? '')
  const [orderEmail, setOrderEmail] = useState(editing?.orderEmail ?? '')
  const [accountNumber, setAccountNumber] = useState(editing?.accountNumber ?? '')
  const [saving, setSaving] = useState(false)

  const emailOk = orderEmail.trim() === '' || EMAIL_RE.test(orderEmail.trim())
  const canSave = name.trim().length > 0 && emailOk

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const input = { name: name.trim(), orderEmail: orderEmail.trim(), accountNumber: accountNumber.trim() }
      if (editing) await updateSupplier(editing.id, input)
      else await addSupplier(input)
      toast.success(editing ? 'Supplier updated' : 'Supplier added')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit supplier' : 'Add supplier'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Supplier name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rexel Perth" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email orders go to</label>
            <Input type="email" value={orderEmail} onChange={(e) => setOrderEmail(e.target.value)} placeholder="orders@supplier.com.au" className="mt-1" />
            {!emailOk && <p className="mt-1 text-[11px] text-destructive">That doesn't look like an email address.</p>}
            <p className="mt-1 text-[11px] text-muted-foreground">Leave blank if they don't take email orders — you can still copy the order as text.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Your account number (optional)</label>
            <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSave || saving} onClick={save}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SuppliersCard() {
  const { suppliers, deleteSupplier } = useStockStore()
  const [dialog, setDialog] = useState<{ editing: Supplier | null } | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Supplier | null>(null)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Store className="size-4 text-muted-foreground" />
          Suppliers
        </CardTitle>
        <Button size="sm" onClick={() => setDialog({ editing: null })}>
          <Plus />
          Add supplier
        </Button>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          Where your low-stock orders get sent. Pick a supplier on each product you track and TradeFlow writes the order email for you to check and send.
        </p>
        {suppliers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No suppliers yet.</p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {suppliers.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.orderEmail || 'No order email'}
                    {s.accountNumber && ` · Account ${s.accountNumber}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDialog({ editing: s })}>
                  <Pencil className="text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setRemoveTarget(s)}>
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {dialog && <SupplierDialog key={dialog.editing?.id ?? 'new'} editing={dialog.editing} open onClose={() => setDialog(null)} />}

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title={`Delete ${removeTarget?.name}?`}
        description="Products and waiting orders using this supplier will be left with no supplier — you can pick another one."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => removeTarget && deleteSupplier(removeTarget.id).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to delete'))}
      />
    </Card>
  )
}
