import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Settings, Menu, SlidersHorizontal, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavPrefs } from '@/lib/store/nav-prefs-store'
import { useNavCounts } from '@/lib/useNavCounts'

const TAB_COUNT = 4

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
  const { visibleItems, openCustomise } = useNavPrefs()
  const counts = useNavCounts()

  // The first few items in the person's own order become the tabs; the rest live under More.
  const tabs = visibleItems.slice(0, TAB_COUNT)
  const moreItems = [...visibleItems.slice(TAB_COUNT), { key: 'settings', to: '/settings', icon: Settings, label: 'Settings' }]

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
                  key={item.key}
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
              <button
                onClick={() => {
                  setMoreOpen(false)
                  openCustomise()
                }}
                className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border p-4 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                <SlidersHorizontal className="size-5" />
                Customise menu
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {tabs.map((tab) => (
          <TabLink key={tab.key} to={tab.to} icon={tab.icon} label={tab.shortLabel ?? tab.label} count={counts[tab.key]} />
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
