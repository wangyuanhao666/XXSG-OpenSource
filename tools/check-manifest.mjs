import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const manifestPath = 'manifest.json';
const source = readFileSync(manifestPath, 'utf8');
const mojibakePattern = /璞|鍥|鐨|绛|馃|�/;

let manifest;
try {
  manifest = JSON.parse(source);
} catch (error) {
  console.error(`Manifest JSON is invalid: ${error.message}`);
  process.exit(1);
}

const requiredFields = [
  'name',
  'short_name',
  'description',
  'start_url',
  'scope',
  'display',
  'background_color',
  'theme_color',
  'icons'
];

const findings = [];
for (const field of requiredFields) {
  if (!manifest[field] || (Array.isArray(manifest[field]) && manifest[field].length === 0)) {
    findings.push(`missing required field: ${field}`);
  }
}

if (mojibakePattern.test(source)) {
  findings.push('manifest contains mojibake or replacement characters');
}

for (const icon of manifest.icons || []) {
  if (!icon.src || !existsSync(icon.src)) {
    findings.push(`missing icon file: ${icon.src || '(empty src)'}`);
  }
  if (!icon.sizes || !icon.type) {
    findings.push(`icon is missing sizes/type: ${icon.src || '(empty src)'}`);
  }
}

for (const shortcut of manifest.shortcuts || []) {
  if (!shortcut.name || !shortcut.url) {
    findings.push('shortcut is missing name/url');
  }
  for (const icon of shortcut.icons || []) {
    const iconPath = join(dirname(manifestPath), icon.src || '');
    if (!icon.src || !existsSync(iconPath)) {
      findings.push(`missing shortcut icon file: ${icon.src || '(empty src)'}`);
    }
  }
}

for (const screenshot of manifest.screenshots || []) {
  if (!screenshot.src || !existsSync(screenshot.src)) {
    findings.push(`missing screenshot file: ${screenshot.src || '(empty src)'}`);
  }
}

if (findings.length > 0) {
  console.error('Manifest check failed:');
  findings.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('Manifest check passed.');
