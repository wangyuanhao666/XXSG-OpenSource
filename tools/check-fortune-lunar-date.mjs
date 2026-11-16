import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('js/fortune-core.js', 'utf8');
const start = source.indexOf('    getLunarDate(date,');
const end = source.indexOf('    checkTodayStatus()', start);
assert.ok(start >= 0 && end > start, 'Fortune lunar date method must exist');

const context = { currentLanguage: 'zh', Intl };
vm.createContext(context);
const fortune = vm.runInContext(`({${source.slice(start, end)}})`, context);
const localDate = value => new Date(`${value}T12:00:00`);

assert.equal(fortune.getLunarDate(localDate('2026-02-17')), '农历正月初一');
assert.equal(fortune.getLunarDate(localDate('2026-11-10')), '农历十月初二');
assert.equal(fortune.getLunarDate(localDate('2025-07-25')), '农历闰六月初一');
assert.equal(fortune.getLunarDate(localDate('2025-12-31')), '农历冬月十二');

context.currentLanguage = 'en';
assert.equal(fortune.getLunarDate(localDate('2026-11-10')), 'Lunar Tenth Month 2');

console.log('Fortune lunar date check passed.');
