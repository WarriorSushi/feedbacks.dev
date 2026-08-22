-- 065: Auto-accepted Early Adopter Programme with monthly feedback renewals.
-- The programme is capped at 100 seats. All writes and lifecycle transitions are
-- service-only so complimentary access cannot be granted from the browser.

create table if not exists public.early_adopter_programmes (
  id smallint primary key default 1 check (id = 1),
  capacity integer not null default 100 check (capacity between 1 and 100),
  enrolment_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.early_adopter_programmes (id, capacity, enrolment_open)
values (1, 100, true)
on conflict (id) do update set capacity = 100;

alter table public.cron_runs drop constraint if exists cron_runs_job_name_check;
alter table public.cron_runs add constraint cron_runs_job_name_check
  check (job_name in ('webhook_jobs', 'notification_digests', 'account_deletions', 'e2e_cleanup', 'billing_lifecycle', 'early_adopter_lifecycle'));

create table if not exists public.early_adopter_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text not null,
  email_hash text not null unique,
  seat_number integer not null unique check (seat_number between 1 and 100),
  status text not null default 'accepted'
    check (status in ('accepted', 'onboarding', 'active', 'grace', 'finishing', 'completed', 'removed')),
  accepted_at timestamptz not null default now(),
  account_linked_at timestamptz,
  onboarding_completed_at timestamptz,
  pro_months_earned integer not null default 0 check (pro_months_earned between 0 and 12),
  feedback_opens_at timestamptz,
  feedback_due_at timestamptz,
  grace_ends_at timestamptz,
  programme_expires_at timestamptz,
  programme_ends_at timestamptz,
  last_feedback_at timestamptz,
  completed_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists early_adopter_memberships_lifecycle_idx
  on public.early_adopter_memberships(status, feedback_opens_at, feedback_due_at, grace_ends_at);

create table if not exists public.early_adopter_feedback (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.early_adopter_memberships(id) on delete cascade,
  cycle_number integer not null check (cycle_number between 2 and 12),
  good text not null check (char_length(good) between 3 and 2000),
  bad text not null check (char_length(bad) between 3 and 2000),
  improve text not null check (char_length(improve) between 3 and 2000),
  anything_else text check (anything_else is null or char_length(anything_else) <= 2000),
  submitted_at timestamptz not null default now(),
  unique (membership_id, cycle_number)
);

create table if not exists public.early_adopter_notices (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.early_adopter_memberships(id) on delete cascade,
  cycle_number integer not null check (cycle_number between 1 and 12),
  notice_type text not null check (notice_type in (
    'feedback_window_open',
    'feedback_due',
    'grace_month_one',
    'grace_final_week',
    'programme_removed',
    'programme_completed'
  )),
  sent_at timestamptz not null default now(),
  unique (membership_id, cycle_number, notice_type)
);

drop trigger if exists trg_early_adopter_programmes_updated_at on public.early_adopter_programmes;
create trigger trg_early_adopter_programmes_updated_at
  before update on public.early_adopter_programmes
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_early_adopter_memberships_updated_at on public.early_adopter_memberships;
create trigger trg_early_adopter_memberships_updated_at
  before update on public.early_adopter_memberships
  for each row execute function public.touch_updated_at();

alter table public.early_adopter_programmes enable row level security;
alter table public.early_adopter_memberships enable row level security;
alter table public.early_adopter_feedback enable row level security;
alter table public.early_adopter_notices enable row level security;

revoke all on table public.early_adopter_programmes from public, anon, authenticated;
revoke all on table public.early_adopter_memberships from public, anon, authenticated;
revoke all on table public.early_adopter_feedback from public, anon, authenticated;
revoke all on table public.early_adopter_notices from public, anon, authenticated;
grant select, insert, update, delete on table public.early_adopter_programmes to service_role;
grant select, insert, update, delete on table public.early_adopter_memberships to service_role;
grant select, insert, update, delete on table public.early_adopter_feedback to service_role;
grant select, insert, update, delete on table public.early_adopter_notices to service_role;

drop policy if exists "early_adopter_programmes_service_only" on public.early_adopter_programmes;
create policy "early_adopter_programmes_service_only" on public.early_adopter_programmes as restrictive for all
  to anon, authenticated using (false) with check (false);
drop policy if exists "early_adopter_memberships_service_only" on public.early_adopter_memberships;
create policy "early_adopter_memberships_service_only" on public.early_adopter_memberships as restrictive for all
  to anon, authenticated using (false) with check (false);
drop policy if exists "early_adopter_feedback_service_only" on public.early_adopter_feedback;
create policy "early_adopter_feedback_service_only" on public.early_adopter_feedback as restrictive for all
  to anon, authenticated using (false) with check (false);
drop policy if exists "early_adopter_notices_service_only" on public.early_adopter_notices;
create policy "early_adopter_notices_service_only" on public.early_adopter_notices as restrictive for all
  to anon, authenticated using (false) with check (false);

create or replace function public.accept_early_adopter(
  p_email text,
  p_email_hash text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_program public.early_adopter_programmes%rowtype;
  v_membership public.early_adopter_memberships%rowtype;
  v_next_seat integer;
begin
  if p_email is null or char_length(trim(p_email)) < 3 or p_email_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_early_adopter_identity';
  end if;

  select * into v_program
  from public.early_adopter_programmes
  where id = 1
  for update;

  select * into v_membership
  from public.early_adopter_memberships
  where email_hash = p_email_hash;

  if found then
    return jsonb_build_object(
      'accepted', v_membership.status <> 'removed',
      'seatNumber', v_membership.seat_number,
      'status', v_membership.status,
      'alreadyJoined', true
    );
  end if;

  select coalesce(max(seat_number), 0) + 1 into v_next_seat
  from public.early_adopter_memberships;

  if not v_program.enrolment_open or v_next_seat > v_program.capacity then
    return jsonb_build_object('accepted', false, 'reason', 'capacity_full');
  end if;

  insert into public.early_adopter_memberships (email, email_hash, seat_number)
  values (lower(trim(p_email)), p_email_hash, v_next_seat)
  returning * into v_membership;

  if v_next_seat >= v_program.capacity then
    update public.early_adopter_programmes
    set enrolment_open = false
    where id = 1;
  end if;

  return jsonb_build_object(
    'accepted', true,
    'seatNumber', v_membership.seat_number,
    'status', v_membership.status,
    'alreadyJoined', false
  );
end;
$$;

create or replace function public.activate_early_adopter_membership(
  p_user_id uuid,
  p_email text,
  p_email_hash text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_membership public.early_adopter_memberships%rowtype;
begin
  select * into v_membership
  from public.early_adopter_memberships
  where email_hash = p_email_hash
  for update;

  if not found then return jsonb_build_object('linked', false, 'reason', 'not_enrolled'); end if;
  if v_membership.user_id is not null and v_membership.user_id <> p_user_id then
    return jsonb_build_object('linked', false, 'reason', 'already_linked');
  end if;
  if v_membership.status = 'removed' then
    return jsonb_build_object('linked', false, 'reason', 'removed');
  end if;

  update public.early_adopter_memberships
  set user_id = p_user_id,
      email = lower(trim(p_email)),
      account_linked_at = coalesce(account_linked_at, pg_catalog.now()),
      status = case when status = 'accepted' then 'onboarding' else status end
  where id = v_membership.id
  returning * into v_membership;

  return jsonb_build_object(
    'linked', true,
    'membershipId', v_membership.id,
    'seatNumber', v_membership.seat_number,
    'status', v_membership.status
  );
end;
$$;

create or replace function public.complete_early_adopter_onboarding(p_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_membership public.early_adopter_memberships%rowtype;
  v_preferences jsonb;
  v_account public.billing_accounts%rowtype;
  v_reward_base timestamptz;
  v_reward_end timestamptz;
  v_now timestamptz := pg_catalog.now();
begin
  select * into v_membership
  from public.early_adopter_memberships
  where user_id = p_user_id
  for update;

  if not found then return jsonb_build_object('granted', false, 'reason', 'not_enrolled'); end if;
  if v_membership.onboarding_completed_at is not null then
    return jsonb_build_object(
      'granted', false,
      'reason', 'already_completed',
      'proMonthsEarned', v_membership.pro_months_earned,
      'feedbackOpensAt', v_membership.feedback_opens_at,
      'feedbackDueAt', v_membership.feedback_due_at
    );
  end if;

  select preferences into v_preferences
  from public.user_settings
  where user_id = p_user_id;
  if coalesce(v_preferences ->> 'productTourCompletedAt', '') = '' then
    return jsonb_build_object('granted', false, 'reason', 'tour_incomplete');
  end if;

  insert into public.billing_accounts (user_id, billing_email)
  values (p_user_id, v_membership.email)
  on conflict (user_id) do nothing;

  select * into v_account
  from public.billing_accounts
  where user_id = p_user_id
  for update;

  v_reward_base := greatest(
    v_now,
    coalesce(v_account.current_period_end, v_now),
    coalesce(v_account.complimentary_pro_until, v_now)
  );
  v_reward_end := v_reward_base + interval '1 month';

  update public.billing_accounts
  set complimentary_pro_until = v_reward_end,
      billing_email = coalesce(billing_email, v_membership.email),
      updated_at = v_now
  where user_id = p_user_id;

  update public.early_adopter_memberships
  set status = 'active',
      onboarding_completed_at = v_now,
      pro_months_earned = 1,
      feedback_opens_at = (v_now + interval '1 month') - interval '7 days',
      feedback_due_at = v_now + interval '1 month',
      grace_ends_at = v_now + interval '3 months',
      programme_expires_at = v_now + interval '14 months'
  where id = v_membership.id
  returning * into v_membership;

  return jsonb_build_object(
    'granted', true,
    'proMonthsEarned', 1,
    'complimentaryProUntil', v_reward_end,
    'feedbackOpensAt', v_membership.feedback_opens_at,
    'feedbackDueAt', v_membership.feedback_due_at
  );
end;
$$;

create or replace function public.submit_early_adopter_feedback(
  p_user_id uuid,
  p_good text,
  p_bad text,
  p_improve text,
  p_anything_else text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_membership public.early_adopter_memberships%rowtype;
  v_account public.billing_accounts%rowtype;
  v_cycle integer;
  v_reward_base timestamptz;
  v_reward_end timestamptz;
  v_now timestamptz := pg_catalog.now();
begin
  select * into v_membership
  from public.early_adopter_memberships
  where user_id = p_user_id
  for update;

  if not found then return jsonb_build_object('renewed', false, 'reason', 'not_enrolled'); end if;
  if v_membership.status in ('accepted', 'onboarding') then return jsonb_build_object('renewed', false, 'reason', 'onboarding_incomplete'); end if;
  if v_membership.status in ('completed', 'finishing') or v_membership.pro_months_earned >= 12 then
    return jsonb_build_object('renewed', false, 'reason', 'programme_complete');
  end if;
  if v_membership.status = 'removed'
     or v_now > coalesce(v_membership.grace_ends_at, v_now)
     or v_now > coalesce(v_membership.programme_expires_at, v_now) then
    update public.early_adopter_memberships
    set status = 'removed', removed_at = coalesce(removed_at, v_now)
    where id = v_membership.id;
    return jsonb_build_object('renewed', false, 'reason', 'grace_expired');
  end if;
  if v_now < coalesce(v_membership.feedback_opens_at, v_now + interval '1 day') then
    return jsonb_build_object('renewed', false, 'reason', 'feedback_not_open', 'feedbackOpensAt', v_membership.feedback_opens_at);
  end if;

  if char_length(trim(coalesce(p_good, ''))) < 3
     or char_length(trim(coalesce(p_bad, ''))) < 3
     or char_length(trim(coalesce(p_improve, ''))) < 3 then
    return jsonb_build_object('renewed', false, 'reason', 'feedback_incomplete');
  end if;

  v_cycle := v_membership.pro_months_earned + 1;
  insert into public.early_adopter_feedback (
    membership_id, cycle_number, good, bad, improve, anything_else
  ) values (
    v_membership.id,
    v_cycle,
    left(trim(p_good), 2000),
    left(trim(p_bad), 2000),
    left(trim(p_improve), 2000),
    nullif(left(trim(coalesce(p_anything_else, '')), 2000), '')
  ) on conflict (membership_id, cycle_number) do nothing;

  if not found then return jsonb_build_object('renewed', false, 'reason', 'already_submitted'); end if;

  insert into public.billing_accounts (user_id, billing_email)
  values (p_user_id, v_membership.email)
  on conflict (user_id) do nothing;

  select * into v_account
  from public.billing_accounts
  where user_id = p_user_id
  for update;

  v_reward_base := greatest(
    v_now,
    coalesce(v_account.current_period_end, v_now),
    coalesce(v_account.complimentary_pro_until, v_now)
  );
  v_reward_end := v_reward_base + interval '1 month';

  update public.billing_accounts
  set complimentary_pro_until = v_reward_end,
      billing_email = coalesce(billing_email, v_membership.email),
      updated_at = v_now
  where user_id = p_user_id;

  update public.early_adopter_memberships
  set status = case when v_cycle = 12 then 'finishing' else 'active' end,
      pro_months_earned = v_cycle,
      last_feedback_at = v_now,
      feedback_opens_at = case
        when v_cycle = 12 then null
        else greatest(v_now, least(v_now + interval '1 month', programme_expires_at) - interval '7 days')
      end,
      feedback_due_at = case when v_cycle = 12 then null else least(v_now + interval '1 month', programme_expires_at) end,
      grace_ends_at = case when v_cycle = 12 then null else least(v_now + interval '3 months', programme_expires_at) end,
      programme_ends_at = case when v_cycle = 12 then v_now + interval '1 month' else programme_ends_at end
  where id = v_membership.id
  returning * into v_membership;

  return jsonb_build_object(
    'renewed', true,
    'proMonthsEarned', v_cycle,
    'complimentaryProUntil', v_reward_end,
    'status', v_membership.status,
    'feedbackOpensAt', v_membership.feedback_opens_at,
    'feedbackDueAt', v_membership.feedback_due_at,
    'programmeEndsAt', v_membership.programme_ends_at
  );
end;
$$;

-- Bring any legacy programme applicants into the new automatically accepted
-- programme in application order, up to the fixed 100-seat capacity.
insert into public.early_adopter_memberships (
  email, email_hash, seat_number, status, accepted_at, created_at, updated_at
)
select
  candidate.email,
  candidate.email_hash,
  candidate.seat_number,
  'accepted',
  candidate.applied_at,
  candidate.applied_at,
  pg_catalog.now()
from (
  select email, email_hash, applied_at,
         row_number() over (order by applied_at asc, id asc)::integer as seat_number
  from public.beta_applications
) candidate
where candidate.seat_number <= 100
on conflict (email_hash) do nothing;

update public.early_adopter_programmes
set enrolment_open = (
  select count(*) < public.early_adopter_programmes.capacity
  from public.early_adopter_memberships
)
where id = 1;

revoke execute on function public.accept_early_adopter(text, text) from public, anon, authenticated;
revoke execute on function public.activate_early_adopter_membership(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.complete_early_adopter_onboarding(uuid) from public, anon, authenticated;
revoke execute on function public.submit_early_adopter_feedback(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.accept_early_adopter(text, text) to service_role;
grant execute on function public.activate_early_adopter_membership(uuid, text, text) to service_role;
grant execute on function public.complete_early_adopter_onboarding(uuid) to service_role;
grant execute on function public.submit_early_adopter_feedback(uuid, text, text, text, text) to service_role;
