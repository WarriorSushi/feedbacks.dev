-- ============================================================================
-- 007_phase6_hardening.sql
-- Typed board profile data, public board primitives, and durable webhook jobs
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Typed board profile fields on public_board_settings
-- ---------------------------------------------------------------------------

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted', 'private'));

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS directory_opt_in boolean NOT NULL DEFAULT true;

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS accent_color text;

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS logo_emoji text;

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS hero_eyebrow text;

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS hero_title text;

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS hero_description text;

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS tagline text;

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS website_url text;

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS categories text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS empty_state_title text;

ALTER TABLE public.public_board_settings
  ADD COLUMN IF NOT EXISTS empty_state_description text;

UPDATE public.public_board_settings
SET
  visibility = CASE
    WHEN coalesce(branding->>'visibility', '') IN ('public', 'unlisted', 'private')
      THEN branding->>'visibility'
    ELSE visibility
  END,
  directory_opt_in = CASE
    WHEN lower(coalesce(branding->>'directoryOptIn', branding->>'directory_opt_in', '')) IN ('true', 'false')
      THEN (coalesce(branding->>'directoryOptIn', branding->>'directory_opt_in'))::boolean
    ELSE directory_opt_in
  END,
  accent_color = coalesce(nullif(branding->>'accentColor', ''), nullif(branding->>'accent_color', ''), accent_color),
  logo_emoji = coalesce(nullif(branding->>'logoEmoji', ''), nullif(branding->>'logo_emoji', ''), logo_emoji),
  hero_eyebrow = coalesce(nullif(branding->>'heroEyebrow', ''), nullif(branding->>'hero_eyebrow', ''), hero_eyebrow),
  hero_title = coalesce(nullif(branding->>'heroTitle', ''), nullif(branding->>'hero_title', ''), hero_title),
  hero_description = coalesce(nullif(branding->>'heroDescription', ''), nullif(branding->>'hero_description', ''), hero_description),
  tagline = coalesce(nullif(branding->>'tagline', ''), tagline),
  website_url = coalesce(nullif(branding->>'websiteUrl', ''), nullif(branding->>'website_url', ''), website_url),
  categories = coalesce(
    (
      SELECT array_agg(lower(trim(value)))
      FROM jsonb_array_elements_text(coalesce(branding->'categories', '[]'::jsonb)) AS t(value)
      WHERE trim(value) <> ''
    ),
    categories
  ),
  empty_state_title = coalesce(nullif(branding->>'emptyStateTitle', ''), nullif(branding->>'empty_state_title', ''), empty_state_title),
  empty_state_description = coalesce(nullif(branding->>'emptyStateDescription', ''), nullif(branding->>'empty_state_description', ''), empty_state_description)
WHERE branding IS NOT NULL
  AND branding <> '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_public_board_settings_visibility
  ON public.public_board_settings(visibility, directory_opt_in);

CREATE INDEX IF NOT EXISTS idx_public_board_settings_categories_gin
  ON public.public_board_settings USING gin(categories);

DROP POLICY IF EXISTS "Anyone can read enabled boards" ON public.public_board_settings;
CREATE POLICY "Anyone can read accessible boards" ON public.public_board_settings
  FOR SELECT
  USING (enabled = true AND visibility <> 'private');

-- ---------------------------------------------------------------------------
-- 2. Board announcements
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.board_announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id uuid NOT NULL REFERENCES public.public_board_settings(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 600),
  href text,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_announcements_board_published
  ON public.board_announcements(board_id, published_at DESC, sort_order ASC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_board_announcements_updated_at'
  ) THEN
    CREATE TRIGGER trg_board_announcements_updated_at
      BEFORE UPDATE ON public.board_announcements
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

INSERT INTO public.board_announcements (
  board_id,
  project_id,
  title,
  body,
  href,
  sort_order,
  published_at
)
SELECT
  board.id,
  board.project_id,
  left(trim(announcement.value->>'title'), 120),
  left(trim(announcement.value->>'body'), 600),
  nullif(trim(announcement.value->>'href'), ''),
  announcement.ordinality - 1,
  CASE
    WHEN coalesce(announcement.value->>'date', '') ~ '^\d{4}-\d{2}-\d{2}$'
      THEN (announcement.value->>'date')::date::timestamptz
    ELSE board.updated_at
  END
FROM public.public_board_settings AS board
JOIN LATERAL jsonb_array_elements(coalesce(board.branding->'announcements', '[]'::jsonb))
  WITH ORDINALITY AS announcement(value, ordinality) ON true
WHERE trim(coalesce(announcement.value->>'title', '')) <> ''
  AND trim(coalesce(announcement.value->>'body', '')) <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.board_announcements AS existing
    WHERE existing.board_id = board.id
  );

ALTER TABLE public.board_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "board_announcements_owner_all" ON public.board_announcements;
CREATE POLICY "board_announcements_owner_all" ON public.board_announcements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects AS p
      WHERE p.id = board_announcements.project_id
        AND p.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects AS p
      WHERE p.id = board_announcements.project_id
        AND p.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "board_announcements_public_read" ON public.board_announcements;
CREATE POLICY "board_announcements_public_read" ON public.board_announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.public_board_settings AS board
      WHERE board.id = board_announcements.board_id
        AND board.enabled = true
        AND board.visibility <> 'private'
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Account-backed follows and watches
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.board_follows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id uuid NOT NULL REFERENCES public.public_board_settings(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_board_follows_board_id
  ON public.board_follows(board_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_board_follows_user_id
  ON public.board_follows(user_id, created_at DESC);

ALTER TABLE public.board_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "board_follows_select_own" ON public.board_follows;
CREATE POLICY "board_follows_select_own" ON public.board_follows
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "board_follows_insert_own" ON public.board_follows;
CREATE POLICY "board_follows_insert_own" ON public.board_follows
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "board_follows_delete_own" ON public.board_follows;
CREATE POLICY "board_follows_delete_own" ON public.board_follows
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.feedback_watches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id uuid NOT NULL REFERENCES public.public_board_settings(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feedback_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_watches_board_id
  ON public.feedback_watches(board_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_watches_feedback_id
  ON public.feedback_watches(feedback_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_watches_user_id
  ON public.feedback_watches(user_id, created_at DESC);

ALTER TABLE public.feedback_watches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_watches_select_own" ON public.feedback_watches;
CREATE POLICY "feedback_watches_select_own" ON public.feedback_watches
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "feedback_watches_insert_own" ON public.feedback_watches;
CREATE POLICY "feedback_watches_insert_own" ON public.feedback_watches
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "feedback_watches_delete_own" ON public.feedback_watches;
CREATE POLICY "feedback_watches_delete_own" ON public.feedback_watches
  FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. First-party board and post reports
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.board_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id uuid NOT NULL REFERENCES public.public_board_settings(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  feedback_id uuid REFERENCES public.feedback(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_identifier text NOT NULL,
  reporter_email text,
  target_type text NOT NULL CHECK (target_type IN ('board', 'feedback')),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 1 AND 160),
  details text CHECK (details IS NULL OR length(trim(details)) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_reports_project_status
  ON public.board_reports(project_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_board_reports_board_target
  ON public.board_reports(board_id, feedback_id, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_board_reports_updated_at'
  ) THEN
    CREATE TRIGGER trg_board_reports_updated_at
      BEFORE UPDATE ON public.board_reports
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

ALTER TABLE public.board_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "board_reports_select_owned" ON public.board_reports;
CREATE POLICY "board_reports_select_owned" ON public.board_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects AS p
      WHERE p.id = board_reports.project_id
        AND p.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "board_reports_update_owned" ON public.board_reports;
CREATE POLICY "board_reports_update_owned" ON public.board_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects AS p
      WHERE p.id = board_reports.project_id
        AND p.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects AS p
      WHERE p.id = board_reports.project_id
        AND p.owner_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Durable webhook jobs
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.webhook_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('slack', 'discord', 'generic', 'github', 'email')),
  endpoint_id text,
  endpoint_url text NOT NULL,
  event text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'retrying', 'succeeded', 'failed')),
  attempt integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 4,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  last_error text,
  last_delivery_id uuid REFERENCES public.webhook_deliveries(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_jobs_status_next_attempt
  ON public.webhook_jobs(status, next_attempt_at ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_webhook_jobs_project_status
  ON public.webhook_jobs(project_id, status, created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_webhook_jobs_updated_at'
  ) THEN
    CREATE TRIGGER trg_webhook_jobs_updated_at
      BEFORE UPDATE ON public.webhook_jobs
      FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;

ALTER TABLE public.webhook_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "webhook_jobs_select_owned" ON public.webhook_jobs;
CREATE POLICY "webhook_jobs_select_owned" ON public.webhook_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects AS p
      WHERE p.id = webhook_jobs.project_id
        AND p.owner_user_id = auth.uid()
    )
  );
