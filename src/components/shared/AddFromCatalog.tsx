import { useState } from 'react'
import { Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useProductsStore } from '@/lib/store/products-store'
import { formatCurrency } from '@/lib/utils'

export function AddFromCatalog({ onAdd }: { onAdd: (item: { description: string; qty: number; unitPrice: number }) => void }) {
  const { products } = useProductsStore()
  const [query, setQuery] = useState('')

  const filtered = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))

  if (products.length === 0) return null

  return (
    <DropdownMenu onOpenChange={(open) => !open && setQuery('')}>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          <Package />
          Add from catalog
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <div className="relative p-1 pb-1.5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Search catalog..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matches</p>
          ) : (
            filtered.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onSelect={() => onAdd({ description: p.name, qty: 1, unitPrice: p.unitPrice })}
                className="flex items-center justify-between gap-2"
              >
                <span className="min-w-0 truncate">{p.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatCurrency(p.unitPrice)}</span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
