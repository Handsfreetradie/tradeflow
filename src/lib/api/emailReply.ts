import { supabase } from '@/lib/supabase'
import { requireApiBusinessId } from '@/lib/api/active-business'

export interface OriginalEmail {
  from: string
  to: string
  subject: string
  date: string
  body: string
  truncated: boolean
}

const REPLY_ERROR_MESSAGES: Record<string, string> = {
  not_connected: 'Connect Gmail in Settings first.',
  reconnect_required: 'Your Gmail connection needs refreshing — reconnect it in Settings and try again.',
  not_configured: 'Email is not configured yet.',
  email_gone: 'That email is no longer in your inbox.',
  email_not_found: "That email isn't one TradeFlow flagged.",
  ai_not_configured: 'The AI helper is not set up yet.',
  draft_failed: "Couldn't write a draft just now — try again, or type your own reply.",
  send_failed: "Gmail wouldn't send that — try again in a moment.",
  no_recipient: "Couldn't work out who to reply to.",
}

async function call<T>(action: 'get' | 'draft' | 'send', messageId: string, extra: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('gmail-reply', { body: { action, messageId, businessId: requireApiBusinessId(), ...extra } })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(REPLY_ERROR_MESSAGES[data.error] ?? (typeof data.error === 'string' ? data.error : 'Something went wrong'))
  return data as T
}

/** Reads the original email live from Gmail — nothing is stored in TradeFlow. */
export const getOriginalEmail = (messageId: string) => call<OriginalEmail>('get', messageId)

export async function draftReply(messageId: string): Promise<string> {
  return (await call<{ draft: string }>('draft', messageId)).draft
}

export async function sendReply(messageId: string, reply: string): Promise<{ to: string }> {
  return call<{ to: string }>('send', messageId, { reply })
}
