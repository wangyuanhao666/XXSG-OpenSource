
function renderSafeModuleMarkup(container, markup) {
    if (!container) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${markup}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    root.querySelectorAll('script, iframe, object, embed, link, meta').forEach(node => node.remove());
    root.querySelectorAll('*').forEach(node => {
        [...node.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const value = attr.value.trim().toLowerCase();
            if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
                node.removeAttribute(attr.name);
            }
        });
    });
    container.replaceChildren(...[...root.childNodes].map(node => document.importNode(node, true)));
}

// ==================== 第三阶段：智能日程规划 ====================

// AI智能日程规划系统
class AISmartScheduler {
    constructor() {
        this.scheduleData = {
            dailySchedule: [],
            timeBlocks: [],
            conflicts: [],
            optimizations: []
        };
        this.workHours = {
            start: 9, // 9:00 AM
            end: 18,  // 6:00 PM
            breakStart: 12, // 12:00 PM
            breakEnd: 13     // 1:00 PM
        };
        this.bufferTime = 15; // 15分钟缓冲时间
        this.init();
    }

    init() {
        console.log('🗓️ AI智能日程规划系统初始化');
        this.loadScheduleData();
        this.startScheduleOptimization();
    }

    // 加载日程数据
    loadScheduleData() {
        try {
            if (window.AIAssistantStorage) {
                this.scheduleData = window.AIAssistantStorage.getScheduleData();
            }
        } catch (error) {
            console.error('❌ 加载日程数据失败:', error);
        }
    }

    // 保存日程数据
    saveScheduleData() {
        try {
            if (window.AIAssistantStorage) {
                this.scheduleData = window.AIAssistantStorage.setScheduleData(this.scheduleData);
                return;
            }
            console.warn('AIAssistantStorage is unavailable; schedule data was not persisted.');
        } catch (error) {
            console.error('❌ 保存日程数据失败:', error);
        }
    }

    // 开始日程优化
    startScheduleOptimization() {
        // 每30分钟检查一次日程优化
        // 注意：这里不直接调用 optimizeSchedule，因为它需要 timeBlocks 参数
        // 实际的优化应该在 createSmartSchedule 中完成
        setInterval(() => {
            // 如果有已保存的日程数据，可以在这里进行定期优化
            if (this.scheduleData && this.scheduleData.dailySchedule && Array.isArray(this.scheduleData.dailySchedule)) {
                const conflicts = this.detectConflicts(this.scheduleData.dailySchedule);
                if (conflicts.length > 0) {
                    console.log('🔄 检测到日程冲突，重新优化...');
                    this.optimizeSchedule(this.scheduleData.dailySchedule, conflicts);
                }
            }
        }, 1800000);
    }

    // 智能日程规划主函数
    async createSmartSchedule(tasks) {
        console.log('🗓️ 开始智能日程规划...');

        try {
            // 1. 分析任务优先级和紧急程度
            const analyzedTasks = await this.analyzeTaskPriorities(tasks);

            // 2. 分析用户工作模式
            const workPatterns = this.analyzeWorkPatterns();

            // 3. 生成时间块分配
            const timeBlocks = this.generateTimeBlocks(analyzedTasks, workPatterns);

            // 4. 检测时间冲突
            const conflicts = this.detectConflicts(timeBlocks);

            // 5. 优化日程安排
            const optimizedSchedule = this.optimizeSchedule(timeBlocks, conflicts);

            // 6. 保存日程数据
            this.scheduleData.dailySchedule = optimizedSchedule;
            this.saveScheduleData();

            console.log('✅ 智能日程规划完成');
            return optimizedSchedule;

        } catch (error) {
            console.error('❌ 智能日程规划失败:', error);
            return this.createFallbackSchedule(tasks);
        }
    }

    // 分析任务优先级
    async analyzeTaskPriorities(tasks) {
        const analyzedTasks = [];

        for (const task of tasks) {
            try {
                // 使用AI分析任务优先级
                const analysis = await this.analyzeTaskWithAI(task);
                analyzedTasks.push({
                    ...task,
                    priority: analysis.priority,
                    urgency: analysis.urgency,
                    estimatedDuration: analysis.estimatedDuration,
                    bestTimeSlot: analysis.bestTimeSlot,
                    dependencies: analysis.dependencies
                });
            } catch (error) {
                // 回退到规则分析
                analyzedTasks.push({
                    ...task,
                    priority: this.calculatePriority(task),
                    urgency: this.calculateUrgency(task),
                    estimatedDuration: this.estimateDuration(task),
                    bestTimeSlot: this.findBestTimeSlot(task),
                    dependencies: []
                });
            }
        }

        return analyzedTasks;
    }

    // AI分析任务
    async analyzeTaskWithAI(task) {
        if (typeof aiServiceManager === 'undefined' || !aiServiceManager.isServiceAvailable()) {
            throw new Error('AI服务不可用');
        }

        const prompt = `
请分析以下任务的优先级、紧急程度、预计完成时间和最佳执行时间段：

任务内容：${task.text}
任务分类：${task.quadrant}
创建时间：${new Date(task.createdAt).toLocaleString()}

请以JSON格式返回分析结果：
{
    "priority": "高/中/低",
    "urgency": "高/中/低",
    "estimatedDuration": 分钟数,
    "bestTimeSlot": "上午/下午/晚上",
    "dependencies": ["依赖的任务描述"]
}
`;

        const response = await aiServiceManager.makeAPIRequest(prompt);
        return JSON.parse(response);
    }

    // 计算任务优先级（回退方法）
    calculatePriority(task) {
        const quadrant = task.quadrant;
        const createdTime = new Date(task.createdAt);
        const now = new Date();
        const timeDiff = (now - createdTime) / (1000 * 60 * 60); // 小时

        if (quadrant === 'urgent-important') return '高';
        if (quadrant === 'important-not-urgent') return '中';
        if (quadrant === 'urgent-not-important') return '中';
        return '低';
    }

    // 计算任务紧急程度
    calculateUrgency(task) {
        const createdTime = new Date(task.createdAt);
        const now = new Date();
        const timeDiff = (now - createdTime) / (1000 * 60 * 60); // 小时

        if (timeDiff > 24) return '高';
        if (timeDiff > 8) return '中';
        return '低';
    }

    // 估算任务持续时间
    estimateDuration(task) {
        const text = task.text.toLowerCase();

        // 基于关键词估算时间
        if (text.includes('会议') || text.includes('讨论')) return 60;
        if (text.includes('报告') || text.includes('分析')) return 120;
        if (text.includes('邮件') || text.includes('回复')) return 15;
        if (text.includes('设计') || text.includes('开发')) return 180;

        // 基于文本长度估算
        const wordCount = task.text.split(' ').length;
        return Math.max(15, Math.min(240, wordCount * 2));
    }

    // 找到最佳时间段
    findBestTimeSlot(task) {
        const quadrant = task.quadrant;

        if (quadrant === 'urgent-important') return '上午';
        if (quadrant === 'important-not-urgent') return '下午';
        if (quadrant === 'urgent-not-important') return '下午';
        return '晚上';
    }

    // 分析用户工作模式
    analyzeWorkPatterns() {
        const analysis = aiBehaviorAnalyzer.getWorkPatternAnalysis();

        return {
            peakHours: analysis.efficiencyCurves?.peakEfficiencyHours || [9, 10, 14, 15],
            lowEfficiencyHours: analysis.efficiencyCurves?.lowEfficiencyHours || [11, 16, 17],
            preferredTaskTypes: analysis.taskPreferences?.preferredTypes || [],
            averageWorkload: analysis.workloadAssessment?.averageDailyWorkload || 5
        };
    }

    // 生成时间块
    generateTimeBlocks(tasks, workPatterns) {
        const timeBlocks = [];
        let currentTime = this.workHours.start * 60; // 转换为分钟

        // 按优先级和紧急程度排序任务
        const sortedTasks = tasks.sort((a, b) => {
            const priorityOrder = { '高': 3, '中': 2, '低': 1 };
            const urgencyOrder = { '高': 3, '中': 2, '低': 1 };

            const aScore = priorityOrder[a.priority] + urgencyOrder[a.urgency];
            const bScore = priorityOrder[b.priority] + urgencyOrder[b.urgency];

            return bScore - aScore;
        });

        for (const task of sortedTasks) {
            const duration = task.estimatedDuration;
            const bestTime = this.getBestTimeForTask(task, workPatterns);

            // 检查是否有足够时间
            if (this.hasEnoughTime(currentTime, duration)) {
                const timeBlock = {
                    task: task,
                    startTime: this.formatTime(currentTime),
                    endTime: this.formatTime(currentTime + duration),
                    duration: duration,
                    type: 'task'
                };

                timeBlocks.push(timeBlock);
                currentTime += duration + this.bufferTime;
            }
        }

        return timeBlocks;
    }

    // 获取任务最佳时间
    getBestTimeForTask(task, workPatterns) {
        const hour = Math.floor(task.createdAt / (1000 * 60 * 60)) % 24;

        if (workPatterns.peakHours.includes(hour)) {
            return 'peak';
        } else if (workPatterns.lowEfficiencyHours.includes(hour)) {
            return 'low';
        }
        return 'normal';
    }

    // 检查是否有足够时间
    hasEnoughTime(currentTime, duration) {
        const endTime = this.workHours.end * 60;
        return currentTime + duration <= endTime;
    }

    // 格式化时间
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    // 检测时间冲突
    detectConflicts(timeBlocks) {
        const conflicts = [];

        for (let i = 0; i < timeBlocks.length - 1; i++) {
            const current = timeBlocks[i];
            const next = timeBlocks[i + 1];

            const currentEnd = this.parseTime(current.endTime);
            const nextStart = this.parseTime(next.startTime);

            if (currentEnd > nextStart) {
                conflicts.push({
                    type: 'overlap',
                    block1: current,
                    block2: next,
                    severity: 'high'
                });
            }
        }

        return conflicts;
    }

    // 解析时间字符串
    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // 优化日程安排
    optimizeSchedule(timeBlocks, conflicts) {
        // 如果没有传入参数或参数无效，返回空数组
        if (!timeBlocks || !Array.isArray(timeBlocks)) {
            console.warn('⚠️ optimizeSchedule: timeBlocks 参数无效，返回空数组');
            return [];
        }

        let optimizedSchedule = [...timeBlocks];

        // 解决冲突
        if (conflicts && Array.isArray(conflicts)) {
            for (const conflict of conflicts) {
                optimizedSchedule = this.resolveConflict(optimizedSchedule, conflict);
            }
        }

        // 添加休息时间
        optimizedSchedule = this.addBreakTimes(optimizedSchedule);

        // 优化时间分配
        optimizedSchedule = this.optimizeTimeAllocation(optimizedSchedule);

        return optimizedSchedule;
    }

    // 解决冲突
    resolveConflict(schedule, conflict) {
        // 简单的冲突解决：调整时间
        const conflictIndex = schedule.findIndex(block => block === conflict.block1);
        if (conflictIndex !== -1) {
            const block = schedule[conflictIndex];
            const newStartTime = this.parseTime(conflict.block2.endTime) + this.bufferTime;
            block.startTime = this.formatTime(newStartTime);
            block.endTime = this.formatTime(newStartTime + block.duration);
        }

        return schedule;
    }

    // 添加休息时间
    addBreakTimes(schedule) {
        const breakTimes = [
            { start: '12:00', end: '13:00', type: 'lunch' },
            { start: '15:00', end: '15:15', type: 'break' }
        ];

        const newSchedule = [];
        let scheduleIndex = 0;

        for (const breakTime of breakTimes) {
            // 添加休息时间前的任务
            while (scheduleIndex < schedule.length &&
                this.parseTime(schedule[scheduleIndex].startTime) < this.parseTime(breakTime.start)) {
                newSchedule.push(schedule[scheduleIndex]);
                scheduleIndex++;
            }

            // 添加休息时间
            newSchedule.push({
                startTime: breakTime.start,
                endTime: breakTime.end,
                duration: this.parseTime(breakTime.end) - this.parseTime(breakTime.start),
                type: breakTime.type,
                task: null
            });
        }

        // 添加剩余任务
        while (scheduleIndex < schedule.length) {
            newSchedule.push(schedule[scheduleIndex]);
            scheduleIndex++;
        }

        return newSchedule;
    }

    // 优化时间分配
    optimizeTimeAllocation(schedule) {
        // 按时间排序
        return schedule.sort((a, b) => this.parseTime(a.startTime) - this.parseTime(b.startTime));
    }

    // 创建回退日程
    createFallbackSchedule(tasks) {
        const schedule = [];
        let currentTime = this.workHours.start * 60;

        for (const task of tasks) {
            const duration = this.estimateDuration(task);

            if (this.hasEnoughTime(currentTime, duration)) {
                schedule.push({
                    task: task,
                    startTime: this.formatTime(currentTime),
                    endTime: this.formatTime(currentTime + duration),
                    duration: duration,
                    type: 'task'
                });

                currentTime += duration + this.bufferTime;
            }
        }

        return schedule;
    }

    // 获取今日日程
    getTodaySchedule() {
        return this.scheduleData.dailySchedule;
    }

    // 更新日程
    updateSchedule(schedule) {
        this.scheduleData.dailySchedule = schedule;
        this.saveScheduleData();
    }

    // 添加任务到日程
    addTaskToSchedule(task) {
        const schedule = this.scheduleData.dailySchedule;
        const duration = this.estimateDuration(task);

        // 找到合适的时间槽
        const timeSlot = this.findAvailableTimeSlot(duration);

        if (timeSlot) {
            const newBlock = {
                task: task,
                startTime: timeSlot.start,
                endTime: timeSlot.end,
                duration: duration,
                type: 'task'
            };

            schedule.push(newBlock);
            this.updateSchedule(schedule);
            return true;
        }

        return false;
    }

    // 找到可用时间槽
    findAvailableTimeSlot(duration) {
        const schedule = this.scheduleData.dailySchedule;
        const sortedSchedule = schedule.sort((a, b) => this.parseTime(a.startTime) - this.parseTime(b.startTime));

        for (let i = 0; i < sortedSchedule.length - 1; i++) {
            const current = sortedSchedule[i];
            const next = sortedSchedule[i + 1];

            const currentEnd = this.parseTime(current.endTime);
            const nextStart = this.parseTime(next.startTime);
            const availableTime = nextStart - currentEnd;

            if (availableTime >= duration + this.bufferTime) {
                return {
                    start: this.formatTime(currentEnd + this.bufferTime),
                    end: this.formatTime(currentEnd + this.bufferTime + duration)
                };
            }
        }

        return null;
    }
}

// 初始化AI智能日程规划系统
const aiSmartScheduler = new AISmartScheduler();
window.AISmartScheduler = AISmartScheduler;
window.aiSmartScheduler = aiSmartScheduler;

// ==================== 智能日程规划前端管理 ====================

// 生成智能日程
async function generateSmartSchedule() {
    console.log('🗓️ 生成智能日程...');

    try {
        // 获取当前所有任务
        const tasks = getCurrentTasks();

        if (tasks.length === 0) {
            showNotification('暂无任务，请先添加任务', 'info');
            return;
        }

        // 显示加载状态
        updateScheduleStatus('生成中...', '0%', '分析中...');

        // 生成智能日程
        const schedule = await aiSmartScheduler.createSmartSchedule(tasks);

        // 更新UI
        updateScheduleDisplay(schedule);
        updateScheduleStatus('已生成', calculateTimeUtilization(schedule), calculateEfficiencyScore(schedule));

        // 滚动到日程时间线区域
        const timelineEl = document.getElementById('schedule-timeline');
        if (timelineEl) {
            setTimeout(() => {
                timelineEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            }, 200);
        }

        showNotification('智能日程生成完成', 'success');

    } catch (error) {
        console.error('❌ 生成智能日程失败:', error);
        showNotification('生成智能日程失败', 'error');
        updateScheduleStatus('生成失败', '0%', '错误');
    }
}

// 更新日程状态显示
function updateScheduleStatus(status, utilization, efficiency) {
    const statusEl = document.getElementById('schedule-status');
    const utilizationEl = document.getElementById('time-utilization');
    const efficiencyEl = document.getElementById('efficiency-score');

    if (statusEl) statusEl.textContent = status;
    if (utilizationEl) utilizationEl.textContent = utilization;
    if (efficiencyEl) efficiencyEl.textContent = efficiency;
}

// 切换日程时间线展开/折叠状态
function toggleScheduleTimeline() {
    const timelineEl = document.getElementById('schedule-timeline');
    if (timelineEl) {
        timelineEl.classList.toggle('collapsed');
        console.log('📅 切换时间线显示状态:', timelineEl.classList.contains('collapsed') ? '折叠' : '展开');
    }
}

// 更新日程显示
function updateScheduleDisplay(schedule) {
    const timelineEl = document.getElementById('schedule-timeline');
    const containerEl = document.getElementById('timeline-container');

    if (!timelineEl || !containerEl) return;

    // 显示时间线
    timelineEl.style.display = 'block';
    containerEl.replaceChildren();

    if (schedule.length === 0) {
        containerEl.appendChild(createScheduleTimelineItem({
            icon: '📋',
            text: '暂无日程安排'
        }));
        return;
    }

    // 只显示未完成的任务
    const incompleteSchedule = schedule.filter(block => {
        // 保留所有休息时间块和未完成的任务
        return !block.task || !block.task.completed;
    });

    if (incompleteSchedule.length === 0) {
        containerEl.appendChild(createScheduleTimelineItem({
            icon: '🎉',
            text: '今日任务已全部完成！'
        }));
        return;
    }

    incompleteSchedule.forEach(block => {
        const icon = getScheduleIcon(block.type);
        const timeStr = `${block.startTime} - ${block.endTime}`;
        const durationStr = `${block.duration}分钟`;
        const itemEl = createScheduleTimelineItem({
            icon,
            text: block.task ? block.task.text : getBreakText(block.type),
            time: timeStr,
            duration: durationStr,
            className: getScheduleTimelineItemClass(block)
        });
        containerEl.appendChild(itemEl);
    });

    // 不再自动滚动到日程时间线区域，让用户自己滚动查看
    // 移除了自动滚动代码，保持页面在顶部
}

function createScheduleTimelineItem({ icon, text, time = '', duration = '', className = 'timeline-item' }) {
    const itemEl = document.createElement('div');
    itemEl.className = className;

    const iconEl = document.createElement('span');
    iconEl.className = 'timeline-icon';
    iconEl.textContent = icon;

    if (!time && !duration) {
        const textEl = document.createElement('span');
        textEl.className = 'timeline-text';
        textEl.textContent = text;
        itemEl.append(iconEl, textEl);
        return itemEl;
    }

    const contentEl = document.createElement('div');
    contentEl.className = 'timeline-content';
    const textEl = document.createElement('div');
    textEl.className = 'timeline-text';
    textEl.textContent = text;
    const timeEl = document.createElement('div');
    timeEl.className = 'timeline-time';
    timeEl.textContent = time;
    const durationEl = document.createElement('div');
    durationEl.className = 'timeline-duration';
    durationEl.textContent = duration;
    contentEl.append(textEl, timeEl, durationEl);
    itemEl.append(iconEl, contentEl);
    return itemEl;
}

function getScheduleTimelineItemClass(block) {
    let itemClass = 'timeline-item';

    if (!block.task) return itemClass;

    let numericPriority = 4;
    if (typeof block.task.priority === 'number') {
        numericPriority = block.task.priority;
    } else if (block.task.quadrant) {
        const quadrantMap = {
            'urgent-important': 1,
            'important-not-urgent': 2,
            'urgent-not-important': 3,
            'not-urgent-not-important': 4
        };
        numericPriority = quadrantMap[block.task.quadrant] || 4;
    }

    itemClass += ` priority-${numericPriority}`;
    itemClass += block.task.completed ? ' completed' : ' pending';
    return itemClass;
}

// 获取日程图标
function getScheduleIcon(type) {
    const icons = {
        'task': '📋',
        'lunch': '🍽️',
        'break': '☕',
        'meeting': '👥',
        'focus': '🎯'
    };
    return icons[type] || '📋';
}

// 获取休息时间文本
function getBreakText(type) {
    const texts = {
        'lunch': '午餐时间',
        'break': '休息时间',
        'meeting': '会议时间',
        'focus': '专注时间'
    };
    return texts[type] || '休息时间';
}

// 计算时间利用率
function calculateTimeUtilization(schedule) {
    if (schedule.length === 0) return '0%';

    const totalWorkTime = 8 * 60; // 8小时工作制
    const scheduledTime = schedule.reduce((total, block) => {
        if (block.type === 'task') {
            return total + block.duration;
        }
        return total;
    }, 0);

    const utilization = Math.round((scheduledTime / totalWorkTime) * 100);
    return `${utilization}%`;
}

// 计算效率分数
function calculateEfficiencyScore(schedule) {
    if (schedule.length === 0) return '待分析';

    // 基于任务分布和休息时间计算效率分数
    const taskBlocks = schedule.filter(block => block.type === 'task');
    const breakBlocks = schedule.filter(block => block.type === 'break' || block.type === 'lunch');

    const taskRatio = taskBlocks.length / schedule.length;
    const breakRatio = breakBlocks.length / schedule.length;

    // 理想比例：80%任务，20%休息
    const efficiency = Math.round((taskRatio * 0.8 + breakRatio * 0.2) * 100);

    if (efficiency >= 80) return '优秀';
    if (efficiency >= 60) return '良好';
    if (efficiency >= 40) return '一般';
    return '需优化';
}

// 获取当前任务
function getCurrentTasks(includeCompleted = false) {
    // 直接从全局tasks数组获取任务数据
    let filteredTasks = tasks;

    // 默认过滤已完成的任务
    if (!includeCompleted) {
        filteredTasks = tasks.filter(task => !task.completed);
    }

    return filteredTasks.map(task => ({
        text: task.title || task.text || '',
        priority: task.priority || 4,
        quadrant: getQuadrantFromPriority(task.priority || 4),
        createdAt: task.createdAt || Date.now(),
        id: task.id,
        completed: task.completed || false
    }));
}

// 根据优先级获取象限
function getQuadrantFromPriority(priority) {
    const quadrants = {
        1: 'urgent-important',
        2: 'important-not-urgent',
        3: 'urgent-not-important',
        4: 'not-urgent-not-important'
    };
    return quadrants[priority] || 'not-urgent-not-important';
}

// 查看日程设置
function viewScheduleSettings() {
    console.log('⚙️ 查看日程设置');
    showScheduleSettingsModal();
}

// 显示日程设置模态框
function showScheduleSettingsModal() {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'schedule-settings-modal active';
    renderSafeModuleMarkup(modal, `
        <div class="modal-overlay" data-schedule-action="close-settings"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>⚙️ 智能日程设置</h3>
                <button class="modal-close" data-schedule-action="close-settings">×</button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h4>🕐 工作时间设置</h4>
                    <div class="setting-item">
                        <label class="setting-label">开始时间：</label>
                        <input type="time" id="work-start-time" value="09:00">
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">结束时间：</label>
                        <input type="time" id="work-end-time" value="18:00">
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">午餐时间：</label>
                        <input type="time" id="lunch-start-time" value="12:00">
                        <span> - </span>
                        <input type="time" id="lunch-end-time" value="13:00">
                    </div>
                </div>

                <div class="settings-section">
                    <h4>⏱️ 时间管理设置</h4>
                    <div class="setting-item">
                        <label class="setting-label">任务间缓冲时间：</label>
                        <input type="range" id="buffer-time" min="5" max="30" step="5" value="15">
                        <span id="buffer-time-value">15</span> 分钟
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">休息时间间隔：</label>
                        <input type="range" id="break-interval" min="60" max="180" step="15" value="90">
                        <span id="break-interval-value">90</span> 分钟
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">休息时长：</label>
                        <input type="range" id="break-duration" min="5" max="20" step="5" value="15">
                        <span id="break-duration-value">15</span> 分钟
                    </div>
                </div>

                <div class="settings-section">
                    <h4>🎯 任务优先级设置</h4>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" id="enable-ai-analysis" checked>
                            <span class="checkmark"></span>
                            启用AI任务分析
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" id="enable-work-patterns" checked>
                            <span class="checkmark"></span>
                            基于工作模式优化
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" id="enable-conflict-detection" checked>
                            <span class="checkmark"></span>
                            启用冲突检测
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>📊 效率优化设置</h4>
                    <div class="setting-item">
                        <label class="setting-label">高效时段权重：</label>
                        <input type="range" id="peak-hours-weight" min="1" max="3" step="0.5" value="2">
                        <span id="peak-hours-weight-value">2.0</span>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">任务类型偏好：</label>
                        <select id="task-preference">
                            <option value="balanced">平衡分配</option>
                            <option value="morning-heavy">上午集中</option>
                            <option value="afternoon-heavy">下午集中</option>
                            <option value="evening-heavy">晚上集中</option>
                        </select>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>🔔 提醒设置</h4>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" id="enable-schedule-reminders" checked>
                            <span class="checkmark"></span>
                            启用日程提醒
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">提醒提前时间：</label>
                        <input type="range" id="reminder-advance" min="5" max="30" step="5" value="10">
                        <span id="reminder-advance-value">10</span> 分钟
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" data-schedule-action="close-settings">取消</button>
                <button class="btn-primary" data-schedule-action="save-settings">保存设置</button>
            </div>
        </div>
    `);

    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-schedule-action]');
        if (!actionEl || !modal.contains(actionEl)) return;

        const action = actionEl.dataset.scheduleAction;
        if (action === 'close-settings') {
            closeScheduleSettings();
        } else if (action === 'save-settings') {
            saveScheduleSettings();
        }
    });

    // 加载当前设置
    loadScheduleSettings();

    // 绑定滑块事件
    document.getElementById('buffer-time').addEventListener('input', function () {
        document.getElementById('buffer-time-value').textContent = this.value;
    });

    document.getElementById('break-interval').addEventListener('input', function () {
        document.getElementById('break-interval-value').textContent = this.value;
    });

    document.getElementById('break-duration').addEventListener('input', function () {
        document.getElementById('break-duration-value').textContent = this.value;
    });

    document.getElementById('peak-hours-weight').addEventListener('input', function () {
        document.getElementById('peak-hours-weight-value').textContent = this.value;
    });

    document.getElementById('reminder-advance').addEventListener('input', function () {
        document.getElementById('reminder-advance-value').textContent = this.value;
    });
}

// 关闭日程设置模态框
function closeScheduleSettings() {
    const modal = document.querySelector('.schedule-settings-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// 加载日程设置
function loadScheduleSettings() {
    try {
        const settings = window.SettingsStorage
            ? window.SettingsStorage.getScheduleSettings()
            : {};

        // 加载工作时间设置
        document.getElementById('work-start-time').value = settings.workStartTime || '09:00';
        document.getElementById('work-end-time').value = settings.workEndTime || '18:00';
        document.getElementById('lunch-start-time').value = settings.lunchStartTime || '12:00';
        document.getElementById('lunch-end-time').value = settings.lunchEndTime || '13:00';

        // 加载时间管理设置
        document.getElementById('buffer-time').value = settings.bufferTime || 15;
        document.getElementById('buffer-time-value').textContent = settings.bufferTime || 15;
        document.getElementById('break-interval').value = settings.breakInterval || 90;
        document.getElementById('break-interval-value').textContent = settings.breakInterval || 90;
        document.getElementById('break-duration').value = settings.breakDuration || 15;
        document.getElementById('break-duration-value').textContent = settings.breakDuration || 15;

        // 加载任务优先级设置
        document.getElementById('enable-ai-analysis').checked = settings.enableAIAnalysis !== false;
        document.getElementById('enable-work-patterns').checked = settings.enableWorkPatterns !== false;
        document.getElementById('enable-conflict-detection').checked = settings.enableConflictDetection !== false;

        // 加载效率优化设置
        document.getElementById('peak-hours-weight').value = settings.peakHoursWeight || 2;
        document.getElementById('peak-hours-weight-value').textContent = settings.peakHoursWeight || 2;
        document.getElementById('task-preference').value = settings.taskPreference || 'balanced';

        // 加载提醒设置
        document.getElementById('enable-schedule-reminders').checked = settings.enableScheduleReminders !== false;
        document.getElementById('reminder-advance').value = settings.reminderAdvance || 10;
        document.getElementById('reminder-advance-value').textContent = settings.reminderAdvance || 10;

    } catch (error) {
        console.error('❌ 加载日程设置失败:', error);
    }
}

// 保存日程设置
function saveScheduleSettings() {
    try {
        const settings = {
            workStartTime: document.getElementById('work-start-time').value,
            workEndTime: document.getElementById('work-end-time').value,
            lunchStartTime: document.getElementById('lunch-start-time').value,
            lunchEndTime: document.getElementById('lunch-end-time').value,
            bufferTime: parseInt(document.getElementById('buffer-time').value),
            breakInterval: parseInt(document.getElementById('break-interval').value),
            breakDuration: parseInt(document.getElementById('break-duration').value),
            enableAIAnalysis: document.getElementById('enable-ai-analysis').checked,
            enableWorkPatterns: document.getElementById('enable-work-patterns').checked,
            enableConflictDetection: document.getElementById('enable-conflict-detection').checked,
            peakHoursWeight: parseFloat(document.getElementById('peak-hours-weight').value),
            taskPreference: document.getElementById('task-preference').value,
            enableScheduleReminders: document.getElementById('enable-schedule-reminders').checked,
            reminderAdvance: parseInt(document.getElementById('reminder-advance').value)
        };

        if (window.SettingsStorage) {
            window.SettingsStorage.setScheduleSettings(settings);
        } else {
            console.warn('SettingsStorage is unavailable; schedule settings were not persisted.');
        }

        // 更新智能日程规划系统设置
        if (typeof aiSmartScheduler !== 'undefined') {
            aiSmartScheduler.workHours = {
                start: parseInt(settings.workStartTime.split(':')[0]),
                end: parseInt(settings.workEndTime.split(':')[0]),
                breakStart: parseInt(settings.lunchStartTime.split(':')[0]),
                breakEnd: parseInt(settings.lunchEndTime.split(':')[0])
            };
            aiSmartScheduler.bufferTime = settings.bufferTime;
        }

        showNotification('日程设置已保存', 'success');
        closeScheduleSettings();

    } catch (error) {
        console.error('❌ 保存日程设置失败:', error);
        showNotification('保存设置失败', 'error');
    }
}

// 导出日程
function exportSchedule() {
    console.log('📥 导出日程');

    try {
        const schedule = aiSmartScheduler.getTodaySchedule();

        if (schedule.length === 0) {
            showNotification('暂无日程可导出', 'info');
            return;
        }

        // 生成日程文本
        const scheduleText = schedule.map(block => {
            const timeStr = `${block.startTime} - ${block.endTime}`;
            const taskText = block.task ? block.task.text : getBreakText(block.type);
            return `${timeStr} ${taskText}`;
        }).join('\n');

        // 创建下载链接
        const blob = new Blob([scheduleText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `日程安排_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('日程导出成功', 'success');

    } catch (error) {
        console.error('❌ 导出日程失败:', error);
        showNotification('导出日程失败', 'error');
    }
}

// 加载智能日程规划系统
function loadSmartScheduleSystem() {
    console.log('🗓️ 加载智能日程规划系统...');

    if (typeof aiSmartScheduler === 'undefined') {
        console.warn('⚠️ AI智能日程规划系统未初始化');
        return;
    }

    try {
        // 更新日程状态
        updateScheduleStatusDisplay();

        // 加载今日日程
        loadTodaySchedule();

        console.log('✅ 智能日程规划系统加载完成');
    } catch (error) {
        console.error('❌ 加载智能日程规划系统失败:', error);
    }
}

// 更新日程状态显示
function updateScheduleStatusDisplay() {
    const schedule = aiSmartScheduler.getTodaySchedule();

    if (schedule.length === 0) {
        updateScheduleStatus('未生成', '0%', '待分析');
        return;
    }

    const utilization = calculateTimeUtilization(schedule);
    const efficiency = calculateEfficiencyScore(schedule);

    updateScheduleStatus('已生成', utilization, efficiency);
}

// 加载今日日程
function loadTodaySchedule() {
    const schedule = aiSmartScheduler.getTodaySchedule();

    if (schedule.length > 0) {
        updateScheduleDisplay(schedule);
        const timelineEl = document.getElementById('schedule-timeline');
        if (timelineEl) {
            timelineEl.style.display = 'block';
        }
    }
}

window.generateSmartSchedule = generateSmartSchedule;
window.viewScheduleSettings = viewScheduleSettings;
window.exportSchedule = exportSchedule;
window.loadSmartScheduleSystem = loadSmartScheduleSystem;
window.closeScheduleSettings = closeScheduleSettings;
window.saveScheduleSettings = saveScheduleSettings;
