// ===== 桌面通知系统 =====

// 检查浏览器是否支持桌面通知
function isNotificationSupported() {
    return 'Notification' in window;
}

// 请求通知权限
async function requestNotificationPermission() {
    console.log('🔔 请求通知权限');

    if (!isNotificationSupported()) {
        console.log('❌ 浏览器不支持通知');
        showPageNotification(t('browserNotSupported'));
        return false;
    }

    try {
        console.log('📝 当前权限状态:', Notification.permission);
        const permission = await Notification.requestPermission();
        console.log('📝 新权限状态:', permission);

        notificationPermission = permission;

        if (permission === 'granted') {
            console.log('✅ 通知权限已授予');
            showPageNotification(t('permissionGranted'));
            updateNotificationStatus();
            return true;
        } else {
            console.log('❌ 通知权限被拒绝');
            showPageNotification(t('permissionDenied'));
            updateNotificationStatus();
            return false;
        }
    } catch (error) {
        console.error('请求通知权限失败:', error);
        showPageNotification(t('permissionDenied'));
        return false;
    }
}

// 更新通知状态显示
function updateNotificationStatus() {
    const statusIcon = document.getElementById('notification-status-icon');
    const statusDesc = document.getElementById('notification-status-desc');
    const requestBtn = document.getElementById('request-permission-btn');
    const options = document.getElementById('notification-options');
    const alert = document.getElementById('notification-alert');

    if (!statusIcon || !statusDesc || !requestBtn || !options) return;

    if (notificationPermission === 'granted') {
        statusIcon.textContent = 'notifications';
        statusIcon.style.color = '#4caf50';
        statusDesc.textContent = t('notificationEnabled');
        requestBtn.style.display = 'none';
        options.style.display = 'block';
        if (alert) alert.style.display = 'none';
    } else if (notificationPermission === 'denied') {
        statusIcon.textContent = 'notifications_off';
        statusIcon.style.color = '#f44336';
        statusDesc.textContent = t('notificationDisabled');
        requestBtn.style.display = 'none';
        options.style.display = 'none';
        if (alert) alert.style.display = 'none';
    } else {
        statusIcon.textContent = 'notifications_off';
        statusIcon.style.color = '#ff9800';
        statusDesc.textContent = t('notificationDisabled');
        requestBtn.style.display = 'block';
        options.style.display = 'none';
        if (alert) alert.style.display = 'block';
    }
}

// 发送桌面通知
function sendDesktopNotification(title, body, options = {}) {
    console.log('🔔 尝试发送桌面通知:', { title, body, options });

    if (!isNotificationSupported()) {
        console.log('❌ 浏览器不支持通知API');
        return null;
    }

    if (notificationPermission !== 'granted') {
        console.log('❌ 通知权限未授予:', notificationPermission);
        return null;
    }

    if (!notificationSettings.enabled) {
        console.log('❌ 通知功能已禁用');
        return null;
    }

    // 检查是否在file://协议下运行
    if (window.location.protocol === 'file:') {
        console.log('⚠️ 检测到file://协议，通知功能可能受限');

        // 检查用户是否已经关闭过提示（使用sessionStorage，页面刷新后会重置）
        const hasShownFileProtocolWarning = sessionStorage.getItem('fileProtocolWarningShown');

        if (!hasShownFileProtocolWarning) {
            showPageNotification('检测到file://协议，建议使用HTTP服务器运行以获得完整功能');

            // 标记已经显示过提示
            sessionStorage.setItem('fileProtocolWarningShown', 'true');
        }
    }

    const defaultOptions = {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234caf50"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234caf50"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
        tag: 'task-reminder',
        requireInteraction: true,
        silent: !notificationSettings.sound,
        vibrate: notificationSettings.vibration ? [200, 100, 200] : undefined,
        ...options
    };

    try {
        console.log('📝 创建通知对象，选项:', defaultOptions);
        const notification = new Notification(title, defaultOptions);

        console.log('✅ 通知对象创建成功:', notification);

        // 设置通知事件
        notification.addEventListener('click', function () {
            console.log('📱 通知被点击');
            window.focus();
            notification.close();
        });

        notification.onshow = function () {
            console.log('👁️ 通知已显示');
        };

        notification.onerror = function (error) {
            console.error('❌ 通知显示错误:', error);
        };

        notification.onclose = function () {
            console.log('❌ 通知已关闭');
        };

        // 自动关闭通知（10秒后）
        setTimeout(() => {
            console.log('⏰ 自动关闭通知');
            notification.close();
        }, 10000);

        return notification;
    } catch (error) {
        console.error('❌ 发送桌面通知失败:', error);
        console.error('错误详情:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return null;
    }
}

// 发送任务提醒通知
function sendTaskNotification(task, isOverdue = false) {
    console.log(`📱 准备发送任务通知: ${task.title}, 过期: ${isOverdue}`);

    const title = isOverdue ? t('taskOverdue') : t('taskDueSoon');
    const body = `${task.title} - ${new Date(task.endDate).toLocaleString()}`;

    console.log(`📱 通知内容: 标题="${title}", 内容="${body}"`);

    const result = sendDesktopNotification(title, body, {
        icon: isOverdue ? 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f44336"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff9800"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
        tag: `task-${task.id}`
    });

    console.log(`📱 通知发送结果:`, result);
    return result;
}

// 测试通知
function testNotification() {
    console.log('🔔 开始测试通知功能');
    console.log('浏览器支持通知:', isNotificationSupported());
    console.log('通知权限状态:', notificationPermission);
    console.log('通知设置:', notificationSettings);

    if (!isNotificationSupported()) {
        console.log('❌ 浏览器不支持通知');
        showPageNotification(t('browserNotSupported'));
        return;
    }

    if (notificationPermission !== 'granted') {
        console.log('❌ 通知权限未授予，尝试请求权限');
        showPageNotification('正在请求通知权限...');

        // 自动请求权限
        requestNotificationPermission().then(granted => {
            if (granted) {
                // 权限授予后，再次尝试发送测试通知
                setTimeout(() => {
                    sendTestNotification();
                }, 1000);
            } else {
                showPageNotification('通知权限被拒绝，无法发送桌面通知');
            }
        });
        return;
    }

    if (!notificationSettings.enabled) {
        console.log('❌ 通知功能已禁用');
        showPageNotification('通知功能已禁用，请在设置中启用');
        return;
    }

    sendTestNotification();
}

// 发送测试通知的辅助函数
function sendTestNotification() {
    console.log('✅ 开始发送测试通知');

    // 直接发送桌面通知进行测试
    const notification = sendDesktopNotification(
        t('notificationTest'),
        '这是一个测试通知，用于验证通知功能是否正常工作',
        {
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234caf50"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            tag: 'test-notification'
        }
    );

    if (notification) {
        console.log('✅ 测试通知发送成功');
        showPageNotification('测试通知已发送，请查看桌面通知');
    } else {
        console.log('❌ 测试通知发送失败');
        showPageNotification('测试通知发送失败，请检查设置');
    }
}

// 加载通知设置
function loadNotificationSettings() {
    try {
        notificationSettings = window.ProductivityStorage
            ? window.ProductivityStorage.getNotificationSettings('notificationSettings')
            : { ...notificationSettings, ...JSON.parse(localStorage.getItem('notificationSettings') || '{}') };
    } catch (error) {
        console.error('加载通知设置失败:', error);
    }

    // 检查通知权限状态
    if (isNotificationSupported()) {
        notificationPermission = Notification.permission;
    }
}

// 保存通知设置
function saveNotificationSettings() {
    try {
        notificationSettings = window.ProductivityStorage
            ? window.ProductivityStorage.setNotificationSettings('notificationSettings', notificationSettings)
            : notificationSettings;
        if (!window.ProductivityStorage) {
            localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
        }
        showPageNotification(t('settingsSaved'));
    } catch (error) {
        console.error('保存通知设置失败:', error);
        showPageNotification(t('saveFailed'));
    }
}

// 更新任务提醒检查函数以支持桌面通知
function checkTaskRemindersWithNotification() {
    const now = new Date();
    const currentTime = now.getTime();

    // 调试信息
    if (window.debugMode) {
        console.log('🔔 检查任务提醒:', now.toLocaleString());
        console.log('通知设置:', notificationSettings);
        console.log('通知权限:', notificationPermission);
    }

    let hasNewReminders = false;

    tasks.forEach(task => {
        if (task.completed || !task.endDate) {
            return;
        }

        const endTime = new Date(task.endDate).getTime();
        const timeDiff = endTime - currentTime;
        const advanceTimeMs = notificationSettings.advanceTime * 60 * 1000; // 转换为毫秒

        const isOverdue = timeDiff <= 0;
        const isAboutToDue = timeDiff > 0 && timeDiff <= advanceTimeMs;

        // 调试信息
        if (window.debugMode) {
            console.log(`📝 任务 "${task.title}":`);
            console.log(`   结束时间: ${new Date(task.endDate).toLocaleString()}`);
            console.log(`   当前时间: ${now.toLocaleString()}`);
            console.log(`   时间差: ${Math.round(timeDiff / 1000)}秒`);
            console.log(`   提前时间: ${notificationSettings.advanceTime}分钟`);
            console.log(`   是否过期: ${isOverdue}`);
            console.log(`   即将到期: ${isAboutToDue}`);
        }

        // 详细的条件检查
        const shouldNotifyOverdue = isOverdue && notificationSettings.showOverdue;
        const shouldNotifyDueSoon = isAboutToDue;
        const shouldNotify = shouldNotifyOverdue || shouldNotifyDueSoon;

        if (window.debugMode) {
            console.log(`🔍 通知条件检查:`);
            console.log(`   过期且显示过期: ${shouldNotifyOverdue}`);
            console.log(`   即将到期: ${shouldNotifyDueSoon}`);
            console.log(`   应该通知: ${shouldNotify}`);
        }

        if (shouldNotify) {
            // 检查是否已经有该任务的持续提醒（仅用于页面提醒）
            const existingReminder = document.querySelector(`[data-task-id="${task.id}"]`);

            if (window.debugMode) {
                console.log(`🔍 检查持续提醒: 任务ID=${task.id}, 存在=${!!existingReminder}`);
            }

            // 页面提醒：只在没有持续提醒时显示
            if (!existingReminder) {
                hasNewReminders = true;
                console.log(`🚨 显示页面提醒: ${task.title} (过期: ${isOverdue}, 即将到期: ${isAboutToDue})`);
                showPersistentNotification(task);
            } else {
                if (window.debugMode) {
                    console.log(`⚠️ 任务 ${task.title} 已有页面提醒，跳过页面提醒`);
                }
            }

            // 桌面通知：独立于页面提醒，总是发送（如果权限允许）
            if (notificationPermission === 'granted') {
                console.log(`📱 发送桌面通知: ${task.title} (过期: ${isOverdue}, 即将到期: ${isAboutToDue})`);
                sendTaskNotification(task, isOverdue);
            } else {
                console.log('⚠️ 通知权限未授予，跳过桌面通知');
            }
        }
    });

    if (hasNewReminders) {
        console.log('🚨 发现新的任务提醒');
    }
}

// 创建通知音效
function createNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
        console.error('创建通知音效失败:', error);
    }
}

// 显示通知设置模态框
function showNotificationSettings() {
    const modal = document.getElementById('notification-modal');
    if (!modal) return;

    // 更新设置值
    document.getElementById('notification-enabled').checked = notificationSettings.enabled;
    document.getElementById('notification-sound').checked = notificationSettings.sound;
    document.getElementById('notification-vibration').checked = notificationSettings.vibration;
    document.getElementById('advance-time').value = notificationSettings.advanceTime;
    document.getElementById('show-overdue').checked = notificationSettings.showOverdue;

    // 更新状态显示
    updateNotificationStatus();

    // 如果权限是default，自动请求权限
    if (notificationPermission === 'default') {
        console.log('🔔 自动请求通知权限');
        requestNotificationPermission();
    }

    // 显示模态框
    modal.style.display = 'block';
}

// 关闭通知设置模态框
function closeNotificationSettings() {
    const modal = document.getElementById('notification-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 保存通知设置
function saveNotificationSettingsFromForm() {
    notificationSettings.enabled = document.getElementById('notification-enabled').checked;
    notificationSettings.sound = document.getElementById('notification-sound').checked;
    notificationSettings.vibration = document.getElementById('notification-vibration').checked;
    notificationSettings.advanceTime = parseInt(document.getElementById('advance-time').value);
    notificationSettings.showOverdue = document.getElementById('show-overdue').checked;

    saveNotificationSettings();
    closeNotificationSettings();
}

// 初始化通知系统
function initNotificationSystem() {
    loadNotificationSettings();
    updateNotificationStatus();

    // 启用调试模式（临时）
    window.debugMode = true;

    // 绑定事件监听器
    const notificationBtn = document.getElementById('notification-settings-btn');
    const requestBtn = document.getElementById('request-permission-btn');
    const testBtn = document.getElementById('test-notification-btn');
    const saveBtn = document.getElementById('notification-save-btn');
    const cancelBtn = document.getElementById('notification-cancel-btn');

    if (notificationBtn) {
        notificationBtn.addEventListener('click', showNotificationSettings);
    }

    if (requestBtn) {
        requestBtn.addEventListener('click', requestNotificationPermission);
    }

    if (testBtn) {
        testBtn.addEventListener('click', testNotification);
    }


    if (saveBtn) {
        saveBtn.addEventListener('click', saveNotificationSettingsFromForm);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeNotificationSettings);
    }

    // 模态框关闭事件
    const notificationModal = document.getElementById('notification-modal');
    if (notificationModal) {
        notificationModal.addEventListener('click', (e) => {
            if (e.target === notificationModal) {
                closeNotificationSettings();
            }
        });

        const modalClose = document.getElementById('notification-modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', closeNotificationSettings);
        }
    }

    // 更新提醒检查函数
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }

    reminderInterval = setInterval(() => {
        checkTaskRemindersWithNotification();
    }, 1000);

    console.log('🔔 通知系统已初始化');

    // 强制更新Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                console.log('🔄 更新Service Worker...');
                registration.update();
            });
        });
    }

    // 检查运行环境
    if (window.location.protocol === 'file:') {
        console.log('⚠️ 检测到file://协议，通知功能可能受限');

        // 检查用户是否已经关闭过提示（使用sessionStorage，页面刷新后会重置）
        const hasShownFileProtocolWarning = sessionStorage.getItem('fileProtocolWarningShown');

        if (!hasShownFileProtocolWarning) {
            showPageNotification('检测到file://协议，建议使用HTTP服务器运行以获得完整功能');

            // 标记已经显示过提示
            sessionStorage.setItem('fileProtocolWarningShown', 'true');
        }

        // 添加启动本地服务器的提示
        const serverTip = document.createElement('div');
        serverTip.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 12px 20px;
            color: #856404;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            max-width: 500px;
            text-align: center;
        `;
        const title = document.createElement('div');
        title.style.cssText = 'margin-bottom: 8px; font-weight: bold;';
        title.textContent = '💡 建议使用HTTP服务器运行';
        const description = document.createElement('div');
        description.style.marginBottom = '8px';
        description.textContent = '在项目目录下运行以下命令启动本地服务器：';
        const command = document.createElement('div');
        command.style.cssText = 'background: #f8f9fa; padding: 8px; border-radius: 4px; font-family: monospace; margin-bottom: 8px;';
        command.textContent = 'python -m http.server 8080';
        const linkRow = document.createElement('div');
        linkRow.appendChild(document.createTextNode('然后访问: '));
        const link = document.createElement('a');
        link.href = 'http://localhost:8080';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.color = '#007bff';
        link.textContent = 'http://localhost:8080';
        linkRow.appendChild(link);
        const closeBtn = document.createElement('button');
        closeBtn.dataset.serverTipClose = '';
        closeBtn.style.cssText = 'position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 18px; cursor: pointer;';
        closeBtn.textContent = '×';
        serverTip.append(title, description, command, linkRow, closeBtn);
        document.body.appendChild(serverTip);
        serverTip.querySelector('[data-server-tip-close]')?.addEventListener('click', () => serverTip.remove());

        // 5秒后自动隐藏提示
        setTimeout(() => {
            if (serverTip.parentElement) {
                serverTip.remove();
            }
        }, 10000);
    }

}
