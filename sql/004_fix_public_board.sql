-- Migration: Fix public board support
-- Adds is_public and vote_count columns to feedback table
-- Creates trigger to auto-update vote_count

-- Add missing columns to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS vote_count integer DEFAULT 0;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS agent_name text;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS agent_session_id text;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS structured_data jsonb;

-- Create index for public board queries
CREATE INDEX IF NOT EXISTS idx_feedback_public_board
  ON feedback (project_id, is_public, is_archived, type)
  WHERE is_public = true AND is_archived = false;

CREATE INDEX IF NOT EXISTS idx_feedback_vote_count
  ON feedback (vote_count DESC)
  WHERE is_public = true;

-- Function to update vote_count on feedback
CREATE OR REPLACE FUNCTION update_feedback_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback SET vote_count = (
      SELECT COUNT(*) FROM votes WHERE feedback_id = NEW.feedback_id AND vote_type = 'up'
    ) - (
      SELECT COUNT(*) FROM votes WHERE feedback_id = NEW.feedback_id AND vote_type = 'down'
    ) WHERE id = NEW.feedback_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback SET vote_count = (
      SELECT COUNT(*) FROM votes WHERE feedback_id = OLD.feedback_id AND vote_type = 'up'
    ) - (
      SELECT COUNT(*) FROM votes WHERE feedback_id = OLD.feedback_id AND vote_type = 'down'
    ) WHERE id = OLD.feedback_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_update_vote_count ON votes;
CREATE TRIGGER trigger_update_vote_count
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_vote_count();

-- RLS policies for votes table
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert votes" ON votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete own votes" ON votes
  FOR DELETE USING (true);

-- RLS for public board settings (public read)
ALTER TABLE public_board_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read enabled boards" ON public_board_settings
  FOR SELECT USING (enabled = true);

CREATE POLICY "Owners can manage board settings" ON public_board_settings
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE owner_user_id = auth.uid())
  );
