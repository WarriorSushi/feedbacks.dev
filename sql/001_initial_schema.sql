-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- Projects table
create table public.projects (
    id uuid default uuid_generate_v4() primary key,
    name text not null check (length(trim(name)) >= 1 and length(trim(name)) <= 100),
    api_key text unique not null default generate_api_key(),
    owner_user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Feedback table
create table public.feedback (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.projects(id) on delete cascade not null,
    message text not null check (length(trim(message)) >= 2 and length(trim(message)) <= 2000),
    email text check (email is null or email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    url text not null check (url ~* '^https?://'),
    user_agent text not null,
    type text check (type is null or type in ('bug','idea','praise')),
    rating integer check (rating is null or (rating >= 1 and rating <= 5)),
    is_read boolean default false not null,
    created_at timestamptz default now() not null
);

-- Indexes for performance
create index idx_feedback_project_created on public.feedback(project_id, created_at desc);
create index idx_feedback_is_read on public.feedback(project_id, is_read);
create index idx_projects_owner on public.projects(owner_user_id);
create index idx_projects_api_key on public.projects(api_key) where api_key is not null;

-- Updated at trigger for projects
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_projects_updated_at before update on public.projects
    for each row execute procedure update_updated_at_column();

-- Function to generate secure API keys
create or replace function generate_api_key()
returns text
language plpgsql
security definer
as $$
begin
    return 'pk_live_' || encode(gen_random_bytes(20), 'hex');
end;
$$;
