import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'
import type { Expense, ExpenseCategory, GstType } from '@/lib/demo-data'

export interface NewExpenseInput {
  description: string
  category: ExpenseCategory
  amount: number
  date: string
  gstType: GstType
  jobId?: string
  supplier?: string
  receiptStoragePath?: string
}

interface ExpensesContextValue {
  expenses: Expense[]
  loading: boolean
  addExpense: (input: NewExpenseInput) => Promise<Expense>
  deleteExpense: (id: string) => Promise<void>
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null)

type ExpenseRow = {
  id: string
  description: string
  category: string
  amount: number
  date: string
  gst_type: string
  job_id: string | null
  supplier: string | null
  receipt_storage_path: string | null
}

function fromRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    description: row.description,
    category: row.category as ExpenseCategory,
    amount: row.amount,
    date: row.date,
    gstType: row.gst_type as GstType,
    jobId: row.job_id ?? undefined,
    supplier: row.supplier ?? undefined,
    receiptStoragePath: row.receipt_storage_path ?? undefined,
  }
}

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const { activeBusinessId } = useActiveBusiness()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session || !activeBusinessId) {
      setExpenses([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setExpenses([])
    supabase
      .from('expenses')
      .select('*')
      .eq('business_id', activeBusinessId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setExpenses((data as ExpenseRow[]).map(fromRow))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session, activeBusinessId])

  const addExpense = useCallback(async (input: NewExpenseInput) => {
    const { data: row, error } = await supabase
      .from('expenses')
      .insert({
        business_id: activeBusinessId ?? undefined,
        description: input.description,
        category: input.category,
        amount: input.amount,
        date: input.date,
        gst_type: input.gstType,
        job_id: input.jobId ?? null,
        supplier: input.supplier ?? null,
        receipt_storage_path: input.receiptStoragePath ?? null,
      })
      .select('*')
      .single()
    if (error || !row) throw new Error(error?.message ?? 'Failed to create expense')
    const created = fromRow(row as ExpenseRow)
    setExpenses((prev) => [created, ...prev])
    return created
  }, [activeBusinessId])

  const deleteExpense = useCallback(
    async (id: string) => {
      const expense = expenses.find((e) => e.id === id)
      // Unlink any email-inbox candidate that created this expense first — it has a NO ACTION FK,
      // so deleting the expense while one still points at it would fail.
      await supabase.from('email_invoice_candidates').update({ created_expense_id: null }).eq('created_expense_id', id)
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw new Error(error.message)
      if (expense?.receiptStoragePath) await supabase.storage.from('receipts').remove([expense.receiptStoragePath])
      setExpenses((prev) => prev.filter((e) => e.id !== id))
    },
    [expenses]
  )

  const value = useMemo(() => ({ expenses, loading, addExpense, deleteExpense }), [expenses, loading, addExpense, deleteExpense])

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
}

export function useExpensesStore() {
  const ctx = useContext(ExpensesContext)
  if (!ctx) throw new Error('useExpensesStore must be used within ExpensesProvider')
  return ctx
}
