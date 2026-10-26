import type { Trip } from '@/lib/store/trips-store'
import { formatDate } from '@/lib/utils'

/** ATO cents-per-km method: claims are capped at 5,000 business km per car per year. */
export const KM_CAP = 5000

/**
 * Cents-per-km rate ($/km) by financial year, keyed by the calendar year the FY starts in
 * (2025 = 1 Jul 2025 – 30 Jun 2026). The ATO resets this each year — the page lets the owner
 * override it, and the 2026–27 figure here was not checked against ato.gov.au.
 */
const DEFAULT_RATES: Record<number, number> = {
  2025: 0.88,
  2026: 0.91,
}

export function defaultKmRate(fyStart: number): number {
  if (DEFAULT_RATES[fyStart] != null) return DEFAULT_RATES[fyStart]
  const known = Object.keys(DEFAULT_RATES).map(Number)
  const nearest = known.reduce((best, y) => (Math.abs(y - fyStart) < Math.abs(best - fyStart) ? y : best), known[0])
  return DEFAULT_RATES[nearest]
}

/** Australian financial year (1 Jul – 30 Jun) that a YYYY-MM-DD date falls in, as its start year. */
export function fyStartOf(dateKey: string): number {
  const [y, m] = dateKey.split('-').map(Number)
  return m >= 7 ? y : y - 1
}

export function fyLabel(fyStart: number): string {
  return `${fyStart}–${String((fyStart + 1) % 100).padStart(2, '0')}`
}

export interface TripTotals {
  totalKm: number
  claimableKm: number
  overCapKm: number
  deduction: number
}

export function tripTotals(trips: Trip[], rate: number): TripTotals {
  // Work in tenths of a km so repeated float addition can't drift (the km column has 1 decimal place).
  const tenths = trips.reduce((sum, t) => sum + Math.round(t.km * 10), 0)
  const totalKm = tenths / 10
  const claimableKm = Math.min(totalKm, KM_CAP)
  return {
    totalKm,
    claimableKm,
    overCapKm: Math.max(0, totalKm - KM_CAP),
    deduction: Math.round(claimableKm * rate * 100) / 100,
  }
}

function csvCell(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(',')
}

export function buildTripsCsv(opts: {
  businessName: string
  fyStart: number
  rate: number
  trips: Trip[]
  jobLabel: (jobId?: string) => string
}): string {
  const totals = tripTotals(opts.trips, opts.rate)
  const sorted = [...opts.trips].sort((a, b) => a.date.localeCompare(b.date))
  const lines: string[] = []
  lines.push(csvRow([`${opts.businessName} — kilometre log`]))
  lines.push(csvRow([`Financial year: ${fyLabel(opts.fyStart)} (1 Jul ${opts.fyStart} – 30 Jun ${opts.fyStart + 1})`]))
  lines.push(csvRow(['Method: ATO cents per kilometre']))
  lines.push('')
  lines.push(csvRow(['Date', 'From', 'To', 'Purpose', 'Job', 'Km']))
  for (const t of sorted) {
    lines.push(
      csvRow([formatDate(t.date, { day: 'numeric', month: 'short', year: 'numeric' }), t.fromLocation ?? '', t.toLocation ?? '', t.purpose, opts.jobLabel(t.jobId), t.km.toFixed(1)])
    )
  }
  lines.push('')
  lines.push(csvRow(['Total km', totals.totalKm.toFixed(1)]))
  lines.push(csvRow([`Claimable km (capped at ${KM_CAP})`, totals.claimableKm.toFixed(1)]))
  lines.push(csvRow(['Rate ($ per km)', opts.rate.toFixed(2)]))
  lines.push(csvRow(['Estimated deduction', totals.deduction.toFixed(2)]))
  return lines.join('\n')
}

export function downloadTripsCsv(opts: Parameters<typeof buildTripsCsv>[0]): void {
  const blob = new Blob([buildTripsCsv(opts)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Kilometre-log-${fyLabel(opts.fyStart)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
