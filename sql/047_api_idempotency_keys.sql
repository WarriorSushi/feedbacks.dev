create table if not exists public.api_idempotency_keys (
  project_id uuid not null references public.projects(id) on delete cascade,
  route text not null,
  key_hash text not null,
  request_hash text not null,
  status text not null default 'processing'
    check (status in ('processing', 'completed')),
  response_status integer,
  response_body jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  primary key (project_id, route, key_hash)
);

create index if not exists idx_api_idempotency_keys_expiry
  on public.api_idempotency_keys(expires_at);

alter table public.api_idempotency_keys enable row level security;
revoke all on public.api_idempotency_keys from public, anon, authenticated;
grant select, insert, update, delete on public.api_idempotency_keys to service_role;

drop trigger if exists api_idempotency_keys_updated_at on public.api_idempotency_keys;
create trigger api_idempotency_keys_updated_at
before update on public.api_idempotency_keys
for each row execute function public.touch_updated_at();
