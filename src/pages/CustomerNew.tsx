import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useCustomersStore } from '@/lib/store/customers-store'

export default function CustomerNew() {
  const navigate = useNavigate()
  const { addCustomer } = useCustomersStore()

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const canSubmit = name.trim().length > 0

  const submit = async () => {
    if (!canSubmit) return
    const customer = await addCustomer({
      name: name.trim(),
      contact: contact.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
    })
    navigate(`/customers/${customer.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft />
        Back
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Customer</h1>
        <p className="mt-1 text-sm text-muted-foreground">Save their details to start creating jobs, quotes and invoices for them.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Business / property name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Smith Residence" className="mt-1" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Contact person</label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g. John Smith" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04XX XXX XXX" className="mt-1" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, suburb, state, postcode" className="mt-1" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/customers')}>
          Cancel
        </Button>
        <Button disabled={!canSubmit} onClick={submit}>
          Save customer
        </Button>
      </div>
    </div>
  )
}
