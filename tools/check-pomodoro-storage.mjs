import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('js/pomodoro-storage.js', 'utf8');
const store = new Map();
const context = {
  console,
  Math,
  Date,
  localStorage: {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    }
  },
  window: {}
};

vm.createContext(context);
vm.runInContext(source, context, {
  filename: 'js/pomodoro-storage.js'
});

const storage = context.window.PomodoroStorage;

if (!storage) {
  throw new Error('PomodoroStorage was not attached to window.');
}

storage.addSession({
  duration: 125,
  task: 'Deep work',
  date: '2026-05-29T10:00:00.000Z'
});

storage.addSession({
  duration: 0,
  task: 'Should be ignored'
});

const sessions = storage.getSessions();

if (sessions.length !== 1) {
  throw new Error(`Expected 1 valid session, got ${sessions.length}.`);
}

if (sessions[0].duration !== 125) {
  throw new Error(`Expected normalized duration 125, got ${sessions[0].duration}.`);
}

if (!sessions[0].id || !sessions[0].endTime || sessions[0].taskTitle !== 'Deep work') {
  throw new Error('Normalized session is missing required fields.');
}

console.log('Pomodoro storage check passed.');
