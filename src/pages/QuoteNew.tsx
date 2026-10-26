import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddFromCatalog } from '@/components/shared/AddFromCatalog'
import { GstTypeSelect } from '@/components/shared/GstTypeSelect'
import { useQuotesStore } from '@/lib/store/quotes-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { gstComponent, gstInclusiveTotal } from '@/lib/bas'
import type { GstType, LineItem } from '@/lib/demo-data'
import { formatCurrency } from '@/lib/utils'

let liSeq = 0
const newLineItem = (): LineItem => ({ id: `new-${++liSeq}`, description: '', qty: 1, unitPrice: 0 })

const NEW_CUSTOMER = '__new__'

export default function QuoteNew() {
  const navigate = useNavigate()
  const { addQuote } = useQuotesStore()
  const { customers, addCustomer } = useCustomersStore()
  const { settings: business, loading: businessLoading } = useBusinessSettings()

  const [submitting, setSubmitting] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [gstType, setGstType] = useState<GstType>('gst_inclusive')
  const [gstTypeTouched, setGstTypeTouched] = useState(false)
  const [validityDays, setValidityDays] = useState('30')
  const [terms, setTerms] = useState('50% deposit on acceptance, balance on completion.')
  const [exclusions, setExclusions] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()])
  const [defaultsSeeded, setDefaultsSeeded] = useState(false)

  useEffect(() => {
    if (!businessLoading && !defaultsSeeded) {
      if (business.defaultQuoteTerms) setTerms(business.defaultQuoteTerms)
      setExclusions(business.defaultQuoteExclusions)
      setDefaultsSeeded(true)
    }
  }, [businessLoading, defaultsSeeded, business])

  useEffect(() => {
    if (!businessLoading && !gstTypeTouched) setGstType(business.isGstRegistered ? 'gst_inclusive' : 'not_applicable')
  }, [businessLoading, business.isGstRegistered, gstTypeTouched])

  const customer = customers.find((c) => c.id === customerId)
  const usingNewCustomer = customerId === NEW_CUSTOMER
  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
  const total = gstInclusiveTotal(subtotal, gstType)

  const updateLine = (id: string, patch: Partial<LineItem>) =>
    setLineItems((prev) => prev.map((li) => (li.id === id ? { ...li, ...patch } : li)))

  const canSubmit =
    (usingNewCustomer ? newCustomerName.trim() : customerId) &&
    lineItems.some((li) => li.description.trim() && li.unitPrice > 0)

  const submit = async (send: boolean) => {
    if (!canSubmit || submitting) return
    if (!usingNewCustomer && !customer) {
      toast.error('Pick a customer first')
      return
    }
    setSubmitting(true)
    try {
      let resolvedCustomerId = customerId
      let resolvedCustomerName = customer?.name ?? ''
      if (usingNewCustomer) {
        const created = await addCustomer({ name: newCustomerName.trim() })
        resolvedCustomerId = created.id
        resolvedCustomerName = created.name
      }
      const quote = await addQuote({
        customerId: resolvedCustomerId,
        customer: resolvedCustomerName,
        gstType,
        validityDays: Number(validityDays) || 30,
        terms: terms.trim(),
        exclusions: exclusions.trim(),
        notes: notes.trim(),
        lineItems: lineItems.filter((li) => li.description.trim() && li.unitPrice > 0),
      })
      navigate(`/quotes/${quote.id}`, { state: { openSend: send } })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save the quote')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Quote</h1>
        <p className="mt-1 text-sm text-muted-foreground">Build a quote and send it to a customer.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quote details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Customer</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NEW_CUSTOMER}>+ Add new customer</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {usingNewCustomer && (
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="New customer name"
                className="mt-2"
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valid for (days)</label>
              <Input type="number" min="1" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">GST</label>
              <GstTypeSelect
                value={gstType}
                onChange={(v) => {
                  setGstType(v)
                  setGstTypeTouched(true)
                }}
                allowInclusive={business.isGstRegistered}
              />
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
            <div
              key={li.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-2.5 sm:flex-row sm:items-center sm:rounded-none sm:border-0 sm:p-0"
            >
              <Input
                value={li.description}
                onChange={(e) => updateLine(li.id, { description: e.target.value })}
                placeholder="Description"
                className="sm:flex-1"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={li.qty || ''}
                  onChange={(e) => updateLine(li.id, { qty: Number(e.target.value) || 0 })}
                  onBlur={(e) => {
                    if (!Number(e.target.value)) updateLine(li.id, { qty: 1 })
                  }}
                  className="w-20 sm:w-16"
                />
                <Input
                  type="number"
                  min="0"
                  value={li.unitPrice || ''}
                  onChange={(e) => updateLine(li.id, { unitPrice: Number(e.target.value) || 0 })}
                  placeholder="Unit $"
                  className="flex-1 sm:w-28"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setLineItems((prev) => (prev.length > 1 ? prev.filter((x) => x.id !== li.id) : prev))}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </div>
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
          <CardTitle>Terms & notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Terms</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-input bg-white p-3 text-sm shadow-subtle placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Exclusions</label>
            <textarea
              value={exclusions}
              onChange={(e) => setExclusions(e.target.value)}
              rows={2}
              placeholder="e.g. Excludes council permits, asbestos removal, making good of walls/ceilings."
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
        <Button variant="secondary" onClick={() => navigate('/quotes')}>
          Cancel
        </Button>
        <Button variant="secondary" disabled={!canSubmit || submitting} onClick={() => submit(false)}>
          Save draft
        </Button>
        <Button disabled={!canSubmit || submitting} onClick={() => submit(true)}>
          Save & send
        </Button>
      </div>
    </div>
  )
}
