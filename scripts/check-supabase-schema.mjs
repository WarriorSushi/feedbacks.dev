#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(path.join(process.cwd(), 'packages', 'dashboard', 'package.json'))
const { createClient } = require('@supabase/supabase-js')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  const body = fs.readFileSync(filePath, 'utf8')
  for (const line of body.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([^=]+)=(.*)$/)
    if (!match) continue
    const key = match[1].trim()
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'))
loadEnvFile(path.join(process.cwd(), 'packages', 'dashboard', '.env.local'))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
})

const requiredColumns = {
  projects: ['id', 'owner_user_id', 'api_key_hash', 'api_key_last_four', 'environment', 'test_namespace', 'expires_at', 'quarantined_at', 'creation_request_id', 'plan_frozen_at', 'plan_freeze_reason'],
  project_api_keys: ['id', 'project_id', 'key_hash', 'key_last_four', 'scopes', 'expires_at', 'revoked_at', 'last_used_at'],
  project_api_key_events: ['id', 'project_id', 'api_key_id', 'event_type', 'metadata', 'created_at'],
  project_integration_secrets: ['id', 'project_id', 'endpoint_id', 'kind', 'ciphertext', 'initialization_vector', 'auth_tag', 'key_version', 'destination_hint'],
  project_integration_secret_events: ['id', 'project_id', 'endpoint_id', 'kind', 'event_type', 'destination_hint', 'created_at'],
  activation_milestones: ['project_id', 'event_name', 'user_id', 'first_seen_at', 'metadata'],
  feedback: [
    'id',
    'project_id',
    'message',
    'priority',
    'status',
    'is_public',
    'vote_count',
    'read_at',
    'agent_name',
    'structured_data',
    'screenshot_path',
  ],
  feedback_media: ['id', 'feedback_id', 'project_id', 'kind', 'bucket', 'storage_path', 'safe_filename', 'mime_type', 'size_bytes', 'sha256', 'scan_status'],
  feedback_activity: ['id', 'feedback_id', 'project_id', 'actor_id', 'event_type', 'from_value', 'to_value', 'metadata', 'created_at'],
  public_board_settings: [
    'id',
    'project_id',
    'enabled',
    'slug',
    'visibility',
    'directory_opt_in',
    'categories',
    'display_name',
    'empty_state_title',
    'empty_state_description',
  ],
  board_follows: ['id', 'board_id', 'project_id', 'user_id', 'created_at'],
  feedback_watches: ['id', 'board_id', 'project_id', 'feedback_id', 'user_id', 'created_at'],
  billing_accounts: ['user_id', 'plan_tier', 'billing_status', 'dodo_customer_id', 'last_event_at', 'recurring_amount', 'billing_currency', 'billing_interval', 'billing_interval_count', 'complimentary_pro_until', 'grace_started_at', 'grace_ends_at', 'grace_cycle_id', 'downgrade_finalized_at', 'updated_at'],
  marketing_leads: ['id', 'email', 'email_hash', 'use_case', 'source', 'consent_version', 'consented_at', 'attribution', 'created_at', 'updated_at'],
  marketing_conversion_events: ['event_id', 'event_name', 'user_id', 'email_hash', 'source_url', 'attribution', 'consent_version', 'provider_results', 'status', 'attempt_count', 'created_at', 'delivered_at'],
  user_acquisition: ['user_id', 'referral_code', 'attribution', 'consent_version', 'signup_event_id', 'signup_recorded_at', 'network_hash', 'device_hash', 'created_at'],
  referral_programs: ['user_id', 'code', 'successful_referrals', 'reward_granted_at', 'reward_expires_at', 'created_at', 'updated_at'],
  referral_signups: ['id', 'inviter_user_id', 'invited_user_id', 'referral_code', 'invited_email_hash', 'network_hash', 'device_hash', 'status', 'risk_score', 'risk_reasons', 'qualified_at', 'created_at'],
  billing_lifecycle_notices: ['id', 'user_id', 'grace_cycle_id', 'notice_day', 'created_at'],
  billing_events: ['id', 'event_type', 'status', 'claim_token', 'locked_at', 'attempt_count', 'processing_error', 'occurred_at', 'processed_at'],
  account_deletion_jobs: ['id', 'user_id', 'user_email', 'status', 'claim_token', 'attempt_count', 'next_attempt_at', 'locked_at', 'last_error', 'updated_at'],
  api_idempotency_keys: ['project_id', 'route', 'key_hash', 'request_hash', 'status', 'response_status', 'response_body', 'expires_at'],
  notification_digests: ['user_id', 'digest_type', 'digest_date', 'sent_at', 'item_count'],
  cron_runs: ['id', 'job_name', 'status', 'started_at', 'finished_at', 'processed_count', 'sent_count'],
  webhook_digest_items: ['id', 'project_id', 'kind', 'endpoint_url', 'payload', 'digest_date', 'status', 'next_attempt_at'],
  webhook_jobs: ['id', 'project_id', 'kind', 'endpoint_url', 'payload', 'status', 'next_attempt_at'],
  webhook_deliveries: ['id', 'project_id', 'event', 'kind', 'url', 'status', 'payload', 'created_at'],
  product_update_settings: ['project_id', 'enabled', 'auto_show', 'display_delay_ms', 'theme', 'accent_color', 'include_paths', 'exclude_paths', 'show_powered_by'],
  product_updates: ['id', 'project_id', 'created_by', 'status', 'title', 'summary', 'highlights', 'image_path', 'image_alt_text', 'cta_label', 'cta_url', 'published_at', 'expires_at'],
  product_update_metrics: ['project_id', 'update_id', 'metric_date', 'event_type', 'count'],
  project_embed_installations: ['project_id', 'last_seen_at', 'runtime_version', 'feedback_enabled', 'updates_enabled'],
  email_delivery_events: ['id', 'provider_event_id', 'event_type', 'provider_email_id', 'recipient_hashes', 'reason', 'occurred_at', 'created_at'],
  email_suppressions: ['recipient_hash', 'reason', 'provider_event_id', 'last_event_at', 'created_at', 'updated_at'],
}

const requiredBuckets = {
  feedback_screenshots: { public: false },
  feedback_attachments: { public: false },
  product_update_images: { public: true },
}
const probeProjectId = '00000000-0000-0000-0000-000000000000'
const requiredReadOnlyFunctions = [
  {
    name: 'avg_rating_for_project',
    args: { p_project_id: probeProjectId },
  },
  {
    name: 'count_by_column',
    args: { table_name: 'feedback', column_name: 'type', filter_project_id: probeProjectId },
  },
  {
    name: 'dashboard_stats',
    args: {
      p_user_id: probeProjectId,
      p_project_id: null,
      p_history_cutoff: null,
      p_trend_start: new Date(0).toISOString(),
    },
  },
  {
    name: 'get_public_board_directory',
    args: { p_sort: 'new', p_category: null, p_query: null, p_limit: 1, p_offset: 0 },
  },
  {
    name: 'get_public_board_directory_cursor',
    args: {
      p_sort: 'new',
      p_category: null,
      p_query: null,
      p_limit: 1,
      p_after_score: null,
      p_after_activity: null,
      p_after_id: null,
      p_snapshot_at: null,
    },
  },
  {
    name: 'get_owner_project_health',
    args: {},
  },
  {
    name: 'register_referral_signup',
    args: {
      p_invited_user_id: probeProjectId,
      p_referral_code: 'invalid-code',
      p_invited_email_hash: '0'.repeat(64),
      p_network_hash: null,
      p_device_hash: null,
    },
  },
]

function fail(message, failures) {
  failures.push(message)
  console.error(`✗ ${message}`)
}

function pass(message) {
  console.log(`✓ ${message}`)
}

async function main() {
  const failures = []

  for (const [table, expectedColumns] of Object.entries(requiredColumns)) {
    const { error } = await supabase
      .from(table)
      .select(expectedColumns.join(','), { count: 'exact', head: true })

    if (error) {
      fail(`${table} column check failed: ${error.message}`, failures)
    } else {
      pass(`${table} columns present`)
    }
  }

  for (const fn of requiredReadOnlyFunctions) {
    const { error } = await supabase.rpc(fn.name, fn.args)
    if (error) {
      fail(`${fn.name} function check failed: ${error.message}`, failures)
    } else {
      pass(`${fn.name} function present and service-only probe succeeded`)
    }
  }

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
  if (bucketError) {
    fail(`Could not inspect storage buckets: ${bucketError.message}`, failures)
  } else {
    const bucketMap = new Map((buckets || []).map((bucket) => [bucket.id, bucket]))
    const missing = Object.keys(requiredBuckets).filter((bucket) => !bucketMap.has(bucket))
    if (missing.length > 0) {
      fail(`Missing storage buckets: ${missing.join(', ')}`, failures)
    } else {
      pass('storage buckets present')
    }
    for (const [bucketId, expectation] of Object.entries(requiredBuckets)) {
      const bucket = bucketMap.get(bucketId)
      if (bucket && bucket.public !== expectation.public) {
        fail(`${bucketId} public=${bucket.public}; expected public=${expectation.public}`, failures)
      } else if (bucket) {
        pass(`${bucketId} visibility is correct`)
      }
    }
  }

  if (failures.length > 0) {
    console.error(`\nSupabase schema check failed with ${failures.length} issue(s).`)
    process.exit(1)
  }

  console.log('\nSupabase schema check passed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
