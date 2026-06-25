
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

// ==================== 第二阶段剩余功能：智能提醒系统 ====================

// AI智能提醒系统
class AISmartReminder {
    constructor() {
        this.reminders = [];
        this.notificationPermission = null;
        this.workIntensityThreshold = 0.8; // 工作强度阈值
        this.fatigueThreshold = 0.7; // 疲劳阈值
        this.init();
    }

    init() {
        console.log('🔔 AI智能提醒系统初始化');
        this.requestNotificationPermission();
        this.startMonitoring();
    }

    // 请求通知权限
    async requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                // 显示权限请求提示
                this.showPermissionRequest();
            } else {
                this.notificationPermission = Notification.permission;
                console.log('📱 通知权限状态:', this.notificationPermission);
            }
        } else {
            console.log('❌ 浏览器不支持通知功能');
        }
    }

    // 显示权限请求提示
    showPermissionRequest() {
        const permissionModal = document.createElement('div');
        permissionModal.className = 'notification-permission-modal';
        renderSafeModuleMarkup(permissionModal, `
            <div class="modal-overlay" data-reminder-action="close-permission"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔔 启用智能提醒</h3>
                </div>
                <div class="modal-body">
                    <div class="permission-icon">🔔</div>
                    <h4>获取通知权限</h4>
                    <p>为了为您提供智能工作提醒，需要获取浏览器通知权限。</p>
                    <div class="permission-benefits">
                        <div class="benefit-item">
                            <span class="benefit-icon">⚖️</span>
                            <span class="benefit-text">工作负荷过高提醒</span>
                        </div>
                        <div class="benefit-item">
                            <span class="benefit-icon">😴</span>
                            <span class="benefit-text">疲劳状态检测提醒</span>
                        </div>
                        <div class="benefit-item">
                            <span class="benefit-icon">⏰</span>
                            <span class="benefit-text">最佳执行时间提醒</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" data-reminder-action="close-permission">稍后设置</button>
                    <button class="btn-primary" data-reminder-action="request-permission">立即授权</button>
                </div>
            </div>
        `);

        permissionModal.addEventListener('click', event => {
            const actionEl = event.target.closest('[data-reminder-action]');
            if (!actionEl || !permissionModal.contains(actionEl)) return;

            const action = actionEl.dataset.reminderAction;
            if (action === 'close-permission') {
                closePermissionRequest();
            } else if (action === 'request-permission') {
                requestNotificationPermissionNow();
            }
        });

        document.body.appendChild(permissionModal);
    }

    // 实际请求通知权限
    async requestNotificationPermissionNow() {
        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;

            if (permission === 'granted') {
                console.log('✅ 通知权限已授予');
                showNotification('✅ 通知权限已获取，智能提醒功能已启用', 'success');
            } else {
                console.log('❌ 通知权限被拒绝');
                showNotification('⚠️ 通知权限被拒绝，将使用页面内提醒', 'warning');
            }

            closePermissionRequest();
        } catch (error) {
            console.error('❌ 请求通知权限失败:', error);
            showNotification('❌ 请求通知权限失败', 'error');
            closePermissionRequest();
        }
    }

    // 开始监控
    startMonitoring() {
        // 每5分钟检查一次工作强度
        setInterval(() => {
            this.checkWorkIntensity();
        }, 300000);

        // 每30分钟检查一次疲劳状态
        setInterval(() => {
            this.checkFatigueStatus();
        }, 1800000);

        // 每小时检查一次最佳执行时间
        setInterval(() => {
            this.checkOptimalExecutionTime();
        }, 3600000);
    }

    // 检查工作强度
    checkWorkIntensity() {
        const analysis = aiBehaviorAnalyzer.getWorkPatternAnalysis();
        if (!analysis.workloadAssessment) return;

        const currentHour = new Date().getHours();
        const currentWorkload = this.getCurrentWorkload();
        const averageWorkload = analysis.workloadAssessment.averageDailyWorkload;

        if (currentWorkload > averageWorkload * this.workIntensityThreshold) {
            this.showReminder({
                type: 'workload',
                title: '工作负荷提醒',
                message: '当前工作负荷较高，建议适当休息或调整任务分配',
                priority: 'medium'
            });
        }
    }

    // 检查疲劳状态
    checkFatigueStatus() {
        const analysis = aiBehaviorAnalyzer.getWorkPatternAnalysis();
        if (!analysis.efficiencyCurves) return;

        const currentHour = new Date().getHours();
        const currentEfficiency = analysis.efficiencyCurves.hourlyEfficiency[currentHour] || 0;

        if (currentEfficiency < 50) { // 效率低于50%认为疲劳
            this.showReminder({
                type: 'fatigue',
                title: '疲劳检测提醒',
                message: '检测到工作效率下降，建议休息15-20分钟',
                priority: 'high'
            });
        }
    }

    // 检查最佳执行时间
    checkOptimalExecutionTime() {
        const analysis = aiBehaviorAnalyzer.getWorkPatternAnalysis();
        if (!analysis.efficiencyCurves) return;

        const currentHour = new Date().getHours();
        const peakHours = analysis.efficiencyCurves.peakEfficiencyHours || [];

        if (peakHours.includes(currentHour)) {
            this.showReminder({
                type: 'optimal_time',
                title: '最佳执行时间',
                message: '当前是您的高效时段，建议安排重要任务',
                priority: 'low'
            });
        }
    }

    // 获取当前工作负荷
    getCurrentWorkload() {
        const today = new Date().toDateString();
        const todayTasks = aiBehaviorAnalyzer.userBehaviorData.workloadHistory.filter(record => {
            const recordDate = new Date(record.timestamp).toDateString();
            return recordDate === today;
        });
        return todayTasks.length;
    }

    // 显示提醒
    showReminder(reminder) {
        console.log('🔔 智能提醒:', reminder);

        // 添加到提醒列表
        this.reminders.push({
            ...reminder,
            timestamp: new Date().toISOString(),
            id: Date.now()
        });

        // 显示浏览器通知
        if (this.notificationPermission === 'granted') {
            new Notification(reminder.title, {
                body: reminder.message,
                icon: '/favicon.svg',
                tag: reminder.type
            });
        }

        // 显示页面通知
        this.showPageNotification(reminder);

        // 保存提醒记录
        this.saveReminders();
    }

    // 显示页面通知
    showPageNotification(reminder) {
        const notification = document.createElement('div');
        notification.className = 'smart-reminder-notification';

        const content = document.createElement('div');
        content.className = 'reminder-content';

        const icon = document.createElement('div');
        icon.className = 'reminder-icon';
        icon.textContent = this.getReminderIcon(reminder.type);

        const text = document.createElement('div');
        text.className = 'reminder-text';

        const title = document.createElement('div');
        title.className = 'reminder-title';
        title.textContent = reminder.title || '';

        const message = document.createElement('div');
        message.className = 'reminder-message';
        message.textContent = reminder.message || '';

        const closeButton = document.createElement('button');
        closeButton.className = 'reminder-close';
        closeButton.type = 'button';
        closeButton.setAttribute('aria-label', '关闭提醒');
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => {
            notification.remove();
        });

        text.append(title, message);
        content.append(icon, text, closeButton);
        notification.appendChild(content);

        document.body.appendChild(notification);

        // 5秒后自动移除
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // 获取提醒图标
    getReminderIcon(type) {
        const icons = {
            'workload': '⚖️',
            'fatigue': '😴',
            'optimal_time': '⏰',
            'deadline': '⏰'
        };
        return icons[type] || '🔔';
    }

    // 保存提醒记录
    saveReminders() {
        try {
            if (window.AIAssistantStorage) {
                this.reminders = window.AIAssistantStorage.setReminders(this.reminders);
                return;
            }
            console.warn('AIAssistantStorage is unavailable; reminders were not persisted.');
        } catch (error) {
            console.error('❌ 保存提醒记录失败:', error);
        }
    }

    // 加载提醒记录
    loadReminders() {
        try {
            if (window.AIAssistantStorage) {
                this.reminders = window.AIAssistantStorage.getReminders();
            }
        } catch (error) {
            console.error('❌ 加载提醒记录失败:', error);
        }
    }

    // 获取提醒历史
    getReminderHistory() {
        return this.reminders.slice(-10); // 返回最近10条提醒
    }
}

// 初始化AI智能提醒系统
const aiSmartReminder = new AISmartReminder();
window.AISmartReminder = AISmartReminder;
window.aiSmartReminder = aiSmartReminder;

// ==================== 智能提醒系统前端管理 ====================

// 加载智能提醒系统
function loadSmartReminderSystem() {
    console.log('🔔 加载智能提醒系统...');

    if (typeof aiSmartReminder === 'undefined') {
        console.warn('⚠️ AI智能提醒系统未初始化');
        return;
    }

    try {
        // 更新提醒状态
        updateReminderStatus();

        // 加载提醒历史
        loadReminderHistory();

        console.log('✅ 智能提醒系统加载完成');
    } catch (error) {
        console.error('❌ 加载智能提醒系统失败:', error);
    }
}

// 更新提醒状态
function updateReminderStatus() {
    const analysis = aiBehaviorAnalyzer.getWorkPatternAnalysis();

    // 更新工作负荷状态
    const workloadEl = document.getElementById('workload-status');
    if (workloadEl) {
        if (analysis.workloadAssessment && analysis.workloadAssessment.averageDailyWorkload) {
            const avgWorkload = Math.round(analysis.workloadAssessment.averageDailyWorkload);
            const currentWorkload = aiSmartReminder.getCurrentWorkload();
            const status = currentWorkload > avgWorkload * 1.2 ? '高负荷' :
                currentWorkload > avgWorkload * 0.8 ? '正常' : '低负荷';
            workloadEl.textContent = `${status} (${currentWorkload}/${avgWorkload})`;
        } else {
            workloadEl.textContent = '数据不足';
        }
    }

    // 更新疲劳检测状态
    const fatigueEl = document.getElementById('fatigue-status');
    if (fatigueEl) {
        if (analysis.efficiencyCurves && analysis.efficiencyCurves.hourlyEfficiency) {
            const currentHour = new Date().getHours();
            const currentEfficiency = analysis.efficiencyCurves.hourlyEfficiency[currentHour] || 0;
            const status = currentEfficiency < 50 ? '疲劳状态' :
                currentEfficiency < 70 ? '效率一般' : '状态良好';
            fatigueEl.textContent = `${status} (${Math.round(currentEfficiency)}%)`;
        } else {
            fatigueEl.textContent = '数据不足';
        }
    }

    // 更新最佳执行时间状态
    const optimalTimeEl = document.getElementById('optimal-time-status');
    if (optimalTimeEl) {
        if (analysis.efficiencyCurves && analysis.efficiencyCurves.peakEfficiencyHours) {
            const currentHour = new Date().getHours();
            const peakHours = analysis.efficiencyCurves.peakEfficiencyHours;
            const isOptimal = peakHours.includes(currentHour);
            const status = isOptimal ? '高效时段' : '普通时段';
            optimalTimeEl.textContent = `${status} (${currentHour}点)`;
        } else {
            optimalTimeEl.textContent = '数据不足';
        }
    }
}

// 加载提醒历史
function loadReminderHistory() {
    const historyEl = document.getElementById('reminder-history-list');
    if (!historyEl) return;

    try {
        const history = aiSmartReminder.getReminderHistory();
        historyEl.replaceChildren();

        if (history.length === 0) {
            historyEl.appendChild(createReminderHistoryStatus('📊', '暂无提醒记录'));
            return;
        }

        const fragment = document.createDocumentFragment();
        history.forEach(reminder => {
            fragment.appendChild(createReminderHistoryItem(reminder));
        });
        historyEl.appendChild(fragment);
    } catch (error) {
        console.error('❌ 加载提醒历史失败:', error);
        historyEl.replaceChildren(createReminderHistoryStatus('❌', '加载失败'));
    }
}

function createReminderHistoryStatus(iconText, messageText) {
    const item = document.createElement('div');
    item.className = 'history-item';

    const icon = document.createElement('span');
    icon.className = 'history-icon';
    icon.textContent = iconText;

    const text = document.createElement('span');
    text.className = 'history-text';
    text.textContent = messageText;

    item.append(icon, text);
    return item;
}

function createReminderHistoryItem(reminder) {
    const item = document.createElement('div');
    item.className = 'history-item';

    const icon = document.createElement('span');
    icon.className = 'history-icon';
    icon.textContent = getReminderIcon(reminder.type);

    const content = document.createElement('div');
    content.className = 'history-content';

    const title = document.createElement('div');
    title.className = 'history-title';
    title.textContent = reminder.title || '';

    const message = document.createElement('div');
    message.className = 'history-message';
    message.textContent = reminder.message || '';

    const time = document.createElement('div');
    time.className = 'history-time';
    time.textContent = reminder.timestamp
        ? new Date(reminder.timestamp).toLocaleString()
        : '';

    content.append(title, message, time);
    item.append(icon, content);
    return item;
}

// 切换提醒设置
function toggleReminderSettings() {
    console.log('⚙️ 切换提醒设置');
    showReminderSettingsModal();
}

// 显示提醒设置模态框
function showReminderSettingsModal() {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'reminder-settings-modal active';
    renderSafeModuleMarkup(modal, `
        <div class="modal-overlay" data-reminder-action="close-settings"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>⚙️ 智能提醒设置</h3>
                <button class="modal-close" data-reminder-action="close-settings">×</button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h4>🔔 通知设置</h4>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" id="enable-notifications" checked>
                            <span class="checkmark"></span>
                            启用浏览器通知
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" id="enable-page-notifications" checked>
                            <span class="checkmark"></span>
                            启用页面通知
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>⚖️ 工作负荷提醒</h4>
                    <div class="setting-item">
                        <label class="setting-label">负荷阈值：</label>
                        <input type="range" id="workload-threshold" min="0.5" max="2.0" step="0.1" value="0.8">
                        <span id="workload-threshold-value">0.8</span>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" id="enable-workload-reminders" checked>
                            <span class="checkmark"></span>
                            启用工作负荷提醒
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>😴 疲劳检测</h4>
                    <div class="setting-item">
                        <label class="setting-label">疲劳阈值：</label>
                        <input type="range" id="fatigue-threshold" min="30" max="80" step="5" value="50">
                        <span id="fatigue-threshold-value">50%</span>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" id="enable-fatigue-reminders" checked>
                            <span class="checkmark"></span>
                            启用疲劳检测提醒
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>⏰ 最佳执行时间</h4>
                    <div class="setting-item">
                        <label class="setting-label">
                            <input type="checkbox" id="enable-optimal-time-reminders" checked>
                            <span class="checkmark"></span>
                            启用最佳执行时间提醒
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>🕐 提醒频率</h4>
                    <div class="setting-item">
                        <label class="setting-label">工作强度检查：</label>
                        <select id="work-intensity-interval">
                            <option value="300000">5分钟</option>
                            <option value="600000">10分钟</option>
                            <option value="900000">15分钟</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">疲劳检测：</label>
                        <select id="fatigue-check-interval">
                            <option value="1800000">30分钟</option>
                            <option value="3600000">1小时</option>
                            <option value="7200000">2小时</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" data-reminder-action="close-settings">取消</button>
                <button class="btn-primary" data-reminder-action="save-settings">保存设置</button>
            </div>
        </div>
    `);

    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-reminder-action]');
        if (!actionEl || !modal.contains(actionEl)) return;

        const action = actionEl.dataset.reminderAction;
        if (action === 'close-settings') {
            closeReminderSettings();
        } else if (action === 'save-settings') {
            saveReminderSettings();
        }
    });

    // 加载当前设置
    loadReminderSettings();

    // 绑定滑块事件
    document.getElementById('workload-threshold').addEventListener('input', function () {
        document.getElementById('workload-threshold-value').textContent = this.value;
    });

    document.getElementById('fatigue-threshold').addEventListener('input', function () {
        document.getElementById('fatigue-threshold-value').textContent = this.value + '%';
    });
}

// 关闭提醒设置模态框
function closeReminderSettings() {
    const modal = document.querySelector('.reminder-settings-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// 加载提醒设置
function loadReminderSettings() {
    try {
        const settings = window.SettingsStorage
            ? window.SettingsStorage.getReminderSettings()
            : {};

        // 加载通知设置
        document.getElementById('enable-notifications').checked = settings.enableNotifications !== false;
        document.getElementById('enable-page-notifications').checked = settings.enablePageNotifications !== false;

        // 加载工作负荷设置
        document.getElementById('workload-threshold').value = settings.workloadThreshold || 0.8;
        document.getElementById('workload-threshold-value').textContent = settings.workloadThreshold || 0.8;
        document.getElementById('enable-workload-reminders').checked = settings.enableWorkloadReminders !== false;

        // 加载疲劳检测设置
        document.getElementById('fatigue-threshold').value = settings.fatigueThreshold || 50;
        document.getElementById('fatigue-threshold-value').textContent = (settings.fatigueThreshold || 50) + '%';
        document.getElementById('enable-fatigue-reminders').checked = settings.enableFatigueReminders !== false;

        // 加载最佳执行时间设置
        document.getElementById('enable-optimal-time-reminders').checked = settings.enableOptimalTimeReminders !== false;

        // 加载提醒频率设置
        document.getElementById('work-intensity-interval').value = settings.workIntensityInterval || 300000;
        document.getElementById('fatigue-check-interval').value = settings.fatigueCheckInterval || 1800000;

    } catch (error) {
        console.error('❌ 加载提醒设置失败:', error);
    }
}

// 保存提醒设置
function saveReminderSettings() {
    try {
        const settings = {
            enableNotifications: document.getElementById('enable-notifications').checked,
            enablePageNotifications: document.getElementById('enable-page-notifications').checked,
            workloadThreshold: parseFloat(document.getElementById('workload-threshold').value),
            enableWorkloadReminders: document.getElementById('enable-workload-reminders').checked,
            fatigueThreshold: parseInt(document.getElementById('fatigue-threshold').value),
            enableFatigueReminders: document.getElementById('enable-fatigue-reminders').checked,
            enableOptimalTimeReminders: document.getElementById('enable-optimal-time-reminders').checked,
            workIntensityInterval: parseInt(document.getElementById('work-intensity-interval').value),
            fatigueCheckInterval: parseInt(document.getElementById('fatigue-check-interval').value)
        };

        if (window.SettingsStorage) {
            window.SettingsStorage.setReminderSettings(settings);
        } else {
            console.warn('SettingsStorage is unavailable; reminder settings were not persisted.');
        }

        // 更新智能提醒系统设置
        if (typeof aiSmartReminder !== 'undefined') {
            aiSmartReminder.workIntensityThreshold = settings.workloadThreshold;
            aiSmartReminder.fatigueThreshold = settings.fatigueThreshold / 100;
        }

        showNotification('提醒设置已保存', 'success');
        closeReminderSettings();

    } catch (error) {
        console.error('❌ 保存提醒设置失败:', error);
        showNotification('保存设置失败', 'error');
    }
}

// 查看提醒历史
function viewReminderHistory() {
    console.log('📋 查看提醒历史');
    const historyEl = document.getElementById('reminder-history');
    if (historyEl) {
        const isVisible = historyEl.style.display !== 'none';
        historyEl.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            loadReminderHistory();
        }
    }
}

// 获取提醒图标
function getReminderIcon(type) {
    const icons = {
        'workload': '⚖️',
        'fatigue': '😴',
        'optimal_time': '⏰',
        'deadline': '⏰'
    };
    return icons[type] || '🔔';
}

// 关闭权限请求模态框
function closePermissionRequest() {
    const modal = document.querySelector('.notification-permission-modal');
    if (modal) {
        modal.remove();
    }
}

// 请求通知权限（全局函数）
async function requestNotificationPermissionNow() {
    if (typeof aiSmartReminder !== 'undefined') {
        await aiSmartReminder.requestNotificationPermissionNow();
    }
}

window.loadSmartReminderSystem = loadSmartReminderSystem;
window.toggleReminderSettings = toggleReminderSettings;
window.viewReminderHistory = viewReminderHistory;
window.closeReminderSettings = closeReminderSettings;
window.saveReminderSettings = saveReminderSettings;
window.closePermissionRequest = closePermissionRequest;
window.requestNotificationPermissionNow = requestNotificationPermissionNow;
