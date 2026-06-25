
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

// ==================== 智能健康管理系统 ====================

// AI智能健康管理系统
class AIHealthManager {
    constructor() {
        this.healthData = {
            workIntensity: [],
            stressLevel: [],
            breakHistory: [],
            healthRecommendations: [],
            wellnessScore: 0
        };
        this.healthThresholds = {
            maxWorkHours: 10, // 最大连续工作小时数
            minBreakInterval: 60, // 最小休息间隔（分钟）
            maxStressLevel: 0.8, // 最大压力水平
            minSleepHours: 7, // 最小睡眠小时数
            maxScreenTime: 8 // 最大屏幕时间（小时）
        };
        this.healthMetrics = {
            workIntensity: 0,
            stressLevel: 0,
            fatigueLevel: 0,
            screenTime: 0,
            breakTime: 0,
            sleepQuality: 0
        };
        this.init();
    }

    init() {
        console.log('💪 AI智能健康管理系统初始化');
        this.loadHealthData();
        this.startHealthMonitoring();
    }

    // 加载健康数据
    loadHealthData() {
        try {
            if (window.AIAssistantStorage) {
                this.healthData = window.AIAssistantStorage.getHealthData();
            }
        } catch (error) {
            console.error('❌ 加载健康数据失败:', error);
        }
    }

    // 保存健康数据
    saveHealthData() {
        try {
            if (window.AIAssistantStorage) {
                this.healthData = window.AIAssistantStorage.setHealthData(this.healthData);
                return;
            }
            console.warn('AIAssistantStorage is unavailable; health data was not persisted.');
        } catch (error) {
            console.error('❌ 保存健康数据失败:', error);
        }
    }

    // 开始健康监控
    startHealthMonitoring() {
        // 每15分钟检查一次健康状态
        setInterval(() => {
            this.checkHealthStatus();
        }, 900000);

        // 每小时更新健康指标
        setInterval(() => {
            this.updateHealthMetrics();
        }, 3600000);
    }

    // 检查健康状态
    checkHealthStatus() {
        console.log('💪 检查健康状态...');

        try {
            // 1. 分析工作强度
            const workIntensity = this.analyzeWorkIntensity();

            // 2. 评估压力水平
            const stressLevel = this.assessStressLevel();

            // 3. 检测疲劳状态
            const fatigueLevel = this.detectFatigue();

            // 4. 生成健康建议
            const recommendations = this.generateHealthRecommendations({
                workIntensity,
                stressLevel,
                fatigueLevel
            });

            // 5. 更新健康数据
            this.updateHealthData({
                workIntensity,
                stressLevel,
                fatigueLevel,
                recommendations
            });

            // 6. 发送健康提醒
            this.sendHealthReminders(recommendations);

        } catch (error) {
            console.error('❌ 健康状态检查失败:', error);
        }
    }

    // 分析工作强度
    analyzeWorkIntensity() {
        const now = new Date();
        const currentHour = now.getHours();

        // 获取今日任务数据
        const todayTasks = this.getTodayTasks();
        const completedTasks = todayTasks.filter(task => task.completed);
        const totalTasks = todayTasks.length;

        // 计算工作强度
        const workIntensity = totalTasks > 0 ? completedTasks.length / totalTasks : 0;

        // 基于时间调整强度
        let timeAdjustment = 1;
        if (currentHour < 9 || currentHour > 18) {
            timeAdjustment = 0.5; // 非工作时间降低强度
        }

        return Math.min(1, workIntensity * timeAdjustment);
    }

    // 评估压力水平
    assessStressLevel() {
        const workIntensity = this.analyzeWorkIntensity();
        const recentBreaks = this.getRecentBreaks();
        const screenTime = this.calculateScreenTime();

        // 基础压力水平
        let stressLevel = workIntensity * 0.6;

        // 休息不足增加压力
        if (recentBreaks.length < 2) {
            stressLevel += 0.2;
        }

        // 屏幕时间过长增加压力
        if (screenTime > this.healthThresholds.maxScreenTime) {
            stressLevel += 0.3;
        }

        return Math.min(1, stressLevel);
    }

    // 检测疲劳状态
    detectFatigue() {
        const workIntensity = this.analyzeWorkIntensity();
        const stressLevel = this.assessStressLevel();
        const currentHour = new Date().getHours();

        // 基础疲劳水平
        let fatigueLevel = (workIntensity + stressLevel) / 2;

        // 时间因素
        if (currentHour > 16) {
            fatigueLevel += 0.2; // 下午疲劳增加
        }

        // 连续工作时间
        const continuousWorkTime = this.getContinuousWorkTime();
        if (continuousWorkTime > 4) {
            fatigueLevel += 0.3; // 连续工作4小时以上疲劳增加
        }

        return Math.min(1, fatigueLevel);
    }

    // 生成健康建议
    generateHealthRecommendations(healthStatus) {
        const recommendations = [];

        // 工作强度建议
        if (healthStatus.workIntensity > 0.8) {
            recommendations.push({
                type: 'work_intensity',
                priority: 'high',
                title: '工作强度过高',
                message: '建议适当减少工作量，安排更多休息时间',
                action: 'take_break',
                duration: 15
            });
        }

        // 压力管理建议
        if (healthStatus.stressLevel > 0.7) {
            recommendations.push({
                type: 'stress_management',
                priority: 'high',
                title: '压力水平较高',
                message: '建议进行深呼吸练习或短暂冥想',
                action: 'meditation',
                duration: 10
            });
        }

        // 疲劳恢复建议
        if (healthStatus.fatigueLevel > 0.6) {
            recommendations.push({
                type: 'fatigue_recovery',
                priority: 'medium',
                title: '疲劳状态检测',
                message: '建议起身活动，做简单的伸展运动',
                action: 'stretch',
                duration: 5
            });
        }

        // 休息提醒
        const lastBreak = this.getLastBreakTime();
        const timeSinceBreak = Date.now() - lastBreak;
        if (timeSinceBreak > this.healthThresholds.minBreakInterval * 60 * 1000) {
            recommendations.push({
                type: 'break_reminder',
                priority: 'medium',
                title: '休息提醒',
                message: '已经工作较长时间，建议休息一下',
                action: 'take_break',
                duration: 10
            });
        }

        // 眼部健康建议
        const screenTime = this.calculateScreenTime();
        if (screenTime > 6) {
            recommendations.push({
                type: 'eye_health',
                priority: 'medium',
                title: '眼部健康提醒',
                message: '长时间使用屏幕，建议进行眼部放松',
                action: 'eye_exercise',
                duration: 3
            });
        }

        // 饮食建议
        const currentHour = new Date().getHours();
        if (currentHour >= 12 && currentHour <= 14) {
            recommendations.push({
                type: 'nutrition',
                priority: 'low',
                title: '午餐时间',
                message: '建议按时用餐，选择营养均衡的食物',
                action: 'meal_break',
                duration: 30
            });
        }

        return recommendations;
    }

    // 更新健康数据
    updateHealthData(data) {
        const timestamp = Date.now();

        this.healthData.workIntensity.push({
            timestamp,
            value: data.workIntensity
        });

        this.healthData.stressLevel.push({
            timestamp,
            value: data.stressLevel
        });

        this.healthData.healthRecommendations.push({
            timestamp,
            recommendations: data.recommendations
        });

        // 计算健康评分
        this.healthData.wellnessScore = this.calculateWellnessScore(data);

        // 保存数据
        this.saveHealthData();
    }

    // 计算健康评分
    calculateWellnessScore(healthStatus) {
        const workIntensity = healthStatus.workIntensity;
        const stressLevel = healthStatus.stressLevel;
        const fatigueLevel = healthStatus.fatigueLevel;

        // 基础评分
        let score = 100;

        // 工作强度影响
        if (workIntensity > 0.8) score -= 20;
        else if (workIntensity > 0.6) score -= 10;

        // 压力水平影响
        if (stressLevel > 0.7) score -= 25;
        else if (stressLevel > 0.5) score -= 15;

        // 疲劳状态影响
        if (fatigueLevel > 0.6) score -= 20;
        else if (fatigueLevel > 0.4) score -= 10;

        return Math.max(0, Math.min(100, score));
    }

    // 发送健康提醒
    sendHealthReminders(recommendations) {
        const highPriorityRecommendations = recommendations.filter(rec => rec.priority === 'high');

        if (highPriorityRecommendations.length > 0) {
            const recommendation = highPriorityRecommendations[0];
            this.showHealthReminder(recommendation);
        }
    }

    // 显示健康提醒
    showHealthReminder(recommendation) {
        // 创建健康提醒通知
        const notification = document.createElement('div');
        notification.className = 'health-reminder-notification';

        const content = document.createElement('div');
        content.className = 'reminder-content';

        const icon = document.createElement('div');
        icon.className = 'reminder-icon';
        icon.textContent = this.getHealthIcon(recommendation.type);

        const text = document.createElement('div');
        text.className = 'reminder-text';

        const title = document.createElement('div');
        title.className = 'reminder-title';
        title.textContent = recommendation.title || '';

        const message = document.createElement('div');
        message.className = 'reminder-message';
        message.textContent = recommendation.message || '';

        const closeButton = document.createElement('button');
        closeButton.className = 'reminder-close';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', '关闭健康提醒');
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => {
            notification.remove();
        });

        text.append(title, message);
        content.append(icon, text, closeButton);
        notification.appendChild(content);

        document.body.appendChild(notification);

        // 5秒后自动消失
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // 获取健康图标
    getHealthIcon(type) {
        const icons = {
            'work_intensity': '⚖️',
            'stress_management': '🧘',
            'fatigue_recovery': '😴',
            'break_reminder': '☕',
            'eye_health': '👁️',
            'nutrition': '🍎'
        };
        return icons[type] || '💪';
    }

    // 更新健康指标
    updateHealthMetrics() {
        this.healthMetrics.workIntensity = this.analyzeWorkIntensity();
        this.healthMetrics.stressLevel = this.assessStressLevel();
        this.healthMetrics.fatigueLevel = this.detectFatigue();
        this.healthMetrics.screenTime = this.calculateScreenTime();
        this.healthMetrics.breakTime = this.calculateBreakTime();
        this.healthMetrics.sleepQuality = this.assessSleepQuality();
    }

    // 获取今日任务
    getTodayTasks() {
        // 这里应该从任务管理系统获取今日任务
        // 暂时返回模拟数据
        return [];
    }

    // 获取最近休息记录
    getRecentBreaks() {
        const now = Date.now();
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        return this.healthData.breakHistory.filter(breakRecord =>
            breakRecord.timestamp > oneDayAgo
        );
    }

    // 计算屏幕时间
    calculateScreenTime() {
        // 这里应该从系统获取屏幕时间数据
        // 暂时返回模拟数据
        return 6; // 6小时
    }

    // 获取连续工作时间
    getContinuousWorkTime() {
        // 这里应该计算连续工作时间
        // 暂时返回模拟数据
        return 3; // 3小时
    }

    // 获取上次休息时间
    getLastBreakTime() {
        const breaks = this.healthData.breakHistory;
        if (breaks.length === 0) {
            return Date.now() - 2 * 60 * 60 * 1000; // 2小时前
        }
        return breaks[breaks.length - 1].timestamp;
    }

    // 计算休息时间
    calculateBreakTime() {
        const breaks = this.getRecentBreaks();
        return breaks.reduce((total, breakRecord) => total + breakRecord.duration, 0);
    }

    // 评估睡眠质量
    assessSleepQuality() {
        // 这里应该从睡眠监测设备获取数据
        // 暂时返回模拟数据
        return 0.8; // 80%睡眠质量
    }

    // 获取健康报告
    getHealthReport() {
        return {
            wellnessScore: this.healthData.wellnessScore,
            metrics: this.healthMetrics,
            recommendations: this.healthData.healthRecommendations.slice(-5),
            trends: this.getHealthTrends()
        };
    }

    // 获取健康趋势
    getHealthTrends() {
        const workIntensityTrend = this.calculateTrend(this.healthData.workIntensity);
        const stressTrend = this.calculateTrend(this.healthData.stressLevel);

        return {
            workIntensity: workIntensityTrend,
            stressLevel: stressTrend
        };
    }

    // 计算趋势
    calculateTrend(data) {
        if (data.length < 2) return 'stable';

        const recent = data.slice(-3);
        const older = data.slice(-6, -3);

        if (recent.length === 0 || older.length === 0) return 'stable';

        const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
        const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length;

        if (recentAvg > olderAvg * 1.1) return 'increasing';
        if (recentAvg < olderAvg * 0.9) return 'decreasing';
        return 'stable';
    }

    // 记录休息
    recordBreak(duration) {
        this.healthData.breakHistory.push({
            timestamp: Date.now(),
            duration: duration
        });
        this.saveHealthData();
    }

    // 获取健康建议
    getHealthRecommendations() {
        const recentRecommendations = this.healthData.healthRecommendations.slice(-1);
        if (recentRecommendations.length === 0) return [];
        return recentRecommendations[0].recommendations;
    }
}

// 初始化AI智能健康管理系统
const aiHealthManager = new AIHealthManager();
window.AIHealthManager = AIHealthManager;
window.aiHealthManager = aiHealthManager;

// ==================== 智能健康管理前端管理 ====================

// 加载智能健康管理系统
function loadSmartHealthSystem() {
    console.log('💪 加载智能健康管理系统');

    try {
        // 更新健康状态显示
        updateHealthStatusDisplay();

        // 加载健康建议
        loadHealthRecommendations();

        console.log('✅ 智能健康管理系统加载完成');
    } catch (error) {
        console.error('❌ 智能健康管理系统加载失败:', error);
    }
}

// 更新健康状态显示
function updateHealthStatusDisplay() {
    const report = aiHealthManager.getHealthReport();

    // 更新健康评分
    const wellnessScoreEl = document.getElementById('wellness-score');
    if (wellnessScoreEl) {
        wellnessScoreEl.textContent = report.wellnessScore || 85;
    }

    // 更新工作强度
    const workIntensityEl = document.getElementById('work-intensity');
    if (workIntensityEl) {
        const intensity = report.metrics.workIntensity || 0.5;
        if (intensity > 0.8) workIntensityEl.textContent = '高';
        else if (intensity > 0.5) workIntensityEl.textContent = '中等';
        else workIntensityEl.textContent = '低';
    }

    // 更新压力水平
    const stressLevelEl = document.getElementById('stress-level');
    if (stressLevelEl) {
        const stress = report.metrics.stressLevel || 0.3;
        if (stress > 0.7) stressLevelEl.textContent = '高';
        else if (stress > 0.4) stressLevelEl.textContent = '中等';
        else stressLevelEl.textContent = '低';
    }
}

// 加载健康建议
function loadHealthRecommendations() {
    const recommendations = aiHealthManager.getHealthRecommendations();

    if (recommendations.length === 0) {
        return;
    }

    // 显示健康建议区域
    const recommendationsEl = document.getElementById('health-recommendations');
    if (recommendationsEl) {
        recommendationsEl.style.display = 'block';

        // 不再自动滚动到健康建议区域，让用户自己滚动查看
        // 移除了自动滚动代码，保持页面在顶部
    }

    // 更新建议列表
    const listEl = document.getElementById('health-recommendations-list');
    if (listEl) {
        const fragment = document.createDocumentFragment();
        recommendations.forEach(rec => {
            fragment.appendChild(createHealthRecommendationListItem(rec));
        });
        listEl.replaceChildren(fragment);
    }
}

function createHealthRecommendationListItem(recommendation) {
    const item = document.createElement('div');
    item.className = 'health-recommendation-item';

    const icon = document.createElement('span');
    icon.className = 'recommendation-icon';
    icon.textContent = getHealthRecommendationIcon(recommendation.type);

    const text = document.createElement('span');
    text.className = 'recommendation-text';
    text.textContent = recommendation.message || '';

    item.append(icon, text);
    return item;
}

// 获取健康建议图标
function getHealthRecommendationIcon(type) {
    const icons = {
        'work_intensity': '⚖️',
        'stress_management': '🧘',
        'fatigue_recovery': '😴',
        'break_reminder': '☕',
        'eye_health': '👁️',
        'nutrition': '🍎'
    };
    return icons[type] || '💪';
}

// 查看健康报告
function viewHealthReport() {
    console.log('📊 查看健康报告');

    const report = aiHealthManager.getHealthReport();

    // 创建健康报告模态框
    const modal = document.createElement('div');
    modal.className = 'health-report-modal';
    renderSafeModuleMarkup(modal, `
        <div class="modal-overlay" data-health-action="close-report"></div>
        <div class="modal-content health-modal-content health-modal-content-md">
            <div class="modal-header health-modal-header">
                <h3 class="health-modal-title">📊 健康报告</h3>
                <button class="modal-close health-modal-close" data-health-action="close-report">×</button>
            </div>
            <div class="modal-body health-modal-body">
                <div class="health-metrics health-metrics-grid">
                    <div class="metric-item health-metric-card health-metric-green">
                        <div class="metric-label health-metric-label">健康评分</div>
                        <div class="metric-value health-metric-value health-metric-value-green">${report.wellnessScore}</div>
                    </div>
                    <div class="metric-item health-metric-card health-metric-blue">
                        <div class="metric-label health-metric-label">工作强度</div>
                        <div class="metric-value health-metric-value health-metric-value-blue">${Math.round(report.metrics.workIntensity * 100)}%</div>
                    </div>
                    <div class="metric-item health-metric-card health-metric-amber">
                        <div class="metric-label health-metric-label">压力水平</div>
                        <div class="metric-value health-metric-value health-metric-value-amber">${Math.round(report.metrics.stressLevel * 100)}%</div>
                    </div>
                    <div class="metric-item health-metric-card health-metric-red">
                        <div class="metric-label health-metric-label">疲劳程度</div>
                        <div class="metric-value health-metric-value health-metric-value-red">${Math.round(report.metrics.fatigueLevel * 100)}%</div>
                    </div>
                </div>
                <div class="health-trends health-trends-panel">
                    <h4 class="health-trends-title">健康趋势</h4>
                    <div class="trend-item health-trend-item health-trend-item-bordered">
                        <span class="health-trend-label">工作强度趋势：</span>
                        <span class="health-trend-badge trend-${report.trends.workIntensity}">${getTrendText(report.trends.workIntensity)}</span>
                    </div>
                    <div class="trend-item health-trend-item">
                        <span class="health-trend-label">压力水平趋势：</span>
                        <span class="health-trend-badge trend-${report.trends.stressLevel}">${getTrendText(report.trends.stressLevel)}</span>
                    </div>
                </div>
            </div>
        </div>
    `);

    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-health-action="close-report"]');
        if (!actionEl || !modal.contains(actionEl)) return;
        closeHealthReportModal();
    });
}

// 关闭健康报告模态框
function closeHealthReportModal() {
    const modal = document.querySelector('.health-report-modal');
    if (modal) {
        modal.remove();
    }
}

// 获取趋势文本
function getTrendText(trend) {
    const trendTexts = {
        'increasing': '上升',
        'decreasing': '下降',
        'stable': '稳定'
    };
    return trendTexts[trend] || '未知';
}

// 查看健康建议
function viewHealthRecommendations() {
    console.log('💡 查看健康建议');

    const recommendations = aiHealthManager.getHealthRecommendations();

    if (recommendations.length === 0) {
        showNotification('暂无健康建议', 'info');
        return;
    }

    // 显示健康建议区域（不自动滚动）
    const recommendationsEl = document.getElementById('health-recommendations');
    if (recommendationsEl) {
        recommendationsEl.style.display = 'block';
    }

    // 创建健康建议模态框
    const modal = document.createElement('div');
    modal.className = 'health-recommendations-modal';
    renderSafeModuleMarkup(modal, `
        <div class="modal-overlay" data-health-action="close-recommendations"></div>
        <div class="modal-content health-modal-content health-modal-content-md">
            <div class="modal-header health-modal-header">
                <h3 class="health-modal-title">💡 健康建议</h3>
                <button class="modal-close health-modal-close" data-health-action="close-recommendations">×</button>
            </div>
            <div class="modal-body health-modal-body">
                <div class="recommendations-list"></div>
            </div>
        </div>
    `);

    const recommendationsList = modal.querySelector('.recommendations-list');
    if (recommendationsList) {
        const fragment = document.createDocumentFragment();
        recommendations.forEach(recommendation => {
            fragment.appendChild(createHealthRecommendationCard(recommendation));
        });
        recommendationsList.appendChild(fragment);
    }

    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-health-action]');
        if (!actionEl || !modal.contains(actionEl)) return;

        const action = actionEl.dataset.healthAction;
        if (action === 'close-recommendations') {
            closeHealthRecommendationsModal();
        } else if (action === 'execute-recommendation') {
            executeHealthAction(actionEl.dataset.action, Number(actionEl.dataset.duration));
        }
    });
}

function getHealthRecommendationPriorityMeta(priority) {
    if (priority === 'high') {
        return {
            label: '高',
            color: '#dc2626',
            surface: 'rgba(239, 68, 68, 0.1)',
            border: 'rgba(239, 68, 68, 0.2)'
        };
    }

    if (priority === 'medium') {
        return {
            label: '中',
            color: '#d97706',
            surface: 'rgba(245, 158, 11, 0.1)',
            border: 'rgba(245, 158, 11, 0.2)'
        };
    }

    return {
        label: '低',
        color: '#16a34a',
        surface: 'rgba(34, 197, 94, 0.1)',
        border: 'rgba(34, 197, 94, 0.2)'
    };
}

function createHealthRecommendationCard(recommendation) {
    const priorityMeta = getHealthRecommendationPriorityMeta(recommendation.priority);

    const card = document.createElement('div');
    card.className = `recommendation-card priority-${recommendation.priority || 'low'}`;
    card.style.setProperty('--health-priority-surface', priorityMeta.surface);
    card.style.setProperty('--health-priority-border', priorityMeta.border);
    card.style.setProperty('--health-priority-color', priorityMeta.color);

    const header = document.createElement('div');
    header.className = 'recommendation-header';

    const icon = document.createElement('div');
    icon.className = 'recommendation-icon';
    icon.textContent = getHealthRecommendationIcon(recommendation.type);

    const titleWrap = document.createElement('div');
    titleWrap.className = 'recommendation-title-wrap';

    const title = document.createElement('div');
    title.className = 'recommendation-title';
    title.textContent = recommendation.title || '';

    const priority = document.createElement('div');
    priority.className = 'recommendation-priority';
    priority.textContent = `${priorityMeta.label}优先级`;

    const message = document.createElement('div');
    message.className = 'recommendation-message';
    message.textContent = recommendation.message || '';

    const actions = document.createElement('div');
    actions.className = 'recommendation-actions';

    const actionButton = document.createElement('button');
    actionButton.className = 'action-btn health-recommendation-action';
    actionButton.dataset.healthAction = 'execute-recommendation';
    actionButton.dataset.action = recommendation.action || '';
    actionButton.dataset.duration = String(Number(recommendation.duration) || 0);
    actionButton.textContent = `执行建议 (${Number(recommendation.duration) || 0}分钟)`;

    titleWrap.append(title, priority);
    header.append(icon, titleWrap);
    actions.appendChild(actionButton);
    card.append(header, message, actions);

    return card;
}

// 关闭健康建议模态框
function closeHealthRecommendationsModal() {
    const modal = document.querySelector('.health-recommendations-modal');
    if (modal) {
        modal.remove();
    }
}

// 执行健康行动
function executeHealthAction(action, duration) {
    console.log('💪 执行健康行动:', action, duration);

    switch (action) {
        case 'take_break':
            showNotification(`开始休息 ${duration} 分钟`, 'success');
            aiHealthManager.recordBreak(duration);
            break;
        case 'meditation':
            showNotification(`开始冥想 ${duration} 分钟`, 'success');
            break;
        case 'stretch':
            showNotification(`开始伸展运动 ${duration} 分钟`, 'success');
            break;
        case 'eye_exercise':
            showNotification(`开始眼部放松 ${duration} 分钟`, 'success');
            break;
        case 'meal_break':
            showNotification(`用餐时间 ${duration} 分钟`, 'success');
            break;
        default:
            showNotification('健康行动已记录', 'success');
    }
}

// 记录健康活动
function recordHealthActivity() {
    console.log('📝 记录健康活动');

    // 创建记录活动模态框
    const modal = document.createElement('div');
    modal.className = 'health-activity-modal';
    renderSafeModuleMarkup(modal, `
        <div class="modal-overlay" data-health-action="close-activity"></div>
        <div class="modal-content health-modal-content health-modal-content-sm">
            <div class="modal-header health-modal-header">
                <h3 class="health-modal-title">📝 记录健康活动</h3>
                <button class="modal-close health-modal-close" data-health-action="close-activity">×</button>
            </div>
            <div class="modal-body health-modal-body">
                <div class="activity-form">
                    <div class="form-group health-form-group">
                        <label class="health-form-label">活动类型：</label>
                        <select id="activity-type" class="health-form-control">
                            <option value="break">休息</option>
                            <option value="exercise">运动</option>
                            <option value="meditation">冥想</option>
                            <option value="meal">用餐</option>
                            <option value="sleep">睡眠</option>
                        </select>
                    </div>
                    <div class="form-group health-form-group">
                        <label class="health-form-label">持续时间（分钟）：</label>
                        <input type="number" id="activity-duration" min="1" max="480" value="15" class="health-form-control">
                    </div>
                    <div class="form-group health-form-group health-form-group-lg">
                        <label class="health-form-label">备注：</label>
                        <textarea id="activity-notes" placeholder="可选备注信息" class="health-form-control health-form-textarea"></textarea>
                    </div>
                    <div class="form-actions health-form-actions">
                        <button class="btn-primary health-action-primary" data-health-action="save-activity">保存记录</button>
                        <button class="btn-secondary health-action-secondary" data-health-action="close-activity">取消</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-health-action]');
        if (!actionEl || !modal.contains(actionEl)) return;

        const action = actionEl.dataset.healthAction;
        if (action === 'close-activity') {
            closeHealthActivityModal();
        } else if (action === 'save-activity') {
            saveHealthActivity();
        }
    });
}

// 关闭健康活动模态框
function closeHealthActivityModal() {
    const modal = document.querySelector('.health-activity-modal');
    if (modal) {
        modal.remove();
    }
}

// 保存健康活动
function saveHealthActivity() {
    const activityType = document.getElementById('activity-type').value;
    const duration = parseInt(document.getElementById('activity-duration').value);
    const notes = document.getElementById('activity-notes').value;

    if (!duration || duration <= 0) {
        showNotification('请输入有效的持续时间', 'error');
        return;
    }

    // 记录活动
    aiHealthManager.recordBreak(duration);

    showNotification('健康活动记录成功', 'success');
    closeHealthActivityModal();

    // 更新健康状态显示
    updateHealthStatusDisplay();
}

// 暴露到全局作用域
window.loadSmartHealthSystem = loadSmartHealthSystem;
window.viewHealthReport = viewHealthReport;
window.closeHealthReportModal = closeHealthReportModal;
window.viewHealthRecommendations = viewHealthRecommendations;
window.closeHealthRecommendationsModal = closeHealthRecommendationsModal;
window.executeHealthAction = executeHealthAction;
window.recordHealthActivity = recordHealthActivity;
window.closeHealthActivityModal = closeHealthActivityModal;
window.saveHealthActivity = saveHealthActivity;
