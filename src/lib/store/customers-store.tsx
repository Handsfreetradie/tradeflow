import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth/AuthProvider'
import type { Customer } from '@/lib/demo-data'

export interface NewCustomerInput {
  name: string
  contact?: string
  email?: string
  phone?: string
  address?: string
}

export interface CustomerEditInput {
  name?: string
  contact?: string
  email?: string
  phone?: string
  address?: string
}

interface CustomersContextValue {
  customers: Customer[]
  loading: boolean
  getCustomer: (id: string) => Customer | undefined
  addCustomer: (input: NewCustomerInput) => Promise<Customer>
  updateCustomer: (id: string, patch: CustomerEditInput) => Promise<void>
  updateNotes: (id: string, notes: string) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
}

const CustomersContext = createContext<CustomersContextValue | null>(null)

function fromRow(row: {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
  notes: string
}): Customer {
  return row
}

export function CustomersProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      setCustomers([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setCustomers([])
    supabase
      .from('customers')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setCustomers(data.map(fromRow))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  const getCustomer = useCallback((id: string) => customers.find((c) => c.id === id), [customers])

  const addCustomer = useCallback(async (input: NewCustomerInput) => {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: input.name,
        contact: input.contact ?? '',
        email: input.email ?? '',
        phone: input.phone ?? '',
        address: input.address ?? '',
      })
      .select('*')
      .single()
    if (error || !data) throw new Error(error?.message ?? 'Failed to create customer')
    const created = fromRow(data)
    setCustomers((prev) => [created, ...prev].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }, [])

  const updateCustomer = useCallback(async (id: string, patch: CustomerEditInput) => {
    const { error } = await supabase.from('customers').update(patch).eq('id', id)
    if (error) throw new Error(error.message)
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)).sort((a, b) => a.name.localeCompare(b.name))
    )
  }, [])

  const updateNotes = useCallback(async (id: string, notes: string) => {
    const { error } = await supabase.from('customers').update({ notes }).eq('id', id)
    if (error) throw new Error(error.message)
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)))
  }, [])

  const deleteCustomer = useCallback(async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) {
      // Postgres foreign_key_violation — this customer still has jobs, quotes or invoices linked to them.
      if (error.code === '23503') throw new Error('This customer has jobs, quotes or invoices linked to them — delete those first.')
      throw new Error(error.message)
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const value = useMemo(
    () => ({ customers, loading, getCustomer, addCustomer, updateCustomer, updateNotes, deleteCustomer }),
    [customers, loading, getCustomer, addCustomer, updateCustomer, updateNotes, deleteCustomer]
  )

  return <CustomersContext.Provider value={value}>{children}</CustomersContext.Provider>
}

export function useCustomersStore() {
  const ctx = useContext(CustomersContext)
  if (!ctx) throw new Error('useCustomersStore must be used within CustomersProvider')
  return ctx
}
