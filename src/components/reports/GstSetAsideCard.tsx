import { useMemo } from 'react'
import { PiggyBank } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useInvoicesStore } from '@/lib/store/invoices-store'
import { useExpensesStore } from '@/lib/store/expenses-store'
import { useBasPeriodsStore } from '@/lib/store/bas-periods-store'
import { quarterFromDate } from '@/lib/bas'
import { formatCurrency } from '@/lib/utils'

/** Running total of GST collected but not yet lodged — 1A minus 1B across every quarter
 * that hasn't been marked "Lodged" yet. Gives a live "set this aside" figure without
 * waiting for the end of the quarter. */
export function GstSetAsideCard() {
  const { invoices } = useInvoicesStore()
  const { expenses } = useExpensesStore()
  const { isLocked, loading } = useBasPeriodsStore()

  const held = useMemo(() => {
    let total = 0
    for (const inv of invoices) {
      if (inv.gstType !== 'gst_inclusive') continue
      for (const p of inv.payments) {
        const q = quarterFromDate(new Date(p.date))
        if (isLocked(q)) continue
        total += p.amount / 11
      }
    }
    for (const e of expenses) {
      if (e.gstType !== 'gst_inclusive' || !e.receiptStoragePath) continue
      const q = quarterFromDate(new Date(e.date))
      if (isLocked(q)) continue
      total -= e.amount * 0.1
    }
    return total
  }, [invoices, expenses, isLocked])

  if (loading) return null

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
          <PiggyBank className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">GST you're currently holding</p>
          <p className="text-xl font-semibold">{formatCurrency(Math.max(held, 0))}</p>
          {held > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Consider transferring this to a separate savings account so it's ready when your BAS is due.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
