// ==================== 时间管理可视化看板系统 ====================

function createTimeTrackerEmptyState(message) {
    const emptyEl = document.createElement('div');
    emptyEl.style.textAlign = 'center';
    emptyEl.style.padding = '2rem';
    emptyEl.style.color = 'var(--text-secondary)';
    emptyEl.textContent = message;
    return emptyEl;
}

function setTimeTrackerCategoryOptions(selectEl, categories) {
    selectEl.replaceChildren();
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.icon} ${category.name}`;
        selectEl.appendChild(option);
    });
}

// 时间管理系统类
class TimeTrackerSystem {
    constructor() {
        this.records = this.loadRecords();
        this.categories = this.loadCategories();
        this.goals = this.loadGoals();
        this.currentDate = new Date();
        this.distributionChart = null;
        this.trendChart = null;
        this.currentPeriod = 'today';
        this.currentTrend = 'week';

        // 初始化默认类别
        if (this.categories.length === 0) {
            this.categories = [
                { id: 'work', name: '工作', color: '#667eea', icon: '💼' },
                { id: 'health', name: '健康', color: '#10b981', icon: '🏃' },
                { id: 'study', name: '学习', color: '#3b82f6', icon: '📚' },
                { id: 'entertainment', name: '娱乐', color: '#f59e0b', icon: '🎮' },
                { id: 'life', name: '生活', color: '#8b5cf6', icon: '🏠' }
            ];
            this.saveCategories();
        }

        // 初始化示例数据（至少3天）
        if (this.records.length === 0) {
            this.initSampleData();
        }

        // 确保示例数据中的类别ID与默认类别匹配
        this.fixSampleDataCategories();
    }

    // 加载时间记录
    loadRecords() {
        if (window.TimeTrackerStorage) {
            return window.TimeTrackerStorage.getRecords();
        }
        console.warn('TimeTrackerStorage is unavailable; records will use an empty fallback.');
        return [];
    }

    // 保存时间记录
    saveRecords() {
        if (window.TimeTrackerStorage) {
            this.records = window.TimeTrackerStorage.setRecords(this.records);
            return;
        }
        console.warn('TimeTrackerStorage is unavailable; records were not persisted.');
    }

    // 加载类别
    loadCategories() {
        if (window.TimeTrackerStorage) {
            return window.TimeTrackerStorage.getCategories();
        }
        console.warn('TimeTrackerStorage is unavailable; categories will use an empty fallback.');
        return [];
    }

    // 保存类别
    saveCategories() {
        if (window.TimeTrackerStorage) {
            this.categories = window.TimeTrackerStorage.setCategories(this.categories);
            return;
        }
        console.warn('TimeTrackerStorage is unavailable; categories were not persisted.');
    }

    // 加载目标
    loadGoals() {
        if (window.TimeTrackerStorage) {
            return window.TimeTrackerStorage.getGoals();
        }
        console.warn('TimeTrackerStorage is unavailable; goals will use an empty fallback.');
        return [];
    }

    // 保存目标
    saveGoals() {
        if (window.TimeTrackerStorage) {
            this.goals = window.TimeTrackerStorage.setGoals(this.goals);
            return;
        }
        console.warn('TimeTrackerStorage is unavailable; goals were not persisted.');
    }

    // 初始化示例数据
    initSampleData() {
        const today = new Date();
        const dates = [];
        for (let i = 0; i < 3; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }

        const sampleRecords = [
            { id: '1', name: '项目会议', categoryId: 'work', hours: 2, minutes: 0, date: dates[0], note: '' },
            { id: '2', name: '代码开发', categoryId: 'work', hours: 4, minutes: 30, date: dates[0], note: '' },
            { id: '3', name: '晨跑', categoryId: 'health', hours: 0, minutes: 45, date: dates[0], note: '' },
            { id: '4', name: '阅读技术书籍', categoryId: 'study', hours: 1, minutes: 30, date: dates[0], note: '' },
            { id: '5', name: '看电影', categoryId: 'entertainment', hours: 2, minutes: 0, date: dates[0], note: '' },
            { id: '6', name: '项目开发', categoryId: 'work', hours: 6, minutes: 0, date: dates[1], note: '' },
            { id: '7', name: '健身房', categoryId: 'health', hours: 1, minutes: 15, date: dates[1], note: '' },
            { id: '8', name: '在线课程', categoryId: 'study', hours: 2, minutes: 0, date: dates[1], note: '' },
            { id: '9', name: '团队会议', categoryId: 'work', hours: 1, minutes: 30, date: dates[2], note: '' },
            { id: '10', name: '瑜伽', categoryId: 'health', hours: 0, minutes: 50, date: dates[2], note: '' }
        ];

        this.records = sampleRecords;
        this.saveRecords();
    }

    // 修复示例数据的类别ID（确保与默认类别匹配）
    fixSampleDataCategories() {
        // 如果记录使用了旧的类别ID，但类别列表中没有，则更新记录
        const defaultCategoryIds = ['work', 'health', 'study', 'entertainment', 'life'];
        this.records.forEach(record => {
            if (defaultCategoryIds.includes(record.categoryId)) {
                // 确保类别存在
                const category = this.categories.find(c => c.id === record.categoryId);
                if (!category) {
                    // 如果类别不存在，使用第一个可用类别
                    if (this.categories.length > 0) {
                        record.categoryId = this.categories[0].id;
                    }
                }
            }
        });
        this.saveRecords();
    }

    // 格式化日期
    formatDate(date) {
        const d = new Date(date);
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const weekday = weekdays[d.getDay()];
        return `${year}年${month}月${day}日 ${weekday}`;
    }

    // 获取日期字符串
    getDateString(date) {
        return date.toISOString().split('T')[0];
    }

    // 获取某天的记录
    getRecordsByDate(dateString) {
        return this.records.filter(r => r.date === dateString);
    }

    // 计算总时长（分钟）
    calculateTotalMinutes(records) {
        return records.reduce((total, record) => {
            return total + record.hours * 60 + record.minutes;
        }, 0);
    }

    // 格式化时长
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}小时${mins}分钟`;
    }

    // 添加时间记录
    addRecord(record) {
        const dateString = record.date || this.getDateString(this.currentDate);
        const dayRecords = this.getRecordsByDate(dateString);
        const totalMinutes = this.calculateTotalMinutes(dayRecords);
        const newMinutes = record.hours * 60 + record.minutes;

        if (totalMinutes + newMinutes > 18 * 60) {
            this.showNotification('每天总时长不能超过18小时！', 'error');
            return false;
        }

        record.id = Date.now().toString();
        this.records.push(record);
        this.saveRecords();
        this.showNotification('时间记录添加成功！', 'success');
        return true;
    }

    // 删除时间记录
    deleteRecord(id) {
        if (confirm('确定要删除这条时间记录吗？')) {
            this.records = this.records.filter(r => r.id !== id);
            this.saveRecords();
            this.showNotification('时间记录已删除', 'success');
            this.render();
        }
    }

    // 添加类别
    addCategory(category) {
        category.id = Date.now().toString();
        this.categories.push(category);
        this.saveCategories();
        this.showNotification('类别添加成功！', 'success');
    }

    // 删除类别
    deleteCategory(id) {
        // 检查是否有记录使用此类别
        const hasRecords = this.records.some(r => r.categoryId === id);
        if (hasRecords) {
            this.showNotification('该类别正在使用中，无法删除', 'error');
            return;
        }

        if (confirm('确定要删除这个类别吗？')) {
            this.categories = this.categories.filter(c => c.id !== id);
            this.saveCategories();
            this.showNotification('类别已删除', 'success');
            this.render();
        }
    }

    // 添加目标
    addGoal(goal) {
        goal.id = Date.now().toString();
        this.goals.push(goal);
        this.saveGoals();
        this.showNotification('目标添加成功！', 'success');
    }

    // 删除目标
    deleteGoal(id) {
        if (confirm('确定要删除这个目标吗？')) {
            this.goals = this.goals.filter(g => g.id !== id);
            this.saveGoals();
            this.showNotification('目标已删除', 'success');
            this.render();
        }
    }

    // 获取类别信息
    getCategory(id) {
        return this.categories.find(c => c.id === id);
    }

    // 显示通知
    showNotification(message, type = 'success') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `time-tracker-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 渲染时间记录列表
    renderRecords() {
        const dateString = this.getDateString(this.currentDate);
        const dayRecords = this.getRecordsByDate(dateString);
        const listEl = document.getElementById('time-records-list');

        if (!listEl) return;

        listEl.replaceChildren();
        if (dayRecords.length === 0) {
            listEl.appendChild(createTimeTrackerEmptyState('暂无时间记录'));
        } else {
            dayRecords.forEach(record => {
                const category = this.getCategory(record.categoryId);
                const duration = this.formatDuration(record.hours * 60 + record.minutes);
                const recordEl = document.createElement('div');
                recordEl.className = 'time-record-item';

                const iconEl = document.createElement('div');
                iconEl.className = 'record-icon';
                iconEl.style.background = `${category?.color || '#a855f7'}20`;
                iconEl.style.color = category?.color || '#a855f7';
                iconEl.textContent = category?.icon || '📝';

                const infoEl = document.createElement('div');
                infoEl.className = 'record-info';
                const nameEl = document.createElement('div');
                nameEl.className = 'record-name';
                nameEl.textContent = record.name;
                const categoryEl = document.createElement('div');
                categoryEl.className = 'record-category';
                categoryEl.textContent = category?.name || '未分类';
                infoEl.append(nameEl, categoryEl);

                const durationEl = document.createElement('div');
                durationEl.className = 'record-duration';
                durationEl.textContent = duration;

                const actionsEl = document.createElement('div');
                actionsEl.className = 'record-actions';
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'record-action-btn';
                deleteBtn.dataset.timeAction = 'delete-record';
                deleteBtn.dataset.recordId = record.id;
                deleteBtn.title = '删除';
                const deleteIcon = document.createElement('span');
                deleteIcon.className = 'material-icons';
                deleteIcon.textContent = 'delete';
                deleteBtn.appendChild(deleteIcon);
                actionsEl.appendChild(deleteBtn);

                recordEl.append(iconEl, infoEl, durationEl, actionsEl);
                listEl.appendChild(recordEl);
            });
        }

        // 更新汇总
        const totalMinutes = this.calculateTotalMinutes(dayRecords);
        const remainingMinutes = 18 * 60 - totalMinutes;

        document.getElementById('total-time-today').textContent = this.formatDuration(totalMinutes);
        document.getElementById('remaining-time').textContent = this.formatDuration(Math.max(0, remainingMinutes));
    }

    // 渲染类别列表
    renderCategories() {
        const listEl = document.getElementById('categories-list');
        if (!listEl) return;

        listEl.replaceChildren();
        this.categories.forEach(category => {
            const itemEl = document.createElement('div');
            itemEl.className = 'category-item';

            const colorEl = document.createElement('div');
            colorEl.className = 'category-color';
            colorEl.style.background = category.color;

            const nameEl = document.createElement('div');
            nameEl.className = 'category-name';
            nameEl.textContent = `${category.icon} ${category.name}`;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'category-delete-btn';
            deleteBtn.dataset.timeAction = 'delete-category';
            deleteBtn.dataset.categoryId = category.id;
            deleteBtn.textContent = '删除';

            itemEl.append(colorEl, nameEl, deleteBtn);
            listEl.appendChild(itemEl);
        });
    }

    // 渲染目标列表
    renderGoals() {
        const listEl = document.getElementById('goals-list');
        if (!listEl) return;

        const dateString = this.getDateString(this.currentDate);
        const dayRecords = this.getRecordsByDate(dateString);

        listEl.replaceChildren();
        if (this.goals.length === 0) {
            listEl.appendChild(createTimeTrackerEmptyState('暂无目标，点击 + 添加'));
        } else {
            this.goals.forEach(goal => {
                const category = this.getCategory(goal.categoryId);
                const categoryRecords = dayRecords.filter(r => r.categoryId === goal.categoryId);
                const actualMinutes = this.calculateTotalMinutes(categoryRecords);
                const targetMinutes = goal.hours * 60;
                const progress = Math.min(100, (actualMinutes / targetMinutes) * 100);

                const goalEl = document.createElement('div');
                goalEl.className = 'goal-item';

                const headerEl = document.createElement('div');
                headerEl.className = 'goal-header';
                const nameEl = document.createElement('div');
                nameEl.className = 'goal-name';
                nameEl.textContent = `${category?.icon || '🎯'} ${goal.name}`;
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'goal-delete-btn';
                deleteBtn.dataset.timeAction = 'delete-goal';
                deleteBtn.dataset.goalId = goal.id;
                deleteBtn.textContent = '删除';
                headerEl.append(nameEl, deleteBtn);

                const progressEl = document.createElement('div');
                progressEl.className = 'goal-progress';
                const progressBarEl = document.createElement('div');
                progressBarEl.className = 'goal-progress-bar';
                progressBarEl.style.width = `${progress}%`;
                progressEl.appendChild(progressBarEl);

                const infoEl = document.createElement('div');
                infoEl.className = 'goal-info';
                const actualEl = document.createElement('span');
                actualEl.textContent = `已完成: ${this.formatDuration(actualMinutes)}`;
                const targetEl = document.createElement('span');
                targetEl.textContent = `目标: ${this.formatDuration(targetMinutes)}`;
                infoEl.append(actualEl, targetEl);

                goalEl.append(headerEl, progressEl, infoEl);
                listEl.appendChild(goalEl);
            });
        }
    }

    // 更新日期显示
    updateDateDisplay() {
        const displayEl = document.getElementById('current-date-display');
        if (displayEl) {
            displayEl.textContent = this.formatDate(this.currentDate);
        }
    }

    // 切换到上一天
    prevDate() {
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        this.updateDateDisplay();
        this.render();
    }

    // 切换到下一天
    nextDate() {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        this.updateDateDisplay();
        this.render();
    }

    // 渲染图表
    renderCharts() {
        this.renderDistributionChart();
        this.renderTrendChart();
    }

    // 渲染时间分配饼图
    renderDistributionChart() {
        const canvas = document.getElementById('time-distribution-chart');
        if (!canvas) return;
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js 未加载，跳过时间分配图表渲染');
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('⚠️ 无法获取 time-distribution-chart 的 2D context，已跳过渲染');
            return;
        }

        let records = [];
        const dateString = this.getDateString(this.currentDate);

        if (this.currentPeriod === 'today') {
            records = this.getRecordsByDate(dateString);
        } else if (this.currentPeriod === 'week') {
            const weekStart = new Date(this.currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                records.push(...this.getRecordsByDate(this.getDateString(date)));
            }
        } else if (this.currentPeriod === 'month') {
            const monthStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            const monthEnd = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
                records.push(...this.getRecordsByDate(this.getDateString(d)));
            }
        }

        // 按类别统计
        const categoryData = {};
        records.forEach(record => {
            const category = this.getCategory(record.categoryId);
            if (category) {
                if (!categoryData[category.id]) {
                    categoryData[category.id] = {
                        name: category.name,
                        color: category.color,
                        minutes: 0
                    };
                }
                categoryData[category.id].minutes += record.hours * 60 + record.minutes;
            }
        });

        const labels = Object.values(categoryData).map(c => c.name);
        const data = Object.values(categoryData).map(c => c.minutes);
        const colors = Object.values(categoryData).map(c => c.color);
        const total = data.reduce((a, b) => a + b, 0);

        if (this.distributionChart) {
            this.distributionChart.destroy();
        }

        // 如果没有数据，显示居中的"暂无数据"提示
        if (total === 0 || labels.length === 0) {
            // 清空画布并显示居中文字
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#9ca3af';
            ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            ctx.fillText('暂无数据', centerX, centerY);

            // 更新图例显示"暂无数据"
            this.updateChartLegend(categoryData, total);
            return;
        }

        try {
            this.distributionChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } catch (error) {
            console.error('❌ 渲染时间分配图表失败:', error);
            showNotification?.('时间分配图表加载失败，请刷新重试', 'error');
        }

        // 更新图例
        this.updateChartLegend(categoryData, total);
    }

    // 更新图例
    updateChartLegend(categoryData, total) {
        const legendEl = document.getElementById('chart-legend');
        if (!legendEl) return;

        if (total === 0) {
            // 没有数据时，清空图例区域（因为图表区域已经显示了"暂无数据"）
            legendEl.replaceChildren();
            return;
        }

        legendEl.replaceChildren();
        Object.values(categoryData).forEach(category => {
            const percentage = ((category.minutes / total) * 100).toFixed(1);
            const itemEl = document.createElement('div');
            itemEl.className = 'legend-item';

            const colorEl = document.createElement('div');
            colorEl.className = 'legend-color';
            colorEl.style.background = category.color;

            const infoEl = document.createElement('div');
            infoEl.className = 'legend-info';
            infoEl.style.flex = '1';

            const headerEl = document.createElement('div');
            headerEl.style.display = 'flex';
            headerEl.style.justifyContent = 'space-between';
            headerEl.style.alignItems = 'center';

            const nameEl = document.createElement('span');
            nameEl.className = 'legend-name';
            nameEl.textContent = category.name;

            const percentageEl = document.createElement('span');
            percentageEl.className = 'legend-percentage';
            percentageEl.textContent = `${percentage}%`;
            headerEl.append(nameEl, percentageEl);

            const progressEl = document.createElement('div');
            progressEl.className = 'legend-progress';
            const progressBarEl = document.createElement('div');
            progressBarEl.className = 'legend-progress-bar';
            progressBarEl.style.width = `${percentage}%`;
            progressBarEl.style.background = category.color;
            progressEl.appendChild(progressBarEl);

            infoEl.append(headerEl, progressEl);
            itemEl.append(colorEl, infoEl);
            legendEl.appendChild(itemEl);
        });
    }

    // 渲染趋势分析柱状图
    renderTrendChart() {
        const canvas = document.getElementById('trend-chart');
        if (!canvas) return;
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js 未加载，跳过趋势图渲染');
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn('⚠️ 无法获取 trend-chart 的 2D context，已跳过渲染');
            return;
        }

        let dateRange = [];
        let labels = [];

        if (this.currentTrend === 'week') {
            const weekStart = new Date(this.currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            for (let i = 0; i < 7; i++) {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + i);
                dateRange.push(this.getDateString(date));
                labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
            }
        } else if (this.currentTrend === 'month') {
            const monthStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            const monthEnd = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            const daysInMonth = monthEnd.getDate();
            for (let i = 0; i < daysInMonth; i += Math.ceil(daysInMonth / 7)) {
                const date = new Date(monthStart);
                date.setDate(date.getDate() + i);
                dateRange.push(this.getDateString(date));
                labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
            }
        } else {
            // 全部：显示最近30天
            for (let i = 29; i >= 0; i--) {
                const date = new Date(this.currentDate);
                date.setDate(date.getDate() - i);
                dateRange.push(this.getDateString(date));
                if (i % 5 === 0) {
                    labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
                } else {
                    labels.push('');
                }
            }
        }

        // 按类别和日期统计
        const datasets = this.categories.map(category => {
            const data = dateRange.map(date => {
                const records = this.getRecordsByDate(date).filter(r => r.categoryId === category.id);
                return this.calculateTotalMinutes(records) / 60; // 转换为小时
            });

            return {
                label: category.name,
                data: data,
                backgroundColor: category.color + '80',
                borderColor: category.color,
                borderWidth: 1
            };
        });

        if (this.trendChart) {
            this.trendChart.destroy();
        }

        try {
            this.trendChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            ticks: {
                                callback: function (value) {
                                    return value + 'h';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('❌ 渲染时间趋势图失败:', error);
            showNotification?.('时间趋势图加载失败，请刷新重试', 'error');
        }
    }

    // 完整渲染
    render() {
        this.updateDateDisplay();
        this.renderRecords();
        this.renderCategories();
        this.renderGoals();
        this.renderCharts();
    }
}

// 全局时间管理系统实例
let timeTrackerSystem = null;
window.timeTrackerSystem = timeTrackerSystem;

// 初始化时间管理系统
function initTimeTrackerSystem() {
    if (!timeTrackerSystem) {
        timeTrackerSystem = new TimeTrackerSystem();
        window.timeTrackerSystem = timeTrackerSystem;
    }
    timeTrackerSystem.render();
    console.log('⏱️ 时间管理可视化看板功能已初始化');
}

// 模态框函数
function openTimeRecordModal() {
    const modal = document.getElementById('add-time-record-modal');
    if (!modal) return;

    const dateInput = document.getElementById('record-date-input');
    const categorySelect = document.getElementById('record-category-select');

    if (dateInput) {
        dateInput.value = timeTrackerSystem.getDateString(timeTrackerSystem.currentDate);
    }

    if (categorySelect) {
        setTimeTrackerCategoryOptions(categorySelect, timeTrackerSystem.categories);
    }

    modal.style.display = 'flex';
}

function closeTimeRecordModal() {
    const modal = document.getElementById('add-time-record-modal');
    if (modal) modal.style.display = 'none';

    // 清空表单
    document.getElementById('record-name-input').value = '';
    document.getElementById('record-hours-select').value = '0';
    document.getElementById('record-minutes-select').value = '0';
    document.getElementById('record-note-input').value = '';
}

function saveTimeRecord() {
    const name = document.getElementById('record-name-input').value.trim();
    const categoryId = document.getElementById('record-category-select').value;
    const hours = parseInt(document.getElementById('record-hours-select').value);
    const minutes = parseInt(document.getElementById('record-minutes-select').value);
    const date = document.getElementById('record-date-input').value;
    const note = document.getElementById('record-note-input').value.trim();

    if (!name) {
        timeTrackerSystem.showNotification('请输入事项名称', 'error');
        return;
    }

    if (hours === 0 && minutes === 0) {
        timeTrackerSystem.showNotification('时长不能为0', 'error');
        return;
    }

    const record = { name, categoryId, hours, minutes, date, note };
    if (timeTrackerSystem.addRecord(record)) {
        closeTimeRecordModal();
        timeTrackerSystem.render();
    }
}

function openCategoryModal() {
    const modal = document.getElementById('add-category-modal');
    if (modal) modal.style.display = 'flex';
}

function closeCategoryModal() {
    const modal = document.getElementById('add-category-modal');
    if (modal) modal.style.display = 'none';

    document.getElementById('category-name-input').value = '';
    document.getElementById('category-color-input').value = '#a855f7';
    document.getElementById('category-icon-input').value = '';
}

function saveCategory() {
    const name = document.getElementById('category-name-input').value.trim();
    const color = document.getElementById('category-color-input').value;
    const icon = document.getElementById('category-icon-input').value.trim();

    if (!name) {
        timeTrackerSystem.showNotification('请输入类别名称', 'error');
        return;
    }

    if (!icon) {
        timeTrackerSystem.showNotification('请输入图标', 'error');
        return;
    }

    timeTrackerSystem.addCategory({ name, color, icon });
    closeCategoryModal();
    timeTrackerSystem.render();
}

function openGoalModal() {
    const modal = document.getElementById('add-goal-modal');
    if (!modal) return;

    const categorySelect = document.getElementById('goal-category-select');
    if (categorySelect) {
        setTimeTrackerCategoryOptions(categorySelect, timeTrackerSystem.categories);
    }

    modal.style.display = 'flex';
}

function closeGoalModal() {
    const modal = document.getElementById('add-goal-modal');
    if (modal) modal.style.display = 'none';

    document.getElementById('goal-name-input').value = '';
    document.getElementById('goal-hours-input').value = '';
}

function saveGoal() {
    const name = document.getElementById('goal-name-input').value.trim();
    const hours = parseFloat(document.getElementById('goal-hours-input').value);
    const categoryId = document.getElementById('goal-category-select').value;

    if (!name) {
        timeTrackerSystem.showNotification('请输入目标名称', 'error');
        return;
    }

    if (!hours || hours <= 0) {
        timeTrackerSystem.showNotification('请输入有效的目标时长', 'error');
        return;
    }

    timeTrackerSystem.addGoal({ name, hours, categoryId });
    closeGoalModal();
    timeTrackerSystem.render();
}

// 绑定时间管理相关事件
function bindTimeTrackerEvents() {
    // 日期切换按钮
    const prevDateBtn = document.getElementById('prev-date-btn');
    const nextDateBtn = document.getElementById('next-date-btn');

    if (prevDateBtn) {
        prevDateBtn.addEventListener('click', () => {
            if (timeTrackerSystem) {
                timeTrackerSystem.prevDate();
            }
        });
    }

    if (nextDateBtn) {
        nextDateBtn.addEventListener('click', () => {
            if (timeTrackerSystem) {
                timeTrackerSystem.nextDate();
            }
        });
    }

    // 添加时间记录按钮
    const addTimeRecordBtn = document.getElementById('add-time-record-btn');
    if (addTimeRecordBtn) {
        addTimeRecordBtn.addEventListener('click', openTimeRecordModal);
    }

    // 添加类别按钮
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', openCategoryModal);
    }

    // 添加目标按钮
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', openGoalModal);
    }

    const recordsList = document.getElementById('time-records-list');
    if (recordsList && !recordsList.dataset.timeActionsBound) {
        recordsList.dataset.timeActionsBound = 'true';
        recordsList.addEventListener('click', event => {
            const actionBtn = event.target.closest('[data-time-action="delete-record"]');
            if (!actionBtn || !recordsList.contains(actionBtn) || !timeTrackerSystem) return;
            timeTrackerSystem.deleteRecord(actionBtn.dataset.recordId);
        });
    }

    const categoriesList = document.getElementById('categories-list');
    if (categoriesList && !categoriesList.dataset.timeActionsBound) {
        categoriesList.dataset.timeActionsBound = 'true';
        categoriesList.addEventListener('click', event => {
            const actionBtn = event.target.closest('[data-time-action="delete-category"]');
            if (!actionBtn || !categoriesList.contains(actionBtn) || !timeTrackerSystem) return;
            timeTrackerSystem.deleteCategory(actionBtn.dataset.categoryId);
        });
    }

    const goalsList = document.getElementById('goals-list');
    if (goalsList && !goalsList.dataset.timeActionsBound) {
        goalsList.dataset.timeActionsBound = 'true';
        goalsList.addEventListener('click', event => {
            const actionBtn = event.target.closest('[data-time-action="delete-goal"]');
            if (!actionBtn || !goalsList.contains(actionBtn) || !timeTrackerSystem) return;
            timeTrackerSystem.deleteGoal(actionBtn.dataset.goalId);
        });
    }

    // 图表切换按钮
    const chartTabs = document.querySelectorAll('.chart-tab[data-period]');
    chartTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有active类
            chartTabs.forEach(t => t.classList.remove('active'));
            // 添加active类到当前按钮
            tab.classList.add('active');
            // 更新周期并重新渲染
            if (timeTrackerSystem) {
                timeTrackerSystem.currentPeriod = tab.dataset.period;
                timeTrackerSystem.renderDistributionChart();
            }
        });
    });

    // 趋势图切换按钮
    const trendTabs = document.querySelectorAll('.chart-tab[data-trend]');
    trendTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 移除所有active类
            trendTabs.forEach(t => t.classList.remove('active'));
            // 添加active类到当前按钮
            tab.classList.add('active');
            // 更新趋势并重新渲染
            if (timeTrackerSystem) {
                timeTrackerSystem.currentTrend = tab.dataset.trend;
                timeTrackerSystem.renderTrendChart();
            }
        });
    });
}

// 添加CSS动画
if (!document.getElementById('time-tracker-animations')) {
    const style = document.createElement('style');
    style.id = 'time-tracker-animations';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

window.TimeTrackerSystem = TimeTrackerSystem;
window.initTimeTrackerSystem = initTimeTrackerSystem;
window.openTimeRecordModal = openTimeRecordModal;
window.closeTimeRecordModal = closeTimeRecordModal;
window.saveTimeRecord = saveTimeRecord;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.saveCategory = saveCategory;
window.openGoalModal = openGoalModal;
window.closeGoalModal = closeGoalModal;
window.saveGoal = saveGoal;
window.bindTimeTrackerEvents = bindTimeTrackerEvents;
