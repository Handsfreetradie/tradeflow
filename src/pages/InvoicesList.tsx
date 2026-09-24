import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useInvoicesStore } from '@/lib/store/invoices-store'
import type { InvoiceStatus } from '@/lib/demo-data'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusFilters: (InvoiceStatus | 'All')[] = ['All', 'Draft', 'Sent', 'Partial', 'Paid', 'Overdue']

export default function InvoicesList() {
  const { invoices } = useInvoicesStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<InvoiceStatus | 'All'>('All')

  const filtered = useMemo(() => {
    let result = invoices
    if (status !== 'All') result = result.filter((i) => i.status === status)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((inv) => inv.customer.toLowerCase().includes(q) || inv.number.toLowerCase().includes(q))
    }
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [invoices, search, status])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">{invoices.length} invoices total</p>
        </div>
        <Button onClick={() => navigate('/invoices/new')}>
          <Plus />
          New Invoice
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices, customers..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus | 'All')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'All' ? 'All statuses' : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={FileText} title="No invoices match your filters" description="Try a different search term or status." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead className="hidden lg:table-cell">Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((invoice) => (
                  <TableRow key={invoice.id} className="cursor-pointer" onClick={() => navigate(`/invoices/${invoice.id}`)}>
                    <TableCell>
                      <p className="font-medium">{invoice.number}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{invoice.customer}</p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{invoice.customer}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(invoice.includeGst ? invoice.amount * 1.1 : invoice.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
