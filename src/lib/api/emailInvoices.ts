import { supabase } from '@/lib/supabase'
import { getApiBusinessId, requireApiBusinessId } from '@/lib/api/active-business'
import type { ExpenseCategory, GstType } from '@/lib/demo-data'

export interface EmailInvoiceCandidate {
  id: string
  supplier: string | null
  amount: number | null
  date: string | null
  description: string
  gstType: GstType
  category: ExpenseCategory | null
  receiptStoragePath: string | null
  subject: string
  fromAddress: string
  receivedAt: string
  /** Set when the email's subject/body contained an open PO number — the job it belongs to. */
  jobId: string | null
  matchedPoNumber: string | null
}

type CandidateRow = {
  id: string
  supplier: string | null
  amount: number | null
  date: string | null
  description: string
  gst_type: string
  category: string | null
  receipt_storage_path: string | null
  subject: string
  from_address: string
  received_at: string
  job_id: string | null
  matched_po_number: string | null
}

function fromRow(row: CandidateRow): EmailInvoiceCandidate {
  return {
    id: row.id,
    supplier: row.supplier,
    amount: row.amount,
    date: row.date,
    description: row.description,
    gstType: row.gst_type as GstType,
    category: row.category as ExpenseCategory | null,
    receiptStoragePath: row.receipt_storage_path,
    subject: row.subject,
    fromAddress: row.from_address,
    receivedAt: row.received_at,
    jobId: row.job_id,
    matchedPoNumber: row.matched_po_number,
  }
}

export async function listEmailInvoiceCandidates(): Promise<EmailInvoiceCandidate[]> {
  const businessId = getApiBusinessId()
  if (!businessId) return []
  const { data, error } = await supabase
    .from('email_invoice_candidates')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'pending')
    .order('received_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as CandidateRow[]).map(fromRow)
}

export async function getEmailInvoiceCandidate(id: string): Promise<EmailInvoiceCandidate | null> {
  const { data, error } = await supabase.from('email_invoice_candidates').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  return data ? fromRow(data as CandidateRow) : null
}

export async function dismissEmailInvoiceCandidate(id: string): Promise<void> {
  const { error } = await supabase.from('email_invoice_candidates').update({ status: 'dismissed' }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function markEmailInvoiceCandidateAdded(id: string, expenseId: string, matchedPoNumber?: string | null): Promise<void> {
  const { error } = await supabase.from('email_invoice_candidates').update({ status: 'added', created_expense_id: expenseId }).eq('id', id)
  if (error) throw new Error(error.message)
  // Fulfils the PO so it drops off the "awaiting invoice" view — best-effort, doesn't block the expense.
  if (matchedPoNumber) {
    await supabase.from('purchase_orders').update({ status: 'received', received_expense_id: expenseId }).eq('number', matchedPoNumber)
  }
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

/** Copies an attachment out of the private email-invoices bucket into the receipts bucket, so an
 * expense created from an email candidate uses the same storage convention as a phone-scanned
 * receipt (one bucket, one getReceiptUrl helper, one "missing receipt" check). */
export async function claimEmailInvoiceReceipt(sourcePath: string): Promise<{ path: string; isImage: boolean; filename: string; blob: Blob }> {
  const { data: blob, error: downloadError } = await supabase.storage.from('email-invoices').download(sourcePath)
  if (downloadError || !blob) throw new Error(downloadError?.message ?? 'Could not read the email attachment')

  const filename = sourcePath.split('/').pop() ?? sourcePath
  const ext = filename.split('.').pop()?.toLowerCase() ?? 'pdf'
  const isImage = IMAGE_EXTENSIONS.includes(ext)
  // The receipts storage policy needs the business id as the first folder.
  const path = `${requireApiBusinessId()}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('receipts').upload(path, blob, { contentType: blob.type })
  if (uploadError) throw new Error(uploadError.message)

  return { path, isImage, filename, blob }
}
