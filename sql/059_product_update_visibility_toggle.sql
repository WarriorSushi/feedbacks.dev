-- 059_product_update_visibility_toggle.sql
-- Hides or restores an individual release note without changing its identity,
-- publication timestamp, metrics, or browser seen state.

alter table public.product_updates
  add column if not exists is_enabled boolean not null default true;

comment on column public.product_updates.is_enabled is
  'Whether this release note may be returned to customer embeds. Independent from draft, published, and archived lifecycle state.';

create index if not exists idx_product_updates_public_visible
  on public.product_updates(project_id, published_at desc, id desc)
  where status = 'published' and is_enabled = true;

create or replace function public.publish_product_update(
  p_project_id uuid,
  p_update_id uuid,
  p_published_at timestamptz,
  p_expires_at timestamptz,
  p_active_limit integer,
  p_allow_scheduling boolean,
  p_expected_updated_at timestamptz
) returns public.product_updates
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  target public.product_updates;
  publication_time timestamptz;
  live_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_project_id::text, 0));
  select *
    into target
    from public.product_updates
   where id = p_update_id and project_id = p_project_id
   for update;
  if not found then
    raise exception 'product update not found';
  end if;
  if p_expected_updated_at is null or target.updated_at <> p_expected_updated_at then
    raise exception 'product update version conflict' using errcode = '40001';
  end if;

  publication_time := coalesce(p_published_at, now());
  if publication_time > now() and not p_allow_scheduling then
    raise exception 'product update scheduling is not available';
  end if;
  if p_expires_at is not null and p_expires_at <= publication_time then
    raise exception 'expiry must be later than publication';
  end if;
  if target.is_enabled and publication_time <= now() and p_active_limit is not null and not (
    target.status = 'published'
    and target.is_enabled
    and target.published_at <= now()
    and (target.expires_at is null or target.expires_at > now())
  ) then
    select count(*)
      into live_count
      from public.product_updates update_row
     where update_row.project_id = p_project_id
       and update_row.id <> p_update_id
       and update_row.status = 'published'
       and update_row.is_enabled
       and update_row.published_at <= now()
       and (update_row.expires_at is null or update_row.expires_at > now());
    if live_count >= p_active_limit then
      raise exception 'product update live limit reached';
    end if;
  end if;

  update public.product_updates
     set status = 'published',
         published_at = publication_time,
         expires_at = p_expires_at,
         updated_at = now()
   where id = p_update_id and project_id = p_project_id
  returning * into target;
  return target;
end;
$$;

revoke all on function public.publish_product_update(
  uuid,uuid,timestamptz,timestamptz,integer,boolean,timestamptz
) from public, anon, authenticated;
grant execute on function public.publish_product_update(
  uuid,uuid,timestamptz,timestamptz,integer,boolean,timestamptz
) to service_role;

create or replace function public.set_product_update_visibility(
  p_project_id uuid,
  p_update_id uuid,
  p_enabled boolean,
  p_active_limit integer,
  p_expected_updated_at timestamptz
) returns public.product_updates
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  target public.product_updates;
  live_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_project_id::text, 0));
  select *
    into target
    from public.product_updates
   where id = p_update_id and project_id = p_project_id
   for update;
  if not found then
    raise exception 'product update not found';
  end if;
  if p_expected_updated_at is null or target.updated_at <> p_expected_updated_at then
    raise exception 'product update version conflict' using errcode = '40001';
  end if;

  if p_enabled and not target.is_enabled and p_active_limit is not null and (
    target.status = 'published'
    and target.published_at <= now()
    and (target.expires_at is null or target.expires_at > now())
  ) then
    select count(*)
      into live_count
      from public.product_updates update_row
     where update_row.project_id = p_project_id
       and update_row.id <> p_update_id
       and update_row.status = 'published'
       and update_row.is_enabled
       and update_row.published_at <= now()
       and (update_row.expires_at is null or update_row.expires_at > now());
    if live_count >= p_active_limit then
      raise exception 'product update live limit reached';
    end if;
  end if;

  update public.product_updates
     set is_enabled = p_enabled,
         updated_at = now()
   where id = p_update_id and project_id = p_project_id
  returning * into target;
  return target;
end;
$$;

revoke all on function public.set_product_update_visibility(
  uuid,uuid,boolean,integer,timestamptz
) from public, anon, authenticated;
grant execute on function public.set_product_update_visibility(
  uuid,uuid,boolean,integer,timestamptz
) to service_role;
