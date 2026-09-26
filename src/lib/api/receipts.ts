import { supabase } from '@/lib/supabase'
import type { ExpenseCategory } from '@/lib/demo-data'

export interface ScannedReceipt {
  supplier: string | null
  amount: number | null
  date: string | null
  description: string | null
  includesGst: boolean | null
  category: ExpenseCategory | null
}

export async function uploadReceipt(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('receipts').upload(path, file)
  if (error) throw new Error(error.message)
  return path
}

export async function scanReceipt(storagePath: string): Promise<ScannedReceipt> {
  const { data, error } = await supabase.functions.invoke('scan-receipt', { body: { storagePath } })
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
