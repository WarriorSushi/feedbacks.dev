<div align="center">

# feedbacks.dev

### The feedback stack for developers who ship.

Embeddable widget + triage dashboard + public voting boards + AI agent API - a full-surface feedback product for teams that want fast setup without giving up operational depth.

[![FSL-1.1-MIT](https://img.shields.io/badge/license-FSL--1.1--MIT-blue?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/WarriorSushi/Feedbacks.dev/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/WarriorSushi/Feedbacks.dev/actions)
[![GitHub Stars](https://img.shields.io/github/stars/WarriorSushi/Feedbacks.dev?style=flat-square&color=yellow)](https://github.com/WarriorSushi/Feedbacks.dev/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/WarriorSushi/Feedbacks.dev?style=flat-square)](https://github.com/WarriorSushi/Feedbacks.dev/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)
[![Built with Next.js](https://img.shields.io/badge/Next.js%2015-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[Website](https://feedbacks.dev) &nbsp;&middot;&nbsp; [Public Boards](https://www.feedbacks.dev/boards) &nbsp;&middot;&nbsp; [Documentation](https://feedbacks.dev) &nbsp;&middot;&nbsp; [Contributing](CONTRIBUTING.md)

</div>

---

## The Problem

Most feedback tools are either too heavy for small teams or too simple to be useful. You end up with a bloated enterprise tool nobody opens, or a basic form that dumps feedback into a void.

**feedbacks.dev sits in the middle** - lightweight enough to install in one line, structured enough to help you ship what users actually want.

---

## Features

### Drop-In Widget
Install with one snippet. Collect feedback with page and browser context plus an optional user-triggered screenshot. Under 20KB gzipped. Works with any framework.

```html
<div data-feedbacks-host="your-project-key"></div>

<script
  src="https://app.feedbacks.dev/widget/latest.js"
  data-project="your-project-key"
  defer
></script>
```

### Triage Dashboard
Not just a form dump. Filter by type, priority, status, tags, unread state, project, and agent source. Add internal notes, tag feedback, and move items through an intentional workflow without marking opened items as reviewed.

### Public Voting Boards
Let your users vote on features and report bugs publicly. Custom branding, announcements, moderation tools, and spam protection built in.

Each board gets its own public URL at `www.feedbacks.dev/p/your-product` with:
- Upvoting and discussion
- Status tracking (Planned, In Progress, Shipped)
- Custom accent colors and branding
- Announcements and changelog

### Release notes (opt-in)
Publish concise in-product “What’s New” announcements through the shared embed. The dashboard supports project-scoped drafts, publishing, per-note visibility, basic settings, and aggregate metrics. Turning a release note off hides it without deleting its content, metrics, or seen state. Editing or re-enabling the same note does not re-announce it to people who already saw it; create a new release note for a new announcement. The embed is installed once; product activation and feedback-form configuration are delivered remotely without replacement snippets.

### Board Directory
Discover what other products are building. Browse public boards, filter by category, find inspiration.

### AI Agent API
Your AI agents can file bugs and query feedback programmatically. Built-in MCP server for Claude plus a REST API for paid-plan automation flows.

```bash
# MCP Server (for Claude Code, Cursor, etc.)
npm exec --yes --package=https://app.feedbacks.dev/mcp/feedbacks-mcp-server-1.0.0.tgz -- feedbacks-mcp --api-key fb_live_...

# REST API
curl https://app.feedbacks.dev/api/v1/feedback \
  -H "X-API-Key: fb_live_..." \
  -H "Content-Type: application/json" \
  -d '{"message": "Export crashes on large datasets", "type": "bug"}'
```

### Webhooks
Push feedback to Slack, Discord, GitHub Issues, or any HTTP endpoint. Delivery logs, replay, health states, endpoint rules, and retry jobs help keep routing operational. Generic webhooks support optional HMAC signing headers.

### Privacy-First
No tracking scripts, cookies, or third-party analytics are added to the customer widget. On feedbacks.dev's own marketing and signup surfaces, optional advertising measurement remains off until a visitor explicitly allows it. The hosted service keeps feedback data in feedbacks.dev's managed Supabase project, protected by RLS and server-side write paths.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Framework** | Next.js 15, React 19 |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Database** | Supabase (Postgres + Auth + RLS) |
| **Widget** | Vanilla TypeScript, esbuild |
| **Package Manager** | pnpm workspaces |
| **Language** | TypeScript (strict mode) |
| **AI Integration** | MCP Server + REST API |

---

## Quick Start

### Hosted Service (Recommended)

Go to [feedbacks.dev](https://feedbacks.dev), create an account, and install the widget in your app. Free and Pro plans are available, with billing handled by Dodo Payments.

Hosted convention: `www.feedbacks.dev` is the marketing, docs, and public board home. `app.feedbacks.dev` is the hosted product origin for auth, the dashboard, API, and widget assets.

### Local Development And Source Review

This repository is source-available so contributors can inspect, audit, and improve the product. Customer setup should not require Supabase migrations or infrastructure work; customers should use the hosted service above.

For local development:

```bash
# Clone
git clone https://github.com/WarriorSushi/Feedbacks.dev.git
cd feedbacks.dev-2026

# Install
pnpm install

# Configure
cp packages/dashboard/.env.local.example packages/dashboard/.env.local
# Add your Supabase URL and keys

# Internal/staging databases use the ordered SQL chain documented in docs/DEPLOYMENT.md

# Dev, including a fresh local widget build
pnpm dev:local

# Build
pnpm build
```

`pnpm dev:local` rebuilds the customer widget, copies it into the dashboard, and starts the app at `http://localhost:3000`. Use `pnpm dev` when only dashboard code changed. See [Local development](docs/local-development.md) before signing in so local work does not write to the production Supabase project.

### Launch Docs

- [Hosted production deployment guide](docs/DEPLOYMENT.md)
- [Product implementation status](docs/product-status.md)
- [MCP setup](docs/MCP.md)
- [Migration reconciliation for maintainers](docs/2026-06-09-migration-history-reconciliation.md)
- [Production deploy checklist](docs/2026-06-09-production-deploy-checklist.md)

### Widget Installation

```html
<!-- Website, React, Vue, WordPress, and site builders -->
<div data-feedbacks-host="your-project-key"></div>

<script
  src="https://app.feedbacks.dev/widget/latest.js"
  data-project="your-project-key"
  defer
></script>
```

---

## Project Structure

```
packages/
  dashboard/      # Next.js 15 app - auth, inbox, projects, boards, integrations
  widget/         # Embeddable feedback widget - modal, inline, trigger modes
  widget-react/   # Internal React wrapper (not published)
  widget-vue/     # Internal Vue wrapper (not published)
  shared/         # Shared TypeScript types
  mcp-server/     # MCP server for AI agent integration
sql/              # Internal Supabase migration files for hosted/staging operations
```

---

## Commands

```bash
pnpm dev              # Start dashboard dev server
pnpm dev:local        # Rebuild/copy the widget, then start the dashboard
pnpm build            # Build everything
pnpm type-check       # TypeScript validation
pnpm test:unit        # Unit tests
pnpm test:e2e         # Playwright suite; skips when local E2E env is incomplete
pnpm test:e2e:required # Playwright suite with required env preflight for acceptance
pnpm widget:dev       # Widget dev server
pnpm widget:build     # Build widget only
```

---

## Who It's For

- **Indie hackers** who need feedback without enterprise overhead
- **SaaS founders** shipping fast and iterating on user input
- **Product engineers** who want structured feedback in their workflow
- **Small teams** that need public roadmaps and voting boards
- **AI-first developers** who want agents to interact with feedback programmatically

---

## Contributing

We welcome contributions of all sizes. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork, clone, install
pnpm install

# Make changes, then verify
pnpm type-check
pnpm build

# Submit a PR
```

---

## License

feedbacks.dev is licensed under the [Functional Source License, Version 1.1, MIT Future License (FSL-1.1-MIT)](LICENSE).

**What this means:**

- **Source available today** - you can read, audit, and contribute to the code.
- **FSL first, MIT later** - each covered version becomes MIT after the two-year FSL period.
- **Hosted product focus** - the service customers should use is feedbacks.dev / app.feedbacks.dev.
- **No competing hosted service during the FSL period** - do not offer feedbacks.dev, or a substantially similar hosted feedback product based on it, as a competing service.

This section is a plain-language summary, not a replacement for the license text.

---

<div align="center">

**[feedbacks.dev](https://feedbacks.dev)** - Stop guessing what to build.

If this project is useful to you, consider giving it a star. It helps others find it.

</div>
