import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Paperclip, Plus, Receipt, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useExpensesStore } from '@/lib/store/expenses-store'
import { useJobsStore } from '@/lib/store/jobs-store'
import type { ExpenseCategory } from '@/lib/demo-data'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getReceiptUrl } from '@/lib/api/receipts'

const categories: (ExpenseCategory | 'All')[] = [
  'All',
  'Materials',
  'Fuel',
  'Tools & Equipment',
  'Subcontractor',
  'Vehicle',
  'Insurance',
  'Office',
  'Other',
]

export default function ExpensesList() {
  const { expenses } = useExpensesStore()
  const { getJob } = useJobsStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | 'All'>('All')

  const filtered = useMemo(() => {
    let result = expenses
    if (category !== 'All') result = result.filter((e) => e.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((e) => e.description.toLowerCase().includes(q) || e.supplier?.toLowerCase().includes(q))
    }
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [expenses, search, category])

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)

  const openReceipt = async (path: string) => {
    const url = await getReceiptUrl(path)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {expenses.length} expenses · {formatCurrency(total)} {category !== 'All' ? `in ${category}` : 'total'}
          </p>
        </div>
        <Button onClick={() => navigate('/expenses/new')}>
          <Plus />
          Log Expense
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search expenses, suppliers..." className="pl-9" />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory | 'All')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c === 'All' ? 'All categories' : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses match your filters" description="Try a different search term or category." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Job</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense) => {
                  const job = expense.jobId ? getJob(expense.jobId) : undefined
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <p className="flex items-center gap-1.5 font-medium">
                          {expense.description}
                          {expense.receiptStoragePath && (
                            <button
                              onClick={() => openReceipt(expense.receiptStoragePath!)}
                              title="View receipt"
                              className="text-muted-foreground hover:text-primary"
                            >
                              <Paperclip className="size-3.5" />
                            </button>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{expense.supplier ?? '—'}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="default">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {job ? (
                          <button onClick={() => navigate(`/jobs/${job.id}`)} className="text-primary hover:underline">
                            {job.number}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(expense.date)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
