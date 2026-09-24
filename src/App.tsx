import { Route, Routes } from 'react-router-dom'
import { Package } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { PlaceholderPage } from '@/components/layout/PlaceholderPage'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { RequireRole } from '@/components/auth/RequireRole'
import { JobsProvider } from '@/lib/store/jobs-store'
import { CustomersProvider } from '@/lib/store/customers-store'
import { QuotesProvider } from '@/lib/store/quotes-store'
import { InvoicesProvider } from '@/lib/store/invoices-store'
import { ExpensesProvider } from '@/lib/store/expenses-store'
import { TeamProvider } from '@/lib/store/team-store'
import { FieldJobsProvider } from '@/lib/store/field-jobs-store'
import Login from '@/pages/auth/Login'
import Setup from '@/pages/auth/Setup'
import AcceptInvite from '@/pages/auth/AcceptInvite'
import Dashboard from '@/pages/Dashboard'
import JobsList from '@/pages/JobsList'
import JobDetail from '@/pages/JobDetail'
import JobNew from '@/pages/JobNew'
import CustomersList from '@/pages/CustomersList'
import CustomerDetail from '@/pages/CustomerDetail'
import CustomerNew from '@/pages/CustomerNew'
import QuotesList from '@/pages/QuotesList'
import QuoteDetail from '@/pages/QuoteDetail'
import QuoteNew from '@/pages/QuoteNew'
import InvoicesList from '@/pages/InvoicesList'
import InvoiceDetail from '@/pages/InvoiceDetail'
import InvoiceNew from '@/pages/InvoiceNew'
import ExpensesList from '@/pages/ExpensesList'
import ExpenseNew from '@/pages/ExpenseNew'
import CalendarPage from '@/pages/Calendar'
import Reports from '@/pages/Reports'
import Settings from '@/pages/Settings'
import { FieldShell } from '@/components/field/FieldShell'
import FieldToday from '@/pages/field/FieldToday'
import FieldJobs from '@/pages/field/FieldJobs'
import FieldJobDetail from '@/pages/field/FieldJobDetail'

function OwnerApp() {
  return (
    <CustomersProvider>
      <JobsProvider>
        <QuotesProvider>
          <InvoicesProvider>
            <ExpensesProvider>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<Dashboard />} />
                  <Route path="jobs" element={<JobsList />} />
                  <Route path="jobs/new" element={<JobNew />} />
                  <Route path="jobs/:id" element={<JobDetail />} />
                  <Route path="invoices" element={<InvoicesList />} />
                  <Route path="invoices/new" element={<InvoiceNew />} />
                  <Route path="invoices/:id" element={<InvoiceDetail />} />
                  <Route path="quotes" element={<QuotesList />} />
                  <Route path="quotes/new" element={<QuoteNew />} />
                  <Route path="quotes/:id" element={<QuoteDetail />} />
                  <Route path="customers" element={<CustomersList />} />
                  <Route path="customers/new" element={<CustomerNew />} />
                  <Route path="customers/:id" element={<CustomerDetail />} />
                  <Route path="expenses" element={<ExpensesList />} />
                  <Route path="expenses/new" element={<ExpenseNew />} />
                  <Route path="products" element={<PlaceholderPage title="Products & Services" icon={Package} />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="calendar" element={<CalendarPage />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </ExpensesProvider>
          </InvoicesProvider>
        </QuotesProvider>
      </JobsProvider>
    </CustomersProvider>
  )
}

function EmployeeApp() {
  return (
    <FieldJobsProvider>
      <Routes>
        <Route element={<FieldShell />}>
          <Route index element={<FieldToday />} />
          <Route path="jobs" element={<FieldJobs />} />
          <Route path="jobs/:id" element={<FieldJobDetail />} />
        </Route>
      </Routes>
    </FieldJobsProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/setup" element={<Setup />} />
          <Route path="/auth/accept-invite" element={<AcceptInvite />} />
          <Route
            path="/field/*"
            element={
              <RequireRole role="employee">
                <EmployeeApp />
              </RequireRole>
            }
          />
          <Route
            path="/*"
            element={
              <RequireRole role="owner">
                <OwnerApp />
              </RequireRole>
            }
          />
        </Routes>
      </TeamProvider>
    </AuthProvider>
  )
}

export default App
