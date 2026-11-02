import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, FileUp, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { BankFlagsCard } from '@/components/expenses/BankFlagsCard'
import { extractStatementLines, reviewStatementLines, type ReviewSummary } from '@/lib/api/bankStatement'
import { parseStatementCsv, type StatementLine } from '@/lib/bankStatement'
import { formatCurrency, formatDate, toDateKey } from '@/lib/utils'

const MAX_FILE_BYTES = 12 * 1024 * 1024
const REVIEW_CHUNK = 200

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(new Error("Couldn't read that file"))
    reader.readAsDataURL(file)
  })
}

function presetRanges(): Array<{ label: string; from: string; to: string }> {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const q = Math.floor(m / 3)
  const day = (d: Date) => toDateKey(d)
  const thirtyAgo = new Date(now)
  thirtyAgo.setDate(now.getDate() - 30)
  return [
    { label: 'Last 30 days', from: day(thirtyAgo), to: day(now) },
    { label: 'This month', from: day(new Date(y, m, 1)), to: day(new Date(y, m + 1, 0)) },
    { label: 'Last month', from: day(new Date(y, m - 1, 1)), to: day(new Date(y, m, 0)) },
    { label: 'This quarter', from: day(new Date(y, q * 3, 1)), to: day(new Date(y, q * 3 + 3, 0)) },
    { label: 'Last quarter', from: day(new Date(y, (q - 1) * 3, 1)), to: day(new Date(y, q * 3, 0)) },
  ]
}

export default function BankStatement() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('')
  const [summary, setSummary] = useState<(ReviewSummary & { totalValue: number }) | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  // The payments read from the file, held in memory only until the owner picks a date range and runs the check.
  const [read, setRead] = useState<StatementLine[] | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const inRange = useMemo(() => (read ?? []).filter((l) => (!from || l.date >= from) && (!to || l.date <= to)), [read, from, to])
  const presets = useMemo(() => presetRanges(), [])

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      toast.error('That file is too large (max 12MB)')
      return
    }
    setBusy(true)
    setSummary(null)
    setRead(null)
    try {
      const name = file.name.toLowerCase()
      const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf')
      const isImage = file.type.startsWith('image/')
      let lines: StatementLine[] | null = null

      if (!isPdf && !isImage) {
        setStage('Reading your statement...')
        const text = await file.text()
        lines = parseStatementCsv(text)
        // A layout we can't map with certainty — let the AI read the text instead.
        if (!lines) {
          setStage('Working out the layout...')
          lines = await extractStatementLines({ text })
        }
      } else {
        setStage('Reading your statement...')
        lines = await extractStatementLines({ fileBase64: await readBase64(file), mimeType: isPdf ? 'application/pdf' : file.type })
      }

      if (!lines || lines.length === 0) {
        toast.error("Couldn't find any payments in that file")
        return
      }

      lines.sort((a, b) => a.date.localeCompare(b.date))
      setRead(lines)
      setFrom(lines[0].date)
      setTo(lines[lines.length - 1].date)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't check that statement")
    } finally {
      setBusy(false)
      setStage('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const runCheck = async () => {
    if (inRange.length === 0) return
    setBusy(true)
    setSummary(null)
    try {
      const total: ReviewSummary = { total: 0, matched: 0, personal: 0, flagged: 0, newFlags: 0 }
      for (let i = 0; i < inRange.length; i += REVIEW_CHUNK) {
        setStage(`Checking payments ${Math.min(i + REVIEW_CHUNK, inRange.length)} of ${inRange.length}...`)
        const part = await reviewStatementLines(inRange.slice(i, i + REVIEW_CHUNK))
        total.total += part.total
        total.matched += part.matched
        total.personal += part.personal
        total.flagged += part.flagged
        total.newFlags += part.newFlags
      }
      setSummary({ ...total, totalValue: inRange.reduce((sum, l) => sum + l.amount, 0) })
      setRead(null)
      setRefreshKey((k) => k + 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't check that statement")
    } finally {
      setBusy(false)
      setStage('')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/expenses')} className="-ml-2">
        <ArrowLeft />
        Expenses
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Check a bank statement</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a statement from any bank. TradeFlow compares every payment with the expenses and job costs you've recorded and flags what looks missing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload a statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input ref={fileInputRef} type="file" accept=".csv,.txt,.pdf,image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <Button onClick={() => fileInputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <FileUp />}
            {busy ? stage || 'Working...' : 'Choose CSV, PDF or photo'}
          </Button>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            <span>
              Your statement is read once and thrown away — the file is never saved. Only the payments you need to look at are kept, and personal spending is dropped.
              To read the descriptions, the payment lines are sent to Anthropic's AI.
            </span>
          </p>
        </CardContent>
      </Card>

      {read && (
        <Card>
          <CardHeader>
            <CardTitle>Pick the dates to check</CardTitle>
            <p className="text-sm text-muted-foreground">
              Found {read.length} payments from {formatDate(read[0].date)} to {formatDate(read[read.length - 1].date)}. Narrow it down to a quarter or month if you like.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <Button key={p.label} variant="secondary" size="sm" onClick={() => { setFrom(p.from); setTo(p.to) }} disabled={busy}>
                  {p.label}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => { setFrom(read[0].date); setTo(read[read.length - 1].date) }} disabled={busy}>
                Whole statement
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {inRange.length} payments in range ({formatCurrency(inRange.reduce((sum, l) => sum + l.amount, 0))})
              </p>
              <Button onClick={runCheck} disabled={busy || inRange.length === 0}>
                {busy ? <Loader2 className="animate-spin" /> : null}
                {busy ? stage || 'Checking...' : 'Check these payments'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card>
          <CardContent className="space-y-1 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4 text-success" />
              Checked {summary.total} payments ({formatCurrency(summary.totalValue)})
            </p>
            <p className="text-muted-foreground">
              {summary.matched} already in TradeFlow · {summary.personal} look personal and were dropped · {summary.flagged} need a look
              {summary.flagged > summary.newFlags ? ` (${summary.flagged - summary.newFlags} already flagged before)` : ''}
            </p>
          </CardContent>
        </Card>
      )}

      <BankFlagsCard refreshKey={refreshKey} showWhenEmpty />
    </div>
  )
}
