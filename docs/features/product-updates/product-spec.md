# Product Specification: Product Updates / What's New

## 1. Product definition

Product Updates lets a developer announce shipped changes inside their own application using the `feedbacks.dev` widget already installed there.

The owner-facing dashboard calls the feature **Product Updates**. The visitor-facing dialog uses **What's New**.

Example:

> v2.4
>
> Faster exports are here
>
> Large exports now finish in the background, show progress, and notify you when the file is ready.
>
> - Export up to 10x more records
> - Leave the page while an export runs
> - Download completed exports for seven days
>
> [Try the new export]

## 2. Problem

Small SaaS teams ship improvements frequently but struggle to tell active users what changed.

Common alternatives are weak:

- a changelog page users never visit;
- an email campaign for every small release;
- a hand-built modal that becomes permanent maintenance work;
- a third-party product that requires another script and dashboard;
- a large notification system designed for enterprise marketing teams.

`feedbacks.dev` already has the project, widget, theme, installation, and developer workflow needed to solve this with a smaller surface.

## 3. Jobs to be done

### Project owner

When I ship a meaningful improvement, I want to publish a concise, attractive update without deploying another modal, so active users understand the value of what changed.

### End user

When the product I use changes, I want one clear explanation of what is new without being interrupted repeatedly or tracked across the internet.

## 4. Product principles

- Inform, do not market-spam.
- One useful update is better than a carousel of promotions.
- Publishing should take under three minutes.
- The owner should see a faithful preview before publishing.
- End users should see an update once automatically, not on every visit.
- Accessibility and safe rendering are mandatory.
- The base feedback workflow must remain fast and reliable.
- Remote updates should work after one initial enablement in the widget configuration.

## 5. Terminology

| Term | Meaning |
| --- | --- |
| Product Update | One owner-authored release announcement record. |
| What's New | The end-user dialog displaying a Product Update. |
| Live | Published, publication time reached, and not expired or archived. |
| Scheduled | Status is published but `published_at` is in the future. |
| Seen | The update stayed visible for at least 750 ms, its CTA was clicked, or the user explicitly dismissed it. |
| Dismissed | The user closed the update without clicking the CTA. |
| Manual trigger | Host-page element matching `[data-feedbacks-updates-trigger]`. |

## 6. Owner experience

### 6.1 Entry point

Add **Updates** to the project workspace menu between **Public Board** and **API**.

Route:

```text
/projects/:projectId?tab=updates
```

Do not add a new global sidebar destination in the MVP. Updates belong to a selected project.

### 6.2 Empty state

The empty state must explain the outcome before showing configuration:

Title:

> Tell users what just shipped

Body:

> Publish a short update and show it once inside your product through the widget you already installed.

Primary action:

> Create first update

Secondary action:

> Enable in install settings

If `enableUpdates` is false, show an installation warning with a direct link to the Customize tab. Do not pretend a published update can appear until the runtime is enabled.

### 6.3 Update list

List updates newest first. Each row shows:

- version label, if present;
- title;
- state badge: Draft, Scheduled, Live, Expired, or Archived;
- publication time;
- impressions;
- CTA clicks and click-through rate when a CTA exists;
- overflow menu: Archive/Restore and Delete.

Primary page action:

> New update

### 6.4 Editor

The editor is a two-column desktop layout and a stacked mobile layout.

Left side:

- content fields;
- publication controls;
- optional image upload;
- validation;
- save/publish actions.

Right side:

- sticky preview;
- desktop/mobile preview switch;
- light/dark preview switch when project theme is Auto.

Fields and limits:

| Field | Required | Limit | Notes |
| --- | --- | --- | --- |
| Version label | No | 32 characters | Examples: `v2.4`, `July update`. |
| Title | Yes | 120 characters | Must be specific and useful. |
| Summary | Yes | 280 characters | One short paragraph. |
| Highlights | No | 8 items, 160 characters each | Reorderable plain-text list. |
| Image | No | One image, 2 MB | JPEG, PNG, or WebP. |
| CTA label | No | 40 characters | Required when CTA URL is present. |
| CTA URL | No | 2,048 characters | Relative path or HTTP(S) URL. |
| Publish time | Yes when publishing | Timestamp | Immediate on Free; immediate or future on Pro. |
| Expiry time | No | Timestamp | Must be later than publication. |

Actions:

- **Save draft** - never makes content public.
- **Publish now** - validates all publish requirements and sets `published_at` to now.
- **Schedule** - Pro only; sets `published_at` in the future.
- **Update live post** - edits the live record without marking it unseen again.
- **Archive** - makes it ineligible at the origin immediately; a client or CDN with a cached response may retain it for up to 60 seconds.

Editing the title or body of an existing live update must not reset visitor seen state because seen state is keyed by update ID.

The image control is disabled until the first valid draft save returns an update ID. The MVP does not include Duplicate or Publish as new actions; an owner uses **New update** when the change should be unseen.

The editor displays publication and expiry in the owner's browser timezone and sends ISO 8601 UTC timestamps to the API. The server clock is authoritative for immediate publication and live eligibility.

### 6.5 Settings

Project-level settings appear above or beside the update list, not in the generic project Settings tab.

| Setting | Default | Bounds |
| --- | --- | --- |
| Enable Product Updates | Off | Must also be enabled in installed runtime config. |
| Automatically show newest unseen update | On | Can be disabled for manual-trigger-only use. |
| Display delay | 1,500 ms | 0–30,000 ms. |
| Theme | Auto | Auto, Light, or Dark. |
| Accent color | Existing widget primary color | Valid 3/6-digit hex. |
| Included path prefixes | Empty | Up to 10, meaning all paths. |
| Excluded path prefixes | Empty | Up to 10; exclusions win. |
| Show feedbacks.dev branding | On | Locked on for Free; optional on Pro. |

Paths are pathname prefixes, not regular expressions. Examples:

```text
/app
/dashboard
/settings
```

An exclusion such as `/auth` wins over an inclusion such as `/`.

## 7. End-user experience

### 7.1 Eligibility

An update is eligible when all conditions are true:

- widget runtime has `enableUpdates: true`;
- project Product Updates settings are enabled;
- update status is `published`;
- `published_at <= now`;
- `expires_at` is null or later than now;
- current pathname passes include/exclude settings;
- update ID is not already seen in local state;
- no What's New dialog is already open;
- feedback dialog is not open;
- the page is visible;
- this page load has not already auto-shown another update.

### 7.2 Selection

Fetch at most the latest 20 live updates. For automatic display, select the newest eligible unseen update by `published_at DESC, id DESC`.

Never automatically display multiple updates in sequence.

### 7.3 Timing

Start the configured delay after:

- DOM content is ready;
- the update request has succeeded;
- the page is visible.

If the feedback dialog is open when the delay finishes, wait until it closes. Do not interrupt an active feedback submission.

### 7.4 Modal layout

The centered modal contains, in order:

1. Close button
2. Optional image
3. Version badge or “What’s New” eyebrow
4. Title
5. Summary
6. Highlights list
7. Optional CTA button
8. Optional “Powered by feedbacks.dev” line

Desktop:

- maximum width 520 px;
- maximum height `min(720px, calc(100vh - 48px))`;
- scroll only inside content when necessary;
- centered with backdrop.

Mobile:

- 16 px viewport gutter;
- maximum height `calc(100dvh - 32px)`;
- CTA is full width;
- image ratio is 16:9 with `object-fit: cover`;
- no horizontal overflow.

### 7.5 Accessibility

- Use `role="dialog"` and `aria-modal="true"`.
- Associate title and summary using `aria-labelledby` and `aria-describedby`.
- Move focus to the close button or dialog on open.
- Trap Tab and Shift+Tab within the dialog.
- Escape closes the dialog.
- Restore focus to the prior element on close.
- Lock background scroll while open and restore the previous body style exactly.
- Close button has at least a 44 x 44 px target on mobile.
- Derived colors must meet WCAG AA contrast.
- Disable nonessential movement for `prefers-reduced-motion: reduce`.
- Do not announce the entire update repeatedly through an aggressive live region.

### 7.6 Manual trigger

Any host element with this attribute opens the newest live update:

```html
<button data-feedbacks-updates-trigger type="button">What's new</button>
```

If no live update exists, clicking the trigger does nothing and emits a debug log only when widget debug mode is enabled.

The widget class also exposes:

```ts
widget.openUpdates()
widget.closeUpdates()
widget.getUnreadUpdateCount()
```

Manual open may show a previously seen update. Automatic open may not.

## 8. Seen state and privacy

Storage key:

```text
feedbacks:product-updates:v1:<project-key-suffix>
```

For this storage key, `<project-key-suffix>` is the last 12 characters of the browser-safe project key. Never put the full key in localStorage metadata or browser events. A project-key rotation intentionally starts a new local namespace, so the newest live update may appear once again after rotation.

Stored value:

```json
{
  "seen": {
    "update-uuid": "2026-07-18T10:30:00.000Z"
  },
  "dismissed": {
    "update-uuid": "2026-07-18T10:30:04.000Z"
  }
}
```

Rules:

- keep at most 100 update IDs;
- remove oldest entries when pruning;
- catch all storage access errors;
- use in-memory state when localStorage is unavailable;
- do not use cookies;
- do not attempt cross-device synchronization;
- do not store project user identifiers or page URLs.

Mark an update seen after it is visibly open for 750 ms, immediately when its CTA is clicked, or immediately when the user explicitly closes it. A close also records the dismissed timestamp. Widget teardown before 750 ms does not mark the update seen unless the user explicitly closed it.

## 9. Analytics

The owner receives approximate daily aggregate counts:

- `impression` - dialog became visible;
- `dismissal` - user closed without CTA click;
- `cta_click` - CTA was activated.

Do not store raw viewer-event rows.

Derived dashboard values:

- total impressions;
- total dismissals;
- total CTA clicks;
- CTA click-through rate: clicks / impressions;
- dismissal rate: dismissals / impressions.

Metrics are directional, not billing-grade analytics. Ad blockers, storage restrictions, offline use, and network failure may reduce counts.

## 10. Plan behavior

Recommended launch entitlements:

| Capability | Free | Pro |
| --- | --- | --- |
| Product Updates | Yes | Yes |
| Concurrent live updates | 3 | Unlimited |
| Publish immediately | Yes | Yes |
| Schedule future publication | No | Yes |
| Accent color and theme | Yes | Yes |
| Remove feedbacks.dev branding | No | Yes |
| Metrics history | 7 days | 90 days |

“Concurrent live” means status is published, `published_at <= now`, and the update is not expired or archived. Drafts and future scheduled records do not count.

Limits must be checked in publish/schedule APIs. The UI may explain limits but is not the security boundary.

## 11. Error and edge behavior

- Update request failure must never break feedback collection.
- Image failure renders the update without an image.
- Metrics failure is silent unless debug mode is on.
- Invalid CTA URL prevents publishing.
- Relative CTA paths resolve against the host application origin.
- External CTAs open in a new tab with `noopener noreferrer`.
- Same-origin CTAs use the current tab by default.
- If two widget instances use the same project, only one may own Product Updates behavior.
- If multiple projects with Product Updates are embedded, each maintains separate state and overlays must still be mutually exclusive.
- If an update expires while already open, it may remain open until dismissed; it must not appear on the next fetch.
- Browser back/forward navigation in an SPA must re-evaluate path targeting without auto-showing a second update during the same page-view cycle.

## 12. Success criteria

Initial product success is demonstrated when:

- a new owner can publish their first update in under three minutes;
- an enabled project can publish later updates without changing application code;
- at least 95% of valid public update fetches complete successfully;
- update failures do not reduce feedback submission success;
- less than 5% of E2E runs show timing-related popup failures;
- dogfood users report that frequency feels informative rather than intrusive;
- at least three beta projects publish more than one update.

## 13. Explicitly deferred

Do not add these while implementing the MVP:

- toast and banner layouts;
- user/account targeting;
- locale variants;
- translations;
- reactions or comments;
- GitHub release import;
- email subscriptions;
- AI generation;
- public standalone changelog pages;
- board-announcement synchronization;
- per-user server analytics;
- custom fonts or arbitrary CSS.
