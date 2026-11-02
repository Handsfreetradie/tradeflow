import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useNavPrefs } from '@/lib/store/nav-prefs-store'
import { NAV_ITEMS } from '@/lib/navItems'

/** Tick to show, drag (or use the arrows) to reorder. Saved against the person's login, so it follows them between devices. */
export function CustomiseMenuDialog() {
  const { allItems, isHidden, save, reset, customiseOpen, closeCustomise } = useNavPrefs()
  const [order, setOrder] = useState<string[]>([])
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!customiseOpen) return
    setOrder(allItems.map((i) => i.key))
    setHidden(new Set(allItems.filter((i) => isHidden(i.key)).map((i) => i.key)))
  }, [customiseOpen, allItems, isHidden])

  const byKey = new Map(NAV_ITEMS.map((i) => [i.key, i]))

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length || from === to) return
    setOrder((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const toggle = (key: string, shown: boolean) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (shown) next.delete(key)
      else next.add(key)
      return next
    })

  const run = async (action: () => Promise<void>, done: string) => {
    setSaving(true)
    try {
      await action()
      toast.success(done)
      closeCustomise()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save your menu")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={customiseOpen} onOpenChange={(o) => !o && closeCustomise()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customise your menu</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tick what you want to see and drag to reorder (or use the arrows). On a phone, the first four become your bottom tabs and the rest go under More.
        </p>
        <ul className="space-y-1.5">
          {order.map((key, index) => {
            const item = byKey.get(key)
            if (!item) return null
            const shown = !hidden.has(key)
            return (
              <li
                key={key}
                draggable
                onDragStart={() => setDragKey(key)}
                onDragEnd={() => setDragKey(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragKey) move(order.indexOf(dragKey), index)
                  setDragKey(null)
                }}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-2 py-1.5"
                style={{ opacity: dragKey === key ? 0.5 : 1 }}
              >
                <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
                <Checkbox
                  checked={shown}
                  disabled={item.locked}
                  onCheckedChange={(v) => toggle(key, v === true)}
                  aria-label={`Show ${item.label}`}
                />
                <item.icon className="size-4 shrink-0 text-muted-foreground" />
                <span className={`flex-1 truncate text-sm ${shown ? '' : 'text-muted-foreground line-through'}`}>{item.label}</span>
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                  aria-label={`Move ${item.label} up`}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === order.length - 1}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                  aria-label={`Move ${item.label} down`}
                >
                  <ArrowDown className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" disabled={saving} onClick={() => run(reset, 'Menu reset to the default')}>
            Reset to default
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeCustomise}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={() => run(() => save(order, [...hidden]), 'Menu saved')}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
