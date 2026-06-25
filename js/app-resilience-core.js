// Offline support, accessibility, and global error handling.
// Extracted from script.js; runtime state is read through window.XXSGAppRuntime.

function isAppLoggedIn() {
    return Boolean(window.XXSGAppRuntime?.isLoggedIn);
}

// 离线支持初始化
function initOfflineSupport() {
    // 检测网络状态
    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        let statusIndicator = document.getElementById('network-status');

        if (!statusIndicator) {
            statusIndicator = createNetworkStatusIndicator();
        }

        if (isOnline) {
            statusIndicator.className = 'network-status online';
            statusIndicator.textContent = `🟢 ${t('online')}`;
            hideOfflineBanner();
        } else {
            statusIndicator.className = 'network-status offline';
            statusIndicator.textContent = `🔴 ${t('offline')}`;
            showOfflineBanner();
        }
    }

    // 创建网络状态指示器
    function createNetworkStatusIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'network-status';
        indicator.className = 'network-status';
        indicator.style.cssText = `
            font-size: 0.75rem;
            font-weight: 500;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 4px;
        `;

        // 尝试添加到 header-controls 容器中
        const headerControls = document.querySelector('.header-controls');
        if (headerControls) {
            headerControls.appendChild(indicator);
        } else {
            // 如果找不到 header-controls，则添加到 body
            indicator.style.cssText += `
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 1000;
            `;
            document.body.appendChild(indicator);
        }
        return indicator;
    }

    // 显示离线横幅
    function showOfflineBanner() {
        if (document.getElementById('offline-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.appendChild(createOfflineBannerContent());

        const style = document.createElement('style');
        style.textContent = `
            #offline-banner {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #ff6b35, #f7931e);
                color: white;
                z-index: 10000;
                animation: slideDown 0.3s ease-out;
                box-shadow: var(--shadow-lg);
            }

            .offline-banner-content {
                display: flex;
                align-items: center;
                padding: 12px 20px;
                gap: 12px;
                max-width: 1200px;
                margin: 0 auto;
            }

            .offline-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }

            .offline-text {
                flex: 1;
            }

            .offline-title {
                font-weight: 600;
                font-size: 1rem;
                margin-bottom: 2px;
            }

            .offline-desc {
                font-size: 0.875rem;
                opacity: 0.9;
            }

            .offline-retry {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                padding: 6px 12px;
                border-radius: var(--radius-sm);
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .offline-retry:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
            }

            @keyframes slideDown {
                from { transform: translateY(-100%); }
                to { transform: translateY(0); }
            }

            .network-status.online {
                background: var(--accent-green);
                color: white;
            }

            .network-status.offline {
                background: #ff6b35;
                color: white;
            }

            @media (max-width: 480px) {
                .offline-banner-content {
                    padding: 10px 15px;
                    flex-direction: column;
                    text-align: center;
                    gap: 8px;
                }

                .offline-text {
                    order: 2;
                }

                .offline-retry {
                    order: 3;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(banner);

        // 调整页面内容位置
        document.body.style.paddingTop = '60px';
    }

    function createOfflineBannerContent() {
        const content = document.createElement('div');
        content.className = 'offline-banner-content';
        const icon = document.createElement('div');
        icon.className = 'offline-icon';
        icon.textContent = '📡';
        const text = document.createElement('div');
        text.className = 'offline-text';
        const title = document.createElement('div');
        title.className = 'offline-title';
        title.textContent = '网络连接已断开';
        const desc = document.createElement('div');
        desc.className = 'offline-desc';
        desc.textContent = '您正在离线模式下工作，数据将在网络恢复后同步';
        text.append(title, desc);
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.className = 'offline-retry';
        retry.textContent = '重试';
        retry.addEventListener('click', () => window.location.reload());
        content.append(icon, text, retry);
        return content;
    }

    // 隐藏离线横幅
    function hideOfflineBanner() {
        const banner = document.getElementById('offline-banner');
        if (banner) {
            banner.style.animation = 'slideUp 0.3s ease-in';
            setTimeout(() => {
                banner.remove();
                document.body.style.paddingTop = '';
            }, 300);
        }
    }

    // 添加滑出动画
    if (!document.getElementById('offline-animations')) {
        const style = document.createElement('style');
        style.id = 'offline-animations';
        style.textContent = `
            @keyframes slideUp {
                from { transform: translateY(0); }
                to { transform: translateY(-100%); }
            }
        `;
        document.head.appendChild(style);
    }

    // 监听网络状态变化
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // 监听页面滚动，确保网络状态指示器始终可见
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const statusIndicator = document.getElementById('network-status');
            if (statusIndicator && statusIndicator.parentElement === document.body) {
                // 如果指示器在body中，更新其位置
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                statusIndicator.style.top = `${10 + scrollTop}px`;
            }
        }, 10);
    });

    // 初始化状态
    updateOnlineStatus();

    // 离线数据同步
    let pendingActions = JSON.parse(window.DataSyncStorage.getRaw('pendingActions') || '[]');

    // 保存待同步的操作
    function savePendingAction(action) {
        pendingActions.push({
            ...action,
            timestamp: Date.now()
        });
        window.DataSyncStorage.setRaw('pendingActions', JSON.stringify(pendingActions));
    }

    // 同步待处理的操作
    function syncPendingActions() {
        if (!navigator.onLine || pendingActions.length === 0) return;

        pendingActions.forEach(action => {
            try {
                // 这里可以添加实际的同步逻辑
                console.log('同步操作:', action);
            } catch (error) {
                console.error('同步失败:', error);
            }
        });

        // 清空已同步的操作
        pendingActions = [];
        window.DataSyncStorage.removeRaw('pendingActions');
        showPageNotification('离线数据已同步');
    }

    // 定期尝试同步
    setInterval(syncPendingActions, 30000); // 每30秒尝试一次

    // 网络恢复时立即同步
    window.addEventListener('online', () => {
        setTimeout(syncPendingActions, 1000);
    });

    // 将函数暴露到全局作用域
    window.savePendingAction = savePendingAction;
}

// 可访问性初始化
function initAccessibility() {
    // 1. 键盘导航支持
    initKeyboardNavigation();

    // 2. 屏幕阅读器支持
    initScreenReaderSupport();

    // 3. 焦点管理
    initFocusManagement();

    // 4. 高对比度模式
    initHighContrastMode();
}

// 键盘导航支持
function initKeyboardNavigation() {
    // Tab键导航增强
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            // 为焦点元素添加视觉指示
            document.body.classList.add('keyboard-navigation');
        }
    });

    // 鼠标点击时移除键盘导航样式
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });

    // 箭头键导航
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            // 如果正在输入文本，不触发导航
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
                return;
            }

            const tabs = document.querySelectorAll('.tab-button');
            const activeTab = document.querySelector('.tab-button.active');
            const currentIndex = Array.from(tabs).indexOf(activeTab);

            if (e.key === 'ArrowRight') {
                const nextIndex = (currentIndex + 1) % tabs.length;
                const nextTab = tabs[nextIndex];

                // 检查权限：只有已登录用户才能切换到四象限视图
                if (nextTab.id === 'quadrant-tab-btn' && !isAppLoggedIn()) {
                    showNotification('请先登录以使用四象限视图', 'warning');
                    return;
                }

                nextTab.focus();
                nextTab.click();
            } else if (e.key === 'ArrowLeft') {
                const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
                const prevTab = tabs[prevIndex];

                // 检查权限：只有已登录用户才能切换到四象限视图
                if (prevTab.id === 'quadrant-tab-btn' && !isAppLoggedIn()) {
                    showNotification('请先登录以使用四象限视图', 'warning');
                    return;
                }

                prevTab.focus();
                prevTab.click();
            }

            e.preventDefault();
        }
    });
}

// 屏幕阅读器支持
function initScreenReaderSupport() {
    // 创建屏幕阅读器专用区域
    const srOnly = document.createElement('div');
    srOnly.id = 'screen-reader-only';
    srOnly.setAttribute('aria-live', 'polite');
    srOnly.setAttribute('aria-atomic', 'true');
    srOnly.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    `;
    document.body.appendChild(srOnly);

    // 为动态内容添加屏幕阅读器通知
    window.announceToScreenReader = (message) => {
        const srOnly = document.getElementById('screen-reader-only');
        if (srOnly) {
            srOnly.textContent = message;
        }
    };

    // 为任务操作添加屏幕阅读器通知
    const originalSaveTasks = window.XXSGAppRuntime?.saveTasks;
    if (typeof originalSaveTasks === 'function' && window.XXSGAppRuntime?.setSaveTasks) {
        window.XXSGAppRuntime.setSaveTasks(function (realSaveCall) {
            // realSaveCall 是 script.js 传递的真实保存函数（thunk）
            // 直接调用它，不会再通过 runtime 方法转发，避免无限递归
            const result = realSaveCall();
            window.announceToScreenReader('任务已保存');
            return result;
        });
    }
}

// 焦点管理
function initFocusManagement() {
    // 模态框打开时管理焦点
    const originalShowModal = showTaskModal;
    if (typeof showTaskModal === 'function') {
        window.showTaskModal = function (taskId) {
            originalShowModal.call(this, taskId);
            // 将焦点移到模态框
            const modal = document.getElementById('task-modal');
            if (modal) {
                const firstFocusable = modal.querySelector('input, button, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }
        };
    }

    // 模态框关闭时恢复焦点
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal')) {
            // 将焦点恢复到触发模态框的元素
            const lastFocused = document.activeElement;
            if (lastFocused && lastFocused !== document.body) {
                lastFocused.focus();
            }
        }
    });
}

// 高对比度模式
function initHighContrastMode() {
    // 检测系统高对比度设置
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
        document.body.classList.add('high-contrast');
    }

    // 监听高对比度设置变化
    if (window.matchMedia) {
        const contrastQuery = window.matchMedia('(prefers-contrast: high)');
        contrastQuery.addListener((e) => {
            if (e.matches) {
                document.body.classList.add('high-contrast');
            } else {
                document.body.classList.remove('high-contrast');
            }
        });
    }

    // 添加高对比度样式
    const highContrastStyle = document.createElement('style');
    highContrastStyle.textContent = `
        .high-contrast {
            --text-primary: #000000;
            --text-secondary: #333333;
            --bg-primary: #ffffff;
            --bg-secondary: #f0f0f0;
            --border-color: #000000;
            --primary-color: #0000ff;
        }

        .high-contrast .tab-button {
            border: 2px solid var(--border-color);
        }

        .high-contrast .tab-button.active {
            background: var(--primary-color);
            color: white;
        }

        .high-contrast .task-item {
            border: 1px solid var(--border-color);
        }

        .high-contrast .quadrant {
            border: 2px solid var(--border-color);
        }

        .keyboard-navigation *:focus {
            outline: 3px solid var(--primary-color) !important;
            outline-offset: 2px !important;
        }
    `;
    document.head.appendChild(highContrastStyle);
}

// 错误处理初始化
function initErrorHandling() {
    // 1. 全局错误捕获
    initGlobalErrorHandling();

    // 2. Promise错误处理
    initPromiseErrorHandling();

    // 3. 用户友好的错误提示
    initUserFriendlyErrors();

    // 4. 错误恢复机制
    initErrorRecovery();
}

// 全局错误处理
function initGlobalErrorHandling() {
    // 检查是否禁用错误通知
    const disableErrorNotifications = window.DataSyncStorage.getRaw('disableErrorNotifications') === 'true';

    // 完全抑制浏览器扩展相关错误
    const originalConsoleError = console.error;
    console.error = function (...args) {
        const errorMessage = args.join(' ');

        // 过滤浏览器扩展相关错误
        if (
            errorMessage.includes('BrowserPolyfillWrapper') ||
            errorMessage.includes('browser-polyfill') ||
            errorMessage.includes('chrome-extension') ||
            errorMessage.includes('ext-cs') ||
            errorMessage.includes('fetch session') ||
            errorMessage.includes('Failed to fetch latest config') ||
            errorMessage.includes('message channel closed') ||
            errorMessage.includes('listener indicated an asynchronous response')
        ) {
            // 静默忽略，不输出到控制台
            return;
        }

        // 其他错误正常输出
        originalConsoleError.apply(console, args);
    };

    // 捕获未处理的JavaScript错误
    window.addEventListener('error', (event) => {
        // 检查是否为扩展相关错误
        const errorMessage = event.message || event.error?.message || '';
        if (
            errorMessage.includes('BrowserPolyfillWrapper') ||
            errorMessage.includes('extension') ||
            errorMessage.includes('chrome-extension')
        ) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }

        if (!disableErrorNotifications) {
            showErrorNotification('发生了一个错误，请刷新页面重试', 'error');
        }

        logError('JavaScript Error', event.error, event.filename, event.lineno);
    });

    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
        // 过滤掉Service Worker相关的错误，避免显示不必要的警告
        const errorMessage = event.reason?.message || event.reason?.toString() || '';
        const isServiceWorkerError = errorMessage.includes('ServiceWorker') ||
            errorMessage.includes('Failed to update a ServiceWorker') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('sw.js') ||
            errorMessage.includes('An unknown error occurred when fetching the script') ||
            errorMessage.includes('Failed to convert value to \'Response\'') ||
            errorMessage.includes('listener indicated an asynchronous response') ||
            errorMessage.includes('message channel closed') ||
            errorMessage.includes('Request timeout') ||
            errorMessage.includes('fetchError') ||
            errorMessage.includes('browser-polyfill') ||
            errorMessage.includes('BrowserPolyfillWrapper') ||
            errorMessage.includes('extension') ||
            errorMessage.includes('chrome-extension') ||
            errorMessage.includes('ext-cs') ||
            errorMessage.includes('fetch session') ||
            errorMessage.includes('config') ||
            errorMessage.includes('latest config') ||
            errorMessage.includes('ERR_CONNECTION_TIMED_OUT') ||
            errorMessage.includes('cdn.jsdelivr.net') ||
            errorMessage.includes('quill/config.json');

        if (isServiceWorkerError) {
            // 完全阻止错误传播
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            return false;
        }

        // 只对严重的错误显示警告
        if (!disableErrorNotifications &&
            event.reason && typeof event.reason === 'object' && event.reason.name !== 'TypeError') {
            showErrorNotification('操作失败，请重试', 'warning');
        }

        logError('Unhandled Promise Rejection', event.reason);
    });

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
        if (event.target !== window) {
            const resourceUrl = event.target.src || event.target.href || '';

            // 过滤掉不重要的资源加载错误
            if (resourceUrl && (
                resourceUrl.includes('restore-preview.css') ||
                resourceUrl.includes('favicon.ico') ||
                resourceUrl.includes('apple-touch-icon') ||
                resourceUrl.includes('manifest.json') ||
                resourceUrl.includes('sw.js') ||
                resourceUrl.includes('service-worker') ||
                resourceUrl.includes('chrome-extension://') ||
                resourceUrl.includes('moz-extension://') ||
                resourceUrl.includes('safari-extension://') ||
                resourceUrl.includes('cdn.jsdelivr.net') ||
                resourceUrl.includes('sortablejs') ||
                resourceUrl.includes('Sortable.min.js') ||
                resourceUrl.includes('quill') ||
                resourceUrl.includes('config.json')
            )) {
                // 完全阻止错误传播
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();
                return false;
            }

            // 只对重要的资源加载失败显示警告
            if (!disableErrorNotifications) {
                showErrorNotification('某些资源加载失败，可能影响功能使用', 'warning');
            }
            logError('Resource Load Error', resourceUrl);
        }
    }, true);
}

// Promise错误处理
function initPromiseErrorHandling() {
    // 包装异步函数以捕获错误
    window.safeAsync = (asyncFn) => {
        return async (...args) => {
            try {
                return await asyncFn(...args);
            } catch (error) {
                console.error('异步操作错误:', error);
                showErrorNotification('操作失败，请重试', 'error');
                logError('Async Operation Error', error);
                throw error;
            }
        };
    };

    // 包装Promise以捕获错误
    window.safePromise = (promise) => {
        return promise.catch(error => {
            console.error('Promise错误:', error);
            showErrorNotification('操作失败，请重试', 'error');
            logError('Promise Error', error);
            throw error;
        });
    };
}

// 用户友好的错误提示
function initUserFriendlyErrors() {
    // 创建错误通知容器
    const errorContainer = document.createElement('div');
    errorContainer.id = 'error-notifications';
    errorContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        max-width: 400px;
    `;
    document.body.appendChild(errorContainer);

    // 错误通知样式
    const errorStyle = document.createElement('style');
    errorStyle.textContent = `
        .error-notification {
            background: white;
            border-left: 4px solid #ff6b35;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            padding: 16px;
            margin-bottom: 12px;
            animation: slideInRight 0.3s ease-out;
            position: relative;
            max-width: 100%;
        }

        .error-notification.error {
            border-left-color: #e53e3e;
        }

        .error-notification.warning {
            border-left-color: #d69e2e;
        }

        .error-notification.success {
            border-left-color: #38a169;
        }

        .error-notification.info {
            border-left-color: #3182ce;
        }

        .error-notification-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .error-notification-title {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.9rem;
        }

        .error-notification-close {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            color: var(--text-muted);
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-sm);
            transition: all 0.2s ease;
        }

        .error-notification-close:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }

        .error-notification-message {
            color: var(--text-secondary);
            font-size: 0.875rem;
            line-height: 1.4;
        }

        .error-notification-actions {
            margin-top: 12px;
            display: flex;
            gap: 8px;
        }

        .error-notification-btn {
            padding: 6px 12px;
            border: 1px solid var(--border-color);
            background: var(--bg-primary);
            color: var(--text-primary);
            border-radius: var(--radius-sm);
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .error-notification-btn:hover {
            background: var(--bg-secondary);
            border-color: var(--primary-color);
        }

        .error-notification-btn.primary {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .error-notification-btn.primary:hover {
            background: var(--primary-hover);
        }

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
    document.head.appendChild(errorStyle);
}

// 显示错误通知
function showErrorNotification(message, type = 'error', options = {}) {
    const container = document.getElementById('error-notifications');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `error-notification ${type}`;

    const title = options.title || getErrorTitle(type);
    const actions = options.actions || [];

    const header = document.createElement('div');
    header.className = 'error-notification-header';

    const titleEl = document.createElement('div');
    titleEl.className = 'error-notification-title';
    titleEl.textContent = title;

    const closeButton = document.createElement('button');
    closeButton.className = 'error-notification-close';
    closeButton.type = 'button';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => notification.remove());
    header.append(titleEl, closeButton);

    const messageEl = document.createElement('div');
    messageEl.className = 'error-notification-message';
    messageEl.textContent = message;

    notification.append(header, messageEl);

    if (actions.length > 0) {
        const actionsEl = document.createElement('div');
        actionsEl.className = 'error-notification-actions';
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = `error-notification-btn ${action.type || ''}`.trim();
            button.type = 'button';
            button.textContent = action.text || '';
            if (typeof action.onClick === 'function') {
                button.addEventListener('click', action.onClick);
            } else if (typeof action['on' + 'click'] === 'function') {
                button.addEventListener('click', action['on' + 'click']);
            }
            actionsEl.appendChild(button);
        });
        notification.appendChild(actionsEl);
    }

    container.appendChild(notification);

    // 自动移除
    const autoRemove = options.autoRemove !== false;
    if (autoRemove) {
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, options.duration || 5000);
    }

    return notification;
}

// 获取错误标题
function getErrorTitle(type) {
    const titles = {
        error: '错误',
        warning: '警告',
        success: '成功',
        info: '信息'
    };
    return titles[type] || '通知';
}

// 错误恢复机制
