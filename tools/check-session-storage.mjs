import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const local = new Map();
const session = new Map();
function storageApi(store) {
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); }
  };
}

const context = {
  console: { ...console, warn() {} },
  JSON,
  localStorage: storageApi(local),
  sessionStorage: storageApi(session),
  window: {}
};

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'js/session-storage.js'), 'utf8'), context);

const api = context.window.SessionStorage;
if (!api) throw new Error('SessionStorage was not attached to window.');

const saved = api.setSession({
  user: { username: 'alice', password: 'secret', accessToken: 'tok' },
  password: 'secret'
});
if (saved.password || saved.user.password || saved.user.accessToken) throw new Error('Session was not sanitized.');
if (!local.has('userSession') || session.has('userSession')) throw new Error('Remembered session should be in localStorage only.');
if (api.getCurrentUser().username !== 'alice') throw new Error('Current user lookup failed.');

local.set('app_session', JSON.stringify({ user: { username: 'bob', password: 'x' } }));
api.migrateStoredSessions();
if (JSON.parse(local.get('app_session')).user.password) throw new Error('Stored session migration did not remove password.');

api.clearSessions();
if (local.has('userSession') || local.has('app_session')) throw new Error('Session clear failed.');

console.log('Session storage check passed.');
