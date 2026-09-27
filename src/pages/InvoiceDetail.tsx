import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Send, DollarSign, Briefcase, Link as LinkIcon, Eye, Download, Pencil, Trash2 } from 'lucide-react'
import { LogoMark } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineItemsTable } from '@/components/shared/LineItemsTable'
import { SendDocumentDialog } from '@/components/shared/SendDocumentDialog'
import { useInvoicesStore, invoiceTotal } from '@/lib/store/invoices-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useBusinessSettings, type BusinessSettings } from '@/lib/store/business-settings-store'
import type { Invoice, Customer, PaymentMethod } from '@/lib/demo-data'
import { formatCurrency, formatDate } from '@/lib/utils'
import { elementToPdfBlob, openPdfBlobInNewTab, downloadPdfBlob } from '@/lib/pdf'

function InvoiceDocument({ invoice, customer, business }: { invoice: Invoice; customer: Customer | undefined; business: BusinessSettings }) {
  const paidSoFar = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
  const balanceDue = Math.round((invoiceTotal(invoice) - paidSoFar) * 100) / 100
  const credentials = [business.abn && `ABN ${business.abn}`, business.licenceNumber && `Lic. ${business.licenceNumber}`].filter(Boolean).join('  ·  ')

  return (
    <div className="p-10">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt={business.businessName} className="size-11 rounded-lg object-contain" />
          ) : (
            <LogoMark className="size-11" />
          )}
          <div>
            <p className="text-sm font-semibold leading-tight">{business.businessName}</p>
            {credentials && <p className="mt-0.5 text-xs text-muted-foreground">{credentials}</p>}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-semibold tracking-tight text-primary">INVOICE</h1>
          <p className="mt-1 text-sm text-muted-foreground">{invoice.number}</p>
        </div>
      </div>

      <div className="mt-6 h-1 rounded-full bg-primary" />

      <div className="mt-8 grid grid-cols-2 gap-6 rounded-lg border border-border bg-secondary/20 p-5 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bill to</p>
          <p className="mt-2 font-medium">{invoice.customer}</p>
          {customer && (
            <>
              <p className="mt-0.5 text-muted-foreground">{customer.contact}</p>
              <p className="text-muted-foreground">{customer.address}</p>
            </>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</p>
          <p className="mt-2 text-muted-foreground">
            Date issued <span className="font-medium text-foreground">{formatDate(invoice.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Due <span className="font-medium text-foreground">{formatDate(invoice.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </p>
        </div>
      </div>

      <div className="mt-8">
        <LineItemsTable lineItems={invoice.lineItems} includeGst={invoice.includeGst} />
      </div>

      {paidSoFar > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-secondary/20 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Paid to date</span>
            <span className="font-medium text-success">{formatCurrency(paidSoFar)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm font-semibold">
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

      {(invoice.notes || invoice.paymentTerms || business.bankAccountNumber) && (
        <div className="mt-8 grid grid-cols-1 gap-4 rounded-lg border border-border p-5 text-sm sm:grid-cols-2">
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
          {balanceDue > 0 && business.bankAccountNumber && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment details</p>
              <p className="mt-1.5 text-muted-foreground">
                {business.bankAccountName && <>Acc. name: {business.bankAccountName}<br /></>}
                {business.bankBsb && <>BSB: {business.bankBsb}<br /></>}
                Acc. number: {business.bankAccountNumber}
              </p>
            </div>
          )}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-muted-foreground">Thank you for your business.</p>
    </div>
  )
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading, getInvoice, markSent, recordPayment, deleteInvoice } = useInvoicesStore()
  const { getCustomer } = useCustomersStore()
  const { settings: business } = useBusinessSettings()
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('Bank Transfer')
  const [sendOpen, setSendOpen] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

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

  const shareUrl = `${window.location.origin}/i/${invoice.shareToken}`

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied')
  }

  const mailtoFallbackUrl = `mailto:${customer?.email ?? ''}?subject=${encodeURIComponent(
    `Invoice ${invoice.number} from ${business.businessName}`
  )}&body=${encodeURIComponent(
    `Hi ${customer?.contact ?? invoice.customer},\n\nHere's your invoice ${invoice.number} for ${formatCurrency(total)}.\n\nView and pay: ${shareUrl}\n\nThanks,\n${business.businessName}`
  )}`

  const handleSent = async () => {
    if (invoice.status === 'Draft') await markSent(invoice.id)
  }

  const previewPdf = async () => {
    if (!documentRef.current) return
    setPreviewing(true)
    try {
      const blob = await elementToPdfBlob(documentRef.current)
      openPdfBlobInNewTab(blob)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not generate the PDF')
    } finally {
      setPreviewing(false)
    }
  }

  const downloadPdf = async () => {
    if (!documentRef.current) return
    setDownloading(true)
    try {
      const blob = await elementToPdfBlob(documentRef.current)
      downloadPdfBlob(blob, `Invoice-${invoice.number}.pdf`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not generate the PDF')
    } finally {
      setDownloading(false)
    }
  }

  const removeInvoice = async () => {
    try {
      await deleteInvoice(invoice.id)
      toast.success(`${invoice.number} deleted`)
      navigate('/invoices')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete invoice')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
            <ArrowLeft />
            Back
          </Button>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.jobId && (
            <Button variant="secondary" onClick={() => navigate(`/jobs/${invoice.jobId}`)}>
              <Briefcase />
              View linked job
            </Button>
          )}
          {invoice.status === 'Draft' && (
            <Button variant="secondary" onClick={() => navigate(`/invoices/${invoice.id}/edit`)}>
              <Pencil />
              Edit
            </Button>
          )}
          <Button variant="secondary" onClick={copyLink}>
            <LinkIcon />
            Copy link
          </Button>
          <Button variant="secondary" disabled={previewing} onClick={previewPdf}>
            <Eye />
            {previewing ? 'Preparing…' : 'Preview'}
          </Button>
          <Button variant="secondary" disabled={downloading} onClick={downloadPdf}>
            <Download />
            {downloading ? 'Preparing…' : 'Download'}
          </Button>
          <Button variant="secondary" onClick={() => setSendOpen(true)}>
            <Send />
            {invoice.status === 'Draft' ? 'Send invoice' : 'Email invoice'}
          </Button>
          {invoice.status !== 'Draft' && balanceDue > 0 && (
            <Button onClick={() => setPaymentOpen(true)}>
              <DollarSign />
              Record payment
            </Button>
          )}
          {invoice.status === 'Draft' && (
            <Button variant="secondary" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete
            </Button>
          )}
        </div>
      </div>

      {invoice.firstViewedAt && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="size-3.5" />
          Viewed by customer {formatDate(invoice.firstViewedAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
          {invoice.viewCount > 1 && ` · opened ${invoice.viewCount} times`}
        </p>
      )}

      <Card ref={documentRef} className="overflow-hidden">
        <InvoiceDocument invoice={invoice} customer={customer} business={business} />
      </Card>

      <SendDocumentDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        to={customer?.email ?? ''}
        fromName={business.businessName}
        defaultSubject={`Invoice ${invoice.number} from ${business.businessName}`}
        defaultMessage={`Hi ${customer?.contact ?? invoice.customer},\n\nHere's your invoice ${invoice.number} for ${formatCurrency(total)} — see the attached PDF.\n\nYou can also view and pay it online: ${shareUrl}\n\nThanks,\n${business.businessName}`}
        mailtoFallbackUrl={mailtoFallbackUrl}
        filename={`Invoice-${invoice.number}.pdf`}
        documentPreview={<InvoiceDocument invoice={invoice} customer={customer} business={business} />}
        onSent={handleSent}
      />

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

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${invoice.number}?`}
        description="This permanently deletes the draft invoice. This can't be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={removeInvoice}
      />
    </div>
  )
}
