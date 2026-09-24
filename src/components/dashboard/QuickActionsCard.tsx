import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Send, FileSpreadsheet, UserPlus, Receipt, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const actions: { icon: LucideIcon; label: string; description: string; to: string }[] = [
  { icon: Send, label: 'Send new invoice', description: 'Create and email an invoice', to: '/invoices/new' },
  { icon: FileSpreadsheet, label: 'Create quote', description: 'Build a quote in minutes', to: '/quotes/new' },
  { icon: UserPlus, label: 'Add a customer', description: 'Save customer details', to: '/customers/new' },
  { icon: Receipt, label: 'Log an expense', description: 'Track business expenses', to: '/expenses/new' },
]

export function QuickActionsCard() {
  const navigate = useNavigate()

  return (
    <Card className="w-full lg:w-80 lg:shrink-0">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.to)}
            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-secondary"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <action.icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{action.label}</p>
              <p className="truncate text-xs text-muted-foreground">{action.description}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </CardContent>
    </Card>
  )
}
