#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const packageJson = require('./package.json');

const CDN_BASE_URL = 'https://app.feedbacks.dev/cdn/widget';
const version = packageJson.version;
const distPath = path.join(__dirname, 'dist');
const mainJsFile = `widget-${version}.js`;
const mainCssFile = `widget-${version}.css`;

function ensureDistAsset(fileName) {
  const filePath = path.join(distPath, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Expected build artifact not found: ${fileName}`);
  }
  return filePath;
}

function writeFile(relativePath, content) {
  fs.writeFileSync(path.join(__dirname, relativePath), content);
}

function buildInstallationGuide() {
  return `# Feedbacks Widget CDN Installation

## Quick Start

\`\`\`html
<script src="${CDN_BASE_URL}/latest.js" data-project="feedbacks_dev_api_key_abc123" defer></script>
\`\`\`

## Advanced Examples

### Floating modal

\`\`\`html
<link rel="stylesheet" href="${CDN_BASE_URL}/latest.css">
<script src="${CDN_BASE_URL}/latest.js"></script>
<script>
  new FeedbacksWidget({
    projectKey: 'feedbacks_dev_api_key_abc123',
    embedMode: 'modal',
    buttonText: 'Feedback'
  });
</script>
\`\`\`

### Inline embed

\`\`\`html
<link rel="stylesheet" href="${CDN_BASE_URL}/latest.css">
<script src="${CDN_BASE_URL}/latest.js"></script>
<div id="feedback-widget"></div>
<script>
  new FeedbacksWidget({
    projectKey: 'feedbacks_dev_api_key_abc123',
    embedMode: 'inline',
    target: '#feedback-widget'
  });
</script>
\`\`\`

### Attach to an existing button

\`\`\`html
<link rel="stylesheet" href="${CDN_BASE_URL}/latest.css">
<script src="${CDN_BASE_URL}/latest.js"></script>
<button id="feedback-btn">Give Feedback</button>
<script>
  new FeedbacksWidget({
    projectKey: 'feedbacks_dev_api_key_abc123',
    embedMode: 'trigger',
    target: '#feedback-btn'
  });
</script>
\`\`\`

## Version aliases

- Exact: \`${CDN_BASE_URL}/${version}.js\`
- Minor: \`${CDN_BASE_URL}/${version.split('.').slice(0, 2).join('.')}.js\`
- Major: \`${CDN_BASE_URL}/${version.split('.')[0]}.js\`
- Latest: \`${CDN_BASE_URL}/latest.js\`

Current version: ${version}
`;
}

function buildDemoHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feedbacks Widget CDN Demo</title>
  <link rel="stylesheet" href="${CDN_BASE_URL}/latest.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 860px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
    }
    .demo-section {
      margin: 2rem 0;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
    }
    .btn {
      background: #2563eb;
      color: white;
      border: 0;
      padding: 0.75rem 1rem;
      border-radius: 999px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h1>Feedbacks Widget CDN Demo</h1>
  <p>This page demonstrates inline, trigger, and modal widget modes.</p>

  <div class="demo-section">
    <h2>Inline Widget</h2>
    <div id="feedback-widget"></div>
  </div>

  <div class="demo-section">
    <h2>Trigger Button</h2>
    <button id="feedback-btn" class="btn">Open Feedback</button>
  </div>

  <script src="${CDN_BASE_URL}/latest.js"></script>
  <script>
    const projectKey = 'feedbacks_dev_api_key_demo123';

    new FeedbacksWidget({
      projectKey,
      embedMode: 'inline',
      target: '#feedback-widget'
    });

    new FeedbacksWidget({
      projectKey,
      embedMode: 'trigger',
      target: '#feedback-btn'
    });

    new FeedbacksWidget({
      projectKey,
      embedMode: 'modal',
      buttonText: 'Feedback'
    });
  </script>
</body>
</html>`;
}

function createCompatibilityCopies() {
  ensureDistAsset(mainJsFile);
  ensureDistAsset(mainCssFile);

  const jsAliases = [
    'widget.js',
    'widget-latest.js',
    `widget-${version.split('.').slice(0, 2).join('.')}.js`,
  ];

  const cssAliases = [
    'widget.css',
    'widget-latest.css',
    `widget-${version.split('.').slice(0, 2).join('.')}.css`,
  ];

  jsAliases.forEach((fileName) => {
    fs.copyFileSync(path.join(distPath, mainJsFile), path.join(distPath, fileName));
    console.log(`Created compatibility copy: ${fileName}`);
  });

  cssAliases.forEach((fileName) => {
    fs.copyFileSync(path.join(distPath, mainCssFile), path.join(distPath, fileName));
    console.log(`Created compatibility copy: ${fileName}`);
  });
}

writeFile('CDN_INSTALLATION.md', buildInstallationGuide());
writeFile(path.join('dist', 'demo.html'), buildDemoHtml());
createCompatibilityCopies();

console.log('CDN deployment files generated.');
console.log(`Base URL: ${CDN_BASE_URL}`);
console.log(`Version: ${version}`);
