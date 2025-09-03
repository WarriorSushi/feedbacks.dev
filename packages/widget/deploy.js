#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const packageJson = require('./package.json');

// Configuration for different CDN providers
const CDN_CONFIG = {
  jsdelivr: {
    baseUrl: 'https://cdn.jsdelivr.net/gh/WarriorSushi/feedbacks.dev@main/packages/widget/dist',
    name: 'jsDelivr'
  },
  github: {
    baseUrl: 'https://raw.githubusercontent.com/WarriorSushi/feedbacks.dev/main/packages/widget/dist',
    name: 'GitHub Raw'
  }
};

function generateInstallationCode() {
  const version = packageJson.version;
  const instructions = `
# Feedbacks Widget CDN Installation

## Quick Start

Add this script tag to your HTML:

\`\`\`html
<!-- Load from jsDelivr CDN (recommended) -->
<script src="${CDN_CONFIG.jsdelivr.baseUrl}/widget-${version}.js"></script>
<link rel="stylesheet" href="${CDN_CONFIG.jsdelivr.baseUrl}/widget-${version}.css">

<!-- Alternative: Load from GitHub Raw -->
<script src="${CDN_CONFIG.github.baseUrl}/widget-${version}.js"></script>
<link rel="stylesheet" href="${CDN_CONFIG.github.baseUrl}/widget-${version}.css">
\`\`\`

## Usage Examples

### 1. Inline Embed
\`\`\`html
<div id="feedback-widget"></div>
<script>
  FeedbacksWidget.init({
    apiKey: 'your-api-key',
    containerId: 'feedback-widget',
    mode: 'inline'
  });
</script>
\`\`\`

### 2. Trigger Button
\`\`\`html
<button id="feedback-btn">Give Feedback</button>
<script>
  FeedbacksWidget.init({
    apiKey: 'your-api-key',
    triggerId: 'feedback-btn',
    mode: 'modal'
  });
</script>
\`\`\`

### 3. Floating Button (Auto-trigger)
\`\`\`html
<script>
  FeedbacksWidget.init({
    apiKey: 'your-api-key',
    mode: 'floating'
  });
</script>
\`\`\`

## Configuration Options

\`\`\`javascript
FeedbacksWidget.init({
  apiKey: 'your-api-key',           // Required: Your project API key
  mode: 'inline',                   // Required: 'inline', 'modal', or 'floating'
  containerId: 'feedback-widget',   // Required for inline mode
  triggerId: 'feedback-btn',        // Required for modal mode
  apiUrl: 'https://your-domain.com/api/feedback', // Optional: Custom API endpoint
  theme: 'auto'                     // Optional: 'light', 'dark', or 'auto'
});
\`\`\`

## CDN Information

- **jsDelivr CDN**: ${CDN_CONFIG.jsdelivr.baseUrl}/
- **GitHub Raw**: ${CDN_CONFIG.github.baseUrl}/

Files available:
- \`widget-${version}.js\` - Main widget JavaScript (minified)
- \`widget-${version}.css\` - Widget styles  
- \`widget.d.ts\` - TypeScript definitions
- \`types.d.ts\` - Type definitions

## Version

Current version: ${version}

The CDN files are automatically updated when changes are pushed to the main branch.
`;

  return instructions.trim();
}

// Generate installation instructions
const instructions = generateInstallationCode();
fs.writeFileSync(path.join(__dirname, 'CDN_INSTALLATION.md'), instructions);

// Generate a simple index.html for CDN demo
const version = packageJson.version;
const demoHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedbacks Widget CDN Demo</title>
    <link rel="stylesheet" href="${CDN_CONFIG.jsdelivr.baseUrl}/widget-${version}.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
        }
        .demo-section {
            margin: 2rem 0;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        .demo-section h3 {
            margin-top: 0;
        }
        #feedback-widget {
            margin: 1rem 0;
        }
        .btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
        }
        .btn:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <h1>Feedbacks Widget CDN Demo</h1>
    <p>This page demonstrates the Feedbacks widget loaded from CDN.</p>
    
    <div class="demo-section">
        <h3>1. Inline Embed</h3>
        <p>Widget embedded directly in the page:</p>
        <div id="feedback-widget"></div>
    </div>
    
    <div class="demo-section">
        <h3>2. Modal Trigger</h3>
        <p>Click the button to open feedback modal:</p>
        <button id="feedback-btn" class="btn">Give Feedback</button>
    </div>
    
    <div class="demo-section">
        <h3>3. Floating Button</h3>
        <p>Floating button appears in bottom right corner (auto-loads on page).</p>
    </div>

    <script src="${CDN_CONFIG.jsdelivr.baseUrl}/widget-${version}.js"></script>
    <script>
        // Replace 'your-api-key' with your actual API key
        const API_KEY = 'pk_live_demo123'; // Demo key - replace with real one
        
        // Initialize inline widget
        FeedbacksWidget.init({
            apiKey: API_KEY,
            containerId: 'feedback-widget',
            mode: 'inline'
        });
        
        // Initialize modal trigger
        FeedbacksWidget.init({
            apiKey: API_KEY,
            triggerId: 'feedback-btn',
            mode: 'modal'
        });
        
        // Initialize floating button
        FeedbacksWidget.init({
            apiKey: API_KEY,
            mode: 'floating'
        });
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'dist', 'demo.html'), demoHtml);

console.log('✅ CDN deployment files generated:');
console.log('📄 CDN_INSTALLATION.md - Installation instructions');
console.log('📄 dist/demo.html - Live demo page');
console.log('');
console.log('🚀 CDN URLs:');
console.log(`📦 jsDelivr: ${CDN_CONFIG.jsdelivr.baseUrl}/`);
console.log(`📦 GitHub: ${CDN_CONFIG.github.baseUrl}/`);
console.log('');
console.log('Next steps:');
console.log('1. Commit and push these files to GitHub');
console.log('2. Files will be automatically available via CDN');
console.log('3. Share the installation instructions with users');