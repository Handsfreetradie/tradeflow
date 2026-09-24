import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { Printer, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useInvoicesStore, invoiceTotal } from '@/lib/store/invoices-store'
import { useExpensesStore } from '@/lib/store/expenses-store'
import { formatCurrency } from '@/lib/utils'

type RangeKey = 'month' | '30d' | 'quarter' | 'year' | 'all'

const rangeLabels: Record<RangeKey, string> = {
  month: 'This month',
  '30d': 'Last 30 days',
  quarter: 'This quarter',
  year: 'This year',
  all: 'All time',
}

function rangeStart(range: RangeKey): Date {
  const now = new Date()
  switch (range) {
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1)
    case '30d': {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      return d
    }
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3)
      return new Date(now.getFullYear(), q * 3, 1)
    }
    case 'year':
      return new Date(now.getFullYear(), 0, 1)
    case 'all':
      return new Date(2000, 0, 1)
  }
}

const expenseCategoryColor: Record<string, string> = {
  Materials: 'hsl(221 83% 53%)',
  Fuel: 'hsl(24 95% 53%)',
  'Tools & Equipment': 'hsl(262 83% 58%)',
  Subcontractor: 'hsl(142 71% 38%)',
  Vehicle: 'hsl(0 72% 51%)',
  Insurance: 'hsl(199 89% 48%)',
  Office: 'hsl(45 93% 47%)',
  Other: 'hsl(215 16% 60%)',
}

export default function Reports() {
  const [range, setRange] = useState<RangeKey>('quarter')
  const { jobs } = useJobsStore()
  const { customers } = useCustomersStore()
  const { invoices } = useInvoicesStore()
  const { expenses } = useExpensesStore()

  const start = useMemo(() => rangeStart(range), [range])

  const payments = useMemo(
    () =>
      invoices.flatMap((inv) => inv.payments.map((p) => ({ ...p, includeGst: inv.includeGst }))).filter((p) => new Date(p.date) >= start),
    [invoices, start]
  )
  const rangeExpenses = useMemo(() => expenses.filter((e) => new Date(e.date) >= start), [expenses, start])

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalExpenses = rangeExpenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalRevenue - totalExpenses

  const outstanding = useMemo(
    () =>
      invoices
        .filter((i) => i.status === 'Sent' || i.status === 'Partial' || i.status === 'Overdue')
        .reduce((sum, i) => sum + (invoiceTotal(i) - i.payments.reduce((s, p) => s + p.amount, 0)), 0),
    [invoices]
  )
  const totalPaid = useMemo(() => invoices.flatMap((i) => i.payments).reduce((sum, p) => sum + p.amount, 0), [invoices])

  const revenueOverTime = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const label = d.toLocaleDateString('en-AU', { month: 'short' })
      const income = invoices
        .flatMap((inv) => inv.payments)
        .filter((p) => {
          const pd = new Date(p.date)
          return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth()
        })
        .reduce((sum, p) => sum + p.amount, 0)
      return { month: label, income }
    })
  }, [invoices])

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of rangeExpenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount)
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value, color: expenseCategoryColor[name] ?? 'hsl(215 16% 60%)' }))
      .sort((a, b) => b.value - a.value)
  }, [rangeExpenses])

  const topCustomers = useMemo(() => {
    return customers
      .map((c) => ({
        customer: c,
        jobCount: jobs.filter((j) => j.customerId === c.id).length,
        value: invoices.filter((i) => i.customerId === c.id).reduce((sum, i) => sum + i.payments.reduce((s, p) => s + p.amount, 0), 0),
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [customers, jobs, invoices])

  const gst = useMemo(() => {
    const collected = payments.filter((p) => p.includeGst).reduce((sum, p) => sum + p.amount / 11, 0)
    const paid = rangeExpenses.filter((e) => e.includesGst).reduce((sum, e) => sum + e.amount / 11, 0)
    return { collected, paid, net: collected - paid }
  }, [payments, rangeExpenses])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">Business performance at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(rangeLabels) as RangeKey[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {rangeLabels[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer />
            Print report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 print-section">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Revenue ({rangeLabels[range]})</p>
          <p className="mt-1 text-xl font-semibold text-success">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Expenses ({rangeLabels[range]})</p>
          <p className="mt-1 text-xl font-semibold text-destructive">{formatCurrency(totalExpenses)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Net Profit</p>
          <p className={`mt-1 flex items-center gap-1 text-xl font-semibold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            {netProfit >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            {formatCurrency(Math.abs(netProfit))}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Outstanding (all time)</p>
          <p className="mt-1 text-xl font-semibold text-warning">{formatCurrency(outstanding)}</p>
        </Card>
      </div>

      <Card className="print-section">
        <CardHeader>
          <CardTitle>Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueOverTime} margin={{ left: 0, right: 8 }}>
                <CartesianGrid vertical={false} stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(215 16% 47%)" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="hsl(215 16% 47%)"
                  tickFormatter={(v) => `$${v / 1000}k`}
                  width={40}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(210 20% 95%)' }}
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: 10, border: '1px solid hsl(214 32% 91%)', fontSize: 13 }}
                />
                <Bar dataKey="income" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="print-section">
          <CardHeader>
            <CardTitle>Outstanding vs Paid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid (all time)</span>
                <span className="font-medium">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-success" style={{ width: '100%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-medium">{formatCurrency(outstanding)}</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-warning"
                  style={{ width: `${totalPaid + outstanding > 0 ? (outstanding / (totalPaid + outstanding)) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="print-section">
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {expensesByCategory.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No expenses in this period.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-32 w-32 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expensesByCategory} dataKey="value" nameKey="name" innerRadius={38} outerRadius={60} stroke="none">
                        {expensesByCategory.map((e) => (
                          <Cell key={e.name} fill={e.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  {expensesByCategory.map((e) => (
                    <div key={e.name} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
                        <span className="truncate">{e.name}</span>
                      </span>
                      <span className="shrink-0 font-medium">{formatCurrency(e.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="print-section">
        <CardHeader>
          <CardTitle>Top Customers by Value</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Lifetime Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCustomers.map((c) => (
                <TableRow key={c.customer.id}>
                  <TableCell className="font-medium">{c.customer.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.jobCount}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(c.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="print-section">
        <CardHeader>
          <CardTitle>GST Summary ({rangeLabels[range]})</CardTitle>
          <p className="text-sm text-muted-foreground">For your BAS — estimate only, confirm with your bookkeeper.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">GST Collected</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(gst.collected)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">GST Paid (on expenses)</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(gst.paid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{gst.net >= 0 ? 'Net GST Payable' : 'Net GST Refundable'}</p>
              <p className="mt-1 text-lg font-semibold">{formatCurrency(Math.abs(gst.net))}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
