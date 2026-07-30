alter table public.billing_events
  add column if not exists status text not null default 'received',
  add column if not exists claim_token uuid,
  add column if not exists locked_at timestamptz,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists processing_error text,
  add column if not exists occurred_at timestamptz;

alter table public.billing_events
  drop constraint if exists billing_events_status_check;
alter table public.billing_events
  add constraint billing_events_status_check
  check (status in ('received', 'processing', 'processed', 'failed'));

alter table public.billing_accounts
  add column if not exists last_event_at timestamptz;

update public.billing_events
set status = case when processed_at is null then 'failed' else 'processed' end
where status = 'received';

create or replace function public.claim_billing_event(
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_customer_id text,
  p_subscription_id text,
  p_payload jsonb,
  p_occurred_at timestamptz
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_claim_token uuid := gen_random_uuid();
  v_result uuid;
begin
  insert into public.billing_events (
    id,
    event_type,
    user_id,
    dodo_customer_id,
    dodo_subscription_id,
    payload,
    status,
    claim_token,
    locked_at,
    attempt_count,
    occurred_at,
    processing_error,
    processed_at
  )
  values (
    p_event_id,
    p_event_type,
    p_user_id,
    p_customer_id,
    p_subscription_id,
    p_payload,
    'processing',
    v_claim_token,
    now(),
    1,
    p_occurred_at,
    null,
    null
  )
  on conflict (id) do update
  set
    status = 'processing',
    claim_token = v_claim_token,
    locked_at = now(),
    attempt_count = public.billing_events.attempt_count + 1,
    processing_error = null
  where public.billing_events.status in ('received', 'failed')
     or (
       public.billing_events.status = 'processing'
       and public.billing_events.locked_at < now() - interval '5 minutes'
     )
  returning claim_token into v_result;

  return v_result;
end;
$$;

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
  p_occurred_at timestamptz
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
      user_id,
      plan_tier,
      billing_status,
      dodo_customer_id,
      dodo_subscription_id,
      dodo_product_id,
      billing_email,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      last_event_id,
      last_event_type,
      last_event_at,
      updated_at
    )
    select
      p_user_id,
      p_plan_tier,
      p_billing_status,
      p_customer_id,
      p_subscription_id,
      p_product_id,
      p_billing_email,
      p_period_start,
      p_period_end,
      p_cancel_at_period_end,
      event.id,
      event.event_type,
      p_occurred_at,
      now()
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
      updated_at = now()
    where public.billing_accounts.last_event_at is null
       or excluded.last_event_at >= public.billing_accounts.last_event_at;
  end if;

  update public.billing_events
  set
    status = 'processed',
    processed_at = now(),
    locked_at = null,
    processing_error = null
  where id = p_event_id
    and claim_token = p_claim_token;

  return found;
end;
$$;

create or replace function public.fail_claimed_billing_event(
  p_event_id text,
  p_claim_token uuid,
  p_error text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.billing_events
  set
    status = 'failed',
    locked_at = null,
    processing_error = left(p_error, 500)
  where id = p_event_id
    and claim_token = p_claim_token
    and status = 'processing';
$$;

revoke all on function public.claim_billing_event(text,text,uuid,text,text,jsonb,timestamptz) from public, anon, authenticated;
revoke all on function public.apply_claimed_billing_event(text,uuid,uuid,text,text,text,text,text,text,timestamptz,timestamptz,boolean,timestamptz) from public, anon, authenticated;
revoke all on function public.fail_claimed_billing_event(text,uuid,text) from public, anon, authenticated;
grant execute on function public.claim_billing_event(text,text,uuid,text,text,jsonb,timestamptz) to service_role;
grant execute on function public.apply_claimed_billing_event(text,uuid,uuid,text,text,text,text,text,text,timestamptz,timestamptz,boolean,timestamptz) to service_role;
grant execute on function public.fail_claimed_billing_event(text,uuid,text) to service_role;
