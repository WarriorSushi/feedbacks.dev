-- 058: Reuse feedbacks.dev itself for authenticated customer feedback and updates.
-- The system project is owned by the launch administrator, excluded from plan
-- project counts, and remains private like every non-board feedback project.

insert into public.projects (
  owner_user_id,
  name,
  api_key,
  api_key_hash,
  api_key_last_four,
  webhooks,
  settings,
  environment,
  created_at,
  updated_at
)
select
  users.id,
  'feedbacks.dev product feedback',
  null,
  null,
  null,
  '{}'::jsonb,
  jsonb_build_object(
    'icon', '💬',
    'internal_feedback_project', true,
    'widget_config', jsonb_build_object(
      'formTitle', 'Help shape feedbacks.dev',
      'enableType', true,
      'requireEmail', false
    )
  ),
  'production',
  users.created_at,
  now()
from auth.users users
where lower(users.email) = lower('drsyedirfan93@gmail.com')
  and not exists (
    select 1
    from public.projects projects
    where projects.settings @> '{"internal_feedback_project":true}'::jsonb
  );
