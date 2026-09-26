import { supabase } from '@/lib/supabase'

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
  const { data } = await supabase.from('email_connections').select('google_email, connected_at, last_checked_at').eq('id', true).maybeSingle()
  return {
    connected: !!data?.google_email,
    googleEmail: data?.google_email ?? null,
    connectedAt: data?.connected_at ?? null,
    lastCheckedAt: data?.last_checked_at ?? null,
  }
}

export async function connectGmail(): Promise<string> {
  const returnUrl = `${window.location.origin}/settings`
  const { data, error } = await supabase.functions.invoke('gmail-oauth-start', { body: { returnUrl } })
  if (error) throw new Error(error.message)
  if (!data?.url) throw new Error('Could not start Google sign-in')
  return data.url as string
}

export async function disconnectGmail(): Promise<void> {
  const { error } = await supabase.functions.invoke('gmail-disconnect')
  if (error) throw new Error(error.message)
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
  const { data, error } = await supabase
    .from('email_alerts')
    .select('id, subject, from_address, snippet, ai_reason, priority, received_at, read_at, dismissed')
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
