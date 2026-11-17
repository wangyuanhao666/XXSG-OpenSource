import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'design/time-train/journey-prototype.js'), 'utf8');
function renderAt(day) {
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) elements.set(id, {
      textContent: '', value: '', style: {}, dataset: {},
      classList: { add() {}, remove() {} },
      setAttribute() {}, addEventListener() {}, showModal() {}, close() {}
    });
    return elements.get(id);
  };
  const anchor = new Date(Date.UTC(2026, 10, 17 - day)).toISOString().slice(0, 10);
  const values = new Map([['time-train.preview.start-day.v1', anchor]]);
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : ['2026-11-17T12:00:00Z'])); }
  }
  const window = { setInterval() {} };
  window.parent = window;
  vm.runInNewContext(source, {
    window, Date: FixedDate, URLSearchParams, URL, Image: class {},
    location: { search: '?preview-only' },
    document: { documentElement: { classList: { add() {} } }, getElementById: element },
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  });
  return {
    name: element('ticket-name').textContent,
    kicker: element('ticket-kicker').textContent,
    route: element('route-future').textContent,
    origin: element('route-origin').textContent,
    background: element('journey-window').style.backgroundImage
  };
}

assert.equal(renderAt(0).name, '杭州东');
assert.equal(renderAt(8).name, '黄山北');
assert.equal(renderAt(8).route, '下一程 · 明日从杭州东出发');
assert.equal(renderAt(9).name, '杭州东');
assert.match(renderAt(9).kicker, /第 2 程/);
assert.equal(renderAt(9).origin, '新一程 · 今日始发');
assert.equal(renderAt(17).name, '黄山北');
assert.match(renderAt(18).kicker, /第 3 程/);
assert.match(renderAt(0).background, /hangzhou-east\.webp/);
console.log('Time Train station and journey rotation passed.');
