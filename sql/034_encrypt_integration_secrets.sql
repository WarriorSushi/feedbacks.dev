-- Keep third-party integration credentials out of project JSON and browser responses.
-- Ciphertext is produced and consumed by the application with AES-256-GCM.

create table if not exists public.project_integration_secrets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  endpoint_id text not null,
  kind text not null check (kind in ('slack', 'discord', 'generic', 'github')),
  ciphertext text not null,
  initialization_vector text not null,
  auth_tag text not null,
  key_version integer not null default 1 check (key_version > 0),
  destination_hint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, endpoint_id)
);

create index if not exists project_integration_secrets_project_id_idx
  on public.project_integration_secrets(project_id);

alter table public.project_integration_secrets enable row level security;

revoke all on table public.project_integration_secrets from anon, authenticated, public;
grant all on table public.project_integration_secrets to service_role;

alter table public.webhook_deliveries
  add column if not exists endpoint_id text;

create index if not exists webhook_deliveries_project_endpoint_created_idx
  on public.webhook_deliveries(project_id, endpoint_id, created_at desc);

comment on table public.project_integration_secrets is
  'Service-role-only AES-256-GCM ciphertext for integration endpoint credentials.';
comment on column public.project_integration_secrets.destination_hint is
  'Non-secret, redacted label safe for operational UI and logs.';
