import { gzipSync } from 'zlib';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const root = process.cwd();
const widgetPkg = JSON.parse(readFileSync(path.join(root, 'packages', 'widget', 'package.json'), 'utf8'));
const version = widgetPkg.version;
const distDir = path.join(root, 'packages', 'widget', 'dist');
const jsPath = path.join(distDir, `widget-${version}.js`);
const cssPath = path.join(distDir, `widget-${version}.css`);

const budgetJs = 20 * 1024; // 20KB gzipped
const budgetCss = 8 * 1024; // 8KB gzipped

function gzippedSize(p) {
  const raw = readFileSync(p);
  const gz = gzipSync(raw);
  return gz.length;
}

let ok = true;
if (existsSync(jsPath)) {
  const size = gzippedSize(jsPath);
  console.log(`Gzipped JS size: ${size} bytes (budget ${budgetJs})`);
  if (size > budgetJs) {
    console.error(`JS bundle exceeds gzipped budget: ${size} > ${budgetJs}`);
    ok = false;
  }
} else {
  console.warn('JS file not found:', jsPath);
}

if (existsSync(cssPath)) {
  const size = gzippedSize(cssPath);
  console.log(`Gzipped CSS size: ${size} bytes (budget ${budgetCss})`);
  if (size > budgetCss) {
    console.error(`CSS bundle exceeds gzipped budget: ${size} > ${budgetCss}`);
    ok = false;
  }
} else {
  console.warn('CSS file not found:', cssPath);
}

if (!ok) process.exit(1);

