-- 001_initial_schema.sql
-- Feedbacks.dev v2 — complete database schema
-- Run in Supabase SQL Editor on a fresh project
-- ==========================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ==========================================================================
-- Utility functions
-- ==========================================================================

-- Auto-update updated_at on row changes
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Generate prefixed API keys: fb_<40 hex chars>
create or replace function public.generate_api_key()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return 'fb_' || encode(gen_random_bytes(20), 'hex');
end;
$$;

-- ==========================================================================
-- 1. projects
-- ==========================================================================

create table public.projects (
  id              uuid primary key default uuid_generate_v4(),
  owner_user_id   uuid not null references auth.users(id) on delete cascade,
  name            text not null check (length(trim(name)) between 1 and 100),
  api_key         text not null unique default public.generate_api_key(),
  domain          text,                              -- optional allowed origin
  webhooks        jsonb not null default '[]'::jsonb, -- array of webhook configs
  settings        jsonb not null default '{}'::jsonb, -- project-level settings
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_projects_owner   on public.projects(owner_user_id);
create index idx_projects_api_key on public.projects(api_key);

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;

create policy "projects_select_own" on public.projects for select
  using ((select auth.uid()) = owner_user_id);

create policy "projects_insert_own" on public.projects for insert
  with check ((select auth.uid()) = owner_user_id);

create policy "projects_update_own" on public.projects for update
  using ((select auth.uid()) = owner_user_id)
  with check ((select auth.uid()) = owner_user_id);

create policy "projects_delete_own" on public.projects for delete
  using ((select auth.uid()) = owner_user_id);

-- ==========================================================================
-- 2. feedback
-- ==========================================================================

create table public.feedback (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  message         text not null check (length(trim(message)) between 2 and 4000),
  email           text check (email is null or email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  url             text not null check (url ~ '^https?://'),
  user_agent      text not null,
  type            text check (type is null or type in ('bug','idea','praise','question')),
  rating          integer check (rating is null or (rating between 1 and 5)),
  priority        text not null default 'low'
                    check (priority in ('low','medium','high','critical')),
  status          text not null default 'new'
                    check (status in ('new','reviewed','planned','in_progress','closed')),
  tags            text[] not null default '{}',
  screenshot_url  text,
  attachments     jsonb,                             -- [{url, name, size, type}]
  metadata        jsonb not null default '{}'::jsonb, -- arbitrary custom data from widget
  is_archived     boolean not null default false,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Query indexes
create index idx_feedback_project_created on public.feedback(project_id, created_at desc);
create index idx_feedback_project_status  on public.feedback(project_id, status);
create index idx_feedback_project_type    on public.feedback(project_id, type);
create index idx_feedback_tags_gin        on public.feedback using gin(tags);

create trigger trg_feedback_updated_at
  before update on public.feedback
  for each row execute function public.touch_updated_at();

alter table public.feedback enable row level security;

-- Project owner can read and update feedback
create policy "feedback_select_owned" on public.feedback for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = feedback.project_id
        and p.owner_user_id = (select auth.uid())
    )
  );

create policy "feedback_update_owned" on public.feedback for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = feedback.project_id
        and p.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = feedback.project_id
        and p.owner_user_id = (select auth.uid())
    )
  );

-- Inserts happen via service role (API route) — no user insert policy needed.
-- Service role bypasses RLS automatically.

-- ==========================================================================
-- 3. widget_configs
-- ==========================================================================

create table public.widget_configs (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  channel     text not null default 'default',
  version     integer not null,
  label       text not null default 'Default',
  config      jsonb not null default '{}'::jsonb,
  is_active   boolean not null default true,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_widget_configs_project on public.widget_configs(project_id, channel);
create unique index idx_widget_configs_version on public.widget_configs(project_id, channel, version);
create index idx_widget_configs_created_by on public.widget_configs(created_by);

-- Auto-increment version and normalise channel on insert/update
create or replace function public.widget_configs_before_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
begin
  -- Normalise channel
  if new.channel is null or length(trim(new.channel)) = 0 then
    new.channel := 'default';
  else
    new.channel := lower(trim(new.channel));
  end if;

  -- Auto-increment version when not explicitly set
  if new.version is null or new.version <= 0 then
    select coalesce(max(version), 0) + 1
      into next_version
      from public.widget_configs
     where project_id = new.project_id
       and channel = new.channel;
    new.version := coalesce(next_version, 1);
  end if;

  -- Default label
  if new.label is null or length(trim(new.label)) = 0 then
    new.label := 'Version ' || new.version;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_widget_configs_before_write
  before insert or update on public.widget_configs
  for each row execute function public.widget_configs_before_write();

alter table public.widget_configs enable row level security;

-- Single ALL policy covers select/insert/update/delete
create policy "widget_configs_owner_all" on public.widget_configs for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = widget_configs.project_id
        and p.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = widget_configs.project_id
        and p.owner_user_id = (select auth.uid())
    )
  );

-- ==========================================================================
-- 4. webhook_deliveries
-- ==========================================================================

create table public.webhook_deliveries (
  id               uuid primary key default uuid_generate_v4(),
  project_id       uuid not null references public.projects(id) on delete cascade,
  endpoint_id      text,
  event            text not null,
  kind             text not null check (kind in ('slack','discord','generic','github','email')),
  url              text not null,
  status           text not null check (status in ('success','failed','pending')),
  status_code      integer,
  error            text,
  payload          jsonb,
  response_time_ms integer,
  response_body    text,
  attempt          integer not null default 1,
  created_at       timestamptz not null default now()
);

create index idx_webhook_del_project_created  on public.webhook_deliveries(project_id, created_at desc);
create index idx_webhook_del_project_endpoint on public.webhook_deliveries(project_id, endpoint_id, created_at desc);

alter table public.webhook_deliveries enable row level security;

-- Project owner can read delivery logs
create policy "webhook_deliveries_select_owned" on public.webhook_deliveries for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = webhook_deliveries.project_id
        and p.owner_user_id = (select auth.uid())
    )
  );

-- Inserts done by service role (API routes)

-- ==========================================================================
-- 5. rate_limits
-- ==========================================================================

create table public.rate_limits (
  id         uuid primary key default uuid_generate_v4(),
  key        text not null,
  route      text not null,
  created_at timestamptz not null default now()
);

create index idx_rate_limits_lookup on public.rate_limits(key, route, created_at desc);

-- RLS enabled but no user policies — service role only
alter table public.rate_limits enable row level security;

create policy "rate_limits_deny_all" on public.rate_limits for all
  using (false);

-- ==========================================================================
-- 6. user_settings
-- ==========================================================================

create table public.user_settings (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  preferences           jsonb not null default '{}'::jsonb,
  notification_settings jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger trg_user_settings_updated_at
  before update on public.user_settings
  for each row execute function public.touch_updated_at();

alter table public.user_settings enable row level security;

create policy "user_settings_select_own" on public.user_settings for select
  using ((select auth.uid()) = user_id);

create policy "user_settings_insert_own" on public.user_settings for insert
  with check ((select auth.uid()) = user_id);

create policy "user_settings_update_own" on public.user_settings for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ==========================================================================
-- 7. feedback_notes (NEW — internal team notes on feedback items)
-- ==========================================================================

create table public.feedback_notes (
  id          uuid primary key default uuid_generate_v4(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  content     text not null check (length(trim(content)) between 1 and 5000),
  created_at  timestamptz not null default now()
);

create index idx_feedback_notes_feedback on public.feedback_notes(feedback_id, created_at);
create index idx_feedback_notes_user     on public.feedback_notes(user_id);

alter table public.feedback_notes enable row level security;

-- Access allowed if the user owns the project that the feedback belongs to
create policy "feedback_notes_select_owned" on public.feedback_notes for select
  using (
    exists (
      select 1 from public.feedback f
      join public.projects p on p.id = f.project_id
      where f.id = feedback_notes.feedback_id
        and p.owner_user_id = (select auth.uid())
    )
  );

create policy "feedback_notes_insert_owned" on public.feedback_notes for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.feedback f
      join public.projects p on p.id = f.project_id
      where f.id = feedback_notes.feedback_id
        and p.owner_user_id = (select auth.uid())
    )
  );

create policy "feedback_notes_delete_own" on public.feedback_notes for delete
  using (
    (select auth.uid()) = user_id
  );

-- ==========================================================================
-- 8. widget_presets (read-only lookup table)
-- ==========================================================================

create table public.widget_presets (
  id                uuid primary key default uuid_generate_v4(),
  slug              text not null unique,
  name              text not null,
  description       text,
  category          text,
  preview_image_url text,
  config            jsonb not null,
  created_at        timestamptz not null default now()
);

alter table public.widget_presets enable row level security;

-- Anyone authenticated can read presets
create policy "widget_presets_read" on public.widget_presets for select
  using (true);

-- ==========================================================================
-- Seed data — widget presets
-- ==========================================================================

insert into public.widget_presets (slug, name, description, category, config)
values
  (
    'modal-classic',
    'Modal Classic',
    'Floating button with rounded modal and accent color.',
    'modal',
    jsonb_build_object(
      'embedMode',    'modal',
      'position',     'bottom-right',
      'buttonText',   'Feedback',
      'primaryColor', '#6366F1',
      'enableRating', true,
      'enableType',   true
    )
  ),
  (
    'modal-minimal',
    'Modal Minimal',
    'Distraction-free modal focused on text feedback.',
    'modal',
    jsonb_build_object(
      'embedMode',    'modal',
      'position',     'bottom-right',
      'buttonText',   'Share thoughts',
      'enableRating', false,
      'enableType',   false,
      'requireEmail', false
    )
  ),
  (
    'modal-dark',
    'Modal Dark',
    'Sleek dark-themed modal for modern apps.',
    'modal',
    jsonb_build_object(
      'embedMode',       'modal',
      'position',        'bottom-right',
      'buttonText',      'Send Feedback',
      'primaryColor',    '#8B5CF6',
      'backgroundColor', '#1E1E2E',
      'textColor',       '#E2E8F0',
      'enableRating',    true,
      'enableType',      true
    )
  ),
  (
    'inline-card',
    'Inline Card',
    'Card layout to embed inside help centers or docs.',
    'inline',
    jsonb_build_object(
      'embedMode',        'inline',
      'target',           '#feedback-widget',
      'backgroundColor',  '#FFFFFF',
      'spacing',          24,
      'enableScreenshot', true
    )
  ),
  (
    'inline-highlight',
    'Inline Highlight',
    'High-contrast inline section suited for landing pages.',
    'inline',
    jsonb_build_object(
      'embedMode',    'inline',
      'target',       '#feedback-widget',
      'backgroundColor', '#DBDDE1',
      'primaryColor',    '#242424',
      'headerLayout',    'icon-left',
      'headerIcon',      'star'
    )
  ),
  (
    'popover-compact',
    'Popover Compact',
    'Tiny popover that expands on click — great for SaaS navbars.',
    'popover',
    jsonb_build_object(
      'embedMode',    'popover',
      'position',     'bottom-left',
      'buttonText',   '?',
      'enableRating', false,
      'enableType',   false,
      'compact',      true
    )
  )
on conflict (slug) do update set
  name        = excluded.name,
  description = excluded.description,
  category    = excluded.category,
  config      = excluded.config;
