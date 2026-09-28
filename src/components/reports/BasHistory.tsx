import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/ui/empty-state'
import { useBasPeriodsStore } from '@/lib/store/bas-periods-store'
import { buildQuarter } from '@/lib/bas'
import { formatCurrency, formatDate } from '@/lib/utils'

/** Read-only record of quarters already marked "Lodged" — the summary figures were snapshotted
 * at lock time, so this stays accurate even if invoices/expenses are edited afterwards. */
export function BasHistory() {
  const { lodgedPeriods, loading } = useBasPeriodsStore()

  const sorted = useMemo(
    () => [...lodgedPeriods].sort((a, b) => b.year - a.year || b.quarterIndex - a.quarterIndex),
    [lodgedPeriods]
  )
  const chronological = useMemo(
    () => [...sorted].reverse().map((p) => ({ label: buildQuarter(p.year, p.quarterIndex).label, netGst: p.netGst })),
    [sorted]
  )

  if (loading) return null

  if (lodgedPeriods.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No lodged quarters yet"
        description="Mark a BAS quarter as lodged from the BAS Summary tab to start building your history here."
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Net GST by quarter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chronological} margin={{ left: 0, right: 8 }}>
                <CartesianGrid vertical={false} stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="hsl(215 16% 47%)" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="hsl(215 16% 47%)"
                  tickFormatter={(v) => `$${v}`}
                  width={50}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(210 20% 95%)' }}
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{ borderRadius: 10, border: '1px solid hsl(214 32% 91%)', fontSize: 13 }}
                />
                <Bar dataKey="netGst" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lodged quarters</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quarter</TableHead>
                <TableHead className="hidden sm:table-cell">Lodged</TableHead>
                <TableHead className="text-right">G1</TableHead>
                <TableHead className="text-right">1A</TableHead>
                <TableHead className="text-right">1B</TableHead>
                <TableHead className="text-right">Net GST</TableHead>
                <TableHead className="hidden text-right md:table-cell">vs prior quarter</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p, i) => {
                const prior = sorted[i + 1]
                const change = prior ? p.netGst - prior.netGst : null
                return (
                  <TableRow key={`${p.year}-${p.quarterIndex}`}>
                    <TableCell className="font-medium">{buildQuarter(p.year, p.quarterIndex).label}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {formatDate(p.lodgedAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(p.g1)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.oneA)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.oneB)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(p.netGst)}</TableCell>
                    <TableCell className="hidden text-right md:table-cell">
                      {change === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className={change > 0 ? 'text-destructive' : change < 0 ? 'text-success' : 'text-muted-foreground'}>
                          {change > 0 ? '+' : ''}
                          {formatCurrency(change)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
