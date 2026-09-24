import { supabase } from '@/lib/supabase'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** Removes an employee's login. Owner-only, authorized server-side by the caller's JWT. */
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken ?? ANON_KEY}`,
    },
    body: JSON.stringify({ userId }),
  })

  const body = await res.json().catch(() => ({ error: 'Unexpected response from server' }))
  if (!res.ok) return { error: body.error ?? 'Something went wrong' }
  return { error: null }
}
