import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useProductsStore } from '@/lib/store/products-store'
import { useStockStore } from '@/lib/store/stock-store'

export function LowStockCard() {
  const { trackedProducts, refresh: refreshProducts } = useProductsStore()
  const { items, refresh: refreshStock } = useStockStore()

  // Stock moves when the team logs materials on jobs — pick up the latest when the dashboard opens.
  useEffect(() => {
    refreshProducts()
    refreshStock()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const low = trackedProducts.filter((p) => p.trackStock && p.stockQty <= p.reorderLevel)
  const waiting = items.filter((i) => i.status === 'pending').length
  if (low.length === 0 && waiting === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground" />
          Low stock
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {low.length > 0 && (
          <ul className="space-y-1.5">
            {low.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {p.stockQty} left · reorder at {p.reorderLevel}
                </span>
              </li>
            ))}
            {low.length > 5 && <li className="text-xs text-muted-foreground">and {low.length - 5} more</li>}
          </ul>
        )}
        <Button variant="secondary" size="sm" className="w-full" asChild>
          <Link to="/orders">{waiting > 0 ? `Check ${waiting} item${waiting === 1 ? '' : 's'} to order` : 'View stock orders'}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
