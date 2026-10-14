import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import type { PurchaseOrder, PurchaseOrderStatus } from '@/lib/demo-data'

export interface NewPurchaseOrderInput {
  jobId: string
  supplier?: string
  description?: string
  amount?: number
}

type PurchaseOrderRow = {
  id: string
  number: string
  job_id: string
  supplier: string
  description: string
  amount: number | null
  status: string
  received_expense_id: string | null
  created_at: string
}

function fromRow(row: PurchaseOrderRow): PurchaseOrder {
  return {
    id: row.id,
    number: row.number,
    jobId: row.job_id,
    supplier: row.supplier,
    description: row.description,
    amount: row.amount ?? undefined,
    status: row.status as PurchaseOrderStatus,
    receivedExpenseId: row.received_expense_id ?? undefined,
    createdAt: row.created_at,
  }
}

interface PurchaseOrdersContextValue {
  purchaseOrders: PurchaseOrder[]
  loading: boolean
  addPurchaseOrder: (input: NewPurchaseOrderInput) => Promise<PurchaseOrder>
  cancelPurchaseOrder: (id: string) => Promise<void>
}

const PurchaseOrdersContext = createContext<PurchaseOrdersContextValue | null>(null)

export function PurchaseOrdersProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setPurchaseOrders([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setPurchaseOrders([])
    supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setPurchaseOrders((data as PurchaseOrderRow[]).map(fromRow))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  const addPurchaseOrder = useCallback(async (input: NewPurchaseOrderInput) => {
    const { data: number, error: numberError } = await supabase.rpc('next_po_number')
    if (numberError || !number) throw new Error(numberError?.message ?? 'Failed to generate a PO number')

    const { data: row, error } = await supabase
      .from('purchase_orders')
      .insert({
        number,
        job_id: input.jobId,
        supplier: input.supplier ?? '',
        description: input.description ?? '',
        amount: input.amount ?? null,
      })
      .select('*')
      .single()
    if (error || !row) throw new Error(error?.message ?? 'Failed to create purchase order')
    const created = fromRow(row as PurchaseOrderRow)
    setPurchaseOrders((prev) => [created, ...prev])
    return created
  }, [])

  const cancelPurchaseOrder = useCallback(async (id: string) => {
    const { error } = await supabase.from('purchase_orders').update({ status: 'cancelled' }).eq('id', id)
    if (error) throw new Error(error.message)
    setPurchaseOrders((prev) => prev.map((po) => (po.id === id ? { ...po, status: 'cancelled' } : po)))
  }, [])

  const value = useMemo(
    () => ({ purchaseOrders, loading, addPurchaseOrder, cancelPurchaseOrder }),
    [purchaseOrders, loading, addPurchaseOrder, cancelPurchaseOrder]
  )

  return <PurchaseOrdersContext.Provider value={value}>{children}</PurchaseOrdersContext.Provider>
}

export function usePurchaseOrdersStore() {
  const ctx = useContext(PurchaseOrdersContext)
  if (!ctx) throw new Error('usePurchaseOrdersStore must be used within PurchaseOrdersProvider')
  return ctx
}
