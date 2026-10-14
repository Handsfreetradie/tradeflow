import { useAuth } from '@/lib/auth/AuthProvider'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardGreeting() {
  const { fullName } = useAuth()
  const firstName = fullName?.split(' ')[0] ?? 'there'
  const today = new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your business today.</p>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{today}</span>
      </div>
    </div>
  )
}
