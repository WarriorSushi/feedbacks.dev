-- Per-user settings for defaults (anti-spam site keys etc.)

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  anti_spam jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at before update on public.user_settings
for each row execute procedure public.set_updated_at();

alter table public.user_settings enable row level security;

do $$ begin
  create policy "Users can view own settings"
    on public.user_settings for select
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can upsert own settings"
    on public.user_settings for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update own settings"
    on public.user_settings for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

