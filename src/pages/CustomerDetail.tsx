import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Plus, Briefcase, FileSpreadsheet, FileText, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useQuotesStore } from '@/lib/store/quotes-store'
import { useInvoicesStore, invoiceTotal } from '@/lib/store/invoices-store'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading, getCustomer, updateNotes } = useCustomersStore()
  const { jobs } = useJobsStore()
  const { quotes } = useQuotesStore()
  const { invoices } = useInvoicesStore()
  const [notesDraft, setNotesDraft] = useState<string | null>(null)

  const customer = id ? getCustomer(id) : undefined
  if (!loading && !customer) return <Navigate to="/customers" replace />
  if (!customer) return null

  const customerJobs = jobs.filter((j) => j.customerId === customer.id)
  const customerQuotes = quotes.filter((q) => q.customerId === customer.id)
  const customerInvoices = invoices.filter((i) => i.customerId === customer.id)
  const lifetimeValue = customerInvoices.reduce((sum, i) => sum + i.payments.reduce((s, p) => s + p.amount, 0), 0)
  const outstanding = customerInvoices
    .filter((i) => i.status === 'Sent' || i.status === 'Overdue' || i.status === 'Partial')
    .reduce((sum, i) => sum + (invoiceTotal(i) - i.payments.reduce((s, p) => s + p.amount, 0)), 0)

  const notes = notesDraft ?? customer.notes
  const notesDirty = notesDraft !== null && notesDraft !== customer.notes

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft />
        Back
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="text-base">{customer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
            <p className="text-sm text-muted-foreground">{customer.contact}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/jobs/new?customerId=${customer.id}`)}>
          <Plus />
          New job for this customer
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Jobs</p>
          <p className="mt-1 text-xl font-semibold">{customerJobs.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Lifetime Value</p>
          <p className="mt-1 text-xl font-semibold text-success">{formatCurrency(lifetimeValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-xl font-semibold text-destructive">{formatCurrency(outstanding)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Open Quotes</p>
          <p className="mt-1 text-xl font-semibold">{customerQuotes.filter((q) => q.status === 'Sent' || q.status === 'Draft').length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="size-4 text-muted-foreground" />
                Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerJobs.length === 0 ? (
                <EmptyState icon={Briefcase} title="No jobs yet" />
              ) : (
                <div className="divide-y divide-border">
                  {customerJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-secondary/60 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.number} · Due {formatDate(job.dueDate)}
                        </p>
                      </div>
                      <StatusBadge status={job.status} />
                      <p className="w-20 shrink-0 text-right text-sm font-medium">{formatCurrency(job.value)}</p>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                Quotes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerQuotes.length === 0 ? (
                <EmptyState icon={FileSpreadsheet} title="No quotes yet" />
              ) : (
                <div className="divide-y divide-border">
                  {customerQuotes.map((quote) => (
                    <button
                      key={quote.id}
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                      className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-secondary/60 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{quote.number}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(quote.date)}</p>
                      </div>
                      <StatusBadge status={quote.status} />
                      <p className="w-20 shrink-0 text-right text-sm font-medium">
                        {formatCurrency(quote.includeGst ? quote.amount * 1.1 : quote.amount)}
                      </p>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerInvoices.length === 0 ? (
                <EmptyState icon={FileText} title="No invoices yet" />
              ) : (
                <div className="divide-y divide-border">
                  {customerInvoices.map((invoice) => (
                    <button
                      key={invoice.id}
                      onClick={() => navigate(`/invoices/${invoice.id}`)}
                      className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-secondary/60 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{invoice.number}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(invoice.date)}</p>
                      </div>
                      <StatusBadge status={invoice.status} />
                      <p className="w-20 shrink-0 text-right text-sm font-medium">{formatCurrency(invoiceTotal(invoice))}</p>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" />
                {customer.phone}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0" />
                {customer.email}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0" />
                {customer.address}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Anything worth remembering about this customer..."
                rows={5}
                className="w-full resize-none rounded-lg border border-input bg-white p-3 text-sm shadow-subtle placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {notesDirty && (
                <Button
                  size="sm"
                  onClick={async () => {
                    await updateNotes(customer.id, notes)
                    setNotesDraft(null)
                  }}
                >
                  Save notes
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
