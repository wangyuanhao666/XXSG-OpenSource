// 通知组件模块
// 从 script.js 中提取的通知相关功能

/**
 * 通知管理类
 */
export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    /**
     * 初始化通知容器
     */
    init() {
        // 创建通知容器
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
    }

    /**
     * 显示通知
     * @param {string} message - 通知消息
     * @param {string} type - 通知类型 (success/error/warning/info)
     * @param {number} duration - 显示时长（毫秒），0表示不自动关闭
     * @returns {string} 通知ID
     */
    show(message, type = 'info', duration = 3000) {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // 创建通知元素
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            padding: 1rem 1.5rem;
            background: ${this.getBackgroundColor(type)};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            cursor: pointer;
            transition: transform 0.2s, opacity 0.2s;
        `;

        // 添加图标
        const icon = document.createElement('span');
        icon.className = 'notification-icon';
        icon.textContent = this.getIcon(type);
        icon.style.fontSize = '1.2rem';

        // 添加消息
        const messageEl = document.createElement('span');
        messageEl.className = 'notification-message';
        messageEl.textContent = message;
        messageEl.style.flex = '1';

        // 添加关闭按钮
        const closeBtn = document.createElement('span');
        closeBtn.className = 'notification-close';
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            font-size: 1.5rem;
            line-height: 1;
            cursor: pointer;
            opacity: 0.7;
        `;
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide(id);
        });

        notification.appendChild(icon);
        notification.appendChild(messageEl);
        notification.appendChild(closeBtn);

        // 添加到容器
        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification, type, message });

        // 点击通知关闭
        notification.addEventListener('click', () => {
            this.hide(id);
        });

        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this.hide(id);
            }, duration);
        }

        console.log(`📢 通知已显示 [${type}]:`, message);

        return id;
    }

    /**
     * 隐藏通知
     * @param {string} id - 通知ID
     */
    hide(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        const element = notification.element;
        element.style.animation = 'slideOut 0.3s ease';

        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications = this.notifications.filter(n => n.id !== id);
        }, 300);
    }

    /**
     * 隐藏所有通知
     */
    hideAll() {
        this.notifications.forEach(notification => {
            this.hide(notification.id);
        });
    }

    /**
     * 显示成功通知
     * @param {string} message - 消息
     * @param {number} duration - 显示时长
     * @returns {string} 通知ID
     */
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    /**
     * 显示错误通知
     * @param {string} message - 消息
     * @param {number} duration - 显示时长
     * @returns {string} 通知ID
     */
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    /**
     * 显示警告通知
     * @param {string} message - 消息
     * @param {number} duration - 显示时长
     * @returns {string} 通知ID
     */
    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    /**
     * 显示信息通知
     * @param {string} message - 消息
     * @param {number} duration - 显示时长
     * @returns {string} 通知ID
     */
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    /**
     * 获取背景颜色
     * @param {string} type - 通知类型
     * @returns {string} 颜色值
     */
    getBackgroundColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    }

    /**
     * 获取图标
     * @param {string} type - 通知类型
     * @returns {string} 图标
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
}

// 导出单例实例
export const notificationManager = new NotificationManager();

// 导出便捷函数
export const showNotification = (message, type, duration) => notificationManager.show(message, type, duration);
export const showSuccess = (message, duration) => notificationManager.success(message, duration);
export const showError = (message, duration) => notificationManager.error(message, duration);
export const showWarning = (message, duration) => notificationManager.warning(message, duration);
export const showInfo = (message, duration) => notificationManager.info(message, duration);
export const hideNotification = (id) => notificationManager.hide(id);
export const hideAllNotifications = () => notificationManager.hideAll();

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .notification:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
    
    .notification-close:hover {
        opacity: 1 !important;
    }
`;
document.head.appendChild(style);
