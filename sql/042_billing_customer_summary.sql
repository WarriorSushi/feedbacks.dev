alter table public.billing_accounts
  add column if not exists recurring_amount integer,
  add column if not exists billing_currency text,
  add column if not exists billing_interval text,
  add column if not exists billing_interval_count integer;

alter table public.billing_accounts
  drop constraint if exists billing_accounts_recurring_amount_check,
  drop constraint if exists billing_accounts_currency_check,
  drop constraint if exists billing_accounts_interval_check,
  drop constraint if exists billing_accounts_interval_count_check;

alter table public.billing_accounts
  add constraint billing_accounts_recurring_amount_check
    check (recurring_amount is null or recurring_amount >= 0),
  add constraint billing_accounts_currency_check
    check (billing_currency is null or billing_currency ~ '^[A-Z]{3}$'),
  add constraint billing_accounts_interval_check
    check (billing_interval is null or billing_interval in ('day', 'week', 'month', 'year')),
  add constraint billing_accounts_interval_count_check
    check (billing_interval_count is null or billing_interval_count > 0);

drop function if exists public.apply_claimed_billing_event(
  text, uuid, uuid, text, text, text, text, text, text,
  timestamptz, timestamptz, boolean, timestamptz
);

create or replace function public.apply_claimed_billing_event(
  p_event_id text,
  p_claim_token uuid,
  p_user_id uuid,
  p_plan_tier text,
  p_billing_status text,
  p_customer_id text,
  p_subscription_id text,
  p_product_id text,
  p_billing_email text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_occurred_at timestamptz,
  p_recurring_amount integer,
  p_currency text,
  p_billing_interval text,
  p_billing_interval_count integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.billing_events
    where id = p_event_id
      and claim_token = p_claim_token
      and status = 'processing'
  ) then
    return false;
  end if;

  if p_user_id is not null and p_billing_status is not null then
    insert into public.billing_accounts (
      user_id, plan_tier, billing_status, dodo_customer_id, dodo_subscription_id,
      dodo_product_id, billing_email, current_period_start, current_period_end,
      cancel_at_period_end, last_event_id, last_event_type, last_event_at, updated_at,
      recurring_amount, billing_currency, billing_interval, billing_interval_count
    )
    select
      p_user_id, p_plan_tier, p_billing_status, p_customer_id, p_subscription_id,
      p_product_id, p_billing_email, p_period_start, p_period_end,
      p_cancel_at_period_end, event.id, event.event_type, p_occurred_at, now(),
      p_recurring_amount, p_currency, p_billing_interval, p_billing_interval_count
    from public.billing_events event
    where event.id = p_event_id
    on conflict (user_id) do update
    set
      plan_tier = excluded.plan_tier,
      billing_status = excluded.billing_status,
      dodo_customer_id = coalesce(excluded.dodo_customer_id, public.billing_accounts.dodo_customer_id),
      dodo_subscription_id = coalesce(excluded.dodo_subscription_id, public.billing_accounts.dodo_subscription_id),
      dodo_product_id = coalesce(excluded.dodo_product_id, public.billing_accounts.dodo_product_id),
      billing_email = coalesce(excluded.billing_email, public.billing_accounts.billing_email),
      current_period_start = coalesce(excluded.current_period_start, public.billing_accounts.current_period_start),
      current_period_end = coalesce(excluded.current_period_end, public.billing_accounts.current_period_end),
      cancel_at_period_end = excluded.cancel_at_period_end,
      last_event_id = excluded.last_event_id,
      last_event_type = excluded.last_event_type,
      last_event_at = excluded.last_event_at,
      updated_at = now(),
      recurring_amount = coalesce(excluded.recurring_amount, public.billing_accounts.recurring_amount),
      billing_currency = coalesce(excluded.billing_currency, public.billing_accounts.billing_currency),
      billing_interval = coalesce(excluded.billing_interval, public.billing_accounts.billing_interval),
      billing_interval_count = coalesce(excluded.billing_interval_count, public.billing_accounts.billing_interval_count)
    where public.billing_accounts.last_event_at is null
       or excluded.last_event_at >= public.billing_accounts.last_event_at;
  end if;

  update public.billing_events
  set status = 'processed', processed_at = now(), locked_at = null, processing_error = null
  where id = p_event_id and claim_token = p_claim_token;

  return found;
end;
$$;

revoke all on function public.apply_claimed_billing_event(
  text,uuid,uuid,text,text,text,text,text,text,timestamptz,timestamptz,boolean,
  timestamptz,integer,text,text,integer
) from public, anon, authenticated;
grant execute on function public.apply_claimed_billing_event(
  text,uuid,uuid,text,text,text,text,text,text,timestamptz,timestamptz,boolean,
  timestamptz,integer,text,text,integer
) to service_role;
