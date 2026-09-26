import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Receipt, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useExpensesStore } from '@/lib/store/expenses-store'
import { useJobsStore } from '@/lib/store/jobs-store'
import type { ExpenseCategory } from '@/lib/demo-data'
import { toDateKey } from '@/lib/utils'
import { deleteReceipt, scanReceipt, uploadReceipt } from '@/lib/api/receipts'

const categories: ExpenseCategory[] = ['Materials', 'Fuel', 'Tools & Equipment', 'Subcontractor', 'Vehicle', 'Insurance', 'Office', 'Other']
const MAX_RECEIPT_BYTES = 8 * 1024 * 1024

export default function ExpenseNew() {
  const navigate = useNavigate()
  const { addExpense } = useExpensesStore()
  const { jobs } = useJobsStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('Materials')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(toDateKey(new Date()))
  const [includesGst, setIncludesGst] = useState(true)
  const [supplier, setSupplier] = useState('')
  const [jobId, setJobId] = useState<string>('none')
  const [scanning, setScanning] = useState(false)
  const [receiptPath, setReceiptPath] = useState<string | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)

  const canSubmit = description.trim() && Number(amount) > 0

  const handleReceiptSelected = async (file: File | undefined) => {
    if (!file) return
    if (file.size > MAX_RECEIPT_BYTES) {
      toast.error('Receipt photo is too large (max 8MB)')
      return
    }
    setReceiptPreview(URL.createObjectURL(file))
    setScanning(true)
    try {
      const path = await uploadReceipt(file)
      setReceiptPath(path)
      const scanned = await scanReceipt(path)
      if (scanned.supplier) setSupplier(scanned.supplier)
      if (scanned.amount) setAmount(String(scanned.amount))
      if (scanned.date) setDate(scanned.date)
      if (scanned.description) setDescription(scanned.description)
      if (scanned.category) setCategory(scanned.category)
      if (scanned.includesGst !== null) setIncludesGst(scanned.includesGst)
      toast.success('Receipt scanned — check the details below')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read that receipt — fill in the details manually")
    } finally {
      setScanning(false)
    }
  }

  const removeReceipt = () => {
    if (receiptPath) deleteReceipt(receiptPath).catch(() => {})
    setReceiptPath(null)
    setReceiptPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const submit = async () => {
    if (!canSubmit) return
    await addExpense({
      description: description.trim(),
      category,
      amount: Number(amount),
      date,
      includesGst,
      supplier: supplier.trim() || undefined,
      jobId: jobId === 'none' ? undefined : jobId,
      receiptStoragePath: receiptPath ?? undefined,
    })
    navigate('/expenses')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Log Expense</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track a business expense, optionally against a job.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan a receipt</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleReceiptSelected(e.target.files?.[0])}
          />
          {receiptPreview ? (
            <div className="flex items-center gap-3">
              <img src={receiptPreview} alt="Receipt preview" className="h-16 w-16 rounded-lg border border-border object-cover" />
              <div className="flex-1 text-sm">
                {scanning ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Reading receipt...
                  </span>
                ) : (
                  <span className="text-muted-foreground">Details filled in below — check them before saving.</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={removeReceipt} disabled={scanning}>
                <X />
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              <Receipt />
              Take or upload a photo
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Cable & fittings" className="mt-1" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount ($)</label>
              <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">GST</label>
              <Select value={includesGst ? 'yes' : 'no'} onValueChange={(v) => setIncludesGst(v === 'yes')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Includes GST</SelectItem>
                  <SelectItem value="no">No GST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Supplier (optional)</label>
            <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. CMI Electrical Wholesale" className="mt-1" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Link to a job (optional)</label>
            <Select value={jobId} onValueChange={setJobId}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked job</SelectItem>
                {jobs.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.number} — {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/expenses')}>
          Cancel
        </Button>
        <Button disabled={!canSubmit} onClick={submit}>
          Save expense
        </Button>
      </div>
    </div>
  )
}
