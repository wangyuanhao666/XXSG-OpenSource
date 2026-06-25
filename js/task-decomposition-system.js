
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

// ==================== 智能任务分解系统 ====================

// AI智能任务分解系统
class AITaskDecomposer {
    constructor() {
        this.decompositionData = {
            decomposedTasks: [],
            taskHierarchy: {},
            dependencies: {},
            milestones: []
        };
        this.decompositionRules = {
            maxSubTasks: 8, // 最大子任务数
            minTaskDuration: 15, // 最小任务时长（分钟）
            maxTaskDuration: 240, // 最大任务时长（分钟）
            complexityThreshold: 0.7 // 复杂度阈值
        };
        this.init();
    }

    init() {
        console.log('🔧 AI智能任务分解系统初始化');
        this.loadDecompositionData();
        this.loadDecompositionRules();
    }

    // 加载分解数据
    loadDecompositionData() {
        try {
            if (window.AIAssistantStorage) {
                this.decompositionData = window.AIAssistantStorage.getDecompositionData();
            }
        } catch (error) {
            console.error('❌ 加载任务分解数据失败:', error);
        }
    }

    // 保存分解数据
    saveDecompositionData() {
        try {
            if (window.AIAssistantStorage) {
                this.decompositionData = window.AIAssistantStorage.setDecompositionData(this.decompositionData);
                return;
            }
            console.warn('AIAssistantStorage is unavailable; decomposition data was not persisted.');
        } catch (error) {
            console.error('❌ 保存任务分解数据失败:', error);
        }
    }

    loadDecompositionRules() {
        try {
            if (window.AIAssistantStorage) {
                this.decompositionRules = {
                    ...this.decompositionRules,
                    ...window.AIAssistantStorage.getDecompositionSettings()
                };
            }
        } catch (error) {
            console.error('❌ 加载分解设置失败:', error);
        }
    }

    saveDecompositionRules() {
        try {
            if (window.AIAssistantStorage) {
                this.decompositionRules = window.AIAssistantStorage.setDecompositionSettings(this.decompositionRules);
                return;
            }
            console.warn('AIAssistantStorage is unavailable; decomposition rules were not persisted.');
        } catch (error) {
            console.error('❌ 保存分解设置失败:', error);
        }
    }

    // 更新设置
    updateSettings(settings) {
        try {
            // 更新分解规则
            this.decompositionRules.maxSubTasks = settings.maxSubTasks || 8;
            this.decompositionRules.minTaskDuration = settings.minTaskDuration || 15;
            this.decompositionRules.maxTaskDuration = settings.maxTaskDuration || 240;
            this.decompositionRules.complexityThreshold = settings.complexityThreshold || 0.7;

            // 更新AI配置
            this.decompositionRules.aiModel = settings.aiModel || 'smart';
            this.decompositionRules.decompositionDepth = settings.decompositionDepth || 'medium';
            this.decompositionRules.autoDependencies = settings.autoDependencies !== false;

            // 更新输出格式
            this.decompositionRules.outputFormat = settings.outputFormat || 'hierarchical';
            this.decompositionRules.includeMilestones = settings.includeMilestones !== false;
            this.decompositionRules.showDependencies = settings.showDependencies !== false;
            this.decompositionRules.exportFormat = settings.exportFormat || 'json';

            // 更新历史管理
            this.decompositionRules.historyRetention = settings.historyRetention || 30;
            this.decompositionRules.autoCleanup = settings.autoCleanup !== false;
            this.decompositionRules.maxHistoryItems = settings.maxHistoryItems || 100;

            console.log('✅ 分解设置已更新:', this.decompositionRules);
        } catch (error) {
            console.error('❌ 更新分解设置失败:', error);
        }
    }

    // 清空历史
    clearHistory() {
        try {
            this.decompositionData.decomposedTasks = [];
            this.decompositionData.taskHierarchy = {};
            this.decompositionData.dependencies = {};
            this.decompositionData.milestones = [];
            this.saveDecompositionData();
            console.log('✅ 分解历史已清空');
        } catch (error) {
            console.error('❌ 清空分解历史失败:', error);
        }
    }

    // 更新分解设置
    updateSettings(newSettings) {
        try {
            this.decompositionRules = { ...this.decompositionRules, ...newSettings };
            this.saveDecompositionRules();
            console.log('✅ 分解设置已更新:', this.decompositionRules);
        } catch (error) {
            console.error('❌ 更新分解设置失败:', error);
        }
    }

    // 获取当前设置
    getSettings() {
        return this.decompositionRules;
    }

    // 重置设置为默认值
    resetSettings() {
        try {
            this.decompositionRules = {
                maxSubtasks: 8,
                minDuration: 15,
                maxDuration: 240,
                complexityThreshold: 0.7,
                aiModel: 'smart',
                decompositionDepth: 'medium',
                autoDependencies: true,
                outputFormat: 'hierarchical',
                includeMilestones: true,
                showDependencies: true,
                exportFormat: 'json',
                historyRetention: 30,
                autoCleanup: true,
                maxHistoryItems: 100
            };
            this.saveDecompositionRules();
            console.log('✅ 分解设置已重置为默认值');
        } catch (error) {
            console.error('❌ 重置分解设置失败:', error);
        }
    }

    // 根据设置调整分解策略
    adjustDecompositionStrategy(task) {
        const settings = this.decompositionRules;

        // 根据复杂度阈值决定是否分解
        if (task.complexity < settings.complexityThreshold) {
            return null; // 不分解
        }

        // 根据AI模型选择分解策略
        let strategy = 'smart';
        switch (settings.aiModel) {
            case 'hierarchical':
                strategy = 'hierarchical';
                break;
            case 'time-based':
                strategy = 'time-based';
                break;
            case 'priority-based':
                strategy = 'priority-based';
                break;
            default:
                strategy = 'smart';
        }

        return {
            strategy,
            maxSubtasks: settings.maxSubtasks,
            minDuration: settings.minDuration,
            maxDuration: settings.maxDuration,
            depth: settings.decompositionDepth,
            autoDependencies: settings.autoDependencies
        };
    }

    // 根据设置格式化输出
    formatOutput(subtasks, settings) {
        const format = settings.outputFormat || 'hierarchical';

        switch (format) {
            case 'list':
                return this.formatAsList(subtasks);
            case 'timeline':
                return this.formatAsTimeline(subtasks);
            case 'mindmap':
                return this.formatAsMindmap(subtasks);
            default:
                return this.formatAsHierarchical(subtasks);
        }
    }

    // 列表格式
    formatAsList(subtasks) {
        let result = '📋 任务分解列表：\n\n';
        subtasks.forEach((subtask, index) => {
            result += `${index + 1}. ${subtask.name}\n`;
            result += `   ⏱️ 预计时长: ${subtask.duration}分钟\n`;
            result += `   📊 优先级: ${subtask.priority}\n`;
            if (subtask.dependencies && subtask.dependencies.length > 0) {
                result += `   🔗 依赖: ${subtask.dependencies.join(', ')}\n`;
            }
            result += '\n';
        });
        return result;
    }

    // 时间线格式
    formatAsTimeline(subtasks) {
        let result = '⏰ 任务时间线：\n\n';
        let currentTime = 0;

        subtasks.forEach((subtask, index) => {
            result += `🕐 ${currentTime}:00 - ${currentTime + subtask.duration}:00\n`;
            result += `   📝 ${subtask.name}\n`;
            result += `   📊 优先级: ${subtask.priority}\n\n`;
            currentTime += subtask.duration;
        });

        return result;
    }

    // 思维导图格式
    formatAsMindmap(subtasks) {
        let result = '🧠 任务思维导图：\n\n';
        result += '📋 主任务\n';

        subtasks.forEach((subtask, index) => {
            result += `├── ${subtask.name}\n`;
            if (subtask.dependencies && subtask.dependencies.length > 0) {
                subtask.dependencies.forEach(dep => {
                    result += `│   └── 依赖: ${dep}\n`;
                });
            }
        });

        return result;
    }

    // 层级格式（默认）
    formatAsHierarchical(subtasks) {
        let result = '📊 任务分解结构：\n\n';
        subtasks.forEach((subtask, index) => {
            result += `${'  '.repeat(Math.floor(index / 2))}${index + 1}. ${subtask.name}\n`;
            result += `${'  '.repeat(Math.floor(index / 2))}   ⏱️ 时长: ${subtask.duration}分钟\n`;
            result += `${'  '.repeat(Math.floor(index / 2))}   📊 优先级: ${subtask.priority}\n`;
            if (subtask.dependencies && subtask.dependencies.length > 0) {
                result += `${'  '.repeat(Math.floor(index / 2))}   🔗 依赖: ${subtask.dependencies.join(', ')}\n`;
            }
            result += '\n';
        });
        return result;
    }

    // 获取分解历史
    getDecompositionHistory() {
        try {
            return window.AIAssistantStorage
                ? window.AIAssistantStorage.getDecompositionHistory()
                : [];
        } catch (error) {
            console.error('❌ 获取分解历史失败:', error);
            return [];
        }
    }

    // 保存分解历史
    saveDecompositionHistory(historyItem) {
        try {
            const history = this.getDecompositionHistory();
            history.unshift(historyItem);

            // 限制历史记录数量
            const maxItems = this.decompositionRules.maxHistoryItems || 100;
            if (history.length > maxItems) {
                history.splice(maxItems);
            }

            if (window.AIAssistantStorage) {
                window.AIAssistantStorage.setDecompositionHistory(history);
            } else {
                console.warn('AIAssistantStorage is unavailable; decomposition history was not persisted.');
            }
            console.log('✅ 分解历史已保存');
        } catch (error) {
            console.error('❌ 保存分解历史失败:', error);
        }
    }

    // 智能任务分解主函数
    async decomposeTask(task) {
        console.log('🔧 开始智能任务分解...', task.text);

        try {
            // 1. 分析任务复杂度
            const complexity = await this.analyzeTaskComplexity(task);

            // 2. 如果任务不够复杂，直接返回
            if (complexity < this.decompositionRules.complexityThreshold) {
                return {
                    shouldDecompose: false,
                    reason: '任务复杂度较低，无需分解',
                    originalTask: task
                };
            }

            // 3. 使用AI分解任务
            const decomposition = await this.decomposeWithAI(task);

            // 4. 分析依赖关系
            const dependencies = this.analyzeDependencies(decomposition.subTasks);

            // 5. 设置里程碑
            const milestones = this.setMilestones(decomposition.subTasks);

            // 6. 保存分解结果
            const result = {
                shouldDecompose: true,
                originalTask: task,
                subTasks: decomposition.subTasks,
                dependencies: dependencies,
                milestones: milestones,
                estimatedTotalDuration: decomposition.estimatedTotalDuration,
                complexity: complexity
            };

            this.decompositionData.decomposedTasks.push(result);
            this.saveDecompositionData();

            console.log('✅ 智能任务分解完成');
            return result;

        } catch (error) {
            console.error('❌ 智能任务分解失败:', error);
            return this.createFallbackDecomposition(task);
        }
    }

    // 分析任务复杂度
    async analyzeTaskComplexity(task) {
        try {
            if (typeof aiServiceManager === 'undefined' || !aiServiceManager.isServiceAvailable()) {
                return this.calculateComplexityFallback(task);
            }

            const prompt = `
请分析以下任务的复杂度（0-1之间，1表示最复杂）：

任务内容：${task.text}
任务分类：${task.quadrant}

请考虑以下因素：
1. 任务涉及的工作量
2. 需要的技能种类
3. 涉及的人员或部门
4. 时间跨度
5. 依赖关系

请只返回一个0-1之间的数字，保留一位小数。
`;

            const response = await aiServiceManager.makeAPIRequest(prompt);
            const complexity = parseFloat(response.trim());

            return isNaN(complexity) ? 0.5 : Math.max(0, Math.min(1, complexity));

        } catch (error) {
            console.error('❌ AI复杂度分析失败:', error);
            return this.calculateComplexityFallback(task);
        }
    }

    // 计算复杂度（回退方法）
    calculateComplexityFallback(task) {
        const text = task.text.toLowerCase();
        let complexity = 0.3; // 基础复杂度

        // 基于关键词增加复杂度
        const complexityKeywords = {
            '项目': 0.3,
            '系统': 0.2,
            '开发': 0.2,
            '设计': 0.15,
            '分析': 0.1,
            '报告': 0.1,
            '会议': 0.05,
            '邮件': 0.02
        };

        for (const [keyword, value] of Object.entries(complexityKeywords)) {
            if (text.includes(keyword)) {
                complexity += value;
            }
        }

        // 基于文本长度增加复杂度
        const wordCount = task.text.split(' ').length;
        if (wordCount > 10) complexity += 0.1;
        if (wordCount > 20) complexity += 0.1;

        return Math.min(1, complexity);
    }

    // 使用AI分解任务
    async decomposeWithAI(task) {
        if (typeof aiServiceManager === 'undefined' || !aiServiceManager.isServiceAvailable()) {
            return this.createFallbackDecomposition(task);
        }

        const prompt = `
请将以下复杂任务分解为具体的、可执行的小任务：

原始任务：${task.text}
任务分类：${task.quadrant}

请按照以下格式返回JSON：
{
    "subTasks": [
        {
            "title": "子任务标题",
            "description": "详细描述",
            "estimatedDuration": 分钟数,
            "priority": "高/中/低",
            "skills": ["所需技能1", "所需技能2"],
            "dependencies": ["依赖的子任务标题"]
        }
    ],
    "estimatedTotalDuration": 总分钟数
}

要求：
1. 子任务数量控制在3-8个之间
2. 每个子任务时长15-240分钟
3. 子任务之间要有逻辑顺序
4. 考虑任务依赖关系
5. 确保子任务具体可执行
`;

        const response = await aiServiceManager.makeAPIRequest(prompt);
        return JSON.parse(response);
    }

    // 创建回退分解
    createFallbackDecomposition(task) {
        const text = task.text.toLowerCase();
        const subTasks = [];

        // 基于关键词创建子任务
        if (text.includes('项目') || text.includes('开发')) {
            subTasks.push(
                { title: '需求分析', description: '分析项目需求', estimatedDuration: 60, priority: '高', skills: ['分析'], dependencies: [] },
                { title: '方案设计', description: '设计技术方案', estimatedDuration: 90, priority: '高', skills: ['设计'], dependencies: ['需求分析'] },
                { title: '开发实现', description: '实现核心功能', estimatedDuration: 180, priority: '高', skills: ['开发'], dependencies: ['方案设计'] },
                { title: '测试验证', description: '测试功能正确性', estimatedDuration: 60, priority: '中', skills: ['测试'], dependencies: ['开发实现'] }
            );
        } else if (text.includes('报告') || text.includes('分析')) {
            subTasks.push(
                { title: '数据收集', description: '收集相关数据', estimatedDuration: 45, priority: '高', skills: ['研究'], dependencies: [] },
                { title: '数据分析', description: '分析数据内容', estimatedDuration: 90, priority: '高', skills: ['分析'], dependencies: ['数据收集'] },
                { title: '报告撰写', description: '撰写分析报告', estimatedDuration: 75, priority: '中', skills: ['写作'], dependencies: ['数据分析'] }
            );
        } else {
            // 通用分解
            subTasks.push(
                { title: '准备工作', description: '准备相关资源', estimatedDuration: 30, priority: '高', skills: ['规划'], dependencies: [] },
                { title: '执行任务', description: '执行主要工作', estimatedDuration: 90, priority: '高', skills: ['执行'], dependencies: ['准备工作'] },
                { title: '检查完善', description: '检查和完善结果', estimatedDuration: 30, priority: '中', skills: ['检查'], dependencies: ['执行任务'] }
            );
        }

        return {
            subTasks: subTasks,
            estimatedTotalDuration: subTasks.reduce((total, task) => total + task.estimatedDuration, 0)
        };
    }

    // 分析依赖关系
    analyzeDependencies(subTasks) {
        const dependencies = {};

        for (const task of subTasks) {
            dependencies[task.title] = task.dependencies || [];
        }

        return dependencies;
    }

    // 设置里程碑
    setMilestones(subTasks) {
        const milestones = [];
        const totalDuration = subTasks.reduce((total, task) => total + task.estimatedDuration, 0);
        let currentDuration = 0;

        for (let i = 0; i < subTasks.length; i++) {
            const task = subTasks[i];
            currentDuration += task.estimatedDuration;

            // 每完成25%设置一个里程碑
            if ((i + 1) % Math.ceil(subTasks.length / 4) === 0 || i === subTasks.length - 1) {
                milestones.push({
                    name: `里程碑 ${milestones.length + 1}`,
                    task: task.title,
                    progress: Math.round((currentDuration / totalDuration) * 100),
                    estimatedCompletion: currentDuration
                });
            }
        }

        return milestones;
    }

    // 获取任务分解历史
    getDecompositionHistory() {
        return this.decompositionData.decomposedTasks;
    }

    // 获取特定任务的分解结果
    getTaskDecomposition(taskId) {
        return this.decompositionData.decomposedTasks.find(
            decomposition => decomposition.originalTask.id === taskId
        );
    }

    // 更新子任务状态
    updateSubTaskStatus(decompositionId, subTaskTitle, status) {
        const decomposition = this.decompositionData.decomposedTasks.find(
            d => d.originalTask.id === decompositionId
        );

        if (decomposition) {
            const subTask = decomposition.subTasks.find(task => task.title === subTaskTitle);
            if (subTask) {
                subTask.status = status;
                subTask.completedAt = status === 'completed' ? Date.now() : null;
                this.saveDecompositionData();
            }
        }
    }

    // 计算分解进度
    calculateDecompositionProgress(decomposition) {
        if (!decomposition || !decomposition.subTasks) return 0;

        const completedTasks = decomposition.subTasks.filter(task => task.status === 'completed');
        return Math.round((completedTasks.length / decomposition.subTasks.length) * 100);
    }

    // 获取下一个可执行的子任务
    getNextExecutableTask(decomposition) {
        if (!decomposition || !decomposition.subTasks) return null;

        // 找到没有依赖或依赖已完成的子任务
        for (const subTask of decomposition.subTasks) {
            if (subTask.status === 'completed') continue;

            const dependencies = subTask.dependencies || [];
            const allDependenciesCompleted = dependencies.every(depTitle => {
                const depTask = decomposition.subTasks.find(task => task.title === depTitle);
                return depTask && depTask.status === 'completed';
            });

            if (allDependenciesCompleted) {
                return subTask;
            }
        }

        return null;
    }
}

// 初始化AI智能任务分解系统
const aiTaskDecomposer = new AITaskDecomposer();
window.AITaskDecomposer = AITaskDecomposer;
window.aiTaskDecomposer = aiTaskDecomposer;

// ==================== 智能任务分解前端管理 ====================

// 显示任务分解模态框
function showTaskDecompositionModal() {
    console.log('🔧 显示任务分解模态框');

    // 获取当前任务列表
    const tasks = getCurrentTasks();

    if (tasks.length === 0) {
        showNotification('暂无任务可分解，请先添加任务', 'info');
        return;
    }

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'task-decomposition-modal';
    renderSafeModuleMarkup(modal, `
        <div class="modal-overlay" data-decomposition-action="close-modal"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>🔧 智能任务分解</h3>
                <button class="modal-close" data-decomposition-action="close-modal">×</button>
            </div>
            <div class="modal-body">
                <div class="task-selection">
                    <h4>选择要分解的任务：</h4>
                    <div class="task-list" id="decomposition-task-list"></div>
                </div>
                <div id="decomposition-process" class="decomposition-process" style="display: none;">
                    <div class="process-step">
                        <div class="step-icon">🔍</div>
                        <div class="step-text">正在分析任务复杂度...</div>
                    </div>
                </div>
            </div>
        </div>
    `);

    document.body.appendChild(modal);
    const taskListEl = modal.querySelector('#decomposition-task-list');
    if (taskListEl) {
        tasks.forEach((task, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = `task-option ${getQuadrantFromPriority(task.priority)}`;
            itemEl.dataset.decompositionAction = 'select-task';
            itemEl.dataset.taskIndex = String(index);

            const textEl = document.createElement('div');
            textEl.className = 'task-text';
            textEl.textContent = task.text;

            const quadrantEl = document.createElement('div');
            quadrantEl.className = 'task-quadrant';
            quadrantEl.textContent = getQuadrantText(task.priority);

            itemEl.append(textEl, quadrantEl);
            taskListEl.appendChild(itemEl);
        });
    }
    modal.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-decomposition-action]');
        if (!actionEl || !modal.contains(actionEl)) return;

        const action = actionEl.dataset.decompositionAction;
        if (action === 'close-modal') {
            closeTaskDecompositionModal();
        } else if (action === 'select-task') {
            selectTaskForDecomposition(Number(actionEl.dataset.taskIndex));
        }
    });
}

// 关闭任务分解模态框
function closeTaskDecompositionModal() {
    const modal = document.querySelector('.task-decomposition-modal');
    if (modal) {
        modal.remove();
    }
}

// 选择任务进行分解
async function selectTaskForDecomposition(taskIndex) {
    const tasks = getCurrentTasks();
    const selectedTask = tasks[taskIndex];

    if (!selectedTask) {
        showNotification('任务不存在', 'error');
        return;
    }

    // 显示分解过程
    const processEl = document.getElementById('decomposition-process');
    if (processEl) {
        processEl.style.display = 'block';
    }

    try {
        // 开始任务分解
        updateDecompositionStatus('分析中...', '0%', '计算中...');

        const result = await aiTaskDecomposer.decomposeTask(selectedTask);

        if (result.shouldDecompose) {
            // 显示分解结果
            updateDecompositionStatus('已分解', '100%', `${Math.round(result.complexity * 100)}%`);
            displayDecompositionResults(result);
            showNotification('任务分解完成', 'success');
        } else {
            // 任务不需要分解
            updateDecompositionStatus('无需分解', '0%', `${Math.round(result.complexity * 100)}%`);
            showNotification(result.reason, 'info');
        }

        // 关闭模态框
        setTimeout(() => {
            closeTaskDecompositionModal();
        }, 2000);

    } catch (error) {
        console.error('❌ 任务分解失败:', error);
        showNotification('任务分解失败', 'error');
        updateDecompositionStatus('分解失败', '0%', '错误');
    }
}

// 更新分解状态显示
function updateDecompositionStatus(status, progress, complexity) {
    const statusEl = document.getElementById('decomposition-status');
    const progressEl = document.getElementById('decomposition-progress');
    const complexityEl = document.getElementById('task-complexity');

    if (statusEl) statusEl.textContent = status;
    if (progressEl) progressEl.textContent = progress;
    if (complexityEl) complexityEl.textContent = complexity;
}

// 显示分解结果
function displayDecompositionResults(result) {
    const resultsEl = document.getElementById('decomposition-results');
    const listEl = document.getElementById('decomposition-list');

    if (!resultsEl || !listEl) return;

    // 显示结果区域
    resultsEl.style.display = 'block';

    listEl.replaceChildren();
    result.subTasks.forEach(subTask => {
        const itemEl = document.createElement('div');
        itemEl.className = 'decomposition-item';

        const iconEl = document.createElement('span');
        iconEl.className = 'decomposition-icon';
        iconEl.textContent = getSubTaskIcon(subTask.priority);

        const contentEl = document.createElement('div');
        contentEl.className = 'decomposition-content';

        const titleEl = document.createElement('div');
        titleEl.className = 'decomposition-title';
        titleEl.textContent = subTask.title || '';

        const descriptionEl = document.createElement('div');
        descriptionEl.className = 'decomposition-description';
        descriptionEl.textContent = subTask.description || '';

        const metaEl = document.createElement('div');
        metaEl.className = 'decomposition-meta';
        const durationEl = document.createElement('span');
        durationEl.className = 'decomposition-duration';
        durationEl.textContent = `${subTask.estimatedDuration || 0}分钟`;
        const priorityEl = document.createElement('span');
        const priorityClass = subTask.priority === '高' ? 'high' : subTask.priority === '中' ? 'medium' : 'low';
        priorityEl.className = `decomposition-priority priority-${priorityClass}`;
        priorityEl.textContent = `${subTask.priority || '低'}优先级`;
        metaEl.append(durationEl, priorityEl);

        contentEl.append(titleEl, descriptionEl, metaEl);

        if (subTask.skills && subTask.skills.length > 0) {
            const skillsEl = document.createElement('div');
            skillsEl.className = 'decomposition-skills';
            subTask.skills.forEach(skill => {
                const skillEl = document.createElement('span');
                skillEl.className = 'skill-tag';
                skillEl.textContent = skill;
                skillsEl.appendChild(skillEl);
            });
            contentEl.appendChild(skillsEl);
        }

        if (subTask.dependencies && subTask.dependencies.length > 0) {
            const dependenciesEl = document.createElement('div');
            dependenciesEl.className = 'decomposition-dependencies';
            dependenciesEl.appendChild(document.createTextNode('依赖：'));
            subTask.dependencies.forEach(dep => {
                const depEl = document.createElement('span');
                depEl.className = 'dependency-item';
                depEl.textContent = dep;
                dependenciesEl.appendChild(depEl);
            });
            contentEl.appendChild(dependenciesEl);
        }

        itemEl.append(iconEl, contentEl);
        listEl.appendChild(itemEl);
    });

    // 分解结果已在模态框中显示，无需滚动
}

// 获取象限标签
function getQuadrantLabel(quadrant) {
    const labels = {
        'urgent-important': '重要且紧急',
        'important-not-urgent': '重要不紧急',
        'urgent-not-important': '紧急不重要',
        'not-urgent-not-important': '不重要不紧急'
    };
    return labels[quadrant] || '未分类';
}

// 获取子任务图标
function getSubTaskIcon(priority) {
    const icons = {
        '高': '🔥',
        '中': '⭐',
        '低': '📋'
    };
    return icons[priority] || '📋';
}

// 查看分解历史
function viewDecompositionHistory() {
    console.log('📋 查看分解历史');

    const history = aiTaskDecomposer.getDecompositionHistory();

    if (history.length === 0) {
        showNotification('暂无分解历史', 'info');
        return;
    }

    // 先显示分解结果区域
    const resultsEl = document.getElementById('decomposition-results');
    if (resultsEl) {
        resultsEl.style.display = 'block';

        // 分解结果已在模态框中显示，无需滚动
    }

    // 创建历史模态框
    const modal = document.createElement('div');
    modal.className = 'decomposition-history-modal';
    renderSafeModuleMarkup(modal, `
        <div class="modal-overlay" data-decomposition-action="close-history"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>📋 分解历史</h3>
                <button class="modal-close" data-decomposition-action="close-history">×</button>
            </div>
            <div class="modal-body">
                <div class="history-list" id="decomposition-history-list"></div>
            </div>
        </div>
    `);

    document.body.appendChild(modal);
    const historyListEl = modal.querySelector('#decomposition-history-list');
    if (historyListEl) {
        history.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'history-item';

            const titleEl = document.createElement('div');
            titleEl.className = 'history-title';
            titleEl.textContent = item.originalTask?.text || '';

            const metaEl = document.createElement('div');
            metaEl.className = 'history-meta';
            const subTaskCountEl = document.createElement('span');
            subTaskCountEl.textContent = `子任务数：${item.subTasks?.length || 0}`;
            const totalDurationEl = document.createElement('span');
            totalDurationEl.textContent = `总时长：${item.estimatedTotalDuration || 0}分钟`;
            const complexityEl = document.createElement('span');
            complexityEl.textContent = `复杂度：${Math.round((item.complexity || 0) * 100)}%`;
            metaEl.append(subTaskCountEl, totalDurationEl, complexityEl);

            itemEl.append(titleEl, metaEl);
            historyListEl.appendChild(itemEl);
        });
    }
    modal.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-decomposition-action="close-history"]');
        if (!actionEl || !modal.contains(actionEl)) return;
        closeDecompositionHistoryModal();
    });
}

// 关闭分解历史模态框
function closeDecompositionHistoryModal() {
    const modal = document.querySelector('.decomposition-history-modal');
    if (modal) {
        modal.remove();
    }
}

// 查看分解设置
function viewDecompositionSettings() {
    console.log('⚙️ 查看分解设置');

    // 创建分解设置模态框
    const modal = document.createElement('div');
    modal.className = 'decomposition-settings-modal';
    renderSafeModuleMarkup(modal, `
        <div class="modal-overlay" data-decomposition-action="close-settings"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>⚙️ 分解设置</h3>
                <button class="modal-close" data-decomposition-action="close-settings">×</button>
            </div>
            <div class="modal-body">
                <div class="settings-tabs">
                    <button class="tab-btn active" data-decomposition-action="switch-tab" data-tab="rules">分解规则</button>
                    <button class="tab-btn" data-decomposition-action="switch-tab" data-tab="ai">AI配置</button>
                    <button class="tab-btn" data-decomposition-action="switch-tab" data-tab="output">输出格式</button>
                    <button class="tab-btn" data-decomposition-action="switch-tab" data-tab="history">历史管理</button>
                </div>

                <!-- 分解规则设置 -->
                <div id="rules-settings" class="settings-panel active">
                    <h4>🔧 分解规则配置</h4>
                    <div class="setting-group">
                        <label for="max-subtasks">最大子任务数：</label>
                        <input type="number" id="max-subtasks" min="2" max="20" value="8">
                        <small>控制单个任务最多分解为多少个子任务</small>
                    </div>
                    <div class="setting-group">
                        <label for="min-duration">最小任务时长（分钟）：</label>
                        <input type="number" id="min-duration" min="5" max="60" value="15">
                        <small>任务分解后，子任务的最短时长</small>
                    </div>
                    <div class="setting-group">
                        <label for="max-duration">最大任务时长（分钟）：</label>
                        <input type="number" id="max-duration" min="60" max="480" value="240">
                        <small>任务分解后，子任务的最长时长</small>
                    </div>
                    <div class="setting-group">
                        <label for="complexity-threshold">复杂度阈值：</label>
                        <input type="range" id="complexity-threshold" min="0.1" max="1" step="0.1" value="0.7">
                        <span id="complexity-value">0.7</span>
                        <small>超过此阈值的任务才会被分解</small>
                    </div>
                </div>

                <!-- AI配置设置 -->
                <div id="ai-settings" class="settings-panel">
                    <h4>🤖 AI配置</h4>
                    <div class="setting-group">
                        <label for="ai-model">分解算法：</label>
                        <select id="ai-model">
                            <option value="smart">智能分解</option>
                            <option value="hierarchical">层级分解</option>
                            <option value="time-based">时间分解</option>
                            <option value="priority-based">优先级分解</option>
                        </select>
                        <small>选择任务分解的算法策略</small>
                    </div>
                    <div class="setting-group">
                        <label for="decomposition-depth">分解深度：</label>
                        <select id="decomposition-depth">
                            <option value="shallow">浅层分解（2-3层）</option>
                            <option value="medium" selected>中等分解（3-4层）</option>
                            <option value="deep">深度分解（4-5层）</option>
                        </select>
                        <small>控制任务分解的层级深度</small>
                    </div>
                    <div class="setting-group">
                        <label for="auto-dependencies">自动依赖分析：</label>
                        <input type="checkbox" id="auto-dependencies" checked>
                        <small>自动分析子任务之间的依赖关系</small>
                    </div>
                </div>

                <!-- 输出格式设置 -->
                <div id="output-settings" class="settings-panel">
                    <h4>📄 输出格式</h4>
                    <div class="setting-group">
                        <label for="output-format">分解结果格式：</label>
                        <select id="output-format">
                            <option value="hierarchical" selected>层级结构</option>
                            <option value="list">列表形式</option>
                            <option value="timeline">时间线</option>
                            <option value="mindmap">思维导图</option>
                        </select>
                        <small>选择分解结果的显示格式</small>
                    </div>
                    <div class="setting-group">
                        <label for="include-milestones">包含里程碑：</label>
                        <input type="checkbox" id="include-milestones" checked>
                        <small>在分解结果中标记重要里程碑</small>
                    </div>
                    <div class="setting-group">
                        <label for="show-dependencies">显示依赖关系：</label>
                        <input type="checkbox" id="show-dependencies" checked>
                        <small>在分解结果中显示任务依赖关系</small>
                    </div>
                    <div class="setting-group">
                        <label for="export-format">导出格式：</label>
                        <select id="export-format">
                            <option value="json" selected>JSON</option>
                            <option value="csv">CSV</option>
                            <option value="markdown">Markdown</option>
                            <option value="excel">Excel</option>
                        </select>
                        <small>选择分解结果的导出格式</small>
                    </div>
                </div>

                <!-- 历史管理设置 -->
                <div id="history-settings" class="settings-panel">
                    <h4>📚 历史管理</h4>
                    <div class="setting-group">
                        <label for="history-retention">历史保留时间：</label>
                        <select id="history-retention">
                            <option value="7">7天</option>
                            <option value="30" selected>30天</option>
                            <option value="90">90天</option>
                            <option value="365">1年</option>
                            <option value="0">永久保留</option>
                        </select>
                        <small>设置分解历史的自动清理时间</small>
                    </div>
                    <div class="setting-group">
                        <label for="auto-cleanup">自动清理：</label>
                        <input type="checkbox" id="auto-cleanup" checked>
                        <small>自动清理过期的分解历史</small>
                    </div>
                    <div class="setting-group">
                        <label for="max-history-items">最大历史记录数：</label>
                        <input type="number" id="max-history-items" min="10" max="1000" value="100">
                        <small>限制保存的分解历史数量</small>
                    </div>
                    <div class="setting-group">
                        <button class="btn-secondary" data-decomposition-action="clear-history">清空历史记录</button>
                        <button class="btn-secondary" data-decomposition-action="export-history">导出历史</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" data-decomposition-action="reset-settings">重置默认</button>
                <button class="btn-secondary" data-decomposition-action="close-settings">取消</button>
                <button class="btn-primary" data-decomposition-action="save-settings">保存设置</button>
            </div>
        </div>
    `);

    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-decomposition-action]');
        if (!actionEl || !modal.contains(actionEl)) return;

        const action = actionEl.dataset.decompositionAction;
        if (action === 'close-settings') {
            closeDecompositionSettings();
        } else if (action === 'switch-tab') {
            switchSettingsTab(actionEl.dataset.tab);
        } else if (action === 'clear-history') {
            clearDecompositionHistory();
        } else if (action === 'export-history') {
            exportDecompositionHistory();
        } else if (action === 'reset-settings') {
            resetDecompositionSettings();
        } else if (action === 'save-settings') {
            saveDecompositionSettings();
        }
    });

    // 加载当前设置
    loadDecompositionSettings();

    // 绑定复杂度滑块事件
    const complexitySlider = document.getElementById('complexity-threshold');
    const complexityValue = document.getElementById('complexity-value');
    if (complexitySlider && complexityValue) {
        complexitySlider.addEventListener('input', function () {
            complexityValue.textContent = this.value;
        });
    }
}

// 关闭分解设置模态框
function closeDecompositionSettings() {
    const modal = document.querySelector('.decomposition-settings-modal');
    if (modal) {
        modal.remove();
    }
}

// 切换设置标签页
function switchSettingsTab(tabName) {
    // 移除所有标签页的激活状态
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));

    // 激活选中的标签页
    const activeBtn = document.querySelector(`[data-decomposition-action="switch-tab"][data-tab="${tabName}"]`);
    const activePanel = document.getElementById(`${tabName}-settings`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');
}

// 加载分解设置
function loadDecompositionSettings() {
    try {
        // 从AITaskDecomposer获取设置
        const settings = aiTaskDecomposer.getSettings();

        // 加载分解规则设置
        if (settings.maxSubTasks !== undefined) {
            document.getElementById('max-subtasks').value = settings.maxSubTasks;
        }
        if (settings.minTaskDuration !== undefined) {
            document.getElementById('min-duration').value = settings.minTaskDuration;
        }
        if (settings.maxTaskDuration !== undefined) {
            document.getElementById('max-duration').value = settings.maxTaskDuration;
        }
        if (settings.complexityThreshold !== undefined) {
            document.getElementById('complexity-threshold').value = settings.complexityThreshold;
            document.getElementById('complexity-value').textContent = settings.complexityThreshold;
        }

        // 加载AI配置设置
        if (settings.aiModel !== undefined) {
            document.getElementById('ai-model').value = settings.aiModel;
        }
        if (settings.decompositionDepth !== undefined) {
            document.getElementById('decomposition-depth').value = settings.decompositionDepth;
        }
        if (settings.autoDependencies !== undefined) {
            document.getElementById('auto-dependencies').checked = settings.autoDependencies;
        }

        // 加载输出格式设置
        if (settings.outputFormat !== undefined) {
            document.getElementById('output-format').value = settings.outputFormat;
        }
        if (settings.includeMilestones !== undefined) {
            document.getElementById('include-milestones').checked = settings.includeMilestones;
        }
        if (settings.showDependencies !== undefined) {
            document.getElementById('show-dependencies').checked = settings.showDependencies;
        }
        if (settings.exportFormat !== undefined) {
            document.getElementById('export-format').value = settings.exportFormat;
        }

        // 加载历史管理设置
        if (settings.historyRetention !== undefined) {
            document.getElementById('history-retention').value = settings.historyRetention;
        }
        if (settings.autoCleanup !== undefined) {
            document.getElementById('auto-cleanup').checked = settings.autoCleanup;
        }
        if (settings.maxHistoryItems !== undefined) {
            document.getElementById('max-history-items').value = settings.maxHistoryItems;
        }

        console.log('✅ 分解设置加载完成');
    } catch (error) {
        console.error('❌ 加载分解设置失败:', error);
    }
}

// 保存分解设置
function saveDecompositionSettings() {
    try {
        const settings = {
            // 分解规则
            maxSubTasks: parseInt(document.getElementById('max-subtasks').value),
            minTaskDuration: parseInt(document.getElementById('min-duration').value),
            maxTaskDuration: parseInt(document.getElementById('max-duration').value),
            complexityThreshold: parseFloat(document.getElementById('complexity-threshold').value),

            // AI配置
            aiModel: document.getElementById('ai-model').value,
            decompositionDepth: document.getElementById('decomposition-depth').value,
            autoDependencies: document.getElementById('auto-dependencies').checked,

            // 输出格式
            outputFormat: document.getElementById('output-format').value,
            includeMilestones: document.getElementById('include-milestones').checked,
            showDependencies: document.getElementById('show-dependencies').checked,
            exportFormat: document.getElementById('export-format').value,

            // 历史管理
            historyRetention: parseInt(document.getElementById('history-retention').value),
            autoCleanup: document.getElementById('auto-cleanup').checked,
            maxHistoryItems: parseInt(document.getElementById('max-history-items').value),

            // 保存时间
            lastUpdated: new Date().toISOString()
        };

        if (window.AIAssistantStorage) {
            window.AIAssistantStorage.setDecompositionSettings(settings);
        } else {
            console.warn('AIAssistantStorage is unavailable; decomposition settings were not persisted.');
        }

        // 更新AI任务分解系统的设置
        if (typeof aiTaskDecomposer !== 'undefined') {
            aiTaskDecomposer.updateSettings(settings);
        }

        showNotification('分解设置已保存', 'success');
        closeDecompositionSettings();

        console.log('✅ 分解设置保存完成:', settings);
    } catch (error) {
        console.error('❌ 保存分解设置失败:', error);
        showNotification('保存设置失败', 'error');
    }
}

// 重置分解设置为默认值
function resetDecompositionSettings() {
    if (confirm('确定要重置所有分解设置为默认值吗？')) {
        try {
            // 重置为默认值
            document.getElementById('max-subtasks').value = 8;
            document.getElementById('min-duration').value = 15;
            document.getElementById('max-duration').value = 240;
            document.getElementById('complexity-threshold').value = 0.7;
            document.getElementById('complexity-value').textContent = '0.7';

            document.getElementById('ai-model').value = 'smart';
            document.getElementById('decomposition-depth').value = 'medium';
            document.getElementById('auto-dependencies').checked = true;

            document.getElementById('output-format').value = 'hierarchical';
            document.getElementById('include-milestones').checked = true;
            document.getElementById('show-dependencies').checked = true;
            document.getElementById('export-format').value = 'json';

            document.getElementById('history-retention').value = 30;
            document.getElementById('auto-cleanup').checked = true;
            document.getElementById('max-history-items').value = 100;

            showNotification('设置已重置为默认值', 'info');
            console.log('✅ 分解设置已重置为默认值');
        } catch (error) {
            console.error('❌ 重置分解设置失败:', error);
        }
    }
}

// 清空分解历史
function clearDecompositionHistory() {
    if (confirm('确定要清空所有分解历史记录吗？此操作不可恢复！')) {
        try {
            if (typeof aiTaskDecomposer !== 'undefined') {
                aiTaskDecomposer.clearHistory();
            }
            showNotification('分解历史已清空', 'success');
            console.log('✅ 分解历史已清空');
        } catch (error) {
            console.error('❌ 清空分解历史失败:', error);
            showNotification('清空历史失败', 'error');
        }
    }
}

// 导出分解历史
function exportDecompositionHistory() {
    try {
        if (typeof aiTaskDecomposer !== 'undefined') {
            const history = aiTaskDecomposer.getDecompositionHistory();
            const exportFormat = document.getElementById('export-format').value;

            if (history.length === 0) {
                showNotification('暂无分解历史可导出', 'info');
                return;
            }

            let exportData = '';
            const timestamp = new Date().toISOString().split('T')[0];

            switch (exportFormat) {
                case 'json':
                    exportData = JSON.stringify(history, null, 2);
                    break;
                case 'csv':
                    exportData = convertHistoryToCSV(history);
                    break;
                case 'markdown':
                    exportData = convertHistoryToMarkdown(history);
                    break;
                default:
                    exportData = JSON.stringify(history, null, 2);
            }

            // 下载文件
            const blob = new Blob([exportData], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `decomposition-history-${timestamp}.${exportFormat}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showNotification('分解历史导出成功', 'success');
            console.log('✅ 分解历史导出完成');
        } else {
            showNotification('分解系统未初始化', 'error');
        }
    } catch (error) {
        console.error('❌ 导出分解历史失败:', error);
        showNotification('导出历史失败', 'error');
    }
}

// 转换历史为CSV格式
function convertHistoryToCSV(history) {
    const headers = ['时间', '任务名称', '分解状态', '子任务数', '复杂度', '算法'];
    const rows = history.map(item => [
        item.timestamp,
        item.taskName,
        item.status,
        item.subTaskCount || 0,
        item.complexity || 0,
        item.algorithm || 'smart'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// 转换历史为Markdown格式
function convertHistoryToMarkdown(history) {
    let markdown = '# 分解历史记录\n\n';

    history.forEach((item, index) => {
        markdown += `## ${index + 1}. ${item.taskName}\n\n`;
        markdown += `- **时间**: ${item.timestamp}\n`;
        markdown += `- **状态**: ${item.status}\n`;
        markdown += `- **子任务数**: ${item.subTaskCount || 0}\n`;
        markdown += `- **复杂度**: ${item.complexity || 0}\n`;
        markdown += `- **算法**: ${item.algorithm || 'smart'}\n\n`;
    });

    return markdown;
}

window.showTaskDecompositionModal = showTaskDecompositionModal;
window.closeTaskDecompositionModal = closeTaskDecompositionModal;
window.selectTaskForDecomposition = selectTaskForDecomposition;
window.viewDecompositionHistory = viewDecompositionHistory;
window.closeDecompositionHistoryModal = closeDecompositionHistoryModal;
window.viewDecompositionSettings = viewDecompositionSettings;
window.closeDecompositionSettings = closeDecompositionSettings;
window.switchSettingsTab = switchSettingsTab;
window.saveDecompositionSettings = saveDecompositionSettings;
window.resetDecompositionSettings = resetDecompositionSettings;
window.clearDecompositionHistory = clearDecompositionHistory;
window.exportDecompositionHistory = exportDecompositionHistory;
