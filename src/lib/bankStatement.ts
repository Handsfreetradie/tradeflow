import Papa from 'papaparse'

export interface StatementLine {
  date: string
  description: string
  amount: number
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 }

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const d = new Date(Date.UTC(year, month - 1, day))
  if (d.getUTCMonth() !== month - 1) return null
  return d.toISOString().slice(0, 10)
}

/** Reads the date formats Australian banks use (day first), plus ISO. Returns YYYY-MM-DD or null. */
export function parseStatementDate(raw: string): string | null {
  const s = raw.trim()
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (m) return isoDate(Number(m[1]), Number(m[2]), Number(m[3]))
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/)
  if (m) return isoDate(m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]), Number(m[2]), Number(m[1]))
  m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3})[A-Za-z]*[\s,-]+(\d{2}|\d{4})$/)
  if (m) {
    const month = MONTHS[m[2].toLowerCase()]
    if (month) return isoDate(m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]), month, Number(m[1]))
  }
  return null
}

/** Money cell → signed number. Handles $, commas, (brackets), trailing minus and DR/CR. Returns null for anything else. */
export function parseStatementAmount(raw: string): number | null {
  const s = raw.trim()
  if (!s) return null
  const m = s.match(/^(\()?\s*(-)?\s*\$?\s*(-)?\s*([\d,]+(?:\.\d+)?)\s*(-)?\s*(\))?\s*(DR|CR)?$/i)
  if (!m) return null
  const value = Number(m[4].replace(/,/g, ''))
  if (!Number.isFinite(value)) return null
  const negative = !!(m[1] || m[2] || m[3] || m[5]) || m[7]?.toUpperCase() === 'DR'
  return negative ? -value : value
}

function columnStats(rows: string[][], col: number) {
  let dates = 0
  let numbers = 0
  let textLength = 0
  let filled = 0
  for (const row of rows) {
    const cell = (row[col] ?? '').trim()
    if (!cell) continue
    filled++
    if (parseStatementDate(cell)) dates++
    else if (parseStatementAmount(cell) !== null) numbers++
    textLength += cell.length
  }
  return { dates: filled ? dates / filled : 0, numbers: filled ? numbers / filled : 0, filled, avgLength: filled ? textLength / filled : 0 }
}

/**
 * Works out which columns are the date, description and money-out, whatever the bank calls them
 * (with or without a header row). Returns null when it can't be sure — the caller then lets the AI read the file.
 */
export function parseStatementCsv(text: string): StatementLine[] | null {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true })
  const all = parsed.data.filter((r) => r.some((c) => c.trim() !== ''))
  if (all.length < 2) return null

  const first = all[0]
  const hasHeader = first.every((c) => parseStatementDate(c) === null && parseStatementAmount(c) === null)
  const header = hasHeader ? first.map((h) => h.trim().toLowerCase()) : []
  const rows = hasHeader ? all.slice(1) : all
  const width = Math.max(...rows.map((r) => r.length))
  const stats = Array.from({ length: width }, (_, i) => columnStats(rows, i))

  const dateCol = stats.findIndex((s) => s.dates >= 0.7)
  if (dateCol < 0) return null

  const named = (pattern: RegExp, exclude?: RegExp) => header.findIndex((h, i) => i !== dateCol && pattern.test(h) && !(exclude && exclude.test(h)) && stats[i].numbers >= 0.2)
  const debitCol = named(/debit|withdraw|paid out|money out|\bdr\b/)
  const creditCol = named(/credit|deposit|paid in|money in|\bcr\b/)
  let amountCol = debitCol >= 0 ? -1 : named(/amount|value/, /balance/)
  if (debitCol < 0 && amountCol < 0) {
    // No usable header: the first money column is the transaction (the last is usually the running balance).
    const numeric = stats.map((s, i) => ({ i, s })).filter(({ i, s }) => i !== dateCol && s.numbers >= 0.5 && !/balance/.test(header[i] ?? ''))
    if (numeric.length === 0) return null
    amountCol = numeric[0].i
  }

  const moneyCols = new Set([dateCol, debitCol, creditCol, amountCol].filter((i) => i >= 0))
  const textCols = stats.map((s, i) => ({ i, s })).filter(({ i, s }) => !moneyCols.has(i) && s.numbers < 0.5 && s.dates < 0.5 && s.filled > 0 && !/balance/.test(header[i] ?? ''))
  if (textCols.length === 0) return null
  const named_desc = textCols.find(({ i }) => /desc|narr|detail|particular|transaction|payee|memo|reference/.test(header[i] ?? ''))
  const descCol = (named_desc ?? textCols.reduce((best, c) => (c.s.avgLength > best.s.avgLength ? c : best))).i

  // With a single signed column we can only tell debits from credits if the file actually has negatives.
  if (debitCol < 0) {
    const hasNegative = rows.some((r) => (parseStatementAmount(r[amountCol] ?? '') ?? 0) < 0)
    if (!hasNegative) return null
  }

  const lines: StatementLine[] = []
  for (const row of rows) {
    const date = parseStatementDate(row[dateCol] ?? '')
    const description = (row[descCol] ?? '').replace(/\s+/g, ' ').trim()
    if (!date || !description) continue
    let out = 0
    if (debitCol >= 0) {
      const v = parseStatementAmount(row[debitCol] ?? '')
      if (v) out = Math.abs(v)
    } else {
      const v = parseStatementAmount(row[amountCol] ?? '')
      if (v !== null && v < 0) out = -v
    }
    if (out > 0) lines.push({ date, description: description.slice(0, 200), amount: Math.round(out * 100) / 100 })
  }
  return lines.length > 0 ? lines : null
}
