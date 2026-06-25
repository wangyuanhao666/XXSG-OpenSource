import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('js/task-storage.js', 'utf8');
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
  filename: 'js/task-storage.js'
});

const storage = context.window.TaskStorage;

if (!storage) {
  throw new Error('TaskStorage was not attached to window.');
}

const normalized = storage.normalizeTask({
  title: '  Important work  ',
  priority: '2',
  completed: 0,
  pinned: 1,
  subtasks: [{ title: 'Subtask', completed: true }]
});

if (!normalized.id || normalized.title !== 'Important work') {
  throw new Error('Task normalization did not preserve the expected title/id.');
}

if (normalized.priority !== 2 || normalized.completed !== false || normalized.pinned !== true) {
  throw new Error('Task normalization did not coerce primitive fields correctly.');
}

if (normalized.subtasks.length !== 1 || !normalized.subtasks[0].id) {
  throw new Error('Subtask normalization failed.');
}

const saved = storage.setTasks('tasks_test', [normalized, null, { title: '' }]);
const loaded = storage.getTasks('tasks_test');

if (saved.length !== 2 || loaded.length !== 2) {
  throw new Error(`Expected 2 normalized tasks, got saved=${saved.length}, loaded=${loaded.length}.`);
}

const firstAvailable = storage.loadFirstAvailable(['missing_key', 'tasks_test']);
if (firstAvailable.key !== 'tasks_test' || firstAvailable.tasks.length !== 2) {
  throw new Error('loadFirstAvailable did not return the expected storage key/tasks.');
}

if (!storage.backup('tasks_test') || !store.has('tasks_test_backup_time')) {
  throw new Error('Task backup failed.');
}

console.log('Task storage check passed.');
