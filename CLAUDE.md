# CLAUDE.md — TradeFlow

## About the Developer
- Kyle, based in Perth, Western Australia. Electrician by trade, beginner at software dev.
- Explain things plainly, casual tone, practical analogies over jargon.

## About This Project
TradeFlow — a premium invoicing and job-management SaaS for Australian trade
businesses (currently for **Dixon Electrical**, Kyle's own business). Scope:
Jobs, Customers, Quotes, Invoices, Payments, Expenses, Products & Services,
Calendar, Reports, employee access — an all-in-one competitor to Xero,
Invoice2go, ServiceM8. Should feel like a company invested millions into it,
not a prototype.

**Live:** https://tradeflow-seven-nu.vercel.app (Vercel, auto-deploys on every
push to `main`, project `hello-7715s-projects/tradeflow`). GitHub repo:
`Handsfreetradie/tradeflow` (private). Supabase project: `Tradeflow`, Sydney
region, id `kzxjmptixbdsfugoilgv`, org `Standaid` (same Supabase org as
Kyle's other project — separate project, separate database, no data overlap).

**Stack:** Vite + React 19 + TypeScript, Tailwind CSS + shadcn/ui-style
components (Radix primitives), React Router, Recharts, Sonner. **Supabase**
(Postgres + Auth + Storage + Edge Functions) is the real backend — see
"Backend" section below. Same stack family as Kyle's other project
(StandAid) for consistency, but this is a fully separate app/repo/product.

**Design reference:** `/design-reference/tradeflow-dashboard.png` — the
original visual reference for the desktop dashboard. The mobile employee
field view followed a separate mockup Kyle supplied inline (dark navy
header greeting, card-based job list, circular-style time tracker) — not
saved as a file, but the field pages under `src/pages/field/` reflect it.

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
- **Logo:** `src/components/shared/Logo.tsx` exports `LogoMark` (the app's own square navy/blue "T" mark) — used on login/setup/invite screens, the sidebar, and `public/favicon.svg`. This is TradeFlow's own brand, distinct from a tenant's uploaded **business logo** (Settings → Business), which appears on quote/invoice letterheads instead — don't conflate the two.

## Backend (Supabase) — real, not a prototype
The original 9-stage plan assumed a long "no backend yet" period. That's
over: as of 2026-09-24 the whole app runs on a real Supabase Postgres
database with row-level security, real Auth (owner + employee roles), Storage
(logos, job photos), and Edge Functions (user provisioning). **In-memory
React state is gone from the data layer** — every store in `src/lib/store/`
now reads/writes Supabase directly and every mutator is `async`.

### Auth & roles
- Two roles, both plain Supabase Auth users, differentiated by
  `app_metadata.role` ('owner' | 'employee') — **never** `user_metadata`,
  which is client-editable (see the Supabase security checklist). RLS
  policies check this via `is_owner()` (`public.is_owner()` SQL function
  reading `auth.jwt()`).
- **Owner bootstrap:** `/auth/setup` — self-serve, but the `create-user` edge
  function only allows it when zero owner profiles exist yet. Kyle's owner
  login: `kyledixonelectrical@gmail.com`.
- **Employee creation:** Settings → Team → Add employee. Calls `create-user`
  (owner-only, checked server-side via the caller's JWT) which uses
  `admin.inviteUserByEmail` — the employee gets a real email and sets their
  own password via `/auth/accept-invite`. **Requires Supabase Auth's Site
  URL / Redirect URLs to include the deployed domain** (Authentication → URL
  Configuration in the Supabase dashboard) — this is a one-time dashboard
  toggle Kyle needs to do himself, not settable via the API/MCP tools used
  to build this. Same goes for turning on leaked-password protection
  (free, currently off, dashboard-only).
- **Employee removal:** Settings → Team → trash icon. Calls the `delete-user`
  edge function (owner-only, can't delete yourself or another owner).
- Routing: `RequireRole` (`src/components/auth/RequireRole.tsx`) gates
  `/*` (owner) vs `/field/*` (employee) and redirects a signed-in user to
  the *other* role's home rather than a hardcoded path — this bug bit us
  once already (employee login → blank page) and matters again for any new
  role-gated route.

### The security model that actually matters
Kyle's explicit, repeated requirement: **employees must never see pricing,
costing, margins, other customers' data, quotes, invoices, or reports** —
and this is enforced at the database/API layer via RLS, not just hidden in
the UI (verified directly: a raw REST query as an employee against the base
`jobs`/`job_costs` tables returns nothing).
- Base tables `jobs`, `job_costs`, `quotes`, `quote_line_items`, `invoices`,
  `invoice_line_items`, `payments`, `expenses`, `activity_log`,
  `business_settings`, `products`: **owner-only** RLS (`is_owner()`). No
  employee policy exists on these at all.
- Employees get a **separate, deliberately column-restricted path**:
  `jobs_field_view`, `job_line_items_field_view`, `customers_field_view` —
  views that bypass base-table RLS on purpose (security-definer-style,
  flagged by the Supabase linter as an accepted, documented exception —
  see the SQL comments on each view) and instead do their own
  `job_assignees` membership check in the `WHERE` clause, exposing only a
  $-free column set. This is the only way to express "same Postgres role,
  different visible columns" since column-level `GRANT` can't differ
  between owner and employee (both map to `authenticated`).
- `job_notes`, `job_checkins`, `job_assignees`: owner full access; employees
  get real RLS policies scoped through `private.is_assigned_to_job(job_id)`
  (a `security definer` helper checking `job_assignees` membership for
  `auth.uid()`) — safe to query directly, no financial columns involved.
- Employee-initiated actions that need to touch more than their own rows
  (starting/finishing a job, which also flips job status and writes a note)
  go through `SECURITY DEFINER` RPCs (`employee_start_job`,
  `employee_finish_job`, `employee_update_job_status`) that check
  authorization internally — never raw table writes from the client for
  these. All have `search_path` pinned and `EXECUTE` revoked from `PUBLIC`
  then re-granted to `authenticated` only (Postgres grants `EXECUTE` to
  `PUBLIC` by default — the advisor caught this once, it's fixed, don't
  reintroduce it on new functions).
- **Multiple people per job**: `job_assignees` is a join table
  (`job_id, employee_id`), not a single `assigned_to` column (that column
  was removed in a migration — don't resurrect it). `useJobsStore()`
  exposes `setAssignees(jobId, employeeIds[])`, and `Job.assignees` is
  `{id, fullName}[]`, plural, everywhere (Job Detail, New Job, Calendar).

### Storage buckets
- `business-assets` (public) — tenant business logo, uploaded via Settings.
- `job-photos` (**private**, signed URLs, 1hr expiry) — job site photos.
  RLS on `storage.objects` mirrors the `job_assignees` pattern: owner full
  access, employee access parsed from the path convention
  `{job_id}/{filename}` via `(storage.foldername(name))[1]::uuid`. Always
  re-list photos to get fresh signed URLs rather than caching them —
  `src/lib/api/jobPhotos.ts`.

### Edge Functions (`supabase/functions` — deployed via MCP, not committed
to this repo's source tree; re-deploy with the Supabase MCP `deploy_edge_function` tool if you need to change one)
- `create-user` — owner bootstrap (self-serve, gated on zero existing
  owners) or employee invite (owner-only, `inviteUserByEmail`).
- `delete-user` — owner-only employee removal.
Both verify the caller's JWT `app_metadata.role` server-side; neither trusts
anything the client claims about itself.

### Money/number conventions (unchanged, still critical)
- All `amount`/`value` fields are the **ex-GST subtotal**; GST-inclusive
  totals are always computed on demand (`invoiceTotal()`, or `* 1.1`
  inline) — never store the GST-inclusive figure.
- Round to cents (`Math.round(value * 100)`) before any money equality/
  inequality comparison — raw float comparison is unsafe (`7200 * 1.1 !==
  7920` bit us once already, in `statusFromPayments`).
- `toDateKey(date)` (local `getFullYear`/`getMonth`/`getDate`), never
  `date.toISOString().slice(0,10)`, for any "today" key — the UTC version
  lags a day behind in AU timezones during early morning.
- Job/invoice/quote numbers come from Postgres sequences via RPCs
  (`next_job_number()`, `next_invoice_number()`, `next_quote_number()`),
  not client-side max+1 — safe under concurrent creates.

## Employee field view (`/field/*`, `src/pages/field/`, `src/components/field/`)
Mobile-styled (dark navy header card, bottom nav: Home/Jobs/Sign out),
separate from the owner's desktop shell. Backed by its own store
(`src/lib/store/field-jobs-store.tsx`, `useFieldJobsStore()`) that reads
the `*_field_view`s and `job_notes`/`job_checkins` directly — **do not**
reuse `useJobsStore()` here, it queries base tables employees have no RLS
access to and would silently return nothing.
- **On-site check-in / job timer** (ServiceM8-style): Start Job → running
  timer → Finish. Starting a `Scheduled` job auto-moves it to `In Progress`.
  The person pressing Start/Finish is always the *currently signed-in user*
  (`auth.uid()`), not a name picked from a list — this was a real
  pre-auth limitation, now fixed.
- **Can't-complete flag**: the Finish dialog has a checkbox — checking it
  inserts a row into `notifications` (via `employee_finish_job`'s
  `p_blocked` param) that surfaces in the owner's header bell icon
  (`useNotifications()`, `src/lib/store/notifications-store.tsx`), so a job
  that can't be finished doesn't just silently sit there.
- **Job photos**: same `JobPhotosCard` component as the owner side
  (`src/components/jobs/JobPhotosCard.tsx`), reused as-is.
- Employee-only operational data (check-ins, notes here, photos) —
  deliberately never appears on Invoices/Reports/anywhere financial.

## Architecture Rules
- `src/components/ui/*` = design-system primitives. Reuse these — never invent a one-off styled element in a page.
- `src/components/layout/*` = AppShell, Sidebar, Header, BottomNav, PlaceholderPage (owner desktop shell).
- `src/components/field/*` = FieldShell (employee mobile shell).
- `src/components/jobs/*` = job-detail composed cards: JobCostingCard, JobCheckInCard, JobWorkflow, ProgressClaimsCard, CertificateOfComplianceCard, JobPhotosCard.
- `src/components/dashboard/*` = dashboard-specific composed components.
- `src/lib/demo-data.ts` = **type definitions only now** (`Job`, `Customer`, `Invoice`, etc.) plus a couple of static display constants (`businessName` fallback, `recentActivity` — the dashboard activity feed is still a static demo list, not wired to the real `activity_log` table; that's a known gap, not a bug). The old seed arrays (`jobs`, `customers`, `invoices`, `quotes`, `expenses`, `teamMembers`) are gone — don't try to import them, they don't exist anymore.
- `src/lib/store/*` = one provider+hook per domain, **all Supabase-backed, all async**: `jobs-store`, `customers-store`, `quotes-store`, `invoices-store`, `expenses-store`, `team-store` (profiles, includes `hourlyRate`), `field-jobs-store` (employee-only), `business-settings-store` (logo/name/ABN singleton row), `notifications-store` (owner-only, the bell icon), `products-store` (catalog).
- `src/lib/api/*` = one-off request helpers that aren't a full store: `createUser`, `deleteUser` (call the edge functions), `jobPhotos` (storage helpers).
- Money/date conventions: see "Backend" section above — same rules, now enforced with real persisted data so getting them wrong actually matters.
- `src/lib/assigneeColors.ts` = `assigneeColor(name)` / `initials(name)` — deterministic hash-based colour-coding, keyed by display name. Used anywhere a person needs a colour badge (Calendar, Job Detail, Job Check-In).
- `src/components/shared/LineItemsTable.tsx` = reusable line-items table (subtotal/GST/total, mobile card layout below `sm`). `src/components/shared/AddFromCatalog.tsx` = the products-catalog picker dropdown used next to "Add line" in Job/Quote/Invoice line-item editors.
- Buttons/nav must always go somewhere real — no dead `#` links or no-op handlers. (Products & Services and Settings used to be exceptions; both are real now.)
- Path alias `@/*` → `src/*`.
- `src/lib/database.types.ts` is **hand-maintained**, not auto-committed from a generator script. After any schema migration, regenerate via the Supabase MCP `generate_typescript_types` tool and manually merge the relevant table/view/function changes in — don't skip the `Relationships` arrays on tables with FKs used in embedded selects (e.g. `job_assignees`), TypeScript will fail with a `SelectQueryError` type mismatch if you do.
- **`vercel.json`** has the SPA rewrite (`/(.*) → /index.html`) — required for any deep route to survive a page refresh on Vercel. Don't remove it.

## Job Costing
- `Job.pricingType`: `'Fixed Price' | 'Time & Materials'`.
- `Job.costs: JobCost[]` — logged costs (materials/labour/subcontractor/other), each with an optional `supplier` and `poNumber`.
- `JobCostingCard` shows quoted/estimated value vs costs-so-far vs margin, with a manual "Log cost" dialog.
- Supplier-invoice auto-pickup via email is still not built (see Roadmap) — the `poNumber` field is a hook for it, don't remove it.

## Progress Claims (fixed-price jobs)
- `ProgressClaimsCard` on Job Detail: contract value / claimed to date / remaining, plus every invoice raised against the job.
- Creating an invoice from a job (`/invoices/new?jobId=...`) with `pricingType === 'Fixed Price'` shows a "Progress claim" tool — enter a % of contract value, it adds that as a line item.
- **Auto-fill guard, don't remove**: `InvoiceNew.tsx` only pre-fills a job's scope-of-work line items and computed labour line items (see below) on that job's *first* invoice. A second invoice for the same job starts blank (or via the progress-claim %) — this was a real double-billing bug (re-seeding full scope + re-summing every check-in session ever logged on every subsequent invoice) caught and fixed 2026-09-25.

## Labour billing from logged time
- `profiles.hourly_rate` — each employee's charge-out rate, set by the owner in Settings → Team (inline field per row). Not visible to other employees beyond their own row (RLS self-read).
- Creating the *first* invoice for a job sums each employee's **closed** check-in sessions on that job (open/in-progress sessions are never billed), rounds to the nearest quarter hour, and adds one labour line item per employee at their rate. If any assigned employee has no rate set, a toast warns Kyle so it doesn't silently bill $0.
- Logic lives in `InvoiceNew.tsx`'s `labourLineItemsFromJob()` — co-located rather than in a store since it's only needed there.

## Products & Services
Real catalog now (`products` table, owner-only RLS): name, category, unit
(each/hour/metre/sqm/day/kit), price. Managed at `/products`
(`src/pages/ProductsList.tsx`). Wired into Job/Quote/Invoice line-item
editors via `AddFromCatalog` — doesn't touch existing line items when
inserted, just appends.

## Certificate of Compliance (electrical work)
- `Job.cocStatus` (`'Not Required' | 'Not Started' | 'Submitted' | 'Issued'`), `cocNumber`, `cocIssuedDate` — tracked manually via `CertificateOfComplianceCard` on Job Detail.
- **This is not a live submission to any government portal yet.** Kyle asked specifically about NSW's BCNSW eCert API (`nsw.gov.au/.../bcnsw-ecert-api-for-electrical-industry`) — that's a real regulatory API (Gas and Electricity (Consumer Safety) Regulation 2018) requiring Building Commission NSW to approve Dixon Electrical as an eligible entity first (clean compliance history, audit capability, etc.), then a formal onboarding (test credentials → build/test → production credentials). **There is no public API spec** — technical docs are only handed over after eligibility approval. Kyle needs to email `electricalcompliance@customerservice.nsw.gov.au` ("Request access to API test environment": business name, ABN/ACN, system description, contact details, IPs to whitelist) before any real integration can be built. Note Kyle is WA-based; confirm he actually holds/uses NSW licensing before assuming this is the only cert system that matters — WA's own COES system (Building and Energy WA / EnergySafety) may also be relevant and hasn't been researched yet.
- Once Kyle has test credentials and the real API schema, this is the natural place to wire in actual submission — don't redesign the data model, extend it.

## Employee Access — decisions
- **Scope:** restricted crew view — employees see only their assigned jobs (now: jobs they're *a* member of, via `job_assignees`). No pricing, costing/margins, other customers' data, quotes, invoices, or reports. Owner sees everything.
- **Login:** owner-created via Settings → Team, now a real email invite (not a shared password) — see "Auth & roles" above.
- `teamMembers`, the old placeholder name array, is gone. `useTeamStore()` (owner-side) / the field view's own session are the only sources of team identity now.

## Build Status
Stages 1–9 of the original plan (design system, Jobs, Customers, Quotes,
Invoices, Expenses, Calendar, Reports, mobile responsiveness) are all done
— see git history for the stage-by-stage detail if needed, it's not
worth re-describing here now that the backend rewrite has touched most of
those pages. Everything above this line reflects the *current* architecture;
treat any older description of "no backend yet" or a single `assignedTo`
field as historical, not current.

**Known non-blocking issues:**
- Production bundle is ~315 KB gzipped — fine for now, code-split later if it grows.
- Calendar drag-and-drop (native HTML5 DnD) doesn't work via touch on mobile — reschedule via Job Detail's due-date field instead on a phone. No decision made yet on whether to add a touch-friendly alternative.
- Dashboard's Recent Activity card and `recentActivity` are still static demo data, not wired to the real `activity_log` table.
- No PWA/offline support yet (no manifest, no service worker) — on the roadmap.

## Roadmap — discussed, not started
Prioritised list Kyle agreed on 2026-09-25, roughly in this order:
1. **Real photo upload** — done (2026-09-24/25), see "Storage buckets" above.
2. **Job templates** — save a job's line items as a reusable template. Not started.
3. **Progress/partial invoicing** — done (2026-09-25), see "Progress Claims" above.
4. **Online quote acceptance** — a public, no-login link where a customer views/accepts a quote with an e-signature. Not started; would need a public (unauthenticated) route + RLS policy scoped very narrowly (a quote-by-token lookup, not general public read access to `quotes`).
5. **Offline access (PWA)** — manifest + service worker so the employee field view keeps working with bad reception. Not started.
6. **Recurring jobs / maintenance scheduling** — e.g. auto-recreate a testing/tagging job every 6–12 months. Not started, biggest lift of the list (needs a real recurrence engine).

Deliberately **not** pursuing right now (discussed and deprioritised): SMS notifications (needs Twilio/paid SMS provider), in-app card payments (needs Stripe), ServiceM8's phone system / Zapier-n8n integrations / dispatch map / Xero-MYOB sync — all bigger infra than this stage needs.

**Auto supplier-invoice pickup via email → Expenses** — still not started, still needs its own scoping conversation (email provider, inbound-parse webhook or connected mailbox, LLM/OCR extraction step, file storage, per-extraction API cost). Don't build incrementally inside another stage.

## Dev
```
npm run dev   # http://localhost:8081
npx tsc -b    # typecheck
npm run build # typecheck + production build
```
**Before pushing:** `npx tsc -b` alone is not sufficient proof the build will
pass on Vercel — its incremental cache can mask a genuine `noUnusedLocals`
error that only shows up on a clean build (this happened once: an unused
import passed locally, failed on Vercel). Verify with a clean build when in
doubt: `rm -rf node_modules .env.local && npm ci && npx tsc -b --force &&
npm run build` in a throwaway copy of the repo, not the working tree.
