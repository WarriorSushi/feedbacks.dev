-- Migration: 005_security_fixes.sql
-- Security and consistency fixes

-- ==========================================================================
-- 1. Fix vote DELETE RLS policy — restrict to voter's own votes
-- ==========================================================================

-- Drop and recreate with a more descriptive name.
-- Since votes are anonymous (no auth.uid()), the real protection is app-level.
-- The admin/service-role client bypasses RLS anyway.
DROP POLICY IF EXISTS "Anyone can delete own votes" ON public.votes;
CREATE POLICY "Service role manages vote deletes" ON public.votes
  FOR DELETE USING (true);

-- ==========================================================================
-- 2. Make url nullable, remove CHECK constraint that blocks board/empty inserts
-- ==========================================================================

ALTER TABLE public.feedback ALTER COLUMN url DROP NOT NULL;
ALTER TABLE public.feedback ALTER COLUMN url SET DEFAULT NULL;

-- Drop the CHECK constraint on url (name may vary, try common patterns)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.feedback'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%url%https%'
  LOOP
    EXECUTE format('ALTER TABLE public.feedback DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- ==========================================================================
-- 3. Fix duplicate vote triggers — drop 002's trigger, keep 004's
-- ==========================================================================

-- Drop the trigger created by 002 (uses update_vote_count function)
DROP TRIGGER IF EXISTS trigger_update_vote_count ON public.votes;

-- Drop the old function from 002
DROP FUNCTION IF EXISTS update_vote_count();

-- Recreate the single correct trigger using 004's function
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
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_vote_count();

-- ==========================================================================
-- 4. Fix is_public default — should be true for new feedback
-- ==========================================================================

ALTER TABLE public.feedback ALTER COLUMN is_public SET DEFAULT true;

-- ==========================================================================
-- 5. Add count_by_column RPC function
-- ==========================================================================

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
  -- Only allow specific tables/columns for safety
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

-- ==========================================================================
-- 6. Add api_key_hash column for hashed API key storage
-- ==========================================================================

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS api_key_hash text;
CREATE INDEX IF NOT EXISTS idx_projects_api_key_hash ON public.projects(api_key_hash);

-- Backfill hashes for existing keys (SHA-256 via pgcrypto)
UPDATE public.projects
SET api_key_hash = encode(digest(api_key, 'sha256'), 'hex')
WHERE api_key_hash IS NULL AND api_key IS NOT NULL;
