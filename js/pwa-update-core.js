// PWA, install prompts, update banner, and Service Worker error handling.
// Extracted from script.js to keep the main application shell smaller.

// PWA 初始化
function initPWA() {
    console.log('PWA初始化开始');

    try {

        // 注册 Service Worker（只在HTTPS或localhost环境下）- 临时禁用
        if (false && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
            console.log('开始注册Service Worker');
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker 注册成功:', registration);

                    // 检查更新
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.error('Service Worker 注册失败:', error);
                    // 不显示用户警告，因为这是技术性错误
                    console.log('Service Worker注册失败，但不影响应用正常使用');
                });
        } else {
            console.log('Service Worker 功能不可用（需要HTTPS或localhost环境）');
        }

        // 显示安装提示
        let deferredPrompt;

        // 检查是否应该显示安装提示
        function shouldShowInstallPrompt() {
            // 检查是否已经安装
            if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('应用已安装，不显示安装提示');
                return false;
            }

            // 检查是否已经有安装提示显示
            if (document.getElementById('install-banner')) {
                console.log('安装提示已显示，跳过重复显示');
                return false;
            }

            // 检查是否被本次会话中手动关闭（检查时间戳，超过1小时则重新显示）
            const dismissedTime = window.DataSyncStorage.getSessionRaw('installDismissedThisSession');
            if (dismissedTime) {
                const now = Date.now();
                const dismissed = parseInt(dismissedTime);
                const oneHour = 60 * 60 * 1000; // 1小时

                if (now - dismissed < oneHour) {
                    console.log('本次会话中已关闭安装提示，不显示');
                    return false;
                } else {
                    // 超过1小时，清除标记
                    window.DataSyncStorage.removeSessionRaw('installDismissedThisSession');
                    console.log('安装提示关闭时间已超过1小时，重新显示');
                }
            }

            return true;
        }

        // 显示安装提示的核心函数
        function tryShowInstallPrompt() {
            if (shouldShowInstallPrompt()) {
                console.log('尝试显示PWA安装提示');
                showInstallPrompt();
            }
        }

        // 监听beforeinstallprompt事件
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('beforeinstallprompt事件触发');
            e.preventDefault();
            deferredPrompt = e;
            tryShowInstallPrompt();
        });

        // 监听安装事件
        window.addEventListener('appinstalled', () => {
            console.log('PWA 已安装');
            hideInstallPrompt();
            showPageNotification('应用已成功安装到设备！');
        });

        // 简化的安装提示显示机制（只显示一次）
        console.log('PWA初始化：设置安装提示显示机制');

        // 只在HTTP环境下显示安装提示，延迟2秒后显示一次
        const isHttp = window.location.protocol === 'http:' || window.location.protocol === 'https:';
        if (isHttp) {
            console.log('HTTP环境：准备显示安装提示');
            setTimeout(() => {
                if (shouldShowInstallPrompt()) {
                    console.log('HTTP环境：显示安装提示');
                    showInstallPrompt();
                } else {
                    console.log('HTTP环境：跳过安装提示，原因:', {
                        hasBanner: !!document.getElementById('install-banner'),
                        isInstalled: window.matchMedia('(display-mode: standalone)').matches,
                        isDismissed: window.DataSyncStorage.getRaw('installDismissed')
                    });
                }
            }, 2000);
        } else {
            console.log('非HTTP环境，跳过安装提示');
        }

        // 调试函数
        window.debugShowInstallPrompt = function () {
            console.log('手动触发安装提示显示');
            showInstallPrompt();
        };

        window.debugInstallStatus = function () {
            console.log('安装状态检查:', {
                protocol: window.location.protocol,
                isStandalone: window.matchMedia('(display-mode: standalone)').matches,
                hasBanner: !!document.getElementById('install-banner'),
                readyState: document.readyState,
                shouldShow: shouldShowInstallPrompt()
            });
        };

    } catch (error) {
        console.error('PWA初始化过程中发生错误:', error);
    }
}
// 显示安装提示
function showInstallPrompt() {
    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('应用已安装，跳过安装提示');
        return;
    }

    // 检查是否已经有安装提示显示
    if (document.getElementById('install-banner')) {
        console.log('安装提示已显示，跳过重复显示');
        return;
    }

    console.log('显示PWA安装提示');

    // 确保页面完全加载后再显示
    if (document.readyState !== 'complete') {
        console.log('页面未完全加载，等待加载完成');
        window.addEventListener('load', () => {
            setTimeout(() => showInstallPrompt(), 500);
        });
        return;
    }

    // 创建安装提示
    const installBanner = document.createElement('div');
    installBanner.id = 'install-banner';
    installBanner.appendChild(createInstallBannerContent());

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        #install-banner {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: var(--primary-gradient);
            color: white;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            z-index: 10000;
            animation: slideInUp 0.3s ease-out;
            max-width: 400px;
            margin: 0 auto;
        }

        .install-banner-content {
            display: flex;
            align-items: center;
            padding: 20px;
            gap: 16px;
        }

        .install-banner-icon {
            font-size: 2.5rem;
            flex-shrink: 0;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .install-banner-text {
            flex: 1;
            color: white;
            min-width: 0;
        }

        .install-banner-title {
            font-weight: 700;
            font-size: 1.2rem;
            margin-bottom: 6px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            line-height: 1.2;
        }

        .install-banner-desc {
            font-size: 0.95rem;
            opacity: 0.95;
            line-height: 1.4;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .install-banner-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex-shrink: 0;
            align-items: flex-end;
        }

        .install-banner-buttons {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .install-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
        }

        .install-btn.primary {
            background: rgba(255, 255, 255, 0.25);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .install-btn.primary:hover {
            background: rgba(255, 255, 255, 0.35);
            border-color: rgba(255, 255, 255, 0.6);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .install-btn.secondary {
            background: transparent;
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.4);
        }

        .install-btn.secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.6);
            transform: translateY(-1px);
        }

        .install-btn.text {
            background: transparent;
            color: rgba(255, 255, 255, 0.85);
            border: none;
            font-size: 0.85rem;
            text-decoration: underline;
            padding: 6px 8px;
            font-weight: 500;
        }

        .install-btn.text:hover {
            color: white;
            background: rgba(255, 255, 255, 0.1);
            text-decoration: none;
            border-radius: 4px;
        }

        @keyframes slideInUp {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }

        @keyframes slideOutDown {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(100%);
                opacity: 0;
            }
        }

        @media (max-width: 480px) {
            #install-banner {
                left: 10px;
                right: 10px;
                bottom: 10px;
                max-width: none;
            }

            .install-banner-content {
                padding: 16px;
                gap: 12px;
            }

            .install-banner-icon {
                font-size: 2rem;
            }

            .install-banner-title {
                font-size: 1.1rem;
            }

            .install-banner-desc {
                font-size: 0.9rem;
            }

            .install-banner-actions {
                gap: 8px;
            }

            .install-banner-buttons {
                gap: 8px;
            }

            .install-btn {
                padding: 8px 16px;
                font-size: 0.85rem;
            }

            .install-btn.text {
                font-size: 0.8rem;
                padding: 4px 6px;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(installBanner);

    // 绑定事件
    document.getElementById('install-btn').addEventListener('click', () => {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            window.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('用户接受了安装提示');
                } else {
                    console.log('用户拒绝了安装提示');
                }
                window.deferredPrompt = null;
            });
        }
        hideInstallPrompt();
    });

    document.getElementById('dismiss-install').addEventListener('click', () => {
        // 不隐藏安装提示，让用户持续看到
        console.log('用户选择稍后安装，安装提示将继续显示');
    });

    document.getElementById('never-install').addEventListener('click', () => {
        // 临时关闭安装提示（存储时间戳，1小时后重新显示）
        window.DataSyncStorage.setSessionRaw('installDismissedThisSession', Date.now().toString());
        hideInstallPrompt();
        showPageNotification('本次会话不再显示安装提示，1小时后重新显示');
        console.log('用户选择本次不再提醒安装');
    });

    // 添加手动显示安装提示的功能
    window.showInstallPromptAgain = function () {
        showInstallPrompt();
        showPageNotification('安装提示已重新显示');
    };

    // 添加清除会话存储的功能（用于测试）
    window.clearInstallDismissed = function () {
        window.DataSyncStorage.removeSessionRaw('installDismissedThisSession');
        window.DataSyncStorage.removeRaw('installDismissed');
        showPageNotification('安装提示状态已重置，刷新页面后重新显示');
        console.log('安装提示状态已重置');
    };
}

function createInstallBannerContent() {
    const content = document.createElement('div');
    content.className = 'install-banner-content';
    const icon = document.createElement('div');
    icon.className = 'install-banner-icon';
    icon.textContent = '📱';
    const text = document.createElement('div');
    text.className = 'install-banner-text';
    const title = document.createElement('div');
    title.className = 'install-banner-title';
    title.textContent = '安装象限时光';
    const desc = document.createElement('div');
    desc.className = 'install-banner-desc';
    desc.textContent = '添加到主屏幕，获得更好的使用体验';
    text.append(title, desc);

    const actions = document.createElement('div');
    actions.className = 'install-banner-actions';
    const buttons = document.createElement('div');
    buttons.className = 'install-banner-buttons';
    buttons.append(
        createInstallButton('install-btn', 'install-btn primary', '安装'),
        createInstallButton('dismiss-install', 'install-btn secondary', '稍后')
    );
    actions.append(buttons, createInstallButton('never-install', 'install-btn text', '本次不再提醒'));
    content.append(icon, text, actions);
    return content;
}

function createInstallButton(id, className, text) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = className;
    button.textContent = text;
    return button;
}

// 隐藏安装提示
function hideInstallPrompt() {
    const banner = document.getElementById('install-banner');
    if (banner) {
        banner.style.animation = 'slideOutDown 0.3s ease-in';
        setTimeout(() => banner.remove(), 300);
    }
}

// 显示更新通知
function showUpdateNotification() {
    // 检查是否已经存在更新通知
    if (document.getElementById('update-banner')) {
        console.log('更新通知已存在，跳过重复创建');
        return;
    }

    const updateBanner = document.createElement('div');
    updateBanner.id = 'update-banner';
    updateBanner.appendChild(createUpdateBannerContent());

    // 检查样式是否已存在
    if (!document.getElementById('update-banner-styles')) {
        const style = document.createElement('style');
        style.id = 'update-banner-styles';
        style.textContent = `
        #update-banner {
            position: fixed;
            top: 20px;
            left: 20px;
            right: 20px;
            background: var(--accent-orange);
            color: white;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            z-index: 10001;
            animation: slideInDown 0.3s ease-out;
            max-width: 400px;
            margin: 0 auto;
        }

        .update-banner-content {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            gap: 12px;
        }

        .update-banner-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
        }

        .update-banner-text {
            flex: 1;
        }

        .update-banner-title {
            font-weight: 600;
            font-size: 0.9rem;
            margin-bottom: 2px;
        }

        .update-banner-desc {
            font-size: 0.8rem;
            opacity: 0.9;
        }

        .update-btn {
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: var(--radius-sm);
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .update-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-1px);
        }

        @keyframes slideInDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
        document.head.appendChild(style);
    }

    document.body.appendChild(updateBanner);

    // 绑定刷新按钮事件
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            console.log('用户点击刷新按钮');
            // 清除更新通知状态
            window.DataSyncStorage.removeRaw('updateAvailable');
            // 强制刷新页面
            window.location.reload(true);
        });
        console.log('更新通知刷新按钮事件已绑定');
    } else {
        console.error('刷新按钮未找到');
    }
}

function createUpdateBannerContent() {
    const content = document.createElement('div');
    content.className = 'update-banner-content';
    const icon = document.createElement('div');
    icon.className = 'update-banner-icon';
    icon.textContent = '🔄';
    const text = document.createElement('div');
    text.className = 'update-banner-text';
    const title = document.createElement('div');
    title.className = 'update-banner-title';
    title.textContent = '发现新版本';
    const desc = document.createElement('div');
    desc.className = 'update-banner-desc';
    desc.textContent = '点击刷新获取最新功能';
    text.append(title, desc);
    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.id = 'refresh-btn';
    refresh.className = 'update-btn';
    refresh.textContent = '刷新';
    content.append(icon, text, refresh);
    return content;
}

// 隐藏更新通知
function hideUpdateNotification() {
    const updateBanner = document.getElementById('update-banner');
    if (updateBanner) {
        updateBanner.style.animation = 'slideOutUp 0.3s ease-in';
        setTimeout(() => {
            updateBanner.remove();
            console.log('更新通知已隐藏');
        }, 300);
    }
}

// 检查更新状态
function checkUpdateStatus() {
    const updateAvailable = window.DataSyncStorage.getRaw('updateAvailable');
    if (updateAvailable === 'true') {
        console.log('检测到更新可用，显示更新通知');
        showUpdateNotification();
    }
}

// 测试更新通知（用于调试）
window.testUpdateNotification = function () {
    window.DataSyncStorage.setRaw('updateAvailable', 'true');
    showUpdateNotification();
    console.log('测试更新通知已显示');
};

// 清除更新通知（用于调试）
window.clearUpdateNotification = function () {
    window.DataSyncStorage.removeRaw('updateAvailable');
    hideUpdateNotification();
    console.log('更新通知已清除');
};

// 控制错误通知显示
window.toggleErrorNotifications = function (enable = null) {
    if (enable === null) {
        // 切换状态
        const current = window.DataSyncStorage.getRaw('disableErrorNotifications') === 'true';
        enable = !current;
    }

    window.DataSyncStorage.setRaw('disableErrorNotifications', (!enable).toString());
    console.log('错误通知已', enable ? '启用' : '禁用');
    showPageNotification(`错误通知已${enable ? '启用' : '禁用'}`);
};

// 禁用所有错误通知
window.disableErrorNotifications = function () {
    window.toggleErrorNotifications(false);
};

// 专门处理Service Worker错误
function handleServiceWorkerErrors() {
    // 监听Service Worker错误
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('error', (event) => {
            console.log('Service Worker内部错误，已静默处理:', event);
            event.preventDefault();
            // 不显示用户警告
        });

        navigator.serviceWorker.addEventListener('messageerror', (event) => {
            console.log('Service Worker消息错误，已静默处理:', event);
            event.preventDefault();
            // 不显示用户警告
        });

        // 拦截Service Worker的所有message事件错误
        navigator.serviceWorker.addEventListener('message', (event) => {
            // 静默处理，不做任何操作
        });
    }

    // 重写Service Worker注册，添加更好的错误处理
    if ('serviceWorker' in navigator && navigator.serviceWorker.register) {
        const originalRegister = navigator.serviceWorker.register;
        navigator.serviceWorker.register = function (scriptURL, options) {
            return originalRegister.call(this, scriptURL, options)
                .catch(error => {
                    console.log('Service Worker注册失败，但不影响应用使用:', error.message);
                    // 返回一个模拟的注册对象，避免后续错误
                    return Promise.resolve({
                        installing: null,
                        waiting: null,
                        active: null,
                        scope: '',
                        addEventListener: () => { },
                        removeEventListener: () => { },
                        unregister: () => Promise.resolve(false),
                        update: () => Promise.resolve()
                    });
                });
        };
    }

    // 全局拦截所有与Service Worker相关的Promise错误
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function (type, listener, options) {
        if (type === 'unhandledrejection') {
            const wrappedListener = function (event) {
                const errorMsg = event.reason?.message || event.reason?.toString() || '';
                if (errorMsg.includes('ServiceWorker') ||
                    errorMsg.includes('service worker') ||
                    errorMsg.includes('message channel')) {
                    event.preventDefault();
                    return;
                }
                return listener.call(this, event);
            };
            return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
    };
}



window.initPWA = initPWA;
window.showInstallPrompt = showInstallPrompt;
window.hideInstallPrompt = hideInstallPrompt;
window.showUpdateNotification = showUpdateNotification;
window.hideUpdateNotification = hideUpdateNotification;
window.checkUpdateStatus = checkUpdateStatus;
window.handleServiceWorkerErrors = handleServiceWorkerErrors;
