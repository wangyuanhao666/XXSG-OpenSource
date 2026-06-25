import fs from 'node:fs';

const checkedFiles = [
  'calendar-sync-tasks.js',
  'index.html',
  'js/habit-tracker-app.js',
  'js/task-decomposition-system.js',
  'js/task-template-system.js',
  'js/time-tracker-system.js',
  'js/smart-reminder-system.js',
  'js/smart-schedule-system.js',
  'js/smart-health-system.js'
];

const failures = [];

for (const file of checkedFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const matches = source
    .split(/\r?\n/)
    .filter(line => /<[^>]*\son[a-z]+\s*=/i.test(line));
  if (matches.length > 0) {
    failures.push({ file, count: matches.length });
  }
}

if (failures.length > 0) {
  console.error('Inline event handlers are not allowed in migrated modules:');
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.count}`);
  }
  process.exit(1);
}

console.log('No inline event handlers found in migrated modules.');
