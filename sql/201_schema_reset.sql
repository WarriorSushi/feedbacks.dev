-- 201_schema_reset.sql
-- Fresh schema for Feedbacks.dev widget installation redesign (September 2025)
-- Run this in the Supabase SQL editor to drop existing tables and recreate them.

begin;

-- Drop tables (cascade to remove dependent objects)
drop table if exists public.widget_config_events cascade;
drop table if exists public.widget_configs cascade;
drop table if exists public.widget_presets cascade;
drop table if exists public.webhook_deliveries cascade;
drop table if exists public.rate_limits cascade;
drop table if exists public.feedback cascade;
drop table if exists public.projects cascade;
drop table if exists public.user_settings cascade;

-- Drop old triggers/functions if they exist
do $$
begin
  if to_regclass('public.projects') is not null then
    execute 'drop trigger if exists update_projects_updated_at on public.projects';
  end if;
  if to_regclass('public.widget_configs') is not null then
    execute 'drop trigger if exists trg_widget_configs_before_write on public.widget_configs';
    execute 'drop trigger if exists trg_widget_configs_updated_at on public.widget_configs';
    execute 'drop trigger if exists trg_widget_configs_version on public.widget_configs';
  end if;
  if to_regclass('public.user_settings') is not null then
    execute 'drop trigger if exists trg_user_settings_updated_at on public.user_settings';
  end if;
end$$;

drop function if exists public.generate_api_key();
drop function if exists public.update_updated_at_column();
drop function if exists public.set_updated_at();
drop function if exists public.widget_configs_before_write();

 drop table if exists public.widget_config_events cascade;
 drop table if exists public.widget_configs cascade;
 drop table if exists public.widget_presets cascade;
 drop table if exists public.webhook_deliveries cascade;
 drop table if exists public.rate_limits cascade;
 drop table if exists public.feedback cascade;
 drop table if exists public.projects cascade;
 drop table if exists public.user_settings cascade;

commit;

-- Ensure extensions exist
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Utility function to keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Generate API keys for projects
create or replace function public.generate_api_key()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return 'feedbacks_dev_api_key_' || encode(gen_random_bytes(20), 'hex');
end;
$$;

-- Projects ------------------------------------------------------------------
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  api_key text not null unique default public.generate_api_key(),
  theme_id text not null default 'claude',
  webhooks jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_owner on public.projects(owner_user_id);
create index idx_projects_api_key on public.projects(api_key) where api_key is not null;

create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;

do $$ begin
  create policy "projects_select_owned"
    on public.projects for select
    using (auth.uid() = owner_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "projects_insert_owned"
    on public.projects for insert
    with check (auth.uid() = owner_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "projects_update_owned"
    on public.projects for update
    using (auth.uid() = owner_user_id)
    with check (auth.uid() = owner_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "projects_delete_owned"
    on public.projects for delete
    using (auth.uid() = owner_user_id);
exception when duplicate_object then null; end $$;

-- Widget configuration tables ----------------------------------------------
create table public.widget_configs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  channel text not null default 'default',
  version integer not null,
  label text not null default 'Default',
  config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_widget_configs_project on public.widget_configs(project_id, channel);
create unique index idx_widget_configs_version on public.widget_configs(project_id, channel, version);
create unique index idx_widget_configs_default on public.widget_configs(project_id, channel)
  where is_default;

create or replace function public.widget_configs_before_write()
returns trigger as $$
declare
  next_version integer;
begin
  if new.channel is null or length(trim(new.channel)) = 0 then
    new.channel := 'default';
  else
    new.channel := lower(trim(new.channel));
  end if;

  if new.version is null or new.version <= 0 then
    select coalesce(max(version), 0) + 1
      into next_version
      from public.widget_configs
     where project_id = new.project_id
       and channel = new.channel;
    new.version := coalesce(next_version, 1);
  end if;

  if new.label is null or length(trim(new.label)) = 0 then
    new.label := 'Version ' || new.version;
  end if;

  if new.config is null then
    new.config := '{}'::jsonb;
  end if;

  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_widget_configs_before_write
before insert or update on public.widget_configs
for each row execute function public.widget_configs_before_write();

alter table public.widget_configs enable row level security;

do $$ begin
  create policy "widget_configs_select_owned"
    on public.widget_configs for select
    using (
      exists (
        select 1 from public.projects p
        where p.id = widget_configs.project_id
          and p.owner_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "widget_configs_mutate_owned"
    on public.widget_configs for all
    using (
      exists (
        select 1 from public.projects p
        where p.id = widget_configs.project_id
          and p.owner_user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1 from public.projects p
        where p.id = widget_configs.project_id
          and p.owner_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

create table public.widget_config_events (
  id uuid primary key default uuid_generate_v4(),
  widget_config_id uuid not null references public.widget_configs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_widget_config_events_project on public.widget_config_events(project_id, created_at desc);

alter table public.widget_config_events enable row level security;

do $$ begin
  create policy "widget_config_events_select_owned"
    on public.widget_config_events for select
    using (
      exists (
        select 1 from public.projects p
        where p.id = widget_config_events.project_id
          and p.owner_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

create table public.widget_presets (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  description text,
  category text,
  preview_image_url text,
  config jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.widget_presets enable row level security;

do $$ begin
  create policy "widget_presets_read"
    on public.widget_presets for select
    using (true);
exception when duplicate_object then null; end $$;

-- Feedback ------------------------------------------------------------------
create table public.feedback (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  message text not null check (length(trim(message)) between 2 and 4000),
  email text check (email is null or email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
  url text not null check (url ~ '^https?://'),
  user_agent text not null,
  type text check (type is null or type in ('bug','idea','praise')),
  rating integer check (rating is null or (rating between 1 and 5)),
  priority text check (priority is null or priority in ('low','medium','high')),
  tags text[],
  screenshot_url text,
  attachments jsonb,
  is_read boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_feedback_project_created on public.feedback(project_id, created_at desc);
create index idx_feedback_project_is_read on public.feedback(project_id, is_read);
create index idx_feedback_project_archived on public.feedback(project_id, archived);
create index idx_feedback_project_type on public.feedback(project_id, type);
create index idx_feedback_tags_gin on public.feedback using gin(tags);

create trigger trg_feedback_updated_at
before update on public.feedback
for each row execute function public.touch_updated_at();

alter table public.feedback enable row level security;

do $$ begin
  create policy "feedback_select_owned"
    on public.feedback for select
    using (
      exists (
        select 1 from public.projects p
        where p.id = feedback.project_id
          and p.owner_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "feedback_update_owned"
    on public.feedback for update
    using (
      exists (
        select 1 from public.projects p
        where p.id = feedback.project_id
          and p.owner_user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1 from public.projects p
        where p.id = feedback.project_id
          and p.owner_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- Webhook deliveries --------------------------------------------------------
create table public.webhook_deliveries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('slack','discord','generic')),
  url text not null,
  event text not null,
  status text not null check (status in ('success','failed')),
  status_code integer,
  error text,
  payload jsonb,
  response_time_ms integer,
  response_body text,
  endpoint_id text,
  attempt integer
);

create index idx_webhook_deliveries_project_created on public.webhook_deliveries(project_id, created_at desc);
create index idx_webhook_deliveries_project_endpoint on public.webhook_deliveries(project_id, endpoint_id, created_at desc);

alter table public.webhook_deliveries enable row level security;

do $$ begin
  create policy "webhook_deliveries_select_owned"
    on public.webhook_deliveries for select
    using (
      exists (
        select 1 from public.projects p
        where p.id = webhook_deliveries.project_id
          and p.owner_user_id = auth.uid()
      )
    );
exception when duplicate_object then null; end $$;

-- Rate limit log ------------------------------------------------------------
create table public.rate_limits (
  id uuid primary key default uuid_generate_v4(),
  key text not null,
  route text not null,
  created_at timestamptz not null default now()
);

create index idx_rate_limits_key_route_created on public.rate_limits(key, route, created_at desc);

-- User settings -------------------------------------------------------------
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  anti_spam jsonb not null default '{}'::jsonb,
  appearance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row execute function public.touch_updated_at();

alter table public.user_settings enable row level security;

do $$ begin
  create policy "user_settings_select_own"
    on public.user_settings for select
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_settings_upsert_own"
    on public.user_settings for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_settings_update_own"
    on public.user_settings for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Seed a few starter widget presets ----------------------------------------
insert into public.widget_presets (slug, name, description, category, config)
values
  ('modal-classic', 'Modal Classic', 'Floating button with rounded modal and accent color.', 'modal',
    jsonb_build_object(
      'embedMode', 'modal',
      'position', 'bottom-right',
      'buttonText', 'Feedback',
      'primaryColor', '#6366F1',
      'enableRating', true,
      'enableType', true
    )
  ),
  ('modal-minimal', 'Modal Minimal', 'Distraction-free modal focused on text feedback.', 'modal',
    jsonb_build_object(
      'embedMode', 'modal',
      'position', 'bottom-right',
      'buttonText', 'Share thoughts',
      'enableRating', false,
      'enableType', false,
      'requireEmail', false
    )
  ),
  ('inline-card', 'Inline Card', 'Card layout to embed inside help centers or docs.', 'inline',
    jsonb_build_object(
      'embedMode', 'inline',
      'target', '#feedback-widget',
      'backgroundColor', '#FFFFFF',
      'spacing', 24,
      'enableScreenshot', true
    )
  ),
  ('inline-highlight', 'Inline Highlight', 'High-contrast inline section suited for landing pages.', 'inline',
    jsonb_build_object(
      'embedMode', 'inline',
      'target', '#feedback-widget',
      'backgroundColor', '#0F172A',
      'primaryColor', '#FACC15',
      'headerLayout', 'icon-left',
      'headerIcon', 'star'
    )
  )
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    config = excluded.config;
