import { supabase } from '@/lib/supabase'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

interface CreateUserInput {
  email: string
  password: string
  full_name: string
  role: 'owner' | 'employee'
}

/** Calls the `create-user` edge function. Owner bootstrap needs no session; employee
 * creation is authorized server-side by the caller's own JWT (must be role='owner'). */
export async function createUser(input: CreateUserInput): Promise<{ error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken ?? ANON_KEY}`,
    },
    body: JSON.stringify(input),
  })

  const body = await res.json().catch(() => ({ error: 'Unexpected response from server' }))
  if (!res.ok) return { error: body.error ?? 'Something went wrong' }
  return { error: null }
}
