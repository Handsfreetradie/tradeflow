import { useNavigate } from 'react-router-dom'
import { Search, Bell, HelpCircle, ChevronDown, AlertTriangle, Eye } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { businessName } from '@/lib/demo-data'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useNotifications } from '@/lib/store/notifications-store'
import { cn } from '@/lib/utils'

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export function Header() {
  const { fullName, signOut } = useAuth()
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const displayName = fullName ?? 'Owner'
  const initials = displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur">
      <div className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search jobs, invoices, customers..."
          className="h-10 w-full rounded-lg border border-input bg-white pl-9 pr-14 text-sm shadow-subtle placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <Bell className="size-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={() => markAllRead()} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">No notifications yet</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={cn('flex items-start gap-2 whitespace-normal py-2', !n.readAt && 'bg-warning/5')}
                    onClick={() => {
                      if (!n.readAt) markRead(n.id)
                      navigate(n.linkTo)
                    }}
                  >
                    {n.type === 'job_blocked' ? (
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    ) : (
                      <Eye className="mt-0.5 size-3.5 shrink-0 text-primary" />
                    )}
                    <span className="min-w-0">
                      <span className="block text-xs font-medium">{n.title}</span>
                      <span className="block text-xs text-muted-foreground">{n.message}</span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
                    </span>
                    {!n.readAt && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />}
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
              <HelpCircle className="size-[18px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Help & support</TooltipContent>
        </Tooltip>

        <div className="mx-2 h-6 w-px bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="mt-1 text-xs leading-none text-muted-foreground">{businessName}</p>
            </div>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
