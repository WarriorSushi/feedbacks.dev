alter table public.activation_milestones
  add column if not exists environment text not null default 'production';

alter table public.activation_milestones
  drop constraint if exists activation_milestones_environment_check;

alter table public.activation_milestones
  add constraint activation_milestones_environment_check
  check (environment in ('production', 'preview', 'development', 'e2e'));

create or replace function public.set_activation_milestone_environment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  select project.environment
  into new.environment
  from public.projects project
  where project.id = new.project_id;

  if new.environment is null then
    raise exception 'Activation milestone project does not exist';
  end if;
  return new;
end;
$$;

drop trigger if exists activation_milestone_environment_trigger
  on public.activation_milestones;
create trigger activation_milestone_environment_trigger
before insert or update of project_id
on public.activation_milestones
for each row execute function public.set_activation_milestone_environment();

update public.activation_milestones milestone
set environment = project.environment
from public.projects project
where project.id = milestone.project_id;

create index if not exists activation_milestones_environment_event_seen_idx
  on public.activation_milestones(environment, event_name, first_seen_at desc);

revoke all on table public.activation_milestones from public, anon, authenticated;
grant select, insert, update, delete on table public.activation_milestones to service_role;
