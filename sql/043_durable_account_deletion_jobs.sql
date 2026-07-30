create table if not exists public.account_deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  user_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'failed', 'blocked')),
  claim_token uuid,
  attempt_count integer not null default 0,
  locked_at timestamptz,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_account_deletion_jobs_ready
  on public.account_deletion_jobs(status, next_attempt_at, created_at);

alter table public.account_deletion_jobs enable row level security;
revoke all on table public.account_deletion_jobs from public, anon, authenticated;
grant select, insert, update, delete on table public.account_deletion_jobs to service_role;

create or replace function public.claim_account_deletion_jobs(
  p_limit integer default 10,
  p_user_id uuid default null
)
returns setof public.account_deletion_jobs
language sql
security invoker
set search_path = ''
as $$
  update public.account_deletion_jobs as jobs
  set
    status = 'processing',
    claim_token = gen_random_uuid(),
    locked_at = now(),
    attempt_count = jobs.attempt_count + 1,
    updated_at = now(),
    last_error = null
  where jobs.id in (
    select ready.id
    from public.account_deletion_jobs as ready
    where (
      ready.status in ('pending', 'failed')
      or (ready.status = 'processing' and ready.locked_at < now() - interval '15 minutes')
    )
      and ready.next_attempt_at <= now()
      and (p_user_id is null or ready.user_id = p_user_id)
    order by ready.created_at asc
    for update skip locked
    limit greatest(1, least(p_limit, 50))
  )
  returning jobs.*;
$$;

revoke all on function public.claim_account_deletion_jobs(integer,uuid) from public, anon, authenticated;
grant execute on function public.claim_account_deletion_jobs(integer,uuid) to service_role;
