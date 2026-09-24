// Shared TypeScript shapes for TradeFlow. Data itself now lives in Supabase — see
// src/lib/store/*.tsx for the providers that fetch/mutate it. This file only keeps the
// type definitions (so components share one vocabulary) plus a couple of static display
// constants that aren't part of the database.

export type JobStatus = 'In Progress' | 'Scheduled' | 'Completed' | 'On Hold' | 'Cancelled'
export type InvoiceStatus = 'Draft' | 'Sent' | 'Partial' | 'Paid' | 'Overdue'
export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired'
export type ExpenseCategory = 'Materials' | 'Fuel' | 'Tools & Equipment' | 'Subcontractor' | 'Vehicle' | 'Insurance' | 'Office' | 'Other'
export type PaymentMethod = 'Bank Transfer' | 'Card' | 'Cash' | 'Cheque'

export interface LineItem {
  id: string
  description: string
  qty: number
  unitPrice: number
}

export type PricingType = 'Fixed Price' | 'Time & Materials'

export interface JobCost {
  id: string
  description: string
  category: 'Materials' | 'Labour' | 'Subcontractor' | 'Other'
  amount: number
  date: string
  /** Supplier/source name — the hook a future auto-imported supplier invoice would populate. */
  supplier?: string
  /** PO / job number the supplier referenced — lets a future inbound-invoice pipeline auto-match to this job. */
  poNumber?: string
}

export interface JobNote {
  id: string
  type: 'note' | 'status_change'
  author: string
  text: string
  timestamp: string
}

/**
 * On-site check-in/out record — the field-worker "am I on this job right now" log. Employee-
 * facing operational data: shown on Job Detail only, deliberately kept out of Invoices/Reports/
 * anything a customer or the books would touch. `checkOut` is null while still on site.
 */
export interface JobCheckIn {
  id: string
  employeeId: string
  employeeName: string
  checkIn: string
  checkOut: string | null
  note?: string
}

export interface Customer {
  id: string
  name: string
  contact: string
  email: string
  phone: string
  address: string
  notes: string
}

export interface Job {
  id: string
  number: string
  title: string
  customerId: string
  customer: string
  address: string
  status: JobStatus
  value: number
  dueDate: string
  /** Optional appointment window for the calendar/upcoming-jobs view, e.g. "9:00 AM – 11:00 AM". */
  scheduledTime?: string
  thumbnail: string
  /** Everyone assigned to this job — can be more than one person. */
  assignees: { id: string; fullName: string }[]
  quoteId?: string
  invoiceId?: string
  lineItems: LineItem[]
  pricingType: PricingType
  costs: JobCost[]
  photos: number
  notes: JobNote[]
  checkIns: JobCheckIn[]
}

export interface Payment {
  id: string
  amount: number
  method: PaymentMethod
  date: string
}

export interface Invoice {
  id: string
  number: string
  customerId: string
  customer: string
  date: string
  dueDate: string
  amount: number
  status: InvoiceStatus
  lineItems: LineItem[]
  includeGst: boolean
  notes: string
  paymentTerms: string
  payments: Payment[]
  jobId?: string
}

export interface Expense {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  date: string
  includesGst: boolean
  jobId?: string
  supplier?: string
}

export interface Quote {
  id: string
  number: string
  customerId: string
  customer: string
  date: string
  amount: number
  status: QuoteStatus
  lineItems: LineItem[]
  includeGst: boolean
  validityDays: number
  terms: string
  notes: string
  /** Set once this quote has been converted into a job. */
  jobId?: string
}

export interface ActivityItem {
  id: string
  type: 'invoice_paid' | 'job_updated' | 'quote_accepted' | 'invoice_sent' | 'customer_added'
  title: string
  detail: string
  timestamp: string
}

export const businessName = 'Dixon Electrical'
export const ownerFirstName = 'Kyle'

export const recentActivity: ActivityItem[] = [
  { id: 'a-1', type: 'invoice_paid', title: 'Invoice #INV-1024 paid', detail: '$4,850 from Smith Residence', timestamp: '2 hours ago' },
  { id: 'a-2', type: 'job_updated', title: 'Job J-1022 updated', detail: 'Status changed to In Progress', timestamp: '4 hours ago' },
  { id: 'a-3', type: 'quote_accepted', title: 'Quote Q-1003 accepted', detail: '$9,800 from Coastal Constructions', timestamp: '6 hours ago' },
  { id: 'a-4', type: 'invoice_sent', title: 'Invoice #INV-1021 sent', detail: '$9,800 to Coastal Constructions', timestamp: 'Yesterday' },
  { id: 'a-5', type: 'customer_added', title: 'New customer added', detail: 'Lakeside Developments', timestamp: '2 days ago' },
]
