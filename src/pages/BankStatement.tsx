import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, FileUp, Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BankFlagsCard } from '@/components/expenses/BankFlagsCard'
import { extractStatementLines, reviewStatementLines, type ReviewSummary } from '@/lib/api/bankStatement'
import { parseStatementCsv, type StatementLine } from '@/lib/bankStatement'
import { formatCurrency } from '@/lib/utils'

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

export default function BankStatement() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('')
  const [summary, setSummary] = useState<(ReviewSummary & { totalValue: number }) | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      toast.error('That file is too large (max 12MB)')
      return
    }
    setBusy(true)
    setSummary(null)
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
      const total: ReviewSummary = { total: 0, matched: 0, personal: 0, flagged: 0, newFlags: 0 }
      for (let i = 0; i < lines.length; i += REVIEW_CHUNK) {
        setStage(`Checking payments ${Math.min(i + REVIEW_CHUNK, lines.length)} of ${lines.length}...`)
        const part = await reviewStatementLines(lines.slice(i, i + REVIEW_CHUNK))
        total.total += part.total
        total.matched += part.matched
        total.personal += part.personal
        total.flagged += part.flagged
        total.newFlags += part.newFlags
      }
      setSummary({ ...total, totalValue: lines.reduce((sum, l) => sum + l.amount, 0) })
      setRefreshKey((k) => k + 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't check that statement")
    } finally {
      setBusy(false)
      setStage('')
      if (fileInputRef.current) fileInputRef.current.value = ''
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
