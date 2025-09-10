# Feedbacks Widget CDN Installation

## Quick Start

Add this script tag to your HTML:

```html
<!-- Load from Professional CDN (recommended) -->
<script src="https://app.feedbacks.dev/cdn/widget/1.0.0.js"></script>
<link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/1.0.0.css">

<!-- Alternative: Stable version (auto bug fixes) -->
<script src="https://app.feedbacks.dev/cdn/widget/1.0.js"></script>
<link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/1.0.css">
```

## Usage Examples

### 1. Inline Embed
```html
<div id="feedback-widget"></div>
<script>
  FeedbacksWidget.init({
    apiKey: 'your-api-key',
    containerId: 'feedback-widget',
    mode: 'inline'
  });
</script>
```

### 2. Trigger Button
```html
<button id="feedback-btn">Give Feedback</button>
<script>
  FeedbacksWidget.init({
    apiKey: 'your-api-key',
    triggerId: 'feedback-btn',
    mode: 'modal'
  });
</script>
```

### 3. Floating Button (Auto-trigger)
```html
<script>
  FeedbacksWidget.init({
    apiKey: 'your-api-key',
    mode: 'floating'
  });
</script>
```

## Configuration Options

```javascript
FeedbacksWidget.init({
  apiKey: 'your-api-key',           // Required: Your project API key
  mode: 'inline',                   // Required: 'inline', 'modal', or 'floating'
  containerId: 'feedback-widget',   // Required for inline mode
  triggerId: 'feedback-btn',        // Required for modal mode
  apiUrl: 'https://your-domain.com/api/feedback', // Optional: Custom API endpoint
  theme: 'auto'                     // Optional: 'light', 'dark', or 'auto'
});
```

## CDN Information

- **Professional CDN**: https://app.feedbacks.dev/cdn/widget/
- **Documentation**: https://app.feedbacks.dev/cdn/widget (API reference)

Files available:
- `1.0.0.js` - Exact version (never changes, most stable)
- `1.0.js` - Stable branch (auto bug fixes, stable features)  
- `latest.js` - Latest features (may have breaking changes)
- Matching `.css` files for all versions

## Version

Current version: 1.0.0

**Smart Versioning:**
- Exact versions are cached forever (immutable)
- Pattern versions get latest compatible updates
- Professional caching for global performance