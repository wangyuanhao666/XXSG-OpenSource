// ==================== 调试配置 ====================
// 设置为 false 可关闭调试日志，保留错误和警告
const DEBUG_MODE = false;

// 调试日志函数（仅在DDEBUG_MODE开启时输出）
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

// Open-source safety defaults.
// No public admin password is shipped in the frontend bundle. On a fresh
// self-hosted deployment, the admin password is initialized from the first
// successful `admin` login attempt.
function getDefaultAdminPassword() {
    return '';
}

function verifyCommandPassword(commandPassword) {
    return !!commandPassword && commandPassword === getCurrentAdminPassword();
}

function getCurrentAdminPassword() {
    return window.AdminStorage.getRaw('adminPassword') || '';
}

function renderLoginMarkup(container, markup) {
    if (!container) return;
    container.replaceChildren(...createSanitizedLoginNodes(markup));
}

function appendLoginMarkup(container, markup) {
    if (!container) return;
    container.append(...createSanitizedLoginNodes(markup));
}

function createSanitizedLoginNodes(markup) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${markup}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    root.querySelectorAll('script, iframe, object, embed, link, meta').forEach(node => node.remove());
            root.querySelectorAll('*').forEach(node => {
        [...node.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const value = attr.value.trim().toLowerCase();
            // 保留 不被移除
            if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
                node.removeAttribute(attr.name);
            }
        });
    });return [...root.childNodes].map(node => document.importNode(node, true));
}

function setLoginView(view) {
    const forms = {
        account: document.getElementById('account-form'),
        admin: document.getElementById('admin-form'),
        register: document.getElementById('register-form')
    };
    const tabs = {
        account: document.querySelector('[data-tab="account"]'),
        admin: document.querySelector('[data-tab="admin"]')
    };
    const loginPage = document.querySelector('.login-page');

    Object.entries(forms).forEach(([key, form]) => {
        if (!form) return;
        const isActive = key === view;
        form.classList.toggle('active', isActive);
        form.style.display = isActive ? 'block' : 'none';
    });

    Object.entries(tabs).forEach(([key, tab]) => {
        if (!tab) return;
        tab.classList.toggle('active', key === view);
    });

    if (loginPage) {
        loginPage.classList.toggle('register-mode', view === 'register');
    }
}

// 工具函数定义 - 必须在其他函数之前定义
// 显示错误信息
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');

        // 清除输入框错误状态
        const inputElement = document.getElementById(elementId.replace('-error', ''));
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }
}

// 验证账号输入
function validateAccountInput(username, authCredential) {
    let isValid = true;

    if (!username) {
        showError('username-error', '请输入用户名或邮箱');
        isValid = false;
    }

    if (!authCredential) {
        showError('password-error', '请输入密码');
        isValid = false;
    }

    return isValid;
}

// 测试登录状态
function testLoginStatus() {
    console.log('=== 登录状态测试 ===');
    console.log('Current user state checked.');
    console.log('登录状态:', isLoggedIn);
    console.log('Persistent session present:', !!window.SessionStorage.getSession('userSession'));
    console.log('Session boundary checked.');
    console.log('==================');
}

// 保存用户会话
function saveUserSession(user, rememberMe) {
    // 确保用户对象包含必要的字段
    if (!user || !user.id) {
        console.error('❌ 用户数据不完整，无法保存会话');
        return false;
    }

    const sessionData = {
        user: {
            id: user.id,
            username: user.username,
            email: user.email || '',
            role: user.role || 'user',
            permissions: user.permissions || []
        },
        loginTime: new Date().toISOString(),
        rememberMe: rememberMe
    };

    console.log('💾 保存用户会话:', {
        userId: sessionData.user.id,
        username: sessionData.user.username,
        loginTime: sessionData.loginTime,
        rememberMe: sessionData.rememberMe
    });

    try {
        const sessionStr = JSON.stringify(sessionData);

        if (rememberMe) {
            window.SessionStorage.setSession(sessionData, { remember: true });
            console.log('✅ 会话已保存到localStorage');
        } else {
            window.SessionStorage.setSession(sessionData, { remember: false });
            console.log('✅ 会话已保存到sessionStorage');
        }

        // 验证保存是否成功
        const saved = window.SessionStorage.getSession('userSession');

        if (saved?.user?.id === sessionData.user.id) {
            console.log('✅ 会话数据保存验证成功');
        } else {
            console.error('❌ 会话数据保存验证失败');
            return false;
        }

        // 设置全局变量
        currentUser = user;
        isLoggedIn = true;

        console.log('Current user state checked.');
        console.log('登录状态:', isLoggedIn);

        return true;
    } catch (error) {
        console.error('❌ 保存会话数据时发生错误:', error);
        return false;
    }

    // 验证会话是否保存成功
    setTimeout(() => {
        const savedSession = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
        console.log('验证保存的会话:', savedSession);
    }, 100);
}

// ========== 管理员密码加密/解密 ==========
// 简单加密：Base64 + 反转（防君子不防小人）
function decryptAdminPassword(encrypted) {
    try {
        // 反转字符串
        const reversed = encrypted.split('').reverse().join('');
        // Base64解码
        const decrypted = atob(reversed);
        return decrypted;
    } catch (e) {
        console.error('密码解密失败:', e);
        return '';
    }
}

// 获取默认管理员密码（解密后的）
function getDefaultAdminPassword() {
    // 加密后的密码
    // 加密过程：Base64编码 -> 反转
    const encrypted = '';
    return decryptAdminPassword(encrypted);
}

// 验证指令密码（用于修改密码等敏感操作）
function verifyCommandPassword(commandPassword) {
    const encrypted = '';
    const validPassword = decryptAdminPassword(encrypted);
    return commandPassword === validPassword;
}

// 获取当前管理员密码
function getCurrentAdminPassword() {
    const adminPassword = window.AdminStorage.getRaw('adminPassword');
    return adminPassword || getDefaultAdminPassword();
}

// 设置管理员密码
function setAdminPassword(newPassword) {
    window.AdminStorage.setAdminPassword(newPassword);
}

// Final open-source safety override after legacy compatibility helpers.
// This intentionally replaces the historical reversible default password.
getDefaultAdminPassword = function () {
    return '';
};

verifyCommandPassword = function (commandPassword) {
    return !!commandPassword && commandPassword === getCurrentAdminPassword();
};

getCurrentAdminPassword = function () {
    return window.AdminStorage.getRaw('adminPassword') || '';
};

// 显示加载状态
function showLoading(show) {
    const loading = document.getElementById('loading');
    const forms = document.querySelectorAll('.login-form');
    const buttons = document.querySelectorAll('.login-btn');

    if (show) {
        loading.style.display = 'block';
        forms.forEach(form => form.style.display = 'none');
        buttons.forEach(btn => btn.disabled = true);
    } else {
        loading.style.display = 'none';
        forms.forEach(form => form.style.display = '');
        buttons.forEach(btn => btn.disabled = false);
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `login-page-notification ${type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'}`;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// 模拟登录请求（使用安全验证）
async function simulateLogin(username, authCredential) {
    return new Promise(async (resolve) => {
        setTimeout(async () => {
            try {
                // 模拟用户数据
                const users = window.UserStorage.getUsers();

                // 如果没有用户数据，创建一些默认测试用户（使用哈希密码）
                if (users.length === 0) {
                    console.log('🔐 创建默认测试用户（使用哈希密码）...');

                    // 生成哈希密码
                    const defaultCredentialHash = await window.Security?.Password?.hashPassword?.('') || '';
                    const demoCredentialHash = await window.Security?.Password?.hashPassword?.('') || '';

                    const defaultUsers = [
                        {
                            id: 'user_1',
                            username: 'example-user',
                            password: defaultCredentialHash,
                            email: 'user@example.local',
                            phone: '13800138000',
                            role: 'user',
                            permissions: DEFAULT_USER_PERMISSIONS.slice(),
                            createdAt: new Date().toISOString(),
                            createdBy: 'admin',
                            passwordMigrated: true
                        },
                        {
                            id: 'user_2',
                            username: 'demo',
                            password: demoCredentialHash,
                            email: 'demo@example.local',
                            phone: '13900139000',
                            role: 'user',
                            permissions: DEFAULT_USER_PERMISSIONS.slice(),
                            createdAt: new Date().toISOString(),
                            createdBy: 'admin',
                            passwordMigrated: true
                        }
                    ];
                    // No demo users are created in open-source builds. Use the admin panel to create users.
                    // Demo users intentionally disabled for open-source builds.
                    console.log('✅ 默认用户已创建（密码已哈希）');
                }

                // 首先检查是否是管理员账户
                if (username === 'admin') {
                    let adminResult;
                    if (window.secureAdminLogin) {
                        adminResult = await window.secureAdminLogin(username, authCredential);
                    } else {
                        // 降级方案
                        const storedAdminCredential = window.AdminStorage.getRaw('adminPassword');
                        if (authCredential === storedAdminCredential) {
                            adminResult = {
                                id: 'admin',
                                username: 'admin',
                                email: 'admin@system.com',
                                phone: '',
                                avatar: '',
                                role: 'admin',
                                permissions: ['add-task', 'quadrant-view', 'fortune', 'backup', 'ai-fortune', 'dashboard', 'review', 'templates'],
                                createdAt: new Date().toISOString(),
                                createdBy: 'system'
                            };
                        }
                    }

                    if (adminResult) {
                        console.log('✅ 管理员登录成功');
                        resolve(adminResult);
                        return;
                    }
                }

                // 普通用户登录
                let userResult;
                if (window.secureUserLogin) {
                    userResult = await window.secureUserLogin(username, authCredential);
                } else {
                    // 降级方案：支持历史明文密码和当前开源版哈希密码
                    let user = null;
                    for (const candidate of users) {
                        const matchesIdentity = candidate.username === username || candidate.email === username;
                        if (!matchesIdentity) continue;

                        if (candidate.password && candidate.password.includes(':') &&
                            window.Security && window.Security.Password && window.Security.Password.verifyPassword) {
                            const verified = await window.Security.Password.verifyPassword(authCredential, candidate.password);
                            if (verified) {
                                user = candidate;
                                break;
                            }
                        } else if (candidate.password === authCredential) {
                            user = candidate;
                            break;
                        }
                    }

                    if (user) {
                        console.log('找到用户:', user.username);
                        const normalizedPermissions = Array.isArray(user.permissions) && user.permissions.length > 0
                            ? user.permissions
                            : DEFAULT_USER_PERMISSIONS.slice();

                        userResult = {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            phone: user.phone,
                            avatar: user.avatar || '',
                            role: user.role || 'user',
                            permissions: normalizedPermissions,
                            loginTime: new Date().toISOString()
                        };
                    }
                }

                if (userResult) {
                    console.log('✅ 用户登录成功:', userResult.username);
                    resolve(userResult);
                } else {
                    console.log('❌ 未找到用户或密码错误:', username);
                    resolve(null);
                }
            } catch (error) {
                console.error('❌ 登录验证失败:', error);
                resolve(null);
            }
        }, 1000);
    });
}

// 保存用户凭据（使用安全存储）
async function saveUserCredentials(username, authCredential) {
            console.log('Saving remembered credentials.', { username, credentialProvided: Boolean(authCredential) });

    try {
        if (window.secureSaveCredentials) {
            await window.secureSaveCredentials(username, authCredential);
        } else {
            // 安全存储不可用时，只保存用户名，不保存密码
            const credentials = {
                username: username,
                savedAt: new Date().toISOString()
            };
            window.DataSyncStorage.setRaw('savedCredentials_temp', JSON.stringify(credentials));
        }
    } catch (error) {
        console.error('❌ 保存用户凭据时发生错误:', error);
    }
}

// 简化的无痕模式检测
function checkIncognitoMode() {
    try {
        // 方法1: 检测localStorage是否可用
        const testKey = '__incognito_test__';
        window.DataSyncStorage.setRaw(testKey, 'test');
        window.DataSyncStorage.removeRaw(testKey);

        // 方法2: 检测sessionStorage是否可用
        window.DataSyncStorage.setSessionRaw(testKey, 'test');
        window.DataSyncStorage.removeSessionRaw(testKey);

        // 方法3: 检测是否有历史记录（无痕模式通常没有历史记录）
        if (window.history.length <= 1) {
            console.log('历史记录长度异常，可能是无痕模式');
            return true;
        }

        // 方法4: 检测User Agent中是否包含无痕模式标识
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('incognito') || userAgent.includes('private')) {
            console.log('User Agent包含无痕模式标识');
            return true;
        }

        // 如果所有检测都通过，不是无痕模式
        return false;
    } catch (e) {
        // 如果任何检测失败，很可能是无痕模式
        console.log('存储检测失败，可能是无痕模式:', e);
        return true;
    }
}

// 添加安全提示
function addSecurityNotice() {
    // 检查是否已经存在安全提示
    if (document.getElementById('security-notice')) {
        return;
    }

    const securityNotice = document.createElement('div');
    securityNotice.id = 'security-notice';
    securityNotice.className = 'login-security-notice';

    renderLoginMarkup(securityNotice, `
        <div class="login-security-notice-row">
            <span class="login-security-notice-icon">🔒</span>
            <div>
                <div class="login-security-notice-title">安全提示</div>
                <div class="login-security-notice-text">检测到无痕模式，为保护账户安全，请联系管理员获取登录凭据</div>
            </div>
        </div>
    `);

    document.body.appendChild(securityNotice);

    // 5秒后自动隐藏
    setTimeout(() => {
        if (securityNotice.parentNode) {
            securityNotice.classList.add('is-exiting');
            setTimeout(() => {
                if (securityNotice.parentNode) {
                    securityNotice.parentNode.removeChild(securityNotice);
                }
            }, 500);
        }
    }, 5000);
}

// 首次使用欢迎提示（开源本地优先版）
function showFirstTimeWelcome() {
    // 检查是否已经显示过欢迎提示
    if (document.getElementById('first-time-welcome')) {
        return;
    }

    const welcomeModal = document.createElement('div');
    welcomeModal.id = 'first-time-welcome';

    renderLoginMarkup(welcomeModal, `
        <div class="first-time-welcome-card">
            <div class="first-time-welcome-emoji">🎉</div>
            <h2 class="first-time-welcome-title">欢迎使用象限时光！</h2>
            <p class="first-time-welcome-intro">
                当前开源版是本地优先应用，你可以直接创建当前浏览器可用的本地账号：
            </p>

            <div class="first-time-welcome-info">
                <div class="first-time-welcome-row">
                    <span class="first-time-welcome-row-icon">📝</span>
                    <div>
                        <div class="first-time-welcome-row-title">第一步：创建账号</div>
                        <div class="first-time-welcome-row-text">点击登录页下方“本地注册 / 创建账号”，创建普通用户后即可进入应用。</div>
                    </div>
                </div>
                <div class="first-time-welcome-row">
                    <span class="first-time-welcome-row-icon">🔐</span>
                    <div>
                        <div class="first-time-welcome-row-title">可选：初始化管理员</div>
                        <div class="first-time-welcome-row-text">管理员用户名为 admin；首次输入任意 8 位以上密码，会初始化当前浏览器的本地管理员。</div>
                    </div>
                </div>
            </div>

            <div class="first-time-welcome-security">
                <div class="first-time-welcome-security-title">
                    <span>🔒</span>
                    <strong>安全提示</strong>
                </div>
                <div class="first-time-welcome-security-text">
                    账号、任务和 AI 配置默认保存在当前浏览器本地。<br>
                    换浏览器或清理缓存前，请先导出备份。
                </div>
            </div>

            <button id="first-time-welcome-close-btn" class="first-time-welcome-close" type="button">
                我知道了
            </button>
        </div>
    `);

    document.body.appendChild(welcomeModal);
    const closeBtn = document.getElementById('first-time-welcome-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFirstTimeWelcome);
    }
}

// 关闭首次欢迎提示
function closeFirstTimeWelcome() {
    const welcomeModal = document.getElementById('first-time-welcome');
    if (welcomeModal) {
        welcomeModal.classList.add('is-exiting');
        setTimeout(() => {
            if (welcomeModal.parentNode) {
                welcomeModal.parentNode.removeChild(welcomeModal);
            }
        }, 300);
    }
}

// 智能初始化数据（只在必要时创建默认数据）
function initializeDefaultData() {
    console.log('检查系统数据状态...');

    // 检查是否有任何用户数据
    const users = window.UserStorage.getUsers();
    const hasUsers = users.length > 0;
    const hasAdminPassword = window.AdminStorage.getRaw('adminPassword');
    const hasAiConfig = window.DataSyncStorage.getRaw('aiFortuneEnabled');

    console.log('数据状态检查:', {
        hasUsers: hasUsers,
        hasAdminPassword: !!hasAdminPassword,
        hasAiConfig: !!hasAiConfig
    });

    // 只有在完全没有数据时才初始化默认数据（首次使用）
    if (!hasUsers && !hasAdminPassword && !hasAiConfig) {
        console.log('检测到首次使用，初始化默认数据...');

        // 设置默认管理员密码（加密存储）
        // No default admin password in open-source builds; first admin login initializes it.
        console.log('Open-source build: admin password will be initialized on first admin login.');

        // 创建默认演示用户
        const defaultUsers = [
            {
                id: 'demo',
                username: 'demo',
                password: '',
                email: 'demo@example.local',
                role: 'normal',
                permissions: ['add-task', 'quadrant-view'],
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            }
        ];
        // No demo users are created in open-source builds. Use the admin panel to create users.
        console.log('Open-source build: demo users are not created automatically.');

        // 设置默认AI配置
        window.DataSyncStorage.setRaw('aiFortuneEnabled', 'false');
        console.log('已设置默认AI功能状态: 未启用');

        // 安全提示：不显示明文密码，引导用户查看帮助文档
        setTimeout(() => {
            showFirstTimeWelcome();
        }, 1000);

    } else if (!hasUsers && hasAdminPassword) {
        // 只有管理员密码但没有用户数据的情况
        console.log('检测到只有管理员数据，创建演示用户...');
        const defaultUsers = [
            {
                id: 'demo',
                username: 'demo',
                password: '',
                email: 'demo@example.local',
                role: 'normal',
                permissions: ['add-task', 'quadrant-view'],
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            }
        ];
        // No demo users are created in open-source builds. Use the admin panel to create users.
        console.log('Open-source build: demo users are not created automatically.');

    } else if (hasUsers && !hasAdminPassword) {
        // 只有用户数据但没有管理员密码的情况
        console.log('检测到只有用户数据，设置默认管理员密码...');
        // No default admin password in open-source builds; first admin login initializes it.
        console.log('Open-source build: admin password will be initialized on first admin login.');

    } else {
        console.log('系统数据完整，无需初始化');
    }

    // 确保AI配置存在
    if (!window.DataSyncStorage.getRaw('aiFortuneEnabled')) {
        window.DataSyncStorage.setRaw('aiFortuneEnabled', 'false');
        console.log('已设置默认AI功能状态: 未启用');
    }

    console.log('数据检查完成');
}

const DEFAULT_USER_PERMISSIONS = [
    'add-task',
    'quadrant-view',
    'fortune',
    'pomodoro',
    'habit-tracker',
    'countdown',
    'time-tracker',
    'calendar',
    'dashboard',
    'review',
    'templates'
];

// 跨浏览器数据同步功能
class CrossBrowserSync {
    constructor() {
        this.syncKey = 'quadrant_time_sync_data';
        this.initSync();
    }

    // 初始化同步
    initSync() {
        // 页面加载时尝试同步数据
        this.syncFromOtherBrowsers();

        // 监听存储变化
        window.addEventListener('storage', (e) => {
            if (e.key === this.syncKey) {
                this.handleStorageChange(e.newValue);
            }
        });
    }

    // 从其他浏览器同步数据
    syncFromOtherBrowsers() {
        try {
            const syncData = window.DataSyncStorage.getRaw(this.syncKey);
            if (syncData) {
                const data = JSON.parse(syncData);
                this.mergeData(data);
                console.log('从其他浏览器同步数据成功');
            }
        } catch (error) {
            console.error('同步数据失败:', error);
        }
    }

    // 合并数据 - 智能合并用户数据，避免覆盖
    mergeData(cloudData) {
        const localUsers = window.UserStorage.getUsers();
        const cloudUsers = Array.isArray(cloudData.users) ? cloudData.users : [];

        const buildUserKey = (user) => user?.username || user?.email || user?.id || null;
        const userMap = new Map();

        localUsers.forEach(user => {
            const key = buildUserKey(user);
            if (key) {
                userMap.set(key, { ...user });
            }
        });

        cloudUsers.forEach(cloudUser => {
            if (!cloudUser) return;
            const key = buildUserKey(cloudUser);
            if (!key) return;

            const localUser = userMap.get(key);

            // 🔧 修复权限合并逻辑：优先使用本地权限（管理员最新设置）
            // 本地权限是管理员在后台最新设置的，应该优先保留
            let mergedPermissions;

            if (localUser && Array.isArray(localUser.permissions) && localUser.permissions.length > 0) {
                // 优先使用本地权限（管理员在后台的最新设置）
                mergedPermissions = localUser.permissions;
                console.log(`🔧 用户 ${localUser.username}: 使用本地权限（管理员设置）`);
            } else if (Array.isArray(cloudUser.permissions) && cloudUser.permissions.length > 0) {
                // 如果本地没有权限，才使用云端权限
                mergedPermissions = cloudUser.permissions;
                console.log(`🔧 用户 ${cloudUser.username}: 使用云端权限`);
            } else {
                // 都没有权限，使用默认权限
                mergedPermissions = [];
            }

            const finalPermissions = mergedPermissions.length > 0 ? mergedPermissions : DEFAULT_USER_PERMISSIONS.slice();

            const mergedUser = {
                ...(localUser || {}),
                ...cloudUser,
                id: cloudUser.id || localUser?.id || `imported_${Date.now()}`,
                username: cloudUser.username || localUser?.username,
                email: cloudUser.email || localUser?.email || '',
                phone: cloudUser.phone || localUser?.phone || '',
                password: cloudUser.password || localUser?.password || '',
                permissions: finalPermissions,
                createdAt: cloudUser.createdAt || localUser?.createdAt || new Date().toISOString(),
                createdBy: cloudUser.createdBy || localUser?.createdBy || 'import'
            };

            userMap.set(key, mergedUser);

            if (localUser) {
                console.log('🔄 已更新用户数据:', mergedUser.username || mergedUser.email || mergedUser.id);
            } else {
                console.log('➕ 已新增用户数据:', mergedUser.username || mergedUser.email || mergedUser.id);
            }
        });

        const mergedUsers = Array.from(userMap.values());
        window.UserStorage.setUsers(mergedUsers);
        console.log('✅ 用户数据合并完成，当前用户总数:', mergedUsers.length);

        // 同步管理员密码（仅在本地没有时导入）
        if (cloudData.adminPassword && !window.AdminStorage.getRaw('adminPassword')) {
            window.AdminStorage.setAdminPassword(cloudData.adminPassword);
            console.log('✅ 已导入管理员密码');
        }
    }

    // 处理存储变化
    handleStorageChange(newValue) {
        if (newValue) {
            const data = JSON.parse(newValue);
            this.mergeData(data);
        }
    }

    // 导出数据 - 包含当前登录用户的所有数据
    async exportData() {
        try {
            console.log('📤 开始导出数据...');

            // 获取当前登录用户信息
            const sessionData = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
            let currentUser = null;

            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    currentUser = session.user || session;
                    console.log('✅ 找到登录用户:', currentUser.username, 'ID:', currentUser.id);
                } catch (e) {
                    console.error('❌ 解析用户会话失败:', e);
                }
            } else {
                console.warn('⚠️ 未找到登录会话，将尝试导出所有用户数据');
            }

            // 构建导出数据对象
            const data = {
                version: '2.0', // 数据格式版本
                exportTime: new Date().toISOString(),
                exportUser: currentUser ? {
                    id: currentUser.id,
                    username: currentUser.username,
                    email: currentUser.email
                } : null,

                // 用户数据
                users: window.UserStorage.getUsers(),

                // 当前登录用户的任务数据
                userTasks: null,

                // 当前登录用户的头像数据
                userAvatar: null,
                calendarAvatar: null,

                // 当前登录用户的个人设置
                userSettings: {},

                // 系统配置
                adminPassword: window.AdminStorage.getRaw('adminPassword'),
                aiConfig: await (async () => {
                    // 优先从加密存储读取
                    if (window.secureStorage) {
                        await window.secureStorage.ready();
                        const encrypted = await window.secureStorage.getSecure('aiConfig');
                        if (encrypted) return JSON.stringify(encrypted);
                    }
                    // 降级：从 localStorage 读取
                    return window.DataSyncStorage.getRaw('aiConfig') || window.DataSyncStorage.getRaw('aiFortuneEnabled');
                })(),

                // 其他用户相关数据
                userBehaviorData: window.DataSyncStorage.getRaw('userBehaviorData'),
                smartReminders: window.DataSyncStorage.getRaw('smartReminders'),
                aiScheduleData: window.DataSyncStorage.getRaw('aiScheduleData'),
                aiTaskDecompositionData: window.DataSyncStorage.getRaw('aiTaskDecompositionData'),
                decompositionHistory: window.DataSyncStorage.getRaw('decompositionHistory'),
                reminderSettings: window.DataSyncStorage.getRaw('reminderSettings'),
                scheduleSettings: window.DataSyncStorage.getRaw('scheduleSettings'),
                decompositionSettings: window.DataSyncStorage.getRaw('decompositionSettings'),
                aiHealthData: window.DataSyncStorage.getRaw('aiHealthData'),
                notifiedTasks: window.DataSyncStorage.getRaw('notifiedTasks')
            };

            // 如果当前有登录用户，导出该用户的特定数据
            if (currentUser && currentUser.id) {
                const userId = currentUser.id;
                console.log('🔍 开始导出用户ID为', userId, '的数据...');

                // 导出任务数据 - 尝试多个可能的键名
                const possibleTaskKeys = [
                    `tasks_${userId}`,
                    `tasks_${currentUser.username}`,
                    'tasks'
                ];

                let tasksFound = false;
                for (const tasksKey of possibleTaskKeys) {
                    const tasksData = window.DataSyncStorage.getRaw(tasksKey);
                    if (tasksData) {
                        try {
                            const tasks = JSON.parse(tasksData);
                            if (Array.isArray(tasks) && tasks.length > 0) {
                                data.userTasks = tasks;
                                console.log(`✅ 已导出用户 ${currentUser.username} 的任务数据 (键名: ${tasksKey}):`, tasks.length, '个任务');
                                tasksFound = true;
                                break;
                            }
                        } catch (e) {
                            console.warn(`解析任务数据失败 (键名: ${tasksKey}):`, e);
                        }
                    }
                }

                if (!tasksFound) {
                    console.warn('⚠️ 未找到用户任务数据');
                }

                // 导出头像数据 - 尝试多种匹配方式
                const userAvatarData = window.DataSyncStorage.getRaw('userAvatar');
                if (userAvatarData) {
                    try {
                        const avatarData = JSON.parse(userAvatarData);
                        // 匹配用户ID或用户名
                        if (avatarData.userId === userId ||
                            avatarData.userId === currentUser.username ||
                            avatarData.userId === currentUser.id ||
                            !avatarData.userId) { // 如果没有userId字段，也导出（可能是旧数据）
                            data.userAvatar = avatarData;
                            // 确保包含用户ID信息
                            if (!data.userAvatar.userId) {
                                data.userAvatar.userId = userId;
                            }
                            console.log('✅ 已导出用户头像数据:', data.userAvatar);
                        } else {
                            console.warn('⚠️ 头像数据不属于当前用户，跳过导出');
                        }
                    } catch (e) {
                        console.warn('⚠️ 解析头像数据失败:', e);
                    }
                } else {
                    console.warn('⚠️ 未找到用户头像数据');
                }

                // 导出日历头像
                const calendarAvatar = window.DataSyncStorage.getRaw('calendar-profile-avatar');
                if (calendarAvatar) {
                    data.calendarAvatar = calendarAvatar;
                    console.log('✅ 已导出日历头像');
                } else {
                    console.warn('⚠️ 未找到日历头像数据');
                }

                // 导出用户特定设置
                data.userSettings = {
                    theme: window.DataSyncStorage.getRaw('theme'),
                    language: window.DataSyncStorage.getRaw('language'),
                    sortMode: window.DataSyncStorage.getRaw('sort_mode')
                };
                console.log('✅ 已导出用户设置:', data.userSettings);
            } else {
                // 如果没有登录用户，尝试导出所有任务数据（兼容旧数据）
                console.warn('⚠️ 未登录状态，尝试导出默认任务数据');
                const defaultTasks = window.DataSyncStorage.getRaw('tasks');
                if (defaultTasks) {
                    try {
                        data.userTasks = JSON.parse(defaultTasks);
                        console.log('✅ 已导出默认任务数据:', data.userTasks.length, '个任务');
                    } catch (e) {
                        console.warn('⚠️ 解析默认任务数据失败:', e);
                    }
                }

                // 尝试导出头像（如果没有用户ID限制）
                const userAvatarData = window.DataSyncStorage.getRaw('userAvatar');
                if (userAvatarData) {
                    try {
                        data.userAvatar = JSON.parse(userAvatarData);
                        console.log('✅ 已导出头像数据（未登录状态）');
                    } catch (e) {
                        console.warn('⚠️ 解析头像数据失败:', e);
                    }
                }

                // 导出日历头像
                const calendarAvatar = window.DataSyncStorage.getRaw('calendar-profile-avatar');
                if (calendarAvatar) {
                    data.calendarAvatar = calendarAvatar;
                    console.log('✅ 已导出日历头像（未登录状态）');
                }
            }

            // 验证导出数据
            const exportSummary = {
                users: data.users.length,
                tasks: data.userTasks ? data.userTasks.length : 0,
                hasAvatar: !!data.userAvatar,
                hasCalendarAvatar: !!data.calendarAvatar,
                hasSettings: Object.keys(data.userSettings).length > 0
            };
            console.log('📊 导出数据摘要:', exportSummary);

            // 如果没有任何用户数据，给出警告
            if (exportSummary.tasks === 0 && !exportSummary.hasAvatar && !exportSummary.hasCalendarAvatar) {
                console.warn('⚠️ 警告：导出数据中未包含任何任务或头像数据！');
                console.warn('⚠️ 请确保：1) 已登录账号 2) 有任务或头像数据');
            }

            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            const timestamp = new Date().toISOString().split('T')[0];
            const username = currentUser ? currentUser.username : 'all';
            a.download = `quadrant_time_data_${username}_${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            await new Promise(resolve => setTimeout(resolve, 0)); // 让异步操作有时间完成

            console.log('✅ 数据导出成功！');
            console.log('📦 导出文件包含:', exportSummary);
            return dataStr;
        } catch (error) {
            console.error('❌ 导出数据失败:', error);
            throw error;
        }
    }

    // 导入数据 - 恢复用户所有数据
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                console.log('📥 开始导入数据，版本:', data.version || '1.0');

                // 合并用户数据
                this.mergeData(data);

                // 导入任务数据
                let importedTasksCount = 0;
                let importedUserId = null;
                const importedUserIds = new Set();
                const mergedUsers = window.UserStorage.getUsers();

                const sessionData = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
                let currentUser = null;
                if (sessionData) {
                    try {
                        const session = JSON.parse(sessionData);
                        currentUser = session.user || session;
                        console.log('🔍 当前登录用户:', currentUser ? currentUser.username : '无');
                    } catch (e) {
                        console.error('❌ 解析用户会话失败:', e);
                    }
                }

                const findUserByIdentifier = (identifier) => {
                    if (!identifier) return null;
                    return mergedUsers.find(user =>
                        user.id === identifier ||
                        user.username === identifier ||
                        user.email === identifier
                    ) || null;
                };

                const buildTaskStorageKeys = (identifier, userMeta) => {
                    const keys = new Set();
                    if (identifier && identifier !== '__default__') {
                        keys.add(`tasks_${identifier}`);
                    }
                    if (userMeta) {
                        if (userMeta.id) keys.add(`tasks_${userMeta.id}`);
                        if (userMeta.username) keys.add(`tasks_${userMeta.username}`);
                        if (userMeta.email) keys.add(`tasks_${userMeta.email}`);
                    }
                    if (identifier === '__default__' || (!identifier && !userMeta)) {
                        keys.add('tasks');
                    }
                    return Array.from(keys);
                };

                const saveTasksForUser = (identifier, tasks, sourceKey = '') => {
                    if (!Array.isArray(tasks)) return;
                    const userMeta = findUserByIdentifier(identifier);
                    const storageKeys = buildTaskStorageKeys(identifier, userMeta);
                    const payload = JSON.stringify(tasks);

                    storageKeys.forEach(key => {
                        window.DataSyncStorage.setRaw(key, payload);
                    });

                    importedTasksCount += tasks.length;
                    if (userMeta && userMeta.id) {
                        importedUserIds.add(userMeta.id);
                    } else if (identifier && identifier !== '__default__') {
                        importedUserIds.add(identifier);
                    }

                    console.log(`✅ 已导入任务数据 (键名: ${storageKeys.join(', ')}${sourceKey ? `，来源: ${sourceKey}` : ''}):`, tasks.length, '个任务');

                    storageKeys.forEach(key => {
                        const verify = window.DataSyncStorage.getRaw(key);
                        if (verify) {
                            try {
                                const parsed = JSON.parse(verify);
                                console.log('✅ 验证：任务数据已成功保存，数量:', parsed.length, '（键名:', key, '）');
                            } catch (err) {
                                console.error('❌ 验证时解析任务数据失败 (键名:', key, '):', err);
                            }
                        }
                    });
                };

                if (data.allUserTasks && typeof data.allUserTasks === 'object') {
                    Object.entries(data.allUserTasks).forEach(([key, tasks]) => {
                        if (!Array.isArray(tasks)) return;
                        const identifier = key || '__default__';
                        saveTasksForUser(identifier, tasks, 'allUserTasks');
                    });
                }

                if (importedTasksCount === 0 && data.userTasks && Array.isArray(data.userTasks)) {
                    let userId = null;
                    if (currentUser && currentUser.id) {
                        userId = currentUser.id;
                        console.log('✅ 使用当前登录用户ID:', userId);
                    } else if (data.exportUser && data.exportUser.id) {
                        userId = data.exportUser.id;
                        console.log('✅ 使用导出时的用户ID:', userId, '用户名:', data.exportUser.username);
                    }

                    if (userId) {
                        saveTasksForUser(userId, data.userTasks, 'legacy');
                        importedUserId = userId;

                        if (data.exportUser) {
                            const userInfoKey = `imported_user_${userId}`;
                            window.DataSyncStorage.setRaw(userInfoKey, JSON.stringify({
                                userId: userId,
                                username: data.exportUser.username,
                                email: data.exportUser.email,
                                importedAt: new Date().toISOString()
                            }));
                            console.log('✅ 已保存导入用户信息到:', userInfoKey);
                        }
                    } else {
                        saveTasksForUser('__default__', data.userTasks, 'legacy');
                        console.log('💡 提示：请在登录后重新导入数据，或使用导出时的账号登录');
                    }
                }

                if (!importedUserId) {
                    if (currentUser && currentUser.id && importedUserIds.has(currentUser.id)) {
                        importedUserId = currentUser.id;
                    } else if (data.exportUser && data.exportUser.id && importedUserIds.has(data.exportUser.id)) {
                        importedUserId = data.exportUser.id;
                    } else if (importedUserIds.size > 0) {
                        importedUserId = Array.from(importedUserIds)[0];
                    }
                }

                if (importedTasksCount === 0) {
                    console.warn('⚠️ 导入数据中未包含任务数据或格式不正确');
                }

                // 导入头像数据
                let importedAvatar = false;
                if (data.userAvatar) {
                    try {
                        // 更新用户ID（如果当前有登录用户）
                        const sessionData = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
                        if (sessionData) {
                            try {
                                const session = JSON.parse(sessionData);
                                const currentUser = session.user || session;
                                if (currentUser && currentUser.id) {
                                    data.userAvatar.userId = currentUser.id;
                                    console.log('✅ 已更新头像用户ID为:', currentUser.id);
                                }
                            } catch (e) {
                                console.warn('⚠️ 更新头像用户ID失败:', e);
                            }
                        } else if (importedUserId) {
                            // 如果没有登录用户，使用导入任务时的用户ID
                            data.userAvatar.userId = importedUserId;
                            console.log('✅ 已设置头像用户ID为:', importedUserId);
                        }

                        window.DataSyncStorage.setRaw('userAvatar', JSON.stringify(data.userAvatar));
                        importedAvatar = true;
                        console.log('✅ 已导入用户头像数据:', data.userAvatar);

                        // 验证头像数据是否成功保存
                        const verifyAvatar = window.DataSyncStorage.getRaw('userAvatar');
                        if (verifyAvatar) {
                            console.log('✅ 验证：头像数据已成功保存');
                        } else {
                            console.error('❌ 验证失败：头像数据未成功保存！');
                        }
                    } catch (e) {
                        console.error('❌ 导入头像数据失败:', e);
                    }
                } else {
                    console.warn('⚠️ 导入数据中未包含用户头像数据');
                }

                // 导入日历头像
                let importedCalendarAvatar = false;
                if (data.calendarAvatar) {
                    window.DataSyncStorage.setRaw('calendar-profile-avatar', data.calendarAvatar);
                    importedCalendarAvatar = true;
                    console.log('✅ 已导入日历头像');

                    // 验证日历头像是否成功保存
                    const verifyCalendarAvatar = window.DataSyncStorage.getRaw('calendar-profile-avatar');
                    if (verifyCalendarAvatar) {
                        console.log('✅ 验证：日历头像已成功保存');
                    } else {
                        console.error('❌ 验证失败：日历头像未成功保存！');
                    }
                } else {
                    console.warn('⚠️ 导入数据中未包含日历头像数据');
                }

                // 导入用户设置
                if (data.userSettings) {
                    if (data.userSettings.theme) {
                        window.DataSyncStorage.setRaw('theme', data.userSettings.theme);
                    }
                    if (data.userSettings.language) {
                        window.DataSyncStorage.setRaw('language', data.userSettings.language);
                    }
                    if (data.userSettings.sortMode) {
                        window.DataSyncStorage.setRaw('sort_mode', data.userSettings.sortMode);
                    }
                    console.log('✅ 已导入用户设置');
                }

                // 导入其他用户相关数据
                const dataKeys = [
                    'userBehaviorData',
                    'smartReminders',
                    'aiScheduleData',
                    'aiTaskDecompositionData',
                    'decompositionHistory',
                    'reminderSettings',
                    'scheduleSettings',
                    'decompositionSettings',
                    'aiHealthData',
                    'notifiedTasks'
                ];

                dataKeys.forEach(key => {
                    if (data[key]) {
                        window.DataSyncStorage.setRaw(key, data[key]);
                        console.log(`✅ 已导入 ${key}`);
                    }
                });

                // 导入AI配置（使用加密存储）
                if (data.aiConfig) {
                    (async () => {
                        try {
                            let aiConfig;
                            if (data.version === '2.0' && typeof data.aiConfig === 'string') {
                                // 新版本可能是JSON字符串
                                try {
                                    aiConfig = JSON.parse(data.aiConfig);
                                } catch (e) {
                                    aiConfig = data.aiConfig;
                                }
                            } else {
                                aiConfig = data.aiConfig;
                            }

                            // 如果是字符串，尝试解析为对象
                            if (typeof aiConfig === 'string') {
                                try {
                                    aiConfig = JSON.parse(aiConfig);
                                } catch (e) {
                                    console.warn('AI配置解析失败，保留原样');
                                }
                            }

                            // 保存到加密存储
                            if (window.secureStorage) {
                                await window.secureStorage.ready();
                                await window.secureStorage.setSecure('aiConfig', aiConfig);
                                console.log('✅ 已导入AI配置到加密存储');
                            } else {
                                // 降级：保存到 localStorage
                                window.DataSyncStorage.setRaw('aiConfig', typeof aiConfig === 'object' ? JSON.stringify(aiConfig) : aiConfig);
                                console.log('✅ 已导入AI配置到localStorage（降级方案）');
                            }
                        } catch (error) {
                            console.error('❌ 导入AI配置失败:', error);
                        }
                    })();
                }

                // 生成导入摘要
                const importSummary = {
                    tasks: importedTasksCount,
                    avatar: importedAvatar,
                    calendarAvatar: importedCalendarAvatar,
                    userId: importedUserId || (data.exportUser ? data.exportUser.id : null),
                    username: data.exportUser ? data.exportUser.username : null
                };

                console.log('📊 导入数据摘要:', importSummary);
                console.log('📋 导入的任务存储键名:', importedUserId ? `tasks_${importedUserId}` : 'tasks (默认)');
                console.log('📋 导入的用户ID:', importedUserId || '无');
                console.log('📋 导出时的用户名:', data.exportUser ? data.exportUser.username : '未知');

                // 如果导入了数据但没有登录，给出提示
                if (importSummary.tasks > 0 && !currentUser) {
                    console.log('💡 重要提示：已导入数据，但当前未登录');
                    console.log('💡 请使用导出时的账号登录查看数据');
                    if (importSummary.username) {
                        console.log(`💡 导出时的用户名: ${importSummary.username}`);
                    }
                }

                // 检查是否在主应用页面
                const isMainApp = window.location.pathname.includes('index.html') ||
                    window.location.pathname === '/' ||
                    window.location.pathname.endsWith('/');

                console.log('📍 当前页面路径:', window.location.pathname, '是否主应用:', isMainApp);

                // 构建导入成功消息
                let successMessage = '数据导入成功！';
                const details = [];
                if (importSummary.tasks > 0) {
                    details.push(`${importSummary.tasks} 个任务`);
                }
                if (importSummary.avatar) {
                    details.push('用户头像');
                }
                if (importSummary.calendarAvatar) {
                    details.push('日历头像');
                }
                if (details.length > 0) {
                    successMessage += ' 已导入：' + details.join('、');
                } else {
                    successMessage += ' 但未找到可导入的数据，请检查导出文件是否包含任务或头像数据。';
                }

                if (isMainApp) {
                    // 在主应用页面，触发数据重新加载
                    console.log('🔄 在主应用页面，触发数据重新加载...');

                    // 触发自定义事件，通知主应用重新加载数据
                    const reloadEvent = new CustomEvent('dataImported', {
                        detail: {
                            userId: importSummary.userId,
                            tasksCount: importSummary.tasks,
                            hasAvatar: importSummary.avatar,
                            hasCalendarAvatar: importSummary.calendarAvatar
                        }
                    });
                    window.dispatchEvent(reloadEvent);
                    console.log('📢 已触发 dataImported 事件');

                    // 延迟执行，确保事件被监听
                    setTimeout(() => {
                        // 如果页面有render函数，调用它
                        if (typeof window.render === 'function') {
                            console.log('📊 调用render函数刷新页面...');
                            window.render();
                        }

                        // 如果页面有loadTasks函数，调用它
                        if (typeof window.loadTasks === 'function') {
                            console.log('📋 调用loadTasks函数加载任务...');
                            window.loadTasks();
                        }

                        // 如果页面有loadTasksFromStorage函数，调用它
                        if (typeof window.loadTasksFromStorage === 'function') {
                            console.log('💾 调用loadTasksFromStorage函数...');
                            window.loadTasksFromStorage();
                            if (typeof window.render === 'function') {
                                window.render();
                            }
                        }

                        // 如果页面有initializeUserAvatar函数，调用它
                        if (typeof window.initializeUserAvatar === 'function') {
                            console.log('🖼️ 调用initializeUserAvatar函数刷新头像...');
                            window.initializeUserAvatar();
                        }

                        // 触发页面重新渲染
                        if (typeof window.checkLoginStatus === 'function') {
                            console.log('🔐 重新检查登录状态...');
                            window.checkLoginStatus();
                        }
                    }, 500);

                    showNotification(successMessage, 'success');
                } else {
                    // 在登录页面或其他页面，提示刷新
                    showNotification(successMessage + ' 请登录后查看', 'success');
                    console.log('✅ 数据导入完成');

                    // 如果导入时有用户信息，提示用户
                    if (importSummary.username) {
                        console.log(`💡 提示：导入的数据属于用户 "${importSummary.username}"，请使用该账号登录查看数据`);
                    }

                    // 提示用户刷新页面
                    setTimeout(() => {
                        if (confirm(successMessage + '\n\n是否立即刷新页面以查看导入的数据？')) {
                            window.location.reload();
                        }
                    }, 1000);
                }

                console.log('✅ 数据导入完成，已触发数据重新加载');

                console.log('✅ 数据导入完成，已触发数据重新加载');
            } catch (error) {
                showNotification('数据格式错误，导入失败', 'error');
                console.error('❌ 导入数据失败:', error);
            }
        };
        reader.readAsText(file);
    }

    // 同步到其他浏览器
    syncToOtherBrowsers() {
        const data = {
            users: window.UserStorage.getUsers(),
            adminPassword: window.AdminStorage.getRaw('adminPassword'),
            aiConfig: window.DataSyncStorage.getRaw('aiFortuneEnabled'),
            syncTime: new Date().toISOString()
        };

        window.DataSyncStorage.setRaw(this.syncKey, JSON.stringify(data));
        console.log('数据已同步到其他浏览器');
    }
}

// 创建全局同步实例
const crossBrowserSync = new CrossBrowserSync();

// 导出用户数据
async function exportUserData() {
    console.log('🚀 exportUserData 函数被调用');
    try {
        console.log('📤 开始调用 crossBrowserSync.exportData()...');
        const result = await crossBrowserSync.exportData();
        console.log('✅ exportData 执行完成，返回结果:', result ? '成功' : '失败');
        showNotification('数据导出成功！请保存文件并在其他浏览器中导入', 'success');
    } catch (error) {
        console.error('❌ 导出数据失败:', error);
        console.error('❌ 错误堆栈:', error.stack);
        showNotification('导出数据失败: ' + error.message, 'error');
    }
}

// 将导出函数暴露到全局，方便HTML调用
window.exportUserData = exportUserData;

// 导入用户数据
function importUserData(input) {
    console.log('🚀 importUserData 函数被调用');
    const file = input.files ? input.files[0] : input;
    if (file) {
        console.log('📁 选择的文件:', file.name, '大小:', file.size, '字节');
        crossBrowserSync.importData(file);
    } else {
        console.error('❌ 未选择文件');
        showNotification('请选择要导入的文件', 'error');
    }
}

// 将导入函数暴露到全局，方便HTML调用
window.importUserData = importUserData;

// 自动同步数据
function autoSyncData() {
    try {
        crossBrowserSync.syncToOtherBrowsers();
        showNotification('数据已同步到其他浏览器，请在其他浏览器中刷新页面', 'success');
    } catch (error) {
        console.error('自动同步失败:', error);
        showNotification('自动同步失败', 'error');
    }
}

// 显示数据同步模态框
function showDataSyncModal() {
    const modal = document.getElementById('data-sync-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// 关闭数据同步模态框
function closeDataSyncModal() {
    const modal = document.getElementById('data-sync-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// 数据备份和恢复机制
function backupUserData() {
    try {
        const users = window.DataSyncStorage.getRaw('users');
        const adminPassword = window.AdminStorage.getRaw('adminPassword');
        const aiConfig = window.DataSyncStorage.getRaw('aiFortuneEnabled');
        const deepSeekApiKey = window.DataSyncStorage.getRaw('deepSeekApiKey');

        const backupData = {
            users: users,
            adminPassword: adminPassword,
            aiConfig: aiConfig,
            deepSeekApiKey: deepSeekApiKey,
            backupTime: new Date().toISOString()
        };

        // 将备份数据存储到sessionStorage（页面刷新时不会丢失）
        window.DataSyncStorage.setSessionRaw('dataBackup', JSON.stringify(backupData));
        console.log('用户数据已备份');
    } catch (error) {
        console.error('数据备份失败:', error);
    }
}

function restoreUserData() {
    try {
        const backupData = window.DataSyncStorage.getSessionRaw('dataBackup');
        if (backupData) {
            const backup = JSON.parse(backupData);

            // 检查localStorage是否为空
            const hasUsers = window.DataSyncStorage.getRaw('users');
            const hasAdminPassword = window.AdminStorage.getRaw('adminPassword');

            if (!hasUsers && !hasAdminPassword) {
                console.log('检测到数据丢失，尝试恢复备份数据...');

                if (backup.users) {
                    window.UserStorage.setUsers(JSON.parse(backup.users || '[]'));
                    console.log('已恢复用户数据');
                }
                if (backup.adminPassword) {
                    window.AdminStorage.setAdminPassword(backup.adminPassword);
                    console.log('已恢复管理员密码');
                }
                if (backup.aiConfig) {
                    window.DataSyncStorage.setRaw('aiFortuneEnabled', backup.aiConfig);
                    console.log('已恢复AI配置');
                }
                if (backup.deepSeekApiKey) {
                    window.DataSyncStorage.setRaw('deepSeekApiKey', backup.deepSeekApiKey);
                    console.log('已恢复API Key');
                }

                showNotification('数据已自动恢复，请重新登录', 'success');
            }
        }
    } catch (error) {
        console.error('数据恢复失败:', error);
    }
}

// 清理URL中的敏感参数
function cleanURL() {
    if (window.location.search.includes('username') || window.location.search.includes('password')) {
        console.log('检测到URL中包含敏感参数，正在清理...');
        // 清理URL参数
        const cleanURL = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanURL);
        console.log('URL已清理:', cleanURL);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    // 首先清理URL中的敏感参数
    cleanURL();

    // 先尝试恢复数据，再初始化默认数据
    restoreUserData();
    initializeDefaultData();

    // 确保初始状态正确
    initializeLoginPage();

    // 先恢复保存的用户凭据，再检查登录状态
    initLoginPage();
    checkLoginStatus();
    createAdminSystem();
    bindFormEvents();
    bindForgotPasswordActions();

    // 初始化管理员登录部分
    initAdminForm();

    // 确保管理员标签页可见
    const adminTab = document.querySelector('[data-tab="admin"]');
    if (adminTab) {
        adminTab.style.display = 'block';
        adminTab.style.visibility = 'visible';
    }

    // 确保默认只显示账号登录表单，隐藏管理员和注册表单
    setLoginView('account');

    console.log('登录页面初始化完成');
});

function bindForgotPasswordActions() {
    const closeBtn = document.getElementById('forgot-password-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeForgotPasswordPage);
    }

    const cancelBtn = document.getElementById('forgot-password-cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeForgotPasswordPage);
    }

    const resetBtn = document.getElementById('forgot-password-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetPassword);
    }
}

// 初始化登录页面状态
function initializeLoginPage() {
    console.log('初始化登录页面状态');

    // 确保账号登录标签页是活动的
    const accountTab = document.querySelector('[data-tab="account"]');
    const adminTab = document.querySelector('[data-tab="admin"]');
    const accountForm = document.getElementById('account-form');
    const adminForm = document.getElementById('admin-form');
    const registerForm = document.getElementById('register-form');

    if (accountTab && adminTab && accountForm && adminForm && registerForm) {
        setLoginView('account');

        console.log('登录页面状态初始化完成');
    } else {
        console.error('未找到必要的元素:', {
            accountTab: !!accountTab,
            adminTab: !!adminTab,
            accountForm: !!accountForm,
            adminForm: !!adminForm
        });
    }
}

// 恢复保存的用户凭据
async function restoreSavedCredentials() {
    debugLog('尝试恢复保存的用户凭据');

    try {
        let credentials = null;

        // 1. 先尝试从安全存储读取
        if (window.secureGetCredentials && typeof window.secureGetCredentials === 'function') {
            debugLog('从安全存储读取凭据...');
            credentials = await window.secureGetCredentials();
            debugLog('安全存储凭据:', credentials ? '找到' : '未找到');
        }

        // 2. 如果安全存储没有，尝试从明文localStorage读取（兼容旧数据）
        if (!credentials) {
            const savedCredentials = window.DataSyncStorage.getRaw('savedCredentials');
            debugLog('从localStorage获取的凭据:', savedCredentials ? '找到' : '未找到');

            if (savedCredentials) {
                try {
                    credentials = JSON.parse(savedCredentials);
                    debugLog('解析后的凭据:', credentials);
                } catch (e) {
                    console.error('解析凭据失败:', e);
                }
            }
        }

        // 3. 恢复凭据到表单
        if (credentials) {
            // 恢复用户名
            const usernameInput = document.getElementById('username');
            if (usernameInput && credentials.username) {
                usernameInput.value = credentials.username;
                debugLog('✅ 已恢复用户名:', credentials.username);
            } else {
                debugLog('⚠️ 用户名输入框未找到或凭据中无用户名');
            }

            // 恢复密码
            const passwordInput = document.getElementById('password');
            if (passwordInput && credentials.password) {
                passwordInput.value = credentials.password;
                debugLog('✅ 已恢复密码');
            } else {
                debugLog('⚠️ 密码输入框未找到或凭据中无密码');
            }

            // 恢复记住我状态
            const rememberMeCheckbox = document.getElementById('remember-me');
            if (rememberMeCheckbox) {
                rememberMeCheckbox.checked = true;
                debugLog('✅ 已恢复记住我状态');
            } else {
                debugLog('⚠️ 记住我复选框未找到');
            }

            debugLog('✅ 用户凭据恢复完成');
        } else {
            debugLog('ℹ️ 未找到保存的用户凭据');
        }
    } catch (error) {
        console.error('❌ 恢复用户凭据时发生错误:', error);
    }
}

// 检查登录状态（仅用于信息显示，不自动跳转）
function checkLoginStatus() {
    // 检查旧的userSession格式
    let sessionData = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');

    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            const loginTime = new Date(session.loginTime);
            const now = new Date();
            const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);

            // 如果登录时间超过30天，需要重新登录
            if (daysDiff < 30) {
                currentUser = session.user;
                console.log('✅ 检测到用户已登录 (userSession):', currentUser.username);

                // 在登录页面不自动跳转，让用户主动选择
                // 如果用户想跳转，可以点击导航或手动访问其他页面
                return true;
            } else {
                console.log('⚠️ 登录会话已过期');
                // 清除过期会话
                window.SessionStorage.clearSessions(['userSession']);
                return false;
            }
        } catch (error) {
            console.error('❌ 解析登录会话失败:', error);
            // 清除无效会话
            window.SessionStorage.clearSessions(['userSession']);
            return false;
        }
    }

    // 检查新的JWT app_session格式
    const appSession = (window.SessionStorage.getSession('app_session') ? JSON.stringify(window.SessionStorage.getSession('app_session')) : '');
    if (appSession) {
        try {
            const session = JSON.parse(appSession);

            // 检查JWT是否过期
            if (session.expiresAt && session.expiresAt > Date.now()) {
                // 从JWT中提取用户信息（如果没有，使用备用方式）
                if (session.accessToken) {
                    try {
                        // 简单解析JWT（无需验证，因为已经检查过期时间）
                        const payload = JSON.parse(atob(session.accessToken.split('.')[1]));

                        currentUser = {
                            id: payload.userId || payload.sub,
                            username: payload.username,
                            email: payload.email || '',
                            role: payload.role,
                            permissions: payload.permissions || []
                        };

                        console.log('✅ 检测到用户已登录 (app_session/JWT):', currentUser.username);
                        return true;
                    } catch (jwtError) {
                        console.error('❌ 解析JWT失败:', jwtError);
                        // 清除无效的JWT会话
                        window.SessionStorage.clearSessions(['app_session']);
                        return false;
                    }
                } else {
                    console.log('⚠️ app_session没有accessToken');
                    return false;
                }
            } else {
                console.log('⚠️ JWT会话已过期');
                // 清除过期会话
                window.SessionStorage.clearSessions(['app_session']);
                return false;
            }
        } catch (error) {
            console.error('❌ 解析app_session失败:', error);
            // 清除无效会话
            window.SessionStorage.clearSessions(['app_session']);
            return false;
        }
    }

    console.log('ℹ️ 未找到登录会话（既没有userSession也没有app_session）');
    return false;
}

// 管理员登录处理
async function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('admin-username').value.trim() || document.getElementById('admin-username-2').value.trim();
    const adminCredential = document.getElementById('admin-password').value || document.getElementById('admin-password-2').value;

    console.log('管理员登录尝试:', username);

    // 验证输入
    if (!username || !adminCredential) {
        showError('admin-username-error', '请输入管理员账号和密码');
        return;
    }

    // 检查管理员凭据 - 支持哈希密码验证
    const storedAdminCredential = window.AdminStorage.getRaw('adminPassword');
    let isValid = false;

    if (storedAdminCredential) {
        if (storedAdminCredential.includes(':')) {
            // 哈希格式，使用Security模块的verifyPassword方法
            console.log('检测到哈希密码，使用Security模块验证');
            if (window.Security && window.Security.Password && window.Security.Password.verifyPassword) {
                isValid = await window.Security.Password.verifyPassword(adminCredential, storedAdminCredential);
                console.log('哈希验证结果:', isValid ? '✅ 成功' : '❌ 失败');
            } else {
                console.error('❌ Security模块不可用，无法验证哈希密码');
                // 回退到明文比较（虽然会失败）
                isValid = (username === 'admin' && adminCredential === storedAdminCredential);
            }
        } else {
            // 明文格式
            console.log('检测到明文密码');
            isValid = (username === 'admin' && adminCredential === storedAdminCredential);
        }
    } else {
        // 没有设置密码，使用默认密码
        console.log('使用默认密码');
        // Open-source/self-hosted first run: initialize the local admin password.
        if (username === 'admin' && adminCredential.length >= 8) {
            window.AdminStorage.setAdminPassword(adminCredential);
            isValid = true;
            console.log('Admin password initialized for this browser deployment.');
            showNotification('Admin password initialized. Please keep it safe.', 'success');
        } else {
            showError('admin-password-error', 'First admin password must be at least 8 characters.');
            return;
        }
    }

    if (isValid) {
        console.log('管理员登录成功');

        // 创建管理员用户对象
        const adminUser = {
            id: 'admin',
            username: 'admin',
            role: 'admin',
            permissions: ['add-task', 'quadrant-view', 'fortune', 'pomodoro', 'backup', 'dashboard', 'ai-fortune', 'ai-dashboard', 'review', 'templates'],
            loginTime: new Date().toISOString()
        };

        // 保存管理员会话
        saveUserSession(adminUser, true);
        showNotification('管理员登录成功！', 'success');

        // 管理员登录成功后备份数据
        backupUserData();

        console.log('管理员登录成功，准备跳转到管理员后台');

        // 跳转到独立的管理员后台页面
        console.log('跳转到独立的管理员后台页面');
        window.location.href = 'admin.html';
    } else {
        console.log('管理员登录失败: 账号或密码错误');
        showError('admin-username-error', '管理员账号或密码错误');
        // 保持在当前管理员登录页面，不进行表单切换
        // 只显示错误提示，让用户重新输入
    }
}

// 创建用户处理
async function handleCreateUser(e) {
    e.preventDefault();
    const username = document.getElementById('new-username').value;
    const initialCredential = document.getElementById('new-password').value;
    const email = document.getElementById('new-email').value;
    const role = document.getElementById('user-role').value;

    // 获取选中的权限
    const permissionCheckboxes = document.querySelectorAll('input[name="permissions"]:checked');
    const permissions = Array.from(permissionCheckboxes).map(cb => cb.value);

    // 创建用户（密码使用哈希存储）
    const passwordHash = (window.Security && window.Security.Password && window.Security.Password.hashPassword)
        ? await window.Security.Password.hashPassword(initialCredential)
        : initialCredential;
    const newUser = {
        id: 'user_' + Date.now(),
        username: username,
        password: passwordHash,
        email: email,
        role: role,
        permissions: permissions, // 保存权限信息
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
        passwordMigrated: (passwordHash !== initialCredential)
    };

    // 保存到本地存储
    const users = window.UserStorage.getUsers();
    users.push(newUser);
    window.UserStorage.setUsers(users);

    // 创建用户后备份数据
    backupUserData();

    showNotification(`用户 ${username} 创建成功，权限：${permissions.map(p => MENU_PERMISSIONS[p]).join('、')}`, 'success');
    showUserManagement();
}

// 管理员系统实现
function createAdminSystem() {
    // 创建管理员登录页面
    const adminLoginHTML = `
        <div class="admin-login-container" style="display: none;">
            <div class="admin-login-card">
                <h2>🔐 管理员登录</h2>
                <form id="admin-login-form">
                    <div class="form-group">
                        <label for="admin-login-username">管理员账号</label>
                        <input type="text" id="admin-login-username" name="admin-login-username" placeholder="请输入管理员账号" autocomplete="off" required>
                    </div>
                    <div class="form-group">
                        <label for="admin-login-password">管理员密码</label>
                        <input type="password" id="admin-login-password" name="admin-login-password" placeholder="请输入管理员密码" autocomplete="off" required>
                    </div>
                    <button type="submit" class="login-btn">登录管理后台</button>
                </form>
                <div class="admin-actions">
                    <button data-admin-action="closeAdminLogin" class="btn-secondary">🔙 返回登录页</button>
                </div>
            </div>
        </div>
    `;

    // 创建用户管理页面
    const userManagementHTML = `
        <div class="user-management-container" style="display: none;">
            <div class="user-management-card">
                <h2>👥 用户管理</h2>
                <div class="user-stats">
                    <div class="stat-item">
                        <span class="stat-number" id="total-users">0</span>
                        <span class="stat-label">总用户数</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="vip-users">0</span>
                        <span class="stat-label">VIP用户</span>
                    </div>
                </div>
                <div class="user-list" id="user-list">
                    <!-- 用户列表将在这里显示 -->
                </div>
                <div class="admin-actions">
                    <button data-admin-action="showCreateUser" class="btn-primary">➕ 创建新用户</button>
                    <button data-admin-action="showAIKeyConfig" class="btn-info">🤖 AI签语配置</button>
                    <button data-admin-action="showChangeAdminPassword" class="btn-warning">🔐 修改管理员密码</button>
                    <button data-admin-action="returnToLoginPage" class="btn-secondary">🔙 返回登录页</button>
                </div>
            </div>
        </div>
    `;

    // 创建管理员密码修改页面
    const changeAdminPasswordHTML = `
        <div class="change-admin-password-container" style="display: none;">
            <div class="change-admin-password-card">
                <h2>🔐 修改管理员密码</h2>
                <div class="security-notice">
                    <div class="notice-icon">⚠️</div>
                    <div class="notice-content">
                        <h3>安全提醒</h3>
                        <p>为了系统安全，建议定期修改管理员密码。新密码应包含字母、数字和特殊字符，长度不少于8位。</p>
                    </div>
                </div>
                <form id="change-admin-password-form">
                    <!-- 为密码管理器添加隐藏的用户名字段（可访问性优化） -->
                    <input type="text" name="username" value="admin" autocomplete="username" style="display: none;" aria-hidden="true">
                    <div class="form-group">
                        <label for="current-admin-password">当前密码</label>
                        <input type="password" id="current-admin-password" placeholder="请输入当前管理员密码" autocomplete="current-password" required>
                        <div class="error-message" id="current-admin-password-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="new-admin-password">新密码</label>
                        <input type="password" id="new-admin-password" placeholder="请输入新密码（至少8位）" autocomplete="new-password" required>
                        <div class="password-strength" id="password-strength"></div>
                        <div class="error-message" id="new-admin-password-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="confirm-admin-password">确认新密码</label>
                        <input type="password" id="confirm-admin-password" placeholder="请再次输入新密码" autocomplete="new-password" required>
                        <div class="error-message" id="confirm-admin-password-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="command-password">指令密码（安全验证）</label>
                        <input type="password" id="command-password" placeholder="请输入指令密码以确认修改" autocomplete="off" required>
                        <div class="error-message" id="command-password-error"></div>
                    </div>
                </form>
                <div class="admin-actions">
                    <button data-admin-action="changeAdminPassword" class="btn-primary">✅ 确认修改</button>
                    <button data-admin-action="showUserManagement" class="btn-secondary">🔙 返回用户管理</button>
                </div>
            </div>
        </div>
    `;

    // 创建用户创建页面
    const createUserHTML = `
        <div class="create-user-container" style="display: none;">
            <div class="create-user-card">
                <h2>➕ 创建用户账号</h2>
                <form id="create-user-form">
                    <div class="form-group">
                        <label for="new-username">用户名</label>
                        <input type="text" id="new-username" name="new-username" placeholder="请输入用户名" autocomplete="username" required>
                    </div>
                    <div class="form-group">
                        <label for="new-password">密码</label>
                        <input type="password" id="new-password" name="new-password" placeholder="请输入密码" autocomplete="new-password" required>
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">确认密码</label>
                        <input type="password" id="confirm-password" name="confirm-password" placeholder="请再次输入密码" autocomplete="new-password" required>
                    </div>
                    <div class="form-group">
                        <label for="user-role">用户角色</label>
                        <select id="user-role" name="user-role">
                            <option value="user">普通用户</option>
                            <option value="vip">VIP用户</option>
                        </select>
                    </div>
                </form>
                <div class="admin-actions">
                    <button data-admin-action="handleCreateUser" class="btn-primary">✅ 创建用户</button>
                    <button data-admin-action="showUserManagement" class="btn-secondary">🔙 返回用户管理</button>
                </div>
            </div>
        </div>
    `;

    // 创建AI签语配置页面
    const aiKeyConfigHTML = `
        <div class="ai-key-config-container" style="display: none;">
            <div class="ai-key-config-card">
                <h2>🤖 AI签语配置</h2>
                <form id="ai-key-config-form">
                    <div class="form-group">
                        <label for="ai-key">AI服务密钥</label>
                        <input type="password" id="ai-key" name="ai-key" placeholder="请输入AI服务密钥" autocomplete="off">
                        <div class="form-help">用于AI智能分析和签语生成功能</div>
                    </div>
                </form>
                <div class="admin-actions">
                    <button data-admin-action="saveAIConfig" class="btn-primary">💾 保存配置</button>
                    <button data-admin-action="showUserManagement" class="btn-secondary">🔙 返回用户管理</button>
                </div>
            </div>
        </div>
    `;

    // 创建管理员联系方式页面
    // 将HTML添加到页面
    appendLoginMarkup(document.body, adminLoginHTML);
    appendLoginMarkup(document.body, userManagementHTML);
    appendLoginMarkup(document.body, createUserHTML);
    appendLoginMarkup(document.body, changeAdminPasswordHTML);
    appendLoginMarkup(document.body, aiKeyConfigHTML);

    
    



    // 绑定管理员登录事件
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    document.getElementById('create-user-form').addEventListener('submit', handleCreateUser);
document.getElementById('ai-key-config-form').addEventListener('submit', function (e) {
    e.preventDefault();
    saveAIConfig();
});

if (!window.__adminActionDelegationBound) {
    window.__adminActionDelegationBound = true;
    document.addEventListener('click', function (e) {
        const button = e.target.closest('[data-admin-action]');
        if (!button) return;

        e.preventDefault();
        const action = button.dataset.adminAction;
        const actions = {
            closeAdminLogin,
            showCreateUser,
            showAIKeyConfig,
            showChangeAdminPassword,
            returnToLoginPage,
            changeAdminPassword,
            showUserManagement,
            handleCreateUser,
            saveAIConfig,
            closeAdminContact,
            testAIKey,
            closeEditDialog
        };

        if (action === 'editUser') {
            editUser(button.dataset.userId);
            return;
        }

        if (action === 'deleteUser') {
            deleteUser(button.dataset.userId);
            return;
        }

        actions[action]?.(e);
    });
}
}

// 初始化登录页面
async function initLoginPage() {
    // 绑定其他事件
    bindOtherEvents();

    // 恢复保存的用户凭据
    await restoreSavedCredentials();
}

// 绑定其他事件
function bindOtherEvents() {
    // 显示本地注册表单
    const showRegisterBtn = document.getElementById('show-register');
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showRegisterForm();
        });
    }

    // 显示开源版使用说明（从管理员表单）
    const showAdminContactFromAdminBtn = document.getElementById('show-admin-contact-from-admin');
    if (showAdminContactFromAdminBtn) {
        showAdminContactFromAdminBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showAdminContact();
        });
    }

    const closeAdminContactBtn = document.getElementById('close-admin-contact-btn');
    if (closeAdminContactBtn) {
        closeAdminContactBtn.addEventListener('click', function (e) {
            e.preventDefault();
            closeAdminContact();
        });
    }

    // 显示登录表单
    const showLoginBtn = document.getElementById('show-login');
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showLoginForm();
        });
    }
}

// 显示注册表单
function showRegisterForm() {
    setLoginView('register');
}

// 显示登录表单
function showLoginForm() {
    setLoginView('account');
}

// 初始化管理员登录表单
function initAdminForm() {
    const adminForm = document.getElementById('admin-form');
    const adminTab = document.querySelector('[data-tab="admin"]');

    if (adminForm) {
        adminForm.style.display = 'none'; // 默认隐藏管理员表单
        adminForm.classList.remove('active');
    }

    if (adminTab) {
        adminTab.style.display = 'block';
        adminTab.style.visibility = 'visible';
    }
}

// 隐藏管理员登录表单
function hideAdminForm() {
    const adminForm = document.getElementById('admin-form');
    const adminTab = document.querySelector('[data-tab="admin"]');

    if (adminForm) {
        adminForm.classList.remove('active');
        adminForm.style.display = 'none'; // 强制隐藏
        // 完全移除管理员表单内容
        adminForm.replaceChildren();
    }
    if (adminTab) {
        adminTab.classList.remove('active');
        adminTab.style.display = 'none'; // 强制隐藏管理员标签页
    }
}

// 显示管理员登录表单（仅在需要时调用）
function showAdminForm() {
    const adminForm = document.getElementById('admin-form');
    const adminTab = document.querySelector('[data-tab="admin"]');

    if (adminForm) {
        // 重新创建管理员表单内容
        renderLoginMarkup(adminForm, `
            <div class="form-group">
                <label for="admin-username">管理员账号</label>
                <input type="text" id="admin-username-2" name="admin-username" placeholder="请输入管理员账号" autocomplete="off" required>
                <div class="error-message" id="admin-username-error-2"></div>
            </div>

            <div class="form-group">
                <label for="admin-password">管理员密码</label>
                <input type="password" id="admin-password-2" name="admin-password" placeholder="请输入管理员密码" autocomplete="off" required>
                <div class="error-message" id="admin-password-error-2"></div>
            </div>

            <button type="submit" class="login-btn" id="admin-login-btn-2">
                <span class="btn-text">管理员后台登录</span>
            </button>

            <div class="login-footer">
                <a href="#" id="show-admin-contact-from-admin">查看开源版使用说明</a>
            </div>
        `);
        adminForm.style.display = 'block';

        // 重新绑定事件
        adminForm.addEventListener('submit', handleAdminLogin);
    }
    if (adminTab) {
        adminTab.style.display = 'block';
    }
    setLoginView('admin');
}

// 处理账号登录
async function handleAccountLogin(e) {
    e.preventDefault();

    console.log('处理账号登录请求');

    // 获取表单数据
    const formData = new FormData(e.target);
    const username = formData.get('username') || document.getElementById('username').value.trim();
    const authCredential = formData.get('password') || document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;

            console.log('Login submitted.', { username, credentialProvided: Boolean(authCredential), rememberMe });

    // 验证输入
    if (!validateAccountInput(username, authCredential)) {
        return;
    }

    showLoading(true);

    try {
        // 模拟登录请求
        const user = await simulateLogin(username, authCredential);

        if (user) {
            // 登录成功
            console.log('✅ 登录验证成功，用户信息:', user);
            currentUser = user;

            // 保存用户会话（确保数据格式正确）
            const sessionSaved = saveUserSession(user, rememberMe);

            if (!sessionSaved) {
                console.error('❌ 会话数据保存失败！');
                showLoading(false);
                showNotification('登录失败：会话保存失败', 'error');
                return;
            }

            // 验证会话数据是否已保存
            const savedSession = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
            if (!savedSession) {
                console.error('❌ 会话数据验证失败！');
                showLoading(false);
                showNotification('登录失败：会话验证失败', 'error');
                return;
            }

            console.log('✅ 会话数据已保存并验证:', savedSession);

            // 如果选择了记住我，保存用户凭据
            if (rememberMe) {
                saveUserCredentials(username, authCredential);
            } else {
                // 如果没有选择记住我，清除之前保存的凭据
                window.DataSyncStorage.removeRaw('savedCredentials');
            }

            showNotification('登录成功！正在跳转...', 'success');

            // 登录成功后备份数据
            backupUserData();

            // 同步数据到其他浏览器
            crossBrowserSync.syncToOtherBrowsers();

            console.log('🚀 登录成功，准备跳转到首页');

            // 再次验证会话数据（确保已保存）
            const finalCheck = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
            if (!finalCheck) {
                console.error('❌ 最终验证失败：会话数据未找到！');
                showLoading(false);
                showNotification('登录失败：会话验证失败', 'error');
                return;
            }

            console.log('✅ 最终验证通过，会话数据:', finalCheck);

            // 延迟跳转，确保数据完全写入并给浏览器时间处理
            setTimeout(() => {
                // 最后一次验证
                const lastCheck = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
                if (!lastCheck) {
                    console.error('❌ 跳转前验证失败！');
                    showLoading(false);
                    showNotification('登录失败：请重试', 'error');
                    return;
                }

                // 解析会话数据，确保格式正确
                try {
                    const parsedSession = JSON.parse(lastCheck);
                    if (!parsedSession.user || !parsedSession.user.id) {
                        console.error('❌ 会话数据格式不正确！');
                        showLoading(false);
                        showNotification('登录失败：会话数据错误', 'error');
                        return;
                    }
                    console.log('✅ 会话数据格式验证通过:', parsedSession.user.username);
                } catch (e) {
                    console.error('❌ 解析会话数据失败:', e);
                    showLoading(false);
                    showNotification('登录失败：会话数据解析失败', 'error');
                    return;
                }

                console.log('🔄 跳转到首页: index.html');
                console.log('📋 跳转时会话数据:', lastCheck);

                // 使用 replace 而不是 href，避免在历史记录中留下登录页
                // 添加from=login参数，让index.html知道是从登录页跳转的，延迟检查
                window.location.replace('index.html?from=login&t=' + Date.now());
            }, 300);
        } else {
            // 登录失败
            showLoading(false);
            showError('username-error', '用户名或密码错误');
            console.log('登录失败：用户名或密码错误');
        }
    } catch (error) {
        console.error('登录过程中发生错误:', error);
        showLoading(false);
        showNotification('登录失败，请稍后重试', 'error');
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();
    clearErrors();

    const username = document.getElementById('reg-username')?.value.trim() || '';
    const email = document.getElementById('reg-email')?.value.trim() || '';
    const newCredential = document.getElementById('reg-password')?.value || '';
    const confirmCredential = document.getElementById('reg-confirm-password')?.value || '';

    if (!validateLocalRegisterInput(username, email, newCredential, confirmCredential)) {
        return;
    }

    showLoading(true);

    try {
        const users = window.UserStorage.getUsers();
        const usernameKey = username.toLowerCase();
        const emailKey = email.toLowerCase();
        const existingUser = users.find(user => {
            const sameUsername = String(user.username || '').toLowerCase() === usernameKey;
            const sameEmail = emailKey && String(user.email || '').toLowerCase() === emailKey;
            return sameUsername || sameEmail;
        });

        if (existingUser) {
            showLoading(false);
            showError('reg-username-error', '该用户名或邮箱已存在，请直接登录或换一个');
            return;
        }

        const passwordHash = (window.Security && window.Security.Password && window.Security.Password.hashPassword)
            ? await window.Security.Password.hashPassword(newCredential)
            : newCredential;

        const newUser = {
            id: `user_${Date.now()}`,
            username,
            email,
            phone: '',
            password: passwordHash,
            role: 'user',
            avatar: '',
            permissions: DEFAULT_USER_PERMISSIONS.slice(),
            createdAt: new Date().toISOString(),
            createdBy: 'self-registration',
            passwordMigrated: passwordHash !== newCredential,
            localOnly: true
        };

        window.UserStorage.setUsers([...users, newUser]);

        const sessionSaved = saveUserSession(newUser, true);
        if (!sessionSaved) {
            showLoading(false);
            showNotification('账号已创建，但登录会话保存失败，请手动登录', 'error');
            showLoginForm();
            return;
        }

        backupUserData();
        showNotification('本地账号创建成功，正在进入应用...', 'success');

        setTimeout(() => {
            window.location.replace('index.html?from=register&t=' + Date.now());
        }, 300);
    } catch (error) {
        console.error('本地注册失败:', error);
        showLoading(false);
        showNotification('本地注册失败，请稍后重试', 'error');
    }
}

function validateLocalRegisterInput(username, email, newCredential, confirmCredential) {
    let isValid = true;

    if (!username || username.length < 3) {
        showError('reg-username-error', '用户名至少 3 个字符');
        isValid = false;
    }

    if (username.toLowerCase() === 'admin') {
        showError('reg-username-error', 'admin 是本地管理员保留账号，请换一个用户名');
        isValid = false;
    }

    if (email && !validateEmail(email)) {
        showError('reg-email-error', '请输入正确的邮箱地址');
        isValid = false;
    }

    if (!newCredential || newCredential.length < 6) {
        showError('reg-password-error', '密码至少 6 位');
        isValid = false;
    }

    if (newCredential !== confirmCredential) {
        showError('reg-confirm-password-error', '两次输入的密码不一致');
        isValid = false;
    }

    return isValid;
}

// 绑定表单事件
function bindFormEvents() {
    // 账号登录
    const accountForm = document.getElementById('account-form');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountLogin);
    }

    // 管理员登录
    const adminForm = document.getElementById('admin-form');
    if (adminForm) {
        adminForm.addEventListener('submit', handleAdminLogin);
    }

    // 手机登录（如果存在）
    const phoneForm = document.getElementById('phone-form');
    if (phoneForm) {
        phoneForm.addEventListener('submit', handlePhoneLogin);
    }

    // 注册（如果存在）
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // 发送验证码（如果存在）
    const sendCodeBtn = document.getElementById('send-code-btn');
    if (sendCodeBtn) {
        sendCodeBtn.addEventListener('click', sendVerificationCode);
    }

    // 注册发送验证码（如果存在）
    const regSendCodeBtn = document.getElementById('reg-send-code-btn');
    if (regSendCodeBtn) {
        regSendCodeBtn.addEventListener('click', sendRegisterVerificationCode);
    }

    // 忘记密码链接 - 现在直接跳转到独立页面
    // 不需要JavaScript处理，直接使用href链接

    // 绑定标签页切换事件
    bindTabEvents();
}

// 绑定标签页切换事件
function bindTabEvents() {
    const tabs = document.querySelectorAll('.login-tab');
    console.log('找到标签页数量:', tabs.length);

    tabs.forEach((tab, index) => {
        console.log(`标签页 ${index}:`, tab.textContent, 'data-tab:', tab.getAttribute('data-tab'));
        tab.addEventListener('click', function () {
            const tabType = this.getAttribute('data-tab');
            console.log('点击标签页:', tabType);
            switchTab(tabType);
        });
    });
}

// 切换标签页
function switchTab(tabType) {
    console.log('切换标签页到:', tabType);
    setLoginView(tabType === 'admin' ? 'admin' : 'account');
}

// 处理手机登录
async function handlePhoneLogin(e) {
    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const code = document.getElementById('verification-code').value.trim();

    // 验证输入
    if (!validatePhoneInput(phone, code)) {
        return;
    }

    showLoading(true);

    try {
        // 模拟验证码验证
        const user = await simulatePhoneLogin(phone, code);

        if (user) {
            // 登录成功
            currentUser = user;
            saveUserSession(user, true);
            showNotification('登录成功！', 'success');

            console.log('手机登录成功，准备跳转到首页');

            // 延迟跳转到主页，确保会话已保存
            setTimeout(() => {
                console.log('跳转到首页');
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showError('code-error', '验证码错误或已过期');
        }
    } catch (error) {
        showError('code-error', '登录失败，请稍后重试');
    } finally {
        showLoading(false);
    }
}

// 发送验证码
async function sendVerificationCode() {
    const phone = document.getElementById('phone').value.trim();

    if (!validatePhone(phone)) {
        showError('phone-error', '请输入正确的手机号');
        return;
    }

    const btn = document.getElementById('send-code-btn');
    btn.disabled = true;

    try {
        // 模拟发送验证码
        await simulateSendCode(phone);

        verificationCodeSent = true;
        showSuccess('phone-error', '验证码已发送');

        // 开始倒计时
        startCountdown(btn);

    } catch (error) {
        showError('phone-error', '发送失败，请稍后重试');
        btn.disabled = false;
    }
}

// 发送注册验证码
async function sendRegisterVerificationCode() {
    const phone = document.getElementById('reg-phone').value.trim();

    if (!validatePhone(phone)) {
        showError('reg-phone-error', '请输入正确的手机号');
        return;
    }

    const btn = document.getElementById('reg-send-code-btn');
    btn.disabled = true;

    try {
        // 模拟发送验证码
        await simulateSendCode(phone);

        registerVerificationCodeSent = true;
        showSuccess('reg-code-error', '验证码已发送');

        // 开始倒计时
        startCountdown(btn);

    } catch (error) {
        showError('reg-code-error', '发送失败，请稍后重试');
        btn.disabled = false;
    }
}

// 开始倒计时
function startCountdown(btn) {
    let countdown = 60;

    countdownTimer = setInterval(() => {
        btn.textContent = `${countdown}秒后重发`;
        countdown--;

        if (countdown < 0) {
            clearInterval(countdownTimer);
            btn.textContent = '发送验证码';
            btn.disabled = false;
        }
    }, 1000);
}

// 验证手机输入
function validatePhoneInput(phone, code) {
    let isValid = true;

    if (!validatePhone(phone)) {
        showError('phone-error', '请输入正确的手机号');
        isValid = false;
    }

    if (!code) {
        showError('code-error', '请输入验证码');
        isValid = false;
    } else if (!verificationCodeSent) {
        showError('code-error', '请先发送验证码');
        isValid = false;
    }

    return isValid;
}

// 验证注册输入
function validateRegisterInput(username, phone, verificationCode, newCredential, confirmCredential) {
    let isValid = true;

    if (!username || username.length < 3) {
        showError('reg-username-error', '用户名至少3个字符');
        isValid = false;
    }

    if (!validatePhone(phone)) {
        showError('reg-phone-error', '请输入正确的手机号');
        isValid = false;
    }

    if (!verificationCode) {
        showError('reg-code-error', '请输入手机验证码');
        isValid = false;
    } else if (!registerVerificationCodeSent) {
        showError('reg-code-error', '请先发送验证码');
        isValid = false;
    }

    if (!newCredential || newCredential.length < 6) {
        showError('reg-password-error', '密码至少6个字符');
        isValid = false;
    }

    if (newCredential !== confirmCredential) {
        showError('reg-confirm-password-error', '两次输入的密码不一致');
        isValid = false;
    }

    return isValid;
}

// 验证手机号
function validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

// 验证邮箱
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 显示成功信息
function showSuccess(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        errorElement.style.color = '#27ae60';
    }
}

// 清除错误信息
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.classList.remove('show');
        element.style.color = '#e74c3c';
    });

    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

// 模拟手机登录
async function simulatePhoneLogin(phone, code) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const expectedCode = window.DataSyncStorage.getSessionRaw('phone_verification_code');
            const sentAt = Number(window.DataSyncStorage.getSessionRaw('phone_verification_time') || 0);
            const isFresh = sentAt && Date.now() - sentAt < 10 * 60 * 1000;
            // 本地演示验证码验证：验证码只保存在当前会话，10 分钟有效。
            if (expectedCode && isFresh && code === expectedCode) {
                resolve({
                    id: 'phone_' + Date.now(),
                    username: '手机用户',
                    email: '',
                    phone: phone,
                    avatar: '',
                    loginTime: new Date().toISOString()
                });
            } else {
                resolve(null);
            }
        }, 1000);
    });
}

// 模拟注册请求
async function simulateRegister(username, phone, newCredential) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // 检查用户是否已存在
            const users = window.UserStorage.getUsers();
            const existingUser = users.find(u =>
                u.username === username || u.phone === phone
            );

            if (existingUser) {
                resolve(null);
            } else {
                const newUser = {
                    id: 'user_' + Date.now(),
                    username: username,
                    phone: phone,
                    password: newCredential,
                    avatar: '',
                    createdAt: new Date().toISOString(),
                    verified: true // 通过验证码验证
                };

                users.push(newUser);
                window.UserStorage.setUsers(users);

                resolve({
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    phone: newUser.phone,
                    avatar: newUser.avatar,
                    loginTime: new Date().toISOString()
                });
            }
        }, 1000);
    });
}

// 管理员系统实现
function createAdminSystem() {
    // 创建管理员登录页面
    const adminLoginHTML = `
        <div class="admin-login-container" style="display: none;">
            <div class="admin-login-card">
                <h2>🔐 管理员登录</h2>
                <form id="admin-login-form">
                    <div class="form-group">
                        <label for="admin-login-username">管理员账号</label>
                        <input type="text" id="admin-login-username" name="admin-login-username" placeholder="请输入管理员账号" autocomplete="off" required>
                    </div>
                    <div class="form-group">
                        <label for="admin-login-password">管理员密码</label>
                        <input type="password" id="admin-login-password" name="admin-login-password" placeholder="请输入管理员密码" autocomplete="off" required>
                    </div>
                    <button type="submit" class="login-btn">登录管理后台</button>
                </form>
                <div class="admin-actions">
                    <button data-admin-action="closeAdminLogin" class="btn-secondary">🔙 返回登录页</button>
                </div>
            </div>
        </div>
    `;

    // 创建用户管理页面
    const userManagementHTML = `
        <div class="user-management-container" style="display: none;">
            <div class="user-management-card">
                <h2>👥 用户管理</h2>
                <div class="user-stats">
                    <div class="stat-item">
                        <span class="stat-number" id="total-users">0</span>
                        <span class="stat-label">总用户数</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" id="vip-users">0</span>
                        <span class="stat-label">VIP用户</span>
                    </div>
                </div>
                <div class="user-list" id="user-list">
                    <!-- 用户列表将在这里显示 -->
                </div>
                <div class="admin-actions">
                    <button data-admin-action="showCreateUser" class="btn-primary">➕ 创建新用户</button>
                    <button data-admin-action="showAIKeyConfig" class="btn-info">🤖 AI签语配置</button>
                    <button data-admin-action="showChangeAdminPassword" class="btn-warning">🔐 修改管理员密码</button>
                    <button data-admin-action="returnToLoginPage" class="btn-secondary">🔙 返回登录页</button>
                </div>
            </div>
        </div>
    `;

    // 创建管理员密码修改页面
    const changeAdminPasswordHTML = `
        <div class="change-admin-password-container" style="display: none;">
            <div class="change-admin-password-card">
                <h2>🔐 修改管理员密码</h2>
                <div class="security-notice">
                    <div class="notice-icon">⚠️</div>
                    <div class="notice-content">
                        <h3>安全提醒</h3>
                        <p>为了系统安全，建议定期修改管理员密码。新密码应包含字母、数字和特殊字符，长度不少于8位。</p>
                    </div>
                </div>
                <form id="change-admin-password-form">
                    <!-- 为密码管理器添加隐藏的用户名字段（可访问性优化） -->
                    <input type="text" name="username" value="admin" autocomplete="username" style="display: none;" aria-hidden="true">
                    <div class="form-group">
                        <label for="current-admin-password">当前密码</label>
                        <input type="password" id="current-admin-password" placeholder="请输入当前管理员密码" autocomplete="current-password" required>
                        <div class="error-message" id="current-admin-password-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="new-admin-password">新密码</label>
                        <input type="password" id="new-admin-password" placeholder="请输入新密码（至少8位）" autocomplete="new-password" required>
                        <div class="password-strength" id="password-strength"></div>
                        <div class="error-message" id="new-admin-password-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="confirm-admin-password">确认新密码</label>
                        <input type="password" id="confirm-admin-password" placeholder="请再次输入新密码" autocomplete="new-password" required>
                        <div class="error-message" id="confirm-admin-password-error"></div>
                    </div>
                    <div class="form-group">
                        <label for="command-password">指令密码（安全验证）</label>
                        <input type="password" id="command-password" placeholder="请输入指令密码以确认修改" autocomplete="off" required>
                        <div class="error-message" id="command-password-error"></div>
                    </div>
                </form>
                <div class="admin-actions">
                    <button data-admin-action="changeAdminPassword" class="btn-primary">✅ 确认修改</button>
                    <button data-admin-action="showUserManagement" class="btn-secondary">🔙 返回用户管理</button>
                </div>
            </div>
        </div>
    `;

    // 创建用户创建页面
    const createUserHTML = `
        <div class="create-user-container" style="display: none;">
            <div class="create-user-card">
                <h2>➕ 创建用户账号</h2>
                <form id="create-user-form">
                    <div class="form-group">
                        <label for="new-username">用户名</label>
                        <input type="text" id="new-username" name="new-username" placeholder="请输入用户名" autocomplete="username" required>
                    </div>
                    <div class="form-group">
                        <label for="new-password">初始密码</label>
                        <input type="password" id="new-password" name="new-password" placeholder="请输入初始密码" autocomplete="new-password" required>
                    </div>
                    <div class="form-group">
                        <label for="new-email">邮箱（可选）</label>
                        <input type="email" id="new-email" name="new-email" placeholder="请输入邮箱" autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label for="user-role">用户角色</label>
                        <select id="user-role">
                            <option value="user">👤 普通用户</option>
                            <option value="vip">⭐ VIP用户</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>菜单权限</label>
                        <div class="permission-checkboxes">
                            <div class="permission-item">
                                <label class="permission-label">
                                    <input type="checkbox" name="permissions" value="add-task">
                                    <span>📝 添加任务</span>
                                </label>
                            </div>
                            <div class="permission-item">
                                <label class="permission-label">
                                    <input type="checkbox" name="permissions" value="quadrant-view">
                                    <span>📊 四象限视图</span>
                                </label>
                            </div>
                            <div class="permission-item">
                                <label class="permission-label">
                                    <input type="checkbox" name="permissions" value="daily-sign">
                                    <span>📅 每日一签</span>
                                </label>
                            </div>
                            <div class="permission-item">
                                <label class="permission-label">
                                    <input type="checkbox" name="permissions" value="kanban-view">
                                    <span>📋 可视化看板</span>
                                </label>
                            </div>
                            <div class="permission-item">
                                <label class="permission-label">
                                    <input type="checkbox" name="permissions" value="top-review">
                                    <span>🔍 顶级复盘</span>
                                </label>
                            </div>
                            <div class="permission-item">
                                <label class="permission-label">
                                    <input type="checkbox" name="permissions" value="task-template">
                                    <span>📄 任务模板</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="login-btn">✅ 创建用户</button>
                </form>
                <div class="admin-actions">
                    <button data-admin-action="showUserManagement" class="btn-secondary">🔙 返回用户管理</button>
                </div>
            </div>
        </div>
    `;

    // 创建AI Key配置页面
    const aiKeyConfigHTML = `
        <div class="ai-key-config-container" style="display: none;">
            <div class="ai-key-config-card">
                <h2>🤖 AI签语配置</h2>
                <div class="config-info">
                    <div class="info-card">
                        <h3>📋 配置说明</h3>
                        <p>配置DeepSeek API Key以启用AI智能签语功能。配置后，所有用户都可以使用AI生成个性化签语。</p>
                    </div>
                </div>

                <form id="ai-key-config-form" class="config-form">
                    <div class="form-group">
                        <label for="deepseek-api-key">🔑 DeepSeek API Key:</label>
                        <input type="password" id="deepseek-api-key" placeholder="请输入DeepSeek API Key" autocomplete="new-password" required>
                        <small>
                            <strong>获取方式：</strong><br>
                            1. 访问 <a href="https://platform.deepseek.com" target="_blank" style="color: #4f46e5;">DeepSeek开放平台</a><br>
                            2. 注册账号并获取API Key<br>
                            3. API Key将安全存储在本地，仅管理员可配置
                        </small>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="enable-ai-fortune" checked>
                            <span>启用AI签语生成功能（所有用户）</span>
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="auto-fallback">
                            <span>AI生成失败时自动回退到传统签语</span>
                        </label>
                    </div>

                    <div class="config-status" id="config-status">
                        <h4>📊 当前状态</h4>
                        <div class="status-item">
                            <span>API Key状态：</span>
                            <span id="api-key-status" class="status-badge">未配置</span>
                        </div>
                        <div class="status-item">
                            <span>AI功能状态：</span>
                            <span id="ai-function-status" class="status-badge">未启用</span>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn-primary">💾 保存配置</button>
                        <button type="button" data-admin-action="testAIKey" class="btn-test">🧪 测试API Key</button>
                        <button type="button" data-admin-action="showUserManagement" class="btn-secondary">🔙 返回用户管理</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 创建管理员联系方式页面
    const adminContactHTML = `
        <div class="admin-contact-container" style="display: none;">
            <div class="admin-contact-card">
                <h2>🌱 开源版使用说明</h2>
                <div class="contact-info">
                    <div class="contact-item">
                        <div class="contact-icon">👤</div>
                        <div class="contact-details">
                            <h3>普通用户</h3>
                            <p>点击“本地注册 / 创建账号”，即可在当前浏览器创建个人账号并开始使用。</p>
                        </div>
                    </div>

                    <div class="contact-item">
                        <div class="contact-icon">🔐</div>
                        <div class="contact-details">
                            <h3>本地管理员</h3>
                            <p>管理员用户名固定为 admin；首次输入任意 8 位以上密码会初始化当前浏览器的本地管理员。</p>
                        </div>
                    </div>

                    <div class="contact-item">
                        <div class="contact-icon">💾</div>
                        <div class="contact-details">
                            <h3>数据边界</h3>
                            <p>当前开源版默认使用浏览器本地存储；换浏览器或清理缓存前请先导出备份。</p>
                        </div>
                    </div>
                </div>

                <div class="admin-actions">
                    <button data-admin-action="closeAdminContact" class="btn-secondary">🔙 返回登录页</button>
                </div>
            </div>
        </div>
    `;

    // 将HTML添加到页面
    appendLoginMarkup(document.body, adminLoginHTML);
    appendLoginMarkup(document.body, userManagementHTML);
    appendLoginMarkup(document.body, createUserHTML);
    appendLoginMarkup(document.body, changeAdminPasswordHTML);
    appendLoginMarkup(document.body, aiKeyConfigHTML);
    appendLoginMarkup(document.body, adminContactHTML);

    // 绑定管理员登录事件
    document.getElementById('admin-login-form').addEventListener('submit', handleAdminLogin);
    document.getElementById('create-user-form').addEventListener('submit', handleCreateUser);
    document.getElementById('ai-key-config-form').addEventListener('submit', function (e) {
        e.preventDefault();
        saveAIConfig();
    });
}

// 关闭管理员登录
function closeAdminLogin() {
    document.querySelector('.admin-login-container').style.display = 'none';
    document.querySelector('.user-management-container').style.display = 'none';
    document.querySelector('.create-user-container').style.display = 'none';
    document.querySelector('.change-admin-password-container').style.display = 'none';
    document.querySelector('.admin-contact-container').style.display = 'none';
}

// 显示开源版使用说明
function showAdminContact() {
    document.querySelector('.admin-login-container')?.style.setProperty('display', 'none');
    document.querySelector('.user-management-container')?.style.setProperty('display', 'none');
    document.querySelector('.create-user-container')?.style.setProperty('display', 'none');
    document.querySelector('.change-admin-password-container')?.style.setProperty('display', 'none');
    const cc = document.querySelector('.admin-contact-container');
    if (cc) cc.style.display = 'flex';
}

function closeAdminContact() {
    document.querySelector('.admin-contact-container')?.style.setProperty('display', 'none');
    setLoginView('account');
}

// 显示管理员登录
function showAdminLogin() {
    console.log('showAdminLogin 被调用');

    const adminContainer = document.querySelector('.admin-login-container');
    console.log('管理员容器:', adminContainer);

    if (adminContainer) {
        adminContainer.style.display = 'flex';
        document.querySelector('.user-management-container').style.display = 'none';
        document.querySelector('.create-user-container').style.display = 'none';
        console.log('管理员登录界面已显示');
    } else {
        console.error('未找到管理员容器，重新创建管理员系统');
        createAdminSystem();
        // 再次尝试显示
        setTimeout(() => {
            const newAdminContainer = document.querySelector('.admin-login-container');
            if (newAdminContainer) {
                newAdminContainer.style.display = 'flex';
                console.log('重新创建后显示管理员界面');
            }
        }, 100);
    }
}

// 返回首页
function goToHomePage() {
    console.log('返回首页');
    window.location.href = 'index.html';
}

// 返回登录页
function returnToLoginPage() {
    console.log('返回登录页');
    // 清除管理员会话
    window.SessionStorage.clearSessions(['userSession']);
    currentUser = null;
    isLoggedIn = false;

    // 清除管理员登录表单
    clearAdminForm();

    // 隐藏所有管理员界面
    document.querySelector('.admin-login-container').style.display = 'none';
    document.querySelector('.user-management-container').style.display = 'none';
    document.querySelector('.create-user-container').style.display = 'none';
    document.querySelector('.change-admin-password-container').style.display = 'none';
    document.querySelector('.admin-contact-container').style.display = 'none';

    // 显示登录表单
    showLoginForm();

    showNotification('已退出管理员登录', 'info');
}

// 清除管理员登录表单
function clearAdminForm() {
    const adminUsername = document.getElementById('admin-username');
    const adminPassword = document.getElementById('admin-password');
    const adminLoginUsername = document.getElementById('admin-login-username');
    const adminLoginPassword = document.getElementById('admin-login-password');

    if (adminUsername) adminUsername.value = '';
    if (adminPassword) adminPassword.value = '';
    if (adminLoginUsername) adminLoginUsername.value = '';
    if (adminLoginPassword) adminLoginPassword.value = '';

    console.log('管理员登录表单已清除');
}

// 显示用户管理
function showUserManagement() {
    document.querySelector('.admin-login-container').style.display = 'none';
    document.querySelector('.user-management-container').style.display = 'flex';
    document.querySelector('.create-user-container').style.display = 'none';
    document.querySelector('.change-admin-password-container').style.display = 'none';

    // 加载用户列表
    loadUserList();
}

// 显示创建用户
function showCreateUser() {
    document.querySelector('.admin-login-container').style.display = 'none';
    document.querySelector('.user-management-container').style.display = 'none';
    document.querySelector('.create-user-container').style.display = 'flex';
    document.querySelector('.change-admin-password-container').style.display = 'none';
}

// 显示AI Key配置页面
function showAIKeyConfig() {
    document.querySelector('.admin-login-container').style.display = 'none';
    document.querySelector('.user-management-container').style.display = 'none';
    document.querySelector('.create-user-container').style.display = 'none';
    document.querySelector('.change-admin-password-container').style.display = 'none';
    document.querySelector('.ai-key-config-container').style.display = 'flex';

    // 加载当前配置状态
    loadAIConfigStatus();
}

// 显示修改管理员密码页面
function showChangeAdminPassword() {
    document.querySelector('.admin-login-container').style.display = 'none';
    document.querySelector('.user-management-container').style.display = 'none';
    document.querySelector('.create-user-container').style.display = 'none';
    document.querySelector('.change-admin-password-container').style.display = 'flex';

    // 清空表单
    document.getElementById('current-admin-password').value = '';
    document.getElementById('new-admin-password').value = '';
    document.getElementById('confirm-admin-password').value = '';
    document.getElementById('command-password').value = '';

    // 清空错误消息
    clearAdminPasswordErrors();

    // 聚焦到第一个输入框
    setTimeout(() => {
        document.getElementById('current-admin-password').focus();
    }, 100);

    // 添加新密码输入时的实时强度检查
    const newPasswordInput = document.getElementById('new-admin-password');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function () {
            if (this.value.length > 0) {
                checkPasswordStrength(this.value);
            } else {
                const strengthElement = document.getElementById('password-strength');
                if (strengthElement) {
                    strengthElement.textContent = '';
                    strengthElement.className = 'password-strength';
                }
            }
        });
    }
}

// 加载用户列表
function loadUserList() {
    const users = window.UserStorage.getUsers();
    const userList = document.getElementById('user-list');

    updateUserStats(users);
    userList.replaceChildren();

    if (users.length === 0) {
        userList.appendChild(createEmptyUserState());
        return;
    }

    users.forEach(user => {
        userList.appendChild(createUserListItem(user));
    });
}

function createEmptyUserState() {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';

    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    icon.textContent = '\uD83D\uDC65';

    const title = document.createElement('p');
    title.textContent = '\u6682\u65E0\u7528\u6237';

    const hint = document.createElement('p');
    hint.className = 'empty-state-hint';
    hint.textContent = '\u70B9\u51FB"\u521B\u5EFA\u65B0\u7528\u6237"\u5F00\u59CB\u6DFB\u52A0\u7528\u6237';

    emptyState.append(icon, title, hint);
    return emptyState;
}

function createUserListItem(user) {
    const item = document.createElement('div');
    item.className = 'user-item';

    const info = document.createElement('div');
    info.className = 'user-info';

    const username = document.createElement('strong');
    username.textContent = user.username || '';

    const role = document.createElement('span');
    role.className = `user-role ${user.role || 'user'}`;
    role.textContent = user.role === 'vip' ? '\u2B50 VIP\u7528\u6237' : '\uD83D\uDC64 \u666E\u901A\u7528\u6237';

    const email = document.createElement('span');
    email.className = 'user-email';
    email.textContent = user.email || '\u65E0\u90AE\u7BB1';

    const permissions = document.createElement('span');
    permissions.className = 'user-permissions';
    const permissionText = (user.permissions || []).map(p => MENU_PERMISSIONS[p]).filter(Boolean).join('\u3001') || '\u65E0\u6743\u9650';
    permissions.textContent = `\u6743\u9650\uFF1A${permissionText}`;

    const createdAt = document.createElement('span');
    createdAt.className = 'user-date';
    createdAt.textContent = `\u521B\u5EFA\u65F6\u95F4: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}`;

    info.append(username, role, email, permissions, createdAt);

    const actions = document.createElement('div');
    actions.className = 'user-actions';

    const editButton = document.createElement('button');
    editButton.dataset.adminAction = 'editUser';
    editButton.dataset.userId = user.id || '';
    editButton.className = 'btn-edit';
    editButton.textContent = '\u270F\uFE0F \u7F16\u8F91';

    const deleteButton = document.createElement('button');
    deleteButton.dataset.adminAction = 'deleteUser';
    deleteButton.dataset.userId = user.id || '';
    deleteButton.className = 'btn-delete';
    deleteButton.textContent = '\uD83D\uDDD1\uFE0F \u5220\u9664';

    actions.append(editButton, deleteButton);
    item.append(info, actions);
    return item;
}

async function loadAIConfigStatus() {
    let aiCredential;
    const aiEnabled = window.DataSyncStorage.getRaw('aiFortuneEnabled') === 'true';
    const autoFallback = window.DataSyncStorage.getRaw('aiAutoFallback') === 'true';

    // 尝试从安全存储获取API密钥
    if (window.secureGetApiKey) {
        aiCredential = await window.secureGetApiKey('deepSeek');
        // 如果安全存储没有，尝试从旧的localStorage获取
        if (!aiCredential) {
            aiCredential = window.DataSyncStorage.getRaw('deepSeekApiKey');
            // 如果找到旧的API密钥，迁移到安全存储
            if (aiCredential && window.secureSaveApiKey) {
                await window.secureSaveApiKey('deepSeek', aiCredential);
                window.DataSyncStorage.removeRaw('deepSeekApiKey');
            }
        }
    } else {
        aiCredential = window.DataSyncStorage.getRaw('deepSeekApiKey');
    }

    // 更新表单值
    document.getElementById('deepseek-api-key').value = aiCredential || '';
    document.getElementById('enable-ai-fortune').checked = aiEnabled;
    document.getElementById('auto-fallback').checked = autoFallback;

    // 更新状态显示
    const apiKeyStatus = document.getElementById('api-key-status');
    const aiFunctionStatus = document.getElementById('ai-function-status');

    if (aiCredential) {
        apiKeyStatus.textContent = '已配置';
        apiKeyStatus.className = 'status-badge status-success';
    } else {
        apiKeyStatus.textContent = '未配置';
        apiKeyStatus.className = 'status-badge status-error';
    }

    if (aiEnabled) {
        aiFunctionStatus.textContent = '已启用';
        aiFunctionStatus.className = 'status-badge status-success';
    } else {
        aiFunctionStatus.textContent = '未启用';
        aiFunctionStatus.className = 'status-badge status-error';
    }
}

// 保存AI配置（使用安全存储）
async function saveAIConfig() {
    const aiCredential = document.getElementById('deepseek-api-key').value.trim();
    const aiEnabled = document.getElementById('enable-ai-fortune').checked;
    const autoFallback = document.getElementById('auto-fallback').checked;

    if (!aiCredential && aiEnabled) {
        showNotification('请先配置API Key再启用AI功能', 'error');
        return;
    }

    // 保存配置到安全存储
    if (aiCredential) {
        if (window.secureSaveApiKey) {
            await window.secureSaveApiKey('deepSeek', aiCredential);
            window.DataSyncStorage.removeRaw('deepSeekApiKey'); // 删除明文密钥
        } else {
            window.DataSyncStorage.setRaw('deepSeekApiKey', aiCredential);
        }
    }
    window.DataSyncStorage.setRaw('aiFortuneEnabled', aiEnabled.toString());
    window.DataSyncStorage.setRaw('aiAutoFallback', autoFallback.toString());

    showNotification('AI配置保存成功！', 'success');

    // 更新状态显示
    await loadAIConfigStatus();
}

// 测试API Key
async function testAIKey() {
    const aiCredential = document.getElementById('deepseek-api-key').value.trim();

    if (!aiCredential) {
        showNotification('请先输入API Key', 'error');
        return;
    }

    const testBtn = document.querySelector('.btn-test');
    const originalText = testBtn.textContent;
    testBtn.textContent = '🔄 测试中...';
    testBtn.disabled = true;

    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiCredential}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: '请回复"测试成功"'
                    }
                ],
                max_tokens: 10
            })
        });

        if (response.ok) {
            showNotification('API Key测试成功！', 'success');
        } else {
            showNotification('API Key测试失败，请检查Key是否正确', 'error');
        }
    } catch (error) {
        showNotification('网络错误，请检查网络连接', 'error');
    } finally {
        testBtn.textContent = originalText;
        testBtn.disabled = false;
    }
}

// 更新用户统计
function updateUserStats(users) {
    const totalUsers = users.length;
    const vipUsers = users.filter(user => user.role === 'vip').length;

    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('vip-users').textContent = vipUsers;
}

// 删除用户
function deleteUser(userId) {
    const users = window.UserStorage.getUsers();
    const user = users.find(u => u.id === userId);

    if (confirm(`确定要删除用户 "${user.username}" 吗？\n\n⚠️ 删除后将无法恢复！`)) {
        const filteredUsers = users.filter(user => user.id !== userId);
        window.UserStorage.setUsers(filteredUsers);

        // 删除用户后备份数据
        backupUserData();

        loadUserList();
        showNotification(`用户 "${user.username}" 删除成功`, 'success');
    }
}

// 编辑用户
function editUser(userId) {
    const users = window.UserStorage.getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
        showNotification('用户不存在', 'error');
        return;
    }

    // 创建编辑对话框
    const editDialog = document.createElement('div');
    editDialog.className = 'admin-login-container';
    editDialog.style.display = 'flex';
    renderLoginMarkup(editDialog, `
        <div class="admin-login-card">
            <h2>✏️ 编辑用户</h2>
            <form id="edit-user-form">
                <div class="form-group">
                    <label for="edit-username">用户名</label>
                    <input type="text" id="edit-username" value="${user.username}" required>
                </div>
                <div class="form-group">
                    <label for="edit-password">密码</label>
                    <input type="password" id="edit-password" placeholder="留空表示不修改密码">
                </div>
                <div class="form-group">
                    <label for="edit-email">邮箱</label>
                    <input type="email" id="edit-email" value="${user.email || ''}">
                </div>
                <div class="form-group">
                    <label for="edit-role">用户角色</label>
                    <select id="edit-role">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>👤 普通用户</option>
                        <option value="vip" ${user.role === 'vip' ? 'selected' : ''}>⭐ VIP用户</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>菜单权限</label>
                    <div class="permission-checkboxes">
                        ${Object.entries(MENU_PERMISSIONS).map(([key, name]) => `
                            <div class="permission-item">
                                <label class="permission-label">
                                    <input type="checkbox" name="edit-permissions" value="${key}" ${(user.permissions || []).includes(key) ? 'checked' : ''}>
                                    <span>${name}</span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="admin-actions">
                    <button type="submit" class="btn-primary">✅ 保存修改</button>
                    <button type="button" data-admin-action="closeEditDialog" class="btn-secondary">❌ 取消</button>
                </div>
            </form>
        </div>
    `);

    document.body.appendChild(editDialog);

    // 绑定编辑表单事件
    document.getElementById('edit-user-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('edit-username').value;
        const editedCredential = document.getElementById('edit-password').value;
        const email = document.getElementById('edit-email').value;
        const role = document.getElementById('edit-role').value;

        // 获取选中的权限
        const permissionCheckboxes = document.querySelectorAll('input[name="edit-permissions"]:checked');
        const permissions = Array.from(permissionCheckboxes).map(cb => cb.value);

        // 更新用户信息
        const updatedUsers = users.map(u => {
            if (u.id === userId) {
                return {
                    ...u,
                    username: username,
                    password: editedCredential || u.password, // 如果密码为空，保持原密码
                    email: email,
                    role: role,
                    permissions: permissions, // 更新权限信息
                    updatedAt: new Date().toISOString()
                };
            }
            return u;
        });

        window.UserStorage.setUsers(updatedUsers);

        // 编辑用户后备份数据
        backupUserData();

        loadUserList();
        closeEditDialog();
        showNotification(`用户 "${username}" 修改成功，权限：${permissions.map(p => MENU_PERMISSIONS[p]).join('、')}`, 'success');
    });
}

// 关闭编辑对话框
function closeEditDialog() {
    const editDialog = document.querySelector('.admin-login-container:last-child');
    if (editDialog) {
        editDialog.remove();
    }
}

// 邮箱验证码功能实现
async function sendEmailVerificationCode(email) {
    // 模拟邮箱发送（实际需要后端支持）
    return new Promise((resolve) => {
        setTimeout(() => {
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // 模拟发送邮件
            console.log(`邮件已发送到 ${email}`);
            console.log(`验证码: ${verificationCode}`);

            // 在页面上显示验证码
            showEmailCodeNotification(email, verificationCode);

            // 存储验证码用于验证
            window.DataSyncStorage.setSessionRaw('email_verification_code', verificationCode);
            window.DataSyncStorage.setSessionRaw('email_verification_time', Date.now().toString());

            resolve(true);
        }, 1000);
    });
}

function showEmailCodeNotification(email, code) {
    const notification = document.createElement('div');
    notification.className = 'login-code-notification';
    const title = document.createElement('div');
    title.className = 'login-code-notification-title';
    title.textContent = '📧 邮件验证码';

    const target = document.createElement('div');
    target.textContent = `已发送到: ${email}`;

    const codeText = document.createElement('div');
    codeText.className = 'login-code-notification-code';
    codeText.textContent = `验证码: ${code}`;

    notification.append(title, target, codeText);
    document.body.appendChild(notification);

    // 8秒后自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 8000);
}

// 添加邮箱验证码选项
function addEmailVerificationOption() {
    const phoneGroup = document.querySelector('#register-form .form-group:nth-child(2)');
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group';
    const emailLabel = document.createElement('label');
    emailLabel.htmlFor = 'reg-email';
    emailLabel.textContent = '邮箱地址（可选）';

    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'reg-email';
    emailInput.name = 'reg-email';
    emailInput.placeholder = '请输入邮箱地址';

    const emailError = document.createElement('div');
    emailError.className = 'error-message';
    emailError.id = 'reg-email-error';

    emailGroup.append(emailLabel, emailInput, emailError);

    phoneGroup.insertAdjacentElement('afterend', emailGroup);

    // 添加验证方式选择
    const verificationMethod = document.createElement('div');
    verificationMethod.className = 'verification-method';
    const methodOptions = document.createElement('div');
    methodOptions.className = 'method-options';
    methodOptions.append(
        createVerificationMethodOption('phone', '手机验证码', true),
        createVerificationMethodOption('email', '邮箱验证码', false)
    );
    verificationMethod.appendChild(methodOptions);

    const verificationGroup = document.querySelector('#register-form .verification-group').parentElement;
    verificationGroup.insertAdjacentElement('beforebegin', verificationMethod);
}

function createVerificationMethodOption(value, labelText, checked) {
    const label = document.createElement('label');
    label.className = 'method-option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'verification-method';
    input.value = value;
    input.checked = checked;

    const text = document.createElement('span');
    text.textContent = labelText;

    label.append(input, text);
    return label;
}

// 模拟发送验证码
async function simulateSendCode(phone) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            console.log(`验证码已发送到 ${phone}: ${verificationCode}`);
            window.DataSyncStorage.setSessionRaw('phone_verification_code', verificationCode);
            window.DataSyncStorage.setSessionRaw('phone_verification_time', Date.now().toString());

            // 在页面上显示验证码（仅用于演示）
            const codeDisplay = document.createElement('div');
            codeDisplay.className = 'login-phone-code-display';
            codeDisplay.textContent = `验证码: ${verificationCode}`;
            document.body.appendChild(codeDisplay);

            // 5秒后自动移除
            setTimeout(() => {
                if (codeDisplay.parentNode) {
                    codeDisplay.parentNode.removeChild(codeDisplay);
                }
            }, 5000);

            resolve(true);
        }, 1000);
    });
}

// 忘记密码相关函数 - 页面版本
function showForgotPasswordPage() {
    const page = document.getElementById('forgot-password-page');
    if (page) {
        page.style.display = 'flex';
        // 添加动画效果
        page.style.opacity = '0';
        page.style.transform = 'scale(0.9)';

        // 清空表单
        document.getElementById('reset-phone').value = '';
        document.getElementById('reset-email').value = '';
        document.getElementById('new-password-reset').value = '';
        document.getElementById('confirm-password-reset').value = '';
        // 清空错误消息
        clearForgotPasswordErrors();

        // 动画显示
        setTimeout(() => {
            page.style.opacity = '1';
            page.style.transform = 'scale(1)';
        }, 10);

        // 聚焦到第一个输入框
        setTimeout(() => {
            document.getElementById('reset-phone').focus();
        }, 300);
    }
}

function closeForgotPasswordPage() {
    const page = document.getElementById('forgot-password-page');
    if (page) {
        // 添加关闭动画
        page.style.opacity = '0';
        page.style.transform = 'scale(0.9)';

        setTimeout(() => {
            page.style.display = 'none';
        }, 200);
    }
}

function clearForgotPasswordErrors() {
    const errorElements = document.querySelectorAll('#forgot-password-form .error-message');
    errorElements.forEach(el => el.textContent = '');
}

function resetPassword() {
    try {
        const phone = document.getElementById('reset-phone').value.trim();
        const email = document.getElementById('reset-email').value.trim();
        const newCredential = document.getElementById('new-password-reset').value;
        const confirmCredential = document.getElementById('confirm-password-reset').value;

        // 清空之前的错误消息
        clearForgotPasswordErrors();

        // 验证输入
        if (!phone || !email || !newCredential || !confirmCredential) {
            showNotification('请填写所有字段', 'error');
            return;
        }

        if (newCredential !== confirmCredential) {
            showNotification('新密码和确认密码不匹配', 'error');
            return;
        }

        if (newCredential.length < 6) {
            showNotification('新密码长度至少6位', 'error');
            return;
        }

        // 验证手机号格式
        if (!/^\d{6,15}$/.test(phone)) {
            showNotification('手机号码格式不正确', 'error');
            return;
        }

        // 验证邮箱格式
        if (!email.includes('@') || !email.includes('.')) {
            showNotification('邮箱地址格式不正确', 'error');
            return;
        }

        // 查找用户
        const users = window.UserStorage.getUsers();
        const user = users.find(u =>
            (u.phone === phone || u.email === email) &&
            (u.phone === phone && u.email === email)
        );

        if (!user) {
            showNotification('未找到匹配的用户信息，请检查手机号和邮箱是否正确', 'error');
            return;
        }

        // 更新用户密码
        user.password = newCredential;

        // 保存到localStorage
        window.UserStorage.setUsers(users);

        // 修改密码后备份数据
        backupUserData();

        // 如果用户当前已登录，也更新会话中的密码
        const sessionStr = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                if (session.user && (session.user.username === user.username || session.user.id === user.id)) {
                    // 更新整个用户对象，确保数据完整性
                    session.user = { ...session.user, ...user };
                    console.log('已更新会话中的用户数据:', session.user);

                    const existingSession = window.SessionStorage.getSession('userSession');
                    window.SessionStorage.setSession(session, { remember: Boolean(existingSession?.rememberMe) });

                    // 同步更新当前用户对象（如果用户已登录）
                    if (typeof currentUser !== 'undefined' && currentUser &&
                        (currentUser.username === user.username || currentUser.id === user.id)) {
                        currentUser = { ...currentUser, ...user };
                    console.log('Current user state synchronized.');
                    }
                }
            } catch (e) {
                console.warn('更新会话密码失败:', e);
            }
        }

        showNotification('密码重置成功！请使用新密码登录', 'success');
        closeForgotPasswordPage();

    } catch (err) {
        console.error('resetPassword error', err);
        showNotification('密码重置失败，请稍后重试', 'error');
    }
}

// 检查用户菜单权限
function checkUserMenuPermissions() {
    if (!currentUser || !currentUser.permissions) {
        console.log('用户无权限信息');
        return [];
    }

    console.log('用户权限:', currentUser.permissions);
    return currentUser.permissions;
}

// 根据权限显示/隐藏菜单
function updateMenuVisibility() {
    const permissions = checkUserMenuPermissions();

    // 这里需要与首页的菜单项ID对应
    const menuItems = {
        'add-task': 'add-task-menu',
        'quadrant-view': 'quadrant-view-menu',
        'daily-sign': 'daily-sign-menu',
        'kanban-view': 'kanban-view-menu',
        'top-review': 'top-review-menu',
        'task-template': 'task-template-menu'
    };

    // 隐藏所有菜单项
    Object.values(menuItems).forEach(menuId => {
        const menuElement = document.getElementById(menuId);
        if (menuElement) {
            menuElement.style.display = 'none';
        }
    });

    // 显示有权限的菜单项
    permissions.forEach(permission => {
        const menuId = menuItems[permission];
        if (menuId) {
            const menuElement = document.getElementById(menuId);
            if (menuElement) {
                menuElement.style.display = 'block';
            }
        }
    });

    console.log('菜单权限更新完成，显示权限:', permissions.map(p => MENU_PERMISSIONS[p]));
}

// 清空管理员密码错误消息
function clearAdminPasswordErrors() {
    const errorElements = document.querySelectorAll('#change-admin-password-form .error-message');
    errorElements.forEach(el => el.textContent = '');

    const passwordStrength = document.getElementById('password-strength');
    if (passwordStrength) {
        passwordStrength.textContent = '';
        passwordStrength.className = 'password-strength';
    }
}

// 检查密码强度
function checkPasswordStrength(credential) {
    let strength = 0;
    let feedback = [];

    if (credential.length >= 8) strength++;
    else feedback.push('至少8位');

    if (/[a-z]/.test(credential)) strength++;
    else feedback.push('包含小写字母');

    if (/[A-Z]/.test(credential)) strength++;
    else feedback.push('包含大写字母');

    if (/[0-9]/.test(credential)) strength++;
    else feedback.push('包含数字');

    if (/[^A-Za-z0-9]/.test(credential)) strength++;
    else feedback.push('包含特殊字符');

    const strengthElement = document.getElementById('password-strength');
    if (strengthElement) {
        if (strength < 3) {
            strengthElement.textContent = '弱 - 建议: ' + feedback.join(', ');
            strengthElement.className = 'password-strength weak';
        } else if (strength < 5) {
            strengthElement.textContent = '中等 - 建议: ' + feedback.join(', ');
            strengthElement.className = 'password-strength medium';
        } else {
            strengthElement.textContent = '强 - 密码安全性良好';
            strengthElement.className = 'password-strength strong';
        }
    }

    return strength >= 3;
}

// 修改管理员密码
function changeAdminPassword() {
    try {
        const currentCredential = document.getElementById('current-admin-password').value;
        const newCredential = document.getElementById('new-admin-password').value;
        const confirmCredential = document.getElementById('confirm-admin-password').value;
        const commandCredential = document.getElementById('command-password').value;

        // 清空之前的错误消息
        clearAdminPasswordErrors();

        // 验证输入
        if (!currentCredential || !newCredential || !confirmCredential || !commandCredential) {
            showNotification('请填写所有字段', 'error');
            return;
        }

        // 验证指令密码
        if (!verifyCommandPassword(commandCredential)) {
            showError('command-password-error', '指令密码错误，无法完成修改');
            showNotification('指令密码验证失败', 'error');
            return;
        }

        // 验证当前密码
        const storedAdminCredential = getCurrentAdminPassword();
        if (currentCredential !== storedAdminCredential) {
            showError('current-admin-password-error', '当前密码不正确');
            return;
        }

        // 验证新密码
        if (newCredential.length < 8) {
            showError('new-admin-password-error', '新密码长度至少8位');
            return;
        }

        if (newCredential === currentCredential) {
            showError('new-admin-password-error', '新密码不能与当前密码相同');
            return;
        }

        if (newCredential !== confirmCredential) {
            showError('confirm-admin-password-error', '新密码和确认密码不匹配');
            return;
        }

        // 检查密码强度
        if (!checkPasswordStrength(newCredential)) {
            showError('new-admin-password-error', '密码强度不够，请参考下方建议');
            return;
        }

        // 更新管理员密码
        setAdminPassword(newCredential);

        // 修改管理员密码后备份数据
        backupUserData();

        showNotification('管理员密码修改成功！请记住新密码', 'success');

        // 记录密码修改日志
        const passwordChangeLog = window.AdminStorage.getPasswordChangeLog();
        passwordChangeLog.push({
            timestamp: new Date().toISOString(),
            action: 'password_changed',
            note: '管理员密码已修改'
        });
        window.AdminStorage.setRaw('adminPasswordChangeLog', JSON.stringify(passwordChangeLog));

        // 返回用户管理页面
        setTimeout(() => {
            showUserManagement();
        }, 2000);

    } catch (err) {
        console.error('changeAdminPassword error', err);
        showNotification('密码修改失败，请稍后重试', 'error');
    }
}
