import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'

export interface Product {
  id: string
  name: string
  description: string
  category: string
  unit: string
  unitPrice: number
  trackStock: boolean
  stockQty: number
  reorderLevel: number
  reorderQty: number
  supplierId?: string
  supplierCode: string
  vendorPart: string
}

export interface NewProductInput {
  name: string
  description?: string
  category?: string
  unit?: string
  unitPrice: number
  trackStock?: boolean
  /** Starting count — only used when adding. Later changes go through setStock / adjustStock. */
  stockQty?: number
  reorderLevel?: number
  reorderQty?: number
  supplierId?: string | null
  supplierCode?: string
}

interface ProductsContextValue {
  /** Only the products you track stock on (a handful). The full list is searched on the server — see useProductSearch. */
  trackedProducts: Product[]
  loading: boolean
  addProduct: (input: NewProductInput) => Promise<Product>
  updateProduct: (id: string, input: NewProductInput) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  /** Removes every product in the active business. */
  deleteAllProducts: () => Promise<void>
  /** Add or take off from the current count (e.g. +10 delivered, -2 used). */
  adjustStock: (id: string, delta: number) => Promise<void>
  /** Set the count after a stocktake. */
  setStock: (id: string, count: number) => Promise<void>
  /** Re-reads tracked products — stock moves when materials are logged on jobs. */
  refresh: () => void
  /** One full product, for editing. */
  loadProduct: (id: string) => Promise<Product>
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

type ProductRow = {
  id: string
  name: string
  description: string
  category: string
  unit: string
  unit_price: number
  track_stock: boolean
  stock_qty: number
  reorder_level: number
  reorder_qty: number
  supplier_id: string | null
  supplier_code: string
  vendor_part: string
}

export function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    unit: row.unit,
    unitPrice: row.unit_price,
    trackStock: row.track_stock,
    stockQty: Number(row.stock_qty),
    reorderLevel: Number(row.reorder_level),
    reorderQty: Number(row.reorder_qty),
    supplierId: row.supplier_id ?? undefined,
    supplierCode: row.supplier_code,
    vendorPart: row.vendor_part,
  }
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const { activeBusinessId } = useActiveBusiness()
  const [trackedProducts, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!session || !activeBusinessId) {
      setProducts([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    // Keep what's on screen while a refresh runs; only a business switch clears it.
    if (tick === 0) setProducts([])
    supabase
      .from('products')
      .select('*')
      .eq('business_id', activeBusinessId)
      .eq('track_stock', true)
      .order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setProducts(data.map(productFromRow))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session, activeBusinessId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  const addProduct = useCallback(async (input: NewProductInput) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        business_id: activeBusinessId ?? undefined,
        name: input.name,
        description: input.description ?? '',
        category: input.category ?? '',
        unit: input.unit ?? 'each',
        unit_price: input.unitPrice,
        track_stock: input.trackStock ?? false,
        stock_qty: input.stockQty ?? 0,
        reorder_level: input.reorderLevel ?? 0,
        reorder_qty: input.reorderQty ?? 0,
        supplier_id: input.supplierId ?? null,
        supplier_code: input.supplierCode ?? '',
      })
      .select('*')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Failed to create product')
    refresh()
    return productFromRow(data)
  }, [activeBusinessId, refresh])

  const loadProduct = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
    if (error || !data) throw new Error(error?.message ?? 'Could not load that product')
    return productFromRow(data)
  }, [])

  const updateProduct = useCallback(
    async (id: string, input: NewProductInput) => {
      // stock_qty is deliberately not written here: employees log materials at the same moment, and
      // a stale count from this screen would wipe their deductions. Counts only move via adjust/set.
      const { error } = await supabase
        .from('products')
        .update({
          name: input.name,
          description: input.description ?? '',
          category: input.category ?? '',
          unit: input.unit ?? 'each',
          unit_price: input.unitPrice,
          track_stock: input.trackStock ?? false,
          reorder_level: input.reorderLevel ?? 0,
          reorder_qty: input.reorderQty ?? 0,
          supplier_id: input.supplierId ?? null,
          supplier_code: input.supplierCode ?? '',
        })
        .eq('id', id)
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const deleteAllProducts = useCallback(async () => {
    if (!activeBusinessId) throw new Error('Could not resolve your business')
    const { error } = await supabase.from('products').delete().eq('business_id', activeBusinessId)
    if (error) throw new Error(error.message)
    setProducts([])
  }, [activeBusinessId])

  const adjustStock = useCallback(
    async (id: string, delta: number) => {
      const { error } = await supabase.rpc('adjust_stock', { p_product: id, p_delta: delta })
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const setStock = useCallback(
    async (id: string, count: number) => {
      const { error } = await supabase.rpc('adjust_stock', { p_product: id, p_set: count })
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const value = useMemo(
    () => ({ trackedProducts, loading, addProduct, updateProduct, deleteProduct, deleteAllProducts, adjustStock, setStock, refresh, loadProduct }),
    [trackedProducts, loading, addProduct, updateProduct, deleteProduct, deleteAllProducts, adjustStock, setStock, refresh, loadProduct]
  )

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}

export function useProductsStore() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProductsStore must be used within ProductsProvider')
  return ctx
}
