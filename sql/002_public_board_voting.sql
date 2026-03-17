-- Public Board & Voting System
-- Migration: 002_public_board_voting.sql

-- Public board settings per project
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

-- Votes on feedback items
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  feedback_id uuid NOT NULL REFERENCES public.feedback(id) ON DELETE CASCADE,
  voter_identifier text NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(feedback_id, voter_identifier)
);

-- Add columns to feedback
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS vote_count integer DEFAULT 0;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Indexes
CREATE INDEX idx_public_board_settings_project_id ON public.public_board_settings(project_id);
CREATE INDEX idx_public_board_settings_slug ON public.public_board_settings(slug);
CREATE INDEX idx_votes_feedback_id ON public.votes(feedback_id);
CREATE INDEX idx_votes_voter ON public.votes(voter_identifier);
CREATE INDEX idx_feedback_is_public ON public.feedback(is_public) WHERE is_public = true;
CREATE INDEX idx_feedback_vote_count ON public.feedback(vote_count DESC);

-- Trigger function to update vote_count on feedback
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feedback
    SET vote_count = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END), 0)
      FROM public.votes WHERE feedback_id = NEW.feedback_id
    )
    WHERE id = NEW.feedback_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feedback
    SET vote_count = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END), 0)
      FROM public.votes WHERE feedback_id = OLD.feedback_id
    )
    WHERE id = OLD.feedback_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.feedback
    SET vote_count = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END), 0)
      FROM public.votes WHERE feedback_id = NEW.feedback_id
    )
    WHERE id = NEW.feedback_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vote_count
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION update_vote_count();

-- Trigger to update updated_at on public_board_settings
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

-- RLS Policies

-- public_board_settings: owners can CRUD, anyone can read enabled boards
ALTER TABLE public.public_board_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read enabled boards"
  ON public.public_board_settings FOR SELECT
  USING (enabled = true);

CREATE POLICY "Project owners can manage board settings"
  ON public.public_board_settings FOR ALL
  USING (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects WHERE owner_user_id = auth.uid()
    )
  );

-- votes: anyone can insert/read, delete own
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert votes"
  ON public.votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete own votes"
  ON public.votes FOR DELETE
  USING (true);

-- Allow service role full access (for API routes using admin client)
-- The admin client bypasses RLS by default, so no additional policies needed.
