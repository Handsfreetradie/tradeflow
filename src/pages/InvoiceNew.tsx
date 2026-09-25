import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddFromCatalog } from '@/components/shared/AddFromCatalog'
import { useInvoicesStore } from '@/lib/store/invoices-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useTeamStore } from '@/lib/store/team-store'
import type { Job, LineItem } from '@/lib/demo-data'
import { formatCurrency, toDateKey } from '@/lib/utils'

let liSeq = 0
const newLineItem = (): LineItem => ({ id: `new-${++liSeq}`, description: '', qty: 1, unitPrice: 0 })

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return toDateKey(d)
}

/** Sums each employee's closed on-site sessions for a job into billable labour line items,
 * rounded to the nearest quarter hour — the standard trade-invoicing rounding convention. */
function labourLineItemsFromJob(job: Job, team: { id: string; fullName: string; hourlyRate: number | null }[]) {
  const msByEmployee = new Map<string, number>()
  for (const ci of job.checkIns) {
    if (!ci.checkOut) continue
    const ms = new Date(ci.checkOut).getTime() - new Date(ci.checkIn).getTime()
    msByEmployee.set(ci.employeeId, (msByEmployee.get(ci.employeeId) ?? 0) + ms)
  }
  const items: LineItem[] = []
  const missingRateFor: string[] = []
  for (const [employeeId, ms] of msByEmployee) {
    const member = team.find((m) => m.id === employeeId)
    const hours = Math.round((ms / 3_600_000) * 4) / 4
    if (hours <= 0) continue
    const name = member?.fullName ?? 'Unknown employee'
    if (!member?.hourlyRate) missingRateFor.push(name)
    items.push({ id: `labour-${employeeId}`, description: `Labour — ${name}`, qty: hours, unitPrice: member?.hourlyRate ?? 0 })
  }
  return { items, missingRateFor }
}

export default function InvoiceNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { invoices, addInvoice, markSent } = useInvoicesStore()
  const { customers } = useCustomersStore()
  const { getJob } = useJobsStore()
  const { team } = useTeamStore()

  const linkedJob = getJob(searchParams.get('jobId') ?? '')

  const [customerId, setCustomerId] = useState(linkedJob?.customerId ?? '')
  const [includeGst, setIncludeGst] = useState(true)
  const [dueDate, setDueDate] = useState(defaultDueDate())
  const [notes, setNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Payment due within 14 days.')
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (!linkedJob) return [newLineItem()]
    // Only auto-fill scope/labour on the *first* invoice for a job — a second invoice is a
    // progress claim or follow-up bill, and re-seeding the same scope items or re-summing
    // every check-in session ever logged would double-bill what an earlier invoice already covered.
    const isFirstInvoiceForJob = !invoices.some((i) => i.jobId === linkedJob.id)
    if (!isFirstInvoiceForJob) return [newLineItem()]
    const { items: labourItems, missingRateFor } = labourLineItemsFromJob(linkedJob, team)
    if (missingRateFor.length > 0) {
      toast.warning(`No hourly rate set for ${missingRateFor.join(', ')} — set it in Settings so labour bills correctly.`)
    }
    return [...linkedJob.lineItems.map((li) => ({ ...li })), ...labourItems]
  })

  const [claimPercent, setClaimPercent] = useState('')

  const customer = customers.find((c) => c.id === customerId)
  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
  const total = includeGst ? subtotal * 1.1 : subtotal

  const isProgressClaimEligible = !!linkedJob && linkedJob.pricingType === 'Fixed Price' && linkedJob.value > 0
  const priorClaims = linkedJob ? invoices.filter((i) => i.jobId === linkedJob.id).reduce((sum, i) => sum + i.amount, 0) : 0
  const remainingToClaim = linkedJob ? Math.max(linkedJob.value - priorClaims, 0) : 0
  const claimAmount = linkedJob ? Math.round(linkedJob.value * ((Number(claimPercent) || 0) / 100) * 100) / 100 : 0

  const applyProgressClaim = () => {
    if (!linkedJob || !claimAmount) return
    setLineItems((prev) => [
      ...prev.filter((li) => li.id !== 'progress-claim'),
      { id: 'progress-claim', description: `Progress claim — ${claimPercent}% of ${linkedJob.number}`, qty: 1, unitPrice: claimAmount },
    ])
  }

  const updateLine = (id: string, patch: Partial<LineItem>) =>
    setLineItems((prev) => prev.map((li) => (li.id === id ? { ...li, ...patch } : li)))

  const canSubmit = customerId && dueDate && lineItems.some((li) => li.description.trim() && li.unitPrice > 0)

  const submit = async (send: boolean) => {
    if (!canSubmit || !customer) return
    const invoice = await addInvoice({
      customerId,
      customer: customer.name,
      includeGst,
      dueDate,
      notes: notes.trim(),
      paymentTerms: paymentTerms.trim(),
      lineItems: lineItems.filter((li) => li.description.trim() && li.unitPrice > 0),
      jobId: linkedJob?.id,
    })
    if (send) await markSent(invoice.id)
    navigate(`/invoices/${invoice.id}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Invoice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {linkedJob ? `Billing for ${linkedJob.title} (${linkedJob.number})` : 'Create an invoice and send it to a customer.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Customer</label>
            <Select value={customerId} onValueChange={setCustomerId} disabled={!!linkedJob}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Due date</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">GST</label>
              <Select value={includeGst ? 'yes' : 'no'} onValueChange={(v) => setIncludeGst(v === 'yes')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Include GST (10%)</SelectItem>
                  <SelectItem value="no">No GST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isProgressClaimEligible && (
        <Card>
          <CardHeader>
            <CardTitle>Progress claim</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Contract value</p>
                <p className="mt-0.5 font-semibold">{formatCurrency(linkedJob!.value)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Already claimed</p>
                <p className="mt-0.5 font-semibold">{formatCurrency(priorClaims)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="mt-0.5 font-semibold">{formatCurrency(remainingToClaim)}</p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">Claim this invoice (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={claimPercent}
                  onChange={(e) => setClaimPercent(e.target.value)}
                  placeholder="e.g. 40"
                  className="mt-1"
                />
              </div>
              <p className="pb-2.5 text-sm text-muted-foreground">= {formatCurrency(claimAmount)}</p>
              <Button variant="secondary" onClick={applyProgressClaim} disabled={!claimAmount}>
                Add as line item
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {lineItems.map((li) => (
            <div key={li.id} className="flex items-center gap-2">
              <Input
                value={li.description}
                onChange={(e) => updateLine(li.id, { description: e.target.value })}
                placeholder="Description"
                className="flex-1"
              />
              <Input
                type="number"
                min="1"
                value={li.qty}
                onChange={(e) => updateLine(li.id, { qty: Number(e.target.value) || 1 })}
                className="w-16"
              />
              <Input
                type="number"
                min="0"
                value={li.unitPrice || ''}
                onChange={(e) => updateLine(li.id, { unitPrice: Number(e.target.value) || 0 })}
                placeholder="Unit $"
                className="w-28"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLineItems((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== li.id) : prev))}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setLineItems((prev) => [...prev, newLineItem()])}>
              <Plus />
              Add line
            </Button>
            <AddFromCatalog onAdd={(item) => setLineItems((prev) => [...prev, { id: crypto.randomUUID(), ...item }])} />
          </div>

          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {includeGst && (
              <div className="flex justify-between text-muted-foreground">
                <span>GST (10%)</span>
                <span>{formatCurrency(subtotal * 0.1)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment terms & notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payment terms</label>
            <textarea
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-input bg-white p-3 text-sm shadow-subtle placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything else the customer should know..."
              className="mt-1 w-full resize-none rounded-lg border border-input bg-white p-3 text-sm shadow-subtle placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/invoices')}>
          Cancel
        </Button>
        <Button variant="secondary" disabled={!canSubmit} onClick={() => submit(false)}>
          Save draft
        </Button>
        <Button disabled={!canSubmit} onClick={() => submit(true)}>
          Save & send
        </Button>
      </div>
    </div>
  )
}
