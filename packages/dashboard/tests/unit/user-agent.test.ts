import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeUserAgent } from '../../src/lib/user-agent.ts'

test('summarizes the Edge compatibility user agent as one browser', () => {
  const result = summarizeUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
  )

  assert.equal(result.browser, 'Microsoft Edge')
  assert.equal(result.version, '151')
  assert.equal(result.operatingSystem, 'Windows 10 or 11')
  assert.equal(result.architecture, '64-bit')
  assert.equal(result.label, 'Microsoft Edge 151 on Windows 10 or 11')
})

test('summarizes Chrome, Firefox, Safari, and unknown agents without mislabeling Edge', () => {
  assert.equal(
    summarizeUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36').label,
    'Google Chrome 150 on Linux',
  )
  assert.equal(
    summarizeUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) Gecko/20100101 Firefox/149.0').label,
    'Mozilla Firefox 149 on macOS 14.7',
  )
  assert.equal(
    summarizeUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1').label,
    'Safari 18 on iOS or iPadOS',
  )
  assert.equal(summarizeUserAgent('custom-agent').label, 'Unknown browser on Unknown operating system')
})
