import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const fields = {
    daily: [{ id: 'daily-achievements', value: '今天的记录', dataset: {} }],
    weekly: [{ id: 'weekly-goals', value: '本周的记录', dataset: {} }]
};
for (const textarea of Object.values(fields).flat()) {
    textarea.removeEventListener = () => {};
    textarea.addEventListener = () => {};
}
let status = '';
let writes = [];
const document = {
    getElementById(id) {
        if (id === 'review-save-status') return { set textContent(value) { status = value; }, dataset: {} };
        if (id === 'rating-display') return { textContent: '0/10' };
        const type = id.match(/^(daily|weekly)-review-template$/)?.[1];
        return type ? { querySelectorAll: () => fields[type] } : null;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; }
};
const context = vm.createContext({ document, window: {}, console: { log() {}, warn() {}, error() {} }, setTimeout, clearTimeout });
const source = readFileSync(new URL('../js/review-system-core.js', import.meta.url), 'utf8');
vm.runInContext(source, context);
const ReviewSystem = vm.runInContext('ReviewSystem', context);
const review = Object.create(ReviewSystem.prototype);
review.currentDate = new Date('2026-11-13T10:00:00');
review.currentType = 'daily';
review.reviews = {};
review.getReviewKey = function () { return `${this.currentType}-${this.currentDate.toISOString().slice(0, 10)}`; };
review.saveReviews = function () { writes.push(structuredClone(this.reviews)); return true; };
review.showMessage = () => {};
review.updateHistoryPreview = () => {};
review.updateDetailedHistoryView = () => {};
review.updateDateDisplay = () => {};
review.loadCurrentReview = () => {};
review.enableCustomResize = () => {};

review.scheduleAutoSave();
assert.match(status, /稍后自动保存/);
review.switchReviewType('weekly');
assert.equal(review.reviews['daily-2026-11-13'].achievements, '今天的记录');
assert.equal(review.reviews['daily-2026-11-13'].goalProgress, undefined);
assert.equal(writes.length, 1);

review.scheduleAutoSave();
review.navigateDate(-1);
assert.equal(review.reviews['weekly-2026-11-13'].goalProgress, '本周的记录');
assert.equal(review.reviews['weekly-2026-11-12'], undefined);
assert.equal(writes.length, 2);

review.saveReviews = () => false;
review.saveReview(true);
assert.match(status, /保存失败/);
clearTimeout(review.historyUpdateTimer);
console.log('Review autosave and context-switch checks passed.');
