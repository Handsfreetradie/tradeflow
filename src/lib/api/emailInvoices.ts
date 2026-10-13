import { supabase } from '@/lib/supabase'
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
  }
}

export async function listEmailInvoiceCandidates(): Promise<EmailInvoiceCandidate[]> {
  const { data, error } = await supabase
    .from('email_invoice_candidates')
    .select('*')
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

export async function markEmailInvoiceCandidateAdded(id: string, expenseId: string): Promise<void> {
  const { error } = await supabase.from('email_invoice_candidates').update({ status: 'added', created_expense_id: expenseId }).eq('id', id)
  if (error) throw new Error(error.message)
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
  const path = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('receipts').upload(path, blob, { contentType: blob.type })
  if (uploadError) throw new Error(uploadError.message)

  return { path, isImage, filename, blob }
}
