# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    Client Sites                      │
│  <script src="feedbacks.dev/widget.js"></script>     │
└──────────────────────┬──────────────────────────────┘
                       │ REST API
                       ▼
┌─────────────────────────────────────────────────────┐
│              Next.js 15 (Vercel)                     │
│                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Dashboard   │  │  API Routes  │  │  Widget    │ │
│  │  (App Router)│  │  /api/v1/*   │  │  Endpoint  │ │
│  └─────────────┘  └──────┬───────┘  └────────────┘ │
│                          │                           │
└──────────────────────────┼──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│                   Supabase                           │
│                                                      │
│  ┌──────────┐  ┌──────┐  ┌─────────┐  ┌──────────┐│
│  │ Postgres │  │ Auth │  │ Storage │  │ Realtime ││
│  │ + RLS    │  │      │  │ (files) │  │ (future) ││
│  └──────────┘  └──────┘  └─────────┘  └──────────┘│
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│              Webhook Dispatchers                     │
│  Slack  │  Discord  │  GitHub  │  Email              │
└─────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
feedbacks.dev/
├── apps/
│   └── web/                    # Next.js 15 dashboard + API
│       ├── app/
│       │   ├── (auth)/         # Login, signup, callback
│       │   ├── (dashboard)/    # Protected dashboard routes
│       │   │   ├── projects/
│       │   │   ├── inbox/
│       │   │   ├── analytics/
│       │   │   └── settings/
│       │   └── api/
│       │       └── v1/
│       │           ├── feedback/   # Submit, list, update
│       │           ├── projects/   # CRUD
│       │           ├── widgets/    # Config
│       │           └── webhooks/   # Manage integrations
│       ├── components/
│       │   ├── ui/             # shadcn/ui components
│       │   ├── dashboard/      # Dashboard-specific
│       │   └── feedback/       # Feedback display components
│       └── lib/
│           ├── supabase/       # Client + server clients
│           ├── api/            # API helpers
│           └── utils/
├── packages/
│   ├── widget/                 # Embeddable widget (vanilla TS)
│   │   ├── src/
│   │   │   ├── widget.ts       # Main entry
│   │   │   ├── ui.ts           # DOM rendering
│   │   │   ├── api.ts          # Submit feedback
│   │   │   ├── screenshot.ts   # html2canvas integration
│   │   │   └── styles.ts       # Injected CSS
│   │   └── rollup.config.js    # Bundle to <20KB
│   ├── shared/                 # Shared types + constants
│   │   └── src/
│   │       ├── types.ts
│   │       └── constants.ts
│   └── supabase/               # DB types, migrations
│       ├── migrations/
│       └── seed.sql
├── docs/
│   └── full-ass/               # This documentation
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

## Database Schema

### Core Tables

```sql
-- Multi-tenancy via projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text unique not null,
  api_key text unique not null default encode(gen_random_bytes(24), 'hex'),
  domain text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Feedback entries
create table feedback (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  type text not null check (type in ('bug', 'idea', 'praise', 'other')),
  status text not null default 'new' check (status in ('new', 'reviewed', 'planned', 'closed')),
  message text not null,
  rating int check (rating between 1 and 5),
  email text,
  page_url text,
  user_agent text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tags for organizing feedback
create table tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  unique(project_id, name)
);

create table feedback_tags (
  feedback_id uuid references feedback(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (feedback_id, tag_id)
);

-- File attachments via Supabase Storage
create table attachments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid references feedback(id) on delete cascade,
  file_name text not null,
  file_type text not null,
  file_size int not null,
  storage_path text not null,
  created_at timestamptz default now()
);

-- Widget configuration per project
create table widget_configs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade unique,
  position text default 'bottom-right',
  primary_color text default '#6366f1',
  text_color text default '#ffffff',
  trigger_text text default 'Feedback',
  title text default 'Send us feedback',
  show_rating boolean default true,
  show_screenshot boolean default true,
  show_email boolean default true,
  categories text[] default '{"bug","idea","praise"}',
  custom_css text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Webhook integrations
create table webhooks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  type text not null check (type in ('slack', 'discord', 'github', 'custom')),
  url text not null,
  events text[] default '{"feedback.created"}',
  active boolean default true,
  created_at timestamptz default now()
);
```

### Row Level Security

Every table uses RLS. Users can only access data belonging to their projects.

```sql
-- Example: feedback table RLS
alter table feedback enable row level security;

create policy "Users can view feedback for their projects"
  on feedback for select using (
    project_id in (select id from projects where user_id = auth.uid())
  );

-- Widget submissions use API key auth via service role
create policy "API can insert feedback"
  on feedback for insert with check (true);  -- Validated at API layer
```

## API Design

### Public API (Widget + External)

All public endpoints authenticate via `x-api-key` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/feedback` | Submit feedback |
| GET | `/api/v1/widget/config/:slug` | Get widget config |

### Authenticated API (Dashboard)

Uses Supabase session cookies.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects` | List projects |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/feedback?project_id=X` | List feedback with filters |
| PATCH | `/api/v1/feedback/:id` | Update status/tags |
| DELETE | `/api/v1/feedback/:id` | Delete feedback |
| GET | `/api/v1/analytics` | Feedback stats |
| POST | `/api/v1/feedback/export` | CSV export |
| CRUD | `/api/v1/webhooks` | Manage webhooks |
| CRUD | `/api/v1/tags` | Manage tags |

### Anti-Spam Strategy

Three layers, applied at the API route level:

1. **Rate limiting** — IP-based, 10 submissions per minute per project
2. **Honeypot field** — Hidden form field, bots fill it, humans don't
3. **CAPTCHA** — Turnstile (free) or hCaptcha, optional per project

## Widget Architecture

The widget is a self-contained vanilla TypeScript bundle:

```
widget.js (~15KB gzipped)
├── Creates shadow DOM (style isolation)
├── Renders floating trigger button
├── Opens feedback form (type, message, rating, email, screenshot)
├── Captures screenshot via html2canvas (lazy-loaded, not in bundle)
├── Submits to /api/v1/feedback with project API key
└── Shows success/error state
```

### Integration

```html
<!-- Minimum -->
<script src="https://feedbacks.dev/widget.js" data-project="PROJECT_SLUG"></script>

<!-- Customized -->
<script
  src="https://feedbacks.dev/widget.js"
  data-project="PROJECT_SLUG"
  data-position="bottom-left"
  data-color="#10b981"
  data-text="Report a bug"
></script>
```

### JavaScript API

```js
// Programmatic control
window.Feedbacks.open();
window.Feedbacks.close();
window.Feedbacks.setUser({ email: 'user@example.com', name: 'Jane' });
window.Feedbacks.destroy();
```

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Vanilla TS widget | Zero dependencies = tiny bundle, no framework conflicts |
| Shadow DOM | Style isolation from host site |
| Supabase | Auth + DB + Storage + Realtime in one. Fast to ship. |
| Next.js App Router | RSC for dashboard perf, API routes for backend |
| pnpm monorepo | Shared types between widget and dashboard |
| RLS | Security at the database layer, not just API |
| API keys (not JWTs) for widget | Simpler integration, domain-restricted |
