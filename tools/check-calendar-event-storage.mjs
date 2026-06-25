import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const storage = new Map();
const context = {
  console,
  Date,
  Math,
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
const source = fs.readFileSync(path.join(process.cwd(), 'js/calendar-event-storage.js'), 'utf8');
vm.runInContext(source, context, { filename: 'js/calendar-event-storage.js' });

const api = context.window.CalendarEventStorage;
if (!api) {
  throw new Error('CalendarEventStorage was not attached to window.');
}

const normalized = api.normalizeEvent({
  title: '  Planning  ',
  start: '2026-05-29T09:00:00.000Z',
  end: '2026-05-29T08:00:00.000Z',
  attendees: [' product ', '', null],
  calendar: '',
  color: ''
});

if (normalized.title !== 'Planning') throw new Error('Title should be trimmed.');
if (!(normalized.start instanceof Date)) throw new Error('Start should be a Date.');
if (!(normalized.end instanceof Date)) throw new Error('End should be a Date.');
if (normalized.end <= normalized.start) throw new Error('End should be repaired after start.');
if (normalized.attendees.length !== 1 || normalized.attendees[0] !== 'product') {
  throw new Error('Attendees should be normalized.');
}
if (normalized.calendar !== 'personal') throw new Error('Calendar fallback failed.');
if (normalized.color !== '#60a5fa') throw new Error('Color fallback failed.');

const serialized = api.serializeEvent(normalized);
if (typeof serialized.start !== 'string' || typeof serialized.end !== 'string') {
  throw new Error('Serialized dates should be ISO strings.');
}

api.setEvents('calendar-a', [normalized, null, { title: '', start: 'bad-date' }]);
const loaded = api.getEvents('calendar-a');
if (loaded.length !== 2) throw new Error('Saved events should round-trip with invalid items removed.');
if (!(loaded[0].start instanceof Date)) throw new Error('Loaded events should return runtime Date objects.');

api.setEvents('calendar-b', [{ id: 'shared', title: 'First' }]);
api.setEvents('calendar-c', [{ id: 'shared', title: 'Second' }, { id: 'unique', title: 'Unique' }]);
const merged = api.loadFromKeys(['calendar-b', 'calendar-c']);
if (merged.length !== 2) throw new Error('loadFromKeys should deduplicate by id.');
if (merged.find(event => event.id === 'shared')?.title !== 'First') {
  throw new Error('loadFromKeys should keep the first matching event.');
}

console.log('Calendar event storage check passed.');
