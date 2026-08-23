import test from 'node:test'
import assert from 'node:assert/strict'

async function loadStorageCleanup() {
  return import(new URL('../../src/lib/feedback-storage-cleanup.ts', import.meta.url).href)
}

test('extractStoragePathFromPublicUrl returns bucket-relative paths for Supabase public URLs', async () => {
  const { extractStoragePathFromPublicUrl } = await loadStorageCleanup()

  assert.equal(
    extractStoragePathFromPublicUrl(
      'https://example.supabase.co/storage/v1/object/public/feedback_screenshots/project-1/image%201.png',
      'feedback_screenshots',
      'https://example.supabase.co',
    ),
    'project-1/image 1.png',
  )
})

test('extractStoragePathFromPublicUrl rejects other origins and buckets', async () => {
  const { extractStoragePathFromPublicUrl } = await loadStorageCleanup()

  assert.equal(
    extractStoragePathFromPublicUrl(
      'https://other.supabase.co/storage/v1/object/public/feedback_screenshots/project-1/image.png',
      'feedback_screenshots',
      'https://example.supabase.co',
    ),
    null,
  )
  assert.equal(
    extractStoragePathFromPublicUrl(
      'https://example.supabase.co/storage/v1/object/public/other_bucket/project-1/image.png',
      'feedback_screenshots',
      'https://example.supabase.co',
    ),
    null,
  )
})

test('collectFeedbackStoragePaths dedupes screenshots and attachment paths', async () => {
  const { collectFeedbackStoragePaths } = await loadStorageCleanup()
  const base = 'https://example.supabase.co'

  assert.deepEqual(
    collectFeedbackStoragePaths(
      [
        {
          screenshot_url: `${base}/storage/v1/object/public/feedback_screenshots/project-1/screen.png`,
          attachments: [
            {
              url: `${base}/storage/v1/object/public/feedback_attachments/project-1/file.pdf`,
            },
            {
              url: `${base}/storage/v1/object/public/feedback_attachments/project-1/file.pdf`,
            },
          ],
        },
        {
          screenshot_url: `${base}/storage/v1/object/public/feedback_screenshots/project-1/screen.png`,
          attachments: [{ url: 'https://elsewhere.invalid/file.pdf' }],
        },
      ],
      base,
    ),
    {
      screenshots: ['project-1/screen.png'],
      attachments: ['project-1/file.pdf'],
    },
  )
})

test('cleanupFeedbackStorageForFeedbackIds removes public and private media for only the selected feedback', async () => {
  const { cleanupFeedbackStorageForFeedbackIds } = await loadStorageCleanup()
  const removed: Array<{ bucket: string; paths: string[] }> = []
  const base = 'https://example.supabase.co'
  const admin = {
    from(table: string) {
      if (table === 'feedback') {
        return {
          select() { return this },
          in() {
            return Promise.resolve({
              data: [{
                screenshot_url: `${base}/storage/v1/object/public/feedback_screenshots/project/screen.png`,
                attachments: [{ url: `${base}/storage/v1/object/public/feedback_attachments/project/file.pdf` }],
              }],
              error: null,
            })
          },
        }
      }
      return {
        select() { return this },
        in() { return this },
        is() {
          return Promise.resolve({
            data: [
              { bucket: 'feedback_screenshots', storage_path: 'project/private-screen.png' },
              { bucket: 'feedback_attachments', storage_path: 'project/private-file.pdf' },
            ],
            error: null,
          })
        },
      }
    },
    storage: {
      from(bucket: string) {
        return {
          remove(paths: string[]) {
            removed.push({ bucket, paths })
            return Promise.resolve({ error: null })
          },
        }
      },
    },
  }

  const result = await cleanupFeedbackStorageForFeedbackIds(admin as never, ['feedback-1'])

  assert.deepEqual(result, { screenshots: 2, attachments: 2 })
  assert.deepEqual(removed, [
    { bucket: 'feedback_screenshots', paths: ['project/screen.png', 'project/private-screen.png'] },
    { bucket: 'feedback_attachments', paths: ['project/file.pdf', 'project/private-file.pdf'] },
  ])
})
