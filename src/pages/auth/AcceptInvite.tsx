import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LogoMark } from '@/components/shared/Logo'
import { useAuth } from '@/lib/auth/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function AcceptInvite() {
  const navigate = useNavigate()
  const { session, role, loading, fullName, isPasswordRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate(role === 'owner' ? '/' : '/field', { replace: true })
  }

  if (loading) return null

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-lg font-semibold">This link isn't valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">It may have already been used or expired. Request a new one and try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <LogoMark className="size-11" />
          <h1 className="text-xl font-semibold tracking-tight">
            {isPasswordRecovery ? 'Reset your password' : `Welcome${fullName ? `, ${fullName}` : ''}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPasswordRecovery ? 'Choose a new password for your account.' : 'Set a password to finish setting up your account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-white p-6 shadow-subtle">
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Saving…' : 'Set password & continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
