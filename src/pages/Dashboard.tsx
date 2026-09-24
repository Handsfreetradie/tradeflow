import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { KpiRow } from '@/components/dashboard/KpiRow'
import { JobOverviewCard } from '@/components/dashboard/JobOverviewCard'
import { CashFlowCard } from '@/components/dashboard/CashFlowCard'
import { InvoiceStatusCard } from '@/components/dashboard/InvoiceStatusCard'
import { RecentInvoicesCard } from '@/components/dashboard/RecentInvoicesCard'
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard'
import { CreateNewPanel } from '@/components/dashboard/CreateNewPanel'
import { UpcomingJobsCard } from '@/components/dashboard/UpcomingJobsCard'
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard'

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
      <DashboardGreeting />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_336px]">
        <div className="space-y-6">
          <KpiRow />
          <JobOverviewCard />
          <div className="flex flex-col gap-6 lg:flex-row">
            <CashFlowCard />
            <InvoiceStatusCard />
          </div>
          <div className="flex flex-col gap-6 lg:flex-row">
            <RecentInvoicesCard />
            <QuickActionsCard />
          </div>
        </div>

        <div className="space-y-6">
          <CreateNewPanel />
          <UpcomingJobsCard />
          <RecentActivityCard />
        </div>
      </div>
    </div>
  )
}
