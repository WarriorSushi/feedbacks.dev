create table if not exists public.project_integration_secret_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  endpoint_id text not null,
  kind text not null check (kind in ('slack', 'discord', 'generic', 'github')),
  event_type text not null check (event_type in ('created', 'replaced', 'revoked')),
  destination_hint text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_integration_secret_events_project_created
  on public.project_integration_secret_events(project_id, created_at desc);

alter table public.project_integration_secret_events enable row level security;
revoke all on table public.project_integration_secret_events from public, anon, authenticated;
grant select, insert on table public.project_integration_secret_events to service_role;

create or replace function public.audit_project_integration_secret_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_integration_secret_events (
    project_id,
    endpoint_id,
    kind,
    event_type,
    destination_hint
  )
  values (
    coalesce(new.project_id, old.project_id),
    coalesce(new.endpoint_id, old.endpoint_id),
    coalesce(new.kind, old.kind),
    case tg_op
      when 'INSERT' then 'created'
      when 'UPDATE' then 'replaced'
      else 'revoked'
    end,
    coalesce(new.destination_hint, old.destination_hint)
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.audit_project_integration_secret_change() from public, anon, authenticated;

drop trigger if exists project_integration_secret_audit on public.project_integration_secrets;
create trigger project_integration_secret_audit
after insert or update or delete on public.project_integration_secrets
for each row execute function public.audit_project_integration_secret_change();
