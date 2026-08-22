-- 066: Count an Early Adopter seat only when guided onboarding activates Pro.
-- Email capture creates a claim-ready membership but does not consume capacity.
-- The programme row serializes final claims so concurrent tour completions cannot
-- allocate the same seat or exceed the fixed cohort size.

alter table public.early_adopter_memberships
  alter column seat_number drop not null;

-- Release places that were allocated by the old email-first flow but never
-- completed onboarding. Completed members keep their original seat number.
update public.early_adopter_memberships
set seat_number = null
where onboarding_completed_at is null;

update public.early_adopter_programmes programme
set enrolment_open = (
  select count(*) < programme.capacity
  from public.early_adopter_memberships membership
  where membership.seat_number is not null
)
where programme.id = 1;

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
  where email_hash = p_email_hash
  for update;

  if found then
    if v_membership.seat_number is null and not v_program.enrolment_open then
      update public.early_adopter_memberships
      set status = 'removed', removed_at = coalesce(removed_at, pg_catalog.now())
      where id = v_membership.id;
      return jsonb_build_object('accepted', false, 'reason', 'capacity_full', 'alreadyJoined', true);
    end if;

    return jsonb_build_object(
      'accepted', v_membership.status <> 'removed',
      'seatNumber', v_membership.seat_number,
      'status', v_membership.status,
      'alreadyJoined', true,
      'claimReady', v_membership.seat_number is null
    );
  end if;

  if not v_program.enrolment_open then
    return jsonb_build_object('accepted', false, 'reason', 'capacity_full');
  end if;

  insert into public.early_adopter_memberships (email, email_hash)
  values (lower(trim(p_email)), p_email_hash)
  returning * into v_membership;

  return jsonb_build_object(
    'accepted', true,
    'seatNumber', null,
    'status', v_membership.status,
    'alreadyJoined', false,
    'claimReady', true
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
  v_program public.early_adopter_programmes%rowtype;
  v_membership public.early_adopter_memberships%rowtype;
begin
  select * into v_program
  from public.early_adopter_programmes
  where id = 1
  for update;

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
  if v_membership.seat_number is null and not v_program.enrolment_open then
    update public.early_adopter_memberships
    set status = 'removed', removed_at = coalesce(removed_at, pg_catalog.now())
    where id = v_membership.id;
    return jsonb_build_object('linked', false, 'reason', 'capacity_full');
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
    'status', v_membership.status,
    'claimReady', v_membership.seat_number is null
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
  v_program public.early_adopter_programmes%rowtype;
  v_membership public.early_adopter_memberships%rowtype;
  v_preferences jsonb;
  v_account public.billing_accounts%rowtype;
  v_next_seat integer;
  v_reward_base timestamptz;
  v_reward_end timestamptz;
  v_now timestamptz := pg_catalog.now();
begin
  select * into v_program
  from public.early_adopter_programmes
  where id = 1
  for update;

  select * into v_membership
  from public.early_adopter_memberships
  where user_id = p_user_id
  for update;

  if not found then return jsonb_build_object('granted', false, 'reason', 'not_enrolled'); end if;
  if v_membership.onboarding_completed_at is not null then
    return jsonb_build_object(
      'granted', false,
      'reason', 'already_completed',
      'seatNumber', v_membership.seat_number,
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

  select candidate.seat_number into v_next_seat
  from pg_catalog.generate_series(1, v_program.capacity) as candidate(seat_number)
  where not exists (
    select 1
    from public.early_adopter_memberships claimed
    where claimed.seat_number = candidate.seat_number
  )
  order by candidate.seat_number
  limit 1;

  if not v_program.enrolment_open or v_next_seat is null then
    update public.early_adopter_programmes
    set enrolment_open = false
    where id = 1;
    update public.early_adopter_memberships
    set status = 'removed', removed_at = coalesce(removed_at, v_now)
    where id = v_membership.id;
    return jsonb_build_object('granted', false, 'reason', 'capacity_full');
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
  set seat_number = v_next_seat,
      status = 'active',
      onboarding_completed_at = v_now,
      pro_months_earned = 1,
      feedback_opens_at = (v_now + interval '1 month') - interval '7 days',
      feedback_due_at = v_now + interval '1 month',
      grace_ends_at = v_now + interval '3 months',
      programme_expires_at = v_now + interval '14 months'
  where id = v_membership.id
  returning * into v_membership;

  if (
    select count(*) >= v_program.capacity
    from public.early_adopter_memberships
    where seat_number is not null
  ) then
    update public.early_adopter_programmes
    set enrolment_open = false
    where id = 1;
  end if;

  return jsonb_build_object(
    'granted', true,
    'seatNumber', v_membership.seat_number,
    'proMonthsEarned', 1,
    'complimentaryProUntil', v_reward_end,
    'feedbackOpensAt', v_membership.feedback_opens_at,
    'feedbackDueAt', v_membership.feedback_due_at
  );
end;
$$;

revoke execute on function public.accept_early_adopter(text, text) from public, anon, authenticated;
revoke execute on function public.activate_early_adopter_membership(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.complete_early_adopter_onboarding(uuid) from public, anon, authenticated;
grant execute on function public.accept_early_adopter(text, text) to service_role;
grant execute on function public.activate_early_adopter_membership(uuid, text, text) to service_role;
grant execute on function public.complete_early_adopter_onboarding(uuid) to service_role;
