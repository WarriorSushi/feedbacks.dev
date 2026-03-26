# Install Security And Anti-Spam

Use this after the basic widget install is already working.

## CSP baseline

Start with an allowlist that covers the widget asset host and the feedback API host:

```text
default-src 'self';
script-src 'self' https://app.feedbacks.dev;
connect-src 'self' https://app.feedbacks.dev;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
```

Adjust the origins if you self-host or pin the widget somewhere else.

## SRI

If you want to pin an integrity hash for the hosted widget asset, generate it from the built file:

```bash
node -e "const fs=require('node:fs');const crypto=require('node:crypto');const file='packages/dashboard/public/widget/latest.js';const hash=crypto.createHash('sha384').update(fs.readFileSync(file)).digest('base64');console.log('integrity=\"sha384-'+hash+'\"')"
```

## Anti-spam baseline

- Public board submissions already use rate limiting.
- Public board submissions also include honeypot rejection and lightweight spam heuristics.
- The widget supports captcha settings through the saved widget config. Turn captcha on after the first install is verified, not before.

## Principle

Install trust comes first. Verify the snippet and the first feedback loop before layering on stricter controls.
