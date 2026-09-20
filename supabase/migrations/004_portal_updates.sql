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

-- ------------------------------------------------------------
-- Phase 3: rejection reason enforcement (DB-level safety nets)
-- The clerk UIs already require a reason; these triggers guarantee it
-- stays mandatory even for direct SQL / API writes.
-- ------------------------------------------------------------

create or replace function public.require_request_reject_reason()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('Rejected', 'Cancelled')
     and (new.remarks is null or btrim(new.remarks) = '') then
    raise exception 'A reason is required to % this request.',
      case when new.status = 'Rejected' then 'reject' else 'cancel' end;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_require_request_reject_reason on public.requests;
create trigger trg_require_request_reject_reason
  before update of status on public.requests
  for each row execute function public.require_request_reject_reason();

create or replace function public.require_payment_reject_reason()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'Rejected' and (new.rejection_reason is null or btrim(new.rejection_reason) = '') then
    raise exception 'A rejection reason is required to reject a payment.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_require_payment_reject_reason on public.payments;
create trigger trg_require_payment_reject_reason
  before update of status on public.payments
  for each row execute function public.require_payment_reject_reason();

create or replace function public.require_guidance_reject_reason()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.guidance_status = 'Rejected'
     and (new.remarks is null or btrim(new.remarks) = '') then
    raise exception 'A reason is required when the Guidance Department rejects a request.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_require_guidance_reject_reason on public.requests;
create trigger trg_require_guidance_reject_reason
  before update of guidance_status on public.requests
  for each row execute function public.require_guidance_reject_reason();

-- ------------------------------------------------------------
-- Phase 3: account rejection audit log
-- Rejected registrations are deleted (auth + profile cascade), so their
-- rejection reason is persisted here *before* deletion for the admin log.
-- ------------------------------------------------------------

create table if not exists public.account_rejections (
  id bigint generated always as identity primary key,
  profile_id uuid,
  full_name text not null,
  email text not null,
  reason text not null,
  rejected_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.account_rejections enable row level security;

create policy "account_rejections_select_staff" on public.account_rejections
  for select using (public.is_staff());

create policy "account_rejections_insert_staff" on public.account_rejections
  for insert with check (public.is_staff());

-- ------------------------------------------------------------
-- Phase 4: sequential receipt numbers
-- reference_number becomes a deterministic, sequential receipt number
-- (RMP-YYYY-NNNN) assigned by the database on insert, so the office ledger
-- and the reports CSV stay in sync regardless of which flow created the
-- payment.
-- ------------------------------------------------------------

create sequence if not exists public.receipt_seq;

create or replace function public.generate_receipt_number()
returns text
language sql
as $$
  select 'RMP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.receipt_seq')::text, 4, '0');
$$;

create or replace function public.assign_receipt_number()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.reference_number := public.generate_receipt_number();
  return new;
end;
$$;

drop trigger if exists trg_assign_receipt_number on public.payments;
create trigger trg_assign_receipt_number
  before insert on public.payments
  for each row execute function public.assign_receipt_number();

create unique index if not exists payments_reference_number_key on public.payments (reference_number);