import { NavLink, Outlet } from 'react-router-dom'
import { Home, Briefcase, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthProvider'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/toaster'

export function FieldShell() {
  const { signOut } = useAuth()

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
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
