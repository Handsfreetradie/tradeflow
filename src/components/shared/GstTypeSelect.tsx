import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { GstType } from '@/lib/demo-data'

/** GST type picker. When `allowInclusive` is false (an invoice/quote for a non-GST-registered
 * business), "GST-inclusive" is left out — charging GST without being registered isn't legal. */
export function GstTypeSelect({
  value,
  onChange,
  allowInclusive = true,
}: {
  value: GstType
  onChange: (value: GstType) => void
  allowInclusive?: boolean
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as GstType)}>
      <SelectTrigger className="mt-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allowInclusive && <SelectItem value="gst_inclusive">GST-inclusive (10%)</SelectItem>}
        <SelectItem value="gst_free">GST-free</SelectItem>
        <SelectItem value="not_applicable">Not applicable</SelectItem>
      </SelectContent>
    </Select>
  )
}
