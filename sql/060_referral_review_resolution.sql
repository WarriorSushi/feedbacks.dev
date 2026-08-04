-- 060: Make referral safety review an operable state instead of a dead end.
-- The service-only resolver never skips maturation, verified identity, or
-- activation checks. Approval returns the signup to the normal atomic
-- qualification path; rejection is final.

alter table public.user_acquisition
  drop constraint if exists user_acquisition_network_hash_check;
alter table public.user_acquisition
  add constraint user_acquisition_network_hash_check
  check (network_hash is null or network_hash ~ '^[0-9a-f]{64}$');

alter table public.user_acquisition
  drop constraint if exists user_acquisition_device_hash_check;
alter table public.user_acquisition
  add constraint user_acquisition_device_hash_check
  check (device_hash is null or device_hash ~ '^[0-9a-f]{64}$');

alter table public.referral_signups
  drop constraint if exists referral_signups_network_hash_check;
alter table public.referral_signups
  add constraint referral_signups_network_hash_check
  check (network_hash is null or network_hash ~ '^[0-9a-f]{64}$');

alter table public.referral_signups
  drop constraint if exists referral_signups_device_hash_check;
alter table public.referral_signups
  add constraint referral_signups_device_hash_check
  check (device_hash is null or device_hash ~ '^[0-9a-f]{64}$');

create or replace function public.resolve_referral_review(
  p_signup_id uuid,
  p_approved boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_signup public.referral_signups%rowtype;
  v_qualification jsonb;
begin
  if p_signup_id is null or p_approved is null then
    return jsonb_build_object('resolved', false, 'reason', 'invalid_input');
  end if;

  select * into v_signup
  from public.referral_signups
  where id = p_signup_id
  for update;

  if not found then
    return jsonb_build_object('resolved', false, 'reason', 'not_found');
  end if;
  if v_signup.status <> 'review' then
    return jsonb_build_object('resolved', false, 'reason', 'not_in_review');
  end if;

  if not p_approved then
    update public.referral_signups
    set status = 'rejected',
        rejected_at = now(),
        risk_reasons = array_append(risk_reasons, 'manual_review_rejected')
    where id = v_signup.id;
    return jsonb_build_object('resolved', true, 'decision', 'rejected');
  end if;

  update public.referral_signups
  set status = 'pending',
      risk_reasons = array_append(risk_reasons, 'manual_review_approved')
  where id = v_signup.id;

  select public.qualify_referral_signup(v_signup.invited_user_id)
  into v_qualification;

  return jsonb_build_object(
    'resolved', true,
    'decision', 'approved',
    'qualification', v_qualification
  );
end;
$$;

revoke execute on function public.resolve_referral_review(uuid, boolean)
  from public, anon, authenticated;
grant execute on function public.resolve_referral_review(uuid, boolean)
  to service_role;
