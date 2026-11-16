import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const values = {
    tasks_old: '[{"id":"one"}]',
    habitTrackerData: '[{"id":"habit"}]',
    countdownEvents: '[]',
    adminPassword: 'excluded',
    userSession: 'excluded',
    deepSeekApiKey: 'excluded',
    users: 'excluded'
};
const storage = new Proxy(values, {
    get(target, key) {
        if (key === 'getItem') return name => target[name] ?? null;
        if (key === 'setItem') return (name, value) => { target[name] = String(value); };
        return target[key];
    }
});
let request;
let schedule = { due: false };
let online = true;
let onlineHandler;
const errors = [];
const context = {
    window: { addEventListener(name, handler) { if (name === 'online') onlineHandler = handler; } },
    document: { hidden: false, addEventListener() {} },
    navigator: { get onLine() { return online; } },
    localStorage: storage,
    crypto: { randomUUID: () => 'browser-one' },
    location: { protocol: 'http:', hostname: 'localhost', port: '8080' },
    setInterval() {},
    fetch: async (url, options) => {
        if (url.endsWith('/schedule')) return { ok: true, json: async () => schedule };
        request = JSON.parse(options.body);
        return { ok: true, json: async () => ({ status: 'created', filename: 'saved.json' }) };
    },
    console: { info() {}, error(...args) { errors.push(args); } }
};
vm.runInNewContext(readFileSync(new URL('../js/monthly-local-backup.js', import.meta.url), 'utf8'), context);
const backup = context.window.XXSGMonthlyLocalBackup;
await backup.backup([], 'old');
assert.equal(request, undefined);
schedule = { due: true, period: '2026-11', scheduledFor: '2026-11-30', late: false, calendarVerified: true };
online = false;
await backup.backup([], 'old');
assert.equal(request, undefined, '离线时不应尝试写入备份');
assert.equal(errors.length, 0, '离线时不应报告服务器错误');
online = true;
await onlineHandler();
assert.equal(request.format, 'xxsg-full-local-v1');
assert.equal(request.browserId, 'browser-one');
assert.equal(request.period, '2026-11');
assert.deepEqual(Object.keys(request.entries).sort(), ['countdownEvents', 'habitTrackerData', 'tasks_old']);
assert.equal(request.entries.tasks_old, values.tasks_old);
assert.equal(backup.restore({ format: request.format, ownerId: 'old', entries: request.entries }, 'new'), 3);
assert.equal(values.tasks_new, values.tasks_old);
assert.equal(values.habitTrackerData, '[{"id":"habit"}]');
assert.throws(() => backup.restore({ format: request.format, entries: { adminPassword: 'bad' } }, 'new'));
console.log('Monthly local backup and full restore check passed.');
