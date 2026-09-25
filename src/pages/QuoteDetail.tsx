import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Briefcase, Send, Check, X, Link as LinkIcon, Eye } from 'lucide-react'
import { LogoMark } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { LineItemsTable } from '@/components/shared/LineItemsTable'
import { useQuotesStore } from '@/lib/store/quotes-store'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { formatDate, toDateKey } from '@/lib/utils'

export default function QuoteDetail() {
  const { id } = useParams()
  const { loading, getQuote, updateStatus, updateQuote, linkJob } = useQuotesStore()

  const quote = id ? getQuote(id) : undefined
  if (!loading && !quote) return <Navigate to="/quotes" replace />
  if (!quote) return null

  return <QuoteDetailLoaded quote={quote} updateStatus={updateStatus} updateQuote={updateQuote} linkJob={linkJob} />
}

function QuoteDetailLoaded({
  quote,
  updateStatus,
  updateQuote,
  linkJob,
}: {
  quote: ReturnType<typeof useQuotesStore>['quotes'][number]
  updateStatus: ReturnType<typeof useQuotesStore>['updateStatus']
  updateQuote: ReturnType<typeof useQuotesStore>['updateQuote']
  linkJob: ReturnType<typeof useQuotesStore>['linkJob']
}) {
  const navigate = useNavigate()
  const { addJob } = useJobsStore()
  const { getCustomer } = useCustomersStore()
  const { settings: business } = useBusinessSettings()

  const [terms, setTerms] = useState(quote.terms)
  const [exclusions, setExclusions] = useState(quote.exclusions)
  const [notes, setNotes] = useState(quote.notes)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTerms(quote.terms)
    setExclusions(quote.exclusions)
    setNotes(quote.notes)
  }, [quote.terms, quote.exclusions, quote.notes])

  const dirty = terms !== quote.terms || exclusions !== quote.exclusions || notes !== quote.notes

  const saveTermsSection = async () => {
    setSaving(true)
    try {
      await updateQuote(quote.id, { terms, exclusions, notes })
      toast.success('Quote updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const customer = getCustomer(quote.customerId)
  const expiryDate = new Date(quote.date)
  expiryDate.setDate(expiryDate.getDate() + quote.validityDays)

  const convertToJob = async () => {
    if (!customer) return
    const job = await addJob({
      title: `Job for ${quote.number}`,
      customerId: quote.customerId,
      customer: quote.customer,
      address: customer.address,
      dueDate: toDateKey(new Date()),
      pricingType: 'Fixed Price',
      lineItems: quote.lineItems,
      quoteId: quote.id,
    })
    await linkJob(quote.id, job.id)
    toast.success(`${quote.number} converted to job ${job.number}`)
    navigate(`/jobs/${job.id}`)
  }

  const shareUrl = `${window.location.origin}/q/${quote.shareToken}`
  const quoteTotal = quote.includeGst ? quote.amount * 1.1 : quote.amount

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied')
  }

  const sendViaEmail = async () => {
    const subject = `Quote ${quote.number} from ${business.businessName}`
    const body = `Hi ${customer?.contact ?? quote.customer},\n\nHere's your quote ${quote.number} for ${new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(quoteTotal)}.\n\nView and respond: ${shareUrl}\n\nThanks,\n${business.businessName}`
    window.location.href = `mailto:${customer?.email ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    if (quote.status === 'Draft') {
      await updateStatus(quote.id, 'Sent')
      toast.success(`${quote.number} marked as sent`)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft />
          Back
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={copyLink}>
            <LinkIcon />
            Copy link
          </Button>
          <Button variant="secondary" onClick={sendViaEmail}>
            <Send />
            {quote.status === 'Draft' ? 'Send quote' : 'Email quote'}
          </Button>
          {quote.status === 'Sent' && (
            <>
              <Button variant="secondary" onClick={() => updateStatus(quote.id, 'Declined')}>
                <X />
                Mark declined
              </Button>
              <Button onClick={() => updateStatus(quote.id, 'Accepted')}>
                <Check />
                Mark accepted
              </Button>
            </>
          )}
          {quote.status === 'Accepted' && !quote.jobId && (
            <Button onClick={convertToJob}>
              <Briefcase />
              Convert to job
            </Button>
          )}
          {quote.jobId && (
            <Button variant="secondary" onClick={() => navigate(`/jobs/${quote.jobId}`)}>
              <Briefcase />
              View linked job
            </Button>
          )}
        </div>
      </div>

      {quote.firstViewedAt && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Eye className="size-3.5" />
          Viewed by customer {formatDate(quote.firstViewedAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
          {quote.viewCount > 1 && ` · opened ${quote.viewCount} times`}
        </p>
      )}

      <Card className="overflow-hidden">
        <CardContent className="space-y-8 p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt={business.businessName} className="size-9 rounded-lg object-contain" />
              ) : (
                <LogoMark className="size-9" />
              )}
              <div>
                <p className="text-sm font-semibold leading-none">{business.businessName}</p>
                {business.abn && <p className="mt-1 text-xs text-muted-foreground">ABN {business.abn}</p>}
                {business.licenceNumber && <p className="text-xs text-muted-foreground">Lic. {business.licenceNumber}</p>}
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
              <p className="mt-1.5 font-medium">{quote.customer}</p>
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
                Date issued <span className="font-medium text-foreground">{formatDate(quote.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </p>
              <p className="text-muted-foreground">
                Valid until <span className="font-medium text-foreground">{formatDate(expiryDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          <LineItemsTable lineItems={quote.lineItems} includeGst={quote.includeGst} />

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Terms</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                className="mt-1.5 w-full resize-none rounded-lg border border-transparent bg-secondary/40 p-2 text-sm text-muted-foreground hover:border-input focus:border-input focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Exclusions</label>
              <textarea
                value={exclusions}
                onChange={(e) => setExclusions(e.target.value)}
                rows={3}
                placeholder="Nothing excluded"
                className="mt-1.5 w-full resize-none rounded-lg border border-transparent bg-secondary/40 p-2 text-sm text-muted-foreground hover:border-input focus:border-input focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Nothing to note"
                className="mt-1.5 w-full resize-none rounded-lg border border-transparent bg-secondary/40 p-2 text-sm text-muted-foreground hover:border-input focus:border-input focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          {dirty && (
            <div className="flex justify-end">
              <Button size="sm" disabled={saving} onClick={saveTermsSection}>
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
