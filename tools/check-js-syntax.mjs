import { execFileSync } from 'node:child_process';

const trackedFiles = execFileSync('git', ['ls-files', '*.js'], {
  encoding: 'utf8'
})
  .split(/\r?\n/)
  .map(file => file.trim())
  .filter(Boolean);

const failed = [];

for (const file of trackedFiles) {
  try {
    execFileSync(process.execPath, ['--check', file], {
      stdio: 'pipe'
    });
  } catch (error) {
    failed.push(file);
    const output = [
      error.stdout?.toString(),
      error.stderr?.toString()
    ].filter(Boolean).join('\n');
    console.error(`\nSyntax check failed: ${file}`);
    console.error(output.trim());
  }
}

if (failed.length > 0) {
  console.error(`\n${failed.length} JavaScript file(s) failed syntax check.`);
  process.exit(1);
}

console.log(`Checked ${trackedFiles.length} JavaScript file(s).`);
