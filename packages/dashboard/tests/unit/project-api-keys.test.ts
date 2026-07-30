import test from 'node:test'
import assert from 'node:assert/strict'

async function loadProjectApiKeys() {
  return import(new URL('../../src/lib/project-api-keys.ts', import.meta.url).href)
}

test('publishable project keys round-trip a project UUID', async () => {
  const { getProjectPublishableKey, parseProjectPublishableKey } = await loadProjectApiKeys()
  const projectId = '01234567-89ab-4cde-8f01-23456789abcd'
  const publishableKey = getProjectPublishableKey(projectId)

  assert.equal(publishableKey, 'fb_pub_0123456789ab4cde8f0123456789abcd')
  assert.equal(parseProjectPublishableKey(publishableKey), projectId)
})

test('public project lookup rejects private API credentials', async () => {
  const { generateProjectApiKey, getPublicProjectLookup, isPrivateProjectApiKey } = await loadProjectApiKeys()
  const privateKey = generateProjectApiKey()

  assert.equal(isPrivateProjectApiKey(privateKey), true)
  assert.equal(await getPublicProjectLookup(privateKey), null)
})

test('legacy browser keys remain resolvable during embed migration', async () => {
  const { getPublicProjectLookup, hashProjectApiKey } = await loadProjectApiKeys()
  const legacyKey = 'fb_legacywidgetkey123'

  assert.deepEqual(await getPublicProjectLookup(legacyKey), {
    column: 'api_key_hash',
    value: await hashProjectApiKey(legacyKey),
  })
})

test('invalid publishable keys do not resolve', async () => {
  const { getProjectPublishableKey, getPublicProjectLookup, parseProjectPublishableKey } = await loadProjectApiKeys()

  assert.equal(parseProjectPublishableKey('fb_pub_not-a-uuid'), null)
  assert.equal(await getPublicProjectLookup('fb_pub_not-a-uuid'), null)
  assert.throws(() => getProjectPublishableKey('not-a-uuid'), /must be a UUID/)
})
