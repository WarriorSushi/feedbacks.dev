-- Snapshot and remove fixtures created by the dedicated production E2E actor.
-- The quarantine schema is service-role-only and can be used for controlled restore.

create schema if not exists quarantine;
revoke all on schema quarantine from public, anon, authenticated;
grant usage, create on schema quarantine to service_role;

create table if not exists quarantine.e2e_projects_20260730 as
select *
from public.projects
where owner_user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;

do $$
declare
  source_table text;
  snapshot_table text;
begin
  for source_table in
    select distinct table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'project_id'
      and table_name <> 'projects'
  loop
    snapshot_table := format('e2e_%s_20260730', source_table);
    execute format(
      'create table if not exists quarantine.%I as
       select source.*
       from public.%I source
       join quarantine.e2e_projects_20260730 project on project.id = source.project_id',
      snapshot_table,
      source_table
    );
  end loop;
end;
$$;

create table if not exists quarantine.e2e_feedback_notes_20260730 as
select note.*
from public.feedback_notes note
join quarantine.e2e_feedback_20260730 feedback on feedback.id = note.feedback_id;

create table if not exists quarantine.e2e_votes_20260730 as
select vote.*
from public.votes vote
join quarantine.e2e_feedback_20260730 feedback on feedback.id = vote.feedback_id;

create table if not exists quarantine.e2e_billing_accounts_20260730 as
select * from public.billing_accounts
where user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;

create table if not exists quarantine.e2e_billing_events_20260730 as
select * from public.billing_events
where user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;

create table if not exists quarantine.e2e_notification_digests_20260730 as
select * from public.notification_digests
where user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;

create table if not exists quarantine.e2e_usage_counters_20260730 as
select * from public.usage_counters
where user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;

create table if not exists quarantine.e2e_user_settings_20260730 as
select * from public.user_settings
where user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;

update quarantine.e2e_projects_20260730
set
  environment = 'e2e',
  test_namespace = 'e2e:legacy-production',
  quarantined_at = coalesce(quarantined_at, now());

create table if not exists quarantine.e2e_snapshot_manifest_20260730 (
  table_name text primary key,
  row_count bigint not null,
  captured_at timestamptz not null default now()
);

do $$
declare
  snapshot record;
  count_value bigint;
begin
  for snapshot in
    select table_name
    from information_schema.tables
    where table_schema = 'quarantine'
      and table_name like 'e2e_%_20260730'
      and table_name <> 'e2e_snapshot_manifest_20260730'
  loop
    execute format('select count(*) from quarantine.%I', snapshot.table_name)
      into count_value;
    insert into quarantine.e2e_snapshot_manifest_20260730(table_name, row_count)
    values (snapshot.table_name, count_value)
    on conflict (table_name) do update
      set row_count = excluded.row_count,
          captured_at = now();
  end loop;
end;
$$;

delete from public.projects
where owner_user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;

delete from public.billing_events
where user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;
delete from public.billing_accounts
where user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;
delete from public.notification_digests
where user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;
delete from public.usage_counters
where user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;
delete from public.user_settings
where user_id = '308d3dee-5668-48c0-9449-a5e23df5b091'::uuid;
