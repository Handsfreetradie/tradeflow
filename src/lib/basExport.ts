import type { BasQuarter } from '@/lib/bas'
import { formatDate } from '@/lib/utils'

interface ExportPayment {
  invoiceNumber: string
  date: string
  amount: number
}

interface ExportExpense {
  description: string
  supplier?: string
  date: string
  amount: number
}

interface BasExportInput {
  quarter: BasQuarter
  businessName: string
  g1: number
  oneA: number
  oneB: number
  netGst: number
  payments: ExportPayment[]
  verifiedExpenses: ExportExpense[]
  unverifiedExpenses: ExportExpense[]
}

const dateOpts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

function csvCell(value: string | number): string {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(',')
}

export function buildBasExportCsv(input: BasExportInput): string {
  const lines: string[] = []
  lines.push(csvRow([`${input.businessName} — BAS export`]))
  lines.push(csvRow([`Quarter: ${input.quarter.label}`]))
  lines.push('')
  lines.push(csvRow(['GST Summary']))
  lines.push(csvRow(['G1 — Total sales', input.g1.toFixed(2)]))
  lines.push(csvRow(['1A — GST on sales', input.oneA.toFixed(2)]))
  lines.push(csvRow(['1B — GST on expenses', input.oneB.toFixed(2)]))
  lines.push(csvRow(['Net GST (owing if positive)', input.netGst.toFixed(2)]))
  lines.push('')
  lines.push(csvRow(['Sales this quarter']))
  lines.push(csvRow(['Invoice', 'Date', 'Amount']))
  for (const p of input.payments) lines.push(csvRow([p.invoiceNumber, formatDate(p.date, dateOpts), p.amount.toFixed(2)]))
  lines.push('')
  lines.push(csvRow(['Expenses this quarter (receipt verified — included in 1B)']))
  lines.push(csvRow(['Description', 'Supplier', 'Date', 'Amount']))
  for (const e of input.verifiedExpenses) lines.push(csvRow([e.description, e.supplier ?? '', formatDate(e.date, dateOpts), e.amount.toFixed(2)]))
  lines.push('')
  lines.push(csvRow(['Missing receipts (excluded from 1B until a receipt is attached)']))
  lines.push(csvRow(['Description', 'Supplier', 'Date', 'Amount']))
  for (const e of input.unverifiedExpenses) lines.push(csvRow([e.description, e.supplier ?? '', formatDate(e.date, dateOpts), e.amount.toFixed(2)]))
  return lines.join('\n')
}

export function downloadBasExportCsv(input: BasExportInput): void {
  const csv = buildBasExportCsv(input)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `BAS-${input.quarter.year}-Q${input.quarter.quarterIndex + 1}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
