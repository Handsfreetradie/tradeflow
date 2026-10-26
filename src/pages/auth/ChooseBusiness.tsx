import { Briefcase, HardHat } from 'lucide-react'
import { LogoMark } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth/AuthProvider'
import { useActiveBusiness } from '@/lib/auth/ActiveBusinessProvider'
import { cn } from '@/lib/utils'

export default function ChooseBusiness() {
  const { fullName, signOut } = useAuth()
  const { memberships, lastUsedBusinessId, chooseBusiness } = useActiveBusiness()
  const firstName = fullName?.split(' ')[0]

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 pb-[calc(env(safe-area-inset-bottom)_+_1.5rem)] pt-[calc(env(safe-area-inset-top)_+_1.5rem)]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <LogoMark className="size-11" />
          {memberships.length === 0 ? (
            <>
              <h1 className="text-xl font-semibold tracking-tight">No business yet</h1>
              <p className="text-sm text-muted-foreground">
                This account isn't part of any business. Ask your employer to add you, or sign out and create your own.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold tracking-tight">{firstName ? `Hi ${firstName}, ` : ''}where are you working today?</h1>
              <p className="text-sm text-muted-foreground">Pick a business. You can switch any time.</p>
            </>
          )}
        </div>

        {memberships.length > 0 && (
          <div className="space-y-3">
            {memberships.map((m) => (
              <button
                key={m.businessId}
                onClick={() => chooseBusiness(m.businessId)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-subtle transition-colors hover:border-primary hover:bg-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  m.businessId === lastUsedBusinessId ? 'border-primary/60' : 'border-border'
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {m.role === 'owner' ? <Briefcase className="size-5" /> : <HardHat className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{m.businessName}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {m.role === 'owner' ? 'Your business — owner' : 'Working here as an employee'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        <Button variant="ghost" className="mt-6 w-full text-muted-foreground" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  )
}
