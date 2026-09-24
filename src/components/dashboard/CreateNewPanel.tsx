import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { FileText, FileSpreadsheet, Briefcase, UserPlus, ArrowRight } from 'lucide-react'

const items: { icon: LucideIcon; label: string; to: string }[] = [
  { icon: FileText, label: 'Invoice', to: '/invoices/new' },
  { icon: FileSpreadsheet, label: 'Quote', to: '/quotes/new' },
  { icon: Briefcase, label: 'Job', to: '/jobs/new' },
  { icon: UserPlus, label: 'Customer', to: '/customers/new' },
]

export function CreateNewPanel() {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl border border-sidebar-border bg-sidebar p-5 text-white shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold">Create New</p>
          <p className="mt-0.5 text-sm text-sidebar-muted">Get started with what you need.</p>
        </div>
        <ArrowRight className="size-4 text-sidebar-muted" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.to)}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <item.icon className="size-4 text-sidebar-muted" />
              {item.label}
            </span>
            <ArrowRight className="size-3.5 text-sidebar-muted" />
          </button>
        ))}
      </div>
    </div>
  )
}
