-- 056: Consent-aware growth attribution, lead capture, and the five-invite reward.
-- The hosted app writes these records through service-role server routes only.

alter table public.billing_accounts
  add column if not exists complimentary_pro_until timestamptz;

-- Billing truth is webhook- or service-managed. Authenticated users may read their
-- row through the existing policy, but may not manufacture plan changes directly.
drop policy if exists "billing_accounts_insert_own" on public.billing_accounts;
drop policy if exists "billing_accounts_update_own" on public.billing_accounts;
revoke insert, update, delete on table public.billing_accounts from anon, authenticated;

create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_hash text not null unique check (email_hash ~ '^[0-9a-f]{64}$'),
  use_case text,
  source text not null default 'early-access',
  consent_version text not null,
  consented_at timestamptz not null,
  attribution jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_conversion_events (
  event_id uuid primary key,
  event_name text not null check (event_name in ('Lead', 'CompleteRegistration', 'ProjectCreated')),
  user_id uuid references auth.users(id) on delete set null,
  email_hash text check (email_hash is null or email_hash ~ '^[0-9a-f]{64}$'),
  source_url text,
  attribution jsonb not null default '{}'::jsonb,
  consent_version text not null,
  provider_results jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'partial', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists marketing_conversion_events_pending_idx
  on public.marketing_conversion_events(status, created_at)
  where status in ('pending', 'partial', 'failed');
create index if not exists marketing_conversion_events_user_idx
  on public.marketing_conversion_events(user_id, created_at desc)
  where user_id is not null;

create table if not exists public.user_acquisition (
  user_id uuid primary key references auth.users(id) on delete cascade,
  referral_code text,
  attribution jsonb not null default '{}'::jsonb,
  consent_version text,
  signup_event_id uuid unique,
  signup_recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.referral_programs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{10,32}$'),
  successful_referrals integer not null default 0 check (successful_referrals between 0 and 5),
  reward_granted_at timestamptz,
  reward_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((reward_granted_at is null and reward_expires_at is null) or (reward_granted_at is not null and reward_expires_at is not null))
);

create table if not exists public.referral_signups (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  invited_user_id uuid not null unique references auth.users(id) on delete cascade,
  referral_code text not null,
  created_at timestamptz not null default now(),
  check (inviter_user_id <> invited_user_id)
);

create index if not exists referral_signups_inviter_idx
  on public.referral_signups(inviter_user_id, created_at desc);

drop trigger if exists trg_marketing_leads_updated_at on public.marketing_leads;
create trigger trg_marketing_leads_updated_at
  before update on public.marketing_leads
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_referral_programs_updated_at on public.referral_programs;
create trigger trg_referral_programs_updated_at
  before update on public.referral_programs
  for each row execute function public.touch_updated_at();

alter table public.marketing_leads enable row level security;
alter table public.marketing_conversion_events enable row level security;
alter table public.user_acquisition enable row level security;
alter table public.referral_programs enable row level security;
alter table public.referral_signups enable row level security;

revoke all on table public.marketing_leads from anon, authenticated;
revoke all on table public.marketing_conversion_events from anon, authenticated;
revoke all on table public.user_acquisition from anon, authenticated;
revoke all on table public.referral_programs from anon, authenticated;
revoke all on table public.referral_signups from anon, authenticated;
grant all on table public.marketing_leads to service_role;
grant all on table public.marketing_conversion_events to service_role;
grant all on table public.user_acquisition to service_role;
grant all on table public.referral_programs to service_role;
grant all on table public.referral_signups to service_role;

drop policy if exists "service_only_explicit_deny" on public.marketing_leads;
create policy "service_only_explicit_deny" on public.marketing_leads as restrictive for all
  to anon, authenticated using (false) with check (false);
drop policy if exists "service_only_explicit_deny" on public.marketing_conversion_events;
create policy "service_only_explicit_deny" on public.marketing_conversion_events as restrictive for all
  to anon, authenticated using (false) with check (false);
drop policy if exists "service_only_explicit_deny" on public.user_acquisition;
create policy "service_only_explicit_deny" on public.user_acquisition as restrictive for all
  to anon, authenticated using (false) with check (false);
drop policy if exists "service_only_explicit_deny" on public.referral_programs;
create policy "service_only_explicit_deny" on public.referral_programs as restrictive for all
  to anon, authenticated using (false) with check (false);
drop policy if exists "service_only_explicit_deny" on public.referral_signups;
create policy "service_only_explicit_deny" on public.referral_signups as restrictive for all
  to anon, authenticated using (false) with check (false);

create or replace function public.claim_referral_signup(
  p_invited_user_id uuid,
  p_referral_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program public.referral_programs%rowtype;
  v_signup_id uuid;
  v_count integer;
  v_reward_end timestamptz;
  v_current_period_end timestamptz;
  v_existing_comp timestamptz;
  v_inviter_email text;
begin
  if p_invited_user_id is null or p_referral_code is null then
    return jsonb_build_object('credited', false, 'reason', 'missing_input');
  end if;

  select * into v_program
  from public.referral_programs
  where code = p_referral_code
  for update;

  if not found then
    return jsonb_build_object('credited', false, 'reason', 'invalid_code');
  end if;

  if v_program.user_id = p_invited_user_id then
    return jsonb_build_object('credited', false, 'reason', 'self_referral');
  end if;

  if v_program.successful_referrals >= 5 then
    return jsonb_build_object('credited', false, 'reason', 'program_complete');
  end if;

  perform 1
  from auth.users
  where id = p_invited_user_id
    and created_at >= now() - interval '7 days'
    and email_confirmed_at is not null;

  if not found then
    return jsonb_build_object('credited', false, 'reason', 'not_new_verified_user');
  end if;

  insert into public.referral_signups (inviter_user_id, invited_user_id, referral_code)
  values (v_program.user_id, p_invited_user_id, v_program.code)
  on conflict (invited_user_id) do nothing
  returning id into v_signup_id;

  if v_signup_id is null then
    return jsonb_build_object('credited', false, 'reason', 'already_credited');
  end if;

  v_count := v_program.successful_referrals + 1;
  update public.referral_programs
  set successful_referrals = v_count
  where user_id = v_program.user_id;

  if v_count = 5 and v_program.reward_granted_at is null then
    select current_period_end, complimentary_pro_until
    into v_current_period_end, v_existing_comp
    from public.billing_accounts
    where user_id = v_program.user_id;

    v_reward_end := greatest(
      now(),
      coalesce(v_current_period_end, now()),
      coalesce(v_existing_comp, now())
    ) + interval '1 month';

    update public.referral_programs
    set reward_granted_at = now(), reward_expires_at = v_reward_end
    where user_id = v_program.user_id;

    select email into v_inviter_email
    from auth.users
    where id = v_program.user_id;

    insert into public.billing_accounts (user_id, billing_email, complimentary_pro_until)
    values (v_program.user_id, v_inviter_email, v_reward_end)
    on conflict (user_id) do update
      set complimentary_pro_until = excluded.complimentary_pro_until,
          updated_at = now();
  end if;

  return jsonb_build_object(
    'credited', true,
    'successful_referrals', v_count,
    'reward_granted', v_count = 5,
    'reward_expires_at', v_reward_end
  );
end;
$$;

revoke execute on function public.claim_referral_signup(uuid, text)
  from public, anon, authenticated;
grant execute on function public.claim_referral_signup(uuid, text)
  to service_role;
