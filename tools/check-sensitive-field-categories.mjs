import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PATTERNS = [
  { label: 'password-text', pattern: /\bpassword\b/gi, maxPageRisk: 75 },
  { label: 'api-key-text', pattern: /\bapiKey\b|\bapi_key\b|\bAPI Key\b/gi, maxPageRisk: 20 },
  { label: 'token-text', pattern: /\btoken\b/gi, maxPageRisk: 0 }
];

const STORAGE_BOUNDARY_FILE_PATTERN = /^js\/(?:admin|ai-assistant|calendar-event|data-sync|pomodoro|productivity|session|settings|task|time-tracker|user)-storage\.js$/;
const SECURITY_BOUNDARY_FILE_PATTERN = /^(?:js\/(?:ai-core|fortune-core|safe-logger|session-storage|admin-storage|data-sync-storage)\.js|src\/core\/(?:security|storage-utils|data-manager)\.js|src\/features\/ai\/ai-service\.js)$/;
const COPY_STYLE_FILE_PATTERN = /(?:^|\/)(?:css\/|.*\.css$|help(?:-en)?\.html$|forgot-password\.html$|i18n-auto\.js$)/;
const COMPATIBLE_FIELD_PATTERN = /deepSeekApiKey|adminPassword|aiConfig|userSession|app_session|accessToken|refreshToken|Authorization|Bearer|setSecure|getSecure|secureGetApiKey|secureSaveApiKey|input type=["']password["']|type=\\"password\\"|serviceConfig\??\.apiKey|dataset\.credential|apiKey:\s*serviceCredential/i;

function normalizePath(file) {
  return file.replaceAll('\\', '/');
}

function classifySensitiveHit(file, line, label) {
  const normalized = normalizePath(file);

  if (COPY_STYLE_FILE_PATTERN.test(normalized) || /type=["']password["']|autocomplete=["'](?:current|new)-password["']|<label|placeholder|class=|\.password/i.test(line)) {
    return 'copy-style';
  }

  if (normalized === 'permission-debug.html') {
    return 'boundary-compatible';
  }

  if (label === 'api-key-text' && !/\bapiKey\b|\bapi_key\b/.test(line)) {
    return 'copy-style';
  }

  if (label === 'password-text' && /forgot-password|change-admin-password|password-strength|password-error|querySelector|document\.getElementById|addEventListener|<form/i.test(line)) {
    return 'copy-style';
  }

  if (STORAGE_BOUNDARY_FILE_PATTERN.test(normalized) || SECURITY_BOUNDARY_FILE_PATTERN.test(normalized) || COMPATIBLE_FIELD_PATTERN.test(line)) {
    return 'boundary-compatible';
  }

  if (label === 'api-key-text' && /_services|serviceConfig\??\.apiKey|dataset\.(?:apiKey|credential)|aiConfig\[serviceName\]\.apiKey|setAPIKey|testAIServiceKey|encryptApiKey|decryptApiKey/.test(line)) {
    return 'boundary-compatible';
  }

  return 'page-risk';
}

const trackedFiles = execFileSync('git', ['ls-files', '*.js', '*.css', '*.html'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map(file => file.trim())
  .filter(Boolean)
  .filter(file => !file.startsWith('tools/'));

const totals = new Map(PATTERNS.map(item => [item.label, 0]));
const hotspots = new Map(PATTERNS.map(item => [item.label, []]));

for (const file of trackedFiles) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);

  for (const risk of PATTERNS) {
    let fileCount = 0;
    for (const line of lines) {
      const count = [...line.matchAll(risk.pattern)].length;
      if (count === 0) continue;
      if (classifySensitiveHit(file, line, risk.label) === 'page-risk') {
        fileCount += count;
      }
    }
    if (fileCount > 0) {
      totals.set(risk.label, totals.get(risk.label) + fileCount);
      hotspots.get(risk.label).push({ file, count: fileCount });
    }
  }
}

const failures = [];
for (const risk of PATTERNS) {
  const count = totals.get(risk.label);
  if (count > risk.maxPageRisk) {
    failures.push(`${risk.label}: ${count} page-risk hits (max ${risk.maxPageRisk})`);
  }
}

if (failures.length > 0) {
  console.error('Sensitive page-risk field threshold exceeded:');
  failures.forEach(item => console.error(`- ${item}`));
  for (const [label, files] of hotspots) {
    if (files.length === 0) continue;
    const topFiles = files.sort((a, b) => b.count - a.count).slice(0, 5);
    console.error(`- ${label} hotspots: ${topFiles.map(item => `${item.file} (${item.count})`).join(', ')}`);
  }
  process.exit(1);
}

console.log('Sensitive field category check passed.');
