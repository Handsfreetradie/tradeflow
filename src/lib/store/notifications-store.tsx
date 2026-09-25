import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  linkTo: string
  createdAt: string
  readAt: string | null
}

interface NotificationsContextValue {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

type NotificationRow = {
  id: string
  type: string
  job_id: string | null
  invoice_id: string | null
  quote_id: string | null
  leave_request_id: string | null
  message: string
  created_at: string
  read_at: string | null
  job: { number: string; title: string } | null
  invoice: { number: string } | null
  quote: { number: string } | null
}

function fromRow(n: NotificationRow): Notification {
  const base = { id: n.id, type: n.type, message: n.message, createdAt: n.created_at, readAt: n.read_at }
  if (n.job_id) return { ...base, title: `${n.job?.number ?? ''} — ${n.job?.title ?? ''}`, linkTo: `/jobs/${n.job_id}` }
  if (n.invoice_id) return { ...base, title: n.invoice?.number ?? '', linkTo: `/invoices/${n.invoice_id}` }
  if (n.leave_request_id) return { ...base, title: 'Leave request', linkTo: '/leave' }
  return { ...base, title: n.quote?.number ?? '', linkTo: `/quotes/${n.quote_id}` }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('notifications')
      .select(
        'id, type, job_id, invoice_id, quote_id, leave_request_id, message, created_at, read_at, job:jobs(number, title), invoice:invoices(number), quote:quotes(number)'
      )
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) setNotifications((data as unknown as NotificationRow[]).map(fromRow))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const markRead = useCallback(async (id: string) => {
    const readAt = new Date().toISOString()
    const { error } = await supabase.from('notifications').update({ read_at: readAt }).eq('id', id)
    if (error) throw new Error(error.message)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt } : n)))
  }, [])

  const markAllRead = useCallback(async () => {
    const readAt = new Date().toISOString()
    const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id)
    if (unreadIds.length === 0) return
    const { error } = await supabase.from('notifications').update({ read_at: readAt }).in('id', unreadIds)
    if (error) throw new Error(error.message)
    setNotifications((prev) => prev.map((n) => (unreadIds.includes(n.id) ? { ...n, readAt } : n)))
  }, [notifications])

  const unreadCount = notifications.filter((n) => !n.readAt).length

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, markRead, markAllRead, refresh }),
    [notifications, unreadCount, loading, markRead, markAllRead, refresh]
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
