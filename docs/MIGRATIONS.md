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
  return 'pk_live_' || encode(gen_random_bytes(20), 'hex');
end;
$$;

alter table public.projects alter column api_key set default generate_api_key();
update public.projects set api_key = generate_api_key() where api_key is null;
```

## Feedback Enhancements

```
alter table public.feedback add column if not exists type text check (type is null or type in ('bug','idea','praise'));
alter table public.feedback add column if not exists rating integer check (rating is null or (rating between 1 and 5));
```

## Indexes (optional)

```
create index if not exists idx_feedback_project_created on public.feedback(project_id, created_at desc);
create index if not exists idx_feedback_is_read on public.feedback(project_id, is_read);
```

RLS is already defined in `sql/002_rls_policies.sql`.

