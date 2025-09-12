# Feedbacks Widget CDN Installation

## Quick Start (Auto‑init, easiest)

Add this script + CSS and set data attributes on the script tag. The widget auto‑initializes:

```html
<!-- Load from CDN (choose a version) -->
<script 
  src="https://app.feedbacks.dev/cdn/widget/latest.js"
  data-project="your_project_api_key"
  data-embed-mode="modal"             
  data-position="bottom-right"
  defer>
</script>
<link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/latest.css">
```

Data attributes (all optional except `data-project`):
- `data-project`: your project API key
- `data-embed-mode`: `modal` | `inline` | `trigger`
- `data-position`: `bottom-right` | `bottom-left` | `top-right` | `top-left` (modal only)
- `data-target`: CSS selector for inline container or trigger button (inline/trigger)
- `data-button-text`: custom text for floating button (modal)
- `data-color`: primary color (e.g., `#3b82f6`)
- `data-debug`: present to enable console logs
 - `data-require-email`: require email input
 - `data-enable-type` / `data-enable-rating`: disable with `false`
- `data-enable-screenshot`: enable screenshot capture (optional)
- `data-screenshot-required`: make screenshot required
- `data-enable-priority`: show priority field
- `data-enable-tags`: show tags field (comma separated)
- `data-enable-attachment`: allow a single attachment (optional)
- `data-attachment-maxmb`: number (e.g., 5) to cap attachment size

## Manual Init (full control)

```html
<script src="https://app.feedbacks.dev/cdn/widget/1.0.js"></script>
<link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/1.0.css">

<!-- Inline example -->
<div id="feedback-widget"></div>
<script>
  new FeedbacksWidget({
    projectKey: 'your_project_api_key',
    embedMode: 'inline',
    target: '#feedback-widget',
    // Optional
    // position: 'bottom-right',
    // buttonText: 'Feedback',
    // primaryColor: '#3b82f6',
    // apiUrl: 'https://your-domain.com/api/feedback',
  });
  
  // Other modes:
  // new FeedbacksWidget({ projectKey: '...', embedMode: 'modal', position: 'bottom-right' });
  // new FeedbacksWidget({ projectKey: '...', embedMode: 'trigger', target: '#feedback-btn' });
  
</script>
```

## CDN Info

- Base: https://app.feedbacks.dev/cdn/widget/
- Files:
  - `1.0.0.js` (immutable)
  - `1.0.js` (stable, auto bug fixes)
  - `latest.js` (latest features)
  - Matching `.css` files for all

Versioning practices:
- Pin exact versions for stability; use `1.0.js` for safe updates; `latest.js` for newest features.
