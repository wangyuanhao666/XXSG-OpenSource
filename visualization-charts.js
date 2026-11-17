/**
 * 可视化图表模块
 * 实现任务分类统计、效率趋势分析、工作分布分析三大图表功能
 * @version 1.0.5
 * @date 2026-01-26
 * @changelog
 *   - 修复 toggleTaskCompletion 的 DOM 选择器错误
 *   - 修复模态框滚动和灰色显示问题，优化 z-index 层级
 *   - 修复 getAllTasks 方法，优先从 window.tasks 获取最新数据
 *   - 修复效率趋势分析，使用真实任务数据而非模拟数据
 *   - 支持用户特定的存储键（tasks_${userId}）
 *   - 修改任务分类统计为已完成/未完成筛选按钮
 *   - 更新柱状图颜色与四象限颜色一致（红/橙/蓝/灰）
 *   - 添加双击查看详情功能，支持模态框显示任务列表
 *   - 优化图表布局和交互体验
 */

// ========== 数据管理器 ==========
function appendSanitizedChartMarkup(container, markup) {
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
    container.append(...[...root.childNodes].map(node => document.importNode(node, true)));
}

function chartI18nText(text) {
    const value = String(text);
    const lang = localStorage.getItem('language') || document.documentElement.lang || 'zh-CN';
    const isEnglish = String(lang).toLowerCase().startsWith('en');
    const zhChartLabelMap = {
        'Important & Urgent': '重要且紧急',
        'Important & Not Urgent': '重要不紧急',
        'Not Important & Urgent': '不重要但紧急',
        'Not Important & Not Urgent': '不重要不紧急',
        'Other': '其他',
        'Work': '工作',
        'Study': '学习',
        'Health': '健康',
        'Planning': '规划',
        'Development': '开发',
        'Maintenance': '维护'
    };
    const enChartLabelMap = {
        '重要且紧急': 'Important & Urgent',
        '重要不紧急': 'Important & Not Urgent',
        '不重要但紧急': 'Not Important & Urgent',
        '不重要不紧急': 'Not Important & Not Urgent',
        '其他': 'Other',
        '工作': 'Work',
        '学习': 'Study',
        '健康': 'Health',
        '规划': 'Planning',
        '开发': 'Development',
        '维护': 'Maintenance'
    };
    if (!isEnglish) return zhChartLabelMap[value] || value;
    if (enChartLabelMap[value]) return enChartLabelMap[value];
    return window.XXSG_I18N?.translateString ? window.XXSG_I18N.translateString(value) : value;
}

const ChartDataManager = {
    // 当前任务筛选状态：'completed' | 'incomplete' | null(显示全部)
    currentTaskFilter: null,

    /**
     * 切换任务完成状态筛选
     * @param {string} filter - 'completed' | 'incomplete' | null
     */
    setTaskFilter(filter) {
        this.currentTaskFilter = filter;
        console.log('📊 切换任务筛选:', filter);
    },

    /**
     * 获取任务分类数据（用于柱形图）
     * @returns {Object} 图表数据
     */
    getTaskCategoryData() {
        try {
            // 获取所有任务
            let tasks = this.getAllTasks();

            console.log('📊 任务分类统计 - 原始任务数:', tasks.length);
            console.log('📊 当前筛选:', this.currentTaskFilter);

            // 根据筛选条件过滤任务
            if (this.currentTaskFilter === 'completed') {
                tasks = tasks.filter(t => t.completed);
                console.log('📊 筛选后（已完成）:', tasks.length, '个');
            } else if (this.currentTaskFilter === 'incomplete') {
                tasks = tasks.filter(t => !t.completed);
                console.log('📊 筛选后（未完成）:', tasks.length, '个');
            }

            // 按象限分类 - 使用四象限的实际颜色
            const categories = {
                quadrant1: {
                    label: '重要且紧急',
                    tasks: [],
                    color: '#ef4444', // 红色 - Q1
                    bgAlpha: 'rgba(239, 68, 68, 0.8)',
                    bgAlphaLight: 'rgba(239, 68, 68, 0.3)'
                },
                quadrant2: {
                    label: '重要不紧急',
                    tasks: [],
                    color: '#f59e0b', // 橙色 - Q2
                    bgAlpha: 'rgba(245, 158, 11, 0.8)',
                    bgAlphaLight: 'rgba(245, 158, 11, 0.3)'
                },
                quadrant3: {
                    label: '不重要紧急',
                    tasks: [],
                    color: '#3b82f6', // 蓝色 - Q3
                    bgAlpha: 'rgba(59, 130, 246, 0.8)',
                    bgAlphaLight: 'rgba(59, 130, 246, 0.3)'
                },
                quadrant4: {
                    label: '不重要不紧急',
                    tasks: [],
                    color: '#22c55e', // 绿色 - Q4
                    bgAlpha: 'rgba(34, 197, 94, 0.8)',
                    bgAlphaLight: 'rgba(34, 197, 94, 0.3)'
                }
            };

            // 分类任务 - 支持多种字段名
            tasks.forEach(task => {
                // 尝试不同的字段名：priority, quadrant, priorityLevel
                let quadrant = 1;

                if (task.quadrant !== undefined) {
                    quadrant = parseInt(task.quadrant);
                } else if (task.priority !== undefined) {
                    quadrant = parseInt(task.priority);
                } else if (task.priorityLevel !== undefined) {
                    quadrant = parseInt(task.priorityLevel);
                }

                // 确保 quadrant 在 1-4 范围内
                if (quadrant < 1 || quadrant > 4 || isNaN(quadrant)) {
                    quadrant = 1; // 默认为重要紧急
                }

                const key = `quadrant${quadrant}`;
                if (categories[key]) {
                    categories[key].tasks.push(task);
                }
            });

            // 调试输出
            Object.keys(categories).forEach(key => {
                console.log(`📊 ${categories[key].label}: ${categories[key].tasks.length}个任务`);
            });

            // 返回标签和数据
            const labels = Object.values(categories).map(c => chartI18nText(c.label));
            const data = Object.values(categories).map(c => c.tasks.length);
            const colors = Object.values(categories).map(c => c.bgAlpha);
            const borderColors = Object.values(categories).map(c => c.color);

            console.log('📊 任务分类数据:', {
                labels,
                data,
                filter: this.currentTaskFilter
            });

            return {
                labels,
                data,
                backgroundColors: colors,
                borderColors: borderColors,
                categories: Object.values(categories).map(c => ({
                    label: chartI18nText(c.label),
                    tasks: c.tasks,
                    color: c.color
                }))
            };

        } catch (error) {
            console.error('获取任务分类数据失败:', error);
            return {
                labels: [],
                data: [],
                backgroundColors: [],
                borderColors: [],
                categories: []
            };
        }
    },

    /**
     * 获取效率趋势数据（用于折线图）
     * @param {number} days - 天数
     * @returns {Object} 图表数据
     */
    getEfficiencyTrendData(days = 30) {
        try {
            const labels = [];
            const data = [];

            // 生成日期标签和数据
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = this.formatDate(date);
                labels.push(dateStr);

                // 获取当日效率数据
                const dayData = this.getDayData(dateStr);
                data.push(dayData.efficiency || 0);
            }

            return { labels, data, days };

        } catch (error) {
            console.error('获取效率趋势数据失败:', error);
            return { labels: [], data: [], days };
        }
    },

    /**
     * 获取工作分布数据（用于饼图）
     * @param {string} type - 'category' 按分类 | 'quadrant' 按象限 | 'status' 按状态
     * @returns {Object} 图表数据
     */
    getWorkDistributionData(type = 'category') {
        try {
            const tasks = this.getAllTasks();
            const distribution = {};
            const taskLists = []; // 存储每个分类对应的任务列表

            console.log('🍰 工作分布分析 - 任务数:', tasks.length);
            console.log('🍰 工作分布类型:', type);

            if (type === 'category') {
                // 按自定义分类 - 支持多种字段名
                const categories = {};
                const categoryTasks = {};

                tasks.forEach(task => {
                    // 尝试不同的字段名：tag, category, type, labels
                    const tag = task.tag || task.category || task.type || task.labels?.[0] || '未分类';
                    categories[tag] = (categories[tag] || 0) + 1;
                    if (!categoryTasks[tag]) categoryTasks[tag] = [];
                    categoryTasks[tag].push(task);
                });

                // 如果所有任务都是"未分类"，使用象限分类
                if (Object.keys(categories).length === 1 && categories['未分类'] === tasks.length) {
                    console.log('🍰 任务无分类标签，改用象限分布');
                    // 自动切换到象限模式
                    return this.getWorkDistributionData('quadrant');
                }

                Object.assign(distribution, categories);
                Object.keys(categories).forEach(key => {
                    taskLists.push(categoryTasks[key]);
                });

            } else if (type === 'quadrant') {
                // 按象限统计 - 支持多种字段名
                let getQuadrant = (t) => {
                    if (t.quadrant !== undefined) return parseInt(t.quadrant);
                    if (t.priority !== undefined) return parseInt(t.priority);
                    if (t.priorityLevel !== undefined) return parseInt(t.priorityLevel);
                    return 1;
                };

                distribution['重要紧急'] = tasks.filter(t => getQuadrant(t) == 1).length;
                distribution['重要不紧急'] = tasks.filter(t => getQuadrant(t) == 2).length;
                distribution['不重要紧急'] = tasks.filter(t => getQuadrant(t) == 3).length;
                distribution['不重要不紧急'] = tasks.filter(t => getQuadrant(t) == 4).length;

                taskLists.push(
                    tasks.filter(t => getQuadrant(t) == 1),
                    tasks.filter(t => getQuadrant(t) == 2),
                    tasks.filter(t => getQuadrant(t) == 3),
                    tasks.filter(t => getQuadrant(t) == 4)
                );

            } else if (type === 'status') {
                // 按状态统计
                distribution['已完成'] = tasks.filter(t => t.completed).length;
                distribution['进行中'] = tasks.filter(t => !t.completed).length;

                taskLists.push(
                    tasks.filter(t => t.completed),
                    tasks.filter(t => !t.completed)
                );
            }

            const labels = Object.keys(distribution);
            const data = Object.values(distribution);

            console.log('🍰 工作分布原始数据:', { labels, data });

            // 过滤掉数据为0的项
            const filteredLabels = [];
            const filteredData = [];
            const filteredTaskLists = [];

            labels.forEach((label, i) => {
                if (data[i] > 0) {
                    filteredLabels.push(label);
                    filteredData.push(data[i]);
                    filteredTaskLists.push(taskLists[i] || []);
                }
            });

            // 如果过滤后为空，返回所有数据
            const finalLabels = filteredLabels.length > 0 ? filteredLabels : labels;
            const finalData = filteredData.length > 0 ? filteredData : data;
            const finalTaskLists = filteredTaskLists.length > 0 ? filteredTaskLists : taskLists;

            // 配色方案 - 根据类型选择颜色
            let colors;

            if (type === 'quadrant') {
                // 象限模式：使用与柱状图一致的颜色
                const quadrantColorMap = {
                    '重要紧急': 'rgba(239, 68, 68, 0.8)',      // 红色 - Q1
                    '重要不紧急': 'rgba(245, 158, 11, 0.8)',   // 黄色 - Q2
                    '不重要紧急': 'rgba(59, 130, 246, 0.8)',   // 蓝色 - Q3
                    '不重要不紧急': 'rgba(34, 197, 94, 0.8)'   // 绿色 - Q4
                };

                // 按照象限顺序分配颜色
                colors = finalLabels.map(label => quadrantColorMap[label] || 'rgba(156, 163, 175, 0.8)');
            } else if (type === 'status') {
                // 状态模式：已完成用绿色，进行中用橙色
                const statusColorMap = {
                    '已完成': 'rgba(34, 197, 94, 0.8)',
                    '进行中': 'rgba(245, 158, 11, 0.8)'
                };
                colors = finalLabels.map(label => statusColorMap[label] || 'rgba(156, 163, 175, 0.8)');
            } else {
                // 分类模式：使用通用彩色方案
                const defaultColors = [
                    'rgba(102, 126, 234, 0.8)',   // 蓝紫色
                    'rgba(16, 185, 129, 0.8)',    // 绿色
                    'rgba(245, 158, 11, 0.8)',    // 黄色
                    'rgba(239, 68, 68, 0.8)',     // 红色
                    'rgba(139, 92, 246, 0.8)',    // 紫色
                    'rgba(236, 72, 153, 0.8)',    // 粉色
                    'rgba(6, 182, 212, 0.8)',     // 青色
                    'rgba(251, 146, 60, 0.8)'     // 橙色
                ];
                colors = defaultColors.slice(0, finalLabels.length);
            }

            const result = {
                labels: finalLabels.map(label => chartI18nText(label)),
                data: finalData,
                colors,
                type,
                taskLists: finalTaskLists, // 添加任务列表
                colorMap: type === 'quadrant' || type === 'status' ?
                    // 为象限和状态模式创建标签到颜色的映射
                    Object.fromEntries(finalLabels.map((label, i) => [label, colors[i]])) :
                    null
            };

            console.log('🍰 工作分布最终数据:', result);

            return result;

        } catch (error) {
            console.error('获取工作分布数据失败:', error);
            return {
                labels: [chartI18nText('暂无数据')],
                data: [1],
                colors: ['rgba(156, 163, 175, 0.8)'],
                type,
                taskLists: [[]]
            };
        }
    },

    /**
     * 获取所有任务
     * @returns {Array} 任务列表
     */
    getAllTasks() {
        try {
            console.log('🔍 开始获取任务数据...');

            let tasks = [];

            // 方式1: 优先从全局变量获取（script.js 同步的最新数据）
            if (typeof window.tasks !== 'undefined' && Array.isArray(window.tasks) && window.tasks.length > 0) {
                tasks = window.tasks;
                console.log('✅ 从全局变量 window.tasks 获取任务:', tasks.length, '个');
                return tasks;
            }

            // 方式2: 尝试从用户特定的 localStorage 键获取
            if (typeof window.currentUser !== 'undefined' && window.currentUser) {
                const userId = window.currentUser.id;
                const keysToTry = [`tasks_${userId}`, 'tasks'];

                for (const key of keysToTry) {
                    const storedTasks = localStorage.getItem(key);
                    if (storedTasks) {
                        try {
                            tasks = JSON.parse(storedTasks);
                            if (tasks.length > 0) {
                                console.log(`✅ 从 localStorage[${key}] 获取任务:`, tasks.length, '个');
                                return tasks;
                            }
                        } catch (parseError) {
                            console.warn(`解析 localStorage[${key}] 失败:`, parseError);
                        }
                    }
                }
            }

            // 方式3: 尝试通用的 'tasks' 键（未登录情况）
            if (tasks.length === 0) {
                const storedTasks = localStorage.getItem('tasks');
                if (storedTasks) {
                    try {
                        tasks = JSON.parse(storedTasks);
                        console.log('✅ 从 localStorage[tasks] 获取任务:', tasks.length, '个');
                    } catch (parseError) {
                        console.error('解析 localStorage[tasks] 失败:', parseError);
                    }
                }
            }

            console.log('📊 总任务数:', tasks.length);

            // 如果还是没有数据，生成测试数据
            if (tasks.length === 0) {
                console.warn('⚠️ 未找到任务数据，生成测试数据用于演示');
                tasks = this.generateTestData();
            }

            return Array.isArray(tasks) ? tasks : [];

        } catch (error) {
            console.error('❌ 获取任务失败:', error);
            return this.generateTestData(); // 出错时也返回测试数据
        }
    },

    /**
     * 生成测试数据
     * @returns {Array} 测试任务列表
     */
    generateTestData() {
        console.log('🧪 生成测试数据...');
        const testTasks = [
            { id: 1, title: '完成项目报告', priority: 1, completed: true, tag: '工作', createdAt: new Date().toISOString() },
            { id: 2, title: '团队会议', priority: 2, completed: true, tag: '工作', createdAt: new Date().toISOString() },
            { id: 3, title: '客户沟通', priority: 1, completed: false, tag: '工作', createdAt: new Date().toISOString() },
            { id: 4, title: '代码审查', priority: 3, completed: true, tag: '开发', createdAt: new Date().toISOString() },
            { id: 5, title: '文档整理', priority: 4, completed: false, tag: '其他', createdAt: new Date().toISOString() },
            { id: 6, title: '需求分析', priority: 2, completed: true, tag: '规划', createdAt: new Date().toISOString() },
            { id: 7, title: '技术调研', priority: 2, completed: true, tag: '学习', createdAt: new Date().toISOString() },
            { id: 8, title: '邮件回复', priority: 3, completed: false, tag: '工作', createdAt: new Date().toISOString() },
            { id: 9, title: '系统备份', priority: 4, completed: true, tag: '维护', createdAt: new Date().toISOString() },
            { id: 10, title: '学习新技术', priority: 2, completed: false, tag: '学习', createdAt: new Date().toISOString() },
            { id: 11, title: '健身运动', priority: 3, completed: true, tag: '健康', createdAt: new Date().toISOString() },
            { id: 12, title: '阅读书籍', priority: 4, completed: false, tag: '学习', createdAt: new Date().toISOString() }
        ];
        console.log('🧪 已生成', testTasks.length, '个测试任务');
        return testTasks;
    },

    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的日期 (MM-DD)
     */
    formatDate(date) {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}-${day}`;
    },

    /**
     * 获取指定日期的数据
     * @param {string} dateStr - 日期字符串 (MM-DD)
     * @returns {Object} 当日数据 { total, completed, efficiency }
     */
    getDayData(dateStr) {
        try {
            const tasks = this.getAllTasks();

            // 筛选在指定日期创建的任务
            const dayTasks = tasks.filter(t => {
                if (!t.createdAt) return false;
                const taskDate = new Date(t.createdAt);
                const taskDateStr = this.formatDate(taskDate);
                return taskDateStr === dateStr;
            });

            const total = dayTasks.length;
            const completed = dayTasks.filter(t => t.completed).length;

            // 计算效率：完成任务数 / 总任务数 * 100
            let efficiency = 0;
            if (total > 0) {
                efficiency = Math.round((completed / total) * 100);
            } else {
                // 如果当天没有创建任务，尝试从历史数据获取
                const history = JSON.parse(localStorage.getItem('taskHistory') || '{}');
                if (history[dateStr]) {
                    const histTotal = history[dateStr].total || 0;
                    const histCompleted = history[dateStr].completed || 0;
                    efficiency = histTotal > 0 ? Math.round((histCompleted / histTotal) * 100) : 0;
                    return {
                        total: histTotal,
                        completed: histCompleted,
                        efficiency
                    };
                }
                // 如果历史数据也没有，返回 0 而不是随机值
                efficiency = 0;
            }

            return { total, completed, efficiency };

        } catch (error) {
            console.error('获取日期数据失败:', error);
            return {
                total: 0,
                completed: 0,
                efficiency: 0
            };
        }
    }
};

// ========== 图表初始化和管理 ==========
const VisualizationCharts = {
    // 图表实例
    charts: {
        taskCategory: null,
        efficiencyTrend: null,
        workDistribution: null
    },

    // 当前配置
    config: {
        taskType: 'count', // count | rate
        efficiencyDays: 30,
        distributionType: 'category' // category | quadrant | status
    },

    /**
     * 初始化所有图表
     */
    initAll() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initAllCharts();
            });
        } else {
            this.initAllCharts();
        }
    },

    /**
     * 初始化所有图表（内部方法）
     */
    initAllCharts() {
        // 检查Chart.js是否已加载
        if (typeof Chart === 'undefined') {
            console.error('Chart.js 未加载，请确保已引入 Chart.js 库');
            return;
        }

        this.initTaskCategoryChart();
        this.initEfficiencyTrendChart();
        this.initWorkDistributionChart();
        console.log('✅ 所有图表初始化完成');
    },

    /**
     * 初始化任务分类柱形图
     */
    initTaskCategoryChart() {
        // 检查Chart.js是否已加载
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js 未加载，跳过任务分类图表初始化');
            return;
        }

        const canvas = document.getElementById('taskCategoryChart');
        if (!canvas) {
            console.warn('未找到 taskCategoryChart 元素');
            return;
        }

        // 检查canvas是否在可见的视图中
        const view = canvas.closest('.view');
        if (view && view.style.display === 'none') {
            console.warn('taskCategoryChart 在隐藏的视图中，跳过初始化');
            return;
        }

        const ctx = canvas.getContext('2d');
        const chartData = ChartDataManager.getTaskCategoryData();

        // 如果已存在实例，先销毁
        if (this.charts.taskCategory) {
            this.charts.taskCategory.destroy();
        }

        // 图表点击状态跟踪
        let lastClickTime = 0;
        let lastClickElement = null;

        this.charts.taskCategory = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: chartI18nText('任务数量'),
                    data: chartData.data,
                    backgroundColor: chartData.backgroundColors,
                    borderColor: chartData.borderColors,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                // 柱子宽度设置
                barPercentage: 0.5,     // 柱子占类别空间的50%（默认0.9，调小使柱子变细）
                categoryPercentage: 0.7, // 类别占可用空间的70%（默认0.8）
                plugins: {
                    legend: {
                        display: false // 隐藏图例，因为只有一组数据
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return `${chartI18nText('任务数量')}: ${context.parsed.y}`;
                            },
                            afterLabel: function(context) {
                                return chartI18nText('双击查看详情');
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 12, weight: '500' },
                            color: '#333'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 12 },
                            color: '#666',
                            stepSize: 1
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const now = Date.now();
                        const element = elements[0];
                        const index = element.index;
                        const label = chartData.labels[index];
                        const categoryData = chartData.categories[index];

                        // 检测双击（300ms内点击同一位置）
                        if (lastClickElement === index && now - lastClickTime < 300) {
                            // 双击事件 - 显示详情
                            this.showTaskDetailModal(label, categoryData);
                            lastClickTime = 0;
                            lastClickElement = null;
                        } else {
                            // 单击事件 - 筛选
                            this.handleTaskChartClick(label, categoryData);
                            lastClickTime = now;
                            lastClickElement = index;
                        }
                    }
                }
            }
        });
    },

    /**
     * 初始化效率趋势折线图
     */
    initEfficiencyTrendChart() {
        // 检查Chart.js是否已加载
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js 未加载，跳过效率趋势图表初始化');
            return;
        }

        const canvas = document.getElementById('efficiencyTrendChart');
        if (!canvas) {
            console.warn('未找到 efficiencyTrendChart 元素');
            return;
        }

        // 检查canvas是否在可见的视图中
        const view = canvas.closest('.view');
        if (view && view.style.display === 'none') {
            console.warn('efficiencyTrendChart 在隐藏的视图中，跳过初始化');
            return;
        }

        const ctx = canvas.getContext('2d');
        const chartData = ChartDataManager.getEfficiencyTrendData(this.config.efficiencyDays);

        if (this.charts.efficiencyTrend) {
            this.charts.efficiencyTrend.destroy();
        }

        // 创建渐变填充
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.0)');

        // 图表点击状态跟踪
        let lastClickTime = 0;
        let lastClickElement = null;

        this.charts.efficiencyTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: chartI18nText('效率评分'),
                    data: chartData.data,
                    borderColor: '#667eea',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4, // 平滑曲线
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#667eea',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `${chartI18nText('效率评分')}: ${context.parsed.y}%`;
                            },
                            afterLabel: function() {
                                return chartI18nText('双击查看当日任务');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 12 },
                            color: '#666',
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 11 },
                            color: '#666',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const now = Date.now();
                        const element = elements[0];
                        const index = element.index;
                        const dateLabel = chartData.labels[index];
                        const efficiency = chartData.data[index];

                        // 检测双击（300ms内点击同一位置）
                        if (lastClickElement === index && now - lastClickTime < 300) {
                            // 双击事件 - 显示当日任务详情
                            this.showDayTasksModal(dateLabel, efficiency);
                            lastClickTime = 0;
                            lastClickElement = null;
                        } else {
                            // 单击事件
                            this.showToast(`${dateLabel}: 效率 ${efficiency}%`, 'info');
                            lastClickTime = now;
                            lastClickElement = index;
                        }
                    }
                }
            }
        });
    },

    /**
     * 初始化工作分布饼图
     */
    initWorkDistributionChart() {
        // 检查Chart.js是否已加载
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js 未加载，跳过工作分布图表初始化');
            return;
        }

        const canvas = document.getElementById('workDistributionChart');
        if (!canvas) {
            console.warn('未找到 workDistributionChart 元素');
            return;
        }

        // 检查canvas是否在可见的视图中
        const view = canvas.closest('.view');
        if (view && view.style.display === 'none') {
            console.warn('workDistributionChart 在隐藏的视图中，跳过初始化');
            return;
        }

        const ctx = canvas.getContext('2d');
        const chartData = ChartDataManager.getWorkDistributionData(this.config.distributionType);

        if (this.charts.workDistribution) {
            this.charts.workDistribution.destroy();
        }

        // 图表点击状态跟踪
        let lastClickTime = 0;
        let lastClickElement = null;

        this.charts.workDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartData.labels,
                datasets: [{
                    data: chartData.data,
                    backgroundColor: chartData.labels[0] === chartI18nText('暂无数据')
                        ? ['rgba(156, 163, 175, 0.3)']
                        : chartData.colors.slice(0, chartData.labels.length),
                    borderColor: '#fff',
                    borderWidth: 3,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { size: 13, weight: '500' },
                            color: '#333',
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                if (context.label === chartI18nText('暂无数据')) {
                                    return chartI18nText('暂无数据可显示');
                                }
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            },
                            afterLabel: function() {
                                return chartI18nText('双击查看详情');
                            }
                        }
                    }
                },
                cutout: '60%', // 甜甜圈样式
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const now = Date.now();
                        const element = elements[0];
                        const index = element.index;
                        const label = chartData.labels[index];
                        const value = chartData.data[index];
                        const tasks = chartData.taskLists?.[index] || [];
                        const color = chartData.colorMap?.[label] || chartData.colors?.[index] || '#667eea';

                        // 检测双击（300ms内点击同一位置）
                        if (lastClickElement === index && now - lastClickTime < 300) {
                            // 双击事件 - 显示详情
                            this.handleDistributionClick(label, value, tasks, color);
                            lastClickTime = 0;
                            lastClickElement = null;
                        } else {
                            // 单击事件
                            this.showToast(`${label}: ${value} 个任务`, 'info');
                            lastClickTime = now;
                            lastClickElement = index;
                        }
                    }
                }
            }
        });
    },

    /**
     * 处理任务分类图表单击
     * @param {string} label - 象限标签
     * @param {Object} categoryData - 分类数据 {label, tasks, color}
     */
    handleTaskChartClick(label, categoryData) {
        console.log('点击了任务分类:', label, '任务数:', categoryData.tasks.length);
        this.showToast(`${label}: ${categoryData.tasks.length} 个任务`, 'info');
    },

    /**
     * 显示任务详情模态框
     * @param {string} label - 象限标签
     * @param {Object} categoryData - 分类数据 {label, tasks, color}
     */
    showTaskDetailModal(label, categoryData) {
        const tasks = categoryData.tasks || [];
        console.log('显示任务详情:', label, tasks.length, '个任务');

        // 创建模态框HTML
        const modalHtml = `
            <div class="modal-backdrop" data-chart-modal-close style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9998;"></div>
            <div id="chart-detail-modal" class="modal" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;">
                <div class="modal-content" style="background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); max-width: 600px; max-height: 80vh; overflow-y: auto; margin: 20px;">
                    <div class="modal-header" style="border-bottom: 2px solid ${categoryData.color}; padding: 20px; position: sticky; top: 0; background: white; z-index: 1;">
                        <h3 style="margin: 0; color: ${categoryData.color}; display: flex; align-items: center; justify-content: space-between;">
                            <span>${label} - 任务详情</span>
                            <button class="close-btn" data-chart-modal-close style="float: right; background: none; border: none; font-size: 32px; cursor: pointer; color: #999; line-height: 1; padding: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;">&times;</button>
                        </h3>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div style="margin-bottom: 15px; color: #666; font-size: 14px;">
                            共 <strong>${tasks.length}</strong> 个任务
                        </div>
                        ${tasks.length === 0 ? '<p style="text-align: center; color: #999; padding: 40px 0;">暂无任务</p>' : ''}
                        ${tasks.map(task => `
                            <div style="padding: 12px; margin-bottom: 10px; background: ${task.completed ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${categoryData.color}; border-radius: 4px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 500; color: ${task.completed ? '#166534' : '#991b1b'}; margin-bottom: 4px; word-break: break-word;">
                                            ${task.completed ? '✓' : '○'} ${task.title || '未命名任务'}
                                        </div>
                                        <div style="font-size: 12px; color: #999;">
                                            创建时间: ${task.createdAt ? new Date(task.createdAt).toLocaleString('zh-CN') : '未知'}
                                        </div>
                                    </div>
                                    <div style="font-size: 12px; padding: 4px 8px; background: ${categoryData.color}; color: white; border-radius: 4px; margin-left: 12px; flex-shrink: 0;">
                                        ${task.completed ? '已完成' : '进行中'}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // 移除现有模态框
        const existingModal = document.getElementById('chart-detail-modal');
        if (existingModal) {
            existingModal.remove();
        }
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        // 添加新模态框（注意顺序：先 backdrop 后 modal）
        appendSanitizedChartMarkup(document.body, modalHtml);
        this.bindChartDetailModalEvents();
    },

    /**
     * 显示某日任务详情模态框
     * @param {string} dateLabel - 日期标签 (MM-DD)
     * @param {number} efficiency - 效率值
     */
    showDayTasksModal(dateLabel, efficiency) {
        // 获取当日任务
        const tasks = ChartDataManager.getAllTasks();
        const dayTasks = tasks.filter(t => {
            if (!t.createdAt) return false;
            const taskDate = new Date(t.createdAt);
            const taskDateStr = ChartDataManager.formatDate(taskDate);
            return taskDateStr === dateLabel;
        });

        console.log('显示当日任务:', dateLabel, dayTasks.length, '个');

        // 创建模态框HTML
        const modalHtml = `
            <div class="modal-backdrop" data-chart-modal-close style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9998;"></div>
            <div id="chart-detail-modal" class="modal" style="display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;">
                <div class="modal-content" style="background: white; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); max-width: 600px; max-height: 80vh; overflow-y: auto; margin: 20px;">
                    <div class="modal-header" style="border-bottom: 2px solid #667eea; padding: 20px; position: sticky; top: 0; background: white; z-index: 1;">
                        <h3 style="margin: 0; color: #667eea; display: flex; align-items: center; justify-content: space-between;">
                            <span>${dateLabel} - 任务详情</span>
                            <button class="close-btn" data-chart-modal-close style="background: none; border: none; font-size: 32px; cursor: pointer; color: #999; line-height: 1; padding: 0; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;">&times;</button>
                        </h3>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <div style="margin-bottom: 20px; padding: 15px; background: #f0f4ff; border-radius: 8px; border-left: 4px solid #667eea;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #666; font-size: 14px;">效率评分</span>
                                <span style="font-size: 28px; font-weight: bold; color: #667eea;">${efficiency}%</span>
                            </div>
                            <div style="margin-top: 8px; color: #999; font-size: 12px;">
                                共 ${dayTasks.length} 个任务，已完成 ${dayTasks.filter(t => t.completed).length} 个
                            </div>
                        </div>
                        ${dayTasks.length === 0 ? '<p style="text-align: center; color: #999; padding: 40px 0;">当日无任务</p>' : ''}
                        ${dayTasks.map(task => {
                            // 获取象限颜色
                            const quadrantColors = {
                                1: '#ef4444',  // 红色 - Q1 重要且紧急
                                2: '#f59e0b',  // 橙色 - Q2 重要不紧急
                                3: '#3b82f6',  // 蓝色 - Q3 不重要紧急
                                4: '#22c55e'   // 绿色 - Q4 不重要不紧急
                            };
                            const priority = task.priority || task.quadrant || task.priorityLevel || 1;
                            const color = quadrantColors[priority] || '#667eea';

                            return `
                            <div style="padding: 12px; margin-bottom: 10px; background: ${task.completed ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${color}; border-radius: 4px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-weight: 500; color: ${task.completed ? '#166534' : '#991b1b'}; margin-bottom: 4px; word-break: break-word;">
                                            ${task.completed ? '✓' : '○'} ${task.title || '未命名任务'}
                                        </div>
                                        <div style="font-size: 12px; color: #999;">
                                            创建时间: ${task.createdAt ? new Date(task.createdAt).toLocaleString('zh-CN') : '未知'}
                                        </div>
                                    </div>
                                    <div style="font-size: 12px; padding: 4px 8px; background: ${color}; color: white; border-radius: 4px; margin-left: 12px; flex-shrink: 0;">
                                        ${task.completed ? '已完成' : '进行中'}
                                    </div>
                                </div>
                            </div>
                        `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;

        // 移除现有模态框
        const existingModal = document.getElementById('chart-detail-modal');
        if (existingModal) {
            existingModal.remove();
        }
        const existingBackdrop = document.querySelector('.modal-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        // 添加新模态框（注意顺序：先 backdrop 后 modal）
        appendSanitizedChartMarkup(document.body, modalHtml);
        this.bindChartDetailModalEvents();
    },

    /**
     * 处理分布图点击
     * @param {string} label - 分类标签
     * @param {number} value - 任务数量
     * @param {Array} tasks - 任务列表（可选）
     * @param {string} color - 主题颜色（可选）
     */
    handleDistributionClick(label, value, tasks = [], color = '#667eea') {
        console.log('点击了分布项:', label, value, '颜色:', color);

        // 如果有任务列表，显示详情
        if (tasks && tasks.length > 0) {
            this.showTaskDetailModal(label, { tasks, color });
        } else {
            this.showToast(`${label}: ${value} 个任务`, 'info');
        }
    },

    /**
     * 刷新所有图表
     */
    refreshAll() {
        this.initTaskCategoryChart();
        this.initEfficiencyTrendChart();
        this.initWorkDistributionChart();
        console.log('✅ 图表已刷新');
    },

    /**
     * 切换任务完成状态筛选
     * @param {string} filter - 'completed' | 'incomplete' | null
     */
    toggleTaskCompletion(filter) {
        // 更新数据管理器的筛选状态
        ChartDataManager.setTaskFilter(filter);

        // 更新按钮样式
        const chartCard = document.querySelector('#taskCategoryChart')?.closest('.chart-card');
        if (chartCard) {
            const buttons = chartCard.querySelectorAll('.chart-action-btn');
            buttons.forEach(btn => btn.classList.remove('active'));

            const activeButton = Array.from(buttons).find(btn =>
                btn.getAttribute('onclick')?.includes(filter)
            );
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }

        // 重新初始化图表
        this.initTaskCategoryChart();

        const filterName = filter === 'completed' ? '已完成' : '未完成';
        this.showToast(`已切换至${filterName}视图`, 'info');
    },

    /**
     * 更新任务图表类型（保留兼容性）
     */
    updateTaskType(type) {
        // 不再使用此方法，保留以避免错误
        console.log('updateTaskType 已废弃，请使用 toggleTaskCompletion');
    },

    /**
     * 更新效率图表天数
     */
    updateEfficiencyDays(days) {
        this.config.efficiencyDays = parseInt(days);
        this.initEfficiencyTrendChart();
    },

    /**
     * 更新分布图类型
     */
    updateDistributionType(type) {
        this.config.distributionType = type;
        this.initWorkDistributionChart();
    },

    /**
     * 显示提示消息
     */
    showToast(message, type = 'info') {
        // 如果项目中已有toast函数，使用它；否则使用console
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    },

    /**
     * 当视图切换时调用此方法来重新初始化图表
     * @param {string} viewId - 视图ID (如 'dashboard-view', 'habit-view')
     */
    onViewSwitch(viewId) {
        // 延迟执行，确保DOM已更新
        setTimeout(() => {
            const view = document.getElementById(viewId);
            if (!view || view.style.display === 'none') {
                return;
            }

            // 重新初始化所有图表
            this.initTaskCategoryChart();
            this.initEfficiencyTrendChart();
            this.initWorkDistributionChart();
            console.log(`✅ ${viewId} 图表已重新初始化`);
        }, 100);
    },

    bindChartDetailModalEvents() {
        document.querySelectorAll('[data-chart-modal-close]').forEach(button => {
            button.addEventListener('click', closeChartDetailModal, { once: true });
        });
    }
};

// ========== 全局函数（用于HTML中的onclick事件） ==========

/**
 * 刷新所有图表
 */
function refreshAllCharts() {
    VisualizationCharts.refreshAll();
    VisualizationCharts.showToast('图表已刷新', 'success');
}

/**
 * 切换任务完成状态筛选
 * @param {string} filter - 'completed' | 'incomplete'
 */
function toggleTaskCompletion(filter) {
    VisualizationCharts.toggleTaskCompletion(filter);
}

/**
 * 关闭图表详情模态框
 */
function closeChartDetailModal() {
    const modal = document.getElementById('chart-detail-modal');
    const backdrop = document.querySelector('.modal-backdrop');
    if (modal) modal.remove();
    if (backdrop) backdrop.remove();
}

/**
 * 更新效率图表
 */
function updateEfficiencyChart(days) {
    VisualizationCharts.updateEfficiencyDays(days);
}

/**
 * 更新分布图
 */
function updateDistributionChart(type) {
    VisualizationCharts.updateDistributionType(type);
}

/**
 * 导出所有图表
 */
function exportAllCharts() {
    // TODO: 实现导出逻辑
    VisualizationCharts.showToast('图表导出功能开发中', 'info');
}

// ========== 导出到全局 ==========
window.ChartDataManager = ChartDataManager;
window.VisualizationCharts = VisualizationCharts;

// ========== 等待Chart.js加载完成 ==========
function waitForChartJS(callback, maxAttempts = 100) {  // 增加到100次（10秒）
    let attempts = 0;

    function checkChartJS() {
        attempts++;

        if (typeof Chart !== 'undefined') {
            console.log('✅ Chart.js已加载，版本:', Chart.version, '，尝试次数:', attempts);
            callback();
        } else if (attempts < maxAttempts) {
            if (attempts % 10 === 0) {  // 每10次输出一次日志
                console.log('⏳ 等待Chart.js加载...', attempts, '次');
            }
            setTimeout(checkChartJS, 100);
        } else {
            console.error('❌ Chart.js加载超时（10秒），请检查网络连接或CDN是否可访问');
            console.error('提示：可以尝试刷新页面或检查浏览器控制台的Network标签');
        }
    }

    console.log('🔍 开始等待Chart.js加载...');
    checkChartJS();
}

// ========== 自动初始化 ==========
// 等待Chart.js加载后再初始化图表
waitForChartJS(() => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            VisualizationCharts.initAll();
        });
    } else {
        VisualizationCharts.initAll();
    }
});

// 导出模块（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChartDataManager, VisualizationCharts };
}
