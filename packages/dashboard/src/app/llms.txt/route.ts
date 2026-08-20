import { SITE_ORIGIN } from '@/lib/site'

export const dynamic = 'force-static'

const content = `# feedbacks.dev

> feedbacks.dev is a developer-first product feedback service for collecting contextual feedback, triaging it, and sharing selected requests and updates with users.

## Canonical locations

- Public website and documentation: ${SITE_ORIGIN}
- Authenticated application: https://app.feedbacks.dev
- Public board directory: ${SITE_ORIGIN}/boards

## Product capabilities

- Embeddable feedback collection for websites and applications
- Automatic page and browser context with each submission
- Feedback inbox for triage, status, notes, and prioritization
- Public feedback boards and product updates
- Integrations, REST API, and MCP access

## Start here

- Product overview: ${SITE_ORIGIN}
- Feedback widget: ${SITE_ORIGIN}/feedback-widget
- Next.js feedback widget guide: ${SITE_ORIGIN}/feedback-widget/nextjs
- Canny alternative comparison: ${SITE_ORIGIN}/canny-alternative
- Quickstart: ${SITE_ORIGIN}/docs/quickstart
- Website installation: ${SITE_ORIGIN}/docs/install/website
- Framework installation: ${SITE_ORIGIN}/docs/install/frameworks
- Webhook integrations: ${SITE_ORIGIN}/docs/integrations/webhooks
- REST API: ${SITE_ORIGIN}/docs/api/rest
- MCP: ${SITE_ORIGIN}/docs/api/mcp

## Trust and limits

- Security: ${SITE_ORIGIN}/docs/operate/security
- Product limits: ${SITE_ORIGIN}/docs/operate/limits
- Privacy policy: ${SITE_ORIGIN}/privacy
- Terms of service: ${SITE_ORIGIN}/terms
`

export function GET() {
  return new Response(content, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  })
}
