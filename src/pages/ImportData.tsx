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
import type { ExpenseCategory } from '@/lib/demo-data'
import { toDateKey } from '@/lib/utils'

type Target = 'customers' | 'expenses'

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

export default function ImportData() {
  const navigate = useNavigate()
  const { addCustomer } = useCustomersStore()
  const { addExpense } = useExpensesStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [target, setTarget] = useState<Target>('customers')
  const [parsed, setParsed] = useState<ParsedCsv | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  const fields = target === 'customers' ? CUSTOMER_FIELDS : EXPENSE_FIELDS

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
      const guessed: Record<string, string> = {}
      for (const field of fields) {
        const idx = csv.headers.findIndex((h) => h.trim().toLowerCase() === field.label.toLowerCase() || h.trim().toLowerCase() === field.key)
        if (idx !== -1) guessed[field.key] = String(idx)
      }
      setMapping(guessed)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read that file")
    }
  }

  const previewRows = useMemo(() => {
    if (!parsed) return []
    return parsed.rows.slice(0, 5)
  }, [parsed])

  const getMapped = (row: string[], key: string) => {
    const idx = mapping[key]
    if (idx === undefined || idx === '') return ''
    return row[Number(idx)]?.trim() ?? ''
  }

  const runImport = async () => {
    if (!parsed) return
    const missingRequired = fields.some((f) => f.required && !mapping[f.key])
    if (missingRequired) {
      toast.error('Map every required field before importing')
      return
    }

    setImporting(true)
    let imported = 0
    let skipped = 0

    for (const row of parsed.rows) {
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
        } else {
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
            includesGst: true,
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
          Bring in historical customers or expenses from a CSV export (e.g. from Invoice2Go). Map your columns below — every CSV export is a
          bit different, so nothing is assumed.
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
                    {parsed.headers.map((h, i) => (
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
          <p className="text-sm text-muted-foreground">{parsed.rows.length} rows found in this file.</p>
          <Button disabled={importing} onClick={runImport}>
            {importing ? 'Importing…' : `Import ${parsed.rows.length} rows`}
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
