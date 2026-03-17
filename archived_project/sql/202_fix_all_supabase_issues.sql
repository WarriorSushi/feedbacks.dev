-- 202_fix_all_supabase_issues.sql
-- Fixes all security and performance issues found in Supabase linter
-- Date: 2025-10-19
-- Run this in Supabase SQL Editor after 201_schema_reset.sql

-- ============================================================================
-- PART 1: CRITICAL SECURITY FIX - Enable RLS on rate_limits table
-- ============================================================================
-- Issue: rate_limits table has no Row Level Security enabled
-- Risk: Anyone can access/modify rate limit data
-- Priority: CRITICAL

BEGIN;

-- Enable RLS on rate_limits table
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Since rate_limits is used internally by the API (not user-facing),
-- we'll make it service_role only (no direct user access)
CREATE POLICY "rate_limits_service_role_only"
  ON public.rate_limits
  FOR ALL
  USING (false); -- Users cannot access at all

-- The service role will bypass RLS automatically
-- This protects the table from public access while allowing API to use it

COMMIT;

-- ============================================================================
-- PART 2: PERFORMANCE FIX - Fix RLS InitPlan Issues (13 policies)
-- ============================================================================
-- Issue: auth.uid() is re-evaluated for EVERY row instead of once
-- Impact: Slow queries when tables have many rows
-- Fix: Wrap auth.uid() in (SELECT auth.uid())

BEGIN;

-- Drop all existing policies that have the performance issue
DROP POLICY IF EXISTS "projects_select_owned" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_owned" ON public.projects;
DROP POLICY IF EXISTS "projects_update_owned" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_owned" ON public.projects;
DROP POLICY IF EXISTS "widget_configs_select_owned" ON public.widget_configs;
DROP POLICY IF EXISTS "widget_configs_mutate_owned" ON public.widget_configs;
DROP POLICY IF EXISTS "widget_config_events_select_owned" ON public.widget_config_events;
DROP POLICY IF EXISTS "feedback_select_owned" ON public.feedback;
DROP POLICY IF EXISTS "feedback_update_owned" ON public.feedback;
DROP POLICY IF EXISTS "webhook_deliveries_select_owned" ON public.webhook_deliveries;
DROP POLICY IF EXISTS "user_settings_select_own" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_upsert_own" ON public.user_settings;
DROP POLICY IF EXISTS "user_settings_update_own" ON public.user_settings;

-- Recreate all policies with optimized auth.uid() usage
-- Using (SELECT auth.uid()) calculates the user ID once instead of per row

-- Projects table policies
CREATE POLICY "projects_select_owned"
  ON public.projects FOR SELECT
  USING ((SELECT auth.uid()) = owner_user_id);

CREATE POLICY "projects_insert_owned"
  ON public.projects FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = owner_user_id);

CREATE POLICY "projects_update_owned"
  ON public.projects FOR UPDATE
  USING ((SELECT auth.uid()) = owner_user_id)
  WITH CHECK ((SELECT auth.uid()) = owner_user_id);

CREATE POLICY "projects_delete_owned"
  ON public.projects FOR DELETE
  USING ((SELECT auth.uid()) = owner_user_id);

-- Widget configs policies
CREATE POLICY "widget_configs_select_owned"
  ON public.widget_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = widget_configs.project_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "widget_configs_mutate_owned"
  ON public.widget_configs FOR ALL
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

-- Widget config events policy
CREATE POLICY "widget_config_events_select_owned"
  ON public.widget_config_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = widget_config_events.project_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  );

-- Feedback policies
CREATE POLICY "feedback_select_owned"
  ON public.feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = feedback.project_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "feedback_update_owned"
  ON public.feedback FOR UPDATE
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

-- Webhook deliveries policy
CREATE POLICY "webhook_deliveries_select_owned"
  ON public.webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = webhook_deliveries.project_id
        AND p.owner_user_id = (SELECT auth.uid())
    )
  );

-- User settings policies
CREATE POLICY "user_settings_select_own"
  ON public.user_settings FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_settings_upsert_own"
  ON public.user_settings FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_settings_update_own"
  ON public.user_settings FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

COMMIT;

-- ============================================================================
-- PART 3: PERFORMANCE FIX - Remove Duplicate SELECT Policy
-- ============================================================================
-- Issue: widget_configs has TWO policies that both allow SELECT
-- Impact: Postgres runs both policies unnecessarily, slowing down queries
-- Fix: The mutate_owned policy already covers SELECT (it's FOR ALL)
--      So we can drop the separate select_owned policy

BEGIN;

-- Drop the duplicate SELECT-only policy
-- We keep mutate_owned because it covers SELECT, INSERT, UPDATE, DELETE
DROP POLICY IF EXISTS "widget_configs_select_owned" ON public.widget_configs;

-- Note: The widget_configs_mutate_owned policy remains and handles all operations
-- This eliminates the duplicate policy warning

COMMIT;

-- ============================================================================
-- PART 4: PERFORMANCE FIX - Add Missing Indexes on Foreign Keys
-- ============================================================================
-- Issue: Foreign keys without indexes cause slow JOIN queries
-- Impact: Queries that join these tables will do table scans
-- Fix: Add indexes to all unindexed foreign keys

BEGIN;

-- Add index on widget_config_events.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_widget_config_events_user_id
  ON public.widget_config_events(user_id);

-- Add index on widget_config_events.widget_config_id foreign key
CREATE INDEX IF NOT EXISTS idx_widget_config_events_widget_config_id
  ON public.widget_config_events(widget_config_id);

-- Add index on widget_configs.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_widget_configs_created_by
  ON public.widget_configs(created_by);

COMMIT;

-- ============================================================================
-- PART 5: SECURITY FIX - Set search_path on Functions
-- ============================================================================
-- Issue: Functions without fixed search_path can be exploited
-- Impact: Potential privilege escalation attacks
-- Fix: Add "SET search_path = public" to all functions

BEGIN;

-- Fix touch_updated_at function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$;

-- Fix widget_configs_before_write function
CREATE OR REPLACE FUNCTION public.widget_configs_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_version integer;
BEGIN
  IF new.channel IS NULL OR length(trim(new.channel)) = 0 THEN
    new.channel := 'default';
  ELSE
    new.channel := lower(trim(new.channel));
  END IF;

  IF new.version IS NULL OR new.version <= 0 THEN
    SELECT coalesce(max(version), 0) + 1
      INTO next_version
      FROM public.widget_configs
     WHERE project_id = new.project_id
       AND channel = new.channel;
    new.version := coalesce(next_version, 1);
  END IF;

  IF new.label IS NULL OR length(trim(new.label)) = 0 THEN
    new.label := 'Version ' || new.version;
  END IF;

  IF new.config IS NULL THEN
    new.config := '{}'::jsonb;
  END IF;

  new.updated_at := now();
  RETURN new;
END;
$$;

COMMIT;

-- ============================================================================
-- PART 6: CLEANUP - Remove Unused Indexes (Optional)
-- ============================================================================
-- Issue: 4 indexes exist but are never used by any queries
-- Impact: Waste disk space and slow down INSERT/UPDATE/DELETE
-- Note: ONLY run this if you're sure these indexes won't be needed

-- UNCOMMENT THE FOLLOWING LINES IF YOU WANT TO REMOVE UNUSED INDEXES:
-- (I've left them commented out for safety - you can test first)

-- BEGIN;
--
-- -- Remove unused index on widget_configs
-- DROP INDEX IF EXISTS public.idx_widget_configs_project;
--
-- -- Remove unused indexes on feedback table
-- DROP INDEX IF EXISTS public.idx_feedback_project_is_read;
-- DROP INDEX IF EXISTS public.idx_feedback_project_archived;
-- DROP INDEX IF EXISTS public.idx_feedback_tags_gin;
--
-- COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify all fixes were applied successfully

-- Check if RLS is enabled on rate_limits
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'rate_limits';
-- Expected: rowsecurity = true

-- Count policies on each table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Check that new indexes were created
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_widget_config_events_user_id',
    'idx_widget_config_events_widget_config_id',
    'idx_widget_configs_created_by'
  )
ORDER BY tablename, indexname;
-- Expected: 3 rows

-- Check that functions have search_path set
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('touch_updated_at', 'widget_configs_before_write')
  AND routine_definition LIKE '%SET search_path%';
-- Expected: 2 rows

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ Fixed 1 CRITICAL security issue (RLS on rate_limits)
-- ✅ Fixed 13 performance issues (RLS InitPlan)
-- ✅ Fixed 4 duplicate policy issues (widget_configs)
-- ✅ Added 3 missing indexes on foreign keys
-- ✅ Fixed 2 function security issues (search_path)
--
-- Remaining manual tasks:
-- 1. Enable leaked password protection in Supabase Dashboard → Auth settings
-- 2. Upgrade Postgres version in Supabase Dashboard → Settings → Infrastructure
-- 3. (Optional) Uncomment Part 6 to remove unused indexes after testing
-- ============================================================================
