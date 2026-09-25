import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Invoice, InvoiceStatus, LineItem, PaymentMethod } from '@/lib/demo-data'

export interface NewInvoiceInput {
  customerId: string
  customer: string
  includeGst: boolean
  dueDate: string
  notes: string
  paymentTerms: string
  lineItems: LineItem[]
  jobId?: string
}

interface InvoicesContextValue {
  invoices: Invoice[]
  loading: boolean
  getInvoice: (id: string) => Invoice | undefined
  addInvoice: (input: NewInvoiceInput) => Promise<Invoice>
  markSent: (id: string) => Promise<void>
  recordPayment: (id: string, amount: number, method: PaymentMethod) => Promise<void>
}

const InvoicesContext = createContext<InvoicesContextValue | null>(null)

function invoiceTotal(invoice: Pick<Invoice, 'amount' | 'includeGst'>) {
  return invoice.includeGst ? invoice.amount * 1.1 : invoice.amount
}

/** Round to the nearest cent to avoid floating-point drift (e.g. 7200 * 1.1 !== 7920) affecting status comparisons. */
function toCents(value: number) {
  return Math.round(value * 100)
}

function statusFromPayments(invoice: Invoice): InvoiceStatus {
  if (invoice.status === 'Draft') return 'Draft'
  const paid = toCents(invoice.payments.reduce((sum, p) => sum + p.amount, 0))
  const total = toCents(invoiceTotal(invoice))
  if (paid >= total) return 'Paid'
  if (paid > 0) return 'Partial'
  if (new Date(invoice.dueDate) < new Date()) return 'Overdue'
  return 'Sent'
}

const INVOICE_SELECT = '*, customer:customers(name), invoice_line_items(*), payments(*)'

type InvoiceRow = {
  id: string
  number: string
  customer_id: string
  customer: { name: string } | null
  date: string
  due_date: string
  amount: number
  status: string
  include_gst: boolean
  notes: string
  payment_terms: string
  job_id: string | null
  share_token: string
  first_viewed_at: string | null
  last_viewed_at: string | null
  view_count: number
  invoice_line_items: Array<{ id: string; description: string; qty: number; unit_price: number }>
  payments: Array<{ id: string; amount: number; method: string; date: string }>
}

function fromRow(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    number: row.number,
    customerId: row.customer_id,
    customer: row.customer?.name ?? '',
    date: row.date,
    dueDate: row.due_date,
    amount: row.amount,
    status: row.status as InvoiceStatus,
    includeGst: row.include_gst,
    notes: row.notes,
    paymentTerms: row.payment_terms,
    lineItems: row.invoice_line_items.map((li) => ({ id: li.id, description: li.description, qty: li.qty, unitPrice: li.unit_price })),
    payments: row.payments.map((p) => ({ id: p.id, amount: p.amount, method: p.method as PaymentMethod, date: p.date })),
    jobId: row.job_id ?? undefined,
    shareToken: row.share_token,
    firstViewedAt: row.first_viewed_at ?? undefined,
    lastViewedAt: row.last_viewed_at ?? undefined,
    viewCount: row.view_count,
  }
}

export function InvoicesProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('invoices')
      .select(INVOICE_SELECT)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setInvoices((data as unknown as InvoiceRow[]).map(fromRow))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const getInvoice = useCallback((id: string) => invoices.find((i) => i.id === id), [invoices])

  const addInvoice = useCallback(async (input: NewInvoiceInput) => {
    const { data: number, error: numberError } = await supabase.rpc('next_invoice_number')
    if (numberError || !number) throw new Error(numberError?.message ?? 'Failed to allocate invoice number')
    const amount = input.lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)

    const { data: row, error } = await supabase
      .from('invoices')
      .insert({
        number,
        customer_id: input.customerId,
        date: new Date().toISOString().slice(0, 10),
        due_date: input.dueDate,
        amount,
        status: 'Draft',
        include_gst: input.includeGst,
        notes: input.notes,
        payment_terms: input.paymentTerms,
        job_id: input.jobId ?? null,
      })
      .select('*, customer:customers(name)')
      .single()
    if (error || !row) throw new Error(error?.message ?? 'Failed to create invoice')

    if (input.lineItems.length > 0) {
      const { error: liError } = await supabase
        .from('invoice_line_items')
        .insert(input.lineItems.map((li, i) => ({ invoice_id: row.id, description: li.description, qty: li.qty, unit_price: li.unitPrice, sort_order: i })))
      if (liError) throw new Error(liError.message)
    }

    const created = fromRow({
      ...(row as unknown as InvoiceRow),
      invoice_line_items: input.lineItems.map((li) => ({ id: li.id, description: li.description, qty: li.qty, unit_price: li.unitPrice })),
      payments: [],
    })
    setInvoices((prev) => [created, ...prev])
    return created
  }, [])

  const markSent = useCallback(async (id: string) => {
    const { error } = await supabase.from('invoices').update({ status: 'Sent' }).eq('id', id)
    if (error) throw new Error(error.message)
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'Sent' } : i)))
  }, [])

  const recordPayment = useCallback(async (id: string, amount: number, method: PaymentMethod) => {
    const date = new Date().toISOString().slice(0, 10)
    const { data: paymentRow, error } = await supabase.from('payments').insert({ invoice_id: id, amount, method, date }).select('*').single()
    if (error || !paymentRow) throw new Error(error?.message ?? 'Failed to record payment')

    let nextStatus: InvoiceStatus = 'Sent'
    setInvoices((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const updated: Invoice = { ...i, payments: [...i.payments, { id: paymentRow.id, amount, method, date }] }
        nextStatus = statusFromPayments(updated)
        return { ...updated, status: nextStatus }
      })
    )
    await supabase.from('invoices').update({ status: nextStatus }).eq('id', id)
  }, [])

  const value = useMemo(
    () => ({ invoices, loading, getInvoice, addInvoice, markSent, recordPayment }),
    [invoices, loading, getInvoice, addInvoice, markSent, recordPayment]
  )

  return <InvoicesContext.Provider value={value}>{children}</InvoicesContext.Provider>
}

export function useInvoicesStore() {
  const ctx = useContext(InvoicesContext)
  if (!ctx) throw new Error('useInvoicesStore must be used within InvoicesProvider')
  return ctx
}

export { invoiceTotal }
