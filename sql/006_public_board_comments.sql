-- ============================================================================
-- 006: Add is_public flag to feedback_notes for public board admin comments
-- ============================================================================

ALTER TABLE public.feedback_notes
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Allow anonymous users to read public notes (admin comments on public board)
CREATE POLICY "feedback_notes_public_read" ON public.feedback_notes FOR SELECT
  USING (is_public = true);
