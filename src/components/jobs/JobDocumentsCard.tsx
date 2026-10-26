import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FileText, Trash2, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { deleteJobDocument, listJobDocuments, openJobDocument, openRoughInPlan, type JobDocument } from '@/lib/api/jobDocuments'
import { formatDate } from '@/lib/utils'

/** Rough-in plans (and any other PDFs) saved to a job. `field` styles it for the employee app. */
export function JobDocumentsCard({ jobId, field = false, canDelete = false }: { jobId: string; field?: boolean; canDelete?: boolean }) {
  const [docs, setDocs] = useState<JobDocument[]>([])
  const [opening, setOpening] = useState(false)

  const refresh = useCallback(() => {
    listJobDocuments(jobId).then(setDocs)
  }, [jobId])

  useEffect(() => {
    refresh()
    // Plans are saved from another tab — pick them up when the person comes back to this one.
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const startPlan = async () => {
    setOpening(true)
    try {
      await openRoughInPlan(jobId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open the rough-in plan")
    } finally {
      setOpening(false)
    }
  }

  const open = async (doc: JobDocument) => {
    try {
      await openJobDocument(doc)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open that file")
    }
  }

  const remove = async (doc: JobDocument) => {
    if (!window.confirm(`Delete "${doc.name}" from this job?`)) return
    try {
      await deleteJobDocument(doc)
      refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete that file")
    }
  }

  const list =
    docs.length === 0 ? (
      <p className="text-sm text-muted-foreground">No rough-in plans saved to this job yet.</p>
    ) : (
      <div className="divide-y divide-border">
        {docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between gap-2 py-2">
            <button type="button" onClick={() => open(d)} className="flex min-w-0 items-center gap-2 text-left">
              <FileText className="size-4 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{d.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {d.uploadedByName ?? 'Someone'} · {formatDate(d.createdAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </span>
              </span>
            </button>
            {canDelete && (
              <button type="button" onClick={() => remove(d)} aria-label={`Delete ${d.name}`} className="shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    )

  const button = (
    <Button size="sm" variant="secondary" disabled={opening} onClick={startPlan}>
      <Zap />
      {opening ? 'Opening…' : 'Rough-in plan'}
    </Button>
  )

  if (field) {
    return (
      <div className="mx-5 rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FileText className="size-3.5" />
            Rough-in plans
          </p>
          {button}
        </div>
        {list}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Rough-in plans</CardTitle>
        {button}
      </CardHeader>
      <CardContent>{list}</CardContent>
    </Card>
  )
}
