import { supabase } from '@/lib/supabase'
import { requireApiBusinessId } from '@/lib/api/active-business'
import type { ExpenseCategory } from '@/lib/demo-data'

export interface ScannedReceipt {
  supplier: string | null
  amount: number | null
  date: string | null
  description: string | null
  includesGst: boolean | null
  category: ExpenseCategory | null
}

/** Path-prefixed with the owner's own business id so the storage RLS policy can scope it —
 * matches the job-id-prefixed convention uploadJobCostReceipt uses for employee uploads below. */
export async function uploadReceipt(file: File): Promise<string> {
  const businessId = requireApiBusinessId()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${businessId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('receipts').upload(path, file)
  if (error) throw new Error(error.message)
  return path
}

/** Same bucket as uploadReceipt, but path-prefixed with the job id — employees can only upload
 * (and read back) receipts under a job they're assigned to; see the storage policies on `receipts`. */
export async function uploadJobCostReceipt(jobId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${jobId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('receipts').upload(path, file)
  if (error) throw new Error(error.message)
  return path
}

export async function scanReceipt(storagePath: string): Promise<ScannedReceipt> {
  const { data, error } = await supabase.functions.invoke('scan-receipt', { body: { storagePath, businessId: requireApiBusinessId() } })
  if (error) throw new Error(error.message)
  return data as ScannedReceipt
}

export async function getReceiptUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage.from('receipts').createSignedUrl(storagePath, 60 * 60)
  return data?.signedUrl ?? null
}

export async function deleteReceipt(storagePath: string): Promise<void> {
  await supabase.storage.from('receipts').remove([storagePath])
}
