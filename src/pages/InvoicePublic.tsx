import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/badge'
import { LineItemsTable } from '@/components/shared/LineItemsTable'
import { LogoMark } from '@/components/shared/Logo'
import { supabase } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PublicInvoice {
  id: string
  number: string
  date: string
  dueDate: string
  amount: number
  status: string
  includeGst: boolean
  notes: string
  paymentTerms: string
  customerName: string
  customerContact: string
  customerAddress: string
  businessName: string
  businessAbn: string
  businessLicenceNumber: string
  businessLogoUrl: string | null
  bankAccountName: string
  bankBsb: string
  bankAccountNumber: string
  paidAmount: number
}

interface PublicLineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
}

export default function InvoicePublic() {
  const { token } = useParams()
  const [invoice, setInvoice] = useState<PublicInvoice | null>(null)
  const [lineItems, setLineItems] = useState<PublicLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    Promise.all([
      supabase.rpc('get_public_invoice', { p_token: token }),
      supabase.rpc('get_public_invoice_line_items', { p_token: token }),
      supabase.rpc('mark_invoice_viewed', { p_token: token }),
    ]).then(([invRes, liRes]) => {
      if (cancelled) return
      const row = invRes.data?.[0]
      if (!row) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setInvoice({
        id: row.id,
        number: row.number,
        date: row.date,
        dueDate: row.due_date,
        amount: row.amount,
        status: row.status,
        includeGst: row.include_gst,
        notes: row.notes,
        paymentTerms: row.payment_terms,
        customerName: row.customer_name,
        customerContact: row.customer_contact,
        customerAddress: row.customer_address,
        businessName: row.business_name,
        businessAbn: row.business_abn,
        businessLicenceNumber: row.business_licence_number,
        businessLogoUrl: row.business_logo_url,
        bankAccountName: row.bank_account_name,
        bankBsb: row.bank_bsb,
        bankAccountNumber: row.bank_account_number,
        paidAmount: row.paid_amount,
      })
      setLineItems((liRes.data ?? []).map((li) => ({ id: li.id, description: li.description, qty: li.qty, unitPrice: li.unit_price })))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Loading…</div>
  }

  if (notFound || !invoice) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background p-6 text-center">
        <LogoMark className="size-10" />
        <h1 className="mt-2 text-lg font-semibold">Invoice not found</h1>
        <p className="text-sm text-muted-foreground">This link may be invalid or have been removed.</p>
      </div>
    )
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
  const gst = invoice.includeGst ? subtotal * 0.1 : 0
  const total = subtotal + gst
  const balanceDue = Math.round((total - invoice.paidAmount) * 100) / 100

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-border bg-white shadow-subtle">
        <div className="space-y-8 p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              {invoice.businessLogoUrl ? (
                <img src={invoice.businessLogoUrl} alt={invoice.businessName} className="size-9 rounded-lg object-contain" />
              ) : (
                <LogoMark className="size-9" />
              )}
              <div>
                <p className="text-sm font-semibold leading-none">{invoice.businessName}</p>
                {invoice.businessAbn && <p className="mt-1 text-xs text-muted-foreground">ABN {invoice.businessAbn}</p>}
                {invoice.businessLicenceNumber && <p className="text-xs text-muted-foreground">Lic. {invoice.businessLicenceNumber}</p>}
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
              <p className="mt-1.5 font-medium">{invoice.customerName}</p>
              <p className="text-muted-foreground">{invoice.customerContact}</p>
              <p className="text-muted-foreground">{invoice.customerAddress}</p>
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

          <LineItemsTable lineItems={lineItems} includeGst={invoice.includeGst} />

          {invoice.paidAmount > 0 && (
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paid to date</span>
                <span className="font-medium text-success">{formatCurrency(invoice.paidAmount)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-base font-semibold">
                <span>Balance due</span>
                <span className={balanceDue > 0 ? 'text-destructive' : 'text-success'}>{formatCurrency(Math.max(balanceDue, 0))}</span>
              </div>
            </div>
          )}

          {(invoice.notes || invoice.paymentTerms || invoice.bankAccountNumber) && (
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
              {balanceDue > 0 && invoice.bankAccountNumber && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment details</p>
                  <p className="mt-1.5 text-muted-foreground">
                    {invoice.bankAccountName && <>Acc. name: {invoice.bankAccountName}<br /></>}
                    {invoice.bankBsb && <>BSB: {invoice.bankBsb}<br /></>}
                    Acc. number: {invoice.bankAccountNumber}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
