# Security Audit — feedbacks.dev

**Date:** 2026-03-17
**Auditor:** Claude (automated static analysis)
**Scope:** All API routes, middleware, and auth/utility files under `packages/dashboard/src/`
**Branch:** `full-ass`

---

## Summary Table

| ID | Severity | Title | File |
|----|----------|-------|------|
| F-01 | CRITICAL | Captcha failure-open: verification errors silently allow all requests | `app/api/feedback/route.ts:54-57` |
| F-02 | CRITICAL | API key stored and compared in plaintext | `lib/api-auth.ts:11-14`, `app/api/projects/route.ts:44` |
| F-03 | HIGH | Wildcard CORS (`*`) on authenticated v1 API endpoints | `app/api/v1/*/route.ts` |
| F-04 | HIGH | Webhook SSRF — no URL allowlist, private IPs reachable | `lib/webhook-delivery.ts:120`, `app/api/projects/[id]/webhooks/route.ts:72-78` |
| F-05 | HIGH | `custom_css` from public board returned to client without sanitisation | `app/api/boards/[slug]/route.ts:48` |
| F-06 | HIGH | Rate-limit key space pollution and bypass via `x-forwarded-for` spoofing | `lib/rate-limit.ts`, all public routes |
| F-07 | HIGH | `metadata` and `structured_data` stored as arbitrary JSON with no schema | `app/api/v1/feedback/route.ts:62-63` |
| F-08 | MEDIUM | `settings` and `webhooks` PATCH accepts arbitrary objects without validation | `app/api/projects/[id]/route.ts:75-76` |
| F-09 | MEDIUM | Missing CSRF protection on state-changing cookie-auth routes | `app/api/projects/[id]/route.ts`, `webhooks/route.ts` |
| F-10 | MEDIUM | API key generated with `crypto.randomUUID()` (128-bit entropy but no prefix/rotation mechanism) | `app/api/projects/route.ts:44` |
| F-11 | MEDIUM | Hardcoded vote salt in source code | `app/api/boards/[slug]/vote/route.ts:25` |
| F-12 | MEDIUM | Base64 screenshot upload skips file-size check | `app/api/feedback/route.ts:175-189` |
| F-13 | MEDIUM | Attachment filename stored verbatim — path traversal in storage key unlikely but name untrusted | `app/api/feedback/route.ts:198,209` |
| F-14 | MEDIUM | Middleware does not protect `/api/*` routes — API routes rely solely on per-handler auth | `middleware.ts:55-58` |
| F-15 | MEDIUM | `email` field not validated in board submit route | `app/api/boards/[slug]/submit/route.ts:39,58` |
| F-16 | LOW | `x-forwarded-for` chain not normalised — leftmost-IP strategy correct but falls back to `'unknown'` sharing one rate-limit slot | `lib/rate-limit.ts`, multiple routes |
| F-17 | LOW | Internal Supabase error message leaked to client in project routes | `app/api/projects/route.ts:17,53`, `[id]/route.ts:79` |
| F-18 | LOW | `sign-out` only clears two hardcoded cookie names; Supabase SSR may use different/dynamic names | `app/api/sign-out/route.ts:12-15` |
| F-19 | LOW | CSV export does not guard against CSV injection (formula injection) | `app/api/projects/[id]/feedback.csv/route.ts:38-54` |
| F-20 | LOW | `url` field from widget accepted and stored without protocol/SSRF checks | `app/api/feedback/route.ts:121-124` |

---

## Critical Findings

### F-01 — CRITICAL: Captcha Failure-Open

**File:** `packages/dashboard/src/app/api/feedback/route.ts:27-58`

```ts
// line 54-57
} catch {
  // Verification service failure — allow through
}
return true   // <-- failure returns true = verified
```

When the Cloudflare Turnstile or hCaptcha verification endpoint is unreachable (network error, timeout, outage), `verifyCaptcha` catches the exception and returns `true`, treating every request as if it passed. An attacker who can block or delay the outbound call to `challenges.cloudflare.com` from the server's perspective (e.g., via a DoS against the verification endpoint, or during any transient outage) bypasses captcha entirely.

**Remediation:**
- Return `false` (not `true`) from the `catch` block.
- Optionally add a flag to distinguish "service unavailable" from "failed" so you can return `503` instead of silently accepting.

```ts
} catch {
  return false  // fail closed on verification errors
}
```

---

### F-02 — CRITICAL: API Keys Stored and Compared in Plaintext

**Files:**
- `packages/dashboard/src/app/api/projects/route.ts:44` — key generated as raw UUID
- `packages/dashboard/src/lib/api-auth.ts:11-14` — full key queried directly from DB

```ts
// projects/route.ts:44
api_key: crypto.randomUUID(),

// api-auth.ts:11-14
const { data: project } = await admin
  .from('projects')
  .select('*')
  .eq('api_key', apiKey)
  .single()
```

The API key is stored as plaintext in the `projects` table. If the database is compromised (misconfigured RLS, a future SQL vulnerability, or a Supabase dashboard breach), all API keys are immediately usable by the attacker without any further cracking step. This is the same class of vulnerability as storing plaintext passwords.

**Remediation:**
- Store a SHA-256 (or bcrypt/argon2) hash of the key in the database.
- The client is given the raw key once (at creation time). All subsequent lookups hash the presented key and compare against the stored hash.
- Alternatively, use a prefix scheme (`fb_live_<random>`) so leaked keys are identifiable and rotatable, and still hash the secret portion for storage.

---

## High Severity Findings

### F-03 — HIGH: Wildcard CORS on Authenticated API v1 Endpoints

**Files:** All files under `packages/dashboard/src/app/api/v1/`

```ts
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  ...
}
```

The v1 API is authenticated via `X-API-Key` headers, so wildcard CORS is less dangerous than for cookie-based auth. However, `app/api/v1/projects/route.ts` also accepts **session-based (cookie) auth** as a fallback (lines 33-49). With `Access-Control-Allow-Origin: *`, cookies are not sent cross-origin (because `withCredentials` would be blocked), so the cookie fallback is safe for now. But the architecture creates a trap: any future developer adding cookie-reliant logic to these routes will silently have it exposed.

Additionally, returning `*` on all v1 routes means any website can make credentialless requests and read responses — acceptable for a public API but you should be deliberate about it.

**Remediation:**
- For the v1 API-key-only endpoints, `*` CORS is acceptable. Document this explicitly.
- Remove the cookie/session auth fallback from `v1/projects/route.ts` entirely, or move it to a separate non-CORS-wildcard route. Mixing auth mechanisms on wildcard-CORS routes is an anti-pattern.

---

### F-04 — HIGH: Webhook SSRF — No URL Validation

**Files:**
- `packages/dashboard/src/lib/webhook-delivery.ts:120`
- `packages/dashboard/src/app/api/projects/[id]/webhooks/route.ts:72-78`

```ts
// webhook-delivery.ts:120
res = await fetch(endpoint.url, { method: 'POST', ... })
```

```ts
// webhooks/route.ts:72-78 (test webhook trigger)
const delivery = await sendTestWebhook(type, endpoint, ...)
// endpoint.url comes straight from the request body
```

An authenticated user can set a webhook URL of `http://169.254.169.254/latest/meta-data/` (AWS IMDSv1), `http://localhost:6379/` (Redis), `http://10.0.0.1/admin`, or any other internal network address. The server will make a POST request to that address and store the response body (up to 1000 chars) in `webhook_deliveries`. This enables:

1. **Cloud metadata exfiltration** (AWS/GCP/Azure IMDS tokens).
2. **Internal network port scanning** via response times and error messages.
3. **Partial response body exfiltration** (1000 chars stored in `webhook_deliveries`).

The test webhook route (POST `/api/projects/[id]/webhooks`) is the most dangerous path because it immediately fires the request and returns the delivery record.

**Remediation:**
- Validate webhook URLs against an allowlist of protocols (`https://` only) and blocklist of private IP ranges (RFC 1918: 10.x, 172.16-31.x, 192.168.x; link-local 169.254.x; loopback 127.x; IPv6 equivalents).
- Use a library like `ssrf-req-filter` or implement a DNS-resolution check before fetching.
- Do not store full response bodies from webhook delivery attempts in the database.

---

### F-05 — HIGH: Unsanitised `custom_css` Returned to Client

**File:** `packages/dashboard/src/app/api/boards/[slug]/route.ts:48`

```ts
return NextResponse.json({
  board: {
    ...
    custom_css: board.custom_css,   // raw user-supplied CSS
  },
```

The `custom_css` field is set by the project owner and returned verbatim to anyone visiting the public board URL. If the frontend renders this CSS via a `<style>` tag or `style` attribute, an attacker who owns a project (or gains access to one) can inject CSS that:

- Exfiltrates page content via CSS attribute selectors + `background-image: url(...)`.
- Performs CSS keylogger attacks on input fields.
- Replaces visible UI elements to phish board visitors.

This is a stored XSS-equivalent risk depending on how the frontend consumes this value.

**Remediation:**
- Apply a CSS sanitizer (e.g., `sanitize-css` / DOMPurify's CSS mode) before storing or before returning.
- If you must allow arbitrary CSS, render it inside a sandboxed `<iframe>` so it cannot reach parent-page DOM.
- At minimum, strip `url()`, `@import`, `expression()`, and any property that can make outbound requests.

---

### F-06 — HIGH: Rate-Limit Bypass via `x-forwarded-for` Spoofing

**File:** `packages/dashboard/src/lib/rate-limit.ts:3-7`, used in all public routes.

```ts
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  ?? request.headers.get('x-real-ip')
  ?? 'unknown'
```

`x-forwarded-for` is a client-supplied header. Unless your deployment infrastructure (Vercel Edge, Cloudflare, nginx) strips and overwrites this header before it reaches the Next.js handler, a caller can send:

```
X-Forwarded-For: 1.2.3.4, attacker-real-ip
```

The handler takes `split(',')[0]` — `1.2.3.4` — as the IP to rate-limit, allowing unlimited requests from the attacker's real IP by cycling through spoofed values.

Additionally, when IP extraction fails and the fallback is `'unknown'`, **all clients with non-extractable IPs share a single rate-limit bucket**, meaning a single bot can starve every legitimate anonymous user.

**Remediation:**
- On Vercel, trust only `x-vercel-forwarded-for` or use `request.ip` from the Vercel runtime (if available).
- On other infrastructure, configure a trusted proxy count and take the *last* N IPs from the XFF chain rather than the first.
- Replace the `'unknown'` fallback with a 400 rejection or use a secondary identifier (user-agent hash) as a tiebreaker.

---

### F-07 — HIGH: Arbitrary JSON Stored in `metadata` and `structured_data`

**File:** `packages/dashboard/src/app/api/v1/feedback/route.ts:62-63`

```ts
const structuredData: StructuredFeedbackData | null = body.structured_data ?? null
const metadata = body.metadata ?? null
```

Both fields are passed through without any size limit, depth limit, or schema validation before being inserted into the database. The `StructuredFeedbackData` type has an index signature `[key: string]: unknown` meaning TypeScript does not constrain this at runtime.

Risks:
- **Denial of service** via deeply nested JSON or extremely large payloads consuming database storage.
- **Prototype pollution** if these objects are ever merged with other objects server-side.
- **Data exfiltration** — an agent key holder can store arbitrary data in your database at no cost to them.

**Remediation:**
- Enforce a maximum byte size on these fields (e.g., 10KB for `structured_data`, 4KB for `metadata`).
- Validate `structured_data` against a strict schema (only allow the documented keys: `stack_trace`, `error_code`, etc.).
- Reject or strip unknown keys at the API boundary.

---

## Medium Severity Findings

### F-08 — MEDIUM: Unvalidated `settings` and `webhooks` PATCH

**File:** `packages/dashboard/src/app/api/projects/[id]/route.ts:75-76`

```ts
if (body.settings !== undefined) updates.settings = body.settings
if (body.webhooks !== undefined) updates.webhooks = body.webhooks
```

An authenticated project owner can PATCH `settings` and `webhooks` with **any arbitrary object**. There is no schema validation. This enables:

- Injecting malformed webhook configs that crash the delivery logic.
- Setting `settings.widget_config.captchaProvider` to an unexpected value to confuse the captcha check.
- Growing the JSONB columns unboundedly in the database.

The `PUT /api/projects/[id]/webhooks` route has the same issue — it inserts the raw parsed JSON body as the entire webhook config with no validation.

**Remediation:**
- Validate `settings` and `webhooks` against strict TypeScript-runtime schemas (use `zod` or a similar validator).
- Reject requests with unexpected keys or values outside permitted enums.

---

### F-09 — MEDIUM: Missing CSRF Protection on Cookie-Auth State-Changing Routes

**Files:**
- `packages/dashboard/src/app/api/projects/[id]/route.ts` (PATCH, DELETE)
- `packages/dashboard/src/app/api/projects/[id]/webhooks/route.ts` (PUT, POST)
- `packages/dashboard/src/app/api/projects/route.ts` (POST)
- `packages/dashboard/src/app/api/sign-out/route.ts` (POST)

These routes use Supabase session cookies for authentication and perform state-changing operations. There is no CSRF token validation. A malicious third-party website can issue cross-origin requests to these endpoints; the browser will attach the Supabase session cookies automatically.

Note: Modern SameSite cookie defaults (`SameSite=Lax`) mitigate most CSRF for top-level navigation but **do not protect** fetch/XHR requests from cross-origin pages in all browser versions.

**Remediation:**
- Verify the `Origin` or `Referer` header matches your expected domain on all cookie-authenticated mutating endpoints.
- Alternatively, use the double-submit cookie pattern or a synchronizer token.
- Ensure Supabase SSR sets `SameSite=Strict` on session cookies where possible.

---

### F-10 — MEDIUM: Weak API Key Format and No Rotation Mechanism

**File:** `packages/dashboard/src/app/api/projects/route.ts:44`

```ts
api_key: crypto.randomUUID(),
```

`crypto.randomUUID()` produces a version 4 UUID (122 bits of entropy). This is cryptographically sufficient for a secret. However:

1. UUIDs have a well-known hyphenated format (`xxxxxxxx-xxxx-4xxx-...`) which reduces effective search space if an attacker knows the format.
2. There is no prefix, making it impossible to identify which service a leaked key belongs to (hinders secret-scanning tools like GitHub's secret scanning or trufflehog).
3. There is no key rotation endpoint — once a key is compromised, the only option is to delete/recreate the project.

**Remediation:**
- Use a prefixed, base62-encoded random key: e.g., `fb_live_<32 random bytes base62>`.
- Add a `POST /api/projects/[id]/rotate-key` endpoint (session-auth only).
- Register the key prefix with GitHub's Secret Scanning partner program.

---

### F-11 — MEDIUM: Hardcoded Vote Salt in Source Code

**File:** `packages/dashboard/src/app/api/boards/[slug]/vote/route.ts:25`

```ts
const data = encoder.encode(ip + '_feedbacks_vote_salt')
```

The salt is a hardcoded string in the source. Anyone with read access to this repository (or who decompiles the deployed server bundle) knows the salt. This makes the voter identifier deterministic given an IP, and allows:

- Pre-computing voter identifiers for known IP ranges.
- Tracking voters across different board slugs.
- The salt provides no real protection if it is public.

**Remediation:**
- Store the salt as an environment variable (`VOTE_HMAC_SECRET`).
- Use HMAC-SHA256 (`crypto.subtle.sign`) instead of a plain hash for the voter identifier.
- Include the board slug in the derivation input so identifiers are not cross-board trackable.

---

### F-12 — MEDIUM: Base64 Screenshot Skips File-Size Check

**File:** `packages/dashboard/src/app/api/feedback/route.ts:175-189`

```ts
} else if (fields.screenshot && fields.screenshot.startsWith('data:image/')) {
  const match = fields.screenshot.match(/^data:image\/(png|jpeg);base64,(.+)$/)
  if (match) {
    const buffer = Buffer.from(match[2], 'base64')
    // no size check before upload
    const { error: uploadErr } = await admin.storage
      .from('feedback_screenshots')
      .upload(path, buffer, ...)
  }
}
```

The multipart `File` upload path checks `MAX_ATTACHMENT_SIZE` (5MB), but the base64 path does not. An attacker can send a base64-encoded image of arbitrary size, which will be decoded into a `Buffer` in memory and then uploaded to Supabase Storage. A sufficiently large payload can:

- Exhaust server RAM causing an OOM crash.
- Fill Supabase Storage quota.
- Cause slow responses that degrade rate-limit enforcement timing.

**Remediation:**
- Check `fields.screenshot.length` before decoding: a 5MB file is ~6.8MB as base64. Reject if `fields.screenshot.length > 7_000_000`.
- After decoding, check `buffer.length` against `MAX_ATTACHMENT_SIZE`.

---

### F-13 — MEDIUM: Attachment Filename Stored Verbatim

**File:** `packages/dashboard/src/app/api/feedback/route.ts:198,209`

```ts
const ext = attachmentFile.name.split('.').pop() ?? 'bin'
// ...
attachments = [{
  url: urlData.publicUrl,
  name: attachmentFile.name,   // raw client-supplied filename
  ...
}]
```

The original filename from the client is stored in the `attachments` JSONB column. If this filename is ever rendered in the dashboard UI without escaping, it becomes an XSS vector. Filenames like `"><img src=x onerror=alert(1)>.pdf` are valid.

The storage key itself uses `crypto.randomUUID()` so path traversal in storage is not an issue, but the stored name is dangerous.

**Remediation:**
- Sanitize the filename before storing: strip all characters except alphanumerics, dots, hyphens, and underscores.
- Ensure the dashboard UI always HTML-encodes filenames when rendering them.

---

### F-14 — MEDIUM: Middleware Explicitly Excludes All `/api/*` Routes

**File:** `packages/dashboard/src/middleware.ts:55-58`

```ts
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/feedback|cdn/).*)',
  ],
}
```

The negative lookahead `api/feedback` only excludes `/api/feedback` from middleware. But the full pattern `(?!...).*` effectively means the middleware only runs on **non-API routes** — it matches paths that don't start with `_next/static`, `_next/image`, `favicon.ico`, `api/feedback`, or `cdn/`. All other `/api/*` routes (e.g., `/api/projects`, `/api/v1/*`, `/api/boards/*`) are also excluded from middleware because the matcher pattern as written does not positively include them.

This means authentication enforcement is entirely per-route with no defense-in-depth. A missed `auth.getUser()` call in any route handler results in a completely unprotected endpoint.

**Remediation:**
- Audit the matcher to confirm intent. If API routes should not run through the session-refresh middleware, document this explicitly.
- Consider adding a middleware check that rejects unauthenticated requests to `/api/projects/*` and similar sensitive paths as a second layer of defense.

---

### F-15 — MEDIUM: Email Not Validated in Board Submit

**File:** `packages/dashboard/src/app/api/boards/[slug]/submit/route.ts:39,58`

```ts
const { message, type, email } = body
// no email format validation
...
email: email?.trim() || null,
```

The widget feedback route (`/api/feedback`) validates email format with a regex. The board submit route stores any string provided as `email` without validation. This could store malformed or injected email strings in the database.

**Remediation:**
- Apply the same `EMAIL_RE` regex check as used in `/api/feedback/route.ts:17,119`.

---

## Low Severity Findings

### F-16 — LOW: All Unknown IPs Share One Rate-Limit Bucket

**File:** `packages/dashboard/src/lib/rate-limit.ts:3-8`

The fallback `'unknown'` means every request where IP extraction fails counts against the same single `rate_limits` row. Under load, a single high-volume client with no forwarded IP can exhaust the bucket for all other clients in the same situation.

**Remediation:** Reject requests with no extractable IP with a `400 Bad Request` rather than rate-limiting them under a shared key.

---

### F-17 — LOW: Supabase Error Messages Leaked to Client

**Files:**
- `packages/dashboard/src/app/api/projects/route.ts:17` — `error.message` returned directly
- `packages/dashboard/src/app/api/projects/[id]/route.ts:79` — `error.message` returned directly

```ts
if (error) return NextResponse.json({ error: error.message }, { status: 500 })
```

Raw Supabase/PostgreSQL error messages can reveal table names, column names, constraint names, and schema details.

**Remediation:** Return a generic `'Internal server error'` string for 500 responses; log the real error server-side only.

---

### F-18 — LOW: Sign-Out Clears Only Two Hardcoded Cookie Names

**File:** `packages/dashboard/src/app/api/sign-out/route.ts:12-15`

```ts
const cookieNames = ['sb-access-token', 'sb-refresh-token']
```

The Supabase SSR client (`@supabase/ssr`) uses project-ref-based cookie names (e.g., `sb-<project-ref>-auth-token`). The hardcoded names may not match, leaving the actual session cookie in the browser after sign-out.

**Remediation:** Call `supabase.auth.signOut()` (already done) and clear cookies by reading them from `request.cookies` rather than guessing their names. Or rely solely on Supabase's own session invalidation.

---

### F-19 — LOW: CSV Export Vulnerable to Formula Injection

**File:** `packages/dashboard/src/app/api/projects/[id]/feedback.csv/route.ts:38-54`

User-supplied data (especially the `message` field) is written to CSV with only comma/quote/newline escaping. A value starting with `=`, `+`, `-`, or `@` will be interpreted as a formula by Excel/LibreOffice when the dashboard user opens the export.

Example payload: `=HYPERLINK("http://evil.com","click me")`

**Remediation:** Prefix any cell value that starts with `=`, `+`, `-`, or `@` with a single quote (tab character is also used), or warn users that the CSV contains untrusted content.

---

### F-20 — LOW: Widget `url` Field Accepted Without Protocol Restriction

**File:** `packages/dashboard/src/app/api/feedback/route.ts:121-124`

```ts
const url = fields.url?.trim() || null
if (url) {
  try { new URL(url) } catch { return jsonError('Invalid URL', 400) }
}
```

`new URL()` accepts `javascript:`, `data:`, `file:`, and other non-HTTP schemes. These are stored in the `url` column and may be rendered as clickable links in the dashboard.

**Remediation:** After `new URL(url)`, verify `parsed.protocol === 'https:' || parsed.protocol === 'http:'` before accepting the value.

---

## Architecture-Level Observations

### No RLS on `rate_limits`, `webhook_deliveries` Tables

These tables are managed exclusively via the service role client (`createAdminSupabase`), so RLS may intentionally be off. Confirm that direct Supabase dashboard access to these tables is restricted to the service role only, and that anonymous/anon-key access cannot read delivery logs (which contain webhook URLs and partial response bodies — potential credential leakage if webhook tokens appear in responses).

### Service Role Key Handling

`SUPABASE_SERVICE_ROLE_KEY` is only referenced in `lib/supabase-server.ts:33` via a server-side `import` that runs exclusively in API routes and server components. It is **not** exported to the client. This is correct. No violations found.

### No Signed Webhook Signatures

Outgoing webhooks (Slack, Discord, generic) have no HMAC signature header. Recipients cannot verify that a delivery originated from feedbacks.dev. This is a missing feature rather than a vulnerability for the server, but it should be noted if customers need to trust incoming payloads.

---

## Recommended Remediation Priority

1. **Immediately:** Fix F-01 (captcha fail-open) — single line change, critical impact.
2. **This sprint:** F-02 (plaintext API keys), F-04 (webhook SSRF), F-06 (rate-limit spoofing).
3. **Next sprint:** F-03, F-05, F-07, F-08, F-09, F-12.
4. **Backlog:** F-10 through F-20.
