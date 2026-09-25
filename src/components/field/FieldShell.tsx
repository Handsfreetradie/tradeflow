import { NavLink, Outlet } from 'react-router-dom'
import { Home, Briefcase, LogOut, WifiOff, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useFieldJobsStore } from '@/lib/store/field-jobs-store'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'

export function FieldShell() {
  const { signOut } = useAuth()
  const { offline, pendingSyncCount } = useFieldJobsStore()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      {offline && (
        <div className="flex items-center justify-center gap-1.5 bg-warning/15 px-3 py-1.5 text-xs font-medium text-warning">
          <WifiOff className="size-3.5" />
          Offline — changes will sync automatically
        </div>
      )}
      {!offline && pendingSyncCount > 0 && (
        <div className="flex items-center justify-center gap-1.5 bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <RefreshCw className="size-3.5 animate-spin" />
          Syncing {pendingSyncCount} change{pendingSyncCount === 1 ? '' : 's'}…
        </div>
      )}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <NavLink
          to="/field"
          end
          className={({ isActive }) =>
            cn('flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium', isActive ? 'text-primary' : 'text-muted-foreground')
          }
        >
          <Home className="size-5" />
          Home
        </NavLink>
        <NavLink
          to="/field/jobs"
          className={({ isActive }) =>
            cn('flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium', isActive ? 'text-primary' : 'text-muted-foreground')
          }
        >
          <Briefcase className="size-5" />
          Jobs
        </NavLink>
        <button
          onClick={() => signOut()}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground"
        >
          <LogOut className="size-5" />
          Sign out
        </button>
      </nav>
      <Toaster />
    </div>
  )
}
