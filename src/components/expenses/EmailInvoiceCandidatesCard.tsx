import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { dismissEmailInvoiceCandidate, listEmailInvoiceCandidates, type EmailInvoiceCandidate } from '@/lib/api/emailInvoices'
import { formatCurrency, formatDate } from '@/lib/utils'

export function EmailInvoiceCandidatesCard() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState<EmailInvoiceCandidate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listEmailInvoiceCandidates()
      .then(setCandidates)
      .finally(() => setLoading(false))
  }, [])

  const dismiss = async (id: string) => {
    const previous = candidates
    setCandidates((prev) => prev.filter((c) => c.id !== id))
    try {
      await dismissEmailInvoiceCandidate(id)
    } catch {
      setCandidates(previous)
    }
  }

  if (!loading && candidates.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" />
          Found in your inbox
        </CardTitle>
        <p className="text-sm text-muted-foreground">Supplier invoices spotted in your connected inbox — review before adding.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          candidates.map((c) => (
            <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{c.supplier ?? c.subject}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.amount != null ? formatCurrency(c.amount) : 'Amount unclear'} · {c.date ? formatDate(c.date) : formatDate(c.receivedAt)}
                </p>
                {c.description && <p className="mt-1 truncate text-xs text-muted-foreground">{c.description}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" onClick={() => navigate(`/expenses/new?emailCandidateId=${c.id}`)}>
                  Add as expense
                </Button>
                <Button variant="ghost" size="icon" onClick={() => dismiss(c.id)} title="Dismiss">
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
