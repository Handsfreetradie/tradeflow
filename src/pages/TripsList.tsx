import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Car, Download, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTripsStore } from '@/lib/store/trips-store'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { KM_CAP, defaultKmRate, downloadTripsCsv, fyLabel, fyStartOf, tripTotals } from '@/lib/trips'
import { formatDate, formatMoney, toDateKey } from '@/lib/utils'

const rateKey = (fyStart: number) => `tradeflow.kmRate.${fyStart}`

function loadRate(fyStart: number): number {
  try {
    const stored = Number(localStorage.getItem(rateKey(fyStart)))
    if (stored > 0) return stored
  } catch {
    // storage blocked — fall back to the default
  }
  return defaultKmRate(fyStart)
}

export default function TripsList() {
  const navigate = useNavigate()
  const { trips, addTrip, deleteTrip } = useTripsStore()
  const { jobs, getJob } = useJobsStore()
  const { settings } = useBusinessSettings()

  const currentFy = fyStartOf(toDateKey(new Date()))
  const [fyStart, setFyStart] = useState(currentFy)
  const [rate, setRate] = useState(() => loadRate(currentFy))
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const [date, setDate] = useState(toDateKey(new Date()))
  const [km, setKm] = useState('')
  const [returnTrip, setReturnTrip] = useState(false)
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [purpose, setPurpose] = useState('')
  const [jobId, setJobId] = useState('none')
  const [saving, setSaving] = useState(false)

  const years = useMemo(() => {
    const set = new Set<number>([currentFy, ...trips.map((t) => fyStartOf(t.date))])
    return [...set].sort((a, b) => b - a)
  }, [trips, currentFy])

  const yearTrips = useMemo(
    () => trips.filter((t) => fyStartOf(t.date) === fyStart).sort((a, b) => b.date.localeCompare(a.date)),
    [trips, fyStart]
  )
  const totals = tripTotals(yearTrips, rate)

  const changeYear = (value: string) => {
    const y = Number(value)
    setFyStart(y)
    setRate(loadRate(y))
  }

  const changeRate = (value: string) => {
    const n = Number(value)
    setRate(n)
    if (n > 0) {
      try {
        localStorage.setItem(rateKey(fyStart), String(n))
      } catch {
        // storage blocked — the rate just won't be remembered
      }
    }
  }

  const enteredKm = Number(km)
  const kmToSave = returnTrip ? enteredKm * 2 : enteredKm
  const canSubmit = enteredKm > 0 && kmToSave <= 5000 && !!date

  const submit = async () => {
    if (!canSubmit || saving) return
    setSaving(true)
    try {
      await addTrip({
        date,
        km: Math.round(kmToSave * 10) / 10,
        fromLocation: fromLocation.trim() || undefined,
        toLocation: toLocation.trim() || undefined,
        purpose: purpose.trim(),
        jobId: jobId === 'none' ? undefined : jobId,
      })
      toast.success('Trip logged')
      setKm('')
      setReturnTrip(false)
      setFromLocation('')
      setToLocation('')
      setPurpose('')
      setJobId('none')
      // Show the year the trip landed in, so it doesn't look like it vanished.
      const landedIn = fyStartOf(date)
      if (landedIn !== fyStart) changeYear(String(landedIn))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to log trip')
    } finally {
      setSaving(false)
    }
  }

  const removeTrip = async () => {
    if (!deleteTargetId) return
    try {
      await deleteTrip(deleteTargetId)
      toast.success('Trip deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete trip')
    }
  }

  const jobLabel = (id?: string) => {
    const job = id ? getJob(id) : undefined
    return job ? `${job.number} — ${job.title}` : ''
  }

  const deleteTarget = yearTrips.find((t) => t.id === deleteTargetId)
  const capUsed = Math.min(100, (totals.totalKm / KM_CAP) * 100)

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kilometre log</h1>
          <p className="mt-1 text-sm text-muted-foreground">Work trips for your tax return — ATO cents-per-km method.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(fyStart)} onValueChange={changeYear}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  FY {fyLabel(y)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            disabled={yearTrips.length === 0}
            onClick={() => downloadTripsCsv({ businessName: settings.businessName, fyStart, rate, trips: yearTrips, jobLabel })}
          >
            <Download />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total km this year</p>
            <p className="mt-1 text-2xl font-semibold">{totals.totalKm.toLocaleString('en-AU', { maximumFractionDigits: 1 })} km</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className={totals.overCapKm > 0 ? 'h-full bg-warning' : 'h-full bg-primary'} style={{ width: `${capUsed}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {totals.overCapKm > 0
                ? `${totals.overCapKm.toLocaleString('en-AU', { maximumFractionDigits: 1 })} km over the ${KM_CAP.toLocaleString('en-AU')} km cap — only ${KM_CAP.toLocaleString('en-AU')} km can be claimed this way`
                : `${KM_CAP.toLocaleString('en-AU')} km is the most you can claim this way`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Estimated deduction</p>
            <p className="mt-1 text-2xl font-semibold">{formatMoney(totals.deduction)}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {totals.claimableKm.toLocaleString('en-AU', { maximumFractionDigits: 1 })} km × {formatMoney(rate)} per km
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <label className="text-xs font-medium text-muted-foreground">Rate ($ per km) for FY {fyLabel(fyStart)}</label>
            <Input type="number" min="0" step="0.01" value={rate} onChange={(e) => changeRate(e.target.value)} className="mt-1" />
            <p className="mt-1.5 text-xs text-muted-foreground">The ATO sets this each year — check ato.gov.au and correct it here if needed.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log a trip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Distance (km)</label>
              <Input type="number" min="0" step="0.1" value={km} onChange={(e) => setKm(e.target.value)} placeholder="0" className="mt-1" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox checked={returnTrip} onCheckedChange={(v) => setReturnTrip(v === true)} />
                Return trip{returnTrip && enteredKm > 0 ? ` (logs ${kmToSave.toLocaleString('en-AU', { maximumFractionDigits: 1 })} km)` : ''}
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">From (optional)</label>
              <Input value={fromLocation} onChange={(e) => setFromLocation(e.target.value)} placeholder="e.g. Home" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">To (optional)</label>
              <Input value={toLocation} onChange={(e) => setToLocation(e.target.value)} placeholder="e.g. 12 Smith St, Joondalup" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Purpose</label>
              <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Switchboard upgrade" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Link to a job (optional)</label>
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No linked job</SelectItem>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.number} — {j.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={!canSubmit || saving} onClick={submit}>
              <Plus />
              Log trip
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {yearTrips.length === 0 ? (
            <EmptyState icon={Car} title="No trips logged this year" description="Log your first work trip above and your running total will show here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead className="hidden lg:table-cell">Job</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead>Km</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearTrips.map((trip) => {
                  const job = trip.jobId ? getJob(trip.jobId) : undefined
                  const route = [trip.fromLocation, trip.toLocation].filter(Boolean).join(' → ')
                  return (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <p className="font-medium">{trip.purpose || route || 'Work trip'}</p>
                        {trip.purpose && route ? <p className="text-xs text-muted-foreground">{route}</p> : null}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {job ? (
                          <button onClick={() => navigate(`/jobs/${job.id}`)} className="text-primary hover:underline">
                            {job.number}
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">{formatDate(trip.date, { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                      <TableCell className="font-medium">{trip.km.toLocaleString('en-AU', { maximumFractionDigits: 1 })}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTargetId(trip.id)}>
                          <Trash2 className="text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title={`Delete this ${deleteTarget?.km ?? ''} km trip?`}
        description="This removes it from your kilometre log. This can't be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={removeTrip}
      />
    </div>
  )
}
