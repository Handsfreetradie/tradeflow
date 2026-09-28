import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Download, Lock, Unlock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useInvoicesStore } from '@/lib/store/invoices-store'
import { useExpensesStore } from '@/lib/store/expenses-store'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { useBasPeriodsStore } from '@/lib/store/bas-periods-store'
import { adjacentQuarter, quarterFromDate } from '@/lib/bas'
import { downloadBasExportCsv } from '@/lib/basExport'
import { BasDueBanner } from '@/components/reports/BasDueBanner'
import { GstSetAsideCard } from '@/components/reports/GstSetAsideCard'
import { formatCurrency, formatDate } from '@/lib/utils'

export function BasSummary() {
  const { settings, loading: businessLoading } = useBusinessSettings()
  const { invoices } = useInvoicesStore()
  const { expenses } = useExpensesStore()
  const { isLocked, lockQuarter, unlockQuarter } = useBasPeriodsStore()
  const [quarter, setQuarter] = useState(() => quarterFromDate(new Date()))
  const [lockDialogOpen, setLockDialogOpen] = useState(false)
  const locked = isLocked(quarter)

  const payments = useMemo(
    () =>
      invoices
        .flatMap((inv) => inv.payments.map((p) => ({ ...p, gstType: inv.gstType, invoiceNumber: inv.number })))
        .filter((p) => {
          const d = new Date(p.date)
          return d >= quarter.start && d < quarter.end
        }),
    [invoices, quarter]
  )

  const periodExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const d = new Date(e.date)
        return d >= quarter.start && d < quarter.end
      }),
    [expenses, quarter]
  )
  const verifiedExpenses = periodExpenses.filter((e) => e.receiptStoragePath)
  const unverifiedExpenses = periodExpenses.filter((e) => !e.receiptStoragePath)

  const g1 = payments.reduce((sum, p) => sum + p.amount, 0)
  const gstOnA = (list: { amount: number; gstType: string }[]) =>
    list.reduce((sum, p) => sum + (p.gstType === 'gst_inclusive' ? p.amount / 11 : 0), 0)
  const gstOnExpenses = (list: { amount: number; gstType: string }[]) =>
    list.reduce((sum, e) => sum + (e.gstType === 'gst_inclusive' ? e.amount * 0.1 : 0), 0)

  const oneA = gstOnA(payments)
  const oneB = gstOnExpenses(verifiedExpenses)
  const unverifiedGst = gstOnExpenses(unverifiedExpenses)
  const netGst = oneA - oneB

  const handleExport = () => {
    downloadBasExportCsv({
      quarter,
      businessName: settings.businessName,
      g1,
      oneA,
      oneB,
      netGst,
      payments: payments.map((p) => ({ invoiceNumber: p.invoiceNumber, date: p.date, amount: p.amount })),
      verifiedExpenses,
      unverifiedExpenses,
    })
    toast.success('BAS export downloaded')
  }

  const handleUnlock = () => {
    unlockQuarter(quarter)
      .then(() => toast.success(`${quarter.label} reopened`))
      .catch((e: Error) => toast.error(e.message))
  }

  const confirmLock = () => {
    lockQuarter(quarter)
      .then(() => toast.success(`${quarter.label} marked as lodged`))
      .catch((e: Error) => toast.error(e.message))
  }

  if (businessLoading) return null

  if (!settings.isGstRegistered) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium">Your business isn't GST registered</p>
          <p className="mt-1 text-sm text-muted-foreground">
            BAS reporting doesn't apply. You can still tag GST on expenses for your own records under Settings → Business.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <BasDueBanner />

      <GstSetAsideCard />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setQuarter((q) => adjacentQuarter(q, -1))}>
            <ChevronLeft />
          </Button>
          <p className="w-40 text-center text-sm font-medium">{quarter.label}</p>
          <Button variant="ghost" size="icon" onClick={() => setQuarter((q) => adjacentQuarter(q, 1))}>
            <ChevronRight />
          </Button>
          {locked && (
            <Badge variant="default" className="ml-1 gap-1">
              <Lock className="size-3" />
              Lodged
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">Due {formatDate(quarter.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download />
            Export for accountant
          </Button>
          {locked ? (
            <Button variant="secondary" size="sm" onClick={handleUnlock}>
              <Unlock />
              Reopen quarter
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setLockDialogOpen(true)}>
              <Lock />
              Mark as lodged
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">{netGst > 0 ? 'You owe' : netGst < 0 ? "You're owed" : "You're square"}</p>
          <p className={`mt-1 text-3xl font-semibold ${netGst > 0 ? 'text-destructive' : netGst < 0 ? 'text-success' : ''}`}>
            {formatCurrency(Math.abs(netGst))}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Estimate only — confirm with your BAS agent or accountant before lodging.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">G1 — Total sales</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(g1)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">1A — GST on sales</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(oneA)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">1B — GST on expenses</p>
          <p className="mt-1 text-lg font-semibold">{formatCurrency(oneB)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Unverified GST</p>
          <p className={`mt-1 text-lg font-semibold ${unverifiedGst > 0 ? 'text-warning' : ''}`}>{formatCurrency(unverifiedGst)}</p>
        </Card>
      </div>

      {unverifiedExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-warning">Missing receipts ({unverifiedExpenses.length})</CardTitle>
            <p className="text-sm text-muted-foreground">
              These expenses are excluded from 1B until a receipt is attached — add one from Expenses.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {unverifiedExpenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales this quarter ({payments.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {payments.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No payments received in this quarter.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.invoiceNumber}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(p.date)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses this quarter ({verifiedExpenses.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {verifiedExpenses.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No verified expenses in this quarter.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiedExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.description}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(e.date)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        title={`Mark ${quarter.label} as lodged?`}
        description="This locks the quarter so it's excluded from your running GST set-aside total. You can reopen it later if you need to make changes."
        confirmLabel="Mark as lodged"
        onConfirm={confirmLock}
      />
    </div>
  )
}
