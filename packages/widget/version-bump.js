#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const versionType = args[0]; // 'minor' or 'major'

if (!versionType || !['minor', 'major'].includes(versionType)) {
  console.log('Usage: node version-bump.js [minor|major]');
  console.log('');
  console.log('Examples:');
  console.log('  node version-bump.js minor  # 1.0 -> 1.1 (new features)');
  console.log('  node version-bump.js major  # 1.0 -> 2.0 (breaking changes)');
  process.exit(1);
}

// Read current package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

// Parse current version
const [major, minor] = currentVersion.split('.').map(Number);

// Calculate new version
let newVersion;
if (versionType === 'minor') {
  newVersion = `${major}.${minor + 1}`;
} else if (versionType === 'major') {
  newVersion = `${major + 1}.0`;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// Update dashboard version constant
const dashboardPath = path.join(
  __dirname,
  '../dashboard/src/app/(dashboard)/projects/[id]/page.tsx'
);
let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

dashboardContent = dashboardContent.replace(
  /const WIDGET_VERSION = '[^']+'/, 
  `const WIDGET_VERSION = '${newVersion}'`
);
fs.writeFileSync(dashboardPath, dashboardContent);

console.log(`🚀 Version bumped: ${currentVersion} -> ${newVersion}`);
console.log('');
console.log('Next steps:');
console.log('1. npm run build');
console.log(`2. git add -A && git commit -m "Release widget v${newVersion}"`);
console.log('3. git push origin main');

