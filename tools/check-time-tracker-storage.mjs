import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const storage = new Map();
const context = {
  console: { ...console, warn() {} },
  Date,
  Math,
  Number,
  Boolean,
  String,
  JSON,
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    }
  },
  window: {}
};

vm.createContext(context);
const source = fs.readFileSync(path.join(process.cwd(), 'js/time-tracker-storage.js'), 'utf8');
vm.runInContext(source, context, { filename: 'js/time-tracker-storage.js' });

const api = context.window.TimeTrackerStorage;
if (!api) {
  throw new Error('TimeTrackerStorage was not attached to window.');
}

const records = api.setRecords([
  { name: '  Deep work ', categoryId: 'work', hours: 20, minutes: 90, date: '2026-05-30' },
  { name: '' },
  null
]);

if (records.length !== 1) throw new Error('Records should drop invalid entries.');
if (records[0].name !== 'Deep work') throw new Error('Record name should be trimmed.');
if (records[0].hours !== 18) throw new Error('Record hours should be clamped.');
if (records[0].minutes !== 59) throw new Error('Record minutes should be clamped.');

const categories = api.setCategories([
  { name: '  Work ', color: '#111827' },
  { id: 'bad', name: '' }
]);

if (categories.length !== 1) throw new Error('Categories should drop invalid entries.');
if (categories[0].name !== 'Work') throw new Error('Category name should be trimmed.');
if (!categories[0].icon) throw new Error('Category should receive a fallback icon.');

const goals = api.setGoals([
  { name: '  Reading ', hours: 0, categoryId: 'study' },
  { name: '' }
]);

if (goals.length !== 1) throw new Error('Goals should drop invalid entries.');
if (goals[0].hours !== 0.25) throw new Error('Goal hours should be clamped.');

storage.set('broken', '{');
if (api.getRecords('broken').length !== 0) throw new Error('Broken record JSON should fall back.');

console.log('Time tracker storage check passed.');
