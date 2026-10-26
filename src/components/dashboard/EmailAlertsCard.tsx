import { useEffect, useState } from 'react'
import { Mail, Reply, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { dismissEmailAlert, EMAIL_ALERT_CATEGORY_LABELS, listEmailAlerts, type EmailAlert } from '@/lib/api/email'
import { formatDate } from '@/lib/utils'
import { ReplyDialog } from './ReplyDialog'

export function EmailAlertsCard() {
  const [alerts, setAlerts] = useState<EmailAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [replyTo, setReplyTo] = useState<EmailAlert | null>(null)

  useEffect(() => {
    listEmailAlerts().then((a) => {
      setAlerts(a)
      setLoading(false)
    })
  }, [])

  const dismiss = async (id: string) => {
    const previous = alerts
    setAlerts((prev) => prev.filter((a) => a.id !== id))
    try {
      await dismissEmailAlert(id)
    } catch {
      setAlerts(previous)
    }
  }

  if (!loading && alerts.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4 text-muted-foreground" />
          Emails needing attention
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{EMAIL_ALERT_CATEGORY_LABELS[a.category]}</span>
                  {a.priority === 'high' && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">Urgent</span>}
                </div>
                <p className="truncate text-sm font-medium">{a.subject || '(no subject)'}</p>
                <p className="truncate text-xs text-muted-foreground">{a.fromAddress}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.aiReason}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDate(a.receivedAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button variant="secondary" size="sm" onClick={() => setReplyTo(a)}>
                  <Reply />
                  Reply
                </Button>
                <Button variant="ghost" size="sm" onClick={() => dismiss(a.id)} aria-label="Dismiss">
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
      <ReplyDialog
        alert={replyTo}
        onOpenChange={(open) => !open && setReplyTo(null)}
        onSent={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
      />
    </Card>
  )
}
