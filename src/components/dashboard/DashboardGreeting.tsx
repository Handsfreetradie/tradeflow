import { Sun } from 'lucide-react'
import { ownerFirstName } from '@/lib/demo-data'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardGreeting() {
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
          {getGreeting()}, {ownerFirstName} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Here's what's happening with your business today.</p>
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{today}</span>
        <span className="h-4 w-px bg-border" />
        <span className="flex items-center gap-1.5">
          <Sun className="size-4 text-warning" />
          22° Perth
        </span>
      </div>
    </div>
  )
}
