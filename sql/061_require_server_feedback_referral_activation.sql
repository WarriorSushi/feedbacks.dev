-- Require a server-observed feedback submission before a referral can qualify.
-- Client-reported verification remains useful onboarding analytics, but it is
-- not sufficient evidence for a complimentary paid-plan reward.

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
    and event_name = 'first_feedback_received'
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

revoke execute on function public.qualify_referral_signup(uuid)
  from public, anon, authenticated;
grant execute on function public.qualify_referral_signup(uuid)
  to service_role;
