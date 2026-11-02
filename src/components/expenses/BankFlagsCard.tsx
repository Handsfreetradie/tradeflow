import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { dismissBankFlag, listBankFlags, type BankFlag, type BankFlagKind } from '@/lib/api/bankStatement'
import { formatCurrency, formatDate } from '@/lib/utils'

const KIND_LABEL: Record<BankFlagKind, { label: string; variant: 'info' | 'warning' | 'danger' | 'default' }> = {
  missing_expense: { label: 'Not in your expenses', variant: 'info' },
  unsure: { label: 'Business or personal?', variant: 'default' },
  missing_receipt: { label: 'Needs a receipt', variant: 'warning' },
  possible_duplicate: { label: 'Possible double charge', variant: 'danger' },
}

/** Lines from an uploaded bank statement that need the owner's eye. The statement itself is never kept — only these lines. */
export function BankFlagsCard({ refreshKey = 0, showWhenEmpty = false }: { refreshKey?: number; showWhenEmpty?: boolean }) {
  const navigate = useNavigate()
  const [flags, setFlags] = useState<BankFlag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listBankFlags()
      .then(setFlags)
      .catch(() => setFlags([]))
      .finally(() => setLoading(false))
  }, [refreshKey])

  const dismiss = async (id: string) => {
    const previous = flags
    setFlags((prev) => prev.filter((f) => f.id !== id))
    try {
      await dismissBankFlag(id)
    } catch {
      setFlags(previous)
    }
  }

  if (!loading && flags.length === 0 && !showWhenEmpty) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="size-4 text-muted-foreground" />
          Flagged from your bank statement
        </CardTitle>
        <p className="text-sm text-muted-foreground">Charges worth a second look — nothing is added until you say so.</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing flagged right now.</p>
        ) : (
          flags.map((f) => {
            const kind = KIND_LABEL[f.kind]
            const canAdd = f.kind !== 'missing_receipt'
            return (
              <div key={f.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(f.amount)} · {formatDate(f.date)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{f.reason}</p>
                  <Badge variant={kind.variant} className="mt-1.5">
                    {kind.label}
                  </Badge>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {canAdd ? (
                    <Button size="sm" onClick={() => navigate(`/expenses/new?bankFlagId=${f.id}`)}>
                      Add as expense
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => dismiss(f.id)}>
                      Done
                    </Button>
                  )}
                  {canAdd && (
                    <Button variant="ghost" size="icon" onClick={() => dismiss(f.id)} title={f.kind === 'possible_duplicate' ? "It's fine" : 'Not a business cost'}>
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
