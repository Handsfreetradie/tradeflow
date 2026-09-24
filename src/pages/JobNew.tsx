import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useCustomersStore } from '@/lib/store/customers-store'
import { useTeamStore } from '@/lib/store/team-store'
import type { LineItem, PricingType } from '@/lib/demo-data'
import { formatCurrency } from '@/lib/utils'

let liSeq = 0
const newLineItem = (): LineItem => ({ id: `new-${++liSeq}`, description: '', qty: 1, unitPrice: 0 })

const NEW_CUSTOMER = '__new__'

export default function JobNew() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addJob } = useJobsStore()
  const { customers, addCustomer } = useCustomersStore()
  const { team } = useTeamStore()

  const prefilledCustomer = customers.find((c) => c.id === searchParams.get('customerId'))

  const [title, setTitle] = useState('')
  const [customerId, setCustomerId] = useState(prefilledCustomer?.id ?? '')
  const [newCustomerName, setNewCustomerName] = useState('')
  const [address, setAddress] = useState(prefilledCustomer?.address ?? '')
  const [dueDate, setDueDate] = useState(searchParams.get('dueDate') ?? '')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [pricingType, setPricingType] = useState<PricingType>('Time & Materials')
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [submitting, setSubmitting] = useState(false)

  const customer = customers.find((c) => c.id === customerId)
  const total = lineItems.reduce((sum, li) => sum + li.qty * li.unitPrice, 0)
  const usingNewCustomer = customerId === NEW_CUSTOMER

  const updateLine = (id: string, patch: Partial<LineItem>) =>
    setLineItems((prev) => prev.map((li) => (li.id === id ? { ...li, ...patch } : li)))

  const canSubmit =
    title.trim() &&
    dueDate &&
    (usingNewCustomer ? newCustomerName.trim() : customerId)

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      let resolvedCustomerId = customerId
      if (usingNewCustomer) {
        const created = await addCustomer({ name: newCustomerName.trim(), address: address.trim() })
        resolvedCustomerId = created.id
      }
      const job = await addJob({
        title: title.trim(),
        customerId: resolvedCustomerId,
        customer: usingNewCustomer ? newCustomerName.trim() : customer?.name ?? '',
        address: address.trim() || undefined,
        dueDate,
        pricingType,
        lineItems: lineItems.filter((li) => li.description.trim() && li.unitPrice > 0),
        assigneeIds,
      })
      navigate(`/jobs/${job.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Job</h1>
        <p className="mt-1 text-sm text-muted-foreground">Only a title, customer and due date are required — everything else can be filled in later.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Job title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Switchboard Upgrade" className="mt-1" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Customer</label>
              <Select
                value={customerId}
                onValueChange={(v) => {
                  setCustomerId(v)
                  if (v === NEW_CUSTOMER) {
                    setAddress('')
                    return
                  }
                  const c = customers.find((c) => c.id === v)
                  if (c) setAddress(c.address)
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NEW_CUSTOMER}>+ Add new customer</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {usingNewCustomer && (
                <Input
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="New customer name"
                  className="mt-2"
                />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Due date</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Job address (optional)</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Auto-filled from customer" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Assign to (optional)</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="mt-1 w-full justify-between font-normal">
                    <span className="truncate">
                      {assigneeIds.length === 0
                        ? 'Unassigned'
                        : team
                            .filter((m) => assigneeIds.includes(m.id))
                            .map((m) => m.fullName)
                            .join(', ')}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]" align="start">
                  {team.length === 0 && <p className="px-2 py-1.5 text-xs text-muted-foreground">No team members yet</p>}
                  {team.map((m) => (
                    <DropdownMenuCheckboxItem
                      key={m.id}
                      checked={assigneeIds.includes(m.id)}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(next) =>
                        setAssigneeIds((prev) => (next ? [...prev, m.id] : prev.filter((id) => id !== m.id)))
                      }
                    >
                      {m.fullName}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Pricing type</label>
            <Select value={pricingType} onValueChange={(v) => setPricingType(v as PricingType)}>
              <SelectTrigger className="mt-1 w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Time & Materials">Time & Materials (do and charge)</SelectItem>
                <SelectItem value="Fixed Price">Fixed Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{pricingType === 'Fixed Price' ? 'Scope of work (optional)' : 'Estimated scope (optional)'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            No quoted price needed to create the job — add line items now, or leave it blank and bill it as you go.
          </p>
          {lineItems.map((li) => (
            <div key={li.id} className="flex items-center gap-2">
              <Input
                value={li.description}
                onChange={(e) => updateLine(li.id, { description: e.target.value })}
                placeholder="Description"
                className="flex-1"
              />
              <Input
                type="number"
                min="1"
                value={li.qty}
                onChange={(e) => updateLine(li.id, { qty: Number(e.target.value) || 1 })}
                className="w-16"
              />
              <Input
                type="number"
                min="0"
                value={li.unitPrice || ''}
                onChange={(e) => updateLine(li.id, { unitPrice: Number(e.target.value) || 0 })}
                placeholder="Unit $"
                className="w-28"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLineItems((prev) => prev.filter((x) => x.id !== li.id))}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setLineItems((prev) => [...prev, newLineItem()])}>
            <Plus />
            Add line
          </Button>

          {lineItems.length > 0 && (
            <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">{pricingType === 'Fixed Price' ? 'Quoted value' : 'Estimated value'}</span>
              <span className="text-base font-semibold">{formatCurrency(total)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/jobs')}>
          Cancel
        </Button>
        <Button disabled={!canSubmit || submitting} onClick={submit}>
          {submitting ? 'Creating…' : 'Create job'}
        </Button>
      </div>
    </div>
  )
}
