import { useNavigate } from 'react-router-dom'
import { Plus, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { useInvoicesStore, invoiceTotal } from '@/lib/store/invoices-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Job } from '@/lib/demo-data'

export function ProgressClaimsCard({ job }: { job: Job }) {
  const navigate = useNavigate()
  const { invoices } = useInvoicesStore()
  const jobInvoices = invoices.filter((i) => i.jobId === job.id)

  if (job.pricingType !== 'Fixed Price' && jobInvoices.length === 0) return null

  const claimedExGst = jobInvoices.reduce((sum, i) => sum + i.amount, 0)
  const remaining = Math.max(job.value - claimedExGst, 0)
  const pctClaimed = job.value > 0 ? Math.min((claimedExGst / job.value) * 100, 100) : 0

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="size-4 text-muted-foreground" />
          Progress Claims
        </CardTitle>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/invoices/new?jobId=${job.id}`)}>
          <Plus />
          New claim
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Contract value</p>
            <p className="mt-0.5 font-semibold">{formatCurrency(job.value)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Claimed so far</p>
            <p className="mt-0.5 font-semibold text-success">{formatCurrency(claimedExGst)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p className="mt-0.5 font-semibold">{formatCurrency(remaining)}</p>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${pctClaimed}%` }} />
        </div>

        {jobInvoices.length > 0 && (
          <div className="divide-y divide-border border-t border-border pt-1">
            {jobInvoices.map((inv) => (
              <button
                key={inv.id}
                onClick={() => navigate(`/invoices/${inv.id}`)}
                className="flex w-full items-center gap-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{inv.number}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(inv.date)}</p>
                </div>
                <StatusBadge status={inv.status} />
                <p className="w-20 shrink-0 text-right font-medium">{formatCurrency(invoiceTotal(inv))}</p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
