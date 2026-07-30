create table if not exists public.email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  event_type text not null check (
    event_type in (
      'email.bounced',
      'email.complained',
      'email.delivered',
      'email.delivery_delayed',
      'email.failed',
      'email.sent',
      'email.suppressed'
    )
  ),
  provider_email_id text,
  recipient_hashes text[] not null default '{}',
  reason text,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_suppressions (
  recipient_hash text primary key,
  reason text not null,
  provider_event_id text not null,
  last_event_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists email_delivery_events_occurred_at_idx
  on public.email_delivery_events(occurred_at desc);
create index if not exists email_suppressions_last_event_at_idx
  on public.email_suppressions(last_event_at desc);

alter table public.email_delivery_events enable row level security;
alter table public.email_suppressions enable row level security;

drop policy if exists "service_only_explicit_deny" on public.email_delivery_events;
create policy "service_only_explicit_deny"
  on public.email_delivery_events as restrictive for all
  to anon, authenticated using (false) with check (false);

drop policy if exists "service_only_explicit_deny" on public.email_suppressions;
create policy "service_only_explicit_deny"
  on public.email_suppressions as restrictive for all
  to anon, authenticated using (false) with check (false);

revoke all on public.email_delivery_events from public, anon, authenticated;
revoke all on public.email_suppressions from public, anon, authenticated;
grant select, insert on public.email_delivery_events to service_role;
grant select, insert, update on public.email_suppressions to service_role;
