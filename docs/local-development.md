# Local development

Use the dashboard locally while keeping authentication and test data isolated from production.

## Important data boundary

Running Next.js on `localhost` does not make the configured Supabase project local. Every project, feedback item, release note, and setting is written to the Supabase project named by `NEXT_PUBLIC_SUPABASE_URL`.

Do not use the production Supabase project for normal local development or automated tests. Use a separate development project, branch, or local Supabase stack. The repository's E2E safeguards intentionally reject the production project.

## First-time setup

1. Create or choose a non-production Supabase project.
2. Follow the database and storage setup in [DEPLOYMENT.md](DEPLOYMENT.md) for that project.
3. Copy `packages/dashboard/.env.local.example` to `packages/dashboard/.env.local`.
4. Add the development project's URL, publishable or anon key, and service-role key.
5. Set `NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000`.
6. In Supabase **Authentication → URL Configuration**, add `http://localhost:3000/auth/callback` to the redirect allow list.

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never put it in a `NEXT_PUBLIC_` variable or commit `.env.local`.

## Start the complete app

From the repository root:

```bash
pnpm install
pnpm dev:local
```

Open `http://localhost:3000/auth`. The `dev:local` command rebuilds and copies the customer widget before starting Next.js, so widget and release-note changes are visible without a Vercel deployment.

For later dashboard-only edits, use:

```bash
pnpm dev
```

If widget code changes while the server is already running, rebuild and copy it, then reload the browser:

```bash
pnpm widget:build
pnpm widget:copy
```

## Test accounts

Accounts belong to the configured Supabase project. `test@test.com` works locally only when that account exists in the non-production project selected by `.env.local`.

For ordinary manual testing, use one of these methods:

- request a magic link from the local sign-in page;
- use Google or GitHub OAuth after configuring that provider for the development project;
- create a confirmed password user in the development project's Supabase Auth dashboard, then use **Use password instead**.

The `/api/test/session` route is only for Playwright. It remains disabled unless every isolated-E2E safety variable is present and the configured Supabase project is not production.

## Google sign-in for local development

1. Create a Google OAuth Web client for development.
2. Add `http://localhost:3000` as an authorized JavaScript origin.
3. Add the development Supabase project's callback URL, `https://YOUR_DEV_PROJECT.supabase.co/auth/v1/callback`, as an authorized redirect URI.
4. Enable Google in the development project's Supabase Auth provider settings and add the client ID and secret there.
5. Keep `http://localhost:3000/auth/callback` in the Supabase redirect allow list.

The browser returns through `/auth/callback`, where the server exchanges the PKCE code for a cookie-backed session.

## Verification before deployment

Run the local quality gates after a batch of improvements:

```bash
pnpm type-check
pnpm lint
pnpm test:unit
pnpm build
```

Run Playwright only against an isolated E2E Supabase project. `pnpm test:e2e:required` fails instead of silently targeting an unsafe or incomplete environment.
