-- Add archived flag to feedbacks

alter table public.feedback
  add column if not exists archived boolean not null default false;

create index if not exists idx_feedback_project_archived
  on public.feedback(project_id, archived);

