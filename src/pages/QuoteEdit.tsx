import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AddFromCatalog } from '@/components/shared/AddFromCatalog'
import { useQuotesStore } from '@/lib/store/quotes-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import type { LineItem, Quote } from '@/lib/demo-data'
import { formatCurrency } from '@/lib/utils'

export default function QuoteEdit() {
  const { id } = useParams()
  const { loading, getQuote } = useQuotesStore()
  const quote = id ? getQuote(id) : undefined

  if (!loading && !quote) return <Navigate to="/quotes" replace />
  if (!quote) return null
  if (quote.status !== 'Draft') return <Navigate to={`/quotes/${quote.id}`} replace />

  return <QuoteEditForm quote={quote} />
}

function QuoteEditForm({ quote }: { quote: Quote }) {
  const navigate = useNavigate()
  const { updateQuote } = useQuotesStore()
  const { customers } = useCustomersStore()

  const [customerId, setCustomerId] = useState(quote.customerId)
  const [includeGst, setIncludeGst] = useState(quote.includeGst)
  const [validityDays, setValidityDays] = useState(String(quote.validityDays))
  const [terms, setTerms] = useState(quote.terms)
  const [exclusions, setExclusions] = useState(quote.exclusions)
  const [notes, setNotes] = useState(quote.notes)
  const [lineItems, setLineItems] = useState<LineItem[]>(quote.lineItems.map((li) => ({ ...li })))
  const [saving, setSaving] = useState(false)

  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
  const total = includeGst ? subtotal * 1.1 : subtotal

  const updateLine = (id: string, patch: Partial<LineItem>) =>
    setLineItems((prev) => prev.map((li) => (li.id === id ? { ...li, ...patch } : li)))

  const canSubmit = customerId && lineItems.some((li) => li.description.trim() && li.unitPrice > 0)

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    try {
      await updateQuote(quote.id, {
        customerId,
        includeGst,
        validityDays: Number(validityDays) || 30,
        terms: terms.trim(),
        exclusions: exclusions.trim(),
        notes: notes.trim(),
        lineItems: lineItems.filter((li) => li.description.trim() && li.unitPrice > 0),
      })
      toast.success('Quote updated')
      navigate(`/quotes/${quote.id}`)
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
        <h1 className="text-2xl font-semibold tracking-tight">Edit Quote {quote.number}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Only draft quotes can be edited — the customer won't see this until you send it.</p>
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
              <label className="text-xs font-medium text-muted-foreground">Valid for (days)</label>
              <Input type="number" min="1" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} className="mt-1" />
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
        <Button variant="secondary" onClick={() => navigate(`/quotes/${quote.id}`)}>
          Cancel
        </Button>
        <Button disabled={!canSubmit || saving} onClick={submit}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
