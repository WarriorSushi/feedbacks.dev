-- 063: Serialize quota-bearing writes per owner so concurrent requests cannot
-- oversubscribe Free project or monthly feedback limits. These RPCs are
-- service-role-only because they deliberately bypass RLS for public ingress.

-- All customer project mutations are mediated by authenticated server routes.
-- Keeping direct Data API mutation policies would let a browser bypass quotas,
-- forge the internal-project exemption, mutate privileged state, or skip
-- server-side deletion cleanup.
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;
revoke insert, update, delete on table public.projects from anon, authenticated;
grant select, insert, update, delete on table public.projects to service_role;

create or replace function public.create_project_with_quota(
  p_project jsonb,
  p_bypass_quota boolean default false,
  p_free_project_limit integer default 2
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_user_id uuid;
  v_creation_request_id uuid;
  v_existing public.projects%rowtype;
  v_project public.projects%rowtype;
  v_project_count integer := 0;
  v_effective_pro boolean := false;
begin
  if p_project is null or jsonb_typeof(p_project) <> 'object' then
    raise exception 'project payload must be an object';
  end if;
  if p_free_project_limit < 0 then
    raise exception 'free project limit must not be negative';
  end if;

  v_owner_user_id := nullif(p_project->>'owner_user_id', '')::uuid;
  v_creation_request_id := nullif(p_project->>'creation_request_id', '')::uuid;
  if v_owner_user_id is null then
    raise exception 'project owner is required';
  end if;

  -- Every quota-bearing write for an owner uses this same transaction lock.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('feedbacks.dev:quota:' || v_owner_user_id::text, 0)
  );

  -- Replays are resolved while holding the lock and never consume another slot.
  if v_creation_request_id is not null then
    select * into v_existing
    from public.projects project
    where project.owner_user_id = v_owner_user_id
      and project.creation_request_id = v_creation_request_id;

    if found then
      return pg_catalog.jsonb_build_object(
        'status', 'replayed',
        'project', pg_catalog.to_jsonb(v_existing) - 'api_key' - 'api_key_hash' - 'creation_request_id'
      );
    end if;
  end if;

  select coalesce(
    account.complimentary_pro_until > pg_catalog.now()
    or (
      account.cancel_at_period_end
      and account.current_period_end > pg_catalog.now()
      and account.billing_status in ('active', 'trialing', 'cancelled')
    )
    or account.billing_status in ('active', 'trialing'),
    false
  ) into v_effective_pro
  from public.billing_accounts account
  where account.user_id = v_owner_user_id;

  v_effective_pro := coalesce(v_effective_pro, false);

  select count(*)::integer into v_project_count
  from public.projects project
  where project.owner_user_id = v_owner_user_id
    and not (project.settings @> '{"internal_feedback_project":true}'::jsonb);

  if not p_bypass_quota
    and not v_effective_pro
    and v_project_count >= p_free_project_limit
  then
    return pg_catalog.jsonb_build_object(
      'status', 'quota_reached',
      'project_count', v_project_count,
      'project_limit', p_free_project_limit,
      'effective_pro', false
    );
  end if;

  insert into public.projects (
    id,
    owner_user_id,
    name,
    creation_request_id,
    api_key,
    api_key_hash,
    api_key_last_four,
    domain,
    webhooks,
    settings,
    created_at,
    updated_at,
    environment,
    test_namespace,
    expires_at,
    quarantined_at
  ) values (
    (p_project->>'id')::uuid,
    v_owner_user_id,
    p_project->>'name',
    v_creation_request_id,
    null,
    null,
    nullif(p_project->>'api_key_last_four', ''),
    nullif(p_project->>'domain', ''),
    coalesce(p_project->'webhooks', '{}'::jsonb),
    coalesce(p_project->'settings', '{}'::jsonb),
    coalesce(nullif(p_project->>'created_at', '')::timestamptz, pg_catalog.now()),
    coalesce(nullif(p_project->>'updated_at', '')::timestamptz, pg_catalog.now()),
    coalesce(nullif(p_project->>'environment', ''), 'production'),
    nullif(p_project->>'test_namespace', ''),
    nullif(p_project->>'expires_at', '')::timestamptz,
    nullif(p_project->>'quarantined_at', '')::timestamptz
  )
  returning * into v_project;

  return pg_catalog.jsonb_build_object(
    'status', 'created',
    'project_count', v_project_count + 1,
    'effective_pro', v_effective_pro,
    'project', pg_catalog.to_jsonb(v_project) - 'api_key' - 'api_key_hash' - 'creation_request_id'
  );
end;
$$;

create or replace function public.insert_feedback_with_quota(
  p_feedback jsonb,
  p_media jsonb default '[]'::jsonb,
  p_bypass_quota boolean default false,
  p_bypass_plan_freeze boolean default false,
  p_allow_replay boolean default false,
  p_record_first_feedback boolean default false,
  p_free_feedback_limit integer default 500
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_feedback public.feedback%rowtype;
  v_existing_id uuid;
  v_owner_user_id uuid;
  v_plan_frozen_at timestamptz;
  v_effective_pro boolean := false;
  v_period_start date := pg_catalog.date_trunc('month', pg_catalog.now() at time zone 'UTC')::date;
  v_usage_count integer := 0;
  v_media record;
begin
  if p_feedback is null or jsonb_typeof(p_feedback) <> 'object' then
    raise exception 'feedback payload must be an object';
  end if;
  if p_media is null or jsonb_typeof(p_media) <> 'array' then
    raise exception 'feedback media payload must be an array';
  end if;
  if p_free_feedback_limit < 0 then
    raise exception 'free feedback limit must not be negative';
  end if;

  v_feedback := pg_catalog.jsonb_populate_record(null::public.feedback, p_feedback);
  if v_feedback.id is null or v_feedback.project_id is null then
    raise exception 'feedback id and project are required';
  end if;

  select project.owner_user_id into v_owner_user_id
  from public.projects project
  where project.id = v_feedback.project_id;
  if v_owner_user_id is null then
    return pg_catalog.jsonb_build_object('status', 'project_not_found');
  end if;

  -- This is the same owner-key used by project creation above. Concurrent
  -- submissions for different projects owned by one account therefore share
  -- the single account-level monthly quota correctly.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('feedbacks.dev:quota:' || v_owner_user_id::text, 0)
  );

  select project.owner_user_id, project.plan_frozen_at
  into v_owner_user_id, v_plan_frozen_at
  from public.projects project
  where project.id = v_feedback.project_id;
  if not found then
    return pg_catalog.jsonb_build_object('status', 'project_not_found');
  end if;
  if v_plan_frozen_at is not null and not p_bypass_plan_freeze then
    return pg_catalog.jsonb_build_object('status', 'project_frozen');
  end if;

  select feedback.id into v_existing_id
  from public.feedback feedback
  where feedback.id = v_feedback.id;
  if v_existing_id is not null then
    if p_allow_replay and exists (
      select 1 from public.feedback feedback
      where feedback.id = v_feedback.id
        and feedback.project_id = v_feedback.project_id
    ) then
      return pg_catalog.jsonb_build_object(
        'status', 'replayed',
        'feedback_id', v_feedback.id
      );
    end if;
    return pg_catalog.jsonb_build_object('status', 'id_conflict');
  end if;

  select coalesce(
    account.complimentary_pro_until > pg_catalog.now()
    or (
      account.cancel_at_period_end
      and account.current_period_end > pg_catalog.now()
      and account.billing_status in ('active', 'trialing', 'cancelled')
    )
    or account.billing_status in ('active', 'trialing'),
    false
  ) into v_effective_pro
  from public.billing_accounts account
  where account.user_id = v_owner_user_id;
  v_effective_pro := coalesce(v_effective_pro, false);

  select coalesce(counter.count, 0) into v_usage_count
  from public.usage_counters counter
  where counter.user_id = v_owner_user_id
    and counter.metric = 'feedback_submissions'
    and counter.period_start = v_period_start;
  v_usage_count := coalesce(v_usage_count, 0);

  if not p_bypass_quota
    and not v_effective_pro
    and v_usage_count >= p_free_feedback_limit
  then
    return pg_catalog.jsonb_build_object(
      'status', 'quota_reached',
      'feedback_count', v_usage_count,
      'feedback_limit', p_free_feedback_limit,
      'effective_pro', false
    );
  end if;

  insert into public.feedback (
    id, project_id, message, email, url, user_agent, type, rating, priority,
    status, tags, screenshot_url, screenshot_path, attachments, metadata,
    is_public, is_archived, read_at, resolved_at, agent_name, agent_session_id,
    structured_data, vote_count, created_at, updated_at
  ) values (
    v_feedback.id,
    v_feedback.project_id,
    v_feedback.message,
    v_feedback.email,
    v_feedback.url,
    v_feedback.user_agent,
    v_feedback.type,
    v_feedback.rating,
    coalesce(v_feedback.priority, 'low'),
    coalesce(v_feedback.status, 'new'),
    coalesce(v_feedback.tags, '{}'::text[]),
    v_feedback.screenshot_url,
    v_feedback.screenshot_path,
    v_feedback.attachments,
    coalesce(v_feedback.metadata, '{}'::jsonb),
    coalesce(v_feedback.is_public, false),
    coalesce(v_feedback.is_archived, false),
    v_feedback.read_at,
    v_feedback.resolved_at,
    v_feedback.agent_name,
    v_feedback.agent_session_id,
    v_feedback.structured_data,
    v_feedback.vote_count,
    coalesce(v_feedback.created_at, pg_catalog.now()),
    coalesce(v_feedback.updated_at, pg_catalog.now())
  );

  for v_media in
    select *
    from pg_catalog.jsonb_to_recordset(p_media) as media(
      id uuid,
      kind text,
      bucket text,
      storage_path text,
      original_filename text,
      safe_filename text,
      mime_type text,
      size_bytes bigint,
      sha256 text,
      scan_status text,
      scanned_at timestamptz
    )
  loop
    insert into public.feedback_media (
      id, feedback_id, project_id, kind, bucket, storage_path,
      original_filename, safe_filename, mime_type, size_bytes, sha256,
      scan_status, scanned_at
    ) values (
      coalesce(v_media.id, pg_catalog.gen_random_uuid()),
      v_feedback.id,
      v_feedback.project_id,
      v_media.kind,
      v_media.bucket,
      v_media.storage_path,
      v_media.original_filename,
      v_media.safe_filename,
      v_media.mime_type,
      v_media.size_bytes,
      v_media.sha256,
      coalesce(v_media.scan_status, 'pending'),
      v_media.scanned_at
    );
  end loop;

  insert into public.usage_counters (user_id, metric, period_start, count)
  values (v_owner_user_id, 'feedback_submissions', v_period_start, 1)
  on conflict (user_id, metric, period_start)
  do update set
    count = public.usage_counters.count + 1,
    updated_at = pg_catalog.now()
  returning count into v_usage_count;

  if p_record_first_feedback then
    insert into public.activation_milestones (
      project_id, event_name, user_id, metadata
    ) values (
      v_feedback.project_id,
      'first_feedback_received',
      v_owner_user_id,
      '{}'::jsonb
    ) on conflict (project_id, event_name) do nothing;
  end if;

  return pg_catalog.jsonb_build_object(
    'status', 'created',
    'feedback_id', v_feedback.id,
    'feedback_count', v_usage_count,
    'feedback_limit', case when v_effective_pro then null else p_free_feedback_limit end,
    'effective_pro', v_effective_pro
  );
end;
$$;

revoke execute on function public.create_project_with_quota(jsonb, boolean, integer)
  from public, anon, authenticated;
revoke execute on function public.insert_feedback_with_quota(jsonb, jsonb, boolean, boolean, boolean, boolean, integer)
  from public, anon, authenticated;
grant execute on function public.create_project_with_quota(jsonb, boolean, integer)
  to service_role;
grant execute on function public.insert_feedback_with_quota(jsonb, jsonb, boolean, boolean, boolean, boolean, integer)
  to service_role;

comment on function public.create_project_with_quota(jsonb, boolean, integer) is
  'Service-only atomic Free-plan project quota enforcement and project insert.';
comment on function public.insert_feedback_with_quota(jsonb, jsonb, boolean, boolean, boolean, boolean, integer) is
  'Service-only atomic feedback quota enforcement, feedback/media insert, usage increment, and optional activation milestone.';
