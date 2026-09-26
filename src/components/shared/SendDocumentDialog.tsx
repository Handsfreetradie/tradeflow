import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getEmailConnectionStatus } from '@/lib/api/email'
import { sendDocumentEmail } from '@/lib/api/email'
import { elementToPdfBase64 } from '@/lib/pdf'

interface SendDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  to: string
  fromName: string
  defaultSubject: string
  defaultMessage: string
  mailtoFallbackUrl: string
  filename: string
  documentPreview: ReactNode
  onSent: () => void | Promise<void>
}

export function SendDocumentDialog({
  open,
  onOpenChange,
  to,
  fromName,
  defaultSubject,
  defaultMessage,
  mailtoFallbackUrl,
  filename,
  documentPreview,
  onSent,
}: SendDocumentDialogProps) {
  const [toValue, setToValue] = useState(to)
  const [subject, setSubject] = useState(defaultSubject)
  const [message, setMessage] = useState(defaultMessage)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [sending, setSending] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setToValue(to)
    setSubject(defaultSubject)
    setMessage(defaultMessage)
    getEmailConnectionStatus().then((status) => setConnected(status.connected))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const send = async () => {
    if (!toValue.trim()) {
      toast.error("Enter the customer's email address")
      return
    }
    if (!previewRef.current) return
    setSending(true)
    try {
      const pdfBase64 = await elementToPdfBase64(previewRef.current)
      await sendDocumentEmail({ to: toValue.trim(), fromName, subject, message, pdfBase64, filename })
      toast.success(`Emailed to ${toValue.trim()}`)
      onOpenChange(false)
      await onSent()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const sendViaMailApp = () => {
    window.location.href = mailtoFallbackUrl
    onOpenChange(false)
    onSent()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview & send</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input value={toValue} onChange={(e) => setToValue(e.target.value)} placeholder="customer@example.com" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Subject</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="mt-1 w-full resize-none rounded-lg border border-input bg-white p-2.5 text-sm shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {connected === false && (
            <p className="flex items-center gap-1.5 rounded-lg bg-secondary/60 p-2.5 text-xs text-muted-foreground">
              <Mail className="size-3.5 shrink-0" />
              Connect Gmail in Settings to send with the PDF attached — for now, use "Open in email app" below.
            </p>
          )}

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Preview (attached as a PDF)</p>
            <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-border bg-secondary/30 p-3">
              <div ref={previewRef} className="mx-auto w-[560px] origin-top bg-white">
                {documentPreview}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" size="sm" onClick={sendViaMailApp} className="text-muted-foreground">
            Open in email app instead
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={sending || connected === false} onClick={send}>
              <Send />
              {sending ? 'Sending…' : 'Send email'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
