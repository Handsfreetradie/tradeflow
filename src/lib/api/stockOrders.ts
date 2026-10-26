import { supabase } from '@/lib/supabase'
import { requireApiBusinessId } from '@/lib/api/active-business'

export interface OrderPreview {
  to: string
  subject: string
  body: string
  itemIds: string[]
}

const ORDER_ERROR_MESSAGES: Record<string, string> = {
  not_connected: 'Connect Gmail in Settings first.',
  reconnect_required: 'Your Gmail connection needs refreshing — reconnect it in Settings and try again.',
  not_configured: 'Email is not configured yet.',
  supplier_not_found: "Couldn't find that supplier.",
  no_supplier_email: "This supplier has no order email yet — add one in Settings → Suppliers.",
  nothing_to_order: 'Nothing is waiting to be ordered from this supplier.',
  already_sent: 'That order has already been sent.',
  send_failed: "Gmail wouldn't send that — try again in a moment.",
}

async function call<T>(action: 'preview' | 'send', supplierId: string, extra: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('stock-order', { body: { action, supplierId, businessId: requireApiBusinessId(), ...extra } })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(ORDER_ERROR_MESSAGES[data.error] ?? (typeof data.error === 'string' ? data.error : 'Something went wrong'))
  return data as T
}

/** The order email for one supplier, built from its waiting items — for the owner to read and edit. */
export const previewOrder = (supplierId: string) => call<OrderPreview>('preview', supplierId)

export const sendOrder = (supplierId: string, input: OrderPreview) =>
  call<{ to: string; count: number }>('send', supplierId, { subject: input.subject, body: input.body, itemIds: input.itemIds })
