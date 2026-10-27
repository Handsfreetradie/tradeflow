import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { parseCsvFile, type ParsedCsv } from '@/lib/csv'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useExpensesStore } from '@/lib/store/expenses-store'
import { supabase } from '@/lib/supabase'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'
import type { ExpenseCategory } from '@/lib/demo-data'
import { toDateKey } from '@/lib/utils'

type Target = 'customers' | 'expenses' | 'products'

interface FieldSpec {
  key: string
  label: string
  required: boolean
}

const CUSTOMER_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'contact', label: 'Contact person', required: false },
  { key: 'email', label: 'Email', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'address', label: 'Address', required: false },
]

const EXPENSE_FIELDS: FieldSpec[] = [
  { key: 'description', label: 'Description', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'date', label: 'Date', required: true },
  { key: 'category', label: 'Category', required: false },
  { key: 'supplier', label: 'Supplier', required: false },
]

const PRODUCT_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Name / description', required: true },
  { key: 'name2', label: 'Description, second part (joined to the name)', required: false },
  { key: 'supplierCode', label: 'Product code (re-importing updates the price)', required: false },
  { key: 'vendorPart', label: "Manufacturer's part number", required: false },
  { key: 'category', label: 'Category', required: false },
  { key: 'unit', label: 'Unit', required: false },
  { key: 'unitPrice', label: 'Your cost price ($)', required: false },
]

const PRODUCT_BATCH = 1000

// Supplier unit codes -> words. Unknown codes are kept as typed (lowercased).
const UNIT_WORDS: Record<string, string> = {
  EA: 'each', EACH: 'each', MTR: 'metre', LN: 'length', PK: 'pack', PKT: 'pack', RO: 'roll', ROLL: 'roll', RL: 'reel',
  BX: 'box', KT: 'kit', PR: 'pair', SET: 'set', BG: 'bag', CT: 'carton', FT: 'foot', TN: 'tin',
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Materials', 'Fuel', 'Tools & Equipment', 'Subcontractor', 'Vehicle', 'Insurance', 'Office', 'Other']

function parseFlexibleDate(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const direct = new Date(trimmed)
  if (!Number.isNaN(direct.getTime())) return toDateKey(direct)

  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    const year = y.length === 2 ? `20${y}` : y
    const date = new Date(Number(year), Number(m) - 1, Number(d))
    if (!Number.isNaN(date.getTime())) return toDateKey(date)
  }

  return null
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.-]/g, '')
  if (!cleaned) return null
  const value = Number(cleaned)
  return Number.isFinite(value) && value > 0 ? value : null
}

function parsePrice(raw: string): number {
  const cleaned = raw.replace(/[^0-9.-]/g, '')
  const value = Number(cleaned)
  return Number.isFinite(value) && value >= 0 ? value : 0
}

export default function ImportData() {
  const navigate = useNavigate()
  const { addCustomer } = useCustomersStore()
  const { addExpense } = useExpensesStore()
  const { activeBusinessId } = useActiveBusiness()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [target, setTarget] = useState<Target>('customers')
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [hasHeader, setHasHeader] = useState(true)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const fields = target === 'customers' ? CUSTOMER_FIELDS : target === 'expenses' ? EXPENSE_FIELDS : PRODUCT_FIELDS

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setResult(null)
    try {
      const csv = await parseCsvFile(file)
      if (csv.headers.length === 0) {
        toast.error('That file looks empty')
        return
      }
      setParsed(csv)
      // Some supplier exports have no header row — the first line is already a product (it has a price in it).
      const firstRowIsData = csv.headers.some((h) => /^\d+(\.\d+)?$/.test(h.trim()) && Number(h) > 0)
      setHasHeader(!firstRowIsData)
      setMapping(guessMapping(csv.headers, !firstRowIsData))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read that file")
    }
  }

  // With "no header row" the first line is data, and columns are just numbered.
  const view = useMemo(() => {
    if (!parsed) return { headers: [] as string[], rows: [] as string[][] }
    if (hasHeader) return parsed
    return {
      headers: parsed.headers.map((h, i) => `Column ${i + 1} (e.g. ${h.trim().slice(0, 22) || 'blank'})`),
      rows: [parsed.headers, ...parsed.rows],
    }
  }, [parsed, hasHeader])

  const guessMapping = (headers: string[], withHeader: boolean): Record<string, string> => {
    const guessed: Record<string, string> = {}
    if (withHeader) {
      for (const field of fields) {
        const idx = headers.findIndex((h) => h.trim().toLowerCase() === field.label.toLowerCase() || h.trim().toLowerCase() === field.key)
        if (idx !== -1) guessed[field.key] = String(idx)
      }
    } else if (target === 'products' && headers.length >= 11 && /^\d+(\.\d+)?$/.test(headers[6]?.trim() ?? '')) {
      // The MM Electrical price list layout: code, description 1 & 2, …, your price per unit, vendor part, …, unit.
      Object.assign(guessed, { supplierCode: '0', name: '1', name2: '2', unitPrice: '6', vendorPart: '7', unit: '10' })
    }
    return guessed
  }

  const changeHasHeader = (value: boolean) => {
    setHasHeader(value)
    if (parsed) setMapping(guessMapping(parsed.headers, value))
  }

  const previewRows = useMemo(() => view.rows.slice(0, 5), [view])

  const getMapped = (row: string[], key: string) => {
    const idx = mapping[key]
    if (idx === undefined || idx === '') return ''
    return row[Number(idx)]?.trim() ?? ''
  }

  const importProducts = async () => {
    if (!activeBusinessId) {
      toast.error('Could not work out which business this is for')
      return
    }
    const records: Record<string, string | number>[] = []
    let invalid = 0
    for (const row of view.rows) {
      const name = `${getMapped(row, 'name')} ${getMapped(row, 'name2')}`.replace(/\s+/g, ' ').trim()
      if (!name) {
        invalid++
        continue
      }
      const rawUnit = getMapped(row, 'unit')
      records.push({
        name,
        category: getMapped(row, 'category'),
        unit: UNIT_WORDS[rawUnit.toUpperCase()] ?? (rawUnit.toLowerCase() || 'each'),
        unit_price: parsePrice(getMapped(row, 'unitPrice')),
        supplier_code: getMapped(row, 'supplierCode'),
        vendor_part: getMapped(row, 'vendorPart'),
      })
    }

    setImporting(true)
    setProgress({ done: 0, total: records.length })
    let imported = 0
    let failed = 0
    for (let i = 0; i < records.length; i += PRODUCT_BATCH) {
      const chunk = records.slice(i, i + PRODUCT_BATCH)
      const { data, error } = await supabase.rpc('import_products', { p_business: activeBusinessId, p_rows: chunk })
      if (error) failed += chunk.length
      else imported += data ?? 0
      setProgress({ done: Math.min(i + PRODUCT_BATCH, records.length), total: records.length })
    }
    setImporting(false)
    setProgress(null)
    setResult({ imported, skipped: invalid + failed })
    if (imported > 0) toast.success(`Imported ${imported.toLocaleString()} products`)
    if (invalid + failed > 0) toast.info(`Skipped ${(invalid + failed).toLocaleString()} row${invalid + failed === 1 ? '' : 's'}`)
  }

  const runImport = async () => {
    if (!parsed) return
    const missingRequired = fields.some((f) => f.required && !mapping[f.key])
    if (missingRequired) {
      toast.error('Map every required field before importing')
      return
    }

    if (target === 'products') {
      await importProducts()
      return
    }

    setImporting(true)
    let imported = 0
    let skipped = 0

    for (const row of view.rows) {
      try {
        if (target === 'customers') {
          const name = getMapped(row, 'name')
          if (!name) {
            skipped++
            continue
          }
          await addCustomer({
            name,
            contact: getMapped(row, 'contact') || undefined,
            email: getMapped(row, 'email') || undefined,
            phone: getMapped(row, 'phone') || undefined,
            address: getMapped(row, 'address') || undefined,
          })
        } else if (target === 'expenses') {
          const description = getMapped(row, 'description')
          const amount = parseAmount(getMapped(row, 'amount'))
          const date = parseFlexibleDate(getMapped(row, 'date'))
          if (!description || !amount || !date) {
            skipped++
            continue
          }
          const rawCategory = getMapped(row, 'category')
          const category = (EXPENSE_CATEGORIES.find((c) => c.toLowerCase() === rawCategory.toLowerCase()) ?? 'Other') as ExpenseCategory

          await addExpense({
            description,
            amount,
            date,
            category,
            gstType: 'gst_inclusive',
            supplier: getMapped(row, 'supplier') || undefined,
          })
        }
        imported++
      } catch {
        skipped++
      }
    }

    setImporting(false)
    setResult({ imported, skipped })
    if (imported > 0) toast.success(`Imported ${imported} ${target}`)
    if (skipped > 0) toast.info(`Skipped ${skipped} row${skipped === 1 ? '' : 's'} — missing or invalid required fields`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import from CSV</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring in historical customers, expenses, or a supplier's product/price list from a CSV export. Map your columns below — every CSV
          export is a bit different, so nothing is assumed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Choose what you're importing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={target}
            onValueChange={(v) => {
              setTarget(v as Target)
              setParsed(null)
              setMapping({})
              setResult(null)
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customers">Customers</SelectItem>
              <SelectItem value="expenses">Expenses</SelectItem>
              <SelectItem value="products">Products & Services</SelectItem>
            </SelectContent>
          </Select>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload />
            {parsed ? 'Choose a different file' : 'Choose CSV file'}
          </Button>
        </CardContent>
      </Card>

      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle>2. Match your columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={hasHeader} onChange={(e) => changeHasHeader(e.target.checked)} className="size-4" />
              First row is a header (column names), not a product
            </label>
            {!hasHeader && target === 'products' && Object.keys(mapping).length > 0 && (
              <p className="text-xs text-success">This looks like a supplier price list — I've matched the columns for you. Check them below.</p>
            )}
            {fields.map((field) => (
              <div key={field.key} className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium">
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </label>
                <Select value={mapping[field.key] ?? ''} onValueChange={(v) => setMapping((prev) => ({ ...prev, [field.key]: v }))}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Don't import" />
                  </SelectTrigger>
                  <SelectContent>
                    {view.headers.map((h, i) => (
                      <SelectItem key={i} value={String(i)}>
                        {h || `Column ${i + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {parsed && previewRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Preview (first {previewRows.length} rows)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {fields.map((f) => (
                    <TableHead key={f.key}>{f.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, i) => (
                  <TableRow key={i}>
                    {fields.map((f) => (
                      <TableCell key={f.key} className="text-sm text-muted-foreground">
                        {getMapped(row, f.key) || '—'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {parsed && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{view.rows.length.toLocaleString()} rows found in this file.</p>
          <Button disabled={importing} onClick={runImport}>
            {importing ? (progress ? `Importing… ${progress.done.toLocaleString()} of ${progress.total.toLocaleString()}` : 'Importing…') : `Import ${view.rows.length.toLocaleString()} rows`}
          </Button>
        </div>
      )}

      {result && (
        <Card>
          <CardContent className="py-4 text-sm">
            <p className="font-medium">Import finished</p>
            <p className="mt-1 text-muted-foreground">
              {result.imported} imported, {result.skipped} skipped.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
