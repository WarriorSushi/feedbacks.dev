-- 057: Layered referral-abuse controls and reversible downgrade enforcement.
-- Sensitive signals are HMAC digests created server-side. Raw IP addresses and
-- browser fingerprints are never stored. Network and device digests are
-- pruned after 90 days by the billing lifecycle job; the normalized identity
-- digest remains to prevent the same address earning referral credit twice.

alter table public.billing_accounts
  add column if not exists grace_started_at timestamptz,
  add column if not exists grace_ends_at timestamptz,
  add column if not exists grace_cycle_id uuid,
  add column if not exists downgrade_finalized_at timestamptz;

alter table public.billing_accounts
  drop constraint if exists billing_accounts_grace_window_check;
alter table public.billing_accounts
  add constraint billing_accounts_grace_window_check
  check (
    (grace_started_at is null and grace_ends_at is null and grace_cycle_id is null)
    or
    (grace_started_at is not null and grace_ends_at > grace_started_at and grace_cycle_id is not null)
  );

alter table public.projects
  add column if not exists plan_frozen_at timestamptz,
  add column if not exists plan_freeze_reason text;

alter table public.projects
  drop constraint if exists projects_plan_freeze_reason_check;
alter table public.projects
  add constraint projects_plan_freeze_reason_check
  check (plan_freeze_reason is null or plan_freeze_reason = 'downgrade');

create index if not exists projects_plan_frozen_owner_idx
  on public.projects(owner_user_id, plan_frozen_at)
  where plan_frozen_at is not null;

alter table public.cron_runs drop constraint if exists cron_runs_job_name_check;
alter table public.cron_runs add constraint cron_runs_job_name_check
  check (job_name in ('webhook_jobs', 'notification_digests', 'account_deletions', 'e2e_cleanup', 'billing_lifecycle'));

create table if not exists public.billing_lifecycle_notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grace_cycle_id uuid not null,
  notice_day smallint not null check (notice_day between 1 and 3),
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, grace_cycle_id, notice_day)
);

alter table public.billing_lifecycle_notices enable row level security;
revoke all on table public.billing_lifecycle_notices from anon, authenticated;
grant all on table public.billing_lifecycle_notices to service_role;
drop policy if exists "service_only_explicit_deny" on public.billing_lifecycle_notices;
create policy "service_only_explicit_deny" on public.billing_lifecycle_notices
  as restrictive for all to anon, authenticated using (false) with check (false);

alter table public.user_acquisition
  add column if not exists network_hash text,
  add column if not exists device_hash text;

alter table public.referral_signups
  add column if not exists invited_email_hash text,
  add column if not exists network_hash text,
  add column if not exists device_hash text,
  add column if not exists status text not null default 'pending',
  add column if not exists risk_score smallint not null default 0,
  add column if not exists risk_reasons text[] not null default '{}',
  add column if not exists qualification_milestone text,
  add column if not exists qualified_at timestamptz,
  add column if not exists rejected_at timestamptz;

update public.referral_signups
set status = 'qualified', qualified_at = coalesce(qualified_at, created_at)
where status = 'pending' and invited_email_hash is null;

alter table public.referral_signups
  drop constraint if exists referral_signups_status_check;
alter table public.referral_signups
  add constraint referral_signups_status_check
  check (status in ('pending', 'qualified', 'review', 'rejected'));
alter table public.referral_signups
  drop constraint if exists referral_signups_risk_score_check;
alter table public.referral_signups
  add constraint referral_signups_risk_score_check check (risk_score between 0 and 100);

create unique index if not exists referral_signups_identity_idx
  on public.referral_signups(invited_email_hash)
  where invited_email_hash is not null;
create index if not exists referral_signups_pending_idx
  on public.referral_signups(status, created_at)
  where status = 'pending';
create index if not exists referral_signups_device_velocity_idx
  on public.referral_signups(inviter_user_id, device_hash, created_at desc)
  where device_hash is not null;
create index if not exists referral_signups_network_velocity_idx
  on public.referral_signups(inviter_user_id, network_hash, created_at desc)
  where network_hash is not null;

create or replace function public.register_referral_signup(
  p_invited_user_id uuid,
  p_referral_code text,
  p_invited_email_hash text,
  p_network_hash text,
  p_device_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program public.referral_programs%rowtype;
  v_signup_id uuid;
  v_device_matches integer := 0;
  v_network_matches integer := 0;
  v_risk_score integer := 0;
  v_risk_reasons text[] := '{}';
  v_status text := 'pending';
begin
  if p_invited_user_id is null
    or p_referral_code is null
    or p_invited_email_hash is null
    or p_invited_email_hash !~ '^[0-9a-f]{64}$'
  then
    return jsonb_build_object('registered', false, 'reason', 'missing_or_invalid_input');
  end if;

  select * into v_program
  from public.referral_programs
  where code = p_referral_code
  for update;

  if not found then
    return jsonb_build_object('registered', false, 'reason', 'invalid_code');
  end if;
  if v_program.user_id = p_invited_user_id then
    return jsonb_build_object('registered', false, 'reason', 'self_referral');
  end if;
  if v_program.successful_referrals >= 5 or v_program.reward_granted_at is not null then
    return jsonb_build_object('registered', false, 'reason', 'program_complete');
  end if;

  perform 1 from auth.users
  where id = p_invited_user_id
    and created_at >= now() - interval '7 days'
    and email_confirmed_at is not null;
  if not found then
    return jsonb_build_object('registered', false, 'reason', 'not_new_verified_user');
  end if;

  if p_device_hash is not null then
    select count(*) into v_device_matches
    from public.referral_signups
    where inviter_user_id = v_program.user_id
      and device_hash = p_device_hash
      and created_at >= now() - interval '30 days';
  end if;
  if p_network_hash is not null then
    select count(*) into v_network_matches
    from public.referral_signups
    where inviter_user_id = v_program.user_id
      and network_hash = p_network_hash
      and created_at >= now() - interval '30 days';
  end if;

  if v_device_matches >= 1 then
    v_risk_score := v_risk_score + 80;
    v_risk_reasons := array_append(v_risk_reasons, 'device_reuse');
  end if;
  if v_network_matches >= 2 then
    v_risk_score := least(100, v_risk_score + 25);
    v_risk_reasons := array_append(v_risk_reasons, 'network_velocity');
  end if;
  if v_risk_score >= 70 then
    v_status := 'review';
  end if;

  insert into public.referral_signups (
    inviter_user_id, invited_user_id, referral_code, invited_email_hash,
    network_hash, device_hash, status, risk_score, risk_reasons
  ) values (
    v_program.user_id, p_invited_user_id, v_program.code, p_invited_email_hash,
    p_network_hash, p_device_hash, v_status, v_risk_score, v_risk_reasons
  )
  on conflict do nothing
  returning id into v_signup_id;

  if v_signup_id is null then
    return jsonb_build_object('registered', false, 'reason', 'identity_already_registered');
  end if;

  return jsonb_build_object(
    'registered', true,
    'status', v_status,
    'risk_score', v_risk_score,
    'qualification_delay_hours', 24
  );
end;
$$;

create or replace function public.qualify_referral_signup(p_invited_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_signup public.referral_signups%rowtype;
  v_program public.referral_programs%rowtype;
  v_count integer;
  v_reward_end timestamptz;
  v_current_period_end timestamptz;
  v_existing_comp timestamptz;
  v_inviter_email text;
  v_milestone text;
begin
  select * into v_signup
  from public.referral_signups
  where invited_user_id = p_invited_user_id
  for update;

  if not found then return jsonb_build_object('qualified', false, 'reason', 'not_registered'); end if;
  if v_signup.status = 'qualified' then return jsonb_build_object('qualified', false, 'reason', 'already_qualified'); end if;
  if v_signup.status in ('review', 'rejected') then return jsonb_build_object('qualified', false, 'reason', v_signup.status); end if;
  if v_signup.created_at > now() - interval '24 hours' then
    return jsonb_build_object('qualified', false, 'reason', 'maturation_pending');
  end if;

  perform 1 from auth.users
  where id = p_invited_user_id and email_confirmed_at is not null;
  if not found then return jsonb_build_object('qualified', false, 'reason', 'email_unverified'); end if;

  select event_name into v_milestone
  from public.activation_milestones
  where user_id = p_invited_user_id
    and event_name in ('verification_completed', 'first_feedback_received')
  order by case event_name when 'first_feedback_received' then 1 else 2 end
  limit 1;
  if v_milestone is null then
    return jsonb_build_object('qualified', false, 'reason', 'activation_pending');
  end if;

  select * into v_program
  from public.referral_programs
  where user_id = v_signup.inviter_user_id
  for update;
  if not found or v_program.successful_referrals >= 5 or v_program.reward_granted_at is not null then
    update public.referral_signups set status = 'rejected', rejected_at = now()
    where id = v_signup.id;
    return jsonb_build_object('qualified', false, 'reason', 'program_complete');
  end if;

  v_count := v_program.successful_referrals + 1;
  update public.referral_signups
  set status = 'qualified', qualified_at = now(), qualification_milestone = v_milestone
  where id = v_signup.id;
  update public.referral_programs set successful_referrals = v_count
  where user_id = v_program.user_id;

  if v_count = 5 then
    select current_period_end, complimentary_pro_until
    into v_current_period_end, v_existing_comp
    from public.billing_accounts where user_id = v_program.user_id;
    v_reward_end := greatest(now(), coalesce(v_current_period_end, now()), coalesce(v_existing_comp, now())) + interval '1 month';
    update public.referral_programs
    set reward_granted_at = now(), reward_expires_at = v_reward_end
    where user_id = v_program.user_id and reward_granted_at is null;
    select email into v_inviter_email from auth.users where id = v_program.user_id;
    insert into public.billing_accounts(user_id, billing_email, complimentary_pro_until)
    values(v_program.user_id, v_inviter_email, v_reward_end)
    on conflict(user_id) do update
      set complimentary_pro_until = excluded.complimentary_pro_until, updated_at = now();
  end if;

  return jsonb_build_object(
    'qualified', true,
    'inviter_user_id', v_program.user_id,
    'successful_referrals', v_count,
    'reward_granted', v_count = 5,
    'reward_expires_at', v_reward_end
  );
end;
$$;

create or replace function public.reconcile_plan_projects(
  p_user_id uuid,
  p_effective_pro boolean,
  p_free_project_limit integer default 2
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_frozen integer := 0;
  v_unfrozen integer := 0;
begin
  if p_user_id is null or p_free_project_limit < 0 then
    raise exception 'invalid reconciliation input';
  end if;

  if p_effective_pro then
    update public.projects
    set plan_frozen_at = null, plan_freeze_reason = null
    where owner_user_id = p_user_id and plan_freeze_reason = 'downgrade';
    get diagnostics v_unfrozen = row_count;
  else
    update public.projects p
    set plan_frozen_at = now(), plan_freeze_reason = 'downgrade'
    where p.owner_user_id = p_user_id
      and p.plan_frozen_at is null
      and not (p.settings @> '{"internal_feedback_project":true}'::jsonb)
      and p.id not in (
        select keep.id from public.projects keep
        where keep.owner_user_id = p_user_id
          and not (keep.settings @> '{"internal_feedback_project":true}'::jsonb)
        order by (keep.plan_frozen_at is null) desc, keep.updated_at desc, keep.created_at desc, keep.id
        limit p_free_project_limit
      );
    get diagnostics v_frozen = row_count;
  end if;

  return jsonb_build_object('frozen', v_frozen, 'unfrozen', v_unfrozen);
end;
$$;

revoke execute on function public.register_referral_signup(uuid, text, text, text, text)
  from public, anon, authenticated;
revoke execute on function public.qualify_referral_signup(uuid)
  from public, anon, authenticated;
revoke execute on function public.reconcile_plan_projects(uuid, boolean, integer)
  from public, anon, authenticated;
grant execute on function public.register_referral_signup(uuid, text, text, text, text) to service_role;
grant execute on function public.qualify_referral_signup(uuid) to service_role;
grant execute on function public.reconcile_plan_projects(uuid, boolean, integer) to service_role;

-- Retire the original immediate-credit path so future server code cannot
-- accidentally bypass maturation and activation qualification.
drop function if exists public.claim_referral_signup(uuid, text);
