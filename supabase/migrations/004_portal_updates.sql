-- ============================================================
-- 004_portal_updates.sql
-- Regis Marie College Document Request System — portal updates
--
-- Run in the Supabase SQL editor AFTER schema.sql, 002_features.sql,
-- and 003_security_hardening.sql (in that order). This file is additive
-- and idempotent where possible; it can be edited to add the Phase 3/4
-- sections before running.
-- ============================================================

-- ------------------------------------------------------------
-- Phase 2: request_events — DB-driven status audit trail
-- A canonical event log so that every status transition is recorded
-- server-side (trigger), independent of which clerk UI made the change.
-- ------------------------------------------------------------

create table if not exists public.request_events (
  id bigint generated always as identity primary key,
  request_id bigint not null references public.requests(id) on delete cascade,
  event_type text not null default 'status_changed'
    check (event_type in ('created', 'status_changed', 'payment_submitted', 'payment_verified', 'payment_rejected')),
  from_status text,
  to_status text,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_request_events_request on public.request_events (request_id, created_at);

alter table public.request_events enable row level security;

-- Visible to the request owner or staff; only staff can insert manually
-- (the trigger below bypasses RLS via SECURITY DEFINER).
create policy "request_events_select_own_or_staff" on public.request_events
  for select using (
    public.is_staff() or exists (
      select 1 from public.requests r where r.id = request_id and r.user_id = auth.uid()
    )
  );

create policy "request_events_insert_staff" on public.request_events
  for insert with check (public.is_staff());

-- Log every requests.status transition (regardless of who performed it).
create or replace function public.log_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.request_events (request_id, event_type, from_status, to_status, changed_by, note)
    values (new.id, 'status_changed', old.status::text, new.status::text, auth.uid(), new.remarks);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_log_request_status_change on public.requests;
create trigger trg_log_request_status_change
  after update of status on public.requests
  for each row execute function public.log_request_status_change();

-- Backfill: one "created" event per existing request.
insert into public.request_events (request_id, event_type, to_status, note, created_at)
select r.id, 'created', r.status::text, 'Request created', r.created_at
from public.requests r
where not exists (
  select 1 from public.request_events e
  where e.request_id = r.id and e.event_type = 'created'
);

-- Backfill: status changes from the legacy status_history log
-- (from_status is unknown for old rows, so it is left null).
insert into public.request_events (request_id, event_type, to_status, changed_by, note, created_at)
select sh.request_id, 'status_changed', sh.status, sh.changed_by, sh.remarks, coalesce(sh.changed_at, now())
from public.status_history sh
where not exists (
  select 1 from public.request_events e
  where e.request_id = sh.request_id and e.created_at = sh.changed_at and e.to_status = sh.status
);