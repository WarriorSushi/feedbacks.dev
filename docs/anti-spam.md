# Anti‑spam (ELI5)

Bots try to submit fake feedbacks. We add three simple guards:

- Honeypot: a hidden field humans don’t see; bots fill it → we reject.
- Captcha: a small challenge (Turnstile/hCaptcha) that gives us a token to prove it’s a human.
- Rate limiting: slow down repeat submissions (e.g., 5/min per IP).

## Setup in 3 steps

1) Choose a captcha provider and get keys
- Turnstile (Cloudflare): Create a site → get a site key (public) and secret (server).
- hCaptcha: Create a site → get a site key (public) and secret (server).

2) Configure server secrets (for verification)
- In Vercel → Project → Settings → Environment Variables
  - For Turnstile: `TURNSTILE_SECRET`
  - For hCaptcha: `HCAPTCHA_SECRET`

3) Configure per project
- Project → Widget Installation → Anti‑spam (Captcha):
  - Require Captcha: Yes
  - Provider: Turnstile or hCaptcha
  - Paste your site key → Save

Optional default keys
- Settings → Anti‑spam Defaults: store site keys once, then “Load Defaults” on each project.

## How it works
- The widget renders the captcha if required and sends the token with the form.
- The server verifies the token with the provider secret. If invalid or missing → reject.
- Honeypot is always there (hidden field `hp`). If filled → reject.
- Rate limit is enforced automatically on `/api/feedback` (5/min per IP).

## Troubleshooting
- “Captcha failed/required”: Ensure the site key and server secret are correct and you solved the captcha.
- “Too many requests”: You hit the per‑minute limit; wait a minute and try again.
- Captcha not showing: Ensure “Require Captcha” is on, a provider is selected, and a site key is saved.

