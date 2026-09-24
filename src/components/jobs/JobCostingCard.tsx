import { useState } from 'react'
import { Plus, Mail } from 'lucide-react'
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
import type { Job, JobCost } from '@/lib/demo-data'

const categoryTone: Record<JobCost['category'], string> = {
  Materials: 'bg-primary/10 text-primary',
  Labour: 'bg-purple/10 text-purple',
  Subcontractor: 'bg-warning/10 text-warning',
  Other: 'bg-muted text-muted-foreground',
}

export function JobCostingCard({ job }: { job: Job }) {
  const { addCost } = useJobsStore()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<JobCost['category']>('Materials')
  const [amount, setAmount] = useState('')
  const [supplier, setSupplier] = useState('')

  const costsTotal = job.costs.reduce((sum, c) => sum + c.amount, 0)
  const target = job.value
  const remaining = target - costsTotal
  const percentUsed = target > 0 ? Math.min(100, Math.round((costsTotal / target) * 100)) : 0
  const isOverBudget = costsTotal > target

  const submit = () => {
    const parsed = Number(amount)
    if (!description.trim() || !parsed || parsed <= 0) return
    addCost(job.id, {
      description: description.trim(),
      category,
      amount: parsed,
      date: toDateKey(new Date()),
      supplier: supplier.trim() || undefined,
      poNumber: job.number,
    })
    setDescription('')
    setAmount('')
    setSupplier('')
    setCategory('Materials')
    setOpen(false)
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
                  <p className="truncate text-sm font-medium">{cost.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {cost.supplier ? `${cost.supplier} · ` : ''}
                    {formatDate(cost.date)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium">{formatCurrency(cost.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
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
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>Log cost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
