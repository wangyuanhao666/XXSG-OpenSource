import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['js', 'src'];
const BLOCKED_PATTERNS = [
  {
    label: 'direct-new-credential-object-write',
    pattern: /password\s*:\s*(?:newCredential|editedCredential|password|credential)\b/g
  },
  {
    label: 'direct-new-credential-assignment',
    pattern: /\.password\s*=\s*(?:newCredential|editedCredential|password|credential)\b/g
  },
  {
    label: 'direct-admin-password-write',
    pattern: /setAdminPassword\s*\(\s*(?:newCredential|password|credential)\s*\)/g
  }
];

const ALLOWLIST = [
  'tools/check-credential-writes.mjs'
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (!entry.isFile() || !entry.name.endsWith('.js')) return [];
    return [fullPath];
  });
}

const findings = [];

for (const dir of TARGET_DIRS) {
  for (const filePath of walk(path.join(ROOT, dir))) {
    const rel = path.relative(ROOT, filePath).replaceAll(path.sep, '/');
    if (ALLOWLIST.includes(rel)) continue;

    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split(/\r?\n/);

    for (const { label, pattern } of BLOCKED_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text))) {
        const lineNo = text.slice(0, match.index).split(/\r?\n/).length;
        findings.push({
          file: rel,
          line: lineNo,
          label,
          code: lines[lineNo - 1]?.trim() || match[0]
        });
      }
    }
  }
}

if (findings.length) {
  console.error('Unsafe credential write candidates found.');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.label}] ${finding.code}`);
  }
  console.error('Use the project password hashing helper before writing user/admin credentials.');
  process.exit(1);
}

console.log('Credential write check passed.');
