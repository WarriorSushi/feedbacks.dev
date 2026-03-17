# Database Migrations

## Enable Extensions

Run in Supabase SQL editor:

```
create extension if not exists pgcrypto;
```

## Secure API Key Defaults

```
create or replace function generate_api_key()
returns text
language plpgsql
security definer
as $$
begin
  return 'feedbacks_dev_api_key_' || encode(gen_random_bytes(20), 'hex');
end;
$$;

alter table public.projects alter column api_key set default generate_api_key();
update public.projects set api_key = generate_api_key() where api_key is null;
```

## Feedback Enhancements

```
alter table public.feedback add column if not exists type text check (type is null or type in ('bug','idea','praise'));
alter table public.feedback add column if not exists rating integer check (rating is null or (rating between 1 and 5));
alter table public.feedback add column if not exists priority text check (priority is null or priority in ('low','medium','high'));
alter table public.feedback add column if not exists tags text[];
alter table public.feedback add column if not exists screenshot_url text;
alter table public.feedback add column if not exists attachments jsonb;
```

## Indexes (optional)

```
create index if not exists idx_feedback_project_created on public.feedback(project_id, created_at desc);
create index if not exists idx_feedback_is_read on public.feedback(project_id, is_read);
```

RLS is already defined in `sql/002_rls_policies.sql`.

## Storage (Screenshots)

Create a public bucket named `feedback_screenshots` in Supabase Storage (Project → Storage). The API will upload images there and store the public URL in `feedback.screenshot_url`.

## Storage (Attachments)

Create a public bucket named `feedback_attachments` in Supabase Storage. The API (when enabled) accepts one attachment per feedback, uploads it here, and stores metadata in `feedback.attachments` as JSON (`[{ url, name, type, size }]`).



## Project Widget Config (optional, recommended)

Add a JSONB column to store per‑project widget defaults used by the visual customizer and snippet generator.

```
alter table public.projects add column if not exists widget_config jsonb not null default '{}'::jsonb;
```

Usage:
- The dashboard customizer reads/writes `projects.widget_config` via `/api/projects/[id]/widget-config`.
- Snippet generator defaults to this config to reduce setup friction.

## Project Webhooks (optional, recommended)

Add a JSONB column to store per-project webhook settings (Slack, Discord, Generic).

```
alter table public.projects add column if not exists webhooks jsonb not null default '{}'::jsonb;
```

The dashboard uses `/api/projects/[id]/webhooks` to read/write this object with shape:

```
{
  "slack":   { "enabled": true,  "url": "https://hooks.slack.com/..." },
  "discord": { "enabled": false, "url": "https://discord.com/api/webhooks/..." },
  "generic": { "enabled": false, "url": "https://example.com/webhook" }
}
```
