# feedbacks.dev — Full-Ass Transformation

## What This Is

feedbacks.dev started as a half-assed feedback widget. This document tracks the rebuild into a **full product worth paying for** — a developer-first feedback collection platform with an embeddable widget, management dashboard, and API.

## The Problem

Every feedback tool is either:

- **Too simple** — a form that dumps into email, no workflow
- **Too bloated** — enterprise monsters with 200 features nobody uses
- **Not developer-friendly** — no API, no customization, painful integration

## The Solution

A feedback platform built **by developers, for developers**:

- **Widget**: Copy-paste one script tag. Done. Vanilla TS, under 20KB.
- **Dashboard**: Triage feedback like a pro. Filter, categorize, act.
- **API**: Build whatever you want on top.
- **Integrations**: Slack, Discord, GitHub — feedback goes where your team already works.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Database + Auth | Supabase (Postgres + RLS + Auth) |
| Styling | Tailwind CSS + shadcn/ui |
| Widget | Vanilla TypeScript (<20KB) |
| Monorepo | pnpm workspaces |
| Hosting | Vercel |

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture](./architecture.md) | Technical architecture and system design |
| [Features](./features.md) | Complete feature list with pricing tiers |
| [Roadmap](./roadmap.md) | Phased delivery plan |

## Guiding Principles

1. **Ship fast, ship real** — every phase delivers usable value
2. **Developer experience first** — if integration takes more than 5 minutes, we failed
3. **Earn the price tag** — every paid feature must clearly save time or unlock capability
4. **Stay lean** — no feature bloat, no premature abstraction
