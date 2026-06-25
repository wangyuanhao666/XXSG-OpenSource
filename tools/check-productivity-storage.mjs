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
const source = fs.readFileSync(path.join(process.cwd(), 'js/productivity-storage.js'), 'utf8');
vm.runInContext(source, context, { filename: 'js/productivity-storage.js' });

const api = context.window.ProductivityStorage;
if (!api) {
  throw new Error('ProductivityStorage was not attached to window.');
}

const templates = api.setTemplates('taskTemplates', [
  {
    name: '  Morning Plan ',
    priority: 99,
    tasks: [{ title: 'Plan day' }, { text: 'Review inbox' }, { title: '' }]
  },
  { name: '' },
  null
]);

if (templates.length !== 1) throw new Error('Templates should drop invalid entries.');
if (templates[0].name !== 'Morning Plan') throw new Error('Template name should be trimmed.');
if (templates[0].priority !== 4) throw new Error('Template priority should be clamped.');
if (templates[0].tasks.length !== 2) throw new Error('Template tasks should be normalized.');
if (api.getTemplates('taskTemplates')[0].tasks[0].completed !== false) {
  throw new Error('Template tasks should default completed to false.');
}

const reviews = api.setReviews('reviews', {
  'daily-2026-05-30': { type: 'daily', date: '2026-05-30T00:00:00.000Z', achievements: 'Done' },
  broken: null
});
if (Object.keys(reviews).length !== 1) throw new Error('Reviews should drop invalid records.');
if (api.getReviews('reviews')['daily-2026-05-30'].achievements !== 'Done') {
  throw new Error('Reviews should round-trip.');
}

const notificationSettings = api.setNotificationSettings('notificationSettings', {
  enabled: false,
  sound: false,
  vibration: true,
  advanceTime: 9999,
  showOverdue: false
});
if (notificationSettings.enabled !== false) throw new Error('Notification enabled should be preserved.');
if (notificationSettings.sound !== false) throw new Error('Notification sound should be preserved.');
if (notificationSettings.advanceTime !== 1440) throw new Error('Notification advanceTime should be clamped.');
if (notificationSettings.showOverdue !== false) throw new Error('Notification showOverdue should be preserved.');

storage.set('bad', '{');
if (api.getTemplates('bad').length !== 0) throw new Error('Broken template JSON should fall back.');

console.log('Productivity storage check passed.');
