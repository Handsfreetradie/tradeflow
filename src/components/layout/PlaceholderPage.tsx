import { useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowLeft, Construction } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export function PlaceholderPage({
  title,
  description,
  icon = Construction,
}: {
  title: string
  description?: string
  icon?: LucideIcon
}) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2">
        <ArrowLeft />
        Back
      </Button>
      <Card>
        <EmptyState
          icon={icon}
          title={title}
          description={description ?? "This module is coming in a later build stage — the navigation is wired up and ready for it."}
        />
      </Card>
    </div>
  )
}
