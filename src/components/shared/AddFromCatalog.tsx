import { useState } from 'react'
import { Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { useProductSearch } from '@/lib/useProductSearch'
import { formatMoney, withMarkup } from '@/lib/utils'

/** Search your price list and add a product as a line — at your cost plus the markup set in Settings. */
export function AddFromCatalog({ onAdd }: { onAdd: (item: { description: string; qty: number; unitPrice: number }) => void }) {
  const { settings } = useBusinessSettings()
  const markup = settings.materialsMarkupPercent
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { items, total, loading, error } = useProductSearch(query, { enabled: open })

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setQuery('')
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          <Package />
          Add from catalog
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[26rem] max-w-[calc(100vw-2rem)]">
        <div className="relative p-1 pb-1.5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Search e.g. 2.5 cable, 2g gpo white…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {error ? (
            <p className="px-2 py-3 text-center text-xs text-destructive">{error}</p>
          ) : loading && items.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">Searching…</p>
          ) : items.length === 0 ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">No matches</p>
          ) : (
            items.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onSelect={() => onAdd({ description: p.name, qty: 1, unitPrice: withMarkup(p.unitPrice ?? 0, markup) })}
                className="flex items-center justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="block truncate">{p.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{p.supplierCode}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatMoney(withMarkup(p.unitPrice ?? 0, markup))}</span>
              </DropdownMenuItem>
            ))
          )}
          {total > items.length && (
            <p className="px-2 py-2 text-center text-[11px] text-muted-foreground">
              Showing {items.length} of {total.toLocaleString()} — type more to narrow it down
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
