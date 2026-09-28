import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddFromCatalog } from '@/components/shared/AddFromCatalog'
import { GstTypeSelect } from '@/components/shared/GstTypeSelect'
import { useInvoicesStore, type NewInvoiceInput } from '@/lib/store/invoices-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { gstComponent, gstInclusiveTotal } from '@/lib/bas'
import type { GstType, Invoice, LineItem } from '@/lib/demo-data'
import { formatCurrency } from '@/lib/utils'

export default function InvoiceEdit() {
  const { id } = useParams()
  const { loading, getInvoice } = useInvoicesStore()
  const invoice = id ? getInvoice(id) : undefined

  if (!loading && !invoice) return <Navigate to="/invoices" replace />
  if (!invoice) return null
  if (invoice.status !== 'Draft') return <Navigate to={`/invoices/${invoice.id}`} replace />

  return <InvoiceEditForm invoice={invoice} />
}

function InvoiceEditForm({ invoice }: { invoice: Invoice }) {
  const navigate = useNavigate()
  const { updateInvoice } = useInvoicesStore()
  const { customers } = useCustomersStore()
  const { settings: business } = useBusinessSettings()

  const [customerId, setCustomerId] = useState(invoice.customerId)
  const [gstType, setGstType] = useState<GstType>(invoice.gstType)
  const [dueDate, setDueDate] = useState(invoice.dueDate)
  const [notes, setNotes] = useState(invoice.notes)
  const [paymentTerms, setPaymentTerms] = useState(invoice.paymentTerms)
  const [lineItems, setLineItems] = useState<LineItem[]>(invoice.lineItems.map((li) => ({ ...li })))
  const [saving, setSaving] = useState(false)

  const customer = customers.find((c) => c.id === customerId)
  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
  const total = gstInclusiveTotal(subtotal, gstType)

  const updateLine = (id: string, patch: Partial<LineItem>) =>
    setLineItems((prev) => prev.map((li) => (li.id === id ? { ...li, ...patch } : li)))

  const canSubmit = customerId && dueDate && lineItems.some((li) => li.description.trim() && li.unitPrice > 0)

  const submit = async () => {
    if (!canSubmit || !customer) return
    setSaving(true)
    try {
      const input: NewInvoiceInput = {
        customerId,
        customer: customer.name,
        gstType,
        dueDate,
        notes: notes.trim(),
        paymentTerms: paymentTerms.trim(),
        lineItems: lineItems.filter((li) => li.description.trim() && li.unitPrice > 0),
        jobId: invoice.jobId,
      }
      await updateInvoice(invoice.id, input)
      toast.success('Invoice updated')
      navigate(`/invoices/${invoice.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Invoice {invoice.number}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Only draft invoices can be edited — the customer won't see this until you send it.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Customer</label>
            <Select value={customerId} onValueChange={setCustomerId} disabled={!!invoice.jobId}>
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
              <GstTypeSelect value={gstType} onChange={setGstType} allowInclusive={business.isGstRegistered} />
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
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLineItems((prev) => [...prev, { id: crypto.randomUUID(), description: '', qty: 1, unitPrice: 0 }])}
            >
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
            {gstType === 'gst_inclusive' && (
              <div className="flex justify-between text-muted-foreground">
                <span>GST (10%)</span>
                <span>{formatCurrency(gstComponent(subtotal, gstType))}</span>
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
        <Button variant="secondary" onClick={() => navigate(`/invoices/${invoice.id}`)}>
          Cancel
        </Button>
        <Button disabled={!canSubmit || saving} onClick={submit}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
