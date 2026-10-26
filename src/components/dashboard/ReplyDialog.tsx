import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { EmailAlert } from '@/lib/api/email'
import { draftReply, getOriginalEmail, sendReply, type OriginalEmail } from '@/lib/api/emailReply'

interface ReplyDialogProps {
  alert: EmailAlert | null
  onOpenChange: (open: boolean) => void
  onSent: (alertId: string) => void
}

export function ReplyDialog({ alert, onOpenChange, onSent }: ReplyDialogProps) {
  const [original, setOriginal] = useState<OriginalEmail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)

  const messageId = alert?.messageId
  useEffect(() => {
    if (!messageId) return
    let cancelled = false
    setOriginal(null)
    setLoadError(null)
    setReply('')
    getOriginalEmail(messageId)
      .then((o) => !cancelled && setOriginal(o))
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : "Couldn't open that email"))
    return () => {
      cancelled = true
    }
  }, [messageId])

  const draft = async () => {
    if (!alert) return
    if (reply.trim() && !window.confirm('Replace what you have typed with an AI draft?')) return
    setDrafting(true)
    try {
      setReply(await draftReply(alert.messageId))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't write a draft")
    } finally {
      setDrafting(false)
    }
  }

  const send = async () => {
    if (!alert || !reply.trim()) return
    setSending(true)
    try {
      const { to } = await sendReply(alert.messageId, reply.trim())
      toast.success(`Reply sent to ${to}`)
      onSent(alert.id)
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send the reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={!!alert} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reply</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-secondary/30 p-3">
            {loadError ? (
              <p className="text-sm text-destructive">{loadError}</p>
            ) : !original ? (
              <p className="text-sm text-muted-foreground">Opening the email…</p>
            ) : (
              <>
                <p className="text-sm font-medium">{original.subject || '(no subject)'}</p>
                <p className="text-xs text-muted-foreground">{original.from}</p>
                <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-foreground/90">{original.body || '(no text in this email)'}</p>
                {original.truncated && <p className="mt-1 text-[11px] text-muted-foreground">Long email — open it in Gmail to see the rest.</p>}
              </>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Your reply</label>
              <Button type="button" variant="secondary" size="sm" disabled={!original || drafting} onClick={draft}>
                <Sparkles />
                {drafting ? 'Writing…' : 'Draft with AI'}
              </Button>
            </div>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={9}
              placeholder="Type your reply, or tap Draft with AI and edit it."
              className="mt-1 w-full resize-y rounded-lg border border-input bg-white p-2.5 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              AI drafts can be wrong — read it before sending, and fill in anything in [square brackets]. It goes from your Gmail to the person who sent the email.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!original || !reply.trim() || sending} onClick={send}>
            <Send />
            {sending ? 'Sending…' : 'Send reply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
