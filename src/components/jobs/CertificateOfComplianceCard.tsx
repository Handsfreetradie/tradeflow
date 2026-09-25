import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/badge'
import { useJobsStore } from '@/lib/store/jobs-store'
import type { CocStatus, Job } from '@/lib/demo-data'

const statuses: CocStatus[] = ['Not Required', 'Not Started', 'Submitted', 'Issued']

export function CertificateOfComplianceCard({ job }: { job: Job }) {
  const { updateCoc } = useJobsStore()
  const [number, setNumber] = useState(job.cocNumber ?? '')
  const [issuedDate, setIssuedDate] = useState(job.cocIssuedDate ?? '')

  const save = async (patch: { cocStatus?: CocStatus; cocNumber?: string; cocIssuedDate?: string }) => {
    try {
      await updateCoc(job.id, patch)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-muted-foreground" />
          Certificate of Compliance
        </CardTitle>
        <StatusBadge status={job.cocStatus} />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Tracked manually for now — lodge via your state's certification portal (e.g. NSW eCert, WA COES) and record the result here.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={job.cocStatus} onValueChange={(v) => save({ cocStatus: v as CocStatus })}>
              <SelectTrigger className="mt-1 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Certificate #</label>
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              onBlur={() => number !== (job.cocNumber ?? '') && save({ cocNumber: number })}
              placeholder="e.g. CCEW-123456"
              className="mt-1 h-9 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Date issued</label>
            <Input
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              onBlur={() => issuedDate !== (job.cocIssuedDate ?? '') && save({ cocIssuedDate: issuedDate })}
              className="mt-1 h-9 text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
