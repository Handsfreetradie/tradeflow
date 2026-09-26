import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — check .env.local')
}

// Implicit flow (not the default PKCE) so a password-reset or invite link works
// even when opened on a different device/browser than the one that requested it —
// PKCE ties the link to a code verifier stored only in the requesting browser.
export const supabase = createClient<Database>(url, key, { auth: { flowType: 'implicit' } })
