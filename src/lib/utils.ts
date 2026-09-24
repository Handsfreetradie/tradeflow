import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-AU', opts ?? { day: 'numeric', month: 'short' }).format(d)
}

/**
 * Formats a Date as a local YYYY-MM-DD key. Never use `date.toISOString().slice(0, 10)` for
 * this — it serializes in UTC, which lags a calendar day behind local time for any AU timezone
 * during early-morning hours (e.g. 6am AEST is still "yesterday" in UTC). This uses the Date's
 * local getFullYear/getMonth/getDate instead, so it always matches the viewer's own calendar day.
 */
export function toDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
