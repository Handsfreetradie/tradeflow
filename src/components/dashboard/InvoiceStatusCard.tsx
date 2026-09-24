import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useInvoicesStore } from '@/lib/store/invoices-store'

const statusColor: Record<string, string> = {
  Paid: 'hsl(142 71% 38%)',
  Partial: 'hsl(24 95% 53%)',
  Overdue: 'hsl(0 72% 51%)',
  Sent: 'hsl(221 83% 53%)',
  Draft: 'hsl(215 16% 75%)',
}

export function InvoiceStatusCard() {
  const { invoices } = useInvoicesStore()

  const breakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const inv of invoices) counts.set(inv.status, (counts.get(inv.status) ?? 0) + 1)
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value, color: statusColor[name] ?? 'hsl(215 16% 75%)' }))
      .sort((a, b) => b.value - a.value)
  }, [invoices])

  const total = invoices.length

  return (
    <Card className="w-full lg:w-80 lg:shrink-0">
      <CardHeader>
        <CardTitle>Invoice Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdown}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={88}
                paddingAngle={3}
                stroke="none"
              >
                {breakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-semibold tracking-tight">{total}</p>
            <p className="text-xs text-muted-foreground">Total Invoices</p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {breakdown.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="font-medium">{d.value}</span>
                <span className="text-xs text-muted-foreground">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
