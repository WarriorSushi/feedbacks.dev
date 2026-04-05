# feedbacks.dev — Deployment Guide

## Prerequisites
- Supabase project (you already have one)
- Vercel account (for hosting)
- GitHub account (for OAuth + repo)

---

## Step 1: Run the SQL Migrations

Go to your **Supabase Dashboard** → **SQL Editor** → run these files in order:

1. `sql/001_initial_schema.sql` — base tables (projects, feedback, webhook_deliveries, etc.)
2. `sql/004_fix_public_board.sql` — adds public board support (is_public, vote_count, votes table, triggers)
3. `sql/005_security_fixes.sql` — security fixes, vote-count repair, and API key hardening prerequisites
4. `sql/006_public_board_comments.sql` — public admin comments on board items
5. `sql/007_phase6_hardening.sql` — typed board profile fields, announcements, follows, watches, reports, and durable webhook jobs
6. `sql/008_board_display_name.sql` — public board display name support
7. `sql/009_billing_and_entitlements.sql` — billing accounts, events, usage counters, and quota helpers
8. `sql/010_api_key_hardening.sql` — final API-key storage hardening
9. `sql/011_notification_digests.sql` — digest scheduling support

**How:** Copy-paste the contents of each file into the SQL Editor and click "Run".

Do not treat `sql/000_full_reset_v2-ran this one for v2. nothing else needed.sql` as the canonical production migration path. It is a reset snapshot for local recovery, not the ordered migration source of truth.

---

## Step 2: Supabase Auth Configuration

Go to **Supabase Dashboard** → **Authentication**:

### Email (Magic Link)
1. **Providers → Email** → Enabled ✅
2. Enable "Confirm email" (recommended for production)
3. Set the Site URL (see below)

### GitHub OAuth
1. **Providers → GitHub** → Enabled ✅
2. Go to [GitHub Developer Settings](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name:** feedbacks.dev
   - **Homepage URL:** `https://your-domain.com`
   - **Authorization callback URL:** `https://your-supabase-project.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client Secret** back into Supabase GitHub provider settings

### URL Configuration
1. **Authentication → URL Configuration**:
   - **Site URL:** `https://your-domain.com` (or `http://localhost:3000` for local dev)
   - **Redirect URLs:** Add both:
     - `http://localhost:3000/auth/callback`
     - `https://your-domain.com/auth/callback`

---

## Step 3: Supabase Storage (for screenshots)

1. Go to **Storage** → **New Bucket**
2. Create bucket: `feedback_screenshots` → Public ✅
3. Create bucket: `feedback_attachments` → Public ✅

---

## Step 4: Environment Variables

### For local development
Copy `packages/dashboard/.env.local.example` to `packages/dashboard/.env.local`, then fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_ORIGIN=http://127.0.0.1:3000
# CRON_SECRET=your-cron-secret
```

Find these in **Supabase Dashboard → Settings → API**.

Optional but recommended for the new reliability and moderation surfaces:

```
WEBHOOK_JOB_SECRET=your-webhook-job-secret
BOARD_REPORT_SALT=your-board-report-salt
E2E_AUTH_BYPASS_SECRET=your-e2e-auth-bypass-secret
```

`E2E_AUTH_BYPASS_SECRET` is only needed for the local Playwright acceptance flow.

### For Vercel
Add the required server/runtime variables in **Vercel → Project Settings → Environment Variables**. Keep `SUPABASE_SERVICE_ROLE_KEY`, webhook secrets, billing secrets, and email keys server-only. Only `NEXT_PUBLIC_*` values should reach the browser.

---

## Step 5: Deploy to Vercel

### Option A: Via Vercel Dashboard
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `packages/dashboard`
   - **Build Command:** `cd ../.. && pnpm build`
   - **Install Command:** `pnpm install`
4. Add environment variables (Step 4)
5. Deploy

### Option B: Via CLI
```bash
# Install Vercel CLI
pnpm add -g vercel

# From the project root
vercel

# Follow prompts, set root directory to packages/dashboard
```

### Vercel Settings to Check
- **Node.js Version:** 20.x (Settings → General)
- **Framework:** Next.js (should auto-detect)
- Make sure "Include source files outside root directory" is ON (for monorepo)

---

## Step 6: Custom Domain (Optional)

1. **Vercel → Domains** → Add your domain
2. Update DNS records as Vercel instructs
3. Update Supabase **Site URL** and **Redirect URLs** to use the new domain
4. Update GitHub OAuth callback URL

---

## Step 7: Post-Deploy Verification

Test this checklist:

- [ ] Landing page loads at `/`
- [ ] Can sign in via GitHub OAuth
- [ ] Can sign in via magic link email
- [ ] Dashboard loads at `/dashboard`
- [ ] Can create a new project
- [ ] Widget install tab shows correct script URL
- [ ] Widget works when embedded on a test page
- [ ] Can submit feedback through the widget
- [ ] Feedback appears in the inbox
- [ ] Can change feedback status
- [ ] Can add internal notes
- [ ] Public board works at `/p/[slug]`
- [ ] Board follow/watch/report flows work when signed in
- [ ] Announcements appear on the public board
- [ ] `/boards` directory reflects public vs unlisted/private visibility
- [ ] Voting works on the public board
- [ ] Webhook test send and resend work from the integrations screen
- [ ] Webhook retries are processed by the cron-backed queue
- [ ] API key auth works for `/api/v1/` endpoints
- [ ] CSV export downloads at `/api/projects/[id]/feedback.csv`
- [ ] Privacy and Terms pages load

---

## Supabase RLS Policies

The migration files set up RLS, but verify these are active:

| Table | Policy | Who |
|-------|--------|-----|
| projects | Users see own projects | `owner_user_id = auth.uid()` |
| feedback | Users see feedback from their projects | Via project ownership |
| feedback_notes | Users manage notes on their feedback | Via project ownership |
| public_board_settings | Anyone reads enabled boards | `enabled = true` |
| votes | Anyone can vote | Public insert/delete |

Check in **Supabase → Authentication → Policies** that each table has RLS enabled.

---

## Widget Installation (for your users)

Once deployed, users install the widget with:

```html
<script
  src="https://your-domain.com/widget/latest.js"
  data-project="PROJECT_KEY"
  data-api-url="https://your-domain.com/api/feedback"
  defer
></script>
```

The widget JS is served from `/widget/latest.js` on your domain.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Invalid API key" on widget | Check the project's API key in dashboard |
| OAuth redirect fails | Verify callback URLs in Supabase + GitHub |
| No feedback appearing | Check RLS policies, ensure feedback table has data |
| Widget not loading | Check browser console, verify script URL |
| Build fails on Vercel | Ensure root directory is `packages/dashboard`, Node 20+ |
| Public board empty | Verify migrations `004` through `008` ran, then check `is_public` and `public_board_settings` rows |
