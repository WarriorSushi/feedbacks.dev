-- Widget Customizer storage on projects

alter table public.projects
  add column if not exists widget_config jsonb not null default '{}'::jsonb;

