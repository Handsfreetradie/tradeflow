import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuotesStore } from '@/lib/store/quotes-store'
import type { QuoteStatus } from '@/lib/demo-data'
import { formatCurrency, formatDate } from '@/lib/utils'

const statusFilters: (QuoteStatus | 'All')[] = ['All', 'Draft', 'Sent', 'Accepted', 'Declined', 'Expired']

export default function QuotesList() {
  const { quotes } = useQuotesStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<QuoteStatus | 'All'>('All')

  const filtered = useMemo(() => {
    let result = quotes
    if (status !== 'All') result = result.filter((q) => q.status === status)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((quote) => quote.customer.toLowerCase().includes(q) || quote.number.toLowerCase().includes(q))
    }
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [quotes, search, status])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quotes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{quotes.length} quotes total</p>
        </div>
        <Button onClick={() => navigate('/quotes/new')}>
          <Plus />
          New Quote
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotes, customers..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as QuoteStatus | 'All')}>
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
            <EmptyState icon={FileSpreadsheet} title="No quotes match your filters" description="Try a different search term or status." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead className="hidden md:table-cell">Customer</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((quote) => (
                  <TableRow key={quote.id} className="cursor-pointer" onClick={() => navigate(`/quotes/${quote.id}`)}>
                    <TableCell>
                      <p className="font-medium">{quote.number}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{quote.customer}</p>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{quote.customer}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(quote.date)}</TableCell>
                    <TableCell>
                      <StatusBadge status={quote.status} />
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(quote.amount)}</TableCell>
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
