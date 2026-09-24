import {
  LayoutDashboard,
  Briefcase,
  FileText,
  FileSpreadsheet,
  Users,
  Receipt,
  Package,
  BarChart3,
  Calendar,
  Settings,
  ChevronsUpDown,
  Zap,
} from 'lucide-react'
import { NavItem } from '@/components/ui/nav-item'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { businessName, ownerFirstName } from '@/lib/demo-data'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useQuotesStore } from '@/lib/store/quotes-store'
import { useInvoicesStore } from '@/lib/store/invoices-store'

export function Sidebar() {
  const { jobs } = useJobsStore()
  const { quotes } = useQuotesStore()
  const { invoices } = useInvoicesStore()

  const openJobs = jobs.filter((j) => j.status === 'In Progress' || j.status === 'Scheduled').length
  const unpaidInvoices = invoices.filter((i) => i.status === 'Sent' || i.status === 'Partial' || i.status === 'Overdue').length
  const openQuotes = quotes.filter((q) => q.status === 'Draft' || q.status === 'Sent').length

  const primaryNav = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Briefcase, label: 'Jobs', count: openJobs },
    { to: '/invoices', icon: FileText, label: 'Invoices', count: unpaidInvoices },
    { to: '/quotes', icon: FileSpreadsheet, label: 'Quotes', count: openQuotes },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/products', icon: Package, label: 'Products & Services' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
  ]

  const initials = ownerFirstName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="size-4 text-white" fill="currentColor" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none text-white">TradeFlow</p>
          <p className="mt-1 text-[11px] leading-none text-sidebar-muted">Jobs · Invoices · Growth</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 scrollbar-thin">
        {primaryNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-sidebar-border px-3 py-3">
        <NavItem to="/settings" icon={Settings} label="Settings" />
      </div>

      <button className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3.5 text-left transition-colors hover:bg-white/5">
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/20 text-white">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-none text-white">{ownerFirstName} Dixon</p>
          <p className="mt-1 truncate text-[11px] leading-none text-sidebar-muted">{businessName}</p>
        </div>
        <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-muted" />
      </button>
    </aside>
  )
}
