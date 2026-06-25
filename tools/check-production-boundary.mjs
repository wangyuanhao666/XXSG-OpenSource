import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const riskyProductionPatterns = [
  /^debug-/i,
  /^diagnose-/i,
  /^fix-/i,
  /^quick-/i,
  /^trace-/i,
  /^cleanup-/i,
  /^simple-test/i,
  /^verify-/i,
  /^one-click-fix/i,
  /^permanent-fix/i,
  /^direct-save-/i,
  /^force-save-/i,
  /^save-from-input/i,
  /^check-admin\.js$/i,
  /\.backup\d*$/i,
  /^style_temp\.css$/i,
  /^test-results\//i,
  /^logs\//i,
  /^\u5907\u4efd/i
];

const requiredIgnorePatterns = [
  'debug-*.js',
  'diagnose-*.js',
  'fix-*.js',
  'fix-*.ps1',
  'quick-*.js',
  'trace-*.js',
  'cleanup-*.bat',
  'api-server.js',
  'api-examples.js',
  'auto-sync-setup.html',
  'enable-api-sync.html',
  'export-tasks-api.html',
  'permission-debug.html',
  'view_comparison.html',
  'test-results/',
  'logs/',
  '*.backup',
  '\u5907\u4efd*/'
];

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map(file => file.trim())
  .filter(Boolean);

const allowedTracked = new Set([
  'permission-debug.html',
  'quick_fix.html',
  'tools/check-admin-storage.mjs',
  'js/backup-recovery-core.js'
]);

const ignoreSource = existsSync('.vercelignore') ? readFileSync('.vercelignore', 'utf8') : '';

function patternToRegex(pattern) {
  let normalized = pattern.trim().replaceAll('\\', '/');
  if (!normalized || normalized.startsWith('#')) return null;
  if (normalized.endsWith('/')) normalized += '**';
  const escaped = normalized
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLE_STAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLE_STAR::/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

const ignoreRegexes = ignoreSource
  .split(/\r?\n/)
  .map(patternToRegex)
  .filter(Boolean);

function isVercelIgnored(file) {
  const normalized = file.replaceAll('\\', '/');
  return ignoreRegexes.some(pattern => pattern.test(normalized));
}

const riskyTracked = trackedFiles
  .filter(file => riskyProductionPatterns.some(pattern => pattern.test(file)))
  .filter(file => !allowedTracked.has(file))
  .filter(file => !isVercelIgnored(file));

const missingIgnorePatterns = requiredIgnorePatterns.filter(pattern => !ignoreSource.includes(pattern));

if (riskyTracked.length > 0 || missingIgnorePatterns.length > 0) {
  console.error('Production boundary check failed:');
  riskyTracked.forEach(file => console.error(`- risky tracked production candidate not covered by .vercelignore: ${file}`));
  missingIgnorePatterns.forEach(pattern => console.error(`- missing .vercelignore pattern: ${pattern}`));
  process.exit(1);
}

console.log('Production boundary check passed.');
