import { Toaster as Sonner } from 'sonner'

function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast rounded-xl border border-border bg-card text-card-foreground shadow-popover',
          title: 'text-sm font-semibold',
          description: 'text-sm text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-secondary text-secondary-foreground',
        },
      }}
    />
  )
}

export { Toaster }
