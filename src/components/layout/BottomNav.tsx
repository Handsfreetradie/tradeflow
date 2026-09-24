import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
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
  Menu,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useJobsStore } from '@/lib/store/jobs-store'
import { useQuotesStore } from '@/lib/store/quotes-store'
import { useInvoicesStore } from '@/lib/store/invoices-store'

const primaryTabs: { to: string; icon: LucideIcon; label: string }[] = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/quotes', icon: FileSpreadsheet, label: 'Quotes' },
]

const moreItems: { to: string; icon: LucideIcon; label: string }[] = [
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/products', icon: Package, label: 'Products & Services' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function TabLink({ to, icon: Icon, label, count }: { to: string; icon: LucideIcon; label: string; count?: number }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            <Icon className={cn('size-5', isActive && 'text-primary')} />
            {typeof count === 'number' && count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-semibold text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </div>
          {label}
        </>
      )}
    </NavLink>
  )
}

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()
  const { jobs } = useJobsStore()
  const { quotes } = useQuotesStore()
  const { invoices } = useInvoicesStore()

  const openJobs = jobs.filter((j) => j.status === 'In Progress' || j.status === 'Scheduled').length
  const unpaidInvoices = invoices.filter((i) => i.status === 'Sent' || i.status === 'Partial' || i.status === 'Overdue').length
  const openQuotes = quotes.filter((q) => q.status === 'Draft' || q.status === 'Sent').length

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" onClick={() => setMoreOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-popover">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-semibold">More</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => (
                <button
                  key={item.to}
                  onClick={() => {
                    setMoreOpen(false)
                    navigate(item.to)
                  }}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-center text-xs font-medium transition-colors hover:bg-secondary"
                >
                  <item.icon className="size-5 text-muted-foreground" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {primaryTabs.map((tab) => (
          <TabLink
            key={tab.to}
            {...tab}
            count={tab.to === '/jobs' ? openJobs : tab.to === '/invoices' ? unpaidInvoices : tab.to === '/quotes' ? openQuotes : undefined}
          />
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-muted-foreground"
        >
          <Menu className="size-5" />
          More
        </button>
      </nav>
    </>
  )
}
