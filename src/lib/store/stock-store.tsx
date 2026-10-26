import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'

export interface Supplier {
  id: string
  name: string
  orderEmail: string
  accountNumber: string
}

export interface NewSupplierInput {
  name: string
  orderEmail: string
  accountNumber: string
}

export type OrderItemStatus = 'pending' | 'ordered'

export interface OrderItem {
  id: string
  productId?: string
  description: string
  unit: string
  qty: number
  supplierId?: string
  supplierCode: string
  source: 'low_stock' | 'manual'
  status: OrderItemStatus
  createdAt: string
}

export interface NewOrderItemInput {
  description: string
  unit: string
  qty: number
  supplierId?: string
  supplierCode?: string
  productId?: string
}

interface StockContextValue {
  suppliers: Supplier[]
  items: OrderItem[]
  loading: boolean
  addSupplier: (input: NewSupplierInput) => Promise<Supplier>
  updateSupplier: (id: string, input: NewSupplierInput) => Promise<void>
  deleteSupplier: (id: string) => Promise<void>
  addItem: (input: NewOrderItemInput) => Promise<void>
  updateItem: (id: string, patch: { qty?: number; supplierId?: string | null }) => Promise<void>
  cancelItem: (id: string) => Promise<void>
  /** Books a delivery in: adds the quantity back to the product's stock and closes the line. */
  receiveItem: (id: string, qty?: number) => Promise<void>
  refresh: () => void
}

const StockContext = createContext<StockContextValue | null>(null)

type SupplierRow = { id: string; name: string; order_email: string | null; account_number: string }
type ItemRow = {
  id: string
  product_id: string | null
  description: string
  unit: string
  qty: number
  supplier_id: string | null
  supplier_code: string
  source: string
  status: string
  created_at: string
}

const supplierFromRow = (r: SupplierRow): Supplier => ({ id: r.id, name: r.name, orderEmail: r.order_email ?? '', accountNumber: r.account_number })
const itemFromRow = (r: ItemRow): OrderItem => ({
  id: r.id,
  productId: r.product_id ?? undefined,
  description: r.description,
  unit: r.unit,
  qty: Number(r.qty),
  supplierId: r.supplier_id ?? undefined,
  supplierCode: r.supplier_code,
  source: r.source as OrderItem['source'],
  status: r.status as OrderItemStatus,
  createdAt: r.created_at,
})

export function StockProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const { activeBusinessId } = useActiveBusiness()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!session || !activeBusinessId) {
      setSuppliers([])
      setItems([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    if (tick === 0) {
      setSuppliers([])
      setItems([])
    }
    Promise.all([
      supabase.from('suppliers').select('id, name, order_email, account_number').eq('business_id', activeBusinessId).order('name'),
      supabase
        .from('stock_order_items')
        .select('id, product_id, description, unit, qty, supplier_id, supplier_code, source, status, created_at')
        .eq('business_id', activeBusinessId)
        .in('status', ['pending', 'ordered'])
        .order('created_at', { ascending: false }),
    ]).then(([s, i]) => {
      if (cancelled) return
      if (!s.error && s.data) setSuppliers(s.data.map(supplierFromRow))
      if (!i.error && i.data) setItems(i.data.map(itemFromRow))
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [session, activeBusinessId, tick])

  const refresh = useCallback(() => setTick((n) => n + 1), [])

  const addSupplier = useCallback(
    async (input: NewSupplierInput) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ business_id: activeBusinessId!, name: input.name, order_email: input.orderEmail || null, account_number: input.accountNumber })
        .select('id, name, order_email, account_number')
        .single()
      if (error || !data) throw new Error(error?.message ?? 'Failed to add supplier')
      const created = supplierFromRow(data)
      setSuppliers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
      return created
    },
    [activeBusinessId]
  )

  const updateSupplier = useCallback(
    async (id: string, input: NewSupplierInput) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ name: input.name, order_email: input.orderEmail || null, account_number: input.accountNumber })
        .eq('id', id)
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const deleteSupplier = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id)
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const addItem = useCallback(
    async (input: NewOrderItemInput) => {
      const { error } = await supabase.from('stock_order_items').insert({
        business_id: activeBusinessId!,
        product_id: input.productId ?? null,
        description: input.description,
        unit: input.unit,
        qty: input.qty,
        supplier_id: input.supplierId ?? null,
        supplier_code: input.supplierCode ?? '',
        source: 'manual',
      })
      if (error) {
        // The "one open line per product" rule.
        if (error.code === '23505') throw new Error('That product is already on the order list.')
        throw new Error(error.message)
      }
      refresh()
    },
    [activeBusinessId, refresh]
  )

  const updateItem = useCallback(
    async (id: string, patch: { qty?: number; supplierId?: string | null }) => {
      const update: { qty?: number; supplier_id?: string | null; updated_at: string } = { updated_at: new Date().toISOString() }
      if (patch.qty !== undefined) update.qty = patch.qty
      if (patch.supplierId !== undefined) update.supplier_id = patch.supplierId
      const { error } = await supabase.from('stock_order_items').update(update).eq('id', id).eq('status', 'pending')
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const cancelItem = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('stock_order_items')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .in('status', ['pending', 'ordered'])
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const receiveItem = useCallback(
    async (id: string, qty?: number) => {
      const { error } = await supabase.rpc('receive_stock_item', { p_item: id, p_qty: qty })
      if (error) throw new Error(error.message)
      refresh()
    },
    [refresh]
  )

  const value = useMemo(
    () => ({ suppliers, items, loading, addSupplier, updateSupplier, deleteSupplier, addItem, updateItem, cancelItem, receiveItem, refresh }),
    [suppliers, items, loading, addSupplier, updateSupplier, deleteSupplier, addItem, updateItem, cancelItem, receiveItem, refresh]
  )

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>
}

export function useStockStore() {
  const ctx = useContext(StockContext)
  if (!ctx) throw new Error('useStockStore must be used within StockProvider')
  return ctx
}
