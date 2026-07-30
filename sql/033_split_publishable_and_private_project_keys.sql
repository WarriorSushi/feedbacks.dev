-- 033_split_publishable_and_private_project_keys.sql
-- Browser embeds use deterministic fb_pub_ project identifiers. Private REST
-- and MCP credentials live here, are hashed at rest, scoped, revocable, and
-- never reused as browser credentials.

create table if not exists public.project_api_keys (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null default 'Default API key'
    check (char_length(name) between 1 and 80),
  key_hash text not null unique
    check (char_length(key_hash) = 64),
  key_last_four text not null
    check (char_length(key_last_four) = 4),
  scopes text[] not null default array[
    'feedback:read',
    'feedback:write',
    'project:read',
    'project:write',
    'setup:read'
  ]::text[],
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  constraint project_api_keys_expiry_after_creation
    check (expires_at is null or expires_at > created_at),
  constraint project_api_keys_known_scopes
    check (
      scopes <@ array[
        'feedback:read',
        'feedback:write',
        'project:read',
        'project:write',
        'setup:read'
      ]::text[]
    )
);

create index if not exists idx_project_api_keys_project_active
  on public.project_api_keys(project_id, created_at desc)
  where revoked_at is null;

alter table public.project_api_keys enable row level security;
revoke all on table public.project_api_keys from public, anon, authenticated;
grant select, insert, update, delete on table public.project_api_keys to service_role;

create table if not exists public.project_api_key_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  api_key_id uuid references public.project_api_keys(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null
    check (event_type in ('created', 'used', 'revoked', 'expired', 'rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_api_key_events_project_created
  on public.project_api_key_events(project_id, created_at desc);

alter table public.project_api_key_events enable row level security;
revoke all on table public.project_api_key_events from public, anon, authenticated;
grant select, insert, update, delete on table public.project_api_key_events to service_role;

create or replace function public.rotate_project_api_key(
  p_project_id uuid,
  p_key_hash text,
  p_key_last_four text,
  p_actor_user_id uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_key_id uuid := gen_random_uuid();
  v_now timestamptz := now();
begin
  update public.project_api_keys
  set revoked_at = v_now
  where project_id = p_project_id
    and revoked_at is null;

  insert into public.project_api_keys (
    id,
    project_id,
    name,
    key_hash,
    key_last_four,
    created_at
  )
  values (
    v_key_id,
    p_project_id,
    'Default API key',
    p_key_hash,
    p_key_last_four,
    v_now
  );

  insert into public.project_api_key_events (
    project_id,
    api_key_id,
    actor_user_id,
    event_type,
    created_at
  )
  values (
    p_project_id,
    v_key_id,
    p_actor_user_id,
    'created',
    v_now
  );

  update public.projects
  set
    api_key = null,
    api_key_last_four = p_key_last_four,
    updated_at = v_now
  where id = p_project_id;

  return v_key_id;
end;
$$;

revoke all on function public.rotate_project_api_key(uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.rotate_project_api_key(uuid, text, text, uuid) to service_role;
