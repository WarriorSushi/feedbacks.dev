import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('quota RPCs serialize all owner writes before checking and inserting', () => {
  const migration = read('../../../../sql/063_atomic_free_plan_quota_writes.sql')
  const lockKey = /feedbacks\.dev:quota:/g

  assert.equal(migration.match(lockKey)?.length, 2)
  assert.match(migration, /pg_advisory_xact_lock/)

  const projectFunction = migration.slice(
    migration.indexOf('create or replace function public.create_project_with_quota'),
    migration.indexOf('create or replace function public.insert_feedback_with_quota'),
  )
  assert.ok(projectFunction.indexOf('pg_advisory_xact_lock') < projectFunction.indexOf('select count(*)::integer'))
  assert.ok(projectFunction.indexOf('select count(*)::integer') < projectFunction.indexOf('insert into public.projects'))

  const feedbackFunction = migration.slice(
    migration.indexOf('create or replace function public.insert_feedback_with_quota'),
  )
  assert.ok(feedbackFunction.indexOf('pg_advisory_xact_lock') < feedbackFunction.indexOf("counter.metric = 'feedback_submissions'"))
  assert.ok(feedbackFunction.indexOf("counter.metric = 'feedback_submissions'") < feedbackFunction.indexOf('insert into public.feedback ('))
  assert.ok(feedbackFunction.indexOf('insert into public.feedback (') < feedbackFunction.indexOf('insert into public.usage_counters'))
})

test('atomic quota logic preserves paid-through and complimentary Pro access', () => {
  const migration = read('../../../../sql/063_atomic_free_plan_quota_writes.sql')

  assert.match(migration, /complimentary_pro_until > pg_catalog\.now\(\)/)
  assert.match(migration, /cancel_at_period_end[\s\S]+current_period_end > pg_catalog\.now\(\)[\s\S]+billing_status in \('active', 'trialing', 'cancelled'\)/)
  assert.equal((migration.match(/or account\.billing_status in \('active', 'trialing'\)/g) || []).length, 2)
  assert.match(migration, /not p_bypass_quota[\s\S]+not v_effective_pro/)
})

test('quota RPCs are service-only and direct project mutations cannot bypass them', () => {
  const migration = read('../../../../sql/063_atomic_free_plan_quota_writes.sql')

  assert.match(migration, /security definer[\s\S]+set search_path = ''/)
  assert.match(migration, /drop policy if exists "projects_insert_own"/)
  assert.match(migration, /drop policy if exists "projects_update_own"/)
  assert.match(migration, /drop policy if exists "projects_delete_own"/)
  assert.match(migration, /revoke insert, update, delete on table public\.projects from anon, authenticated/)
  assert.equal((migration.match(/revoke execute on function public\.(?:create_project|insert_feedback)_with_quota/g) || []).length, 2)
  assert.equal((migration.match(/grant execute on function public\.(?:create_project|insert_feedback)_with_quota/g) || []).length, 2)
})

test('every quota-bearing route writes through the atomic RPC and product feedback stays exempt', () => {
  const projectRoute = read('../../src/app/api/projects/route.ts')
  const feedbackRoutes = [
    '../../src/app/api/feedback/route.ts',
    '../../src/app/api/boards/[slug]/submit/route.ts',
    '../../src/app/api/v1/feedback/route.ts',
  ].map(read)

  assert.match(projectRoute, /createProjectWithAtomicQuota/)
  assert.doesNotMatch(projectRoute, /admin\.from\('projects'\)\.insert\(project\)/)
  for (const route of feedbackRoutes) {
    assert.match(route, /insertFeedbackWithAtomicQuota/)
    assert.doesNotMatch(route, /incrementFeedbackUsage/)
  }

  const productFeedback = read('../../src/app/api/product-feedback/route.ts')
  assert.doesNotMatch(productFeedback, /insertFeedbackWithAtomicQuota|assertCanReceiveFeedback|incrementFeedbackUsage/)
})

test('widget media, replay, usage, and activation share the feedback transaction', () => {
  const migration = read('../../../../sql/063_atomic_free_plan_quota_writes.sql')
  const widgetRoute = read('../../src/app/api/feedback/route.ts')

  assert.match(migration, /insert into public\.feedback_media/)
  assert.match(migration, /insert into public\.activation_milestones/)
  assert.match(migration, /on conflict \(project_id, event_name\) do nothing/)
  assert.match(migration, /if p_allow_replay[\s\S]+status', 'replayed'/)
  assert.match(widgetRoute, /media: mediaRows/)
  assert.match(widgetRoute, /allowReplay: Boolean\(submittedId\)/)
  assert.match(widgetRoute, /recordFirstFeedback: true/)
  assert.match(widgetRoute, /write\.status === 'replayed'[\s\S]+cleanupUploadedObjects/)
  assert.match(widgetRoute, /write\.status === 'quota_reached'[\s\S]+cleanupUploadedObjects/)
  assert.doesNotMatch(widgetRoute, /from\('feedback_media'\)\.insert/)
})

test('v1 idempotency reservations are released if the atomic write is rejected', () => {
  const route = read('../../src/app/api/v1/feedback/route.ts')
  const rejectionBranch = route.slice(route.indexOf("if (write.status !== 'created')"))

  assert.match(rejectionBranch, /from\('api_idempotency_keys'\)/)
  assert.match(rejectionBranch, /\.delete\(\)/)
  assert.match(rejectionBranch, /write\.status === 'quota_reached'/)
})
