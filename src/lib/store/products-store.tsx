import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface Product {
  id: string
  name: string
  description: string
  category: string
  unit: string
  unitPrice: number
}

export interface NewProductInput {
  name: string
  description?: string
  category?: string
  unit?: string
  unitPrice: number
}

interface ProductsContextValue {
  products: Product[]
  loading: boolean
  addProduct: (input: NewProductInput) => Promise<Product>
  updateProduct: (id: string, input: NewProductInput) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

function fromRow(row: { id: string; name: string; description: string; category: string; unit: string; unit_price: number }): Product {
  return { id: row.id, name: row.name, description: row.description, category: row.category, unit: row.unit, unitPrice: row.unit_price }
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('products')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setProducts(data.map(fromRow))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const addProduct = useCallback(async (input: NewProductInput) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: input.name,
        description: input.description ?? '',
        category: input.category ?? '',
        unit: input.unit ?? 'each',
        unit_price: input.unitPrice,
      })
      .select('*')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Failed to create product')
    const created = fromRow(data)
    setProducts((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }, [])

  const updateProduct = useCallback(async (id: string, input: NewProductInput) => {
    const { error } = await supabase
      .from('products')
      .update({
        name: input.name,
        description: input.description ?? '',
        category: input.category ?? '',
        unit: input.unit ?? 'each',
        unit_price: input.unitPrice,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    setProducts((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, name: input.name, description: input.description ?? '', category: input.category ?? '', unit: input.unit ?? 'each', unitPrice: input.unitPrice } : p))
        .sort((a, b) => a.name.localeCompare(b.name))
    )
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const value = useMemo(
    () => ({ products, loading, addProduct, updateProduct, deleteProduct }),
    [products, loading, addProduct, updateProduct, deleteProduct]
  )

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
}

export function useProductsStore() {
  const ctx = useContext(ProductsContext)
  if (!ctx) throw new Error('useProductsStore must be used within ProductsProvider')
  return ctx
}
