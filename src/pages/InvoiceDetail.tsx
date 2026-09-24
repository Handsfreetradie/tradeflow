import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Send, DollarSign, Zap, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineItemsTable } from '@/components/shared/LineItemsTable'
import { useInvoicesStore, invoiceTotal } from '@/lib/store/invoices-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { businessName, type PaymentMethod } from '@/lib/demo-data'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading, getInvoice, markSent, recordPayment } = useInvoicesStore()
  const { getCustomer } = useCustomersStore()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('Bank Transfer')

  const invoice = id ? getInvoice(id) : undefined
  if (!loading && !invoice) return <Navigate to="/invoices" replace />
  if (!invoice) return null

  const customer = getCustomer(invoice.customerId)
  const total = invoiceTotal(invoice)
  const paidSoFar = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
  // Round to the nearest cent so float drift (e.g. 7200 * 1.1) can't leave a fully-paid invoice showing a fractional balance.
  const balanceDue = Math.round((total - paidSoFar) * 100) / 100

  const submitPayment = async () => {
    const value = Number(amount)
    if (!value || value <= 0) return
    await recordPayment(invoice.id, value, method)
    toast.success(`Payment of ${formatCurrency(value)} recorded for ${invoice.number}`)
    setAmount('')
    setPaymentOpen(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft />
          Back
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.jobId && (
            <Button variant="secondary" onClick={() => navigate(`/jobs/${invoice.jobId}`)}>
              <Briefcase />
              View linked job
            </Button>
          )}
          {invoice.status === 'Draft' && (
            <Button
              variant="secondary"
              onClick={() => {
                markSent(invoice.id)
                toast.success(`${invoice.number} sent to ${invoice.customer}`)
              }}
            >
              <Send />
              Send invoice
            </Button>
          )}
          {invoice.status !== 'Draft' && balanceDue > 0 && (
            <Button onClick={() => setPaymentOpen(true)}>
              <DollarSign />
              Record payment
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="space-y-8 p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
                <Zap className="size-4 text-white" fill="currentColor" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">{businessName}</p>
                <p className="mt-1 text-xs text-muted-foreground">ABN 00 000 000 000</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-xl font-semibold tracking-tight">INVOICE</h1>
              <p className="text-sm text-muted-foreground">{invoice.number}</p>
              <div className="mt-2">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 border-y border-border py-5 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bill to</p>
              <p className="mt-1.5 font-medium">{invoice.customer}</p>
              {customer && (
                <>
                  <p className="text-muted-foreground">{customer.contact}</p>
                  <p className="text-muted-foreground">{customer.address}</p>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</p>
              <p className="mt-1.5 text-muted-foreground">
                Date issued <span className="font-medium text-foreground">{formatDate(invoice.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </p>
              <p className="text-muted-foreground">
                Due <span className="font-medium text-foreground">{formatDate(invoice.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          <LineItemsTable lineItems={invoice.lineItems} includeGst={invoice.includeGst} />

          {paidSoFar > 0 && (
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paid to date</span>
                <span className="font-medium text-success">{formatCurrency(paidSoFar)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-base font-semibold">
                <span>Balance due</span>
                <span className={balanceDue > 0 ? 'text-destructive' : 'text-success'}>{formatCurrency(Math.max(balanceDue, 0))}</span>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {formatDate(p.date)} · {p.method}
                    </span>
                    <span>{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(invoice.notes || invoice.paymentTerms) && (
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {invoice.notes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                  <p className="mt-1.5 text-muted-foreground">{invoice.notes}</p>
                </div>
              )}
              {invoice.paymentTerms && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment terms</p>
                  <p className="mt-1.5 text-muted-foreground">{invoice.paymentTerms}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record a payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Balance due: <span className="font-medium text-foreground">{formatCurrency(Math.max(balanceDue, 0))}</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Amount ($)</label>
                <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Method</label>
                <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setAmount(Math.max(balanceDue, 0).toFixed(2))}>
              Full balance
            </Button>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPayment}>Record payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
