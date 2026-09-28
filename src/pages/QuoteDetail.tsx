import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Briefcase, Send, Check, X, Link as LinkIcon, Eye, Download, Pencil, Trash2 } from 'lucide-react'
import { LogoMark } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LineItemsTable } from '@/components/shared/LineItemsTable'
import { SendDocumentDialog } from '@/components/shared/SendDocumentDialog'
import { useQuotesStore, quoteTotal as calcQuoteTotal } from '@/lib/store/quotes-store'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useBusinessSettings, type BusinessSettings } from '@/lib/store/business-settings-store'
import type { Quote, Customer } from '@/lib/demo-data'
import { formatCurrency, formatDate, toDateKey } from '@/lib/utils'
import { elementToPdfBlob, openPdfBlobInNewTab, downloadPdfBlob } from '@/lib/pdf'

function QuoteDocument({ quote, customer, business }: { quote: Quote; customer: Customer | undefined; business: BusinessSettings }) {
  const expiryDate = new Date(quote.date)
  expiryDate.setDate(expiryDate.getDate() + quote.validityDays)
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
          <h1 className="text-xl font-semibold tracking-tight text-primary">QUOTE</h1>
          <p className="mt-1 text-sm text-muted-foreground">{quote.number}</p>
          <div className="mt-2">
            <StatusBadge status={quote.status} />
          </div>
        </div>
      </div>

      <div className="mt-6 h-1 rounded-full bg-primary" />

      <div className="mt-8 grid grid-cols-2 gap-6 rounded-lg border border-border bg-secondary/20 p-5 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quote for</p>
          <p className="mt-2 font-medium">{quote.customer}</p>
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
            Date issued <span className="font-medium text-foreground">{formatDate(quote.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </p>
          <p className="mt-0.5 text-muted-foreground">
            Valid until <span className="font-medium text-foreground">{formatDate(expiryDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </p>
        </div>
      </div>

      <div className="mt-8">
        <LineItemsTable lineItems={quote.lineItems} gstType={quote.gstType} />
      </div>

      {(quote.notes || quote.terms || quote.exclusions) && (
        <div className="mt-8 grid grid-cols-1 gap-4 rounded-lg border border-border p-5 text-sm sm:grid-cols-3">
          {quote.terms && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Terms</p>
              <p className="mt-1.5 text-muted-foreground">{quote.terms}</p>
            </div>
          )}
          {quote.exclusions && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Exclusions</p>
              <p className="mt-1.5 text-muted-foreground">{quote.exclusions}</p>
            </div>
          )}
          {quote.notes && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="mt-1.5 text-muted-foreground">{quote.notes}</p>
            </div>
          )}
        </div>
      )}

      <p className="mt-10 text-center text-xs text-muted-foreground">Thank you for the opportunity to quote on this work.</p>
    </div>
  )
}

export default function QuoteDetail() {
  const { id } = useParams()
  const { loading, getQuote, updateStatus, updateQuote, deleteQuote, linkJob } = useQuotesStore()

  const quote = id ? getQuote(id) : undefined
  if (!loading && !quote) return <Navigate to="/quotes" replace />
  if (!quote) return null

  return <QuoteDetailLoaded quote={quote} updateStatus={updateStatus} updateQuote={updateQuote} deleteQuote={deleteQuote} linkJob={linkJob} />
}

function QuoteDetailLoaded({
  quote,
  updateStatus,
  updateQuote,
  deleteQuote,
  linkJob,
}: {
  quote: ReturnType<typeof useQuotesStore>['quotes'][number]
  updateStatus: ReturnType<typeof useQuotesStore>['updateStatus']
  updateQuote: ReturnType<typeof useQuotesStore>['updateQuote']
  deleteQuote: ReturnType<typeof useQuotesStore>['deleteQuote']
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
  const [sendOpen, setSendOpen] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const documentRef = useRef<HTMLDivElement>(null)

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
  const quoteTotal = calcQuoteTotal(quote)

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied')
  }

  const mailtoFallbackUrl = `mailto:${customer?.email ?? ''}?subject=${encodeURIComponent(
    `Quote ${quote.number} from ${business.businessName}`
  )}&body=${encodeURIComponent(
    `Hi ${customer?.contact ?? quote.customer},\n\nHere's your quote ${quote.number} for ${formatCurrency(quoteTotal)}.\n\nView and respond: ${shareUrl}\n\nThanks,\n${business.businessName}`
  )}`

  const handleSent = async () => {
    if (quote.status === 'Draft') await updateStatus(quote.id, 'Sent')
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
      downloadPdfBlob(blob, `Quote-${quote.number}.pdf`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not generate the PDF')
    } finally {
      setDownloading(false)
    }
  }

  const removeQuote = async () => {
    try {
      await deleteQuote(quote.id)
      toast.success(`${quote.number} deleted`)
      navigate('/quotes')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete quote')
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
          {quote.status === 'Draft' && (
            <Button variant="secondary" onClick={() => navigate(`/quotes/${quote.id}/edit`)}>
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
            {quote.status === 'Draft' ? 'Send quote' : 'Email quote'}
          </Button>
          {quote.status === 'Draft' && (
            <Button variant="secondary" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete
            </Button>
          )}
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

          <LineItemsTable lineItems={quote.lineItems} gstType={quote.gstType} />

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

      <SendDocumentDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        to={customer?.email ?? ''}
        fromName={business.businessName}
        defaultSubject={`Quote ${quote.number} from ${business.businessName}`}
        defaultMessage={`Hi ${customer?.contact ?? quote.customer},\n\nHere's your quote ${quote.number} for ${formatCurrency(quoteTotal)} — see the attached PDF.\n\nYou can also view and respond online: ${shareUrl}\n\nThanks,\n${business.businessName}`}
        mailtoFallbackUrl={mailtoFallbackUrl}
        filename={`Quote-${quote.number}.pdf`}
        documentPreview={<QuoteDocument quote={{ ...quote, terms, exclusions, notes }} customer={customer} business={business} />}
        onSent={handleSent}
      />

      {/* Off-screen: the clean read-only document used by Preview/Download (the on-page card above has editable term/exclusion/note fields). */}
      <div className="pointer-events-none fixed left-[-9999px] top-0 w-[560px] bg-white">
        <div ref={documentRef}>
          <QuoteDocument quote={{ ...quote, terms, exclusions, notes }} customer={customer} business={business} />
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${quote.number}?`}
        description="This permanently deletes the draft quote. This can't be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={removeQuote}
      />
    </div>
  )
}
