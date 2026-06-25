import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const storage = new Map();
const context = {
  console: { ...console, warn() {} },
  Date,
  Math,
  Number,
  Boolean,
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
const source = fs.readFileSync(path.join(process.cwd(), 'js/ai-assistant-storage.js'), 'utf8');
vm.runInContext(source, context, { filename: 'js/ai-assistant-storage.js' });

const api = context.window.AIAssistantStorage;
if (!api) {
  throw new Error('AIAssistantStorage was not attached to window.');
}

const reminders = api.setReminders([{ type: 'workload', title: 'Rest' }]);
if (reminders.length !== 1) throw new Error('Reminders should round-trip as an array.');

const schedule = api.setScheduleData({
  dailySchedule: [{ startTime: '09:00' }],
  timeBlocks: 'bad',
  conflicts: [],
  optimizations: []
});
if (schedule.dailySchedule.length !== 1) throw new Error('Schedule daily items should round-trip.');
if (schedule.timeBlocks.length !== 0) throw new Error('Invalid schedule arrays should be normalized.');

const decompositionData = api.setDecompositionData({
  decomposedTasks: [{ originalTask: { id: '1' } }],
  taskHierarchy: null,
  dependencies: { a: [] },
  milestones: 'bad'
});
if (decompositionData.decomposedTasks.length !== 1) throw new Error('Decomposition records should round-trip.');
if (Object.keys(decompositionData.taskHierarchy).length !== 0) throw new Error('Invalid hierarchy should become an object.');
if (decompositionData.milestones.length !== 0) throw new Error('Invalid milestones should become an array.');

const settings = api.setDecompositionSettings({
  maxSubTasks: 99,
  minTaskDuration: 1,
  complexityThreshold: 2,
  aiModel: 'unknown',
  exportFormat: 'csv'
});
if (settings.maxSubTasks !== 20) throw new Error('maxSubTasks should be clamped.');
if (settings.minTaskDuration !== 5) throw new Error('minTaskDuration should be clamped.');
if (settings.complexityThreshold !== 1) throw new Error('complexityThreshold should be clamped.');
if (settings.aiModel !== 'smart') throw new Error('Invalid AI model should fall back.');
if (settings.exportFormat !== 'csv') throw new Error('Valid export format should be preserved.');

const health = api.setHealthData({
  workIntensity: [{ value: 0.8 }],
  stressLevel: null,
  wellnessScore: 999
});
if (health.workIntensity.length !== 1) throw new Error('Health intensity should round-trip.');
if (health.stressLevel.length !== 0) throw new Error('Invalid health arrays should be normalized.');
if (health.wellnessScore !== 100) throw new Error('Wellness score should be clamped.');

storage.set('aiScheduleData', '{');
if (api.getScheduleData().dailySchedule.length !== 0) {
  throw new Error('Broken schedule JSON should fall back.');
}

console.log('AI assistant storage check passed.');
