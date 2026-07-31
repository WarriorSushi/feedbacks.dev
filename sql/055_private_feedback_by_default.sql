-- 055: Feedback collected by widgets and trusted APIs is private by default.
-- Public-board submissions opt in explicitly in the board submit route.

alter table public.feedback
  alter column is_public set default false;

update public.feedback
set
  is_public = false,
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'source',
    case
      when agent_name is not null then 'api'
      else 'widget'
    end
  )
where is_public = true
  and user_agent is distinct from 'public-board';

update public.feedback
set metadata = coalesce(metadata, '{}'::jsonb) || '{"source":"public_board"}'::jsonb
where is_public = true
  and user_agent = 'public-board';

update public.projects
set api_key = null
where api_key is not null;
