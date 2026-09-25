import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { LineItemsTable } from '@/components/shared/LineItemsTable'
import { LogoMark } from '@/components/shared/Logo'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface PublicQuote {
  id: string
  number: string
  date: string
  amount: number
  status: string
  includeGst: boolean
  validityDays: number
  terms: string
  notes: string
  customerName: string
  customerContact: string
  customerAddress: string
  businessName: string
  businessAbn: string
  businessLicenceNumber: string
  businessLogoUrl: string | null
}

interface PublicLineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
}

export default function QuotePublic() {
  const { token } = useParams()
  const [quote, setQuote] = useState<PublicQuote | null>(null)
  const [lineItems, setLineItems] = useState<PublicLineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [responding, setResponding] = useState(false)

  const load = () => {
    if (!token) return
    Promise.all([
      supabase.rpc('get_public_quote', { p_token: token }),
      supabase.rpc('get_public_quote_line_items', { p_token: token }),
    ]).then(([qRes, liRes]) => {
      const row = qRes.data?.[0]
      if (!row) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setQuote({
        id: row.id,
        number: row.number,
        date: row.date,
        amount: row.amount,
        status: row.status,
        includeGst: row.include_gst,
        validityDays: row.validity_days,
        terms: row.terms,
        notes: row.notes,
        customerName: row.customer_name,
        customerContact: row.customer_contact,
        customerAddress: row.customer_address,
        businessName: row.business_name,
        businessAbn: row.business_abn,
        businessLicenceNumber: row.business_licence_number,
        businessLogoUrl: row.business_logo_url,
      })
      setLineItems((liRes.data ?? []).map((li) => ({ id: li.id, description: li.description, qty: li.qty, unitPrice: li.unit_price })))
      setLoading(false)
    })
  }

  useEffect(() => {
    if (!token) return
    supabase.rpc('mark_quote_viewed', { p_token: token }).then(() => load())
  }, [token])

  const respond = async (accept: boolean) => {
    if (!token) return
    setResponding(true)
    const { error } = await supabase.rpc('respond_to_public_quote', { p_token: token, p_accept: accept })
    setResponding(false)
    if (error) {
      toast.error(error.message)
      return
    }
    load()
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Loading…</div>
  }

  if (notFound || !quote) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background p-6 text-center">
        <LogoMark className="size-10" />
        <h1 className="mt-2 text-lg font-semibold">Quote not found</h1>
        <p className="text-sm text-muted-foreground">This link may be invalid or have been removed.</p>
      </div>
    )
  }

  const expiryDate = new Date(quote.date)
  expiryDate.setDate(expiryDate.getDate() + quote.validityDays)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {quote.status === 'Sent' && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-subtle sm:flex-row sm:justify-between">
            <p className="text-sm font-medium">Ready to go ahead with this quote?</p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={responding} onClick={() => respond(false)}>
                <X />
                Decline
              </Button>
              <Button disabled={responding} onClick={() => respond(true)}>
                <Check />
                Accept quote
              </Button>
            </div>
          </div>
        )}
        {quote.status === 'Accepted' && (
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-center text-sm font-medium text-success">
            You've accepted this quote — we'll be in touch to schedule the work.
          </div>
        )}
        {quote.status === 'Declined' && (
          <div className="rounded-xl border border-border bg-secondary/40 p-4 text-center text-sm text-muted-foreground">
            You've declined this quote.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-subtle">
          <div className="space-y-8 p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                {quote.businessLogoUrl ? (
                  <img src={quote.businessLogoUrl} alt={quote.businessName} className="size-9 rounded-lg object-contain" />
                ) : (
                  <LogoMark className="size-9" />
                )}
                <div>
                  <p className="text-sm font-semibold leading-none">{quote.businessName}</p>
                  {quote.businessAbn && <p className="mt-1 text-xs text-muted-foreground">ABN {quote.businessAbn}</p>}
                  {quote.businessLicenceNumber && <p className="text-xs text-muted-foreground">Lic. {quote.businessLicenceNumber}</p>}
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-xl font-semibold tracking-tight">QUOTE</h1>
                <p className="text-sm text-muted-foreground">{quote.number}</p>
                <div className="mt-2">
                  <StatusBadge status={quote.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 border-y border-border py-5 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quote for</p>
                <p className="mt-1.5 font-medium">{quote.customerName}</p>
                <p className="text-muted-foreground">{quote.customerContact}</p>
                <p className="text-muted-foreground">{quote.customerAddress}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</p>
                <p className="mt-1.5 text-muted-foreground">
                  Date issued <span className="font-medium text-foreground">{formatDate(quote.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </p>
                <p className="text-muted-foreground">
                  Valid until <span className="font-medium text-foreground">{formatDate(expiryDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </p>
              </div>
            </div>

            <LineItemsTable lineItems={lineItems} includeGst={quote.includeGst} />

            {(quote.notes || quote.terms) && (
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                {quote.notes && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                    <p className="mt-1.5 text-muted-foreground">{quote.notes}</p>
                  </div>
                )}
                {quote.terms && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Terms</p>
                    <p className="mt-1.5 text-muted-foreground">{quote.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
