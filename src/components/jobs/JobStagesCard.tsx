import { useState } from 'react'
import { toast } from 'sonner'
import { ListChecks, Plus, Trash2, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useJobsStore } from '@/lib/store/jobs-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Job, JobStage } from '@/lib/demo-data'

function StageNotes({ jobId, stage }: { jobId: string; stage: JobStage }) {
  const { updateStage } = useJobsStore()
  const [value, setValue] = useState(stage.notes)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (value === stage.notes) return
    setSaving(true)
    try {
      await updateStage(stage.id, jobId, { notes: value })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save note')
      setValue(stage.notes)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Input
      value={value}
      disabled={saving}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      placeholder="Notes for this stage..."
      className="h-8 text-xs"
    />
  )
}

export function JobStagesCard({ job }: { job: Job }) {
  const { addStage, toggleStage, deleteStage } = useJobsStore()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [claimAmount, setClaimAmount] = useState('')
  const [busy, setBusy] = useState(false)

  const submitAdd = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      await addStage(job.id, { name: name.trim(), targetDate: targetDate || undefined, claimAmount: claimAmount ? Number(claimAmount) : undefined })
      setName('')
      setTargetDate('')
      setClaimAmount('')
      setAdding(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add stage')
    } finally {
      setBusy(false)
    }
  }

  if (job.stages.length === 0 && !adding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="size-4 text-muted-foreground" />
            Stages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No stages on this job. For multi-visit jobs (e.g. underground → rough-in → fitoff), add stages to track progress and bill by milestone.
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setAdding(true)}>
            <Plus />
            Add stage
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4 text-muted-foreground" />
          Stages
        </CardTitle>
        <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
          <Plus />
          Add stage
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {job.stages.map((stage) => (
          <div key={stage.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start gap-2.5">
              <Checkbox
                checked={stage.status === 'complete'}
                onCheckedChange={(v) =>
                  toggleStage(stage.id, job.id, v === true).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to update'))
                }
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={stage.status === 'complete' ? 'text-sm font-medium line-through text-muted-foreground' : 'text-sm font-medium'}>
                    {stage.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {stage.targetDate && <span>Target {formatDate(stage.targetDate, { day: 'numeric', month: 'short' })}</span>}
                    {stage.claimAmount != null && (
                      <span className="font-medium text-foreground">
                        {formatCurrency(stage.claimAmount)}
                        {stage.claimedInvoiceId && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-success">
                            <Check className="size-3" />
                            claimed
                          </span>
                        )}
                      </span>
                    )}
                    <button
                      onClick={() => deleteStage(stage.id, job.id).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to delete'))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <StageNotes jobId={job.id} stage={stage} />
              </div>
            </div>
          </div>
        ))}

        {adding && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Stage name" className="flex-1" autoFocus />
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-40" />
            <Input type="number" min="0" value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} placeholder="Claim $" className="w-28" />
            <Button size="sm" disabled={busy || !name.trim()} onClick={submitAdd}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
