import { useNavigate } from 'react-router-dom'
import { Users, FileSpreadsheet, Briefcase, FileText, Check, ArrowRight, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useQuotesStore } from '@/lib/store/quotes-store'
import { useInvoicesStore } from '@/lib/store/invoices-store'
import type { Job } from '@/lib/demo-data'

function Step({
  icon: Icon,
  label,
  sublabel,
  state,
  onClick,
}: {
  icon: LucideIcon
  label: string
  sublabel: string
  state: 'done' | 'current' | 'pending'
  onClick?: () => void
}) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex w-full min-w-0 items-center gap-3 rounded-lg p-2.5 text-left sm:flex-1',
        onClick && 'transition-colors hover:bg-secondary'
      )}
    >
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          state === 'pending' ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'
        )}
      >
        {state === 'done' ? <Check className="size-4" /> : <Icon className="size-4" />}
      </div>
      <div className="min-w-0">
        <p className={cn('truncate text-sm font-medium', state === 'pending' && 'text-muted-foreground')}>{label}</p>
        <p className="truncate text-xs text-muted-foreground">{sublabel}</p>
      </div>
    </Comp>
  )
}

export function JobWorkflow({ job }: { job: Job }) {
  const navigate = useNavigate()
  const { getQuote } = useQuotesStore()
  const { invoices } = useInvoicesStore()
  const quote = job.quoteId ? getQuote(job.quoteId) : undefined
  const invoice = invoices.find((i) => i.jobId === job.id) ?? (job.invoiceId ? invoices.find((i) => i.id === job.invoiceId) : undefined)

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex flex-col items-stretch sm:flex-row sm:items-center">
          <Step icon={Users} label={job.customer} sublabel="Customer" state="done" onClick={() => navigate(`/customers/${job.customerId}`)} />
          <ArrowRight className="mx-1 my-1 size-4 shrink-0 rotate-90 text-muted-foreground sm:my-0 sm:rotate-0" />
          {quote ? (
            <Step
              icon={FileSpreadsheet}
              label={quote.number}
              sublabel={`Quote · ${quote.status.toLowerCase()}`}
              state="done"
              onClick={() => navigate(`/quotes/${job.quoteId}`)}
            />
          ) : (
            <Step icon={FileSpreadsheet} label="No quote" sublabel="Went straight to job" state="pending" />
          )}
          <ArrowRight className="mx-1 my-1 size-4 shrink-0 rotate-90 text-muted-foreground sm:my-0 sm:rotate-0" />
          <Step icon={Briefcase} label={job.number} sublabel={`Job · ${job.status}`} state="current" />
          <ArrowRight className="mx-1 my-1 size-4 shrink-0 rotate-90 text-muted-foreground sm:my-0 sm:rotate-0" />
          {invoice ? (
            <Step
              icon={FileText}
              label={invoice.number}
              sublabel={`Invoice · ${invoice.status.toLowerCase()}`}
              state="done"
              onClick={() => navigate(`/invoices/${invoice.id}`)}
            />
          ) : (
            <div className="flex w-full min-w-0 items-center justify-center py-1.5 sm:flex-1">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/invoices/new?jobId=${job.id}`)}>
                <Plus />
                Create invoice
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
