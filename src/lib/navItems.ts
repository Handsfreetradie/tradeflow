import {
  LayoutDashboard,
  Briefcase,
  FileText,
  FileSpreadsheet,
  Users,
  Receipt,
  Car,
  Package,
  ShoppingCart,
  BarChart3,
  Calculator,
  Calendar,
  CalendarDays,
  Phone,
  type LucideIcon,
} from 'lucide-react'

export interface NavDef {
  /** Stable id saved in a person's menu settings — never change one once shipped. */
  key: string
  to: string
  icon: LucideIcon
  label: string
  /** Shorter name for the phone's bottom tabs. */
  shortLabel?: string
  /** Can be moved but never hidden, so nobody can lose the way home. */
  locked?: boolean
}

/** Every owner menu item, in the default order. Settings sits apart at the bottom and isn't customisable. */
export const NAV_ITEMS: NavDef[] = [
  { key: 'dashboard', to: '/', icon: LayoutDashboard, label: 'Dashboard', shortLabel: 'Home', locked: true },
  { key: 'jobs', to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { key: 'invoices', to: '/invoices', icon: FileText, label: 'Invoices' },
  { key: 'quotes', to: '/quotes', icon: FileSpreadsheet, label: 'Quotes' },
  { key: 'customers', to: '/customers', icon: Users, label: 'Customers' },
  { key: 'expenses', to: '/expenses', icon: Receipt, label: 'Expenses' },
  { key: 'trips', to: '/trips', icon: Car, label: 'Kilometre log' },
  { key: 'products', to: '/products', icon: Package, label: 'Products & Services' },
  { key: 'orders', to: '/orders', icon: ShoppingCart, label: 'Stock orders' },
  { key: 'leave', to: '/leave', icon: CalendarDays, label: 'Leave' },
  { key: 'on-call', to: '/on-call', icon: Phone, label: 'On-call roster' },
  { key: 'reports', to: '/reports', icon: BarChart3, label: 'Reports' },
  { key: 'break-even', to: '/break-even', icon: Calculator, label: 'Break-even rate' },
  { key: 'calendar', to: '/calendar', icon: Calendar, label: 'Calendar' },
]
