// ==================== 模块导入 ====================
// 本文件包含所有提取模块的导入语句
// 将此内容添加到 script.js 文件顶部（第1行之前）

// AI功能模块
import { AIServiceManager } from './src/features/ai/ai-service.js';
import { AITaskAnalyzer } from './src/features/ai/ai-task-analyzer.js';
import { behaviorAnalyzer } from './src/features/ai/ai-behavior-analyzer.js';

// 核心工具模块
import * as DateUtils from './src/core/date-utils.js';
import * as StorageUtils from './src/core/storage-utils.js';
import * as DataManager from './src/core/data-manager.js';
import * as Validator from './src/core/validator.js';
import * as Formatter from './src/core/formatter.js';

// 功能模块
import * as TaskManager from './src/features/quadrant/task-manager.js';
import { habitTracker } from './src/features/habit/habit-tracker.js';
import { pomodoroTimer } from './src/features/pomodoro/pomodoro-timer.js';
import * as Statistics from './src/features/statistics/statistics-analyzer.js';

// UI组件模块
import * as UIUtils from './src/ui/ui-utils.js';
import * as Modal from './src/ui/modal.js';
import * as Notification from './src/ui/notification.js';
import { Calendar, createCalendar } from './src/ui/calendar.js';
import { BarChart, PieChart, LineChart, createBarChart, createPieChart, createLineChart } from './src/ui/chart.js';
import { Form, createForm } from './src/ui/form.js';

// ==================== 模块导入结束 ====================
