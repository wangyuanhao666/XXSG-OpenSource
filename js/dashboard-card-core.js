// Dashboard stat-card interactions and completion-rate detail panel.
// Extracted from script.js; reads task data through window.XXSGAppRuntime.

function getDashboardTasks() {
    return window.XXSGAppRuntime?.tasks || [];
}

function showCompletionRateModal() {
    console.log('showCompletionRateModal 被调用');
    console.log('当前任务列表:', tasks);

    // 计算统计数据
    const completedTasks = getDashboardTasks().filter(task => task.completed).length;
    const totalTasks = getDashboardTasks().length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const pendingTasks = totalTasks - completedTasks;

    // 计算平均完成时间
    const completedTaskList = getDashboardTasks().filter(task => task.completed);
    let avgCompletionTime = 0;
    if (completedTaskList.length > 0) {
        const totalDays = completedTaskList.reduce((sum, task) => {
            if (task.completedDate && task.createdDate) {
                const created = new Date(task.createdDate);
                const completed = new Date(task.completedDate);
                const days = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
                return sum + days;
            }
            return sum;
        }, 0);
        avgCompletionTime = Math.round(totalDays / completedTaskList.length);
    }

    // 计算效率评分（基于完成率和平均完成时间）
    let efficiencyScore = 0;
    if (totalTasks > 0) {
        const completionScore = completionRate;
        const timeScore = avgCompletionTime > 0 ? Math.max(0, 100 - avgCompletionTime * 5) : 50;
        efficiencyScore = Math.round((completionScore + timeScore) / 2);
    }

    // 移除已存在的完成率数据视图
    const existingCompletionRateList = document.getElementById('completion-rate-list');
    if (existingCompletionRateList) {
        existingCompletionRateList.remove();
    }

    const completionRateEl = createCompletionRateList({
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate,
        avgCompletionTime,
        efficiencyScore
    });

    // 找到统计卡片容器
    const dashboardStats = document.querySelector('.dashboard-stats');
    if (dashboardStats) {
        // 在统计卡片下方插入完成率数据视图
        dashboardStats.insertAdjacentElement('afterend', completionRateEl);

        // 滚动到完成率数据视图位置
        completionRateEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function createCompletionRateList(stats) {
    const wrapper = document.createElement('div');
    wrapper.id = 'completion-rate-list';
    wrapper.className = 'dashboard-task-list';

    const header = document.createElement('div');
    header.className = 'task-list-header completion-rate';
    const title = document.createElement('h3');
    title.textContent = `任务完成率统计 (${stats.totalTasks})`;
    header.append(title, createDashboardCloseButton(closeCompletionRateModal));

    const content = document.createElement('div');
    content.className = 'task-list-content';
    const body = document.createElement('div');
    body.style.cssText = 'text-align: center; padding: 20px;';

    const analysis = document.createElement('div');
    analysis.style.cssText = 'margin-bottom: 20px;';
    analysis.append(
        createDashboardSectionTitle('📊 完成率分析'),
        createDashboardMetricGrid([
            ['#e8f5e8', '#4caf50', stats.completedTasks, '已完成任务', '24px', '14px'],
            ['#ffeaea', '#f44336', stats.pendingTasks, '未完成任务', '24px', '14px']
        ], '1fr 1fr', '15px', '20px')
    );
    analysis.appendChild(createDashboardSingleMetric('#f0f8ff', '#2196f3', `${stats.completionRate}%`, '完成进度', '28px', '14px', '15px 15px 20px'));

    const distribution = document.createElement('div');
    distribution.style.cssText = 'margin-bottom: 20px;';
    distribution.append(
        createDashboardSectionTitle('📋 任务状态分布'),
        createDashboardMetricGrid([
            ['#fff3e0', '#ff9800', stats.totalTasks - stats.completedTasks, '进行中', '18px', '12px'],
            ['#e8f5e8', '#4caf50', stats.completedTasks, '已完成', '18px', '12px'],
            ['#f3e5f5', '#9c27b0', 0, '已暂停', '18px', '12px']
        ], '1fr 1fr 1fr', '10px')
    );

    const summary = createDashboardMetricGrid([
        ['#f5f5f5', '#666', `${stats.avgCompletionTime} 天`, '平均完成时间', '20px', '12px'],
        ['#f5f5f5', '#666', `${stats.efficiencyScore}%`, '效率评分', '20px', '12px']
    ], '1fr 1fr', '15px');

    body.append(analysis, distribution, summary);
    content.appendChild(body);
    wrapper.append(header, content);
    return wrapper;
}

function createDashboardSectionTitle(text) {
    const title = document.createElement('h4');
    title.style.cssText = 'color: #333; margin-bottom: 15px;';
    title.textContent = text;
    return title;
}

function createDashboardMetricGrid(items, columns, gap, marginBottom = '') {
    const grid = document.createElement('div');
    grid.style.cssText = `display: grid; grid-template-columns: ${columns}; gap: ${gap};${marginBottom ? ` margin-bottom: ${marginBottom};` : ''}`;
    items.forEach(([background, color, value, label, valueSize, labelSize]) => {
        grid.appendChild(createDashboardSingleMetric(background, color, value, label, valueSize, labelSize));
    });
    return grid;
}

function createDashboardSingleMetric(background, color, value, label, valueSize, labelSize, padding = '15px') {
    const box = document.createElement('div');
    box.style.cssText = `background: ${background}; padding: ${padding}; border-radius: 10px; text-align: center;`;
    const valueEl = document.createElement('div');
    valueEl.style.cssText = `font-size: ${valueSize}; color: ${color}; font-weight: bold;`;
    valueEl.textContent = String(value);
    const labelEl = document.createElement('div');
    labelEl.style.cssText = `color: ${labelSize === '12px' ? '#999' : '#666'}; font-size: ${labelSize};`;
    labelEl.textContent = label;
    box.append(valueEl, labelEl);
    return box;
}

// 关闭完成率数据视图
function closeCompletionRateModal() {
    const completionRateList = document.getElementById('completion-rate-list');
    if (completionRateList) {
        completionRateList.remove();
    }
}

// 绑定仪表板统计卡片的点击事件
function bindDashboardCardEvents() {
    console.log('开始绑定仪表板卡片事件...');

    const cards = document.querySelectorAll('.dashboard-stats .stat-item');
    if (!cards.length) {
        console.warn('未找到仪表板统计卡片');
        return;
    }

    cards.forEach((card, index) => {
        const handler = (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (index === 0) {
                console.log('点击总任务卡片 - 事件触发');
                showTaskModal('all');
            } else if (index === 1) {
                console.log('点击已完成卡片 - 事件触发');
                showTaskModal('completed');
            } else if (index === 2) {
                console.log('点击完成率卡片 - 事件触发');
                showCompletionRateModal();
            }
        };

        card.style.cursor = 'pointer';
        card.addEventListener('click', handler);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                handler(event);
            }
        });
        card.setAttribute('tabindex', '0');
    });

    console.log('仪表板统计卡片事件绑定完成');
}

// 初始化仪表板图表

window.showCompletionRateModal = showCompletionRateModal;
window.closeCompletionRateModal = closeCompletionRateModal;
window.bindDashboardCardEvents = bindDashboardCardEvents;
