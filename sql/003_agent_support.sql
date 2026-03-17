-- Agent support: add agent-specific fields to feedback table
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS agent_name text;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS agent_session_id text;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS structured_data jsonb;
-- structured_data can contain: stack_trace, error_code, reproduction_steps, environment, etc.

CREATE INDEX IF NOT EXISTS idx_feedback_agent ON public.feedback(project_id, agent_name) WHERE agent_name IS NOT NULL;
