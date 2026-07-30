export type DocsBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; id: string; title: string }
  | { type: 'steps'; items: Array<{ title: string; body: string }> }
  | { type: 'list'; items: string[] }
  | { type: 'code'; label: string; language: string; code: string }
  | { type: 'callout'; tone: 'note' | 'warning' | 'success'; title: string; body: string }
  | { type: 'table'; columns: string[]; rows: string[][] }

export interface DocsPage {
  slug: string
  category: 'Start' | 'Install' | 'Use feedback' | 'Developers' | 'Operate'
  title: string
  description: string
  blocks: DocsBlock[]
}

export const DOCS_REVISION = '2026-07-30'

const websiteSnippet = `<div data-feedbacks-host="YOUR_PROJECT_KEY"></div>

<script
  src="https://app.feedbacks.dev/widget/latest.js"
  data-project="YOUR_PROJECT_KEY"
  defer
></script>`

const apiRequest = `curl https://app.feedbacks.dev/api/v1/feedback \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_PROJECT_API_KEY" \\
  -d '{
    "message": "Export gets stuck at 90%",
    "type": "bug",
    "priority": "high",
    "tags": ["export"],
    "url": "https://example.com/reports"
  }'`

export const DOCS_PAGES: DocsPage[] = [
  {
    slug: 'overview', category: 'Start', title: 'Documentation',
    description: 'Install feedback collection, verify the loop, and route useful signal without building a feedback system from scratch.',
    blocks: [
      { type: 'heading', id: 'fast-path', title: 'The fast path' },
      { type: 'steps', items: [
        { title: 'Create a project', body: 'A project is one app or website. It owns the widget configuration, feedback inbox, integrations, API key, and public board.' },
        { title: 'Install once', body: 'Paste the stable Website snippet into the shared page shell, footer, or tag manager used by the whole product.' },
        { title: 'Manage remotely', body: 'Change the form or publish product updates to users from the dashboard without replacing the snippet.' },
        { title: 'Verify one submission', body: 'Use hosted verification, then send feedback from the real page and confirm both items reach the inbox.' },
      ] },
      { type: 'callout', tone: 'success', title: 'A successful first install has one proof', body: 'A known test message appears in the correct project inbox with its page URL and browser context.' },
      { type: 'heading', id: 'choose-path', title: 'Choose the path you need' },
      { type: 'table', columns: ['Goal', 'Start here'], rows: [
        ['Add the in-product form', 'Quickstart, then Website installation'],
        ['Use React, Next.js, Vue, or WordPress', 'Framework installation'],
        ['Send feedback from a backend or agent', 'REST API or MCP server'],
        ['Publish requests and collect votes', 'Public boards'],
        ['Notify another system', 'Webhooks and routing'],
        ['Diagnose an install', 'Verification and troubleshooting'],
      ] },
    ],
  },
  {
    slug: 'quickstart', category: 'Start', title: 'Quickstart',
    description: 'Go from an empty account to a verified feedback submission in a few minutes.',
    blocks: [
      { type: 'heading', id: 'create', title: '1. Create the project' },
      { type: 'paragraph', text: 'Open Projects, choose New Project, and use the name your team already uses for the product. The domain is optional. Creating the project opens its product home.' },
      { type: 'heading', id: 'install', title: '2. Paste the generated snippet' },
      { type: 'code', label: 'HTML', language: 'html', code: websiteSnippet },
      { type: 'callout', tone: 'warning', title: 'Use the generated project key', body: 'YOUR_PROJECT_KEY is a placeholder. Copy the complete snippet from your project Install tab. Never put a private REST API key in browser code.' },
      { type: 'heading', id: 'verify', title: '3. Verify both environments' },
      { type: 'steps', items: [
        { title: 'Run hosted verification', body: 'This confirms the saved form and browser-safe project key work independently of your website.' },
        { title: 'Open your real page', body: 'Load the page where you installed the snippet and submit a message you can recognize.' },
        { title: 'Check the inbox', body: 'Confirm the message, project, URL, and browser context. Opening it marks it read without changing workflow status.' },
      ] },
      { type: 'heading', id: 'customize', title: '4. Customize remotely' },
      { type: 'paragraph', text: 'Choose floating button, custom trigger, or inline form from Feedback form. Save placement, fields, labels, colors, screenshots, attachments, and captcha settings without replacing the installed snippet.' },
      { type: 'heading', id: 'next', title: '5. Add only what you need next' },
      { type: 'list', items: ['Restrict allowed origins after the real site works.', 'Add Slack, Discord, GitHub Issues, or a webhook from Integrations.', 'Publish an update for your users when you want to show what shipped.', 'Publish a public board only when you want requests, votes, and replies to be visible.'] },
    ],
  },
  {
    slug: 'concepts/projects', category: 'Start', title: 'Projects and keys',
    description: 'Understand the boundary that keeps each product, inbox, and integration separate.',
    blocks: [
      { type: 'heading', id: 'project-boundary', title: 'One project per feedback source' },
      { type: 'paragraph', text: 'Create a separate project for each app, site, or environment that needs its own form, inbox filters, routing, API access, or public board. The selected project at the top of the sidebar controls project-scoped pages such as Integrations and API.' },
      { type: 'heading', id: 'key-types', title: 'Know which key belongs where' },
      { type: 'table', columns: ['Credential', 'Use', 'Exposure'], rows: [
        ['Browser-safe project key', 'Widget submissions and generated install snippets', 'Safe in client HTML'],
        ['Project REST API key', 'Trusted servers, scripts, and MCP clients', 'Server-side only'],
        ['Webhook signing secret', 'Verify generic webhook payloads', 'Receiving server only'],
      ] },
      { type: 'callout', tone: 'note', title: 'Keys are project-scoped', body: 'A project API key can read and change only its own project data. Rotate a key from the project Install or API workspace when needed.' },
    ],
  },
  {
    slug: 'install/website', category: 'Install', title: 'Website installation',
    description: 'Install the generated script in a shared HTML shell, site builder, or tag manager.',
    blocks: [
      { type: 'heading', id: 'snippet', title: 'Use the generated script' },
      { type: 'code', label: 'HTML', language: 'html', code: websiteSnippet },
      { type: 'heading', id: 'placement', title: 'Place it once' },
      { type: 'list', items: ['Static HTML: before the closing body tag.', 'Server-rendered templates: in the shared layout or footer template.', 'Tag manager: as a custom HTML tag loaded on pages where feedback is available.', 'Single-page app without a wrapper: in the root HTML file, not inside a component that remounts.'] },
      { type: 'heading', id: 'modes', title: 'Choose an embed mode' },
      { type: 'table', columns: ['Mode', 'Use it when'], rows: [
        ['modal', 'You want the standard floating button and modal form.'],
        ['trigger', 'Your own button should open the feedback modal.'],
        ['inline', 'The form should render inside a specific page container.'],
      ] },
      { type: 'code', label: 'Custom trigger', language: 'html', code: `<button data-feedbacks-trigger>Send feedback</button>\n\n${websiteSnippet}` },
      { type: 'callout', tone: 'note', title: 'Set the mode in Feedback form', body: 'Choose Custom trigger and save [data-feedbacks-trigger] as the target. The installed snippet stays unchanged.' },
    ],
  },
  {
    slug: 'install/frameworks', category: 'Install', title: 'Framework installation',
    description: 'Use the shared app shell so the widget loads once and survives navigation.',
    blocks: [
      { type: 'heading', id: 'nextjs', title: 'Next.js App Router' },
      { type: 'paragraph', text: 'Add the generated Website script to the root layout. This avoids duplicate instances and keeps the form available across routes.' },
      { type: 'code', label: 'app/layout.tsx', language: 'tsx', code: `import Script from 'next/script'\n\nexport default function RootLayout({ children }) {\n  return (\n    <html lang="en">\n      <body>\n        {children}\n        <div data-feedbacks-host="YOUR_PROJECT_KEY" />\n        <Script\n          src="https://app.feedbacks.dev/widget/latest.js"\n          data-project="YOUR_PROJECT_KEY"\n          strategy="afterInteractive"\n        />\n      </body>\n    </html>\n  )\n}` },
      { type: 'heading', id: 'react-vue', title: 'React and Vue' },
      { type: 'paragraph', text: 'The project Install tab generates framework-specific code with the project key and application origin. Put the wrapper at the application root. Saved product settings are resolved remotely. If your package registry cannot resolve a wrapper, use the Website script in the root HTML instead.' },
      { type: 'heading', id: 'wordpress', title: 'WordPress' },
      { type: 'steps', items: [
        { title: 'Open Embed installation', body: 'Select WordPress to see the stable Website snippet and placement guidance.' },
        { title: 'Add it through one code tool', body: 'Use the theme footer, a header/footer code plugin, or a tag manager. Do not add the same snippet in more than one place.' },
        { title: 'Clear page caches', body: 'Purge optimization and CDN caches before deciding the script failed to load.' },
        { title: 'Scroll before taking a screenshot', body: 'Lazy and animated sections may not exist until they enter the viewport. Screenshot capture records the visible viewport at the user current scroll position.' },
      ] },
    ],
  },
  {
    slug: 'install/customize', category: 'Install', title: 'Customize the widget',
    description: 'Change placement, fields, labels, colors, screenshots, attachments, and abuse protection.',
    blocks: [
      { type: 'heading', id: 'dashboard-first', title: 'Prefer dashboard configuration' },
      { type: 'paragraph', text: 'Feedback form saves one canonical remote configuration. Every installed embed receives it from the public bootstrap, so you do not maintain attributes or replace snippets across sites.' },
      { type: 'heading', id: 'options', title: 'Common options' },
      { type: 'table', columns: ['Option', 'What it changes'], rows: [
        ['Placement and mode', 'Floating corner, custom trigger, or inline container'],
        ['Type and rating', 'Bug, idea, praise, question, and 1-5 rating controls'],
        ['Email', 'Optional or required contact field'],
        ['Screenshot', 'Optional visible-viewport JPEG capture'],
        ['Attachment', 'Optional file upload within project limits'],
        ['Labels and success copy', 'Form title, prompts, buttons, and completion message'],
        ['Captcha', 'Cloudflare Turnstile or hCaptcha for public forms'],
      ] },
      { type: 'callout', tone: 'success', title: 'The installed snippet stays stable', body: 'Save changes in Feedback form to publish them remotely. You only need new code after rotating the browser-safe project key or moving the embed to a different project.' },
    ],
  },
  {
    slug: 'install/product-updates', category: 'Install', title: 'Updates for your users',
    description: 'Publish an in-app What’s New modal through the widget you already installed.',
    blocks: [
      { type: 'heading', id: 'enable-once', title: 'Enable the runtime once' },
      { type: 'paragraph', text: 'Open Updates for users and activate it. The shared embed receives the module setting remotely; no regenerated snippet or application deployment is required.' },
      { type: 'code', label: 'Manual What’s New trigger', language: 'html', code: `<button data-feedbacks-updates-trigger type="button">What’s new</button>` },
      { type: 'heading', id: 'publish', title: 'Create and publish' },
      { type: 'steps', items: [
        { title: 'Save a draft', body: 'Write a version label, title, summary, optional highlights, image, and CTA. Drafts are never returned to the public widget API.' },
        { title: 'Preview the modal', body: 'Use desktop or mobile and light or dark preview before publishing. Content is structured plain text, not HTML or Markdown.' },
        { title: 'Publish or schedule', body: 'Free plans publish immediately. Pro plans can schedule a future publication. Public visibility can take up to one minute because the widget endpoint is cached.' },
      ] },
      { type: 'heading', id: 'display-rules', title: 'Display rules and privacy' },
      { type: 'list', items: ['The widget automatically shows only the newest unseen eligible update.', 'Seen and dismissed state stays in localStorage, without cookies, account IDs, page URLs, or server-side viewer events.', 'Manual triggers can reopen the newest live update.', 'Included and excluded pathname prefixes control where updates can appear. Exclusions win.', 'Metrics are approximate daily aggregates for impressions, dismissals, and CTA clicks.'] },
      { type: 'callout', tone: 'note', title: 'Keep it concise', body: 'User-facing product updates are for useful “What’s new” communication, not a marketing carousel. One centered popup is shown at a time and it never overlaps the feedback form.' },
    ],
  },
  {
    slug: 'install/verify', category: 'Install', title: 'Verify an installation',
    description: 'Separate project configuration problems from host-page placement problems.',
    blocks: [
      { type: 'heading', id: 'hosted', title: 'Start with hosted verification' },
      { type: 'paragraph', text: 'The hosted verification page loads the saved form with the same browser-safe project key. If it submits successfully, the project key, API endpoint, and saved widget configuration are working.' },
      { type: 'heading', id: 'real-page', title: 'Then test the real page' },
      { type: 'steps', items: [
        { title: 'Open a fresh browser tab', body: 'This avoids a stale page that loaded before the script was installed.' },
        { title: 'Confirm the trigger appears', body: 'For custom trigger or inline mode, confirm the target selector exists before the script runs.' },
        { title: 'Send a recognizable message', body: 'Include the page or release name so the item is easy to find.' },
        { title: 'Inspect the inbox item', body: 'Check URL, browser context, optional screenshot, and project assignment.' },
      ] },
      { type: 'callout', tone: 'warning', title: 'Hosted works, real page fails', body: 'Keep the saved configuration. Check script placement, duplicate installs, cache, Content Security Policy, target selectors, and allowed origins on the host page.' },
    ],
  },
  {
    slug: 'feedback/inbox', category: 'Use feedback', title: 'Triage the inbox',
    description: 'Find signal quickly without confusing read state with product workflow.',
    blocks: [
      { type: 'heading', id: 'states', title: 'Read state and status are different' },
      { type: 'table', columns: ['State', 'Meaning'], rows: [
        ['Unread', 'Nobody has opened this item in the dashboard yet.'],
        ['New', 'No workflow decision has been made.'],
        ['Reviewed', 'The item has been evaluated.'],
        ['Planned', 'The team intends to act.'],
        ['In Progress', 'Work has started.'],
        ['Closed', 'The loop is complete or no action will be taken.'],
      ] },
      { type: 'heading', id: 'routine', title: 'A practical review routine' },
      { type: 'steps', items: [
        { title: 'Open Unread', body: 'Read new context without changing product status.' },
        { title: 'Search and tag', body: 'Use stable product-area tags such as billing, export, onboarding, or mobile.' },
        { title: 'Set priority sparingly', body: 'Reserve high and critical for urgency, impact, or active breakage.' },
        { title: 'Publish selectively', body: 'Move an item to the public board only when public voting or a visible response helps.' },
      ] },
    ],
  },
  {
    slug: 'feedback/public-boards', category: 'Use feedback', title: 'Public boards',
    description: 'Publish selected requests, collect votes and replies, and close the loop visibly.',
    blocks: [
      { type: 'heading', id: 'publish', title: 'Publish a project board' },
      { type: 'steps', items: [
        { title: 'Open the project Board tab', body: 'Set the board name, description, visibility, submission policy, and categories.' },
        { title: 'Preview before sharing', body: 'Check branding, request filters, submission copy, and the public URL.' },
        { title: 'Choose directory listing separately', body: 'A public board can be reachable by URL without appearing in global discovery.' },
        { title: 'Moderate and respond', body: 'Review reports, post official replies, and update statuses when work changes.' },
      ] },
      { type: 'heading', id: 'notifications', title: 'Followers and watchers' },
      { type: 'paragraph', text: 'Board followers receive board-level updates. Request watchers receive status changes and official team replies for that request. Notification fanout excludes the actor and deduplicates recipients.' },
      { type: 'callout', tone: 'note', title: 'Public is an editorial decision', body: 'Do not publish private customer details, security reports, internal notes, or attachments that were collected for staff review.' },
    ],
  },
  {
    slug: 'integrations/webhooks', category: 'Use feedback', title: 'Webhooks and routing',
    description: 'Send selected feedback to Slack, Discord, GitHub Issues, or a generic HTTP endpoint.',
    blocks: [
      { type: 'heading', id: 'current-project', title: 'Routing uses the selected project' },
      { type: 'paragraph', text: 'Choose the project at the top of the dashboard sidebar, then open Integrations. Endpoints, rules, delivery logs, retries, and digests belong to that project.' },
      { type: 'heading', id: 'delivery', title: 'Choose immediate or digest delivery' },
      { type: 'table', columns: ['Mode', 'Use it for'], rows: [
        ['Immediate', 'Urgent bugs, high-priority signal, or low-volume channels'],
        ['Daily digest', 'Higher-volume feedback that a team reviews in batches'],
      ] },
      { type: 'heading', id: 'generic', title: 'Generic webhook contract' },
      { type: 'code', label: 'Immediate event', language: 'json', code: `{
  "event": "feedback.created",
  "version": 1,
  "project": { "id": "...", "name": "Acme" },
  "feedback": { "id": "...", "message": "...", "status": "new" }
}` },
      { type: 'list', items: ['Return a 2xx response quickly.', 'Verify optional HMAC signature headers against the raw body.', 'Treat repeated delivery as possible and make handlers idempotent.', 'Use delivery history to inspect status, response details, attempts, and replay results.'] },
    ],
  },
  {
    slug: 'api/rest', category: 'Developers', title: 'REST API',
    description: 'Submit, list, search, and update project feedback from trusted server-side code.',
    blocks: [
      { type: 'heading', id: 'authentication', title: 'Authentication' },
      { type: 'paragraph', text: 'Send the project API key in X-API-Key. Keep this key on a trusted server. The key scopes every request to one project.' },
      { type: 'code', label: 'Submit feedback', language: 'bash', code: apiRequest },
      { type: 'heading', id: 'endpoints', title: 'Core endpoints' },
      { type: 'table', columns: ['Method', 'Path', 'Purpose'], rows: [
        ['GET', '/api/v1/projects', 'Return the project available to the key'],
        ['GET', '/api/v1/projects/:id', 'Project details and feedback statistics'],
        ['GET', '/api/v1/projects/:id/setup-packet', 'Exact snippets and verification guidance'],
        ['POST', '/api/v1/feedback', 'Create feedback'],
        ['GET', '/api/v1/feedback', 'List or search feedback with filters and pagination'],
        ['PATCH', '/api/v1/projects/:id/feedback?feedback_id=:id', 'Update status, priority, or tags'],
      ] },
      { type: 'heading', id: 'validation', title: 'Submission validation' },
      { type: 'list', items: ['message: required, 2 to 5000 characters.', 'type: bug, idea, praise, or question.', 'priority: low, medium, high, or critical.', 'rating: integer from 1 to 5.', 'tags: up to 10 unique values.', 'metadata: up to 4 KB.', 'structured_data: up to 10 KB.', 'url: HTTP or HTTPS only.'] },
      { type: 'heading', id: 'errors', title: 'Handle errors by status' },
      { type: 'table', columns: ['Status', 'Action'], rows: [
        ['400', 'Correct invalid request data before retrying.'],
        ['401', 'Provide a valid project API key.'],
        ['403', 'Check plan access or feedback quota.'],
        ['429', 'Back off before retrying.'],
        ['500', 'Treat the result as uncertain, inspect the inbox, then retry safely.'],
      ] },
    ],
  },
  {
    slug: 'api/mcp', category: 'Developers', title: 'MCP server',
    description: 'Give trusted AI agents project-scoped feedback tools through the Model Context Protocol.',
    blocks: [
      { type: 'heading', id: 'install', title: 'Run the packaged server' },
      { type: 'paragraph', text: 'Open the selected project API tab and copy its generated MCP configuration. The package URL and API key are project-specific. Keep the key out of prompts, repositories, and browser code.' },
      { type: 'code', label: 'Environment', language: 'bash', code: `FEEDBACKS_API_KEY=YOUR_PROJECT_API_KEY
FEEDBACKS_API_URL=https://app.feedbacks.dev` },
      { type: 'heading', id: 'tools', title: 'Available tools' },
      { type: 'list', items: ['list_projects', 'get_project_setup_packet', 'verify_widget_install', 'submit_test_feedback', 'submit_feedback', 'list_feedback', 'update_feedback_status', 'get_project_stats', 'search_feedback'] },
      { type: 'heading', id: 'agent-routine', title: 'A safe agent routine' },
      { type: 'steps', items: [
        { title: 'Read the setup packet', body: 'Use exact generated snippets instead of inventing configuration.' },
        { title: 'Verify before changing', body: 'Inspect the reachable page and current inbox state.' },
        { title: 'Submit a named test', body: 'Use submit_test_feedback so verification data is recognizable.' },
        { title: 'Update intentionally', body: 'Change status, priority, or tags only when the requested workflow action is explicit.' },
      ] },
    ],
  },
  {
    slug: 'api/context', category: 'Developers', title: 'Captured context and payloads',
    description: 'Know what the widget records and how to add structured context safely.',
    blocks: [
      { type: 'heading', id: 'automatic', title: 'Automatic browser context' },
      { type: 'list', items: ['Page origin and path (query strings and fragments are removed)', 'Browser user agent', 'Submission timestamp', 'Selected type and rating', 'Optional email', 'Optional visible-viewport screenshot', 'Optional image attachment within configured limits'] },
      { type: 'heading', id: 'structured', title: 'Server and agent context' },
      { type: 'paragraph', text: 'REST and MCP submissions can include tags, agent_name, agent_session_id, metadata, and structured_data. Use these fields for reproducible technical context, not secrets or unrestricted logs.' },
      { type: 'callout', tone: 'warning', title: 'Minimize sensitive data', body: 'Do not place passwords, tokens, payment data, private keys, or full user records in messages, metadata, structured data, screenshots, or attachments.' },
    ],
  },
  {
    slug: 'operate/security', category: 'Operate', title: 'Security checklist',
    description: 'Move from a working install to a production-hardened feedback path.',
    blocks: [
      { type: 'heading', id: 'browser', title: 'Browser installation' },
      { type: 'list', items: ['Use only the browser-safe project key in widget code.', 'Restrict allowed origins after verifying the real domain.', 'Add the widget and screenshot dependencies to Content Security Policy where required.', 'Enable captcha when a public form attracts automated abuse.', 'Keep attachment types and size limits narrow.'] },
      { type: 'heading', id: 'server', title: 'Server integrations' },
      { type: 'list', items: ['Store REST API keys and webhook secrets in environment variables.', 'Rotate credentials after exposure or staff access changes.', 'Verify generic webhook signatures against the unmodified raw request body.', 'Allow outbound webhook targets deliberately and avoid private network addresses.', 'Log delivery IDs and handle duplicate events safely.'] },
      { type: 'heading', id: 'public', title: 'Public boards' },
      { type: 'list', items: ['Review an item before making it public.', 'Remove personal or confidential details.', 'Moderate reports and team replies.', 'Keep the board in Draft while configuring it.', 'Treat directory listing as separate consent from publishing the public URL.'] },
    ],
  },
  {
    slug: 'operate/limits', category: 'Operate', title: 'Limits and retention',
    description: 'Design integrations around current payload, upload, plan, and history boundaries.',
    blocks: [
      { type: 'heading', id: 'request-limits', title: 'Request limits' },
      { type: 'table', columns: ['Data', 'Limit'], rows: [
        ['Feedback message', '5000 characters'],
        ['Tags', '10 unique values'],
        ['Metadata', '4 KB JSON'],
        ['Structured data', '10 KB JSON'],
        ['Widget screenshot', 'Image only, compressed in a 1920 x 1080 envelope, up to 3 MB stored'],
        ['Rating', 'Integer 1 through 5'],
      ] },
      { type: 'heading', id: 'plan', title: 'Plan boundaries' },
      { type: 'paragraph', text: 'Project count, monthly feedback, visible history, API access, webhook delivery history, and other entitlements depend on the current plan. Billing and the project workspace show the active limits before an action is blocked.' },
      { type: 'callout', tone: 'note', title: 'Retention policy', body: 'Product history follows plan entitlements. Media retention policy is tracked separately and should not be assumed to be permanent.' },
    ],
  },
  {
    slug: 'operate/troubleshooting', category: 'Operate', title: 'Troubleshooting',
    description: 'Diagnose the most common installation, submission, routing, and API failures.',
    blocks: [
      { type: 'heading', id: 'widget-missing', title: 'The widget does not appear' },
      { type: 'list', items: ['Confirm the script request returns 200 in browser developer tools.', 'Check that data-project contains the generated browser-safe key.', 'Remove duplicate script tags.', 'For trigger or inline mode, confirm the target selector exists.', 'Purge WordPress, CDN, and page-builder caches.', 'Check Content Security Policy errors in the console.'] },
      { type: 'heading', id: 'submission', title: 'The form opens but submission fails' },
      { type: 'list', items: ['Run hosted verification to separate host-page issues from project issues.', 'Confirm the public widget bootstrap request succeeds for the project key.', 'Check allowed-origin rules against the exact page origin.', 'Check captcha keys and provider configuration.', 'Review plan quota and attachment validation messages.'] },
      { type: 'heading', id: 'lazy-content', title: 'Screenshots miss animated or lazy content' },
      { type: 'paragraph', text: 'Screenshot capture records the visible viewport at the moment the user submits. Ask the user to scroll until lazy or animated content is visible, then open the form and capture. Full-page capture is intentionally not used.' },
      { type: 'heading', id: 'webhook', title: 'A webhook is failing' },
      { type: 'list', items: ['Open delivery history and inspect the HTTP status and response.', 'Confirm the endpoint is public HTTPS and responds quickly.', 'Verify signatures using the raw body.', 'Return 2xx before slow downstream work.', 'Replay after fixing the endpoint; keep the handler idempotent.'] },
      { type: 'heading', id: 'api', title: 'REST or MCP authentication fails' },
      { type: 'list', items: ['Use the private project API key, not the browser-safe widget key.', 'Send X-API-Key for REST requests.', 'Set FEEDBACKS_API_KEY for MCP.', 'Confirm the key belongs to the selected project and has not been rotated.', 'Check API entitlement on the current plan.'] },
    ],
  },
]

export const DOCS_CATEGORIES: DocsPage['category'][] = ['Start', 'Install', 'Use feedback', 'Developers', 'Operate']

export function getDocsPage(slug?: string) {
  return DOCS_PAGES.find((page) => page.slug === (slug || 'overview'))
}
