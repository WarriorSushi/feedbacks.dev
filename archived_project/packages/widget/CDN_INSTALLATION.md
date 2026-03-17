# Feedbacks Widget CDN Installation

## Quick Start

```html
<script src="https://app.feedbacks.dev/cdn/widget/latest.js" data-project="feedbacks_dev_api_key_abc123" defer></script>
```

## Advanced Examples

### Floating modal

```html
<link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/latest.css">
<script src="https://app.feedbacks.dev/cdn/widget/latest.js"></script>
<script>
  new FeedbacksWidget({
    projectKey: 'feedbacks_dev_api_key_abc123',
    embedMode: 'modal',
    buttonText: 'Feedback'
  });
</script>
```

### Inline embed

```html
<link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/latest.css">
<script src="https://app.feedbacks.dev/cdn/widget/latest.js"></script>
<div id="feedback-widget"></div>
<script>
  new FeedbacksWidget({
    projectKey: 'feedbacks_dev_api_key_abc123',
    embedMode: 'inline',
    target: '#feedback-widget'
  });
</script>
```

### Attach to an existing button

```html
<link rel="stylesheet" href="https://app.feedbacks.dev/cdn/widget/latest.css">
<script src="https://app.feedbacks.dev/cdn/widget/latest.js"></script>
<button id="feedback-btn">Give Feedback</button>
<script>
  new FeedbacksWidget({
    projectKey: 'feedbacks_dev_api_key_abc123',
    embedMode: 'trigger',
    target: '#feedback-btn'
  });
</script>
```

## Version aliases

- Exact: `https://app.feedbacks.dev/cdn/widget/1.1.0.js`
- Minor: `https://app.feedbacks.dev/cdn/widget/1.1.js`
- Major: `https://app.feedbacks.dev/cdn/widget/1.js`
- Latest: `https://app.feedbacks.dev/cdn/widget/latest.js`

Current version: 1.1.0
