import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { UserPlus, Users as UsersIcon, Building2, Upload, Trash2, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useTeamStore, type TeamMember } from '@/lib/store/team-store'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { useAuth } from '@/lib/auth/AuthProvider'
import { createUser } from '@/lib/api/createUser'
import { deleteUser } from '@/lib/api/deleteUser'

function BusinessCard() {
  const { settings, loading, updateSettings, uploadLogo } = useBusinessSettings()
  const [name, setName] = useState(settings.businessName)
  const [abn, setAbn] = useState(settings.abn)
  const [licenceNumber, setLicenceNumber] = useState(settings.licenceNumber)
  const [bankAccountName, setBankAccountName] = useState(settings.bankAccountName)
  const [bankBsb, setBankBsb] = useState(settings.bankBsb)
  const [bankAccountNumber, setBankAccountNumber] = useState(settings.bankAccountNumber)
  const [savingName, setSavingName] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setName(settings.businessName)
    setAbn(settings.abn)
    setLicenceNumber(settings.licenceNumber)
    setBankAccountName(settings.bankAccountName)
    setBankBsb(settings.bankBsb)
    setBankAccountNumber(settings.bankAccountNumber)
  }, [settings])

  const dirty =
    name !== settings.businessName ||
    abn !== settings.abn ||
    licenceNumber !== settings.licenceNumber ||
    bankAccountName !== settings.bankAccountName ||
    bankBsb !== settings.bankBsb ||
    bankAccountNumber !== settings.bankAccountNumber

  const saveDetails = async () => {
    setSavingName(true)
    try {
      await updateSettings({ businessName: name, abn, licenceNumber, bankAccountName, bankBsb, bankAccountNumber })
      toast.success('Business details updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSavingName(false)
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }
    setUploading(true)
    try {
      await uploadLogo(file)
      toast.success('Logo updated — it will now show on your quotes and invoices')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          Business
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary/40">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Business logo" className="size-full object-contain" />
            ) : (
              <span className="text-xs text-muted-foreground">No logo</span>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
            <Button variant="secondary" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              <Upload />
              {uploading ? 'Uploading…' : 'Upload logo'}
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">Shows on your quotes and invoices automatically.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Business name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">ABN (optional)</label>
            <Input value={abn} onChange={(e) => setAbn(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Electrical licence number</label>
            <Input value={licenceNumber} onChange={(e) => setLicenceNumber(e.target.value)} placeholder="e.g. EC12345" className="mt-1" />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm font-medium">Bank details</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Shown on invoices so customers know where to pay.</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Account name</label>
              <Input value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">BSB</label>
              <Input value={bankBsb} onChange={(e) => setBankBsb(e.target.value)} placeholder="000-000" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Account number</label>
              <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className="mt-1" />
            </div>
          </div>
        </div>
        {dirty && (
          <Button size="sm" disabled={savingName} onClick={saveDetails}>
            {savingName ? 'Saving…' : 'Save details'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function QuoteDefaultsCard() {
  const { settings, loading, updateSettings } = useBusinessSettings()
  const [terms, setTerms] = useState(settings.defaultQuoteTerms)
  const [exclusions, setExclusions] = useState(settings.defaultQuoteExclusions)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setTerms(settings.defaultQuoteTerms)
    setExclusions(settings.defaultQuoteExclusions)
  }, [settings.defaultQuoteTerms, settings.defaultQuoteExclusions])

  const dirty = terms !== settings.defaultQuoteTerms || exclusions !== settings.defaultQuoteExclusions

  const save = async () => {
    setSaving(true)
    try {
      await updateSettings({ defaultQuoteTerms: terms, defaultQuoteExclusions: exclusions })
      toast.success('Quote defaults updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="size-4 text-muted-foreground" />
          Quote Defaults
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Pre-fills every new quote — you can still change or add to it on any individual quote.
        </p>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Default terms</label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={2}
            className="mt-1 w-full resize-none rounded-lg border border-input bg-white p-3 text-sm shadow-subtle placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Default exclusions</label>
          <textarea
            value={exclusions}
            onChange={(e) => setExclusions(e.target.value)}
            rows={2}
            placeholder="e.g. Excludes council permits, asbestos removal, making good of walls/ceilings."
            className="mt-1 w-full resize-none rounded-lg border border-input bg-white p-3 text-sm shadow-subtle placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {dirty && (
          <Button size="sm" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save defaults'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function RateInput({ member }: { member: TeamMember }) {
  const { updateRate } = useTeamStore()
  const [value, setValue] = useState(member.hourlyRate?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValue(member.hourlyRate?.toString() ?? '')
  }, [member.hourlyRate])

  const save = async () => {
    const parsed = value.trim() === '' ? null : Number(value)
    if (parsed !== null && (Number.isNaN(parsed) || parsed < 0)) {
      setValue(member.hourlyRate?.toString() ?? '')
      return
    }
    if (parsed === member.hourlyRate) return
    setSaving(true)
    try {
      await updateRate(member.id, parsed)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save rate')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>$</span>
      <Input
        type="number"
        min="0"
        step="0.01"
        value={value}
        placeholder="0.00"
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        className="h-7 w-20 px-1.5 text-xs"
      />
      <span>/hr</span>
    </div>
  )
}

const TRADE_ROLES = [
  'Licensed Electrician',
  'Apprentice (1st Year)',
  'Apprentice (2nd Year)',
  'Apprentice (3rd Year)',
  'Apprentice (4th Year)',
  'Labourer',
  'Supervisor',
  'Office/Admin',
]

function TradeRoleSelect({ member }: { member: TeamMember }) {
  const { updateTradeRole } = useTeamStore()

  return (
    <Select
      value={member.tradeRole || 'unset'}
      onValueChange={(v) => updateTradeRole(member.id, v === 'unset' ? '' : v).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to save'))}
    >
      <SelectTrigger className="h-7 w-40 text-xs">
        <SelectValue placeholder="Set role..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unset">Not set</SelectItem>
        {TRADE_ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default function Settings() {
  const { team, loading, refresh } = useTeamStore()
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<{ id: string; fullName: string } | null>(null)
  const [removing, setRemoving] = useState(false)

  const removeEmployee = async (id: string) => {
    setRemoving(true)
    const { error } = await deleteUser(id)
    setRemoving(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Employee removed')
    refresh()
  }

  const submit = async () => {
    if (!fullName.trim() || !email.trim()) return
    setSubmitting(true)
    setError(null)
    const { error } = await createUser({
      email: email.trim(),
      full_name: fullName.trim(),
      role: 'employee',
      redirectTo: `${window.location.origin}/auth/accept-invite`,
    })
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    toast.success(`Invite sent to ${email.trim()}`)
    setFullName('')
    setEmail('')
    setOpen(false)
    refresh()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your business, team and their access.</p>
      </div>

      <BusinessCard />

      <QuoteDefaultsCard />

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
                <div key={m.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar>
                    <AvatarFallback>{m.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-secondary-foreground">{m.role}</span>
                  {m.role === 'employee' && <TradeRoleSelect member={m} />}
                  {m.role === 'employee' && <RateInput member={m} />}
                  {m.role === 'employee' && m.id !== session?.user.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRemoveTarget({ id: m.id, fullName: m.fullName })}
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  )}
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
              <p className="mt-1 text-xs text-muted-foreground">They'll get an email with a link to set their own password.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={submitting} onClick={submit}>
              {submitting ? 'Sending…' : 'Send invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
        title={`Remove ${removeTarget?.fullName}?`}
        description="They'll immediately lose access to TradeFlow. Any jobs they were assigned to stay as they are."
        confirmLabel={removing ? 'Removing…' : 'Remove'}
        variant="danger"
        onConfirm={() => removeTarget && removeEmployee(removeTarget.id)}
      />
    </div>
  )
}
