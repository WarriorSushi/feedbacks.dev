# Launch creative system and production briefs

## Creative rule

Real product proof wins. Use actual production screenshots and screen recordings for every claim about setup, widget behavior, context, triage, and updates. The generated mascot artwork is a supporting brand layer, never a substitute for product proof.

Visual system:

- warm white background;
- charcoal/near-black product surfaces;
- controlled neon green only for active paths and key actions;
- crisp sans-serif type from the product brand;
- short, factual headlines;
- no fake testimonials, fake metrics, fake dashboard UI, or unreadable code walls;
- add text in the design tool/HTML compositor, not inside generated imagery.

## Ready campaign artwork

### Install to context - landscape

File: `packages/dashboard/public/launch/install-to-context-landscape.png`

Use: X/link preview, Product Hunt gallery support slide, blog header, 16:9 video end card.

Composition: mascot installs the feedback connection on the right; clear copy space on the left.

Recommended overlay:

```text
One snippet.
Useful context.

Start free - no card.
```

Keep the overlay inside the left 42% of the canvas. Use near-black copy; use green only for a small rule or CTA pill. Export 1600×900 PNG/JPEG under 5 MB.

### Collect, decide, ship - vertical

File: `packages/dashboard/public/launch/collect-decide-ship-vertical.png`

Use: LinkedIn/Meta 4:5, Instagram feed, vertical Product Hunt gallery crop.

Recommended overlay:

```text
COLLECT
DECIDE
SHIP
```

Place the words as external labels aligned to the three physical stations only if they remain readable. For paid ads, use the shorter headline `Close the feedback loop` in the negative-space area. Export 1440×1800 for X/Meta 4:5 and 1080×1350 for Instagram feed.

## Required real product captures

Capture after the final production deploy with a clean demonstration account. Use realistic but non-sensitive data and never show secrets, personal emails, access tokens, billing identifiers, or another customer's information.

1. **Install proof (desktop, 16:9):** project install screen with the one-snippet path and verification state. Mask the publishable key anyway to avoid copy confusion.
2. **Widget proof (desktop + mobile):** widget open on a small demo SaaS page with a concise problem report and optional screenshot control.
3. **Context proof (desktop, 16:9):** received feedback detail showing safe demo page/browser context.
4. **Triage proof (desktop, 16:9):** inbox with 5–7 realistic reports, filters, statuses, and tags.
5. **Close-loop proof (desktop + mobile):** a published product update and its public rendering.
6. **Free-plan proof (square):** pricing card showing two projects, 500 feedback/month, 30 days, and no card.

Use the same demo product and narrative across every capture:

- product: `Northstar Notes` (fictional);
- report: `The export button stays disabled after I rename a workspace.`;
- page: `/settings/export`;
- status path: New → In progress → Closed;
- update: `Export now refreshes after workspace changes.`

## Product Hunt gallery (six slides)

| Slide | Headline | Visual | Supporting line |
| ---: | --- | --- | --- |
| 1 | `From feedback to the next shipped update` | Landscape mascot + small real widget crop | `A developer-first loop, installed in minutes.` |
| 2 | `Install one lightweight snippet` | Real install/verify capture | `Under 20 KB gzip. Async. Configuration stays remote.` |
| 3 | `Receive context you can act on` | Widget → real feedback detail | `Page, browser context, and optional screenshots.` |
| 4 | `Triage without building a process empire` | Real inbox | `Status, tags, filters, and focused detail.` |
| 5 | `Route important work` | Webhook/API/MCP docs + destination icons | `Fit the workflow you already use.` |
| 6 | `Close the loop` | Real product update | `Free: 2 projects, 500 feedback/month, no card.` |

No slide gets more than one headline and one supporting sentence. The product must remain legible on a phone.

## Video 1 - ten-minute install, compressed to 20 seconds

Purpose: primary organic launch proof and Product Hunt demo teaser.

Format: record 1920×1080 at 60 fps; export 1080p, 20 seconds, captions burned in, sound optional. Also crop/re-stage to 1080×1350 and 1080×1920. Never speed the cursor so much that the action becomes untrustworthy.

| Time | Shot | On-screen caption | Voiceover |
| --- | --- | --- | --- |
| 0–2s | Live demo app without widget | `A working feedback loop in minutes.` | `Add feedback without adding a project.` |
| 2–6s | Create project with defaults | `1. Create a project` | `Create a project.` |
| 6–10s | Copy snippet and paste before `</body>` | `2. Paste one async snippet` | `Paste one lightweight snippet.` |
| 10–13s | Deploy/refresh and verify success | `3. Verify the live install` | `Verify it on the real app.` |
| 13–17s | Open widget and submit demo report | `4. Send one real test report` | `Send a report as a user.` |
| 17–20s | Inbox detail appears with context | `First feedback received.` | `Now the loop works.` |

End card: `feedbacks.dev - Start free. No card.` with the real wordmark, not AI-rendered text.

## Video 2 - feedback to fix in 30 seconds

Purpose: explain the whole product after the install hook.

| Time | Shot | Caption/voiceover |
| --- | --- | --- |
| 0–4s | User finds disabled export button | `A user hits a problem.` |
| 4–9s | Widget report and optional screenshot | `They explain it without leaving the product.` |
| 9–14s | Feedback detail with page/browser context | `The report arrives with useful context.` |
| 14–19s | Status changes to In progress; webhook event visible in demo receiver | `The team triages and routes the important item.` |
| 19–25s | Code/change represented by neutral transition; do not fake GitHub actions | `The fix ships.` |
| 25–30s | Public product update | `The user can see what changed. Collect. Decide. Ship.` |

Use only real product screens. If the external destination is not configured in the demo environment, stop at the verified webhook delivery record rather than fabricating another tool's interface.

## Video 3 - triage proof in 15 seconds

Purpose: paid social creative after organic activation is proven.

| Time | Shot | Caption |
| --- | --- | --- |
| 0–3s | Three scattered message mockups (email/DM/form, generic and unbranded) | `Feedback is everywhere.` |
| 3–7s | Real inbox with filters | `Put useful reports in one clean queue.` |
| 7–11s | Feedback detail and context | `Keep the context needed to act.` |
| 11–15s | Update published | `Close the loop. Start free.` |

No voiceover required. Use a calm click/transition sound at low volume and full captions for silent autoplay.

## Screenshot and video safety checklist

- Use a dedicated demo workspace and fictional records.
- Clear browser autofill, bookmarks, extensions, and notifications.
- Hide production admin panels, environment variables, keys, request headers, and internal URLs.
- Keep the cursor visible and deliberate.
- Caption every spoken line and maintain readable contrast.
- Do not imply that optional context is collected without notice.
- Show “Free” and limits accurately; never say unlimited when describing Free.
- Re-capture if the UI changes; campaign proof must match production.

## Channel export matrix

| Channel | Primary dimensions | Asset |
| --- | --- | --- |
| X organic image | 1600×900 or 1440×1800 | landscape or vertical campaign art |
| X paid | 800×418, 800×800, or 1440×1800 | install proof; under 5 MB |
| LinkedIn image/document | 1200×1500 / PDF carousel | checklist or vertical art |
| Instagram/Facebook feed | 1080×1350 | vertical art + real UI carousel |
| Stories/Reels | 1080×1920 | restaged 15-second clip, not blind crop |
| Product Hunt thumbnail | 240×240 | existing product mark on warm white |
| Product Hunt gallery | 1270×760 recommended working canvas | six-slide real proof set |
| Blog/DEV header | 1600×900 | landscape campaign art |

Platform specifications may change; verify them at export time. X's current official specs support PNG/JPEG under 5 MB and 4:5 at 1440×1800: [X creative specs](https://business.x.com/en/help/campaign-setup/creative-ad-specifications).
