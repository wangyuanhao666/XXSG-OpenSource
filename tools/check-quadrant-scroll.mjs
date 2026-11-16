import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('script.js', 'utf8');
const functionStart = source.indexOf('function updateQuadrantScrollState(');
const functionEnd = source.indexOf('let quadrantScrollFrame', functionStart);

if (functionStart < 0 || functionEnd < 0) {
  throw new Error('Could not load updateQuadrantScrollState from script.js.');
}

const quadrantView = {
  classList: {
    contains(name) {
      return name === 'list-mode' && this.listMode;
    },
    listMode: false
  }
};

const context = {
  console: { log() {} },
  getComputedStyle() {
    return { paddingBottom: '8px' };
  },
  document: {
    getElementById(id) {
      return id === 'quadrant-view' ? quadrantView : null;
    }
  }
};

vm.createContext(context);
vm.runInContext(source.slice(functionStart, functionEnd), context, {
  filename: 'script.js#updateQuadrantScrollState'
});

function makeClassList(classes = []) {
  const values = new Set(classes);
  return {
    contains(name) {
      return values.has(name);
    },
    toggle(name, force) {
      if (force) values.add(name);
      else values.delete(name);
    }
  };
}

function makeTaskContainer({ taskCount, clientHeight, scrollHeight }) {
  const styleValues = new Map();
  return {
    children: Array.from({ length: taskCount }, (_, index) => ({
      classList: makeClassList(['task-item']),
      offsetTop: index * 50,
      offsetHeight: 44
    })),
    classList: makeClassList(),
    clientHeight,
    scrollHeight,
    dataset: {},
    scrollTop: 30,
    style: {
      setProperty(name, value, priority = '') {
        styleValues.set(name, { value, priority });
      },
      getPropertyValue(name) {
        return styleValues.get(name)?.value || '';
      },
      getPropertyPriority(name) {
        return styleValues.get(name)?.priority || '';
      },
      removeProperty(name) {
        styleValues.delete(name);
      }
    }
  };
}

const gridOverflow = makeTaskContainer({
  taskCount: 5,
  clientHeight: 180,
  scrollHeight: 220
});
context.updateQuadrantScrollState([gridOverflow], [5]);
assert.equal(
  gridOverflow.classList.contains('has-scroll'),
  true,
  'Grid mode must enable scrolling whenever rendered content actually overflows.'
);

const gridFourTasks = makeTaskContainer({
  taskCount: 4,
  clientHeight: 203,
  scrollHeight: 203
});
context.updateQuadrantScrollState([gridFourTasks], [4]);
assert.equal(gridFourTasks.style.getPropertyValue('max-height'), 'none');
assert.equal(
  gridFourTasks.classList.contains('has-scroll'),
  false,
  'Grid mode must not show a scrollbar for four fitting tasks.'
);

const gridSixTasks = makeTaskContainer({
  taskCount: 6,
  clientHeight: 253,
  scrollHeight: 303
});
context.updateQuadrantScrollState([gridSixTasks], [6]);
assert.equal(gridSixTasks.style.getPropertyValue('max-height'), '253px');
assert.equal(gridSixTasks.style.getPropertyValue('overflow-y'), 'auto');
assert.equal(gridSixTasks.style.getPropertyValue('box-sizing'), 'border-box');
assert.equal(gridSixTasks.style.getPropertyPriority('max-height'), 'important');
assert.equal(
  gridSixTasks.classList.contains('has-scroll'),
  true,
  'Grid mode must cap the visible list at five tasks even before overflow geometry settles.'
);

const gridFiveTasks = makeTaskContainer({
  taskCount: 5,
  clientHeight: 253,
  scrollHeight: 253
});
context.updateQuadrantScrollState([gridFiveTasks], [5]);
assert.equal(gridFiveTasks.style.getPropertyValue('max-height'), '253px');
assert.equal(
  gridFiveTasks.classList.contains('has-scroll'),
  false,
  'Grid mode must show five complete task rows without a scrollbar.'
);

quadrantView.classList.listMode = true;
const listHasRoom = makeTaskContainer({
  taskCount: 11,
  clientHeight: 600,
  scrollHeight: 540
});
context.updateQuadrantScrollState([listHasRoom], [11]);
assert.equal(listHasRoom.style.getPropertyValue('max-height'), 'none');
assert.equal(listHasRoom.style.getPropertyValue('overflow-y'), 'auto');
assert.equal(
  listHasRoom.classList.contains('has-scroll'),
  false,
  'List mode must not enable scrolling while all rendered tasks fit.'
);

const listOverflow = makeTaskContainer({
  taskCount: 5,
  clientHeight: 500,
  scrollHeight: 620
});
context.updateQuadrantScrollState([listOverflow], [5]);
assert.equal(
  listOverflow.classList.contains('has-scroll'),
  true,
  'List mode must enable scrolling when wrapped task rows overflow, regardless of task count.'
);

console.log('Quadrant scroll behavior check passed.');
