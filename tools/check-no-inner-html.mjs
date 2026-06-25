import fs from 'node:fs';

const checkedFiles = [
  'calendar-sync-tasks.js',
  'habit-tracker.js',
  'js/calendar-module.js',
  'js/habit-tracker-app.js',
  'js/task-template-system.js',
  'js/time-tracker-system.js',
  'permission-debug.html',
  'export.html',
  'restore-page.html',
  'script.js',
  'help.html',
  'js/notification-system.js',
  'src/core/formatter.js',
  'src/ui/chart.js',
  'src/ui/modal.js',
  'src/ui/ui-utils.js',
  'js/countdown-system.js',
  'js/smart-health-system.js',
  'js/smart-reminder-system.js',
  'js/smart-schedule-system.js',
  'js/task-decomposition-system.js',
  'admin.html',
  'login.html',
  'data-sync.html',
  'visualization-charts.js'
];

const failures = [];

for (const file of checkedFiles) {
  if (!fs.existsSync(file)) continue;
  const source = fs.readFileSync(file, 'utf8');
  const count = [...source.matchAll(/\b(?:innerHTML|insertAdjacentHTML)\b/g)].length;
  if (count > 0) {
    failures.push({ file, count });
  }
}

if (failures.length > 0) {
  console.error('HTML string insertion is not allowed in migrated rendering modules:');
  for (const failure of failures) {
    console.error(`- ${failure.file}: ${failure.count}`);
  }
  process.exit(1);
}

console.log('No HTML string insertion found in migrated rendering modules.');
