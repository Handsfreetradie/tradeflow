import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { useInvoicesStore } from '@/lib/store/invoices-store'
import { useExpensesStore } from '@/lib/store/expenses-store'

function isSameMonth(dateStr: string, ref: Date) {
  const d = new Date(dateStr)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

function isSameDay(dateStr: string, ref: Date) {
  const d = new Date(dateStr)
  return d.toDateString() === ref.toDateString()
}

export function CashFlowCard() {
  const [range, setRange] = useState<'12' | '30'>('12')
  const { invoices } = useInvoicesStore()
  const { expenses } = useExpensesStore()

  const payments = useMemo(() => invoices.flatMap((inv) => inv.payments), [invoices])

  const monthly = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      return {
        month: d.toLocaleDateString('en-AU', { month: 'short' }),
        income: payments.filter((p) => isSameMonth(p.date, d)).reduce((sum, p) => sum + p.amount, 0),
        expenses: expenses.filter((e) => isSameMonth(e.date, d)).reduce((sum, e) => sum + e.amount, 0),
      }
    })
  }, [payments, expenses])

  const daily = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (29 - i))
      return {
        month: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
        income: payments.filter((p) => isSameDay(p.date, d)).reduce((sum, p) => sum + p.amount, 0),
        expenses: expenses.filter((e) => isSameDay(e.date, d)).reduce((sum, e) => sum + e.amount, 0),
      }
    })
  }, [payments, expenses])

  const data = range === '12' ? monthly : daily

  return (
    <Card className="flex-1">
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Cash Flow</CardTitle>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> Expenses
            </span>
          </div>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)}>
          <TabsList>
            <TabsTrigger value="12">12 months</TabsTrigger>
            <TabsTrigger value="30">30 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} stroke="hsl(214 32% 91%)" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                stroke="hsl(215 16% 47%)"
                interval={range === '30' ? 4 : 0}
              />
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
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid hsl(214 32% 91%)',
                  fontSize: 13,
                  boxShadow: '0 4px 6px -1px rgb(16 24 40 / 0.08)',
                }}
              />
              <Bar dataKey="income" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="expenses" fill="hsl(142 71% 38%)" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
