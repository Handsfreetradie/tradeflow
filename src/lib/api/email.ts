import { supabase } from '@/lib/supabase'
import { getApiBusinessId, requireApiBusinessId } from '@/lib/api/active-business'

export interface EmailConnectionStatus {
  connected: boolean
  googleEmail: string | null
  connectedAt: string | null
  lastCheckedAt: string | null
  /** How often new email is checked, in minutes. 0 = paused. */
  checkIntervalMinutes: number
}

export type EmailAlertCategory =
  | 'customer'
  | 'quote_response'
  | 'safety_compliance'
  | 'reschedule'
  | 'variation_payment'
  | 'supplier'
  | 'payment'
  | 'other'

export const EMAIL_ALERT_CATEGORY_LABELS: Record<EmailAlertCategory, string> = {
  customer: 'Customer enquiry',
  quote_response: 'Quote reply',
  safety_compliance: 'Safety / compliance',
  reschedule: 'Reschedule',
  variation_payment: 'Variation / payment claim',
  supplier: 'Supplier issue',
  payment: 'Payment question',
  other: 'Needs attention',
}

export interface EmailAlert {
  id: string
  subject: string
  fromAddress: string
  snippet: string
  aiReason: string
  priority: 'high' | 'normal'
  category: EmailAlertCategory
  receivedAt: string
  readAt: string | null
  dismissed: boolean
}

export async function getEmailConnectionStatus(): Promise<EmailConnectionStatus> {
  const businessId = getApiBusinessId()
  const { data } = businessId
    ? await supabase.from('business_email_connection').select('google_email, connected_at, last_checked_at, check_interval_minutes').eq('business_id', businessId).maybeSingle()
    : { data: null }
  return {
    connected: !!data?.google_email,
    googleEmail: data?.google_email ?? null,
    connectedAt: data?.connected_at ?? null,
    lastCheckedAt: data?.last_checked_at ?? null,
    checkIntervalMinutes: data?.check_interval_minutes ?? 15,
  }
}

export const EMAIL_CHECK_INTERVAL_OPTIONS: { minutes: number; label: string }[] = [
  { minutes: 15, label: 'Every 15 minutes' },
  { minutes: 30, label: 'Every 30 minutes' },
  { minutes: 60, label: 'Every hour' },
  { minutes: 120, label: 'Every 2 hours' },
  { minutes: 240, label: 'Every 4 hours' },
  { minutes: 0, label: 'Paused' },
]

export async function setEmailCheckInterval(minutes: number): Promise<void> {
  const { error } = await supabase.from('business_email_connection').update({ check_interval_minutes: minutes }).eq('business_id', requireApiBusinessId())
  if (error) throw new Error(error.message)
}

export async function connectGmail(): Promise<string> {
  const returnUrl = `${window.location.origin}/settings`
  const { data, error } = await supabase.functions.invoke('gmail-oauth-start', { body: { returnUrl, businessId: requireApiBusinessId() } })
  if (error) throw new Error(error.message)
  if (!data?.url) throw new Error('Could not start Google sign-in')
  return data.url as string
}

export async function disconnectGmail(): Promise<void> {
  const { error } = await supabase.functions.invoke('gmail-disconnect', { body: { businessId: requireApiBusinessId() } })
  if (error) throw new Error(error.message)
}

export interface SendDocumentEmailInput {
  to: string
  fromName: string
  subject: string
  message: string
  pdfBase64: string
  filename: string
  /** Where the {{link}} marker in the message points. */
  linkUrl?: string
  linkText?: string
}

const SEND_ERROR_MESSAGES: Record<string, string> = {
  not_connected: 'Connect Gmail in Settings first to send email from TradeFlow.',
  reconnect_required: 'Your Gmail connection needs refreshing — reconnect it in Settings and try again.',
  not_configured: 'Email sending is not configured yet.',
}

export async function sendDocumentEmail(input: SendDocumentEmailInput): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-document-email', { body: { ...input, businessId: requireApiBusinessId() } })
  if (error) throw new Error(error.message)
  if (data?.error) {
    throw new Error(SEND_ERROR_MESSAGES[data.error] ?? (typeof data.error === 'string' ? data.error : 'Failed to send email'))
  }
}

type AlertRow = {
  id: string
  subject: string
  from_address: string
  snippet: string
  ai_reason: string
  priority: string
  category: string | null
  received_at: string
  read_at: string | null
  dismissed: boolean
}

function fromAlertRow(row: AlertRow): EmailAlert {
  return {
    id: row.id,
    subject: row.subject,
    fromAddress: row.from_address,
    snippet: row.snippet,
    aiReason: row.ai_reason,
    priority: row.priority === 'high' ? 'high' : 'normal',
    category: row.category && row.category in EMAIL_ALERT_CATEGORY_LABELS ? (row.category as EmailAlertCategory) : 'other',
    receivedAt: row.received_at,
    readAt: row.read_at,
    dismissed: row.dismissed,
  }
}

export async function listEmailAlerts(): Promise<EmailAlert[]> {
  const businessId = getApiBusinessId()
  if (!businessId) return []
  const { data, error } = await supabase
    .from('email_alerts')
    .select('id, subject, from_address, snippet, ai_reason, priority, category, received_at, read_at, dismissed')
    .eq('business_id', businessId)
    .eq('dismissed', false)
    .order('received_at', { ascending: false })
    .limit(20)
  if (error || !data) return []
  return (data as AlertRow[]).map(fromAlertRow)
}

export async function dismissEmailAlert(id: string): Promise<void> {
  const { error } = await supabase.from('email_alerts').update({ dismissed: true }).eq('id', id)
  if (error) throw new Error(error.message)
}
