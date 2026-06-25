import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const storage = new Map();
const context = {
  console: {
    ...console,
    warn() {}
  },
  Number,
  Boolean,
  JSON,
  RegExp,
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
const source = fs.readFileSync(path.join(process.cwd(), 'js/settings-storage.js'), 'utf8');
vm.runInContext(source, context, { filename: 'js/settings-storage.js' });

const api = context.window.SettingsStorage;
if (!api) {
  throw new Error('SettingsStorage was not attached to window.');
}

api.setString('language', 'en', 'zh', ['zh', 'en']);
if (api.getString('language', 'zh', ['zh', 'en']) !== 'en') {
  throw new Error('String setting round-trip failed.');
}

api.setString('language', 'fr', 'zh', ['zh', 'en']);
if (api.getString('language', 'zh', ['zh', 'en']) !== 'zh') {
  throw new Error('String setting allow-list fallback failed.');
}

api.setBoolean('autoSave', false);
if (api.getBoolean('autoSave', true) !== false) {
  throw new Error('Boolean setting round-trip failed.');
}

storage.set('reminderSettings', JSON.stringify({
  workloadThreshold: 9,
  fatigueThreshold: -2,
  workIntensityInterval: 1,
  enableNotifications: false
}));
const reminderSettings = api.getReminderSettings();
if (reminderSettings.workloadThreshold !== 1) throw new Error('Reminder workload threshold should be clamped.');
if (reminderSettings.fatigueThreshold !== 0) throw new Error('Reminder fatigue threshold should be clamped.');
if (reminderSettings.workIntensityInterval !== 60000) throw new Error('Reminder interval should be clamped.');
if (reminderSettings.enableNotifications !== false) throw new Error('Reminder boolean should be preserved.');

const scheduleSettings = api.setScheduleSettings({
  workStartTime: 'bad',
  workEndTime: '19:30',
  bufferTime: 999,
  taskPreference: 'unknown',
  reminderAdvance: 1
});
if (scheduleSettings.workStartTime !== '09:00') throw new Error('Invalid schedule time should fall back.');
if (scheduleSettings.workEndTime !== '19:30') throw new Error('Valid schedule time should be preserved.');
if (scheduleSettings.bufferTime !== 120) throw new Error('Schedule buffer should be clamped.');
if (scheduleSettings.taskPreference !== 'balanced') throw new Error('Schedule preference should fall back.');
if (scheduleSettings.reminderAdvance !== 5) throw new Error('Reminder advance should be clamped.');

storage.set('badObject', '{');
const fallback = api.getObject('badObject', { ok: true });
if (fallback.ok !== true) throw new Error('Broken JSON should fall back.');

console.log('Settings storage check passed.');
