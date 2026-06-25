import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const store = new Map();
const context = {
  console: { ...console, warn() {} },
  Math,
  Date,
  JSON,
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); }
  },
  window: {}
};

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'js/user-storage.js'), 'utf8'), context);

const api = context.window.UserStorage;
if (!api) throw new Error('UserStorage was not attached to window.');

store.set('users', '{bad');
if (api.getUsers().length !== 0) throw new Error('Bad JSON should fall back to empty users.');

const saved = api.setUsers([
  { username: ' alice ', role: 'vip', permissions: ['add-task', 'add-task', 'calendar'] },
  { username: 'Alice', role: 'normal' },
  { username: '', role: 'normal' },
  { username: 'admin', role: 'admin' }
]);

if (saved.length !== 2) throw new Error(`Expected duplicate/invalid users to be removed, got ${saved.length}.`);
if (saved[0].username !== 'alice' || saved[0].permissions.length !== 2) throw new Error('User normalization failed.');
if (api.getRegularUsers().length !== 1) throw new Error('Admin users should be excluded from regular users.');

api.upsertUser({ username: 'Bob', role: 'bad' });
if (!api.findUserByUsername('bob')) throw new Error('User upsert/find failed.');

console.log('User storage check passed.');
