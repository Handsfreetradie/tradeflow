import { useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, Users as UsersIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTeamStore } from '@/lib/store/team-store'
import { createUser } from '@/lib/api/createUser'

export default function Settings() {
  const { team, loading, refresh } = useTeamStore()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!fullName.trim() || !email.trim() || password.length < 8) return
    setSubmitting(true)
    setError(null)
    const { error } = await createUser({ email: email.trim(), password, full_name: fullName.trim(), role: 'employee' })
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    toast.success(`${fullName.trim()} can now sign in`)
    setFullName('')
    setEmail('')
    setPassword('')
    setOpen(false)
    refresh()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your team and their access.</p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-4 text-muted-foreground" />
            Team
          </CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <UserPlus />
            Add employee
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="divide-y divide-border">
              {team.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar>
                    <AvatarFallback>{m.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-secondary-foreground">{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add an employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
              <p className="mt-1 text-xs text-muted-foreground">At least 8 characters. Share this with them directly.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={submitting} onClick={submit}>
              {submitting ? 'Creating…' : 'Create login'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
