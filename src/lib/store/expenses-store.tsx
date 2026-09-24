import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Expense, ExpenseCategory } from '@/lib/demo-data'

export interface NewExpenseInput {
  description: string
  category: ExpenseCategory
  amount: number
  date: string
  includesGst: boolean
  jobId?: string
  supplier?: string
}

interface ExpensesContextValue {
  expenses: Expense[]
  loading: boolean
  addExpense: (input: NewExpenseInput) => Promise<Expense>
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null)

type ExpenseRow = {
  id: string
  description: string
  category: string
  amount: number
  date: string
  includes_gst: boolean
  job_id: string | null
  supplier: string | null
}

function fromRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    description: row.description,
    category: row.category as ExpenseCategory,
    amount: row.amount,
    date: row.date,
    includesGst: row.includes_gst,
    jobId: row.job_id ?? undefined,
    supplier: row.supplier ?? undefined,
  }
}

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setExpenses((data as ExpenseRow[]).map(fromRow))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const addExpense = useCallback(async (input: NewExpenseInput) => {
    const { data: row, error } = await supabase
      .from('expenses')
      .insert({
        description: input.description,
        category: input.category,
        amount: input.amount,
        date: input.date,
        includes_gst: input.includesGst,
        job_id: input.jobId ?? null,
        supplier: input.supplier ?? null,
      })
      .select('*')
      .single()
    if (error || !row) throw new Error(error?.message ?? 'Failed to create expense')
    const created = fromRow(row as ExpenseRow)
    setExpenses((prev) => [created, ...prev])
    return created
  }, [])

  const value = useMemo(() => ({ expenses, loading, addExpense }), [expenses, loading, addExpense])

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>
}

export function useExpensesStore() {
  const ctx = useContext(ExpensesContext)
  if (!ctx) throw new Error('useExpensesStore must be used within ExpensesProvider')
  return ctx
}
