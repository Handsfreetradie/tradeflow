-- Kilometre log for tax (ATO cents-per-km method). Owner-only, one business per row.
-- Run once in the Supabase SQL editor (project kzxjmptixbdsfugoilgv). Safe to re-run.

create table if not exists public.trips (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null default public.current_business_id() references public.businesses(id) on delete cascade,
  date          date not null,
  km            numeric(8,1) not null check (km > 0 and km <= 5000),
  from_location text,
  to_location   text,
  purpose       text not null default '',
  job_id        uuid references public.jobs(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists trips_business_date_idx on public.trips (business_id, date desc);

alter table public.trips enable row level security;

-- Copy the access rules from the expenses table so trips are protected exactly the same way
-- (expenses is owner-only and scoped to the owner's business). Avoids hard-coding helper names.
do $$
declare
  p record;
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'expenses') then
    raise exception 'No policies found on public.expenses — stopping so trips is not left unprotected';
  end if;

  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'trips' loop
    execute format('drop policy %I on public.trips', p.policyname);
  end loop;

  for p in select * from pg_policies where schemaname = 'public' and tablename = 'expenses' loop
    execute format(
      'create policy %I on public.trips as %s for %s to %s%s%s',
      p.policyname,
      p.permissive,
      p.cmd,
      array_to_string(p.roles, ', '),
      case when p.qual is not null then format(' using (%s)', p.qual) else '' end,
      case when p.with_check is not null then format(' with check (%s)', p.with_check) else '' end
    );
  end loop;
end $$;

-- Check: this should list the same kind of rules as expenses (owner + business scoping).
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('expenses', 'trips')
order by tablename, policyname;
