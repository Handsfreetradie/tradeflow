import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function RecentActivityCard() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Recent Activity</CardTitle>
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all
          <ChevronRight className="size-3.5" />
        </button>
      </CardHeader>
      <CardContent>
        <p className="py-3 text-center text-sm text-muted-foreground">No recent activity yet</p>
      </CardContent>
    </Card>
  )
}
