import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { DollarSign, FileWarning, FileSpreadsheet, Hammer, PiggyBank } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useQuotesStore } from '@/lib/store/quotes-store'
import { useInvoicesStore, invoiceTotal } from '@/lib/store/invoices-store'

function Sparkline({ tone }: { tone: 'primary' | 'success' | 'warning' | 'muted' }) {
  const points = [4, 7, 5, 9, 8, 12, 10, 14, 13, 17]
  const max = Math.max(...points)
  const w = 88
  const h = 28
  const path = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - (p / max) * h}`)
    .join(' ')
  const stroke = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    warning: 'stroke-warning',
    muted: 'stroke-muted-foreground',
  }[tone]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="shrink-0">
      <polyline points={path} className={cn(stroke)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KpiCard({
  icon: Icon,
  iconTone,
  label,
  value,
  supporting,
  sparkTone,
}: {
  icon: LucideIcon
  iconTone: string
  label: string
  value: string
  supporting: string
  sparkTone: 'primary' | 'success' | 'warning' | 'muted'
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2.5">
        <div className={cn('flex size-8 items-center justify-center rounded-lg', iconTone)}>
          <Icon className="size-4" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-2xl font-semibold tracking-tight">{value}</p>
          <div className="mt-1.5 flex items-center gap-1 text-xs">
            <span className="truncate text-muted-foreground">{supporting}</span>
          </div>
        </div>
        <Sparkline tone={sparkTone} />
      </div>
    </Card>
  )
}

export function KpiRow() {
  const { jobs } = useJobsStore()
  const { quotes } = useQuotesStore()
  const { invoices } = useInvoicesStore()

  const jobsInProgress = useMemo(() => {
    const inProgress = jobs.filter((j) => j.status === 'In Progress')
    const weekOut = new Date()
    weekOut.setDate(weekOut.getDate() + 7)
    const dueThisWeek = inProgress.filter((j) => new Date(j.dueDate) <= weekOut).length
    return { count: inProgress.length, note: `${dueThisWeek} due this week` }
  }, [jobs])

  const revenue = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return invoices
      .flatMap((inv) => inv.payments)
      .filter((p) => new Date(p.date) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + p.amount, 0)
  }, [invoices])

  const paidThisMonth = useMemo(() => {
    const now = new Date()
    return invoices
      .flatMap((inv) => inv.payments)
      .filter((p) => {
        const d = new Date(p.date)
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      })
      .reduce((sum, p) => sum + p.amount, 0)
  }, [invoices])

  const outstanding = useMemo(() => {
    const unpaid = invoices.filter((i) => i.status === 'Sent' || i.status === 'Partial' || i.status === 'Overdue')
    const overdueCount = unpaid.filter((i) => i.status === 'Overdue').length
    const value = unpaid.reduce((sum, i) => sum + (invoiceTotal(i) - i.payments.reduce((s, p) => s + p.amount, 0)), 0)
    return { value, overdueCount }
  }, [invoices])

  const openQuotes = useMemo(() => {
    const open = quotes.filter((q) => q.status === 'Draft' || q.status === 'Sent')
    const value = open.reduce((sum, q) => sum + (q.includeGst ? q.amount * 1.1 : q.amount), 0)
    return { value, count: open.length }
  }, [quotes])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        icon={DollarSign}
        iconTone="bg-success/10 text-success"
        label="Total Revenue"
        value={formatCurrency(revenue)}
        supporting="received in last 30 days"
        sparkTone="success"
      />
      <KpiCard
        icon={FileWarning}
        iconTone="bg-destructive/10 text-destructive"
        label="Outstanding Invoices"
        value={formatCurrency(outstanding.value)}
        supporting={`${outstanding.overdueCount} invoice${outstanding.overdueCount === 1 ? '' : 's'} overdue`}
        sparkTone="warning"
      />
      <KpiCard
        icon={FileSpreadsheet}
        iconTone="bg-primary/10 text-primary"
        label="Open Quotes"
        value={formatCurrency(openQuotes.value)}
        supporting={`${openQuotes.count} awaiting response`}
        sparkTone="primary"
      />
      <KpiCard
        icon={Hammer}
        iconTone="bg-purple/10 text-purple"
        label="Jobs in Progress"
        value={String(jobsInProgress.count)}
        supporting={jobsInProgress.note}
        sparkTone="muted"
      />
      <KpiCard
        icon={PiggyBank}
        iconTone="bg-success/10 text-success"
        label="Paid This Month"
        value={formatCurrency(paidThisMonth)}
        supporting="this calendar month"
        sparkTone="success"
      />
    </div>
  )
}
