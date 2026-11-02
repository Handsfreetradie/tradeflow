import { supabase } from '@/lib/supabase'
import { requireApiBusinessId } from '@/lib/api/active-business'
import type { ExpenseCategory } from '@/lib/demo-data'

export interface ScannedReceipt {
  supplier: string | null
  amount: number | null
  currency: string | null
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

/** Pass `jobId` for a photo uploaded with uploadJobCostReceipt (employees scan under the job they're assigned to). */
export async function scanReceipt(storagePath: string, jobId?: string): Promise<ScannedReceipt> {
  const body = jobId ? { storagePath, jobId } : { storagePath, businessId: requireApiBusinessId() }
  const { data, error } = await supabase.functions.invoke('scan-receipt', { body })
  if (error) throw new Error(error.message)
  return data as ScannedReceipt
}

/** Job costs only have Materials / Labour / Subcontractor / Other, so the wider expense categories fold down. */
export function jobCostCategoryFor(category: ExpenseCategory | null): 'Materials' | 'Subcontractor' | 'Other' {
  if (category === 'Materials') return 'Materials'
  if (category === 'Subcontractor') return 'Subcontractor'
  return 'Other'
}

export async function getReceiptUrl(storagePath: string): Promise<string | null> {
  const { data } = await supabase.storage.from('receipts').createSignedUrl(storagePath, 60 * 60)
  return data?.signedUrl ?? null
}

export async function deleteReceipt(storagePath: string): Promise<void> {
  await supabase.storage.from('receipts').remove([storagePath])
}
