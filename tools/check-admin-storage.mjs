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
    setItem(key, value) { store.set(key, String(value)); }
  },
  window: {}
};

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'js/admin-storage.js'), 'utf8'), context);

const api = context.window.AdminStorage;
if (!api) throw new Error('AdminStorage was not attached to window.');

store.set('systemStats', '{bad');
if (api.getObject('systemStats', { ok: true }).ok !== true) throw new Error('Broken object JSON should fall back.');

api.setLogs([{ event: 'start', status: 'success', detail: 'ok' }], 'systemLogs', 1);
api.addLog({ event: 'next', status: 'success', detail: 'ok' }, 'systemLogs', 1);
if (api.getLogs().length !== 1 || api.getLogs()[0].event !== 'next') throw new Error('Log append/limit failed.');

api.addPasswordChangeLog({ action: 'password_changed', note: 'done' });
if (api.getPasswordChangeLog().length !== 1) throw new Error('Password change log failed.');

console.log('Admin storage check passed.');
