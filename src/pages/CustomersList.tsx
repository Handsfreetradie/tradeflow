import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useInvoicesStore } from '@/lib/store/invoices-store'
import { formatCurrency } from '@/lib/utils'

type SortKey = 'name' | 'jobs' | 'value'

export default function CustomersList() {
  const { customers } = useCustomersStore()
  const { jobs } = useJobsStore()
  const { invoices } = useInvoicesStore()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)

  const rows = useMemo(
    () =>
      customers.map((c) => ({
        customer: c,
        jobCount: jobs.filter((j) => j.customerId === c.id).length,
        lifetimeValue: invoices
          .filter((i) => i.customerId === c.id)
          .reduce((sum, i) => sum + i.payments.reduce((s, p) => s + p.amount, 0), 0),
      })),
    [customers, jobs, invoices]
  )

  const filtered = useMemo(() => {
    let result = rows
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) => r.customer.name.toLowerCase().includes(q) || r.customer.contact.toLowerCase().includes(q))
    }
    return [...result].sort((a, b) => {
      const dir = sortAsc ? 1 : -1
      if (sortKey === 'jobs') return (a.jobCount - b.jobCount) * dir
      if (sortKey === 'value') return (a.lifetimeValue - b.lifetimeValue) * dir
      return a.customer.name.localeCompare(b.customer.name) * dir
    })
  }, [rows, search, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">{customers.length} customers total</p>
        </div>
        <Button onClick={() => navigate('/customers/new')}>
          <Plus />
          Add customer
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="No customers match your search" description="Try a different search term." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-foreground">
                      Customer
                      <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Address</TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort('jobs')} className="flex items-center gap-1 hover:text-foreground">
                      Jobs
                      <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button onClick={() => toggleSort('value')} className="flex items-center gap-1 hover:text-foreground">
                      Lifetime Value
                      <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(({ customer, jobCount, lifetimeValue }) => (
                  <TableRow key={customer.id} className="cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback>{customer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{customer.contact}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{customer.contact}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{customer.address}</TableCell>
                    <TableCell>{jobCount}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(lifetimeValue)}</TableCell>
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
