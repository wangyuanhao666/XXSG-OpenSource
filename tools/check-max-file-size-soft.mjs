import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';

const limits = [
  { pattern: /\.js$/, maxKb: 650 },
  { pattern: /\.css$/, maxKb: 360 },
  { pattern: /\.html$/, maxKb: 320 }
];

const files = execFileSync('git', ['ls-files', '*.js', '*.css', '*.html'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map(file => file.trim())
  .filter(Boolean);

const warnings = [];

for (const file of files) {
  const limit = limits.find(item => item.pattern.test(file));
  if (!limit) continue;
  const sizeKb = statSync(file).size / 1024;
  if (sizeKb > limit.maxKb) {
    warnings.push(`${file}: ${sizeKb.toFixed(1)} KB (soft target <= ${limit.maxKb} KB)`);
  }
}

if (warnings.length > 0) {
  console.warn('Soft file size warnings:');
  warnings.forEach(item => console.warn(`- ${item}`));
} else {
  console.log('Soft file size check passed.');
}
