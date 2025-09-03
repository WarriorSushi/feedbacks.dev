# Feedbacks Widget CDN Installation

## Quick Start

Add this script tag to your HTML:

```html
<!-- Load from jsDelivr CDN (recommended) -->
<script src="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-1.0.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/widget-1.0.css">

<!-- Alternative: Load from GitHub Raw -->
<script src="https://raw.githubusercontent.com/WarriorSushi/feedbacks.dev/main/packages/widget/dist/widget-1.0.js"></script>
<link rel="stylesheet" href="https://raw.githubusercontent.com/WarriorSushi/feedbacks.dev/main/packages/widget/dist/widget-1.0.css">
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

- **jsDelivr CDN**: https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist/
- **GitHub Raw**: https://raw.githubusercontent.com/WarriorSushi/feedbacks.dev/main/packages/widget/dist/

Files available:
- `widget-1.0.js` - Main widget JavaScript (minified)
- `widget-1.0.css` - Widget styles  
- `widget.d.ts` - TypeScript definitions
- `types.d.ts` - Type definitions

## Version

Current version: 1.0

The CDN files are automatically updated when changes are pushed to the main branch.