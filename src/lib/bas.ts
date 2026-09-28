import type { GstType } from '@/lib/demo-data'

export function gstComponent(exGstAmount: number, gstType: GstType): number {
  return gstType === 'gst_inclusive' ? exGstAmount * 0.1 : 0
}

export function gstInclusiveTotal(exGstAmount: number, gstType: GstType): number {
  return exGstAmount + gstComponent(exGstAmount, gstType)
}

/** ATO BAS quarter: 0=Jan-Mar, 1=Apr-Jun, 2=Jul-Sep, 3=Oct-Dec. `year` is the calendar year the
 * quarter starts in. `end` is exclusive. Due dates are the standard ATO quarterly BAS dates. */
export interface BasQuarter {
  year: number
  quarterIndex: 0 | 1 | 2 | 3
  start: Date
  end: Date
  dueDate: Date
  label: string
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function buildQuarter(year: number, quarterIndex: 0 | 1 | 2 | 3): BasQuarter {
  const startMonth = quarterIndex * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 1)
  const dueDate =
    quarterIndex === 0
      ? new Date(year, 3, 28) // Jan-Mar -> 28 Apr
      : quarterIndex === 1
        ? new Date(year, 6, 28) // Apr-Jun -> 28 Jul
        : quarterIndex === 2
          ? new Date(year, 9, 28) // Jul-Sep -> 28 Oct
          : new Date(year + 1, 1, 28) // Oct-Dec -> 28 Feb next year
  const endLabelDate = new Date(year, startMonth + 2, 1)
  const label = `${start.toLocaleDateString('en-AU', { month: 'short' })} – ${endLabelDate.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}`
  return { year, quarterIndex, start, end, dueDate, label }
}

export function quarterFromDate(date: Date): BasQuarter {
  const quarterIndex = Math.floor(date.getMonth() / 3) as 0 | 1 | 2 | 3
  return buildQuarter(date.getFullYear(), quarterIndex)
}

export function adjacentQuarter(q: BasQuarter, direction: 1 | -1): BasQuarter {
  let quarterIndex = q.quarterIndex + direction
  let year = q.year
  if (quarterIndex > 3) {
    quarterIndex = 0
    year += 1
  } else if (quarterIndex < 0) {
    quarterIndex = 3
    year -= 1
  }
  return buildQuarter(year, quarterIndex as 0 | 1 | 2 | 3)
}

/** The next BAS due date on or after `from` (defaults to today). */
export function nextBasDueDate(from: Date = new Date()): Date {
  const today = startOfDay(from)
  const candidates: Date[] = []
  for (let yearOffset = -1; yearOffset <= 1; yearOffset++) {
    for (let q = 0; q < 4; q++) {
      candidates.push(buildQuarter(from.getFullYear() + yearOffset, q as 0 | 1 | 2 | 3).dueDate)
    }
  }
  candidates.sort((a, b) => a.getTime() - b.getTime())
  return candidates.find((d) => d >= today)!
}

/** Days from today until `date` (can be negative if `date` has passed). */
export function daysUntil(date: Date, from: Date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((startOfDay(date).getTime() - startOfDay(from).getTime()) / msPerDay)
}
