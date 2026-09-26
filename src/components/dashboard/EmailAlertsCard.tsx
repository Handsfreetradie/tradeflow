import { useEffect, useState } from 'react'
import { Mail, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { dismissEmailAlert, listEmailAlerts, type EmailAlert } from '@/lib/api/email'
import { formatDate } from '@/lib/utils'

export function EmailAlertsCard() {
  const [alerts, setAlerts] = useState<EmailAlert[]>([])
  const [loading, setLoading] = useState(true)

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
          Emails needing a reply
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.subject || '(no subject)'}</p>
                <p className="truncate text-xs text-muted-foreground">{a.fromAddress}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.aiReason}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDate(a.receivedAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => dismiss(a.id)}>
                <X className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
