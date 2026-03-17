# feedbacks.dev

<div align="center">

![feedbacks.dev Logo](https://img.shields.io/badge/feedbacks-dev-2563eb?style=for-the-badge&logo=react)

**A lightweight, developer-first feedback widget that embeds in any website with one line of code**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

[🚀 Live Demo](https://feedbacks.dev) • [📖 Documentation](./CLAUDE.md) • [🐛 Report Bug](https://github.com/WarriorSushi/feedbacks.dev/issues/new?template=bug_report.md) • [💡 Request Feature](https://github.com/WarriorSushi/feedbacks.dev/issues/new?template=feature_request.md)

</div>

## ✨ Features

- **🪶 Lightweight**: Under 20KB gzipped - won't slow down your site
- **⚡ Fast**: Loads in <100ms globally with CDN distribution  
- **📱 Mobile-First**: Responsive design that works on any device
- **🔧 Developer-Friendly**: Simple API, TypeScript support, clear docs
- **🎨 Customizable**: Position, colors, and styling options
- **🔒 Secure**: Rate limiting, input validation, and privacy-focused
- **🌍 Cross-Platform**: Works with React, Vue, vanilla HTML, and mobile apps

## Quick Start

### 1. Add the widget to your site

```html
<link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/latest.css">
<script 
  src="https://app.feedbacks.dev/cdn/widget/latest.js"
  data-project="feedbacks_dev_api_key_abc123"
  defer>
</script>
```

### 2. Get feedback instantly

That's it! Users can now submit feedback directly from your website.

## What's in the box?

### Widget
- Vanilla TypeScript implementation
- Mobile-responsive CSS animations
- Auto-captures page context
- Accessibility features built-in

### Dashboard
- Next.js 14 with App Router
- shadcn/ui components for premium feel
- Real-time feedback management
- Project organization

### API
- Secure feedback submission
- Rate limiting (10 req/min per IP)
- Input validation and sanitization
- Supabase backend with RLS

## Development

### Prerequisites
- Node.js 18+ 
- pnpm 10+
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/WarriorSushi/feedbacks.dev.git
cd feedbacks.dev

# Install dependencies
pnpm install

# Set up environment variables
cp packages/dashboard/.env.example packages/dashboard/.env.local
# Add your Supabase credentials to .env.local
```

### Environment Variables

Create `packages/dashboard/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL migrations:
   ```sql
   -- Copy and paste contents of sql/001_initial_schema.sql
   -- Then copy and paste contents of sql/002_rls_policies.sql
   ```

### Development Commands

```bash
# Start dashboard development server
pnpm dashboard:dev

# Start widget development server
pnpm widget:dev

# Build for production
pnpm build

# Type checking
pnpm type-check
```

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Comprehensive development guide
- **[guide.md](./guide.md)** - Step-by-step implementation guide  
- **[prd.md](./prd.md)** - Product requirements and specifications

## 🏗️ Project Structure

```
feedbacks.dev/
├── packages/
│   ├── widget/          # Vanilla TypeScript widget
│   │   ├── src/
│   │   │   ├── widget.ts    # Main widget logic
│   │   │   ├── styles.css   # Mobile-first CSS
│   │   │   └── types.ts     # TypeScript definitions
│   │   └── webpack.config.js
│   └── dashboard/       # Next.js dashboard
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   └── lib/         # utilities and types
│       └── tailwind.config.js
├── sql/                 # Database migrations
│   ├── 001_initial_schema.sql
│   └── 002_rls_policies.sql
└── docs/               # Additional documentation
```

## 🚢 Deployment

### Widget (CDN)
The widget is designed to be served from a CDN for global performance:

```bash
# Build the widget
pnpm widget:build

# Deploy packages/widget/dist assets to your CDN
# Configure proper caching headers
```

### Dashboard (Vercel)
The dashboard deploys seamlessly to Vercel:

```bash
# Build the dashboard
pnpm dashboard:build

# Deploy to Vercel
pnpm dlx vercel deploy
```

## 🤝 Contributing

We love contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run type checking: `pnpm type-check`
5. Commit using conventional commits: `git commit -m 'feat: add amazing feature'`
6. Push and create a Pull Request

## 🐛 Issues & Support

- 🐛 **Bug Reports**: [Create an issue](https://github.com/WarriorSushi/feedbacks.dev/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: [Create an issue](https://github.com/WarriorSushi/feedbacks.dev/issues/new?template=feature_request.md)
- 💬 **Questions**: [Start a discussion](https://github.com/WarriorSushi/feedbacks.dev/discussions)

## 📊 Roadmap

- [ ] **v1.1**: Screenshot capture with feedback
- [ ] **v1.2**: Slack/Discord webhook integrations  
- [ ] **v1.3**: Advanced analytics dashboard
- [ ] **v1.4**: Native mobile SDKs (iOS/Android)
- [ ] **v1.5**: White-label options for agencies

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components  
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

---

<div align="center">

**Made with ❤️ for developers who care about user feedback**

[Website](https://feedbacks.dev) • [Twitter](https://twitter.com/feedbacksdev) • [Discord](https://discord.gg/feedbacksdev)

</div>

## Documentation

- Main guide: `guide.md`
- Security, SRI and CSP: `docs/SECURITY_AND_CSP.md`
- Database migrations: `docs/MIGRATIONS.md`
- Rate limiting options: `docs/RATE_LIMITING.md`
## Webhooks, Digests, and Integrations (Setup Guide)

The dashboard supports per‑project webhooks for Slack, Discord, and Generic HTTP endpoints. You can send notifications on new feedback and/or hourly digests. This guide is copy‑paste ready for collaborators.

### 1) Environment variables

- `APP_BASE_URL` (optional): Base URL used in message links. Example: `https://app.feedbacks.dev`
- `CRON_SECRET` (recommended): Shared secret to protect the digest runner endpoint.

In Vercel: Project → Settings → Environment Variables → add keys and values.

### 2) Hourly digests via GitHub Actions (recommended)

This repo includes a workflow that runs hourly and calls the digest endpoint securely.

Add two GitHub repo secrets:

- `APP_DOMAIN`: your deployed domain without protocol (e.g. `app.feedbacks.dev`)
- `CRON_SECRET`: a long random string (used both by the workflow and the app)

Where to add: GitHub → Repo → Settings → Secrets and variables → Actions → New repository secret

The workflow is here:

- `.github/workflows/webhook-digest.yml`

It triggers: `GET https://$APP_DOMAIN/api/webhooks/digest` with header `X-Cron-Secret: $CRON_SECRET`.

Also set `CRON_SECRET` in your hosting platform (Vercel → Project → Settings → Environment Variables).

Manual test (replace domain and secret):

```
curl -fsS -H "X-Cron-Secret: YOUR_SECRET" "https://YOUR_DOMAIN/api/webhooks/digest"
```

### 3) Configure endpoints in the UI

In the dashboard → Project → Integrations tab:

- Add one or more endpoints per channel (Slack/Discord/Generic)
- Choose Events: On new feedback (created) and/or Hourly digest
- Optional rules: rating ≤ N, only certain types (bug/idea/praise), tags include X
- Optional redaction (Generic): hide `email` and/or `url` in payloads
- Optional rate limit: cap sends per minute for that endpoint
- Test each endpoint and watch health + recent deliveries; use Resend on failures

### 4) Payloads and signing

- Slack: Uses Block Kit and attachments; color and emoji vary by type.
- Discord: Uses embeds; color varies by type.
- Generic: JSON payload with `event`, `project`, and `feedback` fields.
  - If a secret is set, the request is signed with `X-Feedbacks-Timestamp` and `X-Feedbacks-Signature` (HMAC SHA‑256 of `<timestamp>.<body>`).

### 5) Where code lives

- Immediate delivery (created): `packages/dashboard/src/app/api/feedback/route.ts`
- Hourly digest runner: `packages/dashboard/src/app/api/webhooks/digest/route.ts`
- Config API: `packages/dashboard/src/app/api/projects/[id]/webhooks/route.ts`
- Logs API: `packages/dashboard/src/app/api/projects/[id]/webhooks/logs/route.ts`
- Integrations UI: `packages/dashboard/src/components/project-integrations.tsx`

That’s it — once secrets are set and endpoints are configured, hourly digests and on‑create notifications will flow automatically.

For more details, see `docs/webhooks.md`.

Anti‑spam guide: see `docs/anti-spam.md`.
