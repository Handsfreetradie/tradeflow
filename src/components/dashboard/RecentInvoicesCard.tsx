import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useInvoicesStore, invoiceTotal } from '@/lib/store/invoices-store'

export function RecentInvoicesCard() {
  const navigate = useNavigate()
  const { invoices } = useInvoicesStore()

  const recent = useMemo(
    () => [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [invoices]
  )

  return (
    <Card className="flex-1">
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Recent Invoices</CardTitle>
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all
          <ChevronRight className="size-3.5" />
        </button>
      </CardHeader>
      <CardContent className="px-2 pb-2 sm:px-5 sm:pb-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.map((inv) => (
              <TableRow
                key={inv.id}
                className="cursor-pointer"
                onClick={() => navigate(`/invoices/${inv.id}`)}
              >
                <TableCell className="font-medium">{inv.number}</TableCell>
                <TableCell className="text-muted-foreground">{inv.customer}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(inv.date)}</TableCell>
                <TableCell className="font-medium">{formatCurrency(invoiceTotal(inv))}</TableCell>
                <TableCell>
                  <StatusBadge status={inv.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
