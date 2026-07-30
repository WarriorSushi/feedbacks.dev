alter table public.projects
  add column if not exists creation_request_id uuid;

create unique index if not exists idx_projects_creation_request_id
  on public.projects(owner_user_id, creation_request_id)
  where creation_request_id is not null;
