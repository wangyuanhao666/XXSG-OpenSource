import { existsSync, readFileSync } from 'node:fs';

const source = readFileSync('sw.js', 'utf8');
const appShellMatch = source.match(/const APP_SHELL = \[([\s\S]*?)\];/);

if (!appShellMatch) {
  console.error('Could not find APP_SHELL in sw.js.');
  process.exit(1);
}

const entries = [...appShellMatch[1].matchAll(/['"](\.\/[^'"]*)['"]/g)]
  .map(match => match[1])
  .filter(entry => entry !== './');

const missing = [];
const forbidden = [];
for (const entry of entries) {
  const file = entry.replace(/^\.\//, '');
  if (!existsSync(file)) {
    missing.push(entry);
  }
  if (/debug-|diagnose-|fix-|quick-|trace-|cleanup-|\.backup|test-results|备份/.test(entry)) {
    forbidden.push(entry);
  }
}

if (!entries.includes('./manifest.json')) missing.push('APP_SHELL missing ./manifest.json');
if (!entries.includes('./partials/app-feature-views.html')) missing.push('APP_SHELL missing deferred feature views partial');
if (!entries.includes('./js/app-feature-view-loader.js')) missing.push('APP_SHELL missing feature view loader');

if (missing.length > 0 || forbidden.length > 0) {
  console.error('Service worker cache check failed:');
  missing.forEach(item => console.error(`- missing cache target: ${item}`));
  forbidden.forEach(item => console.error(`- forbidden cache target: ${item}`));
  process.exit(1);
}

console.log('Service worker cache check passed.');
