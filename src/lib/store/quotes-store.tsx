import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { LineItem, Quote, QuoteStatus } from '@/lib/demo-data'

export interface NewQuoteInput {
  customerId: string
  customer: string
  includeGst: boolean
  validityDays: number
  terms: string
  notes: string
  lineItems: LineItem[]
}

interface QuotesContextValue {
  quotes: Quote[]
  loading: boolean
  getQuote: (id: string) => Quote | undefined
  addQuote: (input: NewQuoteInput) => Promise<Quote>
  updateStatus: (id: string, status: QuoteStatus) => Promise<void>
  linkJob: (id: string, jobId: string) => Promise<void>
}

const QuotesContext = createContext<QuotesContextValue | null>(null)

const QUOTE_SELECT = '*, customer:customers(name), quote_line_items(*)'

type QuoteRow = {
  id: string
  number: string
  customer_id: string
  customer: { name: string } | null
  date: string
  amount: number
  status: string
  job_id: string | null
  include_gst: boolean
  validity_days: number
  terms: string
  notes: string
  quote_line_items: Array<{ id: string; description: string; qty: number; unit_price: number }>
}

function fromRow(row: QuoteRow): Quote {
  return {
    id: row.id,
    number: row.number,
    customerId: row.customer_id,
    customer: row.customer?.name ?? '',
    date: row.date,
    amount: row.amount,
    status: row.status as QuoteStatus,
    jobId: row.job_id ?? undefined,
    includeGst: row.include_gst,
    validityDays: row.validity_days,
    terms: row.terms,
    notes: row.notes,
    lineItems: row.quote_line_items.map((li) => ({ id: li.id, description: li.description, qty: li.qty, unitPrice: li.unit_price })),
  }
}

export function QuotesProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('quotes')
      .select(QUOTE_SELECT)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setQuotes((data as unknown as QuoteRow[]).map(fromRow))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const getQuote = useCallback((id: string) => quotes.find((q) => q.id === id), [quotes])

  const addQuote = useCallback(async (input: NewQuoteInput) => {
    const { data: number, error: numberError } = await supabase.rpc('next_quote_number')
    if (numberError || !number) throw new Error(numberError?.message ?? 'Failed to allocate quote number')
    const amount = input.lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)

    const { data: row, error } = await supabase
      .from('quotes')
      .insert({
        number,
        customer_id: input.customerId,
        date: new Date().toISOString().slice(0, 10),
        amount,
        status: 'Draft',
        include_gst: input.includeGst,
        validity_days: input.validityDays,
        terms: input.terms,
        notes: input.notes,
      })
      .select('*, customer:customers(name)')
      .single()
    if (error || !row) throw new Error(error?.message ?? 'Failed to create quote')

    if (input.lineItems.length > 0) {
      const { error: liError } = await supabase
        .from('quote_line_items')
        .insert(input.lineItems.map((li, i) => ({ quote_id: row.id, description: li.description, qty: li.qty, unit_price: li.unitPrice, sort_order: i })))
      if (liError) throw new Error(liError.message)
    }

    const created = fromRow({ ...(row as unknown as QuoteRow), quote_line_items: input.lineItems.map((li) => ({ id: li.id, description: li.description, qty: li.qty, unit_price: li.unitPrice })) })
    setQuotes((prev) => [created, ...prev])
    return created
  }, [])

  const updateStatus = useCallback(async (id: string, status: QuoteStatus) => {
    const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
    if (error) throw new Error(error.message)
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)))
  }, [])

  const linkJob = useCallback(async (id: string, jobId: string) => {
    const { error } = await supabase.from('quotes').update({ job_id: jobId }).eq('id', id)
    if (error) throw new Error(error.message)
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, jobId } : q)))
  }, [])

  const value = useMemo(
    () => ({ quotes, loading, getQuote, addQuote, updateStatus, linkJob }),
    [quotes, loading, getQuote, addQuote, updateStatus, linkJob]
  )

  return <QuotesContext.Provider value={value}>{children}</QuotesContext.Provider>
}

export function useQuotesStore() {
  const ctx = useContext(QuotesContext)
  if (!ctx) throw new Error('useQuotesStore must be used within QuotesProvider')
  return ctx
}
