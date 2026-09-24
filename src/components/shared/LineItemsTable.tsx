import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import type { LineItem } from '@/lib/demo-data'

export function LineItemsTable({ lineItems, includeGst = true }: { lineItems: LineItem[]; includeGst?: boolean }) {
  const subtotal = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
  const gst = includeGst ? subtotal * 0.1 : 0

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Mobile: stacked cards — a 4-column table has no room on a phone and was clipping the Total column. */}
      <div className="divide-y divide-border sm:hidden">
        {lineItems.map((li) => (
          <div key={li.id} className="flex items-start justify-between gap-3 p-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{li.description}</p>
              <p className="text-xs text-muted-foreground">
                {li.qty} × {formatCurrency(li.unitPrice)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-medium">{formatCurrency(li.qty * li.unitPrice)}</p>
          </div>
        ))}
      </div>

      {/* Desktop / tablet: full table. */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((li) => (
              <TableRow key={li.id}>
                <TableCell className="font-medium">{li.description}</TableCell>
                <TableCell className="text-right text-muted-foreground">{li.qty}</TableCell>
                <TableCell className="text-right text-muted-foreground">{formatCurrency(li.unitPrice)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(li.qty * li.unitPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-1.5 border-t border-border bg-secondary/40 px-4 py-3">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {includeGst && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>GST (10%)</span>
            <span>{formatCurrency(gst)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(subtotal + gst)}</span>
        </div>
      </div>
    </div>
  )
}
