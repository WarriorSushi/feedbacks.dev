-- Basic rate limits store
create table if not exists public.rate_limits (
  id uuid primary key default uuid_generate_v4(),
  key text not null,
  route text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limits_key_route_created
  on public.rate_limits(key, route, created_at desc);

