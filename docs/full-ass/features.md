# Features

## What Makes This Worth Paying For

Every feature exists because it either **saves developers time** or **gives them insight they can't get otherwise**. No filler.

---

## Widget

### Installation
- **One-line script tag** — copy, paste, done
- **Auto-loads config** from dashboard (colors, position, text)
- **Shadow DOM isolation** — never conflicts with host site styles
- **Under 20KB** gzipped — doesn't slow down customer sites

### Feedback Collection
- **Category selection** — Bug, Idea, Praise, or custom categories
- **Star rating** (1-5) — quantifiable sentiment
- **Screenshot capture** — user clicks a button, widget captures the page via html2canvas (lazy-loaded)
- **File attachments** — drag-and-drop or file picker, stored in Supabase Storage
- **Optional email field** — for follow-up contact
- **Auto-captured metadata** — page URL, browser, OS, screen size, timestamp

### Customization
- **Position** — bottom-right, bottom-left, top-right, top-left
- **Colors** — primary color, text color, background
- **Trigger text** — "Feedback", "Report a Bug", whatever fits
- **Form fields** — toggle rating, email, screenshot on/off
- **Custom categories** — replace defaults with your own
- **Custom CSS injection** — full control for power users
- **Widget presets library** — pre-built themes (minimal, colorful, dark, branded)

### Modes
- **Floating button** (default) — persistent trigger in corner
- **Inline embed** — renders inside a container div
- **Programmatic** — open/close via JavaScript API, no visible trigger

### JavaScript API
- `Feedbacks.open()` / `Feedbacks.close()`
- `Feedbacks.setUser({ email, name })` — pre-fill user info
- `Feedbacks.on('submit', callback)` — hook into submissions
- `Feedbacks.destroy()` — clean removal

---

## Dashboard

### Multi-Project Management
- **Create multiple projects** — one account, many apps
- **Per-project API keys** — rotate without affecting other projects
- **Per-project widget config** — each app gets its own look and feel
- **Domain allowlisting** — restrict which domains can submit feedback

### Feedback Inbox
- **Triage workflow** — four statuses: New → Reviewed → Planned → Closed
- **Bulk actions** — select multiple, change status, add tags, delete
- **Quick filters** — by status, type, rating, tag, date range
- **Search** — full-text search across feedback messages
- **Sort** — by date, rating, status
- **Keyboard shortcuts** — j/k to navigate, s to change status, t to tag

### Feedback Detail View
- **Full message** with metadata (URL, browser, OS)
- **Screenshot viewer** — inline preview, click to zoom
- **Attachment downloads**
- **Tag management** — add/remove tags inline
- **Status updates** with timestamp history
- **Internal notes** (future) — team comments not visible to submitter

### Tags
- **Custom tags per project** — "urgent", "v2", "ux", "mobile", etc.
- **Color-coded** — visual distinction at a glance
- **Filter by tag** — inbox filtering
- **Bulk tagging** — apply to multiple feedback items

### Analytics Dashboard
- **Feedback volume** — submissions over time (daily/weekly/monthly)
- **By category** — breakdown of bugs vs ideas vs praise
- **Sentiment trends** — average rating over time
- **Top pages** — which pages generate the most feedback
- **Response time** — how fast feedback moves from New to Reviewed
- **Export charts** — download as PNG (future)

### CSV Export
- **Full data export** — all feedback for a project
- **Filtered export** — export current filtered view
- **Fields included** — timestamp, type, status, message, rating, email, URL, tags, metadata

---

## Integrations

### Webhooks
- **Slack** — post new feedback to a channel with formatted message
- **Discord** — same, with Discord embed formatting
- **GitHub** — auto-create issues from feedback (bug → issue, idea → discussion)
- **Custom webhook** — POST JSON to any URL

### Webhook Configuration
- **Per-project** — different integrations per app
- **Event selection** — trigger on: feedback.created, feedback.status_changed
- **Test button** — send a test payload to verify setup
- **Delivery logs** — see success/failure of recent deliveries (future)

### Email Notifications
- **New feedback alert** — email when feedback is submitted
- **Configurable** — per-project, can disable
- **Digest option** (future) — daily summary instead of per-item

---

## Anti-Spam

### Rate Limiting
- **IP-based** — 10 submissions per minute per project (configurable)
- **Soft block** — returns friendly error, doesn't expose rate limit details

### Honeypot
- **Hidden field** — invisible to humans, bots fill it automatically
- **Zero friction** — no user action required

### CAPTCHA (Optional)
- **Turnstile** (Cloudflare, free) — invisible challenge
- **hCaptcha** — alternative option
- **Per-project toggle** — enable only if spam becomes a problem

---

## Account & Settings

### Authentication
- **Supabase Auth** — email/password + magic link + GitHub OAuth
- **Session management** — secure httpOnly cookies

### Project Settings
- **Rename/delete projects**
- **Regenerate API keys**
- **Domain allowlist**
- **Widget configuration UI** — live preview
- **Danger zone** — delete all feedback, delete project

### User Settings
- **Profile** — name, email
- **Notification preferences**
- **Dark mode** — system, light, dark toggle
- **API tokens** (future) — for programmatic dashboard access

---

## API Access

### Public API
- **Submit feedback** — `POST /api/v1/feedback` with API key
- **Widget config** — `GET /api/v1/widget/config/:slug`

### Authenticated API
- Full CRUD on projects, feedback, tags, webhooks
- Filterable feedback listing with pagination
- Analytics endpoints
- CSV export endpoint

---

## Pricing Tiers (Planned)

| Feature | Free | Pro | Team |
|---------|------|-----|------|
| Projects | 1 | 5 | Unlimited |
| Feedback/month | 100 | 5,000 | Unlimited |
| File attachments | - | Yes | Yes |
| Screenshot capture | Yes | Yes | Yes |
| Webhook integrations | 1 | Unlimited | Unlimited |
| Custom widget CSS | - | Yes | Yes |
| Widget presets | Basic | All | All |
| Analytics dashboard | 7 days | 90 days | Unlimited |
| CSV export | - | Yes | Yes |
| Email notifications | - | Yes | Yes |
| API access | Submit only | Full | Full |
| Team members | 1 | 1 | 10 |
| Priority support | - | - | Yes |

**Free tier is generous enough to be useful. Pro is where the money is.**
