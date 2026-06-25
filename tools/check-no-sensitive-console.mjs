import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const trackedFiles = execFileSync('git', ['ls-files', '*.js', '*.html'], { encoding: 'utf8' })
  .split(/\r?\n/)
  .map(file => file.trim())
  .filter(Boolean)
  .filter(file => !file.startsWith('tools/'));

const consolePattern = /\b(?:console|SafeLogger)\.(?:log|info|warn|error|debug)\s*\((.*)/i;
const riskyArgumentPattern = /apiKey\s*:|password\s*:|token\s*:|!!apiKey|Boolean\(apiKey\)|cleanApiKey|errorText|taskText\b|currentUser\s*[,)]|sessionData\s*[,)]|\bresponse\s*[,)]|keyPreview|keyLength|Bearer\s+\$\{|Authorization/i;

const findings = [];

for (const file of trackedFiles) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const match = line.match(consolePattern);
    if (match && riskyArgumentPattern.test(match[1])) {
      findings.push(`${file}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (findings.length > 0) {
  console.error('Sensitive console output candidates found:');
  findings.slice(0, 80).forEach(item => console.error(`- ${item}`));
  if (findings.length > 80) console.error(`...and ${findings.length - 80} more`);
  process.exit(1);
}

console.log('No sensitive console output candidates found.');
