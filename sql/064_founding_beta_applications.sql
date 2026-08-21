-- 064: Service-only application records for the optional Founding Beta cohort.
-- General Free signup stays open; this table only supports hands-on beta selection.

create table if not exists public.beta_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_hash text not null unique references public.marketing_leads(email_hash) on delete cascade,
  use_case text not null check (char_length(use_case) between 20 and 500),
  product_stage text not null check (product_stage in ('prelaunch', 'early-live', 'growing', 'established')),
  install_timeline text not null check (install_timeline in ('this-week', 'this-month', 'exploring')),
  current_tool text check (current_tool is null or char_length(current_tool) <= 120),
  status text not null default 'pending' check (status in ('pending', 'invited', 'waitlisted', 'declined')),
  applied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists beta_applications_review_queue_idx
  on public.beta_applications(status, applied_at asc);

drop trigger if exists trg_beta_applications_updated_at on public.beta_applications;
create trigger trg_beta_applications_updated_at
  before update on public.beta_applications
  for each row execute function public.touch_updated_at();

alter table public.beta_applications enable row level security;
revoke all on table public.beta_applications from public, anon, authenticated;
grant select, insert, update, delete on table public.beta_applications to service_role;

drop policy if exists "service_only_explicit_deny" on public.beta_applications;
create policy "service_only_explicit_deny" on public.beta_applications as restrictive for all
  to anon, authenticated using (false) with check (false);
