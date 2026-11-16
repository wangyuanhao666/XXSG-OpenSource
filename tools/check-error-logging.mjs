import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const values = new Map([['disableErrorNotifications', 'true']]);
const listeners = new Map();
const context = {
    console,
    Date,
    JSON,
    navigator: { userAgent: 'test' },
    location: { href: 'http://localhost:8080/index.html' },
    window: {
        location: { href: 'http://localhost:8080/index.html' },
        DataSyncStorage: {
            getRaw: key => values.get(key) ?? null,
            setRaw: (key, value) => values.set(key, value)
        },
        addEventListener: (name, listener) => listeners.set(name, [...(listeners.get(name) || []), listener])
    }
};
context.window.window = context.window;
runInNewContext(readFileSync(new URL('../js/backup-recovery-core.js', import.meta.url), 'utf8'), context);
context.logError = context.window.logError;
runInNewContext(readFileSync(new URL('../js/app-resilience-core.js', import.meta.url), 'utf8'), context);

context.initGlobalErrorHandling();
listeners.get('error')[0]({ message: 'Script error.', error: null, filename: 'app.js', lineno: 42, target: context.window });

const logs = JSON.parse(values.get('error_logs'));
assert.equal(logs.length, 1);
assert.equal(logs[0].message, 'Script error.');
assert.equal(logs[0].filename, 'app.js');
console.log('Global error logging handles events without an Error object.');
