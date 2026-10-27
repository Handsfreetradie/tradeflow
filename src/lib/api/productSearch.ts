import { supabase } from '@/lib/supabase'
import { requireApiBusinessId } from '@/lib/api/active-business'
import { buildSearchGroups } from '@/lib/productSearchTerms'

export interface ProductHit {
  id: string
  name: string
  brand: string
  /** How often it's been used on jobs, quotes, invoices and orders — most-used products come first. */
  timesUsed: number
  unit: string
  /** Your cost. Null for employees — they never see prices. */
  unitPrice: number | null
  supplierCode: string
  vendorPart: string
  trackStock: boolean
  stockQty: number | null
  reorderLevel: number | null
}

export interface ProductSearchResult {
  items: ProductHit[]
  /** How many products match in total (the list only holds one page of them). */
  total: number
}

type Row = {
  id: string
  name: string
  brand: string
  times_used: number
  unit: string
  unit_price: number | null
  supplier_code: string
  vendor_part: string
  track_stock: boolean
  stock_qty: number | null
  reorder_level: number | null
  total: number
}

async function run(groups: string[][], limit: number, offset: number, relaxed: boolean, onlyTracked: boolean): Promise<ProductSearchResult> {
  const { data, error } = await supabase.rpc('search_products', {
    p_business: requireApiBusinessId(),
    p_groups: groups,
    p_limit: limit,
    p_offset: offset,
    p_relaxed: relaxed,
    p_only_tracked: onlyTracked,
  })
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as Row[]
  return {
    total: rows.length > 0 ? Number(rows[0].total) : 0,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      brand: r.brand,
      timesUsed: r.times_used,
      unit: r.unit,
      unitPrice: r.unit_price === null ? null : Number(r.unit_price),
      supplierCode: r.supplier_code,
      vendorPart: r.vendor_part,
      trackStock: r.track_stock,
      stockQty: r.stock_qty === null ? null : Number(r.stock_qty),
      reorderLevel: r.reorder_level === null ? null : Number(r.reorder_level),
    })),
  }
}

/**
 * Searches the product list on the server, so it stays instant with 100,000+ products.
 * Empty search = browse A–Z. If nothing matches every word, it falls back to products
 * that match all but one (best matches first).
 */
export async function searchProducts(query: string, opts: { limit?: number; offset?: number; onlyTracked?: boolean } = {}): Promise<ProductSearchResult> {
  const { limit = 40, offset = 0, onlyTracked = false } = opts
  const groups = buildSearchGroups(query)
  const strict = await run(groups, limit, offset, false, onlyTracked)
  if (strict.total > 0 || groups.length < 2 || offset > 0) return strict
  return run(groups, limit, offset, true, onlyTracked)
}

/** Tells the list that a product was used (on a quote/invoice, which only copies its name and price). */
export function noteProductUse(id: string): void {
  void supabase.rpc('note_product_use', { p_product: id }).then(() => undefined)
}

/**
 * Section captions for an empty search: "Frequently used" first, then the rest A–Z.
 * Returns the caption to show above item `index`, or null.
 */
export function sectionCaption(items: ProductHit[], index: number, searching: boolean): string | null {
  if (searching) return null
  const used = items[index].timesUsed > 0
  if (index === 0) return used ? 'Frequently used' : null
  const prevUsed = items[index - 1].timesUsed > 0
  return prevUsed && !used ? 'All products' : null
}

export interface ProductSource {
  source: string
  products: number
  lastPriceUpdate: string | null
}

/** Which supplier lists the products came from (and how many each) — so people know where prices come from. */
export async function getProductSources(): Promise<ProductSource[]> {
  const { data, error } = await supabase.rpc('product_sources', { p_business: requireApiBusinessId() })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({ source: r.source, products: Number(r.products), lastPriceUpdate: r.last_price_update }))
}
