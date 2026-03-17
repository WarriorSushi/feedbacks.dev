# Roadmap

## Delivery Philosophy

Ship in phases. Each phase is **independently useful** — no phase depends on a future phase to deliver value. Users can pay after Phase 1.

---

## Phase 0: Foundation (Week 1)

**Goal**: Clean monorepo, database schema, auth working.

- [ ] Set up pnpm monorepo (`apps/web`, `packages/widget`, `packages/shared`, `packages/supabase`)
- [ ] Configure Turbo for builds
- [ ] Set up Supabase project (fresh or clean existing)
- [ ] Create database schema (projects, feedback, tags, widget_configs, webhooks, attachments)
- [ ] Apply RLS policies for all tables
- [ ] Implement Supabase Auth (email + GitHub OAuth)
- [ ] Auth callback, session handling, middleware for protected routes
- [ ] Basic dashboard shell with sidebar navigation
- [ ] Dark mode toggle (system/light/dark)

**Deliverable**: Authenticated user can log in and see an empty dashboard.

---

## Phase 1: Core Loop (Weeks 2-3)

**Goal**: Widget collects feedback, dashboard displays it. This is the MVP.

### Widget
- [ ] Vanilla TS widget with shadow DOM
- [ ] Floating trigger button (configurable position)
- [ ] Feedback form: category selector, message textarea, star rating, email field
- [ ] Submit to `/api/v1/feedback` with API key
- [ ] Success/error states
- [ ] Script tag integration with `data-project` attribute
- [ ] Bundle size under 20KB gzipped

### Dashboard
- [ ] Create project flow (name, domain)
- [ ] Project list view
- [ ] Project detail: installation snippet (copy-paste ready)
- [ ] Feedback inbox: list view with status badges, type icons
- [ ] Feedback detail view: full message + metadata
- [ ] Change feedback status (New → Reviewed → Planned → Closed)
- [ ] Bulk status change
- [ ] Filter by status and type
- [ ] Sort by date, rating

### API
- [ ] `POST /api/v1/feedback` — submit (API key auth, rate limited)
- [ ] `GET /api/v1/widget/config/:slug` — widget config
- [ ] `GET /api/v1/feedback` — list with filters (session auth)
- [ ] `PATCH /api/v1/feedback/:id` — update status

**Deliverable**: Developer installs widget on their site, users submit feedback, developer triages in dashboard.

---

## Phase 2: Power Features (Weeks 4-5)

**Goal**: Make the product sticky. Screenshots, tags, search, customization.

### Widget Enhancements
- [ ] Screenshot capture (html2canvas, lazy-loaded)
- [ ] File attachments (drag-and-drop, up to 5MB, stored in Supabase Storage)
- [ ] Widget customization via dashboard (colors, position, text, fields)
- [ ] JavaScript API (`open`, `close`, `setUser`, `destroy`)
- [ ] Inline embed mode
- [ ] Programmatic mode (no trigger button)

### Dashboard Enhancements
- [ ] Tag system: create, color-code, apply to feedback
- [ ] Filter by tag
- [ ] Bulk tagging
- [ ] Full-text search across feedback
- [ ] Screenshot viewer with lightbox
- [ ] Attachment downloads
- [ ] Widget customization UI with live preview
- [ ] Widget presets library (5-10 pre-built themes)
- [ ] Keyboard shortcuts (j/k navigate, s status, t tag)

### API
- [ ] `CRUD /api/v1/tags`
- [ ] `PUT /api/v1/widget/config` — update widget settings
- [ ] Upload endpoint for attachments

**Deliverable**: Full feedback workflow with rich data. Widget looks and behaves exactly how the developer wants.

---

## Phase 3: Integrations & Analytics (Weeks 6-7)

**Goal**: Feedback flows into existing tools. Data tells a story.

### Webhook Integrations
- [ ] Slack notifications (formatted message with feedback details)
- [ ] Discord notifications (embed format)
- [ ] GitHub issue creation (bug → issue)
- [ ] Custom webhook (POST JSON to any URL)
- [ ] Webhook management UI (add, edit, delete, toggle active)
- [ ] Test webhook button
- [ ] Event selection (feedback.created, feedback.status_changed)

### Analytics Dashboard
- [ ] Feedback volume chart (daily/weekly/monthly, configurable range)
- [ ] Category breakdown (pie/bar chart)
- [ ] Average rating over time
- [ ] Top feedback pages
- [ ] Response time metrics (time from New to Reviewed)
- [ ] Project comparison view (if multiple projects)

### Export
- [ ] CSV export (full project or filtered view)
- [ ] Email notifications (new feedback alert, configurable per project)

### Anti-Spam
- [ ] IP-based rate limiting (configurable threshold)
- [ ] Honeypot field in widget
- [ ] Turnstile/hCaptcha integration (optional toggle per project)

**Deliverable**: Feedback reaches the team wherever they work. Analytics show patterns. Spam is handled.

---

## Phase 4: Polish & Monetization (Week 8)

**Goal**: Production-ready. Pricing live. Landing page converts.

- [ ] Landing page (value prop, demo widget, pricing table, social proof)
- [ ] Pricing implementation (Stripe integration via Supabase)
- [ ] Free tier enforcement (project limits, feedback quotas)
- [ ] Pro tier unlocks (more projects, more feedback, attachments, integrations)
- [ ] Usage metering and limit warnings
- [ ] Onboarding flow (guided project setup + widget installation)
- [ ] Error boundaries and loading states everywhere
- [ ] Mobile-responsive dashboard (all screens)
- [ ] Performance audit (Core Web Vitals, widget load time)
- [ ] SEO basics (meta tags, OG images)
- [ ] Legal pages (terms, privacy, cookie consent)

**Deliverable**: Product is live, accepting payments, ready for real users.

---

## Future (Post-Launch)

These are real features, not just a wish list. Prioritized by user demand.

- **Team collaboration** — invite team members, assign feedback, internal notes
- **Email digest** — daily/weekly summary instead of per-feedback notifications
- **Webhook delivery logs** — retry failed deliveries
- **API tokens** — programmatic access to dashboard data
- **React/Vue/Svelte components** — framework-specific widget wrappers
- **Changelog feature** — close the loop with users ("you asked, we built")
- **User identification** — track feedback by logged-in user across sessions
- **Voting/upvotes** — let users vote on existing feedback
- **Custom forms** — build your own feedback form fields
- **White-labeling** — remove feedbacks.dev branding (enterprise)
- **Realtime updates** — live feedback feed via Supabase Realtime

---

## Timeline Summary

| Phase | Duration | What Ships |
|-------|----------|------------|
| Phase 0 | Week 1 | Auth, schema, dashboard shell |
| Phase 1 | Weeks 2-3 | Widget + inbox + triage (MVP) |
| Phase 2 | Weeks 4-5 | Screenshots, tags, search, customization |
| Phase 3 | Weeks 6-7 | Integrations, analytics, export, anti-spam |
| Phase 4 | Week 8 | Landing page, pricing, polish |

**Total: 8 weeks from zero to paid product.**
