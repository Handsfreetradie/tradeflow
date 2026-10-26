import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Mail, Paperclip, PenLine, Plus, Receipt as ReceiptIcon, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency, formatDate, toDateKey } from '@/lib/utils'
import { useJobsStore } from '@/lib/store/jobs-store'
import { deleteReceipt, getReceiptUrl, uploadReceipt } from '@/lib/api/receipts'
import type { Job, JobCost } from '@/lib/demo-data'

const categoryTone: Record<JobCost['category'], string> = {
  Materials: 'bg-primary/10 text-primary',
  Labour: 'bg-purple/10 text-purple',
  Subcontractor: 'bg-warning/10 text-warning',
  Other: 'bg-muted text-muted-foreground',
}

const MAX_RECEIPT_BYTES = 8 * 1024 * 1024

export function JobCostingCard({ job }: { job: Job }) {
  const { addCost, updateCostAmount, deleteCost } = useJobsStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<JobCost['category']>('Materials')
  const [amount, setAmount] = useState('')
  const [supplier, setSupplier] = useState('')
  const [receiptPath, setReceiptPath] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [viewingSignature, setViewingSignature] = useState<JobCost | null>(null)
  const [pricing, setPricing] = useState<JobCost | null>(null)
  const [priceValue, setPriceValue] = useState('')
  const [savingPrice, setSavingPrice] = useState(false)

  const savePrice = async () => {
    if (!pricing) return
    const value = Number(priceValue)
    if (!(value >= 0)) return
    setSavingPrice(true)
    try {
      await updateCostAmount(job.id, pricing.id, value)
      setPricing(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save the price')
    } finally {
      setSavingPrice(false)
    }
  }

  const removeCost = async (cost: JobCost) => {
    if (!window.confirm(`Remove "${cost.description}" from this job's costs?`)) return
    try {
      await deleteCost(job.id, cost.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not remove that cost')
    }
  }

  const costsTotal = job.costs.reduce((sum, c) => sum + c.amount, 0)
  const target = job.value
  const remaining = target - costsTotal
  const percentUsed = target > 0 ? Math.min(100, Math.round((costsTotal / target) * 100)) : 0
  const isOverBudget = costsTotal > target

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setSupplier('')
    setCategory('Materials')
    setReceiptPath(null)
    setReceiptPreview(null)
  }

  const closeDialog = () => {
    // Don't leave an uploaded-but-unused receipt orphaned in storage if the owner cancels.
    if (receiptPath) deleteReceipt(receiptPath).catch(() => {})
    resetForm()
    setOpen(false)
  }

  const handleReceiptSelected = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_RECEIPT_BYTES) {
      toast.error('Receipt photo is too large (max 8MB)')
      return
    }
    setReceiptPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      setReceiptPath(await uploadReceipt(file))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't upload that photo")
      setReceiptPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeReceipt = () => {
    if (receiptPath) deleteReceipt(receiptPath).catch(() => {})
    setReceiptPath(null)
    setReceiptPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const submit = async () => {
    const parsed = Number(amount)
    if (!description.trim() || !parsed || parsed <= 0) return
    setSubmitting(true)
    try {
      await addCost(job.id, {
        description: description.trim(),
        category,
        amount: parsed,
        date: toDateKey(new Date()),
        supplier: supplier.trim() || undefined,
        poNumber: job.number,
        receiptStoragePath: receiptPath ?? undefined,
      })
      resetForm()
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to log cost')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Job Costing</CardTitle>
          <p className="text-sm text-muted-foreground">
            How this job is tracking against {job.pricingType === 'Fixed Price' ? 'the quoted price' : 'your estimate'}.
          </p>
        </div>
        <Badge variant={job.pricingType === 'Fixed Price' ? 'info' : 'purple'}>{job.pricingType}</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 border-b border-border pb-4">
          <div>
            <p className="text-xs text-muted-foreground">{job.pricingType === 'Fixed Price' ? 'Quoted Value' : 'Estimated Value'}</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(target)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Costs So Far</p>
            <p className="mt-1 text-lg font-semibold">{formatCurrency(costsTotal)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{isOverBudget ? 'Over Budget' : 'Margin Remaining'}</p>
            <p className={cn('mt-1 text-lg font-semibold', isOverBudget ? 'text-destructive' : 'text-success')}>
              {formatCurrency(Math.abs(remaining))}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn('h-full rounded-full transition-all', isOverBudget ? 'bg-destructive' : 'bg-primary')}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {percentUsed}% of {job.pricingType === 'Fixed Price' ? 'quoted value' : 'estimate'} spent on costs
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-medium">Logged costs</p>
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Plus />
            Log cost
          </Button>
        </div>

        {job.costs.length === 0 ? (
          <div className="mt-2 rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">No costs logged yet.</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="size-3.5" />
              Supplier invoice auto-pickup isn't connected yet — log costs manually for now.
            </p>
          </div>
        ) : (
          <div className="mt-2 divide-y divide-border">
            {job.costs.map((cost) => (
              <div key={cost.id} className="flex items-center gap-3 py-2.5">
                <Badge variant="default" className={cn('shrink-0', categoryTone[cost.category])}>
                  {cost.category}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {cost.description}
                    {cost.receiptStoragePath && (
                      <button
                        onClick={async () => {
                          const url = await getReceiptUrl(cost.receiptStoragePath!)
                          if (url) window.open(url, '_blank', 'noopener,noreferrer')
                        }}
                        title="View receipt"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Paperclip className="size-3.5" />
                      </button>
                    )}
                    {cost.signatureDataUrl && (
                      <button onClick={() => setViewingSignature(cost)} title="View signature" className="text-muted-foreground hover:text-primary">
                        <PenLine className="size-3.5" />
                      </button>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {cost.loggedByEmployeeName
                      ? `Logged by ${cost.loggedByEmployeeName} · ${formatDate(cost.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}`
                      : `${cost.supplier ? `${cost.supplier} · ` : ''}${formatDate(cost.date)}`}
                  </p>
                </div>
                {cost.needsPricing ? (
                  <button
                    onClick={() => {
                      setPricing(cost)
                      setPriceValue('')
                    }}
                    className="shrink-0 rounded-md bg-warning/10 px-2 py-1 text-xs font-medium text-warning hover:bg-warning/20"
                  >
                    Needs pricing — set price
                  </button>
                ) : (
                  <p className="shrink-0 text-sm font-medium">{formatCurrency(cost.amount)}</p>
                )}
                <button onClick={() => removeCost(cost)} title="Remove cost" className="shrink-0 text-muted-foreground hover:text-destructive">
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!pricing} onOpenChange={(next) => !next && setPricing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set the cost</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {pricing?.loggedByEmployeeName} added <span className="font-medium text-foreground">{pricing?.description}</span>, which isn't on your materials list. Enter the total cost for it.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Total cost ($)</label>
            <Input type="number" min="0" step="0.01" value={priceValue} onChange={(e) => setPriceValue(e.target.value)} className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPricing(null)}>
              Cancel
            </Button>
            <Button disabled={savingPrice || priceValue === '' || !(Number(priceValue) >= 0)} onClick={savePrice}>
              {savingPrice ? 'Saving…' : 'Save cost'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : closeDialog())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a cost</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Cable & fittings" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select value={category} onValueChange={(v) => setCategory(v as JobCost['category'])}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Materials">Materials</SelectItem>
                    <SelectItem value="Labour">Labour</SelectItem>
                    <SelectItem value="Subcontractor">Subcontractor</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Amount ($)</label>
                <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Supplier (optional)</label>
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. CMI Electrical Wholesale" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Receipt photo (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleReceiptSelected(e.target.files?.[0])}
              />
              {receiptPreview ? (
                <div className="mt-1 flex items-center gap-3">
                  <img src={receiptPreview} alt="Receipt preview" className="h-14 w-14 rounded-lg border border-border object-cover" />
                  <div className="flex-1 text-sm text-muted-foreground">
                    {uploading ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin" />
                        Uploading...
                      </span>
                    ) : (
                      'Photo attached'
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={removeReceipt} disabled={uploading}>
                    <X />
                  </Button>
                </div>
              ) : (
                <Button variant="secondary" size="sm" className="mt-1" onClick={() => fileInputRef.current?.click()}>
                  <ReceiptIcon />
                  Take or upload a photo
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={closeDialog}>
              Cancel
            </Button>
            <Button disabled={submitting || uploading} onClick={submit}>
              {submitting ? 'Logging…' : 'Log cost'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingSignature} onOpenChange={(next) => !next && setViewingSignature(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signed off by {viewingSignature?.loggedByEmployeeName}</DialogTitle>
          </DialogHeader>
          {viewingSignature && (
            <div className="space-y-2">
              <img src={viewingSignature.signatureDataUrl} alt="Signature" className="w-full rounded-lg border border-border bg-white" />
              <p className="text-xs text-muted-foreground">
                {formatDate(viewingSignature.createdAt, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
