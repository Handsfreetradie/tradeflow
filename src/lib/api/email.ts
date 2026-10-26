import { supabase } from '@/lib/supabase'
import { getApiBusinessId, requireApiBusinessId } from '@/lib/api/active-business'

export interface EmailConnectionStatus {
  connected: boolean
  googleEmail: string | null
  connectedAt: string | null
  lastCheckedAt: string | null
}

export interface EmailAlert {
  id: string
  subject: string
  fromAddress: string
  snippet: string
  aiReason: string
  priority: 'high' | 'normal'
  receivedAt: string
  readAt: string | null
  dismissed: boolean
}

export async function getEmailConnectionStatus(): Promise<EmailConnectionStatus> {
  const businessId = getApiBusinessId()
  const { data } = businessId
    ? await supabase.from('business_email_connection').select('google_email, connected_at, last_checked_at').eq('business_id', businessId).maybeSingle()
    : { data: null }
  return {
    connected: !!data?.google_email,
    googleEmail: data?.google_email ?? null,
    connectedAt: data?.connected_at ?? null,
    lastCheckedAt: data?.last_checked_at ?? null,
  }
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
    .select('id, subject, from_address, snippet, ai_reason, priority, received_at, read_at, dismissed')
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
