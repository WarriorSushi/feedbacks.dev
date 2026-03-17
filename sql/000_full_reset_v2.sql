-- ============================================================================
-- feedbacks.dev v2 — FULL DATABASE RESET
-- Run this ONCE in Supabase SQL Editor to set up the v2 schema from scratch.
-- WARNING: This drops ALL existing tables and data!
-- ============================================================================

-- Drop tables (CASCADE handles triggers and dependent objects)
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.public_board_settings CASCADE;
DROP TABLE IF EXISTS public.feedback_notes CASCADE;
DROP TABLE IF EXISTS public.webhook_deliveries CASCADE;
DROP TABLE IF EXISTS public.widget_configs CASCADE;
DROP TABLE IF EXISTS public.widget_presets CASCADE;
DROP TABLE IF EXISTS public.rate_limits CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Drop functions (after tables so no dependency issues)
DROP FUNCTION IF EXISTS update_vote_count() CASCADE;
DROP FUNCTION IF EXISTS update_feedback_vote_count() CASCADE;
DROP FUNCTION IF EXISTS update_board_settings_updated_at() CASCADE;
DROP FUNCTION IF EXISTS widget_configs_before_write() CASCADE;
DROP FUNCTION IF EXISTS touch_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_api_key() CASCADE;
DROP FUNCTION IF EXISTS count_by_column(text, text, uuid) CASCADE;

-- ============================================================================
-- Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- Utility Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN 'fb_' || encode(gen_random_bytes(20), 'hex');
END;
$$;

-- ============================================================================
-- 1. PROJECTS
-- ============================================================================

CREATE TABLE public.projects (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
  api_key         text NOT NULL UNIQUE DEFAULT public.generate_api_key(),
  api_key_hash    text,
  domain          text,
  webhooks        jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_owner ON public.projects(owner_user_id);
CREATE INDEX idx_projects_api_key ON public.projects(api_key);
CREATE INDEX idx_projects_api_key_hash ON public.projects(api_key_hash);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_own" ON public.projects FOR SELECT
  USING ((SELECT auth.uid()) = owner_user_id);
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = owner_user_id);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE
  USING ((SELECT auth.uid()) = owner_user_id)
  WITH CHECK ((SELECT auth.uid()) = owner_user_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE
  USING ((SELECT auth.uid()) = owner_user_id);

-- ============================================================================
-- 2. FEEDBACK
-- ============================================================================

CREATE TABLE public.feedback (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  message         text NOT NULL CHECK (length(trim(message)) BETWEEN 2 AND 4000),
  email           text CHECK (email IS NULL OR email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  url             text DEFAULT NULL,
  user_agent      text NOT NULL,
  type            text CHECK (type IS NULL OR type IN ('bug','idea','praise','question')),
  rating          integer CHECK (rating IS NULL OR (rating BETWEEN 1 AND 5)),
  priority        text NOT NULL DEFAULT 'low'
                    CHECK (priority IN ('low','medium','high','critical')),
  status          text NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','reviewed','planned','in_progress','closed')),
  tags            text[] NOT NULL DEFAULT '{}',
  screenshot_url  text,
  attachments     jsonb,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_archived     boolean NOT NULL DEFAULT false,
  is_public       boolean DEFAULT true,
  vote_count      integer DEFAULT 0,
  agent_name      text,
  agent_session_id text,
  structured_data jsonb,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_project_created ON public.feedback(project_id, created_at DESC);
CREATE INDEX idx_feedback_project_status ON public.feedback(project_id, status);
CREATE INDEX idx_feedback_project_type ON public.feedback(project_id, type);
CREATE INDEX idx_feedback_tags_gin ON public.feedback USING gin(tags);
CREATE INDEX idx_feedback_is_public ON public.feedback(is_public) WHERE is_public = true;
CREATE INDEX idx_feedback_vote_count ON public.feedback(vote_count DESC) WHERE is_public = true;
CREATE INDEX idx_feedback_agent ON public.feedback(project_id, agent_name) WHERE agent_name IS NOT NULL;
CREATE INDEX idx_feedback_public_board ON public.feedback(project_id, is_public, is_archived, type)
  WHERE is_public = true AND is_archived = false;

CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_select_owned" ON public.feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = feedback.project_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "feedback_update_owned" ON public.feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = feedback.project_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = feedback.project_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 3. WIDGET_CONFIGS
-- ============================================================================

CREATE TABLE public.widget_configs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  channel     text NOT NULL DEFAULT 'default',
  version     integer NOT NULL,
  label       text NOT NULL DEFAULT 'Default',
  config      jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active   boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_widget_configs_project ON public.widget_configs(project_id, channel);
CREATE UNIQUE INDEX idx_widget_configs_version ON public.widget_configs(project_id, channel, version);
CREATE INDEX idx_widget_configs_created_by ON public.widget_configs(created_by);

CREATE OR REPLACE FUNCTION public.widget_configs_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_version integer;
BEGIN
  IF NEW.channel IS NULL OR length(trim(NEW.channel)) = 0 THEN
    NEW.channel := 'default';
  ELSE
    NEW.channel := lower(trim(NEW.channel));
  END IF;

  IF NEW.version IS NULL OR NEW.version <= 0 THEN
    SELECT coalesce(max(version), 0) + 1
      INTO next_version
      FROM public.widget_configs
     WHERE project_id = NEW.project_id
       AND channel = NEW.channel;
    NEW.version := coalesce(next_version, 1);
  END IF;

  IF NEW.label IS NULL OR length(trim(NEW.label)) = 0 THEN
    NEW.label := 'Version ' || NEW.version;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_widget_configs_before_write
  BEFORE INSERT OR UPDATE ON public.widget_configs
  FOR EACH ROW EXECUTE FUNCTION public.widget_configs_before_write();

ALTER TABLE public.widget_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "widget_configs_owner_all" ON public.widget_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = widget_configs.project_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = widget_configs.project_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 4. WEBHOOK_DELIVERIES
-- ============================================================================

CREATE TABLE public.webhook_deliveries (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id       uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  endpoint_id      text,
  event            text NOT NULL,
  kind             text NOT NULL CHECK (kind IN ('slack','discord','generic','github','email')),
  url              text NOT NULL,
  status           text NOT NULL CHECK (status IN ('success','failed','pending')),
  status_code      integer,
  error            text,
  payload          jsonb,
  response_time_ms integer,
  response_body    text,
  attempt          integer NOT NULL DEFAULT 1,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_del_project_created ON public.webhook_deliveries(project_id, created_at DESC);
CREATE INDEX idx_webhook_del_project_endpoint ON public.webhook_deliveries(project_id, endpoint_id, created_at DESC);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_select_owned" ON public.webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = webhook_deliveries.project_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- 5. RATE_LIMITS
-- ============================================================================

CREATE TABLE public.rate_limits (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        text NOT NULL,
  route      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(key, route, created_at DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rate_limits_deny_all" ON public.rate_limits FOR ALL
  USING (false);

-- ============================================================================
-- 6. USER_SETTINGS
-- ============================================================================

CREATE TABLE public.user_settings (
  user_id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences           jsonb NOT NULL DEFAULT '{}'::jsonb,
  notification_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select_own" ON public.user_settings FOR SELECT
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_settings_insert_own" ON public.user_settings FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_settings_update_own" ON public.user_settings FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 7. FEEDBACK_NOTES
-- ============================================================================

CREATE TABLE public.feedback_notes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 5000),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_notes_feedback ON public.feedback_notes(feedback_id, created_at);
CREATE INDEX idx_feedback_notes_user ON public.feedback_notes(user_id);

ALTER TABLE public.feedback_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_notes_select_owned" ON public.feedback_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.feedback f
      JOIN public.projects p ON p.id = f.project_id
      WHERE f.id = feedback_notes.feedback_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "feedback_notes_insert_owned" ON public.feedback_notes FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.feedback f
      JOIN public.projects p ON p.id = f.project_id
      WHERE f.id = feedback_notes.feedback_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "feedback_notes_delete_own" ON public.feedback_notes FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- 8. WIDGET_PRESETS
-- ============================================================================

CREATE TABLE public.widget_presets (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              text NOT NULL UNIQUE,
  name              text NOT NULL,
  description       text,
  category          text,
  preview_image_url text,
  config            jsonb NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.widget_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "widget_presets_read" ON public.widget_presets FOR SELECT
  USING (true);

-- ============================================================================
-- 9. PUBLIC_BOARD_SETTINGS
-- ============================================================================

CREATE TABLE public.public_board_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  slug text NOT NULL UNIQUE,
  title text,
  description text,
  show_types text[] DEFAULT '{idea,bug}',
  allow_submissions boolean DEFAULT true,
  require_email_to_vote boolean DEFAULT false,
  custom_css text,
  branding jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_public_board_settings_project_id ON public.public_board_settings(project_id);
CREATE INDEX idx_public_board_settings_slug ON public.public_board_settings(slug);

CREATE OR REPLACE FUNCTION update_board_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_board_settings_updated_at
  BEFORE UPDATE ON public.public_board_settings
  FOR EACH ROW EXECUTE FUNCTION update_board_settings_updated_at();

ALTER TABLE public.public_board_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read enabled boards" ON public.public_board_settings
  FOR SELECT USING (enabled = true);

CREATE POLICY "Project owners can manage board settings" ON public.public_board_settings
  FOR ALL
  USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_user_id = auth.uid())
  )
  WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE owner_user_id = auth.uid())
  );

-- ============================================================================
-- 10. VOTES
-- ============================================================================

CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  voter_identifier text NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feedback_id, voter_identifier)
);

CREATE INDEX idx_votes_feedback_id ON public.votes(feedback_id);
CREATE INDEX idx_votes_voter ON public.votes(voter_identifier);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes" ON public.votes
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.votes
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role manages vote deletes" ON public.votes
  FOR DELETE USING (true);

-- Vote count trigger (single correct version)
CREATE OR REPLACE FUNCTION update_feedback_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback SET vote_count = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END), 0)
      FROM votes WHERE feedback_id = NEW.feedback_id
    ) WHERE id = NEW.feedback_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback SET vote_count = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END), 0)
      FROM votes WHERE feedback_id = OLD.feedback_id
    ) WHERE id = OLD.feedback_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE feedback SET vote_count = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END), 0)
      FROM votes WHERE feedback_id = NEW.feedback_id
    ) WHERE id = NEW.feedback_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_count
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION update_feedback_vote_count();

-- ============================================================================
-- 11. count_by_column RPC (for agent API stats)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.count_by_column(
  table_name text,
  column_name text,
  filter_project_id uuid
)
RETURNS TABLE(value text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF table_name NOT IN ('feedback') THEN
    RAISE EXCEPTION 'Invalid table name';
  END IF;
  IF column_name NOT IN ('type', 'status', 'priority') THEN
    RAISE EXCEPTION 'Invalid column name';
  END IF;

  RETURN QUERY EXECUTE format(
    'SELECT %I::text AS value, COUNT(*)::bigint AS count FROM public.%I WHERE project_id = $1 AND %I IS NOT NULL GROUP BY %I ORDER BY count DESC',
    column_name, table_name, column_name, column_name
  ) USING filter_project_id;
END;
$$;

-- ============================================================================
-- 12. SEED DATA — Widget Presets
-- ============================================================================

INSERT INTO public.widget_presets (slug, name, description, category, config)
VALUES
  ('modal-classic', 'Modal Classic', 'Floating button with rounded modal and accent color.', 'modal',
    jsonb_build_object('embedMode','modal','position','bottom-right','buttonText','Feedback','primaryColor','#6366F1','enableRating',true,'enableType',true)),
  ('modal-minimal', 'Modal Minimal', 'Distraction-free modal focused on text feedback.', 'modal',
    jsonb_build_object('embedMode','modal','position','bottom-right','buttonText','Share thoughts','enableRating',false,'enableType',false,'requireEmail',false)),
  ('modal-dark', 'Modal Dark', 'Sleek dark-themed modal for modern apps.', 'modal',
    jsonb_build_object('embedMode','modal','position','bottom-right','buttonText','Send Feedback','primaryColor','#8B5CF6','backgroundColor','#1E1E2E','textColor','#E2E8F0','enableRating',true,'enableType',true)),
  ('inline-card', 'Inline Card', 'Card layout to embed inside help centers or docs.', 'inline',
    jsonb_build_object('embedMode','inline','target','#feedback-widget','backgroundColor','#FFFFFF','spacing',24,'enableScreenshot',true)),
  ('inline-highlight', 'Inline Highlight', 'High-contrast inline section suited for landing pages.', 'inline',
    jsonb_build_object('embedMode','inline','target','#feedback-widget','backgroundColor','#DBDDE1','primaryColor','#242424','headerLayout','icon-left','headerIcon','star')),
  ('popover-compact', 'Popover Compact', 'Tiny popover that expands on click — great for SaaS navbars.', 'popover',
    jsonb_build_object('embedMode','popover','position','bottom-left','buttonText','?','enableRating',false,'enableType',false,'compact',true))
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  config = EXCLUDED.config;

-- ============================================================================
-- DONE! Your v2 database is ready.
-- ============================================================================
