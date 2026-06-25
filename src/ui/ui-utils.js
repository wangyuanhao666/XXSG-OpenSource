// UI工具函数模块
// 从 script.js 中提取的UI相关函数

/**
 * 获取优先级类名
 * @param {number} priority - 优先级（1-4）
 * @returns {string} CSS类名
 */
export function getPriorityClass(priority) {
    const classes = {
        1: 'priority-high',
        2: 'priority-medium',
        3: 'priority-low',
        4: 'priority-lowest'
    };
    return classes[priority] || 'priority-medium';
}

/**
 * 获取优先级文本
 * @param {number} priority - 优先级（1-4）
 * @returns {string} 优先级文本
 */
export function getPriorityText(priority) {
    const texts = {
        1: '重要且紧急',
        2: '重要不紧急',
        3: '不重要但紧急',
        4: '不重要不紧急'
    };
    return texts[priority] || '未知';
}

/**
 * 获取象限标签
 * @param {number} quadrant - 象限（1-4）
 * @returns {string} 象限标签
 */
export function getQuadrantLabel(quadrant) {
    const labels = {
        1: '象限1',
        2: '象限2',
        3: '象限3',
        4: '象限4'
    };
    return labels[quadrant] || '未知象限';
}

/**
 * 获取象限文本
 * @param {number} priority - 优先级（1-4）
 * @returns {string} 象限文本
 */
export function getQuadrantText(priority) {
    return getPriorityText(priority);
}

/**
 * 从优先级获取象限
 * @param {number} priority - 优先级（1-4）
 * @returns {number} 象限（1-4）
 */
export function getQuadrantFromPriority(priority) {
    return priority;
}

/**
 * 获取子任务图标
 * @param {number} priority - 优先级
 * @returns {string} 图标HTML
 */
export function getSubTaskIcon(priority) {
    const icons = {
        1: '🔴',
        2: '🟡',
        3: '🔵',
        4: '🟢'
    };
    return icons[priority] || '⚪';
}

/**
 * 获取提醒图标
 * @param {string} type - 提醒类型
 * @returns {string} 图标
 */
export function getReminderIcon(type) {
    const icons = {
        'deadline': '⏰',
        'daily': '📅',
        'weekly': '📆',
        'custom': '🔔'
    };
    return icons[type] || '🔔';
}

/**
 * 获取日程图标
 * @param {string} type - 日程类型
 * @returns {string} 图标
 */
export function getScheduleIcon(type) {
    const icons = {
        'meeting': '👥',
        'work': '💼',
        'personal': '🏠',
        'other': '📌'
    };
    return icons[type] || '📌';
}

/**
 * 获取休息文本
 * @param {string} type - 休息类型
 * @returns {string} 休息文本
 */
export function getBreakText(type) {
    const texts = {
        'short': '短休息',
        'long': '长休息',
        'custom': '自定义休息'
    };
    return texts[type] || '休息';
}

/**
 * 获取趋势文本
 * @param {string} trend - 趋势
 * @returns {string} 趋势文本和图标
 */
export function getTrendText(trend) {
    const trends = {
        'up': '📈 上升',
        'down': '📉 下降',
        'stable': '➡️ 稳定'
    };
    return trends[trend] || '➡️ 稳定';
}

/**
 * 获取排序标签
 * @param {string} mode - 排序模式
 * @returns {string} 排序标签
 */
export function getSortLabel(mode) {
    const labels = {
        'priority': '按优先级',
        'time': '按时间',
        'deadline': '按截止日期',
        'custom': '自定义'
    };
    return labels[mode] || '默认排序';
}

/**
 * 获取格式名称
 * @param {string} format - 格式类型
 * @returns {string} 格式名称
 */
export function getFormatName(format) {
    const formats = {
        'json': 'JSON格式',
        'csv': 'CSV格式',
        'excel': 'Excel格式',
        'pdf': 'PDF格式',
        'markdown': 'Markdown格式'
    };
    return formats[format] || '未知格式';
}

/**
 * 获取错误标题
 * @param {string} type - 错误类型
 * @returns {string} 错误标题
 */
export function getErrorTitle(type) {
    const titles = {
        'network': '网络错误',
        'storage': '存储错误',
        'permission': '权限错误',
        'validation': '验证错误',
        'unknown': '未知错误'
    };
    return titles[type] || '错误';
}

/**
 * 获取事件颜色
 * @param {Object} event - 事件对象
 * @returns {string} 颜色值
 */
export function getEventColor(event) {
    const colors = {
        'task': '#667eea',
        'habit': '#4CAF50',
        'meeting': '#ff6b35',
        'personal': '#ffd93d',
        'other': '#95a5a6'
    };
    return colors[event.type] || colors.other;
}

/**
 * 获取事件类型名称
 * @param {string} calendarId - 日历ID
 * @returns {string} 类型名称
 */
export function getEventTypeName(calendarId) {
    const names = {
        'tasks': '任务',
        'habits': '习惯',
        'meetings': '会议',
        'personal': '个人',
        'other': '其他'
    };
    return names[calendarId] || '未知';
}

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型（success/error/warning/info）
 */
export function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/**
 * 显示加载动画
 * @param {string} message - 加载消息
 * @returns {HTMLElement} 加载元素
 */
export function showLoading(message = '加载中...') {
    const loading = document.createElement('div');
    loading.className = 'loading-overlay';
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    const label = document.createElement('div');
    label.className = 'loading-message';
    label.textContent = message;
    loading.append(spinner, label);
    loading.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;

    document.body.appendChild(loading);
    return loading;
}

/**
 * 隐藏加载动画
 * @param {HTMLElement} loading - 加载元素
 */
export function hideLoading(loading) {
    if (loading && loading.parentNode) {
        loading.parentNode.removeChild(loading);
    }
}

/**
 * 确认对话框
 * @param {string} message - 确认消息
 * @returns {Promise<boolean>} 用户是否确认
 */
export async function confirmDialog(message) {
    return new Promise((resolve) => {
        const result = confirm(message);
        resolve(result);
    });
}
