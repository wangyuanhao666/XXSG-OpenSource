import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const store = new Map();
const context = {
  console: { ...console, warn() {} },
  Date,
  JSON,
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); }
  },
  sessionStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  },
  window: {}
};

vm.createContext(context);
for (const file of ['js/user-storage.js', 'js/session-storage.js', 'js/settings-storage.js', 'js/data-sync-storage.js']) {
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), file), 'utf8'), context, { filename: file });
}

const api = context.window.DataSyncStorage;
if (!api) throw new Error('DataSyncStorage was not attached to window.');

const normalized = api.normalizeImportData({
  users: [{ username: 'alice', password: 'secret' }],
  userSession: { user: { username: 'alice', password: 'secret' } },
  settings: { language: 'en' }
});
if (normalized.users.length !== 1) throw new Error('Import users were not normalized.');
if (normalized.userSession.user.password) throw new Error('Import session was not sanitized.');

api.applyImportData(normalized);
if (!store.has('users')) throw new Error('Import users were not written.');
if (api.readStorageSnapshot().settings.language !== 'en') throw new Error('Snapshot did not preserve settings.');
api.setRaw('sample', 'value');
if (api.getRaw('sample') !== 'value') throw new Error('Raw storage round-trip failed.');
if (api.getSessionRaw('sample') !== 'value') throw new Error('Session raw lookup should include local storage.');
api.removeRaw('sample');
if (api.getRaw('sample') !== null) throw new Error('Raw storage removal failed.');

console.log('Data sync storage check passed.');
