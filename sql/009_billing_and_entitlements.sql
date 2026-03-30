-- 009_billing_and_entitlements.sql
-- Paid launch foundation: billing state, event idempotency, and quota usage.

create table if not exists public.billing_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro')),
  billing_status text not null default 'free'
    check (billing_status in ('free', 'pending', 'active', 'trialing', 'on_hold', 'past_due', 'cancelled', 'expired')),
  dodo_customer_id text unique,
  dodo_subscription_id text unique,
  dodo_product_id text,
  billing_email text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_event_id text,
  last_event_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_billing_accounts_updated_at
  before update on public.billing_accounts
  for each row execute function public.touch_updated_at();

alter table public.billing_accounts enable row level security;

create policy "billing_accounts_select_own" on public.billing_accounts for select
  using ((select auth.uid()) = user_id);

create policy "billing_accounts_insert_own" on public.billing_accounts for insert
  with check ((select auth.uid()) = user_id);

create policy "billing_accounts_update_own" on public.billing_accounts for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.billing_events (
  id text primary key,
  event_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  dodo_customer_id text,
  dodo_subscription_id text,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_events_user on public.billing_events(user_id, created_at desc);
create index if not exists idx_billing_events_subscription on public.billing_events(dodo_subscription_id, created_at desc);

alter table public.billing_events enable row level security;

create policy "billing_events_deny_all" on public.billing_events for all
  using (false);

create table if not exists public.usage_counters (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric text not null check (metric in ('feedback_submissions')),
  period_start date not null,
  count integer not null default 0 check (count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, metric, period_start)
);

create index if not exists idx_usage_counters_lookup
  on public.usage_counters(user_id, metric, period_start desc);

create trigger trg_usage_counters_updated_at
  before update on public.usage_counters
  for each row execute function public.touch_updated_at();

alter table public.usage_counters enable row level security;

create policy "usage_counters_select_own" on public.usage_counters for select
  using ((select auth.uid()) = user_id);

create policy "usage_counters_deny_writes" on public.usage_counters for all
  using (false)
  with check (false);

create or replace function public.increment_usage_counter(
  p_user_id uuid,
  p_metric text,
  p_period_start date,
  p_amount integer default 1
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  insert into public.usage_counters (user_id, metric, period_start, count)
  values (p_user_id, p_metric, p_period_start, greatest(p_amount, 0))
  on conflict (user_id, metric, period_start)
  do update
    set count = public.usage_counters.count + greatest(p_amount, 0),
        updated_at = now()
  returning count into next_count;

  return coalesce(next_count, 0);
end;
$$;
