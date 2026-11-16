import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../js/task-decomposition-system.js', import.meta.url), 'utf8');
const modalCode = source.slice(
    source.indexOf('function showTaskDecompositionModal()'),
    source.indexOf('// 选择任务进行分解')
);
const labelCode = source.slice(
    source.indexOf('function getQuadrantLabel(quadrant)'),
    source.indexOf('// 获取子任务图标')
);

function element() {
    return {
        className: '', dataset: {}, children: [],
        append(...children) { this.children.push(...children); },
        appendChild(child) { this.children.push(child); },
        addEventListener(type, handler) { this.listeners ??= {}; this.listeners[type] = handler; },
        querySelector(selector) { return selector === '#decomposition-task-list' ? this.taskList : null; },
        contains(target) { return target === this.closeButton || this.taskList.children.includes(target); },
        remove() { this.removed = true; }
    };
}

let modal;
const document = {
    createElement: element,
    body: { appendChild(node) { modal = node; } },
    querySelector(selector) { return selector === '.task-decomposition-modal' ? modal : null; }
};
const context = vm.createContext({
    console: { log() {} }, document,
    getCurrentTasks: () => [{ text: '测试任务', priority: 'high' }],
    getQuadrantFromPriority: () => 'urgent-important',
    renderSafeModuleMarkup(node) { node.taskList = element(); node.closeButton = element(); },
    showNotification() {}, selectTaskForDecomposition() {}
});
vm.runInContext(`${modalCode}\n${labelCode}`, context);
vm.runInContext('showTaskDecompositionModal()', context);

assert.equal(modal.taskList.children.length, 1, '有任务时应渲染可选任务');
assert.equal(modal.taskList.children[0].children[1].textContent, '重要且紧急');
assert.equal(typeof modal.listeners?.click, 'function', '打开弹窗后应绑定关闭事件');
const closeButton = modal.closeButton;
closeButton.dataset.decompositionAction = 'close-modal';
closeButton.closest = () => closeButton;
modal.listeners.click({ target: closeButton });
assert.equal(modal.removed, true, '点击关闭按钮应移除弹窗');
console.log('任务分解弹窗：渲染、象限标签和关闭按钮检查通过');
