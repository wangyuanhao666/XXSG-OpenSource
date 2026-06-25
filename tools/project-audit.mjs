import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const FILE_SIZE_LIMITS = [
  { pattern: /\.js$/, maxKb: 250 },
  { pattern: /\.css$/, maxKb: 160 },
  { pattern: /\.html$/, maxKb: 180 }
];

const PRODUCTION_EXCLUDED_CANDIDATE_PATTERN = /^(?:debug-|diagnose-|fix-|quick-|trace-|cleanup-|simple-test|verify-|one-click-fix|permanent-fix|direct-save-|force-save-|save-from-input|check-admin\.js)|(?:\.backup\d*|style_temp\.css)$|^(?:test-results\/|logs\/|备份)/i;

const RISK_PATTERNS = [
  { label: 'innerHTML', pattern: /\binnerHTML\b/g },
  { label: 'insertAdjacentHTML', pattern: /\binsertAdjacentHTML\b/g },
  { label: 'inline-onclick', pattern: /\bonclick\s*=/g },
  { label: 'inline-event-attr', pattern: /<[^>\n]*\son[a-z]+\s*=/gi },
  { label: 'localStorage', pattern: /\blocalStorage\b/g, splitStorageBoundary: true },
  { label: 'sensitive-console', pattern: /\b(?:console|SafeLogger)\.(?:log|info|warn|error|debug)\s*\([^;\n]*(?:apiKey\s*:|password\s*:|token\s*:|!!apiKey|Boolean\(apiKey\)|cleanApiKey|errorText|taskText\b|currentUser\s*[,)]|sessionData\s*[,)]|\bresponse\s*[,)]|keyPreview|keyLength|Bearer\s+\$\{|Authorization)/gi },
  { label: 'password-text', pattern: /\bpassword\b/gi },
  { label: 'api-key-text', pattern: /\bapiKey\b|\bapi_key\b|\bAPI Key\b/gi },
  { label: 'token-text', pattern: /\btoken\b/gi }
];

const STORAGE_BOUNDARY_FILE_PATTERN = /^js\/(?:admin|ai-assistant|calendar-event|data-sync|pomodoro|productivity|session|settings|task|time-tracker|user)-storage\.js$/;
const SENSITIVE_LABELS = new Set(['password-text', 'api-key-text', 'token-text']);
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

function gitFiles(glob) {
  return execFileSync('git', ['ls-files', glob], { encoding: 'utf8' })
    .split(/\r?\n/)
    .map(file => file.trim())
    .filter(Boolean);
}

const trackedFiles = [
  ...gitFiles('*.js'),
  ...gitFiles('*.css'),
  ...gitFiles('*.html')
];
const allTrackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map(file => file.trim())
  .filter(Boolean);

const oversized = [];
const riskCounts = new Map();
const storageBoundaryCounts = new Map();
const riskFileCounts = new Map();
const sensitiveCategoryCounts = new Map();
const sensitiveCategoryFileCounts = new Map();
const inlineStyleCounts = [];
const inlineStyleCategoryCounts = new Map();
const productionExcludedCandidates = allTrackedFiles
  .filter(file => PRODUCTION_EXCLUDED_CANDIDATE_PATTERN.test(normalizePath(file)))
  .sort();

for (const file of trackedFiles) {
  const sizeKb = statSync(file).size / 1024;
  const limit = FILE_SIZE_LIMITS.find(item => item.pattern.test(file));
  if (limit && sizeKb > limit.maxKb) {
    oversized.push({
      file,
      sizeKb: Math.round(sizeKb * 10) / 10,
      maxKb: limit.maxKb
    });
  }

  const source = readFileSync(file, 'utf8');
  const htmlInlineStyles = [...source.matchAll(/\sstyle\s*=/gi)].length;
  const cssVariableInlineStyles = [...source.matchAll(/\sstyle\s*=\s*["']\s*--/gi)].length;
  const staticHtmlInlineStyles = htmlInlineStyles - cssVariableInlineStyles;
  const cssTextWrites = [...source.matchAll(/\.style\.cssText\s*=/g)].length;
  const cssVariableWrites = [...source.matchAll(/\.style\.setProperty\s*\(\s*['"]--/g)].length;
  const stylePropertyWrites = [...source.matchAll(/\.style\.(?!cssText\b|setProperty\b)[a-zA-Z]/g)].length;

  if (htmlInlineStyles > 0 || cssTextWrites > 0 || stylePropertyWrites > 0 || cssVariableWrites > 0) {
    inlineStyleCounts.push({
      file,
      count: staticHtmlInlineStyles + cssTextWrites + stylePropertyWrites,
      htmlInlineStyles,
      staticHtmlInlineStyles,
      cssVariableInlineStyles,
      cssTextWrites,
      stylePropertyWrites,
      cssVariableWrites
    });
    const categoryAdds = [
      ['html-style-static', staticHtmlInlineStyles],
      ['html-style-css-var', cssVariableInlineStyles],
      ['js-style-cssText', cssTextWrites],
      ['js-style-property', stylePropertyWrites],
      ['js-style-css-var', cssVariableWrites]
    ];
    for (const [category, count] of categoryAdds) {
      if (count > 0) {
        inlineStyleCategoryCounts.set(category, (inlineStyleCategoryCounts.get(category) || 0) + count);
      }
    }
  }

  const lines = source.split(/\r?\n/);
  for (const risk of RISK_PATTERNS) {
    const matches = [...source.matchAll(risk.pattern)];
    const count = matches.length;
    if (count > 0) {
      if (!riskFileCounts.has(risk.label)) {
        riskFileCounts.set(risk.label, []);
      }
      riskFileCounts.get(risk.label).push({ file, count });

      if (SENSITIVE_LABELS.has(risk.label)) {
        const categoryFileCounts = new Map();
        for (const line of lines) {
          const lineCount = [...line.matchAll(risk.pattern)].length;
          if (lineCount === 0) continue;
          const category = classifySensitiveHit(file, line, risk.label);
          const key = `${risk.label}:${category}`;
          sensitiveCategoryCounts.set(key, (sensitiveCategoryCounts.get(key) || 0) + lineCount);
          categoryFileCounts.set(category, (categoryFileCounts.get(category) || 0) + lineCount);
        }
        for (const [category, categoryCount] of categoryFileCounts) {
          const key = `${risk.label}:${category}`;
          if (!sensitiveCategoryFileCounts.has(key)) {
            sensitiveCategoryFileCounts.set(key, []);
          }
          sensitiveCategoryFileCounts.get(key).push({ file, count: categoryCount });
        }
      }

      if (risk.splitStorageBoundary && STORAGE_BOUNDARY_FILE_PATTERN.test(normalizePath(file))) {
        storageBoundaryCounts.set(risk.label, (storageBoundaryCounts.get(risk.label) || 0) + count);
      } else {
        riskCounts.set(risk.label, (riskCounts.get(risk.label) || 0) + count);
      }
    }
  }
}

console.log('Project audit summary');
console.log(`Tracked UI files: ${trackedFiles.length}`);

if (oversized.length > 0) {
  console.log('\nOversized files:');
  for (const item of oversized) {
    console.log(`- ${item.file}: ${item.sizeKb} KB (target <= ${item.maxKb} KB)`);
  }
} else {
  console.log('\nOversized files: none');
}

console.log('\nRisk pattern counts:');
for (const [label, count] of [...riskCounts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`- ${label}: ${count}`);
}

if (storageBoundaryCounts.size > 0) {
  console.log('\nCentralized storage boundary counts:');
  for (const [label, count] of [...storageBoundaryCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`- ${label}: ${count}`);
  }
}

if (sensitiveCategoryCounts.size > 0) {
  console.log('\nSensitive field categories:');
  for (const [key, count] of [...sensitiveCategoryCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`- ${key}: ${count}`);
  }
}

console.log('\nRisk hotspots by file:');
for (const [label, files] of [...riskFileCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const topFiles = [...files]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  console.log(`- ${label}: ${topFiles.map(item => `${item.file} (${item.count})`).join(', ')}`);
}

if (sensitiveCategoryFileCounts.size > 0) {
  console.log('\nSensitive category hotspots by file:');
  for (const [label, files] of [...sensitiveCategoryFileCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const topFiles = [...files]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    console.log(`- ${label}: ${topFiles.map(item => `${item.file} (${item.count})`).join(', ')}`);
  }
}

if (inlineStyleCounts.length > 0) {
  console.log('\nInline style categories:');
  for (const [category, count] of [...inlineStyleCategoryCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`- ${category}: ${count}`);
  }

  console.log('\nInline style hotspots by file:');
  for (const item of inlineStyleCounts.sort((a, b) => b.count - a.count).slice(0, 10)) {
    console.log(
      `- ${item.file}: risk ${item.count} ` +
      `(html-static ${item.staticHtmlInlineStyles}, css-var-attr ${item.cssVariableInlineStyles}, ` +
      `cssText ${item.cssTextWrites}, style-prop ${item.stylePropertyWrites}, css-var-js ${item.cssVariableWrites})`
    );
  }
}

if (productionExcludedCandidates.length > 0) {
  console.log('\nProduction excluded candidates tracked in git:');
  for (const file of productionExcludedCandidates.sort()) {
    console.log(`- ${file}`);
  }
}

if (oversized.length > 0) {
  process.exitCode = 0;
}
