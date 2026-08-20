const origin = 'https://www.feedbacks.dev'
const host = 'www.feedbacks.dev'
const key = '487290565ce447249646125190d88b3a'
const keyLocation = `${origin}/${key}.txt`

const defaultPaths = [
  '/',
  '/feedback-widget',
  '/feedback-widget/nextjs',
  '/canny-alternative',
  '/docs/quickstart',
  '/sitemap.xml',
]

const requestedPaths = process.argv.slice(2)
const inputs = requestedPaths.length > 0 ? requestedPaths : defaultPaths
const urlList = [...new Set(inputs.map((input) => new URL(input, origin).toString()))]

for (const value of urlList) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.host !== host) {
    throw new Error(`IndexNow URL must belong to ${origin}: ${value}`)
  }
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation, urlList }),
})

if (!response.ok) {
  const body = await response.text()
  throw new Error(`IndexNow returned ${response.status}: ${body || response.statusText}`)
}

console.log(`IndexNow accepted ${urlList.length} updated URLs with status ${response.status}.`)
