import { Settings, ChevronsUpDown, ArrowLeftRight, SlidersHorizontal } from 'lucide-react'
import { NavItem } from '@/components/ui/nav-item'
import { LogoMark } from '@/components/shared/Logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'
import { useBusinessSettings } from '@/lib/store/business-settings-store'
import { useNavPrefs } from '@/lib/store/nav-prefs-store'
import { useNavCounts } from '@/lib/useNavCounts'

export function Sidebar() {
  const { fullName, signOut } = useAuth()
  const { settings } = useBusinessSettings()
  const { memberships, openChooser } = useActiveBusiness()
  const { visibleItems, openCustomise } = useNavPrefs()
  const counts = useNavCounts()

  const displayName = fullName ?? 'Owner'
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-sidebar lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <LogoMark className="size-8" />
        <div>
          <p className="text-sm font-semibold leading-none text-white">TradeFlow</p>
          <p className="mt-1 text-[11px] leading-none text-sidebar-muted">Jobs · Invoices · Growth</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 scrollbar-thin">
        {visibleItems.map((item) => (
          <NavItem key={item.key} to={item.to} icon={item.icon} label={item.label} count={counts[item.key]} />
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-sidebar-border px-3 py-3">
        <NavItem to="/settings" icon={Settings} label="Settings" />
        <button
          onClick={openCustomise}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-white/5 hover:text-white"
        >
          <SlidersHorizontal className="size-[18px] shrink-0" />
          Customise menu
        </button>
      </div>

      {memberships.length > 1 && (
        <button
          onClick={openChooser}
          className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3 text-left text-sm text-sidebar-muted transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeftRight className="size-4" />
          Switch business
        </button>
      )}

      <button
        onClick={() => signOut()}
        title="Sign out"
        className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3.5 text-left transition-colors hover:bg-white/5"
      >
        <Avatar className="size-8">
          <AvatarFallback className="bg-primary/20 text-white">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-none text-white">{displayName}</p>
          <p className="mt-1 truncate text-[11px] leading-none text-sidebar-muted">{settings.businessName}</p>
        </div>
        <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-muted" />
      </button>
    </aside>
  )
}
