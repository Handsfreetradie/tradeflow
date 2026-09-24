import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function NavItem({
  to,
  icon: Icon,
  label,
  count,
}: {
  to: string
  icon: LucideIcon
  label: string
  count?: number
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-white/10 text-white'
            : 'text-sidebar-muted hover:bg-white/5 hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('size-[18px] shrink-0', isActive ? 'text-white' : 'text-sidebar-muted group-hover:text-white')} />
          <span className="flex-1 truncate">{label}</span>
          {typeof count === 'number' && count > 0 && (
            <span
              className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                isActive ? 'bg-primary text-white' : 'bg-white/10 text-sidebar-muted group-hover:text-white'
              )}
            >
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
