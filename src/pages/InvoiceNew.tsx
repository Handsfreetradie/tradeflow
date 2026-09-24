import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useInvoicesStore } from '@/lib/store/invoices-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useJobsStore } from '@/lib/store/jobs-store'
import type { LineItem } from '@/lib/demo-data'
import { formatCurrency, toDateKey } from '@/lib/utils'

let liSeq = 0
const newLineItem = (): LineItem => ({ id: `new-${++liSeq}`, description: '', qty: 1, unitPrice: 0 })

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return toDateKey(d)
}

export default function InvoiceNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addInvoice, markSent } = useInvoicesStore()
  const { customers } = useCustomersStore()
  const { getJob } = useJobsStore()

  const linkedJob = getJob(searchParams.get('jobId') ?? '')

  const [customerId, setCustomerId] = useState(linkedJob?.customerId ?? '')
  const [includeGst, setIncludeGst] = useState(true)
  const [dueDate, setDueDate] = useState(defaultDueDate())
  const [notes, setNotes] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Payment due within 14 days.')
  const [lineItems, setLineItems] = useState<LineItem[]>(linkedJob ? linkedJob.lineItems.map((li) => ({ ...li })) : [newLineItem()])

  const customer = customers.find((c) => c.id === customerId)
  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
  const total = includeGst ? subtotal * 1.1 : subtotal

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
      <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')} className="-ml-2">
        <ArrowLeft />
        Back to invoices
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
          <Button variant="secondary" size="sm" onClick={() => setLineItems((prev) => [...prev, newLineItem()])}>
            <Plus />
            Add line
          </Button>

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
