-- Webhooks storage (per-project JSONB) and basic delivery logs

-- Add webhooks JSONB configuration on projects
alter table public.projects
  add column if not exists webhooks jsonb not null default '{}'::jsonb;

-- Delivery logs table
create table if not exists public.webhook_deliveries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('slack','discord','generic')),
  url text not null,
  event text not null,
  status text not null check (status in ('success','failed')),
  status_code integer,
  error text,
  payload jsonb
);

create index if not exists idx_webhook_deliveries_project_created
  on public.webhook_deliveries(project_id, created_at desc);

-- RLS for webhook_deliveries (read-only for owners)
alter table public.webhook_deliveries enable row level security;

do $$ begin
  create policy "Owners can view webhook deliveries"
    on public.webhook_deliveries for select
    using (
      exists (
        select 1 from public.projects
        where projects.id = webhook_deliveries.project_id
          and projects.owner_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

