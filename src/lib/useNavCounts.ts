import { useJobsStore } from '@/lib/store/jobs-store'
import { useQuotesStore } from '@/lib/store/quotes-store'
import { useInvoicesStore } from '@/lib/store/invoices-store'
import { useLeaveStore } from '@/lib/store/leave-store'
import { useStockStore } from '@/lib/store/stock-store'

/** The little number badges on menu items, keyed by NavDef.key. */
export function useNavCounts(): Record<string, number> {
  const { jobs } = useJobsStore()
  const { quotes } = useQuotesStore()
  const { invoices } = useInvoicesStore()
  const { requests: leaveRequests } = useLeaveStore()
  const { items: orderItems } = useStockStore()

  return {
    jobs: jobs.filter((j) => j.status === 'In Progress' || j.status === 'Scheduled').length,
    invoices: invoices.filter((i) => i.status === 'Sent' || i.status === 'Partial' || i.status === 'Overdue').length,
    quotes: quotes.filter((q) => q.status === 'Draft' || q.status === 'Sent').length,
    orders: orderItems.filter((i) => i.status === 'pending').length,
    leave: leaveRequests.filter((r) => r.status === 'pending').length,
  }
}
