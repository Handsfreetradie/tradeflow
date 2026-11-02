-- Record when an invoice was sent, so the Invoices list can show "Sent <date>" next to "Opened <date>".
-- Run once in the Supabase SQL editor (project kzxjmptixbdsfugoilgv). Safe to re-run.
-- Invoices already marked Sent before this change keep a blank sent_at (the real send date was never recorded).

alter table public.invoices add column if not exists sent_at timestamptz;
