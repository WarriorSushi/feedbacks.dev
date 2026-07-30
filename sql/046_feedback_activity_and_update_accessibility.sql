-- Durable triage history and accessible Product Update media metadata.

alter table public.product_updates
  add column if not exists image_alt_text text;

alter table public.product_updates
  drop constraint if exists product_updates_image_alt_text_length;

alter table public.product_updates
  add constraint product_updates_image_alt_text_length
  check (image_alt_text is null or char_length(image_alt_text) <= 160);

create table if not exists public.feedback_activity (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null check (
    event_type in (
      'created',
      'status_changed',
      'priority_changed',
      'tags_changed',
      'archived',
      'restored',
      'visibility_changed',
      'note_added',
      'public_reply_added'
    )
  ),
  from_value jsonb,
  to_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_feedback_activity_feedback_created
  on public.feedback_activity(feedback_id, created_at desc);

create index if not exists idx_feedback_activity_project_created
  on public.feedback_activity(project_id, created_at desc);

alter table public.feedback_activity enable row level security;

drop policy if exists "feedback_activity_select_owned" on public.feedback_activity;
create policy "feedback_activity_select_owned"
  on public.feedback_activity
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = feedback_activity.project_id
        and projects.owner_user_id = (select auth.uid())
    )
  );

revoke insert, update, delete on public.feedback_activity from anon, authenticated;
grant select on public.feedback_activity to authenticated;

create or replace function public.record_feedback_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.feedback_activity (
      feedback_id, project_id, actor_id, event_type, to_value, created_at
    )
    values (
      new.id, new.project_id, (select auth.uid()), 'created',
      jsonb_build_object('status', new.status, 'priority', new.priority),
      coalesce(new.created_at, now())
    );
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.feedback_activity (
      feedback_id, project_id, actor_id, event_type, from_value, to_value
    )
    values (
      new.id, new.project_id, (select auth.uid()), 'status_changed',
      to_jsonb(old.status), to_jsonb(new.status)
    );
  end if;

  if old.priority is distinct from new.priority then
    insert into public.feedback_activity (
      feedback_id, project_id, actor_id, event_type, from_value, to_value
    )
    values (
      new.id, new.project_id, (select auth.uid()), 'priority_changed',
      to_jsonb(old.priority), to_jsonb(new.priority)
    );
  end if;

  if old.tags is distinct from new.tags then
    insert into public.feedback_activity (
      feedback_id, project_id, actor_id, event_type, from_value, to_value
    )
    values (
      new.id, new.project_id, (select auth.uid()), 'tags_changed',
      to_jsonb(coalesce(old.tags, '{}'::text[])),
      to_jsonb(coalesce(new.tags, '{}'::text[]))
    );
  end if;

  if old.is_archived is distinct from new.is_archived then
    insert into public.feedback_activity (
      feedback_id, project_id, actor_id, event_type, from_value, to_value
    )
    values (
      new.id, new.project_id, (select auth.uid()),
      case when new.is_archived then 'archived' else 'restored' end,
      to_jsonb(old.is_archived), to_jsonb(new.is_archived)
    );
  end if;

  if old.is_public is distinct from new.is_public then
    insert into public.feedback_activity (
      feedback_id, project_id, actor_id, event_type, from_value, to_value
    )
    values (
      new.id, new.project_id, (select auth.uid()), 'visibility_changed',
      to_jsonb(old.is_public), to_jsonb(new.is_public)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists feedback_activity_changes on public.feedback;
create trigger feedback_activity_changes
after insert or update of status, priority, tags, is_archived, is_public
on public.feedback
for each row execute function public.record_feedback_activity();

create or replace function public.record_feedback_note_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_project_id uuid;
begin
  select feedback.project_id
    into target_project_id
  from public.feedback
  where feedback.id = new.feedback_id;

  if target_project_id is not null then
    insert into public.feedback_activity (
      feedback_id, project_id, actor_id, event_type, metadata, created_at
    )
    values (
      new.feedback_id,
      target_project_id,
      coalesce(new.user_id, (select auth.uid())),
      case when new.is_public then 'public_reply_added' else 'note_added' end,
      jsonb_build_object('noteId', new.id),
      coalesce(new.created_at, now())
    );
  end if;

  return new;
end;
$$;

drop trigger if exists feedback_note_activity_insert on public.feedback_notes;
create trigger feedback_note_activity_insert
after insert on public.feedback_notes
for each row execute function public.record_feedback_note_activity();

-- Previous rate-limit keys were short-lived and may contain raw identifiers from
-- the pre-HMAC implementation. Clearing them is safer than attempting to migrate
-- ephemeral counters.
delete from public.rate_limits;

create or replace function public.get_owner_project_health()
returns table (
  project_id uuid,
  feedback_count bigint,
  unread_count bigint,
  latest_feedback_at timestamptz,
  embed_last_seen_at timestamptz,
  failed_delivery_count bigint,
  board_enabled boolean,
  board_visibility text,
  board_listed boolean,
  updates_enabled boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    project.id as project_id,
    coalesce(feedback_summary.feedback_count, 0)::bigint,
    coalesce(feedback_summary.unread_count, 0)::bigint,
    feedback_summary.latest_feedback_at,
    installation.last_seen_at as embed_last_seen_at,
    coalesce(delivery_summary.failed_delivery_count, 0)::bigint,
    coalesce(board.enabled, false) as board_enabled,
    board.visibility as board_visibility,
    coalesce(board.directory_opt_in, false) as board_listed,
    coalesce(update_settings.enabled, false) as updates_enabled
  from public.projects as project
  left join lateral (
    select
      count(*) filter (where feedback.is_archived = false) as feedback_count,
      count(*) filter (
        where feedback.is_archived = false and feedback.read_at is null
      ) as unread_count,
      max(feedback.created_at) filter (where feedback.is_archived = false) as latest_feedback_at
    from public.feedback
    where feedback.project_id = project.id
  ) as feedback_summary on true
  left join public.project_embed_installations as installation
    on installation.project_id = project.id
  left join lateral (
    select count(*) as failed_delivery_count
    from public.webhook_deliveries
    where webhook_deliveries.project_id = project.id
      and webhook_deliveries.status = 'failed'
      and webhook_deliveries.created_at >= now() - interval '7 days'
  ) as delivery_summary on true
  left join public.public_board_settings as board
    on board.project_id = project.id
  left join public.product_update_settings as update_settings
    on update_settings.project_id = project.id
  where project.owner_user_id = (select auth.uid())
    and coalesce(project.environment, 'production') = 'production'
    and project.quarantined_at is null
  order by project.created_at desc;
$$;

revoke all on function public.get_owner_project_health() from public, anon;
grant execute on function public.get_owner_project_health() to authenticated;
