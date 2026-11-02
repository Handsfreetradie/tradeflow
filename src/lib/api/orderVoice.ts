import { supabase } from '@/lib/supabase'
import { requireApiBusinessId } from '@/lib/api/active-business'

export interface SpokenItem {
  name: string
  qty: number
  unit: string
}

/** Splits dictated or typed text ("twenty double GPOs, two rolls of 2.5 TPS…") into separate items with quantities. */
export async function parseOrderText(text: string): Promise<SpokenItem[]> {
  const { data, error } = await supabase.functions.invoke('order-list-parse', { body: { text, businessId: requireApiBusinessId() } })
  if (error) {
    let message = error.message
    try {
      const response = (error as { context?: Response }).context
      const parsed = response ? await response.json() : null
      if (parsed?.error) message = parsed.error
    } catch {
      // keep the generic message
    }
    throw new Error(message)
  }
  return (data as { items: SpokenItem[] }).items
}
