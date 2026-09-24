# CLAUDE.md — TradeFlow

## About the Developer
- Kyle, based in Perth, Western Australia. Electrician by trade, beginner at software dev.
- Explain things plainly, casual tone, practical analogies over jargon.

## About This Project
TradeFlow — a premium invoicing and job-management SaaS for Australian trade
businesses (currently for **Dixon Electrical**, Kyle's own business). Scope:
Jobs, Customers, Quotes, Invoices, Payments, Expenses, Products & Services,
Calendar, Reports — an all-in-one competitor to Xero, Invoice2go, ServiceM8.
Should feel like a company invested millions into it, not a prototype.

Full staged build plan (Stages 0–9) originally came from
`~/Downloads/tradeflow-claude-code-build-plan.md`. Stage 1 (design system,
app shell, dashboard) is done — see "Build status" below.

**Stack:** Vite + React 19 + TypeScript, Tailwind CSS + shadcn/ui-style
components (Radix primitives), React Router, Recharts, Sonner. Same stack
family as Kyle's other project (StandAid) for consistency, but this is a
fully separate app/repo/product.

**Design reference:** `/design-reference/tradeflow-dashboard.png` — the
primary visual reference for every stage. Don't ask Kyle to re-describe it.

## Design Direction (applies to every stage)
- Premium, modern, clean, spacious, extremely polished. Desktop-first, fully responsive.
- Deep navy sidebar (`bg-sidebar`), white/very light grey main workspace (`bg-background`).
- Colour roles (all as CSS variables in `src/index.css`, consumed via Tailwind tokens in `tailwind.config.js`):
  - `primary` (blue) = primary actions
  - `success` (green) = paid / completed / active
  - `warning` (orange) = overdue / attention
  - `destructive` (red) = cancelled / danger
  - `purple` = selected / on-hold secondary state
- Every colour and spacing value goes through the shared tokens — never hardcode a hex per component.
- Tasteful micro-interactions only (hover, toasts, skeleton loading) — fast and expensive-feeling, not busy.

## Architecture Rules
- Real component architecture: `src/components/ui/*` = design-system primitives (Button, Card, Badge, Table, Dialog, DropdownMenu, Tabs, Tooltip, Avatar, Select, Input, Skeleton, EmptyState, ConfirmDialog, NavItem, Toaster). Reuse these — never invent one-off styled elements in a page.
- `src/components/layout/*` = AppShell, Sidebar, Header, PlaceholderPage.
- `src/components/dashboard/*` = dashboard-specific composed components.
- `src/lib/demo-data.ts` = all seed demo data, typed (jobs, customers, quotes, invoices). Keep the data layer separate from components so it's a clean swap to a real backend later.
- `src/lib/store/jobs-store.tsx` = `JobsProvider` + `useJobsStore()` — in-memory React context wrapping the jobs array (seeded from `demo-data.ts`), giving `addJob`/`updateJobStatus`/`addNote`/`addCost`. This is the pattern for live-editable data until there's a real backend: seed data stays in `demo-data.ts`, mutable state lives in a store like this, components read via the hook — never straight from the static array once a module needs editing.
- `src/lib/store/customers-store.tsx` = same pattern for customers (`addCustomer`, `updateNotes`).
- `src/lib/store/quotes-store.tsx` = same pattern for quotes (`addQuote`, `updateStatus`, `linkJob`).
- `src/lib/store/invoices-store.tsx` = same pattern for invoices (`addInvoice`, `markSent`, `recordPayment`). Exports `invoiceTotal(invoice)` — always use this instead of reading `invoice.amount` directly, since `amount` is the ex-GST subtotal (same convention as `Job.value` and `Quote.amount`) and every display needs the GST-inclusive total.
- `src/lib/store/expenses-store.tsx` = same pattern for expenses (`addExpense`).
- When a job is created from an accepted quote (`QuoteDetail`'s "Convert to job"), the link must be set on **both** sides: `Job.quoteId` (via `addJob`'s `quoteId` param) and `Quote.jobId` (via `linkJob`). Missing either one breaks the workflow stepper on one side — this was a real bug caught during Stage 4, fixed by adding `quoteId` to `NewJobInput`.
- **Money is stored in dollars as JS numbers, never assume exact float equality.** `7200 * 1.1 !== 7920` in floating point. `invoices-store.tsx`'s `statusFromPayments` rounds to cents (`Math.round(value * 100)`) before comparing paid vs total — this was a real bug caught during Stage 5 where a fully-paid invoice stayed stuck on "Partial" because the raw float comparison never resolved true. Any new money comparison (not just display formatting) needs the same cents-rounding treatment.
- Invoices don't store a job link back on `Job` — `JobWorkflow` derives it by scanning `useInvoicesStore().invoices` for `invoice.jobId === job.id`, rather than maintaining a mirrored `Job.invoiceId` field that could drift out of sync. Follow this pattern (derive, don't mirror) for any future one-to-many link from a job.
- `src/lib/utils.ts` = `cn()`, `formatCurrency()`, `formatDate()`, `toDateKey()` helpers.
- **Never serialize a "today" Date with `date.toISOString().slice(0, 10)`.** It converts to UTC first, which lags a full calendar day behind local time during early-morning hours in every AU timezone (e.g. 6am AEST is still "yesterday" in UTC) — this was a real bug caught during the Calendar build, where "today" was highlighted correctly but the day-agenda panel showed yesterday's date and jobs. Use `toDateKey(date)` from `utils.ts` instead (local `getFullYear`/`getMonth`/`getDate`), everywhere a `YYYY-MM-DD` key is generated from `new Date()`. Parsing a stored key back with `new Date(dateString)` for *display* via `formatDate`/`toLocaleDateString` is fine and doesn't need this — only the Date→key direction was ever buggy.
- `src/lib/assigneeColors.ts` = `assigneeColor(name)` / `initials(name)` — deterministic (hash-based) colour-coding per team member, used on the Calendar and Job Detail's assignee selector. Reuse this for any other per-employee UI rather than inventing a new palette.
- `src/components/shared/LineItemsTable.tsx` = reusable line-items table with subtotal/GST/total — built for Jobs, reuse as-is for Quotes and Invoices in their stages rather than rebuilding.
- Buttons/nav must always go somewhere real — use `PlaceholderPage` for modules not built yet, never a dead `#` link or no-op.
- Path alias `@/*` → `src/*`.
- **No backend yet** — everything is in-memory (React state) or static demo data. Nothing persists across a page reload. This is fine for building out the UI stage by stage; flag to Kyle before adding anything that assumes persistence, auth, or a database.

## Job Costing (added during Stage 2, not in the original 9-stage plan)
Kyle wants to see how a job is tracking against its quoted price (or, for
time & materials jobs, against the estimate) — not just invoicing after the
fact. Implemented in Stage 2:
- `Job.pricingType`: `'Fixed Price' | 'Time & Materials'`.
- `Job.costs: JobCost[]` — logged costs (materials/labour/subcontractor/other), each with an optional `supplier` and `poNumber` (the job number, e.g. `#J-1024`).
- `JobCostingCard` (`src/components/jobs/JobCostingCard.tsx`) shows quoted/estimated value vs costs-so-far vs margin, with a manual "Log cost" dialog.
- The `poNumber` field on `JobCost` is there deliberately — it's the hook for the future supplier-invoice-matching feature below. Don't remove it even though nothing auto-populates it yet.

## Roadmap — not yet started, needs its own planning session
- **Auto supplier-invoice pickup via email → Expenses.** Kyle wants a supplier's emailed invoice to land automatically in Expenses (and, later, auto-match to a job via a PO/job number the supplier references). This is NOT a simple stage add-on: it needs a real backend, an inbound email pipeline (e.g. an inbound-parse webhook or a connected mailbox), and almost certainly an LLM/OCR step to extract line items from unstructured invoice emails/PDFs — plus file storage for attachments and probably per-extraction API cost. Don't build this incrementally inside another stage; it needs its own scoping conversation (email provider, cost approval) before writing code. The backend work below (Supabase) makes this easier later, but doesn't include it.

## Employee Access (decided 2026-09-23, in progress)
Kyle wants ServiceM8-style crew access: employees log in, see their own jobs for the day, and can update job status/notes/photos. Decisions made:
- **Scope:** restricted crew view — employees see only their assigned jobs. No pricing, costing/margins, other customers' data, quotes, invoices, or reports. Owner (Kyle) sees everything.
- **Login:** Kyle creates employee logins directly (name + email + password) from Settings — no email-invite flow needed for v1.
- **This requires a real backend** — the in-memory stores (`jobs-store.tsx`, `customers-store.tsx`, `quotes-store.tsx`) only work for a single browser session; two people can't share data without a real database. Supabase is the natural choice here (same as Kyle's other project, StandAid; has auth + Postgres + RLS + storage for job photos in one place). This is a genuinely large step — it turns every existing store from in-memory demo state into persisted, multi-user, permission-checked data.
- **Blocked (2026-09-23):** `create_project` for a new "tradeflow" Supabase project in the `Standaid` org (`pxbipqzcgnhndbcclpcu`) came back `declined` with no error detail, twice — even after Kyle explicitly approved it. The org already has 2 projects (`StandAid Website`, `StandAid`), and Supabase free orgs are typically capped at 2 active free projects, so this is almost certainly a plan/billing limit, not a code issue. Kyle is checking supabase.com/dashboard directly to confirm the real reason before we proceed (paid plan upgrade vs. a new separate org vs. something else). **Don't retry `create_project` blindly** — get the actual reason from Kyle first.
- **Interim groundwork (2026-09-24, frontend-only, no backend needed):** since Kyle asked for calendar drag-and-drop + per-employee colour-coding before the Supabase work landed, added `Job.assignedTo: string` and `demo-data.ts`'s `teamMembers` (currently `['Kyle Dixon', 'Jake Mercer', 'Sam Osei']` — **placeholder names, not real accounts**). This is temporary scaffolding: when real employee accounts exist, replace `teamMembers` with a live query against the employees table and `Job.assignedTo` with a real employee ID/FK, and re-point `assigneeColor()` accordingly. Don't mistake `teamMembers` for actual login-capable users — no auth is wired to them.
- **On-site check-in / job timer (2026-09-24, frontend-only, ServiceM8-style):** Kyle explicitly wants this to work like ServiceM8's job timer — press **Start Job**, it tracks elapsed time until finished, can be paused/resumed across multiple site visits, all accumulating into one total. Implemented: `Job.checkIns: JobCheckIn[]` (`id`, `employeeName`, `checkIn`/`checkOut` as ISO timestamps — deliberately **not** `toISOString().slice(0,10)`-style date keys, see the timezone note above, since these need full instants for duration math, not calendar-day buckets), `jobs-store.tsx`'s `startJob`/`finishJob` (starting a `Scheduled` job auto-moves it to `In Progress`; finishing does *not* auto-complete the job — that's still an explicit status change), and `JobCheckInCard` (`src/components/jobs/JobCheckInCard.tsx`) — a live-updating timer (ticks every second while on site), session history, and total time on the job. **This card is deliberately employee-only operational data — it must never appear on Invoices, Reports, the dashboard, or anywhere a customer or the books would touch.** It currently acts on behalf of `job.assignedTo` since there's no real login yet; once employee auth exists, gate it to "only the signed-in employee assigned to this job can start/finish it" and hide the whole card from the owner's admin view per the Employee Access scope decision above (or keep it visible to the owner read-only — Kyle's call when that's built).

## Build Status
- **Stage 1 (done):** design system primitives, app shell (sidebar + header), dashboard with KPI row, Job Overview, Cash Flow chart, Invoice Status donut, Recent Invoices, Quick Actions, Create New panel, Upcoming Jobs, Recent Activity.
- **Stage 2 (done):** Jobs module — list view (search/filter/sort), job detail (scope of work, job costing, photos placeholder, activity/notes timeline, status control), new-job form, customer→quote→job→invoice workflow stepper. Dashboard's Job Overview, Upcoming Jobs, and the "Jobs in Progress" KPI are now wired live to `useJobsStore()` instead of static demo numbers.
- **Stage 3 (done):** Customers module — list view (search/sort by name/jobs/lifetime value), customer detail (contact info, editable notes, full jobs/quotes/invoices history in one place, stat cards for total jobs/lifetime value/outstanding/open quotes), new-customer form. `Invoice` and `Quote` now carry `customerId` so history cross-references correctly. "New job for this customer" on the detail page deep-links to `/jobs/new?customerId=...` and `JobNew` prefills from it.
- **Stage 4 (done):** Quotes module — list view (search/status filter), print-realistic quote preview/detail (business letterhead, bill-to, line items with optional GST, terms/notes, validity date), new-quote form (GST toggle, save draft / save & send), full status lifecycle (Draft → Sent → Accepted/Declined) and "Convert to job" which creates a real linked job. `JobWorkflow`'s quote step now reads live status from `useQuotesStore()` instead of a hardcoded label.
- **Stage 5 (done):** Invoices module — list view, print-realistic invoice detail (same letterhead pattern as quotes), new-invoice form (prefills from `?jobId=` when created via a job's "Create invoice"), Draft → Sent lifecycle, and a "Record payment" flow supporting partial payments (`InvoiceStatus` gained a `Partial` state, auto-derived from payments vs total). `JobWorkflow`'s invoice step now shows live status too.
- **Stage 6 (done):** Expenses module — list view (search/category filter, optional job link), log-expense form. Dashboard's Cash Flow chart, Invoice Status donut, and the whole KPI row are now computed live from `useInvoicesStore()`/`useExpensesStore()`/`useQuotesStore()` instead of the static `kpis`/`cashFlow*`/`invoiceStatusBreakdown` demo exports (all removed from `demo-data.ts`). Sidebar nav badge counts (Jobs/Invoices/Quotes) are live too. A dedicated global payments-ledger page was scoped out for now — payments are recorded and shown per-invoice, which covers the actual need; revisit only if Kyle asks for a cross-invoice payments view.
- **Stage 7 (done):** Calendar — month-view grid colour-coded by assignee (with a status dot per job pill), a day-agenda side panel, native HTML5 drag-and-drop to reschedule a job to a different day (from either the grid or the agenda panel), an "Everyone / [team member]" filter, and "New Job" deep-links to `/jobs/new?dueDate=...`. `Job.assignedTo` is editable from Job Detail too (see Employee Access note above re: `teamMembers` being placeholder data).
- **Stage 8 (done):** Reports — date-range filter (This month/Last 30 days/This quarter/This year/All time), summary KPI row (revenue/expenses/net profit/outstanding), Revenue Over Time chart, Outstanding vs Paid, Expenses by Category donut, Top Customers by Value table, and a GST Summary (BAS-style: collected/paid/net) card. "Print report" uses `window.print()` with print CSS in `index.css` (`.no-print`, `.print-section`, hides sidebar/header) — this is the print/export-friendly layout the plan asked for on the revenue and GST sections specifically, extended to the whole page since it was nearly free to do.
- **Stage 9 (core sweep done, see gaps below):** mobile responsiveness + polish. Added `BottomNav` (`src/components/layout/BottomNav.tsx`) — the sidebar is `hidden lg:flex` and until this there was **no navigation at all below `lg`**; fixed bottom tab bar (Home/Jobs/Invoices/Quotes + a "More" bottom sheet for the rest) with the same live badge counts as the sidebar. `AppShell`'s `<main>` gets `pb-16 lg:pb-0` so content doesn't sit under the fixed nav. Tested every page at 375px width; real bugs found and fixed:
  1. `KpiRow`'s grid was `grid-cols-2` below `sm` — too narrow for value+sparkline, sparklines overflowed past the card edge. Now `grid-cols-1` below `sm` (stacks, matching the plan's own "KPI cards become horizontal-scroll or stacked" spec) plus `min-w-0`/`truncate` as defense in depth.
  2. `JobWorkflow`'s 4-step stepper was a fixed `flex` row — the last step ("Create invoice") was clipped off-screen and unreadable. Now `flex-col` below `sm` with the connecting arrows rotated 90°.
  3. `LineItemsTable` (shared by Job/Quote/Invoice detail) was a 4-column table with no room on a phone — the Total column was pushed off-screen behind an unlabelled horizontal scroll, easy to miss entirely. Now renders as stacked cards below `sm` (description + qty×price on one line, total on the right) and the original table at `sm`+.
  4. `CashFlowCard` and `Reports`' Revenue Over Time chart used a `margin={{ left: -16 }}` tuned for desktop that clipped the first character of Y-axis labels ($ or a digit) on narrow screens. Changed to `left: 0` on both.
  5. `Reports`' Expenses by Category legend had a long label ("Tools & Equipment") collide with its value with no truncation — the `truncate` class was on a flex child without `min-w-0`, so it couldn't shrink. Fixed with `min-w-0` on the label wrapper and `shrink-0` on the value.
  - **Known gap, not yet fixed:** the Calendar's drag-and-drop (native HTML5 `draggable`) does not work via touch on mobile browsers — it's mouse-only by nature of that API. On a phone, jobs can still be rescheduled via Job Detail's due-date field or by tapping a day and opening "New Job", but there's no touch-equivalent of the desktop drag interaction yet. If Kyle wants that on mobile, it needs a touch-gesture library (e.g. dnd-kit with its touch sensor) or a long-press "move to..." day-picker as an alternative — worth a quick decision with Kyle rather than guessing which he'd prefer.
  - Loading states aren't really applicable yet (no backend means no async fetches, data is always instantly available) — revisit once Supabase lands.
- **Employee access / Supabase backend (in progress):** see above.
- **Known non-blocking issue:** production bundle (`npm run build`) is ~988 KB (283 KB gzipped), past Vite's 500 KB chunk-size warning. Not a functional problem, but worth code-splitting (route-based `React.lazy`) at some point rather than shipping one monolithic JS chunk — low priority, do it opportunistically rather than as its own stage.

## Dev
```
npm run dev   # http://localhost:8081
npx tsc -b    # typecheck
```
