alter table public.feedback
  add column if not exists screenshot_path text;

create table if not exists public.feedback_media (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('screenshot', 'attachment')),
  bucket text not null check (bucket in ('feedback_screenshots', 'feedback_attachments')),
  storage_path text not null,
  original_filename text not null,
  safe_filename text not null,
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg')),
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text check (sha256 is null or char_length(sha256) = 64),
  scan_status text not null default 'pending'
    check (scan_status in ('pending', 'clean', 'quarantined', 'rejected')),
  created_at timestamptz not null default now(),
  scanned_at timestamptz,
  deleted_at timestamptz,
  unique (bucket, storage_path)
);

create index if not exists feedback_media_feedback_kind_idx
  on public.feedback_media(feedback_id, kind, created_at);
create index if not exists feedback_media_project_idx
  on public.feedback_media(project_id, created_at desc);
create index if not exists feedback_media_pending_idx
  on public.feedback_media(scan_status, created_at)
  where scan_status = 'pending';

alter table public.feedback_media enable row level security;
revoke all on table public.feedback_media from public, anon, authenticated;
grant select, insert, update, delete on table public.feedback_media to service_role;

insert into public.feedback_media (
  feedback_id,
  project_id,
  kind,
  bucket,
  storage_path,
  original_filename,
  safe_filename,
  mime_type,
  size_bytes,
  scan_status
)
select
  feedback.id,
  feedback.project_id,
  'screenshot',
  'feedback_screenshots',
  substring(feedback.screenshot_url from '/feedback_screenshots/(.+)$'),
  'feedback-screenshot.' || case when feedback.screenshot_url like '%.png' then 'png' else 'jpg' end,
  'feedback-screenshot.' || case when feedback.screenshot_url like '%.png' then 'png' else 'jpg' end,
  case when feedback.screenshot_url like '%.png' then 'image/png' else 'image/jpeg' end,
  coalesce((object.metadata->>'size')::bigint, 0),
  'pending'
from public.feedback feedback
left join storage.objects object
  on object.bucket_id = 'feedback_screenshots'
 and object.name = substring(feedback.screenshot_url from '/feedback_screenshots/(.+)$')
where feedback.screenshot_url like '%/feedback_screenshots/%'
on conflict (bucket, storage_path) do nothing;

update public.feedback
set
  screenshot_path = substring(screenshot_url from '/feedback_screenshots/(.+)$'),
  screenshot_url = null
where screenshot_url like '%/feedback_screenshots/%';

update storage.buckets
set
  public = false,
  file_size_limit = 3145728,
  allowed_mime_types = array['image/png', 'image/jpeg']
where id = 'feedback_screenshots';

update storage.buckets
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg']
where id = 'feedback_attachments';

comment on table public.feedback_media is
  'Private, owner-authorized feedback media. Only clean rows may be served.';
