<div align="center">

# feedbacks.dev

### The feedback stack for developers who ship.

Embeddable widget + smart dashboard + public voting boards + AI agent API — everything you need to collect, organize, and act on user feedback.

[![FSL-1.1-MIT](https://img.shields.io/badge/license-FSL--1.1--MIT-blue?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/WarriorSushi/feedbacks.dev-2026/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/WarriorSushi/feedbacks.dev-2026/actions)
[![GitHub Stars](https://img.shields.io/github/stars/WarriorSushi/feedbacks.dev-2026?style=flat-square&color=yellow)](https://github.com/WarriorSushi/feedbacks.dev-2026/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/WarriorSushi/feedbacks.dev-2026?style=flat-square)](https://github.com/WarriorSushi/feedbacks.dev-2026/issues)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)
[![Built with Next.js](https://img.shields.io/badge/Next.js%2015-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[Website](https://feedbacks.dev) &nbsp;&middot;&nbsp; [Public Boards](https://feedbacks.dev/boards) &nbsp;&middot;&nbsp; [Documentation](https://feedbacks.dev) &nbsp;&middot;&nbsp; [Contributing](CONTRIBUTING.md)

</div>

---

## The Problem

Most feedback tools are either too heavy for small teams or too simple to be useful. You end up with a bloated enterprise tool nobody opens, or a basic form that dumps feedback into a void.

**feedbacks.dev sits in the middle** — lightweight enough to install in one line, structured enough to help you ship what users actually want.

---

## Features

### Drop-In Widget
Install with one line. Collects feedback with full context (URL, browser, screenshots). Under 20KB gzipped. Works with any framework.

```bash
pnpm add @feedbacks/widget
```

```typescript
import { FeedbacksWidget } from '@feedbacks/widget'

FeedbacksWidget.init({
  projectKey: 'your-project-key',
  theme: 'auto'
})
```

### Smart Dashboard
Not just an inbox. Filter by type, priority, and status. Assign, tag, and track feedback through your workflow. Team notes and internal discussions on every item.

### Public Voting Boards
Let your users vote on features and report bugs publicly. Custom branding, announcements, moderation tools, and spam protection built in.

Each board gets its own URL at `feedbacks.dev/p/your-product` with:
- Upvoting and discussion
- Status tracking (Planned, In Progress, Shipped)
- Custom accent colors and branding
- Announcements and changelog

### Board Directory
Discover what other products are building. Browse public boards, filter by category, find inspiration.

### AI Agent API
Your AI agents can file bugs and query feedback programmatically. Built-in MCP server for Claude, plus a REST API that works with any agent framework.

```bash
# MCP Server (for Claude Code, Cursor, etc.)
npx @feedbacks/mcp-server --api-key fb_live_...

# REST API
curl https://feedbacks.dev/api/v1/feedback \
  -H "X-API-Key: fb_live_..." \
  -H "Content-Type: application/json" \
  -d '{"message": "Export crashes on large datasets", "type": "bug"}'
```

### Webhooks
Push feedback to Slack, Discord, GitHub Issues, or any HTTP endpoint. Instant or digest delivery. Filter by type, rating, or tags.

### Privacy-First
No tracking scripts. No cookies. No third-party analytics. Your users' data stays in your Supabase instance.

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

### Cloud (Fastest)

Go to [feedbacks.dev](https://feedbacks.dev), create an account, and install the widget in your app. Free tier available.

### Self-Hosted

```bash
# Clone
git clone https://github.com/WarriorSushi/feedbacks.dev-2026.git
cd feedbacks.dev-2026

# Install
pnpm install

# Configure
cp packages/dashboard/.env.example packages/dashboard/.env.local
# Add your Supabase URL and keys

# Run migrations (execute SQL files in sql/ folder against your Supabase project)

# Dev
pnpm dev

# Build
pnpm build
```

### Widget Installation

```bash
# npm/pnpm/yarn
pnpm add @feedbacks/widget

# React wrapper
pnpm add @feedbacks/widget-react

# Vue wrapper
pnpm add @feedbacks/widget-vue

# CDN (no build step)
<script src="https://feedbacks.dev/widget/latest.js"></script>
```

---

## Project Structure

```
packages/
  dashboard/      # Next.js 15 app — auth, inbox, projects, boards, integrations
  widget/         # Embeddable feedback widget — modal, inline, trigger modes
  widget-react/   # React wrapper component
  widget-vue/     # Vue wrapper component
  shared/         # Shared TypeScript types
  mcp-server/     # MCP server for AI agent integration
sql/              # Supabase migration files
```

---

## Commands

```bash
pnpm dev              # Start dashboard dev server
pnpm build            # Build everything
pnpm type-check       # TypeScript validation
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

- ✅ **Free to self-host** — personal, company, education, any size
- ✅ **Free to modify** — change anything, build plugins, customize
- ✅ **Free to redistribute** — share copies with the license included
- ✅ **Source available** — read, audit, and learn from all code
- ✅ **Converts to MIT** — each version becomes fully MIT after 2 years
- ❌ **No competing service** — you can't offer feedbacks.dev as a hosted product that competes with us

---

<div align="center">

**[feedbacks.dev](https://feedbacks.dev)** — Stop guessing what to build.

If this project is useful to you, consider giving it a star. It helps others find it.

</div>
