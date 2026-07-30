alter table public.projects
  add column if not exists environment text not null default 'production',
  add column if not exists test_namespace text,
  add column if not exists expires_at timestamptz,
  add column if not exists quarantined_at timestamptz;

alter table public.projects
  drop constraint if exists projects_environment_check;

alter table public.projects
  add constraint projects_environment_check
  check (environment in ('production', 'preview', 'development', 'e2e'));

create index if not exists projects_environment_expiry_idx
  on public.projects(environment, expires_at)
  where expires_at is not null;

create index if not exists projects_active_owner_created_idx
  on public.projects(owner_user_id, created_at desc)
  where quarantined_at is null;

comment on column public.projects.test_namespace is
  'Machine-readable namespace for non-production fixtures; never inferred from display names.';
