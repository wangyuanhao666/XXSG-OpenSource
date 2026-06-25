// 象限时光 v2.9.3 - 英文两行导航栏优化 + 登录系统 + 权限控制 + AI功能增强

// ==================== 调试配置 ====================
// 设置为 false 可关闭调试日志，保留错误和警告
const DEBUG_MODE = false;

// 调试日志函数（仅在DEBUG_MODE开启时输出）
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.log(...args);
    }
}

// 仅在生产环境输出重要信息
function infoLog(...args) {
    // 生产环境也输出，但可以后续关闭
    console.log(...args);
}

if (DEBUG_MODE) {
    console.log('🚀 象限时光 v2.9.3 已加载 - 英文两行导航栏优化 + 登录系统 + 权限控制 + AI功能增强');
    console.log('🐛 调试模式已启用');
}

// 全局错误处理，确保错误不会阻止脚本执行
window.addEventListener('error', function (event) {
    console.error('❌ 全局错误捕获:', event.error);
    console.error('错误位置:', event.filename, ':', event.lineno);
    // 不阻止默认行为，让错误继续传播以便调试
});

// 未处理的Promise拒绝
window.addEventListener('unhandledrejection', function (event) {
    // 过滤掉浏览器扩展相关的错误
    if (event.reason && event.reason.message) {
        const msg = event.reason.message.toLowerCase();
        if (msg.includes('message channel') || msg.includes('async response')) {
            // 忽略浏览器扩展的异步响应错误
            event.preventDefault();
            return;
        }
    }
    console.error('❌ 未处理的Promise拒绝:', event.reason);
    // 阻止默认行为，避免在控制台显示重复错误
    event.preventDefault();
});

// 菜单权限定义
const MENU_PERMISSIONS = {
    'add-task': '添加任务',
    'quadrant-view': '四象限视图',
    'daily-sign': '每日一签',
    'kanban-view': '可视化看板',
    'top-review': '顶级复盘',
    'task-template': '任务模板'
};

// 用户登录状态管理
let currentUser = null;
let isLoggedIn = false;

// ==================== 安全工具函数 ====================

/**
 * 创建安全的用户会话对象（移除敏感信息）
 * @param {Object} user - 原始用户对象
 * @param {boolean} rememberMe - 是否记住登录状态
 * @returns {Object} 安全的会话对象
 */
function createSecureSession(user, rememberMe = false) {
    // 创建用户对象的副本，并移除敏感字段
    const { password: _removedCredential, ...sanitizedUser } = { ...user };

    return {
        user: sanitizedUser,
        loginTime: new Date().toISOString(),
        rememberMe: rememberMe
    };
}

/**
 * 安全地保存用户会话
 * @param {Object} user - 用户对象
 * @param {boolean} rememberMe - 是否记住登录状态
 */
function saveSecureSession(user, rememberMe = false) {
    const session = createSecureSession(user, rememberMe);

    const sessionStr = JSON.stringify(session);
    window.SessionStorage.setSession(session, { remember: false });

    if (rememberMe) {
        window.SessionStorage.setSession(session, { remember: true });
    }

    console.log('✅ 安全会话已保存（不包含敏感信息）');
    return session;
}

/**
 * 清理会话中的敏感信息
 */
function sanitizeSession(session) {
    if (session && session.user && session.user.password) {
        delete session.user.password;
    }
    return session;
}

/**
 * 清理现有会话存储中的敏感信息
 */
function sanitizeExistingSessions() {
    try {
        const logCredentialCleanup = (source, user) => {
            console.log('Credential cleanup completed.', {
                source,
                userId: user?.id || null,
                username: user?.username || null,
                credentialRemoved: true
            });
        };

        // 清理localStorage
        const localSession = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
        if (localSession) {
            const session = JSON.parse(localSession);
            if (session.user && session.user.password) {
                delete session.user.password;
                window.SessionStorage.setSession(session, { remember: true });
                logCredentialCleanup('persistent-session', session.user);
            }
        }

        // 清理sessionStorage
        const sessionSession = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
        if (sessionSession) {
            const session = JSON.parse(sessionSession);
            if (session.user && session.user.password) {
                delete session.user.password;
                window.SessionStorage.setSession(session, { remember: false });
                logCredentialCleanup('session', session.user);
            }
        }

        // 清理全局变量
        if (typeof window.currentUser !== 'undefined' && window.currentUser && window.currentUser.password) {
            delete window.currentUser.password;
            logCredentialCleanup('runtime-user', window.currentUser);
        }

        console.log('🎉 会话数据安全清理完成！');
    } catch (error) {
        console.error('❌ 清理会话数据失败:', error);
    }
}

// 页面加载时立即执行清理
setTimeout(() => {
    sanitizeExistingSessions();
}, 100);

// AI core services and analysis UI have been moved to js/ai-core.js.

// 🔧 添加权限同步函数（尊重管理员设置）
window.syncPermissionsFromStorage = function() {
    console.log('🚨 === 同步权限设置（尊重管理员配置） ===');

    try {
        // 1. 从用户数据同步所有用户权限
        const users = window.UserStorage.getUsers();
        const wqfgUser = users.find(u => u.username === 'WQFG');

        if (wqfgUser) {
            console.log('📋 WQFG用户当前权限:', wqfgUser.permissions);
            console.log('📋 权限数量:', wqfgUser.permissions ? wqfgUser.permissions.length : 0);
            // 不强制修改，保持管理员设置的权限
        } else {
            console.error('❌ WQFG用户不存在');
        }

        // 2. 同步会话数据（保持管理员设置的权限）
        const sessionData = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                if (session.user && session.user.username === 'WQFG') {
                    const storageUser = users.find(u => u.username === 'WQFG');
                    if (storageUser) {
                        session.user.permissions = [...storageUser.permissions];
                        // 使用清理后的 session 保存，不包含敏感凭据
                        const sanitizedSession = sanitizeSession(session);
                        window.SessionStorage.setSession(sanitizedSession, { remember: true });
                        console.log('✅ 会话权限已同步（安全存储）:', session.user.permissions);
                    }
                }
            } catch (error) {
                console.error('❌ 同步会话失败:', error);
            }
        }

        // 3. 同步全局变量（保持管理员设置的权限）
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.username === 'WQFG') {
            const storageUser = users.find(u => u.username === 'WQFG');
            if (storageUser) {
                currentUser.permissions = [...storageUser.permissions];
                console.log('✅ 全局变量已同步:', currentUser.permissions);
            }
        }

        // 4. 立即更新菜单显示
        setTimeout(() => {
            updateMenuVisibility();
            console.log('✅ 菜单显示已更新');
        }, 100);

        console.log('🎉 权限同步完成！');
        return true;

    } catch (error) {
        console.error('❌ 权限同步失败:', error);
        return false;
    }
};

// 页面加载时自动同步权限（尊重管理员设置）
window.autoSyncPermissions = function() {
    console.log('🔍 === 自动同步权限（尊重管理员配置） ===');

    // 检查所有用户权限设置
    const users = window.UserStorage.getUsers();
    const wqfgUser = users.find(u => u.username === 'WQFG');

    if (wqfgUser) {
        console.log('📋 WQFG用户权限状态:');
        console.log('  当前权限:', wqfgUser.permissions);
        console.log('  权限数量:', wqfgUser.permissions ? wqfgUser.permissions.length : 0);
        console.log('  权限来源:', '管理员设置');

        // 不进行任何强制修复，完全保持管理员设置的权限
        console.log('✅ 权限保持管理员设置，无需修复');

        // 调用同步函数确保显示正确
        syncPermissionsFromStorage();
    }
};

// 立即执行自动同步
setTimeout(() => {
    autoSyncPermissions();
}, 2000);

// 检查用户菜单权限
function checkUserMenuPermissions() {
    console.log('=== 检查用户菜单权限 ===');
    console.log('Current user state checked.');

    if (!currentUser) {
        console.log('❌ 用户未登录');
        return [];
    }

    // 🔧 强制修复：直接从localStorage获取最新的用户数据
    try {
        const users = window.UserStorage.getUsers();
        console.log('🔧 所有用户数据:', users.map(u => ({ username: u.username, permissions: u.permissions })));

        const currentUserData = users.find(u => u.username === currentUser.username);

        if (currentUserData) {
            console.log('🔧 从localStorage获取用户数据:', {
                username: currentUserData.username,
                permissions: currentUserData.permissions,
                permissionsCount: currentUserData.permissions.length
            });

            // 🔧 移除强制权限限制，完全尊重管理员设置的权限
            if (currentUserData.username === 'WQFG') {
                console.log('🔧 WQFG用户权限完全来自管理员配置');
                console.log('🔧 当前权限:', currentUserData.permissions);
                console.log('🔧 权限数量:', currentUserData.permissions ? currentUserData.permissions.length : 0);
                // 不进行任何强制检查或修复，完全使用管理员设置的权限
            }

            // 更新全局currentUser对象
            currentUser.permissions = [...(currentUserData.permissions || [])];
            console.log('🔧 更新全局用户权限:', currentUser.permissions);

            // 更新会话数据（安全存储，不包含敏感凭据）
            const session = createSecureSession(currentUserData, true);
            window.SessionStorage.setSession(session, { remember: true });
            console.log('🔧 会话数据已同步（安全存储）');
        } else {
            console.error('❌ 在用户数据中找不到当前用户:', currentUser.username);
        }
    } catch (error) {
        console.error('❌ 读取用户数据失败:', error);
    }

    if (!currentUser.permissions || currentUser.permissions.length === 0) {
        console.log('❌ 用户无权限信息');
        console.log('Current user state checked.');
        return [];
    }

    // 🔧 权限同步：使用localStorage中的最新数据（不对任何用户强制限制）
    if (currentUser && currentUser.permissions) {
        console.log('🔧 用户权限同步，使用localStorage中的最新数据');

        // 从localStorage获取最新的权限设置（管理员设置的）
        const users = window.UserStorage.getUsers();
        const userData = users.find(u => u.username === currentUser.username);

        if (userData && userData.permissions) {
            // 同步最新的权限设置
            currentUser.permissions = [...userData.permissions];
            console.log(`🔧 从localStorage同步${currentUser.username}权限:`, currentUser.permissions);

            // 同时更新会话数据
            const sessionData = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    if (session.user && session.user.username === currentUser.username) {
                        session.user.permissions = [...userData.permissions];
                        const sanitizedSession = sanitizeSession(session);
                        window.SessionStorage.setSession(sanitizedSession, { remember: true });
                        console.log('🔧 会话数据已同步（安全存储）');
                    }
                } catch (error) {
                    console.warn('⚠️ 更新会话数据失败:', error);
                }
            }
        } else {
            console.warn('⚠️ 无法从localStorage获取用户权限数据');
        }
    }

    console.log('✅ 最终用户权限:', currentUser.permissions);
    console.log('权限类型:', typeof currentUser.permissions);
    console.log('权限长度:', currentUser.permissions.length);
    return currentUser.permissions;
}

// 根据权限显示/隐藏菜单
function updateMenuVisibility() {
    // 🔧 防止重复调用导致控制台疯狂刷新
    if (window._menuVisibilityUpdating) {
        console.log('⚠️ 菜单权限更新中，跳过重复调用');
        return;
    }

    window._menuVisibilityUpdating = true;

    console.log('🔧 updateMenuVisibility 强化版本');
    console.log('=== 开始更新菜单权限 ===');
    const permissions = checkUserMenuPermissions();

    // 主导航栏菜单项ID映射
    const mainMenuItems = {
        'add-task': 'list-tab-btn',
        'quadrant-view': 'quadrant-tab-btn',
        'fortune': 'fortune-tab-btn',
        'dashboard': 'dashboard-tab-btn',
        'review': 'review-tab-btn',
        'templates': 'templates-tab-btn',
        'backup': 'backup-tab-btn',
        'more-features': 'more-features-tab-btn'
    };

    // 更多功能页面中的功能卡片ID映射
    const moreFeatureCards = {
        'fortune': 'fortune-feature-card',           // 每日一签
        'pomodoro': 'pomodoro-feature-card',         // 番茄专注
        'habit-tracker': 'habit-tracker-feature-card', // 习惯打卡
        'countdown': 'countdown-feature-card',        // 倒数日
        'time-tracker': 'time-tracker-feature-card',  // 时间管理可视化看板
        'calendar': 'calendar-feature-card'           // 沉浸式日历
    };

    console.log('🔧 主导航栏菜单映射:', mainMenuItems);
    console.log('🔧 更多功能卡片映射:', moreFeatureCards);
    console.log('🔧 用户权限数组:', permissions);
    console.log('🔧 权限数量:', permissions.length);

    // === 第1步：隐藏所有主导航栏菜单项 ===
    console.log('--- 隐藏所有主导航栏菜单项 ---');
    Object.values(mainMenuItems).forEach(menuId => {
        const menuElement = document.getElementById(menuId);
        if (menuElement) {
            menuElement.style.display = 'none';
            console.log('✅ 隐藏主菜单:', menuId);
        } else {
            console.log('⚠️ 主菜单元素不存在:', menuId);
        }
    });

    // === 第2步：隐藏所有更多功能卡片 ===
    console.log('--- 隐藏所有更多功能卡片 ---');
    Object.values(moreFeatureCards).forEach(cardId => {
        const cardElement = document.getElementById(cardId);
        if (cardElement) {
            cardElement.style.display = 'none';
            console.log('✅ 隐藏功能卡片:', cardId);
        } else {
            console.log('⚠️ 功能卡片元素不存在:', cardId);
        }
    });

    // === 第3步：根据权限显示菜单项 ===
    console.log('--- 根据权限显示菜单项 ---');
    let hasMoreFeatures = false; // 标记是否有更多功能权限

    if (permissions && permissions.length > 0) {
        // 🔧 特殊处理关键权限
        const criticalPermissions = ['review', 'templates'];
        const criticalStatus = {
            review: permissions.includes('review'),
            templates: permissions.includes('templates')
        };

        console.log('🔧 关键权限状态:', criticalStatus);

        permissions.forEach(permission => {
            // 显示主导航栏菜单
            const menuId = mainMenuItems[permission];
            if (menuId) {
                const menuElement = document.getElementById(menuId);
                if (menuElement) {
                    menuElement.style.display = 'flex'; // 使用flex而不是block
                    console.log('✅ 显示主菜单:', menuId, '权限:', permission);

                    // 🔧 特别标记关键权限
                    if (criticalPermissions.includes(permission)) {
                        console.log(`🔑 关键权限菜单已显示: ${permission}`);
                    }
                } else {
                    console.log('⚠️ 主菜单元素不存在:', menuId, '权限:', permission);
                }
            }

            // 显示更多功能卡片
            const cardId = moreFeatureCards[permission];
            if (cardId) {
                const cardElement = document.getElementById(cardId);
                if (cardElement) {
                    cardElement.style.display = 'block';
                    hasMoreFeatures = true;
                    console.log('✅ 显示功能卡片:', cardId, '权限:', permission);
                } else {
                    console.log('⚠️ 功能卡片元素不存在:', cardId, '权限:', permission);
                }
            }
        });

        // 🔧 验证关键权限是否正确显示
        setTimeout(() => {
            const reviewElement = document.getElementById('review-tab-btn');
            const templatesElement = document.getElementById('templates-tab-btn');

            console.log('🔧 关键权限菜单验证:');
            console.log('  - review-tab-btn 存在:', !!reviewElement);
            console.log('  - review-tab-btn 显示:', reviewElement ? reviewElement.style.display : 'N/A');
            console.log('  - templates-tab-btn 存在:', !!templatesElement);
            console.log('  - templates-tab-btn 显示:', templatesElement ? templatesElement.style.display : 'N/A');

            if (criticalStatus.review && (!reviewElement || reviewElement.style.display === 'none')) {
                console.warn('⚠️ review权限存在但菜单未显示，尝试强制显示');
                if (reviewElement) {
                    reviewElement.style.display = 'flex';
                }
            }

            if (criticalStatus.templates && (!templatesElement || templatesElement.style.display === 'none')) {
                console.warn('⚠️ templates权限存在但菜单未显示，尝试强制显示');
                if (templatesElement) {
                    templatesElement.style.display = 'flex';
                }
            }
        }, 100);

    } else {
        console.log('⚠️ 用户无权限或权限为空，默认显示所有功能卡片');
        // 🔧 当用户无权限时，默认显示所有6个功能卡片
        Object.values(moreFeatureCards).forEach(cardId => {
            const cardElement = document.getElementById(cardId);
            if (cardElement) {
                cardElement.style.display = 'block';
                console.log('✅ 默认显示功能卡片:', cardId);
            }
        });
        hasMoreFeatures = true;
    }

    // 🔧 移除错误的强制显示逻辑 - 只有有权限的功能才应该显示

    // === 第4步：根据是否有更多功能权限，显示/隐藏“更多功能”标签页 ===
    const moreFeaturesTabBtn = document.getElementById('more-features-tab-btn');
    if (moreFeaturesTabBtn) {
        if (hasMoreFeatures) {
            moreFeaturesTabBtn.style.display = '';
            console.log('✅ 显示“更多功能”标签页');
        } else {
            moreFeaturesTabBtn.style.display = 'none';
            console.log('❌ 隐藏“更多功能”标签页（用户无任何更多功能权限）');
        }
    }

    // 智能调整导航栏背景框长度
    adjustNavigationBarWidth();

    // 🔧 强制权限同步：确保权限显示与后台数据一致
    forcePermissionSyncFromStorage();

    // 🔧 强制刷新更多功能菜单显示
    setTimeout(() => {
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.permissions &&
            currentUser.permissions.some(p => ['fortune', 'pomodoro', 'habit-tracker', 'countdown', 'time-tracker', 'calendar'].includes(p))) {
            const moreFeaturesTabBtn = document.getElementById('more-features-tab-btn');
            if (moreFeaturesTabBtn) {
                moreFeaturesTabBtn.style.display = '';
                console.log('🔧 强制显示更多功能标签页');
            }
        }
    }, 200);

    // 🔧 立即强制显示更多功能菜单（备用方案）
    setTimeout(() => {
        const moreFeaturesTabBtn = document.getElementById('more-features-tab-btn');
        if (moreFeaturesTabBtn) {
            moreFeaturesTabBtn.style.display = '';
            console.log('🔧 立即强制显示更多功能菜单');

            // 显示后立即调整导航栏宽度
            setTimeout(() => {
                adjustNavigationBarWidth();
            }, 50);
        }
    }, 300);

    console.log('=== 菜单权限更新完成 ===');

    // 🔧 清除更新标志
    setTimeout(() => {
        window._menuVisibilityUpdating = false;
    }, 100);
}

// 🔧 强制权限同步函数
function forcePermissionSyncFromStorage() {
    // 减少控制台输出频率
    if (!window._lastSyncTime || Date.now() - window._lastSyncTime > 5000) {
        console.log('🔧 强制权限同步中...');
        window._lastSyncTime = Date.now();
    }

    try {
        // 从localStorage读取最新的用户数据
        const users = window.UserStorage.getUsers();
        const sessionData = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');

        if (sessionData) {
            const session = JSON.parse(sessionData);
            const currentUser = session.user;

            if (currentUser) {
                // 从用户数据中获取最新权限
                const latestUser = users.find(u => u.username === currentUser.username);

                if (latestUser && latestUser.permissions) {
                    // 强制更新会话中的权限
                    session.user.permissions = latestUser.permissions;
                    // 使用安全方法保存，不包含敏感凭据
                    const sanitizedSession = sanitizeSession(session);
                    window.SessionStorage.setSession(sanitizedSession, { remember: true });

                    // 强制更新全局变量
                    if (typeof window.currentUser !== 'undefined') {
                        window.currentUser.permissions = latestUser.permissions;
                    }

                    console.log('✅ 权限已同步:', latestUser.permissions);

                    // 如果权限变化，立即重新应用菜单显示
                    if (sessionData) {
                        const oldSession = JSON.parse(sessionData);
                        const oldPermissions = oldSession.user.permissions;
                        const newPermissions = latestUser.permissions;

                        // 权限发生变化，重新应用显示
                        if (JSON.stringify(oldPermissions.sort()) !== JSON.stringify(newPermissions.sort())) {
                            console.log('🔄 检测到权限变化，重新应用菜单显示...');

                            // 重新执行权限显示逻辑
                            const mainMenuItems = {
                                'add-task': 'list-tab-btn',
                                'quadrant-view': 'quadrant-tab-btn',
                                'fortune': 'fortune-tab-btn',
                                'dashboard': 'dashboard-tab-btn',
                                'review': 'review-tab-btn',
                                'templates': 'templates-tab-btn',
                                'more-features': 'more-features-tab-btn'
                            };

                            // 先隐藏所有菜单
                            Object.values(mainMenuItems).forEach(menuId => {
                                const menu = document.getElementById(menuId);
                                if (menu) menu.style.display = 'none';
                            });

                            // 只显示有权限的菜单
                            newPermissions.forEach(permission => {
                                const menuId = mainMenuItems[permission];
                                if (menuId) {
                                    const menu = document.getElementById(menuId);
                                    if (menu) menu.style.display = 'flex';
                                }
                            });
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ 权限同步失败:', error);
    }
}

// 智能调整导航栏背景框长度
function adjustNavigationBarWidth() {
    const tabsContainer = document.querySelector('.tabs');
    if (!tabsContainer) {
        console.log('❌ 未找到导航栏容器');
        return;
    }

    // 获取所有可见的菜单项
    const visibleButtons = Array.from(tabsContainer.querySelectorAll('.tab-button')).filter(btn =>
        btn.style.display !== 'none' && btn.offsetParent !== null
    );

    console.log('可见菜单项数量:', visibleButtons.length);

    if (visibleButtons.length === 0) {
        console.log('⚠️ 没有可见的菜单项');
        return;
    }

    // 临时显示所有按钮来准确计算宽度
    visibleButtons.forEach(btn => {
        if (btn.style.display && btn.style.display !== 'none') {
            btn.style.removeProperty('display');
        }
    });

    // 强制重排以确保DOM更新
    tabsContainer.offsetHeight;

    // 计算总宽度
    let totalWidth = 0;
    visibleButtons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        totalWidth += rect.width;
        console.log(`按钮宽度: ${btn.textContent.trim()} = ${rect.width}px`);
    });

    // 添加间距（按钮之间的间距）
    const gap = 8; // 8px 间距
    const totalGap = (visibleButtons.length - 1) * gap;
    totalWidth += totalGap;

    // 添加内边距
    const padding = 40; // 20px 左右内边距
    totalWidth += padding;

    console.log('计算的总宽度:', totalWidth + 'px');

    // 根据菜单数量智能计算合适宽度
    let optimalWidth;
    if (visibleButtons.length === 6) {
        // 6个菜单项时，使用计算出的实际宽度625.625px
        optimalWidth = 625.625;
        console.log('6个菜单项，使用计算宽度: 625.625px');
    } else if (visibleButtons.length === 5) {
        // 5个菜单项时，约580px
        optimalWidth = 580;
        console.log('5个菜单项，使用推荐宽度: 580px');
    } else if (visibleButtons.length === 4) {
        // 4个菜单项时，约480px
        optimalWidth = 480;
        console.log('4个菜单项，使用推荐宽度: 480px');
    } else if (visibleButtons.length === 3) {
        // 3个菜单项时，约380px
        optimalWidth = 380;
        console.log('3个菜单项，使用推荐宽度: 380px');
    } else if (visibleButtons.length <= 2) {
        // 2个或更少菜单时，基于实际内容宽度，最小280px
        optimalWidth = Math.max(totalWidth, 280);
        console.log('2个或更少菜单，基于内容计算宽度:', optimalWidth + 'px');
    } else {
        // 超过6个菜单时，基于实际内容宽度
        optimalWidth = Math.max(totalWidth, 700);
        console.log('超过6个菜单，基于内容计算宽度:', optimalWidth + 'px');
    }

    console.log('=== 导航栏宽度调试信息 ===');
    console.log('菜单项数量:', visibleButtons.length);
    console.log('计算的总宽度:', totalWidth + 'px');
    console.log('最终导航栏宽度:', optimalWidth + 'px');
    console.log('=======================');

    // 设置容器宽度
    tabsContainer.style.removeProperty('width');
    tabsContainer.style.removeProperty('max-width');
    tabsContainer.style.removeProperty('min-width');
    tabsContainer.style.removeProperty('margin');

    // 添加过渡动画
    tabsContainer.style.removeProperty('transition');

    console.log('✅ 导航栏宽度由CSS统一控制，菜单项数量:', visibleButtons.length);
}

// 检查登录状态
function checkLoginStatus() {
    // 如果是从登录页跳转过来的，稍微延迟一下，确保会话数据已写入
    const isFromLogin = document.referrer.includes('login.html') ||
        window.location.search.includes('from=login');

    if (isFromLogin) {
        console.log('🔍 检测到从登录页跳转，延迟检查登录状态...');
        setTimeout(() => {
            performLoginCheck();
        }, 200);
        return;
    }

    performLoginCheck();
}

function performLoginCheck() {
    // 先检查旧的userSession格式，再检查新的app_session (JWT)格式
    let sessionData = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
    if (!sessionData) {
        sessionData = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
    }

    // 如果没有userSession，检查app_session (JWT格式)
    let isJwtSession = false;
    if (!sessionData) {
        sessionData = (window.SessionStorage.getSession('app_session') ? JSON.stringify(window.SessionStorage.getSession('app_session')) : '');
        if (!sessionData) {
            sessionData = (window.SessionStorage.getSession('app_session') ? JSON.stringify(window.SessionStorage.getSession('app_session')) : '');
        }
        if (sessionData) {
            isJwtSession = true;
        }
    }

    console.log('🔐 检查登录状态');
    console.log('📍 当前页面路径:', window.location.pathname);
    console.log('📋 localStorage会话(userSession):', (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '') ? '存在' : '不存在');
    console.log('📋 sessionStorage会话(userSession):', (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '') ? '存在' : '不存在');
    console.log('📋 localStorage JWT会话(app_session):', (window.SessionStorage.getSession('app_session') ? JSON.stringify(window.SessionStorage.getSession('app_session')) : '') ? '存在' : '不存在');
    console.log('📋 会话类型:', isJwtSession ? 'JWT (app_session)' : '传统 (userSession)');
    console.log('📋 会话数据:', sessionData ? sessionData.substring(0, 100) + '...' : 'null');

    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);

            // 处理JWT格式的会话
            if (isJwtSession) {
                console.log('📋 解析JWT会话:', session);

                // 检查JWT是否过期
                if (session.expiresAt && session.expiresAt < Date.now()) {
                    console.error('❌ JWT会话已过期');
                    window.SessionStorage.clearSessions(['app_session']);
                    window.SessionStorage.clearSessions(['app_session']);
                    isLoggedIn = false;
                    currentUser = null;

                    if (!window.location.pathname.includes('login.html')) {
                        console.log('🔄 JWT已过期，跳转到登录页');
                        window.location.href = 'login.html';
                    }
                    return false;
                }

                // 从JWT中提取用户信息
                if (session.accessToken) {
                    try {
                        // 简单解析JWT payload（无需验证签名，已检查过期时间）
                        const payload = JSON.parse(atob(session.accessToken.split('.')[1]));

                        currentUser = {
                            id: payload.userId || payload.sub,
                            username: payload.username,
                            email: payload.email || '',
                            role: payload.role,
                            permissions: payload.permissions || []
                        };

                        // 同步localStorage中的最新权限
                        const users = window.UserStorage.getUsers();
                        const storedUserData = users.find(u => u.username === currentUser.username);

                        if (storedUserData && storedUserData.permissions) {
                            currentUser.permissions = [...storedUserData.permissions];
                            console.log('✅ 从localStorage同步权限:', currentUser.permissions);
                        }

                        isLoggedIn = true;
                        console.log('✅ JWT用户已登录:', currentUser.username, 'ID:', currentUser.id);
                        console.log('🔧 JWT用户权限:', currentUser.permissions);

                        updateUIForLoggedInUser();
                        updateMenuVisibility();
                        loadTasksFromStorage();
                        if (typeof render === 'function') {
                            render();
                        }

                        return true;
                    } catch (jwtError) {
                        console.error('❌ 解析JWT失败:', jwtError);
                        window.SessionStorage.clearSessions(['app_session']);
                        window.SessionStorage.clearSessions(['app_session']);
                        isLoggedIn = false;
                        currentUser = null;

                        if (!window.location.pathname.includes('login.html')) {
                            console.log('🔄 JWT解析失败，跳转到登录页');
                            window.location.href = 'login.html';
                        }
                        return false;
                    }
                } else {
                    console.error('❌ app_session缺少accessToken');
                    window.SessionStorage.clearSessions(['app_session']);
                    window.SessionStorage.clearSessions(['app_session']);
                    isLoggedIn = false;
                    currentUser = null;

                    if (!window.location.pathname.includes('login.html')) {
                        console.log('🔄 app_session格式错误，跳转到登录页');
                        window.location.href = 'login.html';
                    }
                    return false;
                }
            }

            // 处理传统格式的会话 (userSession)
            console.log('📋 解析传统会话:', session);

            // 检查会话数据格式
            if (!session.user) {
                console.error('❌ 会话数据格式错误：缺少user字段');
                window.SessionStorage.clearSessions(['userSession']);
                window.SessionStorage.clearSessions(['userSession']);
                isLoggedIn = false;
                currentUser = null;

                // 如果不在登录页，跳转到登录页
                if (!window.location.pathname.includes('login.html')) {
                    console.log('🔄 跳转到登录页');
                    window.location.href = 'login.html';
                }
                return false;
            }

            // 检查登录时间
            if (session.loginTime) {
                const loginTime = new Date(session.loginTime);
                const now = new Date();
                const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);

                console.log('⏰ 登录时间:', loginTime);
                console.log('⏰ 当前时间:', now);
                console.log('⏰ 登录时间差:', daysDiff.toFixed(2), '天');

                // 如果登录时间超过30天，需要重新登录
                if (daysDiff >= 30) {
                    console.log('⚠️ 登录会话已过期（超过30天）');
                    // 清除过期会话
                    window.SessionStorage.clearSessions(['userSession']);
                    window.SessionStorage.clearSessions(['userSession']);
                    isLoggedIn = false;
                    currentUser = null;

                    // 如果不在登录页，跳转到登录页
                    if (!window.location.pathname.includes('login.html')) {
                        console.log('🔄 跳转到登录页');
                        window.location.href = 'login.html';
                    }
                    return false;
                }
            }

            // 登录状态有效
            currentUser = ensureUserPermissions(session.user);
            session.user = currentUser;
            isLoggedIn = true;

            console.log('✅ 用户已登录:', currentUser.username, 'ID:', currentUser.id);
            console.log('🔧 用户权限:', currentUser.permissions);

            // 🔧 权限同步：从localStorage获取最新的管理员设置
            const users = window.UserStorage.getUsers();
            const storedUserData = users.find(u => u.username === currentUser.username);

            if (storedUserData && storedUserData.permissions) {
                // 使用localStorage中管理员设置的权限（适用于所有用户，包括管理员）
                currentUser.permissions = [...storedUserData.permissions];
                session.user.permissions = [...storedUserData.permissions];
                console.log('✅ 从localStorage同步管理员设置的权限:', currentUser.permissions);
            }

            // 保存更新后的会话（安全存储，不包含敏感凭据）
            const sanitizedSession = sanitizeSession(session);
            window.SessionStorage.setSession(sanitizedSession, { remember: true });

            updateUIForLoggedInUser();

            // 更新菜单权限
            updateMenuVisibility();

            // 加载用户数据
            loadTasksFromStorage();
            if (typeof render === 'function') {
                render();
            }

            return true;
        } catch (error) {
            console.error('❌ 解析用户会话失败:', error);
            console.error('❌ 错误详情:', error.message);
            console.log('Session data state checked.');
            window.SessionStorage.clearSessions(['userSession']);
            window.SessionStorage.clearSessions(['userSession']);
            isLoggedIn = false;
            currentUser = null;

            // 如果不在登录页，跳转到登录页
            if (!window.location.pathname.includes('login.html')) {
                console.log('🔄 解析失败，跳转到登录页');
                window.location.href = 'login.html';
            }
            return false;
        }
    }

    // 未登录状态
    isLoggedIn = false;
    currentUser = null;

    console.log('⚠️ 用户未登录，当前页面:', window.location.pathname);

    // 检查当前页面是否是登录页，如果不是则跳转到登录页
    if (!window.location.pathname.includes('login.html')) {
        console.log('🔄 用户未登录，跳转到登录页');
        window.location.href = 'login.html';
        return false;
    }

    updateUIForGuestUser();
    return false;
}

// 监听数据导入事件，自动刷新页面数据
window.addEventListener('dataImported', function (event) {
    console.log('📥 收到数据导入事件:', event.detail);

    const { userId, hasTasks, taskCount } = event.detail || {};

    // 重新检查登录状态
    checkLoginStatus();

    // 重新加载任务数据
    if (typeof loadTasksFromStorage === 'function') {
        console.log('🔄 重新加载任务数据...');
        loadTasksFromStorage();
    }

    // 重新渲染页面
    if (typeof render === 'function') {
        console.log('🔄 重新渲染页面...');
        setTimeout(() => {
            render();
        }, 300);
    }

    // 重新加载任务（如果函数存在）
    if (typeof loadTasks === 'function') {
        console.log('🔄 调用loadTasks函数...');
        setTimeout(() => {
            loadTasks();
        }, 300);
    }

    // 重新初始化用户头像
    if (typeof initializeUserAvatar === 'function') {
        console.log('🔄 重新初始化用户头像...');
        setTimeout(() => {
            initializeUserAvatar();
        }, 300);
    }

    console.log('✅ 数据导入后页面刷新完成');

    // 显示提示
    if (hasTasks && taskCount > 0) {
        showNotification(`数据导入成功！已加载 ${taskCount} 个任务`, 'success');
    } else {
        showNotification('数据导入成功！页面已更新', 'success');
    }
});

// 更新UI为已登录用户
function updateUIForLoggedInUser() {
    if (!currentUser) return;

    // 显示用户信息
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const centerTitles = document.getElementById('center-titles');

    if (userInfo) {
        userInfo.style.display = 'flex';
        document.getElementById('user-name').textContent = currentUser.username || '用户';
    }

    if (loginBtn) {
        loginBtn.style.display = 'none';
    }

    // 保持品牌标语显示（用户要求登录后也要显示）
    if (centerTitles) {
        centerTitles.classList.remove('hidden');
    }

    // 初始化用户头像（修复刷新后头像恢复默认的问题）
    initializeUserAvatar();
}

// 更新UI为访客用户
function updateUIForGuestUser() {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const centerTitles = document.getElementById('center-titles');

    if (userInfo) {
        userInfo.style.display = 'none';
    }

    if (loginBtn) {
        loginBtn.style.display = 'flex';
    }

    // 显示品牌标语
    if (centerTitles) {
        centerTitles.classList.remove('hidden');
    }
}

// 用户菜单功能
function initUserMenu() {
    const userInfo = document.getElementById('user-info');
    const userDropdown = document.getElementById('user-dropdown');
    const profileItem = document.getElementById('profile-item');
    const settingsItem = document.getElementById('settings-item');
    const logoutItem = document.getElementById('logout-item');

    if (userInfo && userDropdown) {
        userInfo.addEventListener('click', function (e) {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
        });

        // 点击其他地方关闭菜单
        document.addEventListener('click', function () {
            userDropdown.style.display = 'none';
        });
    }

    // 个人资料
    if (profileItem) {
        profileItem.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            userDropdown.style.display = 'none';
            // 在下一帧打开，避免与下拉收起动画冲突
            requestAnimationFrame(() => showProfileModal());
        });
    }

    // 账户设置
    if (settingsItem) {
        settingsItem.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            userDropdown.style.display = 'none';
            requestAnimationFrame(() => showSettingsModal());
        });
    }

    // 退出登录
    if (logoutItem) {
        logoutItem.addEventListener('click', function () {
            logout();
            userDropdown.style.display = 'none';
        });
    }
}

// 登录功能
function initLoginFeature() {
    const loginBtn = document.getElementById('login-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', function () {
            window.location.href = 'login.html';
        });
    }
}

// 退出登录
async function logout() {
    const confirmed = await showConfirmModal({
        title: '退出登录',
        message: '确定要退出登录吗？',
        type: 'warning',
        confirmText: '退出',
        cancelText: '取消'
    });
    if (confirmed) {
        try {
            // 清除用户会话
            window.SessionStorage.clearSessions(['userSession']);
            window.SessionStorage.clearSessions(['userSession']);

            // 重置状态
            currentUser = null;
            isLoggedIn = false;

            // 更新UI
            updateUIForGuestUser();

            // 显示通知
            showNotification('已退出登录', 'info');

            // 延迟跳转到登录页面，确保通知显示
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);

            // 可选：清除本地任务数据（根据需求决定）
            // window.DataSyncStorage.removeRaw('tasks');
            // tasks = [];
            // renderTasks();
        } catch (error) {
            console.error('退出登录时发生错误:', error);
            // 即使出错也要跳转到登录页面
            window.location.href = 'login.html';
        }
    }
}

// 获取用户特定的存储键
function getUserStorageKey(key) {
    if (isLoggedIn && currentUser) {
        return `${key}_${currentUser.id}`;
    }
    return key;
}

// 保存任务数据（用户特定）
function saveTasksToStorage() {
    const storageKey = getUserStorageKey('tasks');
    const tasksToStore = window.TaskStorage
        ? window.TaskStorage.setTasks(storageKey, tasks)
        : tasks;
    const serializedTasks = JSON.stringify(tasksToStore);
    if (!window.TaskStorage) {
        window.DataSyncStorage.setRaw(storageKey, serializedTasks);
    }

    if (isLoggedIn && currentUser) {
        const fallbackKeys = new Set();
        if (currentUser.username) fallbackKeys.add(`tasks_${currentUser.username}`);
        if (currentUser.email) fallbackKeys.add(`tasks_${currentUser.email}`);
        if (currentUser.phone) fallbackKeys.add(`tasks_${currentUser.phone}`);

        fallbackKeys.forEach(key => {
            window.DataSyncStorage.setRaw(key, serializedTasks);
        });
    }
}

// 加载任务数据（用户特定）
function loadTasksFromStorage() {
    const triedKeys = [];
    const seenKeys = new Set();
    const candidateKeys = [];

    if (isLoggedIn && currentUser) {
        candidateKeys.push(`tasks_${currentUser.id}`);
        if (currentUser.username) candidateKeys.push(`tasks_${currentUser.username}`);
        if (currentUser.email) candidateKeys.push(`tasks_${currentUser.email}`);
        if (currentUser.phone) candidateKeys.push(`tasks_${currentUser.phone}`);
    }
    candidateKeys.push('tasks');

    let savedTasksRaw = null;
    let usedKey = null;

    candidateKeys.forEach(key => {
        if (!key || seenKeys.has(key)) return;
        seenKeys.add(key);
        triedKeys.push(key);
        if (savedTasksRaw) return;
        const value = window.DataSyncStorage.getRaw(key);
        if (value) {
            savedTasksRaw = value;
            usedKey = key;
        }
    });

    console.log('📦 loadTasksFromStorage 尝试键:', triedKeys, '命中:', usedKey || '无');

    if (savedTasksRaw) {
        try {
            tasks = window.TaskStorage
                ? window.TaskStorage.parseTasks(savedTasksRaw)
                : JSON.parse(savedTasksRaw) || [];
        } catch (error) {
            console.error('加载任务数据失败:', error);
            tasks = [];
        }
    } else {
        tasks = [];
    }

    // 同步到全局 window.tasks，供可视化图表模块使用
    syncTasksToWindow();
}

let tasks = [];
let sortMode = window.DataSyncStorage.getRaw('sort_mode') || 'default';
let templates = []; // 任务模板数组

// ==================== 可视化图表数据同步 ====================
/**
 * 同步任务数据到全局 window.tasks，供可视化图表模块使用
 */
function syncTasksToWindow() {
    window.tasks = tasks;
    // 同时暴露用户信息，供图表模块获取正确的存储键
    window.currentUser = currentUser;
    window.isLoggedIn = isLoggedIn;
}

// ==================== API 自动同步 ====================

/**
 * 自动同步任务数据到 API 服务器
 */
function syncToAPI() {
    // 检查是否启用了 API 同步（全局开关）
    const enableAPISync = window.DataSyncStorage.getRaw('enableAPISync') === 'true';

    if (!enableAPISync) {
        return; // 未启用则跳过
    }

    // 检查当前用户是否有 api-sync 权限
    if (typeof currentUser === 'undefined' || !currentUser ||
        !Array.isArray(currentUser.permissions) ||
        !currentUser.permissions.includes('api-sync')) {
        return; // 当前用户无 API 同步权限
    }

    // 防抖处理，避免频繁请求
    if (syncToAPI.pending) {
        clearTimeout(syncToAPI.pending);
    }

    syncToAPI.pending = setTimeout(async () => {
        try {
            const response = await fetch('http://localhost:30301/api/tasks/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: tasks })
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ 已自动同步 ${data.count} 个任务到 API 服务器`);
            }
        } catch (error) {
            // 静默失败，不干扰用户操作
            console.debug('API 同步失败（服务器可能未运行）:', error.message);
        }

        syncToAPI.pending = null;
    }, 1000); // 延迟 1 秒执行
}

/**
 * 初始化 API 自动同步
 */
function initAPISync() {
    const enableAPISync = window.DataSyncStorage.getRaw('enableAPISync') === 'true';

    // 检查当前用户是否有 api-sync 权限
    const hasPermission = typeof currentUser !== 'undefined' && currentUser &&
        Array.isArray(currentUser.permissions) &&
        currentUser.permissions.includes('api-sync');

    // 尝试更新卡片状态（卡片已迁移到管理后台，此处安全降级）
    try { updateAPISyncCardStatus(); } catch (e) { /* 卡片已移除，静默忽略 */ }

    if (enableAPISync && hasPermission) {
        console.log('✅ API 自动同步已启用');

        // 页面加载后立即同步一次
        setTimeout(() => {
            syncToAPI();
        }, 3000);

        // 设置定期同步（每 60 秒）
        setInterval(() => {
            syncToAPI();
        }, 60000);
    }
}
let currentEditingId = null;
let currentView = 'list';
let quadrantViewMode = window.DataSyncStorage.getRaw('quadrantViewMode') || 'grid'; // 四象限视图模式: 'grid' 或 'list'
let expandedQuadrant = null;
let reminderInterval = null;
let notifiedTasks = new Set();
let notificationPermission = 'default'; // 桌面通知权限状态

// ==================== DOM缓存（性能优化） ====================
// 缓存视图切换时频繁访问的DOM元素，避免重复查询
let domCache = {
    views: null,
    tabButtons: null,
    initialized: false
};

/**
 * 初始化DOM缓存（只执行一次）
 */
function initDomCache() {
    if (domCache.initialized) return;

    domCache.views = {
        listView: document.getElementById('list-view'),
        quadrantView: document.getElementById('quadrant-view'),
        fortuneView: document.getElementById('fortune-view'),
        dashboardView: document.getElementById('dashboard-view'),
        reviewView: document.getElementById('review-view'),
        templatesView: document.getElementById('templates-view'),
        moreFeaturesView: document.getElementById('more-features-view'),
        pomodoroView: document.getElementById('pomodoro-view'),
        countdownView: document.getElementById('countdown-view'),
        habitTrackerView: document.getElementById('habit-tracker-view'),
        timeTrackerView: document.getElementById('time-tracker-view'),
        calendarProView: document.getElementById('calendar-pro-view')
    };

    domCache.tabButtons = document.querySelectorAll('.tab-button');
    domCache.taskActions = document.getElementById('task-actions');
    domCache.moreFeaturesTabBtn = document.getElementById('more-features-tab-btn');
    domCache.initialized = true;

    console.log('✅ DOM缓存已初始化');
}

/**
 * 获取缓存的视图元素
 */
function getCachedViews() {
    if (!domCache.initialized) {
        initDomCache();
    }
    return domCache.views;
}

/**
 * 获取缓存的tab按钮
 */
function getCachedTabButtons() {
    if (!domCache.initialized) {
        initDomCache();
    }
    return domCache.tabButtons;
}

const DEFAULT_USER_PERMISSIONS = [
    'add-task',
    'quadrant-view'
];

const QUADRANT_SCROLL_THRESHOLD = 6; // 【关键配置】超过5条任务（6条及以上）时显示滚动条 - 2025-12-29

// ==================== 四象限视图模式切换 ====================
/**
 * 保存四象限视图模式到 localStorage
 * @param {string} mode - 视图模式: 'grid' 或 'list'
 */
function saveQuadrantViewMode(mode) {
    try {
        window.DataSyncStorage.setRaw('quadrantViewMode', mode);
        console.log('✅ 四象限视图模式已保存:', mode);
    } catch (error) {
        console.error('❌ 保存四象限视图模式失败:', error);
    }
}

/**
 * 从 localStorage 加载四象限视图模式
 * @returns {string} 视图模式: 'grid' 或 'list'
 */
function loadQuadrantViewMode() {
    try {
        const mode = window.DataSyncStorage.getRaw('quadrantViewMode');
        return mode && (mode === 'grid' || mode === 'list') ? mode : 'grid';
    } catch (error) {
        console.error('❌ 加载四象限视图模式失败:', error);
        return 'grid';
    }
}

/**
 * 设置四象限视图模式
 * @param {string} mode - 视图模式: 'grid' 或 'list'
 */
function setQuadrantViewMode(mode) {
    if (mode !== 'grid' && mode !== 'list') {
        console.warn('⚠️ 无效的四象限视图模式:', mode);
        return;
    }

    quadrantViewMode = mode;
    const container = document.getElementById('quadrant-view');

    if (!container) {
        console.error('❌ 找不到四象限视图容器');
        return;
    }

    // 只添加或移除 list-mode 类（网格模式是默认的，不需要类）
    if (mode === 'list') {
        container.classList.add('list-mode');
    } else {
        container.classList.remove('list-mode');
    }

    // 更新切换按钮状态
    updateViewModeToggleButton(mode);

    // 保存到 localStorage
    saveQuadrantViewMode(mode);

    // 更新象限卡片的点击事件
    updateQuadrantClickHandlers(mode);

    // 重新初始化拖拽功能，以适应新的布局模式
    // 延迟执行以确保DOM更新完成
    setTimeout(() => {
        initSortable();
        console.log(`🔄 视图模式切换后拖拽功能已重新初始化`);
    }, 100);

    console.log(`✅ 四象限视图模式已切换为: ${mode === 'grid' ? '网格模式' : '列表模式'}`);
}

/**
 * 处理象限卡片点击展开（仅列表模式）
 * 注意：此功能已禁用
 */
function handleQuadrantClick(e) {
    // 此功能已禁用，直接返回
    return;
}

/**
 * 更新象限卡片的点击事件处理器
 * 注意：列表模式的点击展开功能已禁用
 * @param {string} mode - 当前视图模式
 */
function updateQuadrantClickHandlers(mode) {
    const quadrants = document.querySelectorAll('.quadrant-view .quadrant');

    quadrants.forEach(quadrant => {
        // 移除旧的事件监听器
        quadrant.removeEventListener('click', handleQuadrantClick);
        // 移除提示文字
        quadrant.title = '';
    });
}

/**
 * 切换四象限视图模式
 */
function toggleQuadrantViewMode() {
    const newMode = quadrantViewMode === 'grid' ? 'list' : 'grid';
    setQuadrantViewMode(newMode);
}

/**
 * 更新视图切换按钮的状态
 * @param {string} mode - 当前视图模式: 'grid' 或 'list'
 */
function updateViewModeToggleButton(mode) {
    const toggleBtn = document.getElementById('view-mode-toggle');
    if (!toggleBtn) {
        console.warn('⚠️ 找不到视图模式切换按钮');
        return;
    }

    const icon = toggleBtn.querySelector('.material-icons');
    const label = toggleBtn.querySelector('.toolbar-btn-label');

    if (mode === 'grid') {
        if (icon) icon.textContent = 'grid_view';
        if (label) label.textContent = '网格';
        toggleBtn.title = '切换到列表模式（一排横排）';
    } else {
        if (icon) icon.textContent = 'view_list';
        if (label) label.textContent = '列表';
        toggleBtn.title = '切换到网格模式（四象限）';
    }

    // 根据当前视图控制按钮显示
    updateViewModeToggleButtonVisibility();
}

/**
 * 更新视图模式切换按钮的可见性
 * 只在四象限视图模式下显示
 */
function updateViewModeToggleButtonVisibility() {
    const toolbar = document.querySelector('.quadrant-toolbar');
    if (!toolbar) return;
    toolbar.style.display = (currentView === 'quadrant') ? '' : 'none';
}

/**
 * 初始化四象限视图模式
 */
function initializeQuadrantViewMode() {
    const savedMode = loadQuadrantViewMode();
    setQuadrantViewMode(savedMode);
    console.log('✅ 四象限视图模式已初始化:', savedMode === 'grid' ? '网格模式' : '列表模式');
}

// ==================== 统一模态对话框组件 ====================
/**
 * 显示统一的模态确认对话框
 * @param {Object} options - 对话框配置
 * @param {string} options.title - 对话框标题
 * @param {string} options.message - 对话框内容
 * @param {string} options.confirmText - 确认按钮文字（默认：确定）
 * @param {string} options.cancelText - 取消按钮文字（默认：取消）
 * @param {string} options.type - 对话框类型：'danger'（危险操作，红色确认按钮）| 'warning' | 'info' | 'success'
 * @param {Function} options.onConfirm - 确认回调
 * @param {Function} options.onCancel - 取消回调
 * @returns {Promise<boolean>} - 返回Promise，true表示确认，false表示取消
 */
function showConfirmModal(options = {}) {
    return new Promise((resolve) => {
        const {
            title = '确认操作',
            message = '确定要执行此操作吗？',
            confirmText = '确定',
            cancelText = '取消',
            type = 'info',
            onConfirm,
            onCancel
        } = options;

        // 移除已存在的模态框
        const existingModal = document.getElementById('unified-confirm-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // 添加到页面
        const modal = createUnifiedConfirmModal({
            title,
            message,
            confirmText,
            cancelText,
            type
        });
        document.body.appendChild(modal);
        const mask = modal.querySelector('.unified-confirm-modal-mask');
        const closeBtn = modal.querySelector('.unified-confirm-modal-close');
        const cancelBtn = modal.querySelector('.unified-confirm-modal-btn-cancel');
        const confirmBtn = modal.querySelector('.unified-confirm-modal-btn-confirm');

        // 显示动画
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);

        // 关闭函数
        const close = (confirmed = false) => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
                if (confirmed) {
                    if (onConfirm) onConfirm();
                    resolve(true);
                } else {
                    if (onCancel) onCancel();
                    resolve(false);
                }
            }, 300);
        };

        // 绑定事件
        confirmBtn.addEventListener('click', () => close(true));
        cancelBtn.addEventListener('click', () => close(false));
        closeBtn.addEventListener('click', () => close(false));
        mask.addEventListener('click', () => close(false));

        // ESC键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                close(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

function createUnifiedConfirmModal({ title, message, confirmText, cancelText, type }) {
    const safeType = ['danger', 'warning', 'info', 'success'].includes(type) ? type : 'info';
    const iconMap = {
        danger: 'warning',
        warning: 'info',
        info: 'help_outline',
        success: 'check_circle'
    };

    const modal = document.createElement('div');
    modal.id = 'unified-confirm-modal';
    modal.className = 'unified-confirm-modal';

    const mask = document.createElement('div');
    mask.className = 'unified-confirm-modal-mask';

    const content = document.createElement('div');
    content.className = 'unified-confirm-modal-content';

    const header = document.createElement('div');
    header.className = 'unified-confirm-modal-header';

    const heading = document.createElement('h3');
    heading.className = 'unified-confirm-modal-title';
    heading.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'unified-confirm-modal-close';
    closeBtn.setAttribute('aria-label', '\u5173\u95ed');

    const closeIcon = document.createElement('span');
    closeIcon.className = 'material-icons';
    closeIcon.textContent = 'close';
    closeBtn.appendChild(closeIcon);
    header.append(heading, closeBtn);

    const body = document.createElement('div');
    body.className = 'unified-confirm-modal-body';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'unified-confirm-modal-icon';
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = iconMap[safeType];
    iconWrap.appendChild(icon);

    const messageEl = document.createElement('p');
    messageEl.className = 'unified-confirm-modal-message';
    messageEl.textContent = message;
    body.append(iconWrap, messageEl);

    const footer = document.createElement('div');
    footer.className = 'unified-confirm-modal-footer';

    const cancelBtnEl = document.createElement('button');
    cancelBtnEl.className = 'unified-confirm-modal-btn unified-confirm-modal-btn-cancel';
    cancelBtnEl.textContent = cancelText;

    const confirmBtn = document.createElement('button');
    confirmBtn.className = `unified-confirm-modal-btn unified-confirm-modal-btn-confirm unified-confirm-modal-btn-${safeType}`;
    confirmBtn.textContent = confirmText;
    footer.append(cancelBtnEl, confirmBtn);

    content.append(header, body, footer);
    modal.append(mask, content);
    return modal;
}

function ensureUserPermissions(user) {
    if (!user) return null;

    console.log('🔧 ensureUserPermissions 安全版本');
    console.log('用户:', user.username);

    // 🔧 修复：为普通用户设置最少必要权限
    if (!user.permissions) {
        console.log('⚠️ 用户无权限数据，设置基础权限');
        // 普通用户只有基础权限
        user.permissions = ['add-task', 'quadrant-view'];
    } else if (!Array.isArray(user.permissions)) {
        console.log('⚠️ 权限不是数组，转换为数组');
        // 如果是字符串，尝试分割
        if (typeof user.permissions === 'string') {
            user.permissions = user.permissions.split(',').map(p => p.trim()).filter(p => p);
        } else {
            user.permissions = ['add-task', 'quadrant-view'];
        }
    }

    // 🔧 修复：确保权限不为空
    if (user.permissions.length === 0) {
        console.log('⚠️ 权限数组为空，设置基础权限');
        user.permissions = ['add-task', 'quadrant-view'];
    }

    // 🔧 特殊处理：为关键用户确保适当权限
    if (user.username === 'admin' || user.role === 'admin') {
        console.log('👑 检测到管理员用户，确保管理员拥有完整权限');
        // 管理员应该拥有所有功能的完整权限
        const adminFullPermissions = [
            'add-task', 'quadrant-view', 'fortune', 'pomodoro',
            'habit-tracker', 'countdown', 'time-tracker', 'calendar',
            'dashboard', 'review', 'templates', 'more-features', 'backup'
        ];

        if (!user.permissions || user.permissions.length === 0) {
            // 如果完全没有权限，设置完整权限
            user.permissions = [...adminFullPermissions];
            console.log('⚠️ 管理员无权限数据，设置完整权限:', user.permissions);
        } else {
            // 🔧 强制确保管理员拥有所有权限
            adminFullPermissions.forEach(perm => {
                if (!user.permissions.includes(perm)) {
                    user.permissions.push(perm);
                }
            });
            console.log('✅ 管理员权限已补充完整:', user.permissions);
        }
    } else if (user.username === 'WQFG') {
        console.log('🔑 WQFG用户权限检查，完全尊重管理员设置的权限');
        // WQFG用户权限完全由管理员在后台设置，不进行任何强制修改
        console.log('🔧 WQFG当前权限:', user.permissions);
        console.log('🔧 权限来源: 管理员后台配置');
    } else {
        // 普通用户处理
        if (!user.permissions || user.permissions.length === 0) {
            // 为没有权限的普通用户添加默认权限
            const defaultPermissions = [
                'add-task', 'quadrant-view', 'fortune', 'pomodoro',
                'habit-tracker', 'countdown', 'time-tracker', 'calendar', 'more-features'
            ];
            user.permissions = [...defaultPermissions];
            console.log('🔧 普通用户设置默认权限:', user.permissions);
        } else {
            // 普通用户保留已有权限，不做强制限制
            console.log('👤 普通用户权限保持不变:', user.permissions);
        }
    }

    // 去重
    user.permissions = [...new Set(user.permissions)];

    console.log('✅ 用户权限处理完成');
    console.log('最终权限:', user.permissions);
    console.log('权限数量:', user.permissions.length);

    return user;
}
let notificationSettings = {
    enabled: true,
    sound: true,
    vibration: true,
    advanceTime: 5, // 提前提醒时间（分钟）
    showOverdue: true
};
// 语言切换功能
const translations = window.XXSG_TRANSLATIONS || { zh: {}, en: {} };

// 当前语言状态
let currentLanguage = window.SettingsStorage
    ? window.SettingsStorage.getString('language', 'zh', ['zh', 'en'])
    : window.DataSyncStorage.getRaw('language') || 'zh';

window.XXSGAppLanguage = {
    get current() {
        return currentLanguage;
    }
};

window.XXSGAppRuntime = {
    get isLoggedIn() {
        return isLoggedIn;
    },
    get tasks() {
        return tasks;
    },
    set tasks(nextTasks) {
        tasks = Array.isArray(nextTasks) ? nextTasks : [];
    },
    get currentView() {
        return currentView;
    },
    set currentView(nextView) {
        currentView = nextView || 'list';
    },
    get expandedQuadrant() {
        return expandedQuadrant;
    },
    set expandedQuadrant(nextQuadrant) {
        expandedQuadrant = nextQuadrant || null;
    },
    saveTasks(...args) {
        // 如果存在包装函数（由 setSaveTasks 设置），则委托给包装函数
        // 包装函数接收一个"真实保存"回调，确保不会循环调用
        if (typeof this._saveTasksOverride === 'function') {
            return this._saveTasksOverride(function realSaveCall() {
                return saveTasks(...args);
            });
        }
        return saveTasks(...args);
    },
    render(...args) {
        return render(...args);
    },
    setSaveTasks(nextSaveTasks) {
        if (typeof nextSaveTasks === 'function') {
            // 存储在覆盖指针上，而非覆盖局部变量 saveTasks
            // 这样可以避免包装函数 → 局部变量（已被覆盖）→ 包装函数的无限循环
            this._saveTasksOverride = nextSaveTasks;
        }
    },
    get reviewSystem() {
        return reviewSystem;
    },
    set reviewSystem(nextReviewSystem) {
        reviewSystem = nextReviewSystem;
    }
};

// 语言切换函数
function toggleLanguage() {
    currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
    if (window.SettingsStorage) {
        window.SettingsStorage.setString('language', currentLanguage, 'zh', ['zh', 'en']);
    } else {
        window.DataSyncStorage.setRaw('language', currentLanguage);
    }
    updateLanguage();
}

// Static page translation helpers have been moved to js/static-translation-core.js.

// Main page language update routine has been moved to js/language-update-core.js.

function setMultilineText(element, text) {
    element.replaceChildren();
    String(text || '').split('\n').forEach((part, index) => {
        if (index > 0) element.appendChild(document.createElement('br'));
        element.appendChild(document.createTextNode(part));
    });
}

function setQuadrantTitle(element, color, text) {
    const dot = document.createElement('span');
    dot.className = 'quadrant-dot';
    dot.style.background = color;
    element.replaceChildren(dot, document.createTextNode(text));
}

// 获取翻译文本的辅助函数
function t(key) {
    return translations[currentLanguage][key] || key;
}

// 获取任务的显示标题（根据当前语言）
function getTaskDisplayTitle(task) {
    if (!task.titleTranslations) {
        // 兼容旧数据，如果没有翻译信息，返回原标题
        return task.title;
    }

    const translatedTitle = task.titleTranslations[currentLanguage];
    if (translatedTitle && translatedTitle.trim()) {
        return translatedTitle;
    }

    // 如果没有当前语言的翻译，返回原标题
    return task.title;
}

// 为现有任务添加翻译支持（兼容性处理）
function ensureTaskTranslationSupport() {
    let hasUpdates = false;
    tasks.forEach(task => {
        if (!task.titleTranslations) {
            task.titleTranslations = {
                zh: task.title,
                en: ''
            };
            hasUpdates = true;
        }
    });

    if (hasUpdates) {
        saveTasks();
        console.log('已为现有任务添加翻译支持');
    }
}

const COPY_SUFFIX_DETECT_REGEX = /(?:\s*[\(（](?:副本|copy)[\)）])+$/i;
const COPY_SUFFIX_STRIP_REGEX = /(?:\s*[\(（](?:副本|copy)[\)）])+$/gi;

function stripCopySuffix(text = '') {
    if (!text) return '';
    return text.replace(COPY_SUFFIX_STRIP_REGEX, '').trim();
}

function normalizeDuplicateInfo(task) {
    if (!task || typeof task !== 'object') return;
    if (typeof task.title === 'string' && COPY_SUFFIX_DETECT_REGEX.test(task.title.trim())) {
        task.title = stripCopySuffix(task.title);
    }

    if (task.titleTranslations && typeof task.titleTranslations === 'object') {
        Object.keys(task.titleTranslations).forEach(lang => {
            const value = task.titleTranslations[lang];
            if (typeof value === 'string' && COPY_SUFFIX_DETECT_REGEX.test(value.trim())) {
                task.titleTranslations[lang] = stripCopySuffix(value);
            }
        });
    }
}

function ensureTaskDetailFields(task) {
    if (!task) return;
    normalizeDuplicateInfo(task);
    if (!Array.isArray(task.subtasks)) {
        task.subtasks = [];
    }
    if (typeof task.notes !== 'string') {
        task.notes = '';
    }
    if (typeof task.address !== 'string') {
        task.address = '';
    }
    if (typeof task.repeatRule !== 'string') {
        task.repeatRule = 'none';
    }
    if (typeof task.detailImage !== 'string') {
        task.detailImage = '';
    }
}

// 将DOM元素引用声明为变量，但不立即赋值
let taskListEl, initialAddContainerEl, taskFormContainerEl;
let q1TasksEl, q2TasksEl, q3TasksEl, q4TasksEl;
let modalEl, modalTaskIdEl, modalTaskTitleEl, modalTaskTitleEnEl, modalTaskPriorityEl, modalTaskStartEl, modalTaskEndEl;
let taskDetailPanelEl, taskDetailOverlayEl, detailTitleInputEl, detailTitleEnInputEl, detailStartInputEl, detailEndInputEl;
let detailRepeatSelectEl, detailAddressInputEl, detailNotesInputEl, detailSubtasksListEl, detailAddSubtaskBtn;
let detailImageInputEl, detailImagePreviewEl, detailUploadBtnEl, detailRemoveImageBtnEl, detailSaveBtnEl, detailCancelBtnEl;
let detailCaptionEl;
let detailActionButtons = [];
let currentDetailTaskId = null;
let detailSubtasksState = [];
let detailImageDataUrl = '';

// 简化的提醒方案（移除音频功能）
function createNotificationSound() {
    console.log('🔔 显示提醒通知...');

    // 方案1: 设备震动
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
        console.log('📳 设备震动提醒');
    }

    // 方案2: 视觉闪烁提醒
    let flashCount = 0;
    const flashInterval = setInterval(() => {
        document.body.style.backgroundColor = flashCount % 2 === 0 ? '#ff6b6b' : '';
        flashCount++;
        if (flashCount >= 6) {
            clearInterval(flashInterval);
            document.body.style.backgroundColor = '';
        }
    }, 150);

    console.log('💡 视觉闪烁提醒');
}

// 显示持续的任务到期提醒
function showPersistentNotification(task) {
    // 创建持续通知容器（如果不存在）
    const notificationContainer = getPersistentNotificationContainer();

    // 创建任务提醒通知
    const notification = document.createElement('div');
    notification.className = 'persistent-notification due-notification';
    notification.setAttribute('data-task-id', task.id);
    notification.appendChild(createTaskReminderContent({
        iconText: '⏰',
        titleText: '任务已到期',
        taskTitle: task.title,
        timeText: `到期时间: ${new Date(task.endDate).toLocaleString()}`,
        reminderId: task.id
    }));

    notificationContainer.appendChild(notification);
}

// 显示任务开始时间提醒
function showStartNotification(task) {
    // 创建持续通知容器（如果不存在）
    const notificationContainer = getPersistentNotificationContainer();

    // 创建任务开始提醒通知
    const notification = document.createElement('div');
    notification.className = 'persistent-notification start-notification';
    notification.setAttribute('data-task-id', `start-${task.id}`);
    notification.appendChild(createTaskReminderContent({
        iconText: '▶️',
        titleText: '任务开始时间到',
        taskTitle: task.title,
        timeText: `开始时间: ${new Date(task.startDate).toLocaleString()}`,
        reminderId: `start-${task.id}`
    }));

    notificationContainer.appendChild(notification);


}

function getPersistentNotificationContainer() {
    let notificationContainer = document.getElementById('persistent-notifications');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'persistent-notifications';
        document.body.appendChild(notificationContainer);
    }
    return notificationContainer;
}

function createTaskReminderContent({ iconText, titleText, taskTitle, timeText, reminderId }) {
    const content = document.createElement('div');
    content.className = 'notification-content';

    const icon = document.createElement('div');
    icon.className = 'notification-icon';
    icon.textContent = iconText;

    const text = document.createElement('div');
    text.className = 'notification-text';

    const title = document.createElement('div');
    title.className = 'notification-title';
    title.textContent = titleText;

    const task = document.createElement('div');
    task.className = 'notification-task';
    task.textContent = taskTitle || '';

    const time = document.createElement('div');
    time.className = 'notification-time';
    time.textContent = timeText;

    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.type = 'button';
    closeButton.addEventListener('click', () => clearTaskReminder(reminderId));

    const closeIcon = document.createElement('span');
    closeIcon.className = 'material-icons';
    closeIcon.textContent = 'close';
    closeButton.appendChild(closeIcon);

    text.append(title, task, time);
    content.append(icon, text, closeButton);
    return content;
}

// 清除特定任务的提醒
function clearTaskReminder(taskId) {
    const notification = document.querySelector(`[data-task-id="${taskId}"]`);
    if (notification) {
        notification.classList.add('is-exiting');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();

                // 如果容器为空，移除容器
                const container = document.getElementById('persistent-notifications');
                if (container && container.children.length === 0) {
                    container.remove();
                }
            }
        }, 300);
    }
}

// 清除所有提醒
function clearAllReminders() {
    const container = document.getElementById('persistent-notifications');
    if (container) {
        const notifications = container.querySelectorAll('.persistent-notification');
        notifications.forEach(notification => {
            notification.classList.add('is-exiting');
        });

        setTimeout(() => {
            container.remove();
        }, 300);
    }
}

// 自动清理旧的提醒记录（超过7天的记录）
function cleanupOldReminders() {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    // 获取所有任务ID
    const taskIds = new Set(tasks.map(t => t.id));

    // 清理不属于任何现有任务的提醒记录，或者超过7天的记录
    const toDelete = [];
    notifiedTasks.forEach(key => {
        // 检查是否是旧格式的记录（没有时间戳）
        if (!key.includes('|')) {
            // 检查对应的任务是否还存在
            const taskId = key.replace('start-', '').replace('end-', '');
            if (!taskIds.has(taskId)) {
                toDelete.push(key);
            }
        } else {
            // 新格式：start-taskId|timestamp
            const parts = key.split('|');
            if (parts.length === 2) {
                const timestamp = parseInt(parts[1]);
                if (timestamp < sevenDaysAgo) {
                    toDelete.push(key);
                }
            }
        }
    });

    toDelete.forEach(key => notifiedTasks.delete(key));

    if (toDelete.length > 0) {
        saveNotifiedTasks();
        console.log(`🧹 清理了 ${toDelete.length} 条旧提醒记录`);
    }
}

// 改进提醒记录的保存，使用带时间戳的key
function addReminderKey(key) {
    const timestampedKey = `${key}|${Date.now()}`;
    notifiedTasks.add(timestampedKey);
    saveNotifiedTasks();
}

// 检查提醒记录是否存在
function hasReminderKey(baseKey) {
    // 检查是否有任何匹配的记录（带或不带时间戳）
    for (const key of notifiedTasks) {
        if (key.startsWith(baseKey) || key === baseKey) {
            return true;
        }
    }
    return false;
}

// 修改任务提醒检查函数
function checkTaskReminders() {
    const now = new Date();
    const currentTime = now.getTime();

    // 输出调试信息（不依赖window.debugMode）
    console.log('🕐 检查提醒时间:', now.toLocaleString());
    console.log('📋 当前任务数量:', tasks.length);
    console.log('📝 通知权限状态:', Notification.permission);

    // 定期清理旧提醒记录（每分钟清理一次）
    if (Math.random() < 0.008) { // 约每120次检查执行一次（约4分钟）
        cleanupOldReminders();
    }

    let hasNewReminders = false;

    tasks.forEach(task => {
        if (task.completed) {
            console.log(`⏭️ 跳过已完成任务: ${task.title}`);
            return;
        }

        console.log(`\n🔍 检查任务: ${task.title}`);
        console.log(`   开始时间原始值: ${task.startDate}`);
        console.log(`   结束时间原始值: ${task.endDate}`);

        // 检查开始时间提醒
        if (task.startDate) {
            try {
                const startDate = new Date(task.startDate);

                // 检查日期是否有效
                if (isNaN(startDate.getTime())) {
                    console.log(`   ⚠️ 开始时间格式无效: ${task.startDate}`);
                    return;
                }

                const startTime = startDate.getTime();
                const startDiff = startTime - currentTime;
                const startDiffSeconds = Math.round(startDiff / 1000);

                console.log(`   ⏰ 开始时间(解析后): ${startDate.toLocaleString()}`);
                console.log(`   ⏰ 开始时间差: ${startDiffSeconds}秒 (${Math.round(startDiffSeconds/60)}分钟)`);

                // 开始时间到达或即将到达（使用用户设置的提前提醒时间）
                const advanceMs = (notificationSettings.advanceTime || 5) * 60 * 1000;
                const isStartReached = startDiff <= 0; // 已到达（无时间限制，未提醒过的都会触发）
                const isStartSoon = startDiff > 0 && startDiff <= advanceMs; // 即将开始（使用用户设置的提前时间）

                console.log(`   状态: ${isStartReached ? '✅已到达' : isStartSoon ? '⏰即将开始' : '⏳还未到'}`);
                console.log(`   提醒窗口: ±30分钟 (从${new Date(currentTime - 1800000).toLocaleTimeString()}到${new Date(currentTime + 1800000).toLocaleTimeString()})`);

                if (isStartReached || isStartSoon) {
                    // 检查是否已经有该任务开始时间的提醒
                    const startReminderKey = `start-${task.id}`;
                    console.log(`   🔑 提醒Key: ${startReminderKey}`);
                    console.log(`   📋 已提醒记录: ${hasReminderKey(startReminderKey) ? '是' : '否'}`);

                    if (!hasReminderKey(startReminderKey)) {
                        hasNewReminders = true;

                        console.log(`🚨 触发任务开始时间提醒: ${task.title}`);
                        console.log(`   开始时间: ${startDate.toLocaleString()}`);

                        // 标记已提醒（使用带时间戳的key）
                        addReminderKey(startReminderKey);

                        // 显示开始时间提醒
                        showStartNotification(task);

                        // 创建通知音效
                        createNotificationSound();

                        // 浏览器通知
                        if (Notification.permission === 'granted') {
                            new Notification('任务开始提醒', {
                                body: `任务「${task.title}」${isStartReached ? '已开始' : '即将开始'}`,
                                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%234caf50"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
                                tag: startReminderKey,
                                requireInteraction: true
                            });
                            console.log('✅ 浏览器通知已发送');
                        } else {
                            console.log('⚠️ 浏览器通知权限未授予');
                        }
                    } else {
                        console.log('⏭️ 该任务已提醒过，跳过');
                    }
                }
            } catch (error) {
                console.error(`   ❌ 解析开始时间出错:`, error);
            }
        } else {
            console.log(`   ℹ️ 开始时间未设置`);
        }

        // 检查结束时间提醒
        if (task.endDate) {
            try {
                const endDate = new Date(task.endDate);

                // 检查日期是否有效
                if (isNaN(endDate.getTime())) {
                    console.log(`   ⚠️ 结束时间格式无效: ${task.endDate}`);
                    return;
                }

                const endTime = endDate.getTime();
                const timeDiff = endTime - currentTime;
                const timeDiffSeconds = Math.round(timeDiff / 1000);

                console.log(`   ⏰ 结束时间(解析后): ${endDate.toLocaleString()}`);
                console.log(`   ⏰ 结束时间差: ${timeDiffSeconds}秒 (${Math.round(timeDiffSeconds/60)}分钟)`);

                // 修改检查逻辑：任务已到期或即将到期（30分钟内）
                const isOverdue = timeDiff <= 0 && timeDiff > -1800000; // 已过期但不超过30分钟
                const isAboutToDue = timeDiff > 0 && timeDiff <= 1800000; // 30分钟内到期

                console.log(`   状态: ${isOverdue ? '⚠️已过期' : isAboutToDue ? '⏰即将到期' : '⏳进行中'}`);

                if (isOverdue || isAboutToDue) {
                    // 检查是否已经有该任务的持续提醒
                    const existingReminder = document.querySelector(`[data-task-id="${task.id}"]`);
                    if (!existingReminder) {
                        hasNewReminders = true;

                        console.log(`🚨 任务${isOverdue ? '已过期' : '即将到期'}提醒: ${task.title}`);

                        // 显示持续页面提醒
                        showPersistentNotification(task);

                        // 创建通知音效
                        createNotificationSound();

                        // 浏览器通知
                        if (Notification.permission === 'granted') {
                            new Notification('任务到期提醒', {
                                body: `任务「${task.title}」${isOverdue ? '已过期' : '即将到期'}`,
                                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff6b6b"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
                                tag: task.id,
                                requireInteraction: true
                            });
                            console.log('✅ 浏览器通知已发送');
                        } else {
                            console.log('⚠️ 浏览器通知权限未授予');
                        }
                    }
                }
            } catch (error) {
                console.error(`   ❌ 解析结束时间出错:`, error);
            }
        } else {
            console.log(`   ℹ️ 结束时间未设置`);
        }
    });

    if (!hasNewReminders) {
        console.log('✅ 当前没有新的提醒任务');
    }
}

// 改进的提醒系统启动
function startReminderSystem() {
    console.log('🚀 启动提醒系统');

    // 清除旧的定时器
    if (reminderInterval) {
        clearInterval(reminderInterval);
        console.log('🔄 清除旧的定时器');
    }

    // 加载已提醒任务记录
    loadNotifiedTasks();

    // 启动时清理一次旧记录
    console.log('🧹 清理旧的提醒记录...');
    cleanupOldReminders();

    // 每2秒检查一次（更频繁）
    reminderInterval = setInterval(() => {
        checkTaskReminders();
    }, 2000);

    // 立即检查一次
    setTimeout(() => {
        checkTaskReminders();
    }, 500);

    console.log('✅ 提醒系统已启动，每2秒检查一次');
    console.log('📍 定时器ID:', reminderInterval);
    console.log('⏰ 提醒窗口: ±30分钟');
}

// 检查提醒系统状态
window.checkReminderSystemStatus = function() {
    console.log('====================');
    console.log('🔍 提醒系统状态检查');
    console.log('====================');
    console.log('提醒定时器ID:', reminderInterval);
    console.log('定时器是否运行:', reminderInterval !== null && reminderInterval !== undefined);
    console.log('当前任务数量:', tasks.length);
    console.log('已提醒记录数量:', notifiedTasks.size);
    console.log('通知权限状态:', Notification.permission);
    console.log('====================');

    // 手动触发一次检查
    console.log('🔄 手动触发提醒检查...');
    checkTaskReminders();
    console.log('====================');
};

// 强制重启提醒系统
window.restartReminderSystem = function() {
    console.log('====================');
    console.log('🔄 强制重启提醒系统');
    console.log('====================');

    // 清除旧定时器
    if (reminderInterval) {
        clearInterval(reminderInterval);
        console.log('✅ 旧定时器已清除');
    }

    // 重新启动
    startReminderSystem();

    console.log('✅ 提醒系统已重启');
    console.log('====================');
};

// 测试提醒功能 - 手动触发提醒检查
window.testReminder = function() {
    console.log('====================');
    console.log('🧪 手动测试提醒功能');
    console.log('====================');
    checkTaskReminders();
    console.log('====================');
    console.log('✅ 测试完成，请查看上方日志');
    console.log('====================');
};

// 清除所有提醒记录
window.clearReminderHistory = function() {
    notifiedTasks.clear();
    saveNotifiedTasks();
    console.log('✅ 已清除所有提醒记录，现在可以重新触发提醒');
};

// 诊断函数 - 检查所有任务的时间信息
window.diagnoseTasks = function() {
    console.log('====================');
    console.log('🔍 任务诊断信息');
    console.log('====================');
    console.log('当前任务数量:', tasks.length);
    console.log('当前时间:', new Date().toLocaleString());
    console.log('当前时间戳:', new Date().getTime());

    tasks.forEach((task, index) => {
        console.log(`\n📝 任务 #${index + 1}: ${task.title}`);
        console.log('   ID:', task.id);
        console.log('   已完成:', task.completed);
        console.log('   开始时间(原始):', task.startDate);
        console.log('   结束时间(原始):', task.endDate);

        if (task.startDate) {
            const startDate = new Date(task.startDate);
            console.log('   开始时间(解析后):', startDate.toLocaleString());
            console.log('   开始时间(时间戳):', startDate.getTime());
            console.log('   开始时间(是否有效):', !isNaN(startDate.getTime()));

            const diff = startDate.getTime() - new Date().getTime();
            console.log('   时间差(秒):', Math.round(diff / 1000));
            console.log('   时间差(分钟):', Math.round(diff / 60000));
        }

        if (task.endDate) {
            const endDate = new Date(task.endDate);
            console.log('   结束时间(解析后):', endDate.toLocaleString());
            console.log('   结束时间(时间戳):', endDate.getTime());
            console.log('   结束时间(是否有效):', !isNaN(endDate.getTime()));

            const diff = endDate.getTime() - new Date().getTime();
            console.log('   时间差(秒):', Math.round(diff / 1000));
            console.log('   时间差(分钟):', Math.round(diff / 60000));
        }
    });

    console.log('\n====================');
    console.log('📋 已提醒任务记录:');
    console.log('====================');
    notifiedTasks.forEach(key => {
        console.log('  -', key);
    });

    console.log('\n====================');
    console.log('✅ 诊断完成');
    console.log('====================');
};

// 创建一个测试任务并立即触发提醒
window.testReminderNow = function() {
    const now = new Date();
    const testTask = {
        id: `test-${Date.now()}`,
        title: '测试任务 - 开始时间提醒',
        startDate: now.toISOString(), // 立即开始
        endDate: null,
        completed: false,
        priority: 1
    };

    console.log('🧪 创建测试任务:', testTask);
    tasks.push(testTask);
    saveTasks();

    // 立即检查提醒
    setTimeout(() => {
        checkTaskReminders();
    }, 1000);

    console.log('✅ 测试任务已创建，1秒后检查提醒');
};

// 加载已提醒任务记录
function loadNotifiedTasks() {
    const stored = window.DataSyncStorage.getRaw('notifiedTasks');
    if (stored) {
        notifiedTasks = new Set(JSON.parse(stored));
    }
}

// 保存已提醒任务记录
function saveNotifiedTasks() {
    window.DataSyncStorage.setRaw('notifiedTasks', JSON.stringify([...notifiedTasks]));
}

function loadTasks() {
    // 使用用户特定的存储键
    const storageKey = getUserStorageKey('tasks');
    const storedTasks = window.DataSyncStorage.getRaw(storageKey);

    if (storedTasks) {
        try {
            const parsedTasks = window.TaskStorage
                ? window.TaskStorage.parseTasks(storedTasks)
                : JSON.parse(storedTasks);
            console.log('从localStorage解析的任务数据:', parsedTasks);

            // 验证任务数据的完整性
            const validTasks = parsedTasks.filter(task => {
                const isValid = task &&
                    typeof task === 'object' &&
                    task.id &&
                    task.title &&
                    typeof task.priority === 'number';

                if (!isValid) {
                    console.warn('发现无效任务数据:', task);
                }
                return isValid;
            });

            if (validTasks.length > 0) {
                tasks = validTasks;
                tasks.forEach(ensureTaskDetailFields);
                console.log('从localStorage加载了', tasks.length, '个有效任务');

                // 如果有效任务数量少于原始数量，保存修复后的数据
                if (validTasks.length < parsedTasks.length) {
                    console.log('修复了', parsedTasks.length - validTasks.length, '个无效任务');
                    saveTasks();
                }
            } else {
                console.log('localStorage中没有有效任务数据');
            }
        } catch (error) {
            console.error('解析任务数据失败:', error);
            // 如果解析失败，清空localStorage中的无效数据
            window.DataSyncStorage.removeRaw('tasks');
        }
    } else {
        console.log('localStorage中没有任务数据');
    }
    // 为现有任务添加翻译支持
    ensureTaskTranslationSupport();
    tasks.forEach(ensureTaskDetailFields);
    // 加载已提醒任务记录
    loadNotifiedTasks();

    // 自动修复任务数据
    if (tasks.length > 0) {
        const originalLength = tasks.length;
        tasks = tasks.filter(task => {
            const isValid = task &&
                typeof task === 'object' &&
                task.id &&
                task.title &&
                typeof task.priority === 'number';

            if (!isValid) {
                console.warn('自动修复时发现无效任务:', task);
            }
            return isValid;
        });

        if (tasks.length < originalLength) {
            console.log('自动修复了', originalLength - tasks.length, '个无效任务');
            saveTasks();
        }
        tasks.forEach(ensureTaskDetailFields);
    }
}

function saveTasks() {
    try {
        // 验证任务数据完整性
        const validTasks = tasks.filter(task => {
            const isValid = task &&
                typeof task === 'object' &&
                task.id &&
                task.title &&
                typeof task.priority === 'number';

            if (!isValid) {
                console.warn('保存时发现无效任务数据:', task);
            }
            return isValid;
        });

        // 如果有效任务数量少于原始数量，使用有效任务
        if (validTasks.length < tasks.length) {
            console.log('保存时修复了', tasks.length - validTasks.length, '个无效任务');
            tasks = validTasks;
        }

        // 先备份当前数据
        const storageKey = getUserStorageKey('tasks');
        try {
            if (window.TaskStorage) {
                window.TaskStorage.backup(storageKey);
            } else {
                const currentTasks = window.DataSyncStorage.getRaw(storageKey);
                if (currentTasks) {
                    window.DataSyncStorage.setRaw(storageKey + '_backup', currentTasks);
                    window.DataSyncStorage.setRaw(storageKey + '_backup_time', new Date().toISOString());
                }
            }
        } catch (backupError) {
            console.warn('任务备份失败，继续保存主任务数据:', backupError);
        }

        // 保存新数据
        const tasksToSave = window.TaskStorage
            ? window.TaskStorage.setTasks(storageKey, tasks)
            : tasks.map(task => ({
                ...task,
                // 确保所有必要字段都存在
                id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: task.title || '未命名任务',
                priority: typeof task.priority === 'number' ? task.priority : 4,
                completed: Boolean(task.completed),
                pinned: Boolean(task.pinned),
                createdAt: task.createdAt || new Date().toISOString(),
                titleTranslations: task.titleTranslations || { zh: task.title || '未命名任务', en: '' }
            }));

        if (!window.TaskStorage) {
            window.DataSyncStorage.setRaw(storageKey, JSON.stringify(tasksToSave));
        }
        console.log('任务数据已保存到localStorage，存储键:', storageKey);
        console.log('任务已保存到localStorage，共', tasksToSave.length, '个任务');

        // 记录用户活动，用于智能备份
        recordUserActivity(currentUser);

        // 保存任务后立即创建备份
        try {
            // 获取当前用户
            const userSession = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
            let currentUser = null;

            if (userSession) {
                try {
                    const parsedSession = JSON.parse(userSession);
                    if (parsedSession.user) {
                        currentUser = parsedSession.user;
                    } else if (parsedSession.id) {
                        currentUser = parsedSession;
                    }
                } catch (e) {
                    console.error('解析用户会话失败:', e);
                }
            }

            // 创建备份
            if (tasksToSave.length > 0) {
                console.log('任务保存后创建备份，任务数量:', tasksToSave.length);
                createAutoBackup(tasksToSave, currentUser);
            }

        } catch (backupError) {
            console.error('创建备份失败:', backupError);
        }

        // 同步到全局 window.tasks，供可视化图表模块使用
        syncTasksToWindow();

        // 自动同步到 API 服务器
        syncToAPI();

        return true;

    } catch (error) {
        console.error('保存任务失败:', error);
        if (typeof showPageNotification === 'function') {
            showPageNotification('保存任务失败，请检查浏览器存储空间');
        } else if (typeof showNotification === 'function') {
            showNotification('保存任务失败，请检查浏览器存储空间', 'error');
        }
        return false;
    }
}
function render() {
    console.log('=== 开始渲染 ===');
    console.log('当前任务数组:', tasks);
    console.log('任务数量:', tasks.length);
    console.log('localStorage中的任务数据:', window.DataSyncStorage.getRaw('tasks'));
    // 检查用户特定的备份数据
    const userSession = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
    let currentUser = null;
    if (userSession) {
        try {
            const parsedSession = JSON.parse(userSession);
            if (parsedSession.user) {
                currentUser = parsedSession.user;
            } else if (parsedSession.id) {
                currentUser = parsedSession;
            }
        } catch (e) {
            console.error('解析用户会话失败:', e);
        }
    }

    let backupKey = 'taskBackups';
    if (currentUser && currentUser.id) {
        backupKey = `taskBackups_${currentUser.id}`;
    }
    console.log('localStorage中的备份数据:', window.DataSyncStorage.getRaw(backupKey));

    taskListEl.replaceChildren();
    const quadrantElements = [q1TasksEl, q2TasksEl, q3TasksEl, q4TasksEl];
    quadrantElements.forEach(el => el.replaceChildren());

    const taskActionsEl = document.getElementById('task-actions');
    const quadrantSelectorEl = document.getElementById('quadrant-selector');

    // 根据当前视图和任务数量决定显示什么
    if (currentView === 'list') {
        // 列表视图逻辑
        if (tasks.length === 0) {
            console.log('列表视图：没有任务，显示初始添加按钮');
            initialAddContainerEl.style.display = 'block';
            taskFormContainerEl.style.display = 'none';
            if (taskActionsEl) taskActionsEl.style.display = 'none';
        } else {
            console.log('列表视图：有任务，显示任务表单和操作区域');
            initialAddContainerEl.style.display = 'none';
            taskFormContainerEl.style.display = 'block';

            if (!taskFormContainerEl.querySelector('form')) {
                taskFormContainerEl.replaceChildren(createTaskInputForm());
                const form = taskFormContainerEl.querySelector('form');
                if (form) {
                    form.addEventListener('submit', handleAddTask);
                    bindTaskInputFormEvents(form);
                }
            }

            if (taskActionsEl) taskActionsEl.style.display = 'flex';
        }
    } else {
        // 四象限视图逻辑 - 隐藏所有列表视图相关元素
        console.log('四象限视图：隐藏列表视图元素');
        initialAddContainerEl.style.display = 'none';
        taskFormContainerEl.style.display = 'none';
        if (taskActionsEl) taskActionsEl.style.display = 'none';
    }

    // 计算每个象限的未完成任务数量
    const quadrantTaskCounts = [0, 0, 0, 0];
    tasks.forEach(task => {
        ensureTaskDetailFields(task);
        console.log(`任务 "${task.title}": 完成状态=${task.completed}, 优先级=${task.priority}`);
        if (!task.completed && task.priority >= 1 && task.priority <= 4) {
            quadrantTaskCounts[task.priority - 1]++;
        }
    });

    console.log('象限任务计数:', quadrantTaskCounts);

    // 更新任务计数显示
    quadrantTaskCounts.forEach((count, index) => {
        const countElement = document.getElementById(`q${index + 1}-count`);
        if (countElement) {
            countElement.textContent = count;
        }
    });

    // 基础排序：置顶优先
    let sortedTasks = [...tasks];
    // 应用排序模式
    if (sortMode === 'created_desc') {
        sortedTasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortMode === 'created_asc') {
        sortedTasks.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortMode === 'incomplete_first') {
        sortedTasks.sort((a, b) => Number(a.completed) - Number(b.completed));
    } else if (sortMode === 'complete_first') {
        sortedTasks.sort((a, b) => Number(b.completed) - Number(a.completed));
    } else {
        // 默认：按优先级与置顶
        sortedTasks.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });
    }
    // 始终确保置顶任务在前
    sortedTasks.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    console.log('排序后的任务:', sortedTasks);

    sortedTasks.forEach(task => {
        console.log(`处理任务 "${task.title}": 完成=${task.completed}`);

        if (!task.id || !task.title || !task.priority) {
            console.warn('任务数据不完整:', task);
            return;
        }

        // 只在列表视图中添加到任务列表
        if (currentView === 'list') {
            const taskItem = createTaskElement(task);
            taskListEl.appendChild(taskItem);
        }

        // 在四象限视图中添加到对应象限
        if (!task.completed && task.priority >= 1 && task.priority <= 4) {
            const quadrantTaskItem = createTaskElement(task);
            quadrantElements[task.priority - 1].appendChild(quadrantTaskItem);
            console.log(`任务 "${task.title}" 已添加到象限 ${task.priority}`);
        }
    });

    const emptyMessages = [
        t('emptyQ1'),
        t('emptyQ2'),
        t('emptyQ3'),
        t('emptyQ4')
    ];

    quadrantElements.forEach((el, index) => {
        const taskCountInQuadrant = quadrantTaskCounts[index] || 0;
        // 只有在非展开模式或当前象限是展开象限时才检查空状态
        if (!expandedQuadrant || el.id === `q${index + 1}-tasks`) {
            if (taskCountInQuadrant === 0) {
                el.replaceChildren(createEmptyState(emptyMessages[index]));
                console.log(`象限 ${index + 1} 为空，显示空状态消息`);
            } else {
                console.log(`象限 ${index + 1} 有 ${taskCountInQuadrant} 个任务`);
            }
        }
    });

    // 延迟更新滚动状态，确保DOM完全渲染
    setTimeout(() => {
        updateQuadrantScrollState(quadrantElements, quadrantTaskCounts);
    }, 0);

    // 【关键修复】在四象限视图中，render()后需要重新初始化拖拽功能
    // 因为render()会清空象限内容，破坏Sortable实例
    if (currentView === 'quadrant') {
        setTimeout(() => {
            initSortable();
            console.log('🔄 render()后已重新初始化拖拽功能');
        }, 50);
    }

    console.log('=== 渲染完成 ===');
}

function createEmptyState(message) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = message;
    return empty;
}

function updateQuadrantScrollState(quadrantElements, taskCounts = []) {
    if (!Array.isArray(quadrantElements)) return taskCounts;

    // 【修复】根据视图模式使用不同的滚动条阈值
    // 网格模式：象限高度较矮，6条任务显示滚动条
    // 列表模式：象限高度800px，11条任务后显示滚动条（第12条任务出现时启用滚动）
    const isListMode = document.getElementById('quadrant-view')?.classList.contains('list-mode');
    const scrollThreshold = isListMode ? 11 : 6; // 列表模式11条，网格模式6条

    console.log(`📏 当前视图模式: ${isListMode ? '列表模式' : '网格模式'}, 滚动条阈值: ${scrollThreshold}`);

    quadrantElements.forEach((el, index) => {
        if (!el) return;

        // 优先使用实际DOM中的任务数量，更准确
        // 包含子任务的任务也算一条，只计算主任务数量
        const allChildren = Array.from(el.children);
        const actualTaskItems = allChildren.filter(child =>
            child.classList && child.classList.contains('task-item') && !child.classList.contains('empty-state')
        );
        const actualTaskCount = actualTaskItems.length;

        // 如果DOM中没有任务，使用传入的计数（可能为空状态）
        const taskCount = actualTaskCount > 0 ? actualTaskCount : (taskCounts[index] ?? 0);

        // 根据视图模式和任务数量判断是否需要滚动条
        const needsScroll = taskCount >= scrollThreshold;

        // 通过CSS类控制滚动条显示
        el.classList.toggle('has-scroll', needsScroll);
        el.classList.toggle('no-scroll', !needsScroll);
        el.dataset.quadrantTaskCount = String(taskCount);

        if (!needsScroll) {
            el.scrollTop = 0;
            // 移除内联样式，让CSS的 :not(.has-scroll) 规则生效
            el.style.removeProperty('overflow-y');
        } else {
            // 移除内联样式，让CSS的 .has-scroll 规则生效
            el.style.removeProperty('overflow-y');
        }

        // 详细的调试日志
        console.log(`[象限${index + 1}] 视图=${isListMode ? '列表' : '网格'}, 任务=${taskCount}, 阈值=${scrollThreshold}, 需要滚动=${needsScroll}`);

        // 如果有子元素但任务数为0，记录所有子元素的类名
        if (allChildren.length > 0 && actualTaskCount === 0) {
            console.log(`[象限${index + 1}] 警告：有${allChildren.length}个子元素但没有任务项！子元素类名：`, allChildren.map(c => c.className));
        }
    });

    return taskCounts;
}


function getSortLabel(mode) {
    switch (mode) {
        case 'created_desc': return t('sortByCreatedDesc');
        case 'created_asc': return t('sortByCreatedAsc');
        case 'incomplete_first': return t('sortIncompleteFirst');
        case 'complete_first': return t('sortCompleteFirst');
        default: return t('defaultSort');
    }
}

function createTaskInputForm(title = '') {
    const form = document.createElement('form');
    form.className = 'task-input-form';

    const inputRow = document.createElement('div');
    inputRow.className = 'input-submit-row';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-input';
    input.placeholder = t('taskTitlePlaceholder');
    input.value = title || '';
    input.required = true;

    const aiButton = document.createElement('button');
    aiButton.type = 'button';
    aiButton.className = 'ai-analyze-btn';
    aiButton.title = 'AI智能分析';
    aiButton.dataset.aiAction = 'analyze';
    aiButton.textContent = '🤖 AI分析';

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'task-submit-btn';
    submitButton.textContent = t('submit');
    inputRow.append(input, aiButton, submitButton);

    const quadrantSelector = document.createElement('div');
    quadrantSelector.id = 'quadrant-selector';
    quadrantSelector.className = 'quadrant-selector';
    [
        { priority: 1, color: '#f44336', label: t('q1Title') },
        { priority: 2, color: '#ff9800', label: t('q2Title') },
        { priority: 3, color: '#2196f3', label: t('q3Title') },
        { priority: 4, color: '#4caf50', label: t('q4Title') }
    ].forEach(option => quadrantSelector.appendChild(createQuadrantOption(option)));

    form.append(inputRow, quadrantSelector, createAiAnalysisResultPanel());
    return form;
}

function createQuadrantOption({ priority, color, label }) {
    const option = document.createElement('div');
    option.className = 'quadrant-option';
    option.dataset.priority = String(priority);

    const dot = document.createElement('span');
    dot.className = 'quadrant-dot';
    dot.style.background = color;

    const text = document.createElement('span');
    text.className = 'quadrant-label';
    text.textContent = label;

    option.append(dot, text);
    return option;
}

function createAiAnalysisResultPanel() {
    const result = document.createElement('div');
    result.id = 'ai-analysis-result';
    result.className = 'ai-analysis-result';
    result.style.display = 'none';

    const header = document.createElement('div');
    header.className = 'ai-analysis-header';
    header.append(
        createTextSpan('ai-icon', '🤖'),
        createTextSpan('ai-title', 'AI智能分析'),
        createAiActionButton('close-ai-analysis', 'close', '×')
    );

    const content = document.createElement('div');
    content.className = 'ai-analysis-content';

    const quadrantSuggestion = document.createElement('div');
    quadrantSuggestion.className = 'ai-quadrant-suggestion';
    quadrantSuggestion.append(createTextSpan('suggestion-label', '推荐象限：'), createIdSpan('ai-suggested-quadrant', 'suggested-quadrant'));

    const details = document.createElement('div');
    details.className = 'ai-analysis-details';
    [
        ['重要性：', 'ai-importance'],
        ['紧急性：', 'ai-urgency'],
        ['预计时间：', 'ai-duration']
    ].forEach(([label, id]) => details.appendChild(createAiDetailItem(label, id)));

    const reason = createAiParagraphSection('ai-reason', 'reason-label', '分析理由：', 'ai-reason-text', 'reason-text');
    const suggestion = createAiParagraphSection('ai-suggestion', 'suggestion-label', '执行建议：', 'ai-suggestion-text', 'suggestion-text');

    const actions = document.createElement('div');
    actions.className = 'ai-actions';
    actions.append(
        createAiActionButton('apply-ai-suggestion', 'apply', '应用AI建议'),
        createAiActionButton('ignore-ai-suggestion', 'ignore', '忽略建议')
    );

    content.append(quadrantSuggestion, details, reason, suggestion, actions);
    result.append(header, content);
    return result;
}

function createAiDetailItem(labelText, valueId) {
    const item = document.createElement('div');
    item.className = 'ai-detail-item';
    item.append(createTextSpan('detail-label', labelText), createIdSpan(valueId, 'detail-value'));
    return item;
}

function createAiParagraphSection(sectionClass, labelClass, labelText, paragraphId, paragraphClass) {
    const section = document.createElement('div');
    section.className = sectionClass;
    const paragraph = document.createElement('p');
    paragraph.id = paragraphId;
    paragraph.className = paragraphClass;
    section.append(createTextSpan(labelClass, labelText), paragraph);
    return section;
}

function createAiActionButton(className, action, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.dataset.aiAction = action;
    button.textContent = label;
    return button;
}

function createTextSpan(className, text) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
}

function createIdSpan(id, className) {
    const span = document.createElement('span');
    span.id = id;
    span.className = className;
    return span;
}

function escapeTaskInputValue(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function bindTaskInputFormEvents(form) {
    if (!form || form.dataset.aiEventsBound === 'true') return;
    form.dataset.aiEventsBound = 'true';

    form.addEventListener('click', event => {
        const actionEl = event.target.closest('[data-ai-action]');
        if (!actionEl || !form.contains(actionEl)) return;

        event.preventDefault();
        const action = actionEl.dataset.aiAction;
        if (action === 'analyze') {
            analyzeTaskWithAI();
        } else if (action === 'close') {
            closeAIAnalysis();
        } else if (action === 'apply') {
            applyAISuggestion();
        } else if (action === 'ignore') {
            ignoreAISuggestion();
        }
    });
}

function createTaskElement(task) {
    const isListView = currentView === 'list';
    const priorityColors = {
        1: '#ff5252', // 重要且紧急 - 红色
        2: '#ff9800', // 重要不紧急 - 橙色
        3: '#2196f3', // 不重要但紧急 - 蓝色
        4: '#4caf50'  // 不重要不紧急 - 绿色
    };

    const priorityLabels = {
        1: t('q1Title'),
        2: t('q2Title'),
        3: t('q3Title'),
        4: t('q4Title')
    };

    /**
     * 安全格式化日期字符串为显示文本。
     * 用 try-catch 包裹，即使 new Date() 异常也不影响任务卡片整体渲染。
     * 对不含秒数的 datetime-local 格式补全 :00 确保跨浏览器兼容。
     */
    const formatStartTime = (timeStr) => {
        if (!timeStr) return '';
        try {
            let s = String(timeStr);
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s += ':00';
            const date = new Date(s);
            if (Number.isNaN(date.getTime())) {
                console.warn('formatStartTime: 无效日期', timeStr);
                return '';
            }
            const now = new Date();
            const isOverdue = date < now;
            const formattedTime = date.toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            if (isOverdue) {
                return '<span class="task-end-overdue">' + formattedTime + '</span>';
            }
            return formattedTime;
        } catch (e) {
            console.warn('formatStartTime 异常:', e, timeStr);
            return '';
        }
    };

    /**
     * 安全格式化截止时间，过期时返回含红色样式的 HTML。
     */
    const formatEndTime = (timeStr) => {
        if (!timeStr) return '';
        try {
            let s = String(timeStr);
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s += ':00';
            const date = new Date(s);
            if (Number.isNaN(date.getTime())) {
                console.warn('formatEndTime: 无效日期', timeStr);
                return '';
            }
            const now = new Date();
            const isOverdue = date < now;
            const formattedTime = date.toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            if (isOverdue) {
                return `<span class="task-end-overdue">${formattedTime}</span>`;
            }
            return formattedTime;
        } catch (e) {
            console.warn('formatEndTime 异常:', e, timeStr);
            return '';
        }
    };

    const startTime = formatStartTime(task.startDate);
    const endTime = formatEndTime(task.endDate);
    const timeDisplay = startTime && endTime ? `${startTime} - ${endTime}` :
        startTime ? `${t('startTime')}: ${startTime}` :
            endTime ? `${t('endTime')}: ${endTime}` : '';

    const hasSubtasks = Array.isArray(task.subtasks) && task.subtasks.length > 0;
    const completedSubtasks = hasSubtasks ? task.subtasks.filter(sub => sub.completed).length : 0;
    const addressText = task.address ? task.address.trim() : '';
    const hasAddress = Boolean(addressText);
    const shortAddress = hasAddress && addressText.length > 18 ? `${addressText.slice(0, 18)}…` : addressText;
    const subtaskBadgeTitle = hasSubtasks ? `子任务进度 ${completedSubtasks}/${task.subtasks.length}` : '';

    const li = document.createElement('li');
    li.className = 'task-item';
    // 修复：同时设置 data-id 和 data-task-id 以确保兼容性
    li.setAttribute('data-id', task.id);
    li.setAttribute('data-task-id', task.id);
    li.setAttribute('data-priority', task.priority);

    // 在四象限视图中，任务元素需要设置draggable属性以支持拖拽
    if (!isListView) {
        li.setAttribute('draggable', 'true');
    }

    if (task.completed) {
        li.classList.add('completed');
    }

    if (task.pinned) {
        li.classList.add('pinned');
    }

    // 检查开始时间是否已过期，过期则添加红色样式
    if (task.startDate && !task.completed) {
        const startDate = new Date(task.startDate);
        if (!isNaN(startDate.getTime()) && startDate < new Date()) {
            li.classList.add('start-overdue');
        }
    }

    li.append(createTaskItemContent({
        task,
        isListView,
        priorityColors,
        priorityLabels,
        timeDisplay,
        hasSubtasks,
        completedSubtasks,
        subtaskBadgeTitle,
        hasAddress,
        addressText,
        shortAddress
    }));

    // 四象限视图中不添加点击事件，只有添加任务页面才能点击编辑
    if (!isListView) {
        li.classList.add('task-item-draggable');
    }

    const titleEl = li.querySelector('.task-title');
    if (titleEl) {
        titleEl.addEventListener('click', (event) => handleTaskTitleClick(event, task.id));
    }

    if (!isListView) {
        const toggleBtn = li.querySelector('.task-main-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (event) => handleQuadrantMainToggle(event, task.id));
        }
    }

    const pinBtn = li.querySelector('.pin-task');
    if (pinBtn) {
        pinBtn.addEventListener('click', (event) => togglePin(event, task.id));
    }

    if (!isListView && hasSubtasks) {
        const contentEl = li.querySelector('.task-content');
        if (contentEl) {
            const previewList = document.createElement('ul');
            previewList.className = 'task-subtasks-preview';
            task.subtasks.forEach(subtask => {
                const item = document.createElement('li');
                item.className = 'task-subtasks-preview-item';
                if (subtask.completed) {
                    item.classList.add('completed');
                }
                item.setAttribute('data-task-id', task.id);
                item.setAttribute('data-subtask-id', subtask.id);
                const icon = document.createElement('span');
                icon.className = 'material-icons';
                icon.textContent = subtask.completed ? 'check_circle' : 'radio_button_unchecked';
                const text = document.createElement('span');
                text.textContent = subtask.title || t('unnamedTask');
                item.appendChild(icon);
                item.appendChild(text);
                item.addEventListener('click', (event) => handleQuadrantSubtaskToggle(event, task.id, subtask.id));
                previewList.appendChild(item);
            });

            // 清除旧的子任务列表（如果存在）
            const oldPreviewList = contentEl.querySelector('.task-subtasks-preview');
            if (oldPreviewList) {
                oldPreviewList.remove();
            }

            contentEl.appendChild(previewList);

            // 恢复之前的折叠状态
            if (task.subtasksCollapsed) {
                previewList.classList.add('collapsed');
            }

            // 添加折叠按钮的点击事件
            const toggleBtn = li.querySelector('.subtasks-toggle');
            if (toggleBtn) {
                // 更新折叠按钮图标以反映当前状态
                const collapseIcon = toggleBtn.querySelector('.collapse-icon');
                if (collapseIcon) {
                    // 当列表折叠时显示向下箭头（表示可以展开），当列表展开时显示向上箭头（表示可以折叠）
                    collapseIcon.textContent = task.subtasksCollapsed ? 'expand_more' : 'expand_less';
                }

                toggleBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    // 切换折叠状态
                    const isCollapsed = previewList.classList.toggle('collapsed');
                    const collapseIcon = toggleBtn.querySelector('.collapse-icon');

                    // 更新图标：折叠后显示向下箭头（可以展开），展开后显示向上箭头（可以折叠）
                    if (collapseIcon) {
                        collapseIcon.textContent = isCollapsed ? 'expand_more' : 'expand_less';
                    }

                    // 保存折叠状态到任务对象
                    const taskToUpdate = tasks.find(t => t.id === task.id);
                    if (taskToUpdate) {
                        taskToUpdate.subtasksCollapsed = isCollapsed;
                        // 保存任务数据
                        saveTasksToStorage();
                    }
                });
            }
        }
    }

    return li;
}

function createTaskItemContent(options) {
    const {
        task,
        isListView,
        priorityColors,
        priorityLabels,
        timeDisplay,
        hasSubtasks,
        completedSubtasks,
        subtaskBadgeTitle,
        hasAddress,
        addressText,
        shortAddress
    } = options;
    const fragment = document.createDocumentFragment();

    if (isListView) {
        const checkboxWrapper = document.createElement('div');
        checkboxWrapper.className = 'task-checkbox';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `task-${task.id}`;
        checkbox.dataset.taskId = task.id;
        checkboxWrapper.appendChild(checkbox);
        fragment.appendChild(checkboxWrapper);
    }

    const content = document.createElement('div');
    content.className = 'task-content';
    const header = document.createElement('div');
    header.className = 'task-content-header';

    if (!isListView) {
        const toggle = document.createElement('button');
        toggle.className = task.completed ? 'task-main-toggle completed' : 'task-main-toggle';
        toggle.type = 'button';
        toggle.dataset.taskId = task.id;
        toggle.title = task.completed ? t('markAsIncomplete') : t('markAsComplete');
        toggle.style.color = priorityColors[task.priority] || '#666';
        toggle.appendChild(createMaterialIcon(task.completed ? 'check_circle' : 'radio_button_unchecked'));
        header.appendChild(toggle);
    }

    const title = document.createElement('span');
    title.className = task.completed ? 'task-title completed-text' : 'task-title';
    title.textContent = getTaskDisplayTitle(task) || t('unnamedTask');
    header.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    if (isListView) {
        const priorityDot = document.createElement('span');
        priorityDot.className = 'priority-dot';
        priorityDot.style.backgroundColor = priorityColors[task.priority] || '#666';
        const priority = document.createElement('span');
        priority.className = 'task-priority';
        priority.style.color = priorityColors[task.priority] || '#666';
        priority.textContent = priorityLabels[task.priority] || t('uncategorized');
        meta.append(priorityDot, priority);
    }
    if (timeDisplay) {
        const time = document.createElement('span');
        time.className = 'task-time';
        const overdueTimePattern = /<span class="task-end-overdue">([^<]*)<\/span>/g;
        let cursor = 0;
        let overdueMatch;
        while ((overdueMatch = overdueTimePattern.exec(timeDisplay)) !== null) {
            if (overdueMatch.index > cursor) {
                time.appendChild(document.createTextNode(timeDisplay.slice(cursor, overdueMatch.index)));
            }
            const overduePart = document.createElement('span');
            overduePart.className = 'task-end-overdue';
            overduePart.textContent = overdueMatch[1];
            time.appendChild(overduePart);
            cursor = overdueTimePattern.lastIndex;
        }
        if (cursor < timeDisplay.length) {
            time.appendChild(document.createTextNode(timeDisplay.slice(cursor)));
        }
        meta.appendChild(time);
    }
    if (!isListView && hasSubtasks) {
        const subtasks = document.createElement('span');
        subtasks.className = 'task-meta-badge subtasks subtasks-toggle';
        subtasks.title = subtaskBadgeTitle;
        subtasks.dataset.taskId = task.id;
        subtasks.append(
            createMaterialIcon('checklist'),
            document.createTextNode(`${completedSubtasks}/${task.subtasks.length}`),
            createMaterialIcon(task.subtasksCollapsed ? 'expand_more' : 'expand_less', 'collapse-icon')
        );
        meta.appendChild(subtasks);
    }
    if (!isListView && hasAddress) {
        const location = document.createElement('span');
        location.className = 'task-meta-badge location';
        location.title = addressText;
        location.append(createMaterialIcon('place'), document.createTextNode(shortAddress));
        meta.appendChild(location);
    }

    content.append(header, meta);
    fragment.appendChild(content);

    const buttons = document.createElement('div');
    buttons.className = 'task-buttons';
    if (isListView) {
        buttons.append(
            createTaskActionButton('complete-task', task.completed ? 'check_circle' : 'check_circle_outline', task.completed ? t('markAsIncomplete') : t('markAsComplete'), task.id, 'complete', task.completed),
            createTaskActionButton('edit-task', 'edit', t('editTask'), task.id, 'edit')
        );
    }
    buttons.append(
        createTaskActionButton('copy-task', 'content_copy', t('copyTask'), task.id, 'copy'),
        createTaskPinButton(task),
        createTaskActionButton('delete-task', 'delete', t('deleteTask'), task.id, 'delete')
    );
    fragment.appendChild(buttons);
    return fragment;
}

function createMaterialIcon(iconName, extraClass = '') {
    const icon = document.createElement('span');
    icon.className = extraClass ? `material-icons ${extraClass}` : 'material-icons';
    icon.textContent = iconName;
    return icon;
}

function createTaskActionButton(className, iconName, title, taskId, action, isCompleted = false) {
    const button = document.createElement('span');
    button.className = isCompleted ? `${className} completed` : className;
    button.title = title;
    button.dataset.taskId = taskId;
    button.dataset.action = action;
    button.appendChild(createMaterialIcon(iconName));
    return button;
}

function createTaskPinButton(task) {
    const button = document.createElement('span');
    button.className = task.pinned ? 'pin-task pinned' : 'pin-task';
    button.title = task.pinned ? t('unpinTask') : t('pinTask');
    button.appendChild(createMaterialIcon(task.pinned ? 'star' : 'star_border'));
    return button;
}

function handleTaskTitleClick(event, taskId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    openTaskDetail(taskId);
}

function handleQuadrantMainToggle(event, taskId) {
    event?.preventDefault();
    event?.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 如果任务未完成，显示确认对话框
    if (!task.completed) {
        confirmCompleteTask(taskId);
    } else {
        // 如果任务已完成，直接取消完成（不需要确认）
        // toggleComplete 内部已包含保存和渲染逻辑
        const stubEvent = { stopPropagation() { }, preventDefault() { } };
        toggleComplete(stubEvent, taskId);
        // 取消完成时，不改变子任务状态
    }
}

function showCompleteTaskConfirmDialog(taskId, task) {
    const hasSubtasks = Array.isArray(task.subtasks) && task.subtasks.length > 0;
    const subtaskCount = hasSubtasks ? task.subtasks.length : 0;
    const completedSubtasks = hasSubtasks ? task.subtasks.filter(sub => sub.completed).length : 0;

    const modal = document.createElement('div');
    modal.className = 'task-complete-confirm-modal';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', closeCompleteTaskConfirmDialog);

    const content = document.createElement('div');
    content.className = 'modal-content';

    const header = document.createElement('div');
    header.className = 'modal-header';
    const title = document.createElement('h3');
    title.textContent = '确认完成任务';
    header.appendChild(title);

    const body = document.createElement('div');
    body.className = 'modal-body';

    const message = document.createElement('p');
    message.append(
        document.createTextNode('确定要完成任务 "'),
        (() => {
            const strong = document.createElement('strong');
            strong.textContent = getTaskDisplayTitle(task) || t('unnamedTask');
            return strong;
        })(),
        document.createTextNode('" 吗？')
    );
    body.appendChild(message);

    if (hasSubtasks) {
        const subtaskInfo = document.createElement('p');
        subtaskInfo.className = 'subtask-info';
        subtaskInfo.textContent = `该任务包含 ${subtaskCount} 个子任务，${completedSubtasks} 个已完成。完成主任务后，所有子任务也将被标记为完成。`;
        body.appendChild(subtaskInfo);
    }

    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn-secondary';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', closeCompleteTaskConfirmDialog);

    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn-primary';
    confirmButton.textContent = '确认完成';
    confirmButton.addEventListener('click', () => confirmCompleteTask(taskId));

    footer.append(cancelButton, confirmButton);
    content.append(header, body, footer);
    modal.append(overlay, content);
    document.body.appendChild(modal);

    // 存储模态框引用以便关闭
    window.currentCompleteConfirmModal = modal;
}

function closeCompleteTaskConfirmDialog() {
    if (window.currentCompleteConfirmModal) {
        window.currentCompleteConfirmModal.remove();
        window.currentCompleteConfirmModal = null;
    }
}

function confirmCompleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // 关闭确认对话框
    closeCompleteTaskConfirmDialog();

    // 备份子任务原始状态（用于可能的回滚）
    const originalSubtasksState = Array.isArray(task.subtasks)
        ? task.subtasks.map(sub => ({ id: sub.id, completed: sub.completed }))
        : [];

    // 完成任务（toggleComplete 内部会保存并检查结果）
    const stubEvent = { stopPropagation() { }, preventDefault() { } };
    toggleComplete(stubEvent, taskId);

    // 如果任务仍在内存中且未完成（回滚了），说明 toggleComplete 保存失败
    const stillInMemory = tasks.find(t => t.id === taskId);
    if (!stillInMemory || stillInMemory.completed !== true) {
        // 保存失败，回滚子任务
        if (originalSubtasksState.length > 0) {
            const currentTask = tasks.find(t => t.id === taskId);
            if (currentTask && Array.isArray(currentTask.subtasks)) {
                currentTask.subtasks.forEach(sub => {
                    const original = originalSubtasksState.find(os => os.id === sub.id);
                    if (original) sub.completed = original.completed;
                });
            }
        }
        return;
    }

    // 如果任务有子任务，将所有子任务标记为完成
    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
        task.subtasks.forEach(subtask => {
            subtask.completed = true;
        });

        const saved = saveTasks();
        if (saved === false) {
            // 子任务保存失败，回滚子任务状态
            task.subtasks.forEach(sub => {
                const original = originalSubtasksState.find(os => os.id === sub.id);
                if (original) sub.completed = original.completed;
            });
            syncTasksToWindow();
            return;
        }
    }

    render();

    // 显示完成提示
    showNotification('任务已完成', 'success');
}

function handleQuadrantSubtaskToggle(event, taskId, subtaskId) {
    event?.preventDefault();
    event?.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task || !Array.isArray(task.subtasks)) return;
    const subtask = task.subtasks.find(sub => sub.id === subtaskId);
    if (!subtask) return;

    // 只切换子任务状态，不自动完成主任务
    const wasCompleted = subtask.completed;
    subtask.completed = !subtask.completed;
    const saved = saveTasks();
    if (saved === false) {
        // 保存失败，回滚
        subtask.completed = wasCompleted;
        syncTasksToWindow();
        return;
    }
    render();
}

function initializeTaskDetailPanel() {
    taskDetailPanelEl = document.getElementById('task-detail-panel');
    taskDetailOverlayEl = document.getElementById('task-detail-overlay');
    if (!taskDetailPanelEl || !taskDetailOverlayEl) {
        console.warn('任务详情面板未找到，跳过初始化');
        return;
    }

    detailTitleInputEl = document.getElementById('detail-task-title');
    detailTitleEnInputEl = document.getElementById('detail-task-title-en');
    detailStartInputEl = document.getElementById('detail-task-start');
    detailEndInputEl = document.getElementById('detail-task-end');
    detailRepeatSelectEl = document.getElementById('detail-repeat-rule');
    detailAddressInputEl = document.getElementById('detail-task-address');
    detailNotesInputEl = document.getElementById('detail-task-notes');
    detailSubtasksListEl = document.getElementById('detail-subtasks-list');
    detailAddSubtaskBtn = document.getElementById('detail-add-subtask');
    detailImageInputEl = document.getElementById('detail-image-input');
    detailImagePreviewEl = document.getElementById('detail-image-preview');
    detailUploadBtnEl = document.getElementById('detail-upload-btn');
    detailRemoveImageBtnEl = document.getElementById('detail-remove-image');
    detailSaveBtnEl = document.getElementById('detail-save-btn');
    detailCancelBtnEl = document.getElementById('detail-cancel-btn');
    detailCaptionEl = document.getElementById('detail-task-caption');
    detailActionButtons = Array.from(document.querySelectorAll('.detail-action-btn'));

    detailActionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            if (target) {
                scrollDetailSection(target);
            }
        });
    });

    detailAddSubtaskBtn?.addEventListener('click', addDetailSubtask);
    detailUploadBtnEl?.addEventListener('click', () => detailImageInputEl?.click());
    detailImageInputEl?.addEventListener('change', handleDetailImageUpload);
    detailRemoveImageBtnEl?.addEventListener('click', clearDetailImage);
    detailSaveBtnEl?.addEventListener('click', saveTaskDetailChanges);
    detailCancelBtnEl?.addEventListener('click', closeTaskDetailPanel);

    const closeBtn = document.getElementById('detail-close-btn');
    const collapseBtn = document.getElementById('detail-collapse-btn');
    closeBtn?.addEventListener('click', closeTaskDetailPanel);
    collapseBtn?.addEventListener('click', closeTaskDetailPanel);
    taskDetailOverlayEl.addEventListener('click', closeTaskDetailPanel);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && taskDetailPanelEl.classList.contains('visible')) {
            closeTaskDetailPanel();
        }
    });
}

function scrollDetailSection(targetId) {
    const section = document.getElementById(targetId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function openTaskDetail(taskId) {
    if (!taskDetailPanelEl) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    ensureTaskDetailFields(task);

    currentDetailTaskId = taskId;
    detailTitleInputEl.value = task.title || '';
    detailTitleEnInputEl.value = task.titleTranslations?.en || '';
    detailStartInputEl.value = task.startDate || '';
    detailEndInputEl.value = task.endDate || '';
    detailRepeatSelectEl.value = task.repeatRule || 'none';
    detailAddressInputEl.value = task.address || '';
    detailNotesInputEl.value = task.notes || '';
    detailSubtasksState = Array.isArray(task.subtasks) ? task.subtasks.map(sub => ({ ...sub })) : [];
    detailImageDataUrl = task.detailImage || '';

    if (detailCaptionEl) {
        detailCaptionEl.textContent = formatDetailTimestamp(task);
    }

    updateDetailImagePreview();
    renderDetailSubtasks();

    taskDetailPanelEl.classList.add('visible');
    taskDetailPanelEl.setAttribute('aria-hidden', 'false');
    taskDetailOverlayEl.classList.add('visible');
    taskDetailOverlayEl.setAttribute('aria-hidden', 'false');
}

function closeTaskDetailPanel() {
    if (!taskDetailPanelEl) return;
    taskDetailPanelEl.classList.remove('visible');
    taskDetailPanelEl.setAttribute('aria-hidden', 'true');
    if (taskDetailOverlayEl) {
        taskDetailOverlayEl.classList.remove('visible');
        taskDetailOverlayEl.setAttribute('aria-hidden', 'true');
    }
    resetTaskDetailPanel();
}

function resetTaskDetailPanel() {
    currentDetailTaskId = null;
    detailSubtasksState = [];
    detailImageDataUrl = '';
    if (detailTitleInputEl) detailTitleInputEl.value = '';
    if (detailTitleEnInputEl) detailTitleEnInputEl.value = '';
    if (detailStartInputEl) detailStartInputEl.value = '';
    if (detailEndInputEl) detailEndInputEl.value = '';
    if (detailRepeatSelectEl) detailRepeatSelectEl.value = 'none';
    if (detailAddressInputEl) detailAddressInputEl.value = '';
    if (detailNotesInputEl) detailNotesInputEl.value = '';
    updateDetailImagePreview();
    renderDetailSubtasks();
}

function renderDetailSubtasks() {
    if (!detailSubtasksListEl) return;
    detailSubtasksListEl.replaceChildren();

    if (detailSubtasksState.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'detail-empty';
        empty.textContent = '还没有子任务，点击下方按钮添加';
        detailSubtasksListEl.appendChild(empty);
        return;
    }

    detailSubtasksState.forEach(subtask => {
        const row = createDetailSubtaskRow(subtask);
        const checkbox = row.querySelector('input[type="checkbox"]');
        const input = row.querySelector('input[type="text"]');
        const removeBtn = row.querySelector('button');

        checkbox.addEventListener('change', (event) => {
            toggleDetailSubtaskCompletion(subtask.id, event.target.checked);
        });

        input.addEventListener('input', (event) => {
            updateDetailSubtaskTitle(subtask.id, event.target.value);
        });

        removeBtn.addEventListener('click', () => removeDetailSubtask(subtask.id));

        detailSubtasksListEl.appendChild(row);
    });
}

function createDetailSubtaskRow(subtask) {
    const row = document.createElement('div');
    row.className = 'detail-subtask-row';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(subtask.completed);
    checkbox.dataset.subtaskId = subtask.id;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = subtask.title || '';
    input.placeholder = '输入子任务...';
    input.dataset.subtaskId = subtask.id;

    const removeButton = document.createElement('button');
    removeButton.className = 'detail-icon-btn danger';
    removeButton.dataset.subtaskId = subtask.id;
    removeButton.setAttribute('aria-label', '删除子任务');

    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = 'close';
    removeButton.appendChild(icon);

    row.append(checkbox, input, removeButton);
    return row;
}

function addDetailSubtask() {
    detailSubtasksState.push({
        id: `subtask-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: '',
        completed: false
    });
    renderDetailSubtasks();
}

function updateDetailSubtaskTitle(subtaskId, value) {
    const subtask = detailSubtasksState.find(sub => sub.id === subtaskId);
    if (subtask) {
        subtask.title = value;
    }
}

function toggleDetailSubtaskCompletion(subtaskId, completed) {
    const subtask = detailSubtasksState.find(sub => sub.id === subtaskId);
    if (subtask) {
        subtask.completed = completed;
    }
}

function removeDetailSubtask(subtaskId) {
    detailSubtasksState = detailSubtasksState.filter(sub => sub.id !== subtaskId);
    renderDetailSubtasks();
}

function handleDetailImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        detailImageDataUrl = e.target.result;
        updateDetailImagePreview();
    };
    reader.readAsDataURL(file);
}

function clearDetailImage() {
    detailImageDataUrl = '';
    if (detailImageInputEl) {
        detailImageInputEl.value = '';
    }
    updateDetailImagePreview();
}

function updateDetailImagePreview() {
    if (!detailImagePreviewEl) return;
    if (detailImageDataUrl) {
        detailImagePreviewEl.classList.add('has-image');
        detailImagePreviewEl.style.backgroundImage = `url(${detailImageDataUrl})`;
        detailImagePreviewEl.replaceChildren();
    } else {
        detailImagePreviewEl.classList.remove('has-image');
        detailImagePreviewEl.style.backgroundImage = '';
        detailImagePreviewEl.replaceChildren(createDetailImagePlaceholder());
    }
}

function createDetailImagePlaceholder() {
    const wrapper = document.createElement('div');
    wrapper.className = 'preview-text';

    const icon = document.createElement('span');
    icon.className = 'material-icons detail-preview-upload-icon';
    icon.textContent = 'add_photo_alternate';

    const label = document.createElement('span');
    label.textContent = '\u4e0a\u4f20\u7075\u611f\u56fe / \u622a\u56fe';

    wrapper.append(icon, label);
    return wrapper;
}

/**
 * 将 datetime-local 格式的值转为规范的 ISO 字符串，确保 new Date() 可稳定解析
 * datetime-local 格式为 YYYY-MM-DDTHH:MM（不含秒和时区），直接传给 new Date()
 * 在不同浏览器存在兼容差异。此函数补全秒数并转为 UTC ISO 字符串。
 * @param {string|null|undefined} value - datetime-local 输入值或 null
 * @returns {string|null} 规范化后的 ISO 字符串，无效输入返回 null
 */
function normalizeDateTimeLocal(value) {
    if (!value) return null;
    let dateStr = String(value);
    // 如果缺少秒数（datetime-local 标准格式），补上 :00
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateStr)) {
        dateStr += ':00';
    }
    try {
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return null;
        return date.toISOString();
    } catch (_) {
        return null;
    }
}

function saveTaskDetailChanges() {
    if (!currentDetailTaskId) return;
    const task = tasks.find(t => t.id === currentDetailTaskId);
    if (!task) return;

    const newTitle = detailTitleInputEl?.value.trim();
    if (newTitle) {
        task.title = newTitle;
        if (task.titleTranslations) {
            task.titleTranslations.zh = newTitle;
        }
    }

    if (task.titleTranslations && detailTitleEnInputEl) {
        task.titleTranslations.en = detailTitleEnInputEl.value.trim();
    }

    // 保存旧的时间值
    const oldStartDate = task.startDate;
    const oldEndDate = task.endDate;

    // 【修复】将 datetime-local 值规范化为 ISO 字符串，确保 new Date() 可跨浏览器稳定解析
    task.startDate = normalizeDateTimeLocal(detailStartInputEl?.value);
    task.endDate = normalizeDateTimeLocal(detailEndInputEl?.value);
    task.repeatRule = detailRepeatSelectEl?.value || 'none';
    task.address = detailAddressInputEl?.value.trim() || '';
    task.notes = detailNotesInputEl?.value.trim() || '';
    task.detailImage = detailImageDataUrl;
    task.subtasks = detailSubtasksState
        .filter(sub => sub.title && sub.title.trim())
        .map(sub => ({
            id: sub.id,
            title: sub.title.trim(),
            completed: Boolean(sub.completed)
        }));

    // 如果时间被修改了，清除该任务的旧提醒记录
    if ((task.startDate !== oldStartDate) || (task.endDate !== oldEndDate)) {
        console.log('🕐 任务时间已修改，清除旧提醒记录');
        const startKey = `start-${task.id}`;
        const endKey = `end-${task.id}`;

        // 删除所有匹配的提醒记录
        const keysToDelete = [];
        notifiedTasks.forEach(key => {
            if (key.startsWith(startKey) || key.startsWith(endKey)) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => notifiedTasks.delete(key));
        if (keysToDelete.length > 0) {
            saveNotifiedTasks();
            console.log(`✅ 已清除 ${keysToDelete.length} 条旧提醒记录`);
        }
    }

    saveTasks();
    render();
    closeTaskDetailPanel();

    if (typeof showPageNotification === 'function') {
        showPageNotification('任务已更新');
    }
}

function formatDetailTimestamp(task) {
    if (task.endDate) {
        return `截止：${formatTaskDate(task.endDate)}`;
    }
    if (task.startDate) {
        return `开始：${formatTaskDate(task.startDate)}`;
    }
    if (task.createdAt) {
        return `创建于 ${formatTaskDate(task.createdAt)}`;
    }
    return '随手记录，随时执行';
}

function showInitialInput() {
    initialAddContainerEl.style.display = 'none';
    taskFormContainerEl.style.display = 'block';
    taskFormContainerEl.replaceChildren(createTaskInputForm());

    const form = taskFormContainerEl.querySelector('form');
    if (form) {
        form.addEventListener('submit', handleAddTask);
        bindTaskInputFormEvents(form);
    }

    // 添加象限选择器事件监听
    const quadrantOptions = document.querySelectorAll('.quadrant-option');
    quadrantOptions.forEach(option => {
        option.addEventListener('click', function () {
            // 移除其他选项的选中状态
            quadrantOptions.forEach(opt => opt.classList.remove('selected'));
            // 添加当前选项的选中状态
            this.classList.add('selected');
        });
    });

    taskFormContainerEl.querySelector('.task-input').focus();
}

function handleAddTask(event) {
    event.preventDefault();
    const input = event.target.querySelector('.task-input');
    const title = input.value.trim();
    if (title) {
        // 获取选中的象限
        const selectedQuadrant = document.querySelector('.quadrant-option.selected');
        const priority = selectedQuadrant ? parseInt(selectedQuadrant.dataset.priority) : 4;

        const newTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: title,
            titleTranslations: {
                zh: title,
                en: '' // 英文翻译将在用户输入时添加
            },
            completed: false,
            priority: priority,
            createdAt: new Date().toISOString(),
            startDate: null,
            endDate: null,
            pinned: false,
            notes: '',
            address: '',
            repeatRule: 'none',
            detailImage: '',
            subtasks: []
        };
        tasks.unshift(newTask);

        // 重要：保存任务到localStorage
        const saved = saveTasks();
        if (saved === false) {
            tasks = tasks.filter(task => task.id !== newTask.id);
            syncTasksToWindow();
            return;
        }

        // 触发任务创建事件，供行为分析器收集数据
        const taskCreatedEvent = new CustomEvent('taskCreated', {
            detail: {
                title: title,
                priority: priority,
                estimatedTime: null, // 可以后续添加时间估算
                timestamp: newTask.createdAt
            }
        });
        document.dispatchEvent(taskCreatedEvent);

        // 记录用户活动
        const userSession = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
        let currentUser = null;
        if (userSession) {
            try {
                const parsedSession = JSON.parse(userSession);
                if (parsedSession.user) {
                    currentUser = parsedSession.user;
                } else if (parsedSession.id) {
                    currentUser = parsedSession;
                }
            } catch (e) {
                console.error('解析用户会话失败:', e);
            }
        }
        recordUserActivity(currentUser);

        // 清空输入框
        input.value = '';

        // 重新渲染
        render();

        // 清除选中状态
        document.querySelectorAll('.quadrant-option').forEach(option => {
            option.classList.remove('selected');
        });

        // 重新聚焦到输入框
        setTimeout(() => {
            const newInput = document.querySelector('.task-input');
            if (newInput) {
                newInput.focus();
            }
        }, 100);
    }
}

function toggleComplete(event, id) {
    event.stopPropagation();
    const task = tasks.find(t => t.id === id);
    if (task) {
        const wasCompleted = task.completed;
        task.completed = !task.completed;

        // 如果任务完成，从已提醒列表中移除
        if (task.completed && notifiedTasks.has(id)) {
            notifiedTasks.delete(id);
            saveNotifiedTasks();
        }

        // 如果任务状态从未完成变为完成，触发任务完成事件
        if (!wasCompleted && task.completed) {
            const taskCompletedEvent = new CustomEvent('taskCompleted', {
                detail: {
                    title: task.title,
                    priority: task.priority,
                    actualTime: null, // 可以后续添加实际时间
                    timestamp: new Date().toISOString()
                }
            });
            document.dispatchEvent(taskCompletedEvent);
        }

        const saved = saveTasks();
        if (saved === false) {
            // 保存失败，回滚状态
            task.completed = wasCompleted;
            syncTasksToWindow();
            return;
        }
        render();
    }
}

function togglePin(event, id) {
    event.stopPropagation();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.pinned = !task.pinned;
        saveTasks();
        render();
    }
}

// 视图切换函数 - 性能优化版本（使用DOM缓存）
// Main SPA view switching has been moved to js/view-switch-core.js.

function openModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    currentEditingId = taskId;

    // 填充模态框表单
    modalTaskTitleEl.value = task.title || '';
    modalTaskTitleEnEl.value = (task.titleTranslations && task.titleTranslations.en) || '';
    modalTaskPriorityEl.value = task.priority || 1;
    modalTaskStartEl.value = task.startDate || '';
    modalTaskEndEl.value = task.endDate || '';

    // 显示模态框
    modalEl.style.display = 'block';

    // 聚焦到标题输入框
    setTimeout(() => {
        modalTaskTitleEl.focus();
        modalTaskTitleEl.select();
    }, 100);
}

function closeModal() {
    modalEl.style.display = 'none';
    currentEditingId = null;

    // 清空表单
    modalTaskTitleEl.value = '';
    modalTaskTitleEnEl.value = '';
    modalTaskPriorityEl.value = '1';
    modalTaskStartEl.value = '';
    modalTaskEndEl.value = '';
}

function updateTask() {
    if (!currentEditingId) return;

    const task = tasks.find(t => t.id === currentEditingId);
    if (task) {
        task.title = modalTaskTitleEl.value.trim();

        // 更新翻译信息
        if (!task.titleTranslations) {
            task.titleTranslations = { zh: task.title, en: '' };
        }
        task.titleTranslations.zh = task.title;
        task.titleTranslations.en = modalTaskTitleEnEl.value.trim();

        task.priority = parseInt(modalTaskPriorityEl.value);
        task.startDate = normalizeDateTimeLocal(modalTaskStartEl.value);
        task.endDate = normalizeDateTimeLocal(modalTaskEndEl.value);

        saveTasks();
        closeModal();
        render();
    }
}

function deleteTask() {
    if (!currentEditingId) return;

    // 清除该任务的提醒
    clearTaskReminder(currentEditingId);

    tasks = tasks.filter(t => t.id !== currentEditingId);
    saveTasks();
    closeModal();
    render();
}

function createTaskDuplicate(originalTask) {
    if (!originalTask) return null;
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const baseTitle = stripCopySuffix(originalTask.title || t('unnamedTask'));
    const clonedSubtasks = Array.isArray(originalTask.subtasks)
        ? originalTask.subtasks.map(sub => ({
            ...sub,
            id: `subtask-${Date.now()}-${Math.random().toString(16).slice(2)}`
        }))
        : [];
    const clonedTranslations = originalTask.titleTranslations && typeof originalTask.titleTranslations === 'object'
        ? Object.keys(originalTask.titleTranslations).reduce((acc, lang) => {
            acc[lang] = stripCopySuffix(originalTask.titleTranslations[lang] || baseTitle);
            return acc;
        }, {})
        : { zh: baseTitle, en: '' };

    return {
        ...originalTask,
        id: `task-${timestamp}-${randomSuffix}`,
        title: baseTitle,
        titleTranslations: clonedTranslations,
        subtasks: clonedSubtasks,
        createdAt: new Date().toISOString(),
        completed: false
    };
}

function duplicateTask() {
    if (!currentEditingId) return;
    const originalTask = tasks.find(t => t.id === currentEditingId);
    if (originalTask) {
        const newTask = createTaskDuplicate(originalTask);
        if (!newTask) return;
        const originalIndex = tasks.findIndex(t => t.id === currentEditingId);
        tasks.splice(originalIndex + 1, 0, newTask);
        saveTasks();
        closeModal();
        render();
    }
}

function setTop() {
    if (!currentEditingId) return;
    const taskIndex = tasks.findIndex(t => t.id === currentEditingId);
    if (taskIndex > 0) {
        const [taskToMove] = tasks.splice(taskIndex, 1);
        tasks.unshift(taskToMove);
    }
    saveTasks();
    closeModal();
    render();
}

function copyTask(event, taskId) {
    event?.stopPropagation();
    if (event && !event.target.closest('.copy-task')) {
        console.warn('⚠️ 非预期的复制触发已被阻止');
        return;
    }
    const originalTask = tasks.find(t => t.id === taskId);
    if (originalTask) {
        const newTask = createTaskDuplicate(originalTask);
        if (!newTask) return;
        const originalIndex = tasks.findIndex(t => t.id === taskId);
        tasks.splice(originalIndex + 1, 0, newTask);
        saveTasks();
        render();
    }
}

async function deleteTaskFromList(event, taskId) {
    event.stopPropagation();
    const confirmed = await showConfirmModal({
        title: t('deleteTask'),
        message: t('confirmDeleteTask'),
        type: 'danger',
        confirmText: '删除',
        cancelText: '取消'
    });

    if (confirmed) {
        // 从提醒记录中移除
        notifiedTasks.delete(taskId);

        const deletedTask = tasks.find(task => task.id === taskId);
        tasks = tasks.filter(task => task.id !== taskId);
        const saved = saveTasks();
        if (saved === false) {
            // 保存失败，回滚
            if (deletedTask) {
                tasks.push(deletedTask);
            }
            syncTasksToWindow();
            if (typeof showPageNotification === 'function') {
                showPageNotification('删除失败，请重试');
            }
            return;
        }
        render();
    }
}

// 动态加载SortableJS库
function loadSortableJS() {
    if (typeof Sortable !== 'undefined') {
        return Promise.resolve(); // 已经加载了
    }

    return new Promise((resolve, reject) => {
        console.log('🔄 尝试动态加载SortableJS库...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
        script.onload = function () {
            console.log('✅ SortableJS库加载成功');
            resolve();
        };
        script.onerror = function () {
            console.warn('⚠️ SortableJS库加载失败，拖拽功能将不可用');
            reject(new Error('SortableJS加载失败'));
        };
        document.head.appendChild(script);
    });
}

let chartJsLoadPromise = null;
let visualizationChartsLoadPromise = null;

function ensureChartJsLoaded(callback) {
    if (typeof Chart !== 'undefined') {
        window._chartJsLoaded = true;
        if (typeof callback === 'function') callback();
        return Promise.resolve(Chart);
    }

    if (!chartJsLoadPromise) {
        window._chartJsLoading = true;
        chartJsLoadPromise = new Promise((resolve, reject) => {
            const existingScript = document.querySelector('script[data-lib="chartjs"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve(window.Chart), { once: true });
                existingScript.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.defer = true;
            script.dataset.lib = 'chartjs';
            script.onload = () => {
                window._chartJsLoaded = true;
                window._chartJsLoading = false;
                console.log('✅ Chart.js已按需加载，版本:', Chart.version);
                resolve(window.Chart);
            };
            script.onerror = () => {
                window._chartJsLoading = false;
                console.warn('⚠️ Chart.js按需加载失败，图表功能暂不可用');
                reject(new Error('Chart.js加载失败'));
            };
            document.head.appendChild(script);
        });
    }

    return chartJsLoadPromise
        .then(() => {
            if (typeof callback === 'function') callback();
            return window.Chart;
        })
        .catch(error => {
            console.warn('⚠️ 图表库加载失败:', error);
            return null;
        });
}

function ensureVisualizationChartsLoaded(callback) {
    if (typeof VisualizationCharts !== 'undefined') {
        if (typeof callback === 'function') callback();
        return Promise.resolve(VisualizationCharts);
    }

    if (!visualizationChartsLoadPromise) {
        visualizationChartsLoadPromise = new Promise((resolve, reject) => {
            const existingScript = document.querySelector('script[data-lib="visualization-charts"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve(window.VisualizationCharts), { once: true });
                existingScript.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'visualization-charts.js?v=1.0.11';
            script.defer = true;
            script.dataset.lib = 'visualization-charts';
            script.onload = () => {
                console.log('✅ 可视化看板模块已按需加载');
                resolve(window.VisualizationCharts);
            };
            script.onerror = () => {
                console.warn('⚠️ 可视化看板模块加载失败');
                reject(new Error('可视化看板模块加载失败'));
            };
            document.head.appendChild(script);
        });
    }

    return visualizationChartsLoadPromise
        .then(() => {
            if (typeof callback === 'function') callback();
            return window.VisualizationCharts;
        })
        .catch(error => {
            console.warn('⚠️ 可视化看板模块加载失败:', error);
            return null;
        });
}

/**
 * 更新任务元素的优先级颜色标记
 * @param {HTMLElement} taskItem - 任务元素
 * @param {number} priority - 新的优先级 (1-4)
 */
function updateTaskElementPriority(taskItem, priority) {
    const priorityColors = {
        1: '#ff5252', // 重要且紧急 - 红色
        2: '#ff9800', // 重要不紧急 - 橙色
        3: '#2196f3', // 不重要但紧急 - 蓝色
        4: '#4caf50'  // 不重要不紧急 - 绿色
    };

    // 更新data-priority属性
    taskItem.setAttribute('data-priority', priority);

    // 更新完成按钮（radio_button_unchecked或check_circle）的颜色
    const toggleBtn = taskItem.querySelector('.task-main-toggle');
    if (toggleBtn) {
        toggleBtn.style.color = priorityColors[priority] || '#666';
    }

    // 如果有priority-dot（列表视图），也更新它
    const priorityDot = taskItem.querySelector('.priority-dot');
    if (priorityDot) {
        priorityDot.style.backgroundColor = priorityColors[priority] || '#666';
    }

    console.log(`✅ 已更新任务颜色: ${taskItem.dataset.id} → 优先级 ${priority}`);
}

/**
 * 更新空象限的提示词显示
 * 检查每个象限是否有任务，如果没有任务则显示提示词，否则隐藏
 */
function updateEmptyStateMessages() {
    const emptyMessages = [
        t('emptyQ1'),
        t('emptyQ2'),
        t('emptyQ3'),
        t('emptyQ4')
    ];

    const quadrantElements = [
        document.getElementById('q1-tasks'),
        document.getElementById('q2-tasks'),
        document.getElementById('q3-tasks'),
        document.getElementById('q4-tasks')
    ];

    quadrantElements.forEach((el, index) => {
        if (!el) return;

        // 统计任务数量
        const taskItems = el.querySelectorAll('.task-item');
        const hasTasks = taskItems.length > 0;

        // 查找空状态提示元素
        const emptyState = el.querySelector('.empty-state');

        if (hasTasks) {
            // 有任务：移除空状态提示
            if (emptyState) {
                emptyState.remove();
            }
        } else {
            // 无任务：添加空状态提示
            if (!emptyState) {
                el.replaceChildren(createEmptyState(emptyMessages[index]));
            }
        }
    });

    console.log('✅ 已更新空象限提示词');
}

/**
 * 更新象限任务计数显示
 * 计算每个象限的未完成任务数量并更新右上角的计数显示
 */
function updateQuadrantCounts() {
    // 计算每个象限的未完成任务数量
    const quadrantTaskCounts = [0, 0, 0, 0];

    tasks.forEach(task => {
        // 确保任务有必要的字段
        if (!task || task.completed) return;

        // 只统计优先级1-4的未完成任务
        if (task.priority >= 1 && task.priority <= 4) {
            quadrantTaskCounts[task.priority - 1]++;
        }
    });

    console.log('📊 更新象限计数:', quadrantTaskCounts);

    // 更新每个象限右上角的计数显示
    quadrantTaskCounts.forEach((count, index) => {
        const countElement = document.getElementById(`q${index + 1}-count`);
        if (countElement) {
            countElement.textContent = count;
        }
    });

    console.log('✅ 已更新象限任务计数');
}

// Drag-and-drop task sorting has been moved to js/task-sortable-core.js.

function initTheme() {
    // 从本地存储加载主题设置
    const savedTheme = window.SettingsStorage
        ? window.SettingsStorage.getString('theme', 'light', ['light', 'dark'])
        : window.DataSyncStorage.getRaw('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // 绑定主题切换按钮事件
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
        console.log('主题切换按钮事件已绑定');
    }
}

// 主题切换函数
function toggleTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const newTheme = isDarkMode ? 'light' : 'dark';

    if (newTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    if (window.SettingsStorage) {
        window.SettingsStorage.setString('theme', newTheme, 'light', ['light', 'dark']);
    } else {
        window.DataSyncStorage.setRaw('theme', newTheme);
    }
    showPageNotification(newTheme === 'light' ? t('switchToLight') : t('switchToDark'));
}
function makeDraggable(modal) {
    const modalContent = modal.querySelector('.modal-content');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    modalContent.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target.closest('.modal-close') || e.target.closest('input') || e.target.closest('select') || e.target.closest('button')) {
            return;
        }

        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;

        if (e.target === modalContent || e.target.closest('.modal-header')) {
            isDragging = true;
            modalContent.classList.add('dragging');
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            modalContent.style.transform = `translate(${currentX}px, ${currentY}px)`;
            modalContent.classList.add('task-detail-modal-dragging');
        }
    }

    function dragEnd() {
        if (isDragging) {
            isDragging = false;
            modalContent.classList.remove('dragging');
        }
    }
}

// 请求通知权限
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('通知权限:', permission);
                if (permission === 'granted') {
                    showPageNotification('✅ 通知权限已获取，将为您提供任务到期提醒');
                } else {
                    showPageNotification('⚠️ 通知权限被拒绝，将使用震动和视觉提醒');
                }
            });
        } else {
            console.log('当前通知权限:', Notification.permission);
        }
    } else {
        console.log('浏览器不支持通知功能');
    }
}

// 停止提醒系统
function stopReminderSystem() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
        console.log('🛑 提醒系统已停止');
    }
}

// 关闭帮助模态框
function closeHelpModal() {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
        helpModal.style.display = 'none';
    }
}

// 个人资料相关函数
function showProfileModal() {
    try {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            // 更新用户信息
            if (typeof updateProfileInfo === 'function') {
                updateProfileInfo();
            }
            profileModal.style.display = 'block';
            profileModal.classList.add('active');
            // 禁用背景页面滚动
            document.body.style.overflow = 'hidden';
        }
    } catch (e) {
        console.warn('打开个人资料页面失败:', e);
    }
}

function closeProfileModal() {
    try {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) {
            profileModal.style.display = 'none';
            profileModal.classList.remove('active');
            // 检查是否有其他模态框还开着
            if (!document.querySelector('.modal[style*="display: block"], .modal.active')) {
                document.body.style.overflow = '';
            }
        }
    } catch (e) {
        // 静默处理
        document.body.style.overflow = '';
    }
}

// ==================== API 同步模态框 ====================

// API sync settings modal and manual sync actions have been moved to js/api-sync-ui-core.js.

function updateProfileInfo() {
    if (!currentUser) return;

    // 更新用户名
    const usernameInput = document.getElementById('profile-username');
    if (usernameInput) {
        usernameInput.value = currentUser.username || 'WQFG';
    }

    // 更新邮箱
    const emailInput = document.getElementById('profile-email');
    if (emailInput) {
        emailInput.value = currentUser.email || 'wqfg@example.com';
    }

    // 更新手机号 - 使用真实的手机号格式
    const phoneInput = document.getElementById('profile-phone');
    if (phoneInput) {
        phoneInput.value = currentUser.phone || '13812345678';
    }

    // 更新个人简介
    const bioInput = document.getElementById('profile-bio');
    if (bioInput) {
        bioInput.value = currentUser.bio || '象限时光的忠实用户，致力于高效时间管理';
    }

    // 更新注册时间 - 支持手动编辑
    const registerTimeInput = document.getElementById('profile-register-time');
    if (registerTimeInput) {
        const registerTime = currentUser.createdAt || '2024-01-15T10:30';
        // 转换为datetime-local格式
        const date = new Date(registerTime);
        const localDateTime = date.toISOString().slice(0, 16);
        registerTimeInput.value = localDateTime;
    }

    // 更新最后登录时间
    const lastLoginInput = document.getElementById('last-login-time');
    if (lastLoginInput) {
        const now = new Date();
        lastLoginInput.value = now.toLocaleString('zh-CN');
    }
}

function saveProfile() {
    try {
        const emailEl = document.getElementById('profile-email');
        const phoneEl = document.getElementById('profile-phone');
        const bioEl = document.getElementById('profile-bio');
        const registerEl = document.getElementById('profile-register-time');

        if (!emailEl || !phoneEl || !bioEl || !registerEl) {
            showNotification('保存失败：表单元素缺失', 'error');
            return;
        }

        const email = emailEl.value.trim();
        const phone = phoneEl.value.trim();
        const bio = bioEl.value.trim();
        const registerTimeRaw = registerEl.value;

        if (!currentUser) {
            showNotification('保存失败：未登录', 'error');
            return;
        }

        // 简单校验
        if (phone && !/^\d{6,15}$/.test(phone)) {
            showNotification('手机号格式不正确（需为6-15位数字）', 'warning');
            return;
        }

        // 处理时间：datetime-local 输出形如 2024-01-15T10:30
        let createdAtISO = registerTimeRaw;
        if (registerTimeRaw) {
            try {
                // datetime-local 值已经是本地时间，直接解析
                const dt = new Date(registerTimeRaw);
                if (!isNaN(dt.getTime())) {
                    createdAtISO = dt.toISOString();
                } else {
                    // 如果解析失败，使用当前时间
                    createdAtISO = new Date().toISOString();
                }
            } catch (e) {
                console.warn('时间解析失败，使用当前时间:', e);
                createdAtISO = new Date().toISOString();
            }
        } else {
            createdAtISO = new Date().toISOString();
        }

        // 更新内存中的用户
        currentUser.email = email || currentUser.email;
        currentUser.phone = phone || '';
        currentUser.bio = bio || '';
        currentUser.createdAt = createdAtISO;

        // 更新会话数据
        let sessionUpdated = false;
        try {
            var sessionData = window.SessionStorage.getSession('userSession');
            if (sessionData) {
                var sessStr = JSON.stringify(sessionData);
                var sess = JSON.parse(sessStr);
                sess.user = currentUser;
                if (typeof sanitizeSession === 'function') {
                    sess = sanitizeSession(sess);
                }
                window.SessionStorage.setSession(sess, { remember: true });
                sessionUpdated = true;
            }
        } catch (e) {
            // 会话数据可能已损坏，重建会话
            console.warn('会话更新失败，重建中:', e);
            try {
                if (currentUser) {
                    window.SessionStorage.setSession({ user: currentUser }, { remember: true });
                    sessionUpdated = true;
                }
            } catch (e2) {
                console.error('会话重建失败:', e2);
            }
        }

        // 同步更新用户列表（如果存在）
        try {
            const usersStr = window.DataSyncStorage.getRaw('users');
            if (usersStr) {
                let users = JSON.parse(usersStr);
                users = users.map(u => {
                    if ((u.id && currentUser.id && u.id === currentUser.id) || (u.username === currentUser.username)) {
                        return { ...u, ...currentUser };
                    }
                    return u;
                });
                window.UserStorage.setUsers(users);
                console.log('用户列表已更新');
            }
        } catch (e) {
            console.warn('用户列表更新失败:', e);
        }

        // 无论是否有错误，都显示成功消息（因为数据已经保存）
        if (sessionUpdated) {
            showNotification('个人资料保存成功！', 'success');
            closeProfileModal();
        } else {
            showNotification('个人资料已更新，但会话保存失败', 'warning');
            closeProfileModal();
        }
    } catch (err) {
        console.error('saveProfile error', err);
        showNotification('保存失败，稍后重试', 'error');
    }
}

// 账户设置相关函数
// Settings, profile, notifications and avatar UI have been moved to js/settings-avatar-core.js.

// Calendar fortune and daily sign have been moved to js/fortune-core.js.

function addClearAllButton() {
    const header = document.querySelector('.header-top');
    if (header && !document.getElementById('clear-all-reminders-btn')) {
        const clearButton = document.createElement('button');
        clearButton.id = 'clear-all-reminders-btn';
        const icon = document.createElement('span');
        icon.className = 'material-icons';
        icon.textContent = 'clear_all';
        clearButton.append(icon, document.createTextNode(` ${t('clearReminders')}`));
        clearButton.className = 'clear-reminders-btn';
        clearButton.addEventListener('click', clearAllReminders);
        header.appendChild(clearButton);

        // 监听提醒容器变化，有提醒时显示按钮
        const observer = new MutationObserver(() => {
            const hasReminders = document.getElementById('persistent-notifications');
            clearButton.style.display = hasReminders ? 'flex' : 'none';
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}

// 计算平均完成时间
function calculateAverageCompletionTime() {
    const completedTasks = tasks.filter(task => task.completed && task.createdAt);

    if (completedTasks.length === 0) {
        return 0;
    }

    let totalDays = 0;
    let validTasks = 0;

    completedTasks.forEach(task => {
        const createdAt = new Date(task.createdAt);
        const completedAt = task.completedAt ? new Date(task.completedAt) : new Date();

        // 计算完成时间（天数）
        const timeDiff = completedAt.getTime() - createdAt.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        if (daysDiff > 0) {
            totalDays += daysDiff;
            validTasks++;
        }
    });

    return validTasks > 0 ? Math.round((totalDays / validTasks) * 10) / 10 : 0;
}

// 计算生产力评分（综合指标）
function calculateProductivityScore() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;

    if (totalTasks === 0) {
        return 0;
    }

    // 基础完成率权重 40%
    const completionRate = (completedTasks / totalTasks) * 100;

    // 任务完成速度权重 30%
    const avgCompletionTime = calculateAverageCompletionTime();
    const speedScore = avgCompletionTime > 0 ? Math.max(0, 100 - (avgCompletionTime - 1) * 10) : 50;

    // 任务优先级分布权重 20%
    const priorityDistribution = calculatePriorityDistribution();

    // 任务及时性权重 10%
    const timelinessScore = calculateTimelinessScore();

    // 综合评分
    const productivityScore = Math.round(
        completionRate * 0.4 +
        speedScore * 0.3 +
        priorityDistribution * 0.2 +
        timelinessScore * 0.1
    );

    return Math.min(100, Math.max(0, productivityScore));
}

// 计算任务优先级分布得分
function calculatePriorityDistribution() {
    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;

    const priorityCounts = [0, 0, 0, 0]; // 对应四个象限
    tasks.forEach(task => {
        if (task.priority >= 1 && task.priority <= 4) {
            priorityCounts[task.priority - 1]++;
        }
    });

    // 理想分布：重要且紧急(1) > 重要不紧急(2) > 不重要但紧急(3) > 不重要不紧急(4)
    const idealDistribution = [0.3, 0.4, 0.2, 0.1];
    let distributionScore = 0;

    for (let i = 0; i < 4; i++) {
        const actualRatio = priorityCounts[i] / totalTasks;
        const idealRatio = idealDistribution[i];
        distributionScore += Math.max(0, 100 - Math.abs(actualRatio - idealRatio) * 200);
    }

    return Math.round(distributionScore / 4);
}

// 计算任务及时性得分
function calculateTimelinessScore() {
    const now = new Date();
    const overdueTasks = tasks.filter(task => {
        if (task.completed || !task.endDate) return false;
        return new Date(task.endDate) < now;
    });

    const totalTasks = tasks.length;
    if (totalTasks === 0) return 0;

    const overdueRate = overdueTasks.length / totalTasks;
    return Math.round(Math.max(0, 100 - overdueRate * 100));
}

// 更新统计数据的函数
function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 只更新可视化看板中的统计数据
    const dashboardTotalEl = document.getElementById('dashboard-total-tasks');
    const dashboardCompletedEl = document.getElementById('dashboard-completed-tasks');
    const dashboardRateEl = document.getElementById('dashboard-completion-rate');

    if (dashboardTotalEl) dashboardTotalEl.textContent = totalTasks;
    if (dashboardCompletedEl) dashboardCompletedEl.textContent = completedTasks;
    if (dashboardRateEl) dashboardRateEl.textContent = completionRate + '%';
}

// 显示任务列表
function showTaskModal(filterType) {
    console.log('showTaskModal 被调用，过滤类型:', filterType);
    console.log('当前任务列表:', tasks);

    // 根据过滤类型获取任务
    let filteredTasks = [];
    let modalTitle = '';

    if (filterType === 'all') {
        filteredTasks = tasks;
        modalTitle = t('allTasks');
    } else if (filterType === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
        modalTitle = t('completedTasksTitle');
    }

    console.log('过滤后的任务:', filteredTasks);
    console.log('模态框标题:', modalTitle);

    // 移除已存在的任务列表
    const existingTaskList = document.getElementById('dashboard-task-list');
    if (existingTaskList) {
        existingTaskList.remove();
    }

    const taskListEl = createDashboardTaskList(filterType, modalTitle, filteredTasks);

    // 找到统计卡片容器
    const dashboardStats = document.querySelector('.dashboard-stats');
    if (dashboardStats) {
        // 在统计卡片下方插入任务列表
        dashboardStats.insertAdjacentElement('afterend', taskListEl);

        // 滚动到任务列表位置
        taskListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function createDashboardTaskList(filterType, modalTitle, filteredTasks) {
    const wrapper = document.createElement('div');
    wrapper.id = 'dashboard-task-list';
    wrapper.className = 'dashboard-task-list';

    const header = document.createElement('div');
    header.className = `task-list-header ${filterType === 'all' ? 'total-tasks' : 'completed-tasks'}`;
    const title = document.createElement('h3');
    title.textContent = `${modalTitle} (${filteredTasks.length})`;
    const close = createDashboardCloseButton(closeTaskModal);
    header.append(title, close);

    const content = document.createElement('div');
    content.className = 'task-list-content';
    if (filteredTasks.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-tasks';
        empty.textContent = t('noTasks');
        content.appendChild(empty);
    } else {
        filteredTasks.forEach(task => content.appendChild(createTaskListItem(task)));
    }

    wrapper.append(header, content);
    return wrapper;
}

function createDashboardCloseButton(onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'close-task-list-btn';
    const icon = document.createElement('i');
    icon.className = 'fas fa-times';
    button.appendChild(icon);
    button.addEventListener('click', onClick);
    return button;
}

// 创建任务列表项
function createTaskListItem(task) {
    const priorityClass = getPriorityClass(task.priority);
    const priorityText = getPriorityText(task.priority);

    const item = document.createElement('div');
    item.className = task.completed ? 'task-list-item completed' : 'task-list-item';
    item.dataset.id = task.id;

    const content = document.createElement('div');
    content.className = 'task-item-content';

    const header = document.createElement('div');
    header.className = 'task-item-header';
    const completion = document.createElement('span');
    completion.className = 'task-completion-icon';
    completion.textContent = task.completed ? '✓' : '○';
    const title = document.createElement('span');
    title.className = 'task-title';
    title.textContent = getTaskDisplayTitle(task) || t('unnamedTask');
    const priority = document.createElement('span');
    priority.className = `task-priority ${priorityClass}`;
    priority.textContent = priorityText;
    header.append(completion, title, priority);

    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.appendChild(createTaskMetaSpan('task-date', `${t('creationTime')}: ${formatTaskDate(task.createdAt)}`));
    if (task.startDate) {
        meta.appendChild(createTaskMetaSpan('task-start', `${t('startTime')}: ${formatTaskDate(task.startDate)}`));
    }
    if (task.endDate) {
        meta.appendChild(createTaskEndMetaSpan(task.endDate));
    }

    content.append(header, meta);
    item.appendChild(content);
    return item;
}

function createTaskMetaSpan(className, text) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    return span;
}

function createTaskEndMetaSpan(dateString) {
    const span = document.createElement('span');
    span.className = 'task-end';
    span.append(document.createTextNode(`${t('endTime')}: `));
    const formatted = formatTaskEndDateText(dateString);
    if (formatted.isOverdue) {
        const overdue = document.createElement('span');
        overdue.className = 'task-end-overdue';
        overdue.textContent = formatted.text;
        span.appendChild(overdue);
    } else {
        span.append(document.createTextNode(formatted.text));
    }
    return span;
}

// 获取优先级CSS类名
function getPriorityClass(priority) {
    switch (priority) {
        case 1: return 'high';
        case 2: return 'medium';
        case 3: return 'medium';
        case 4: return 'low';
        default: return 'low';
    }
}

// 获取优先级文本
function getPriorityText(priority) {
    switch (priority) {
        case 1: return t('q1Title');
        case 2: return t('q2Title');
        case 3: return t('q3Title');
        case 4: return t('q4Title');
        default: return t('uncategorized');
    }
}

// 格式化任务日期
function formatTaskDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };

        return date.toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', options);
    } catch (error) {
        console.error('日期格式化错误:', error);
        return dateString;
    }
}

// 格式化任务结束时间，过期任务显示为红色
function formatTaskEndDate(dateString) {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const now = new Date();
        const isOverdue = date < now;

        const options = {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };

        const formattedDate = date.toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', options);

        // 如果任务已过期，返回带红色样式的HTML
        if (isOverdue) {
            return `<span class="task-end-overdue">${formattedDate}</span>`;
        }

        return formattedDate;
    } catch (error) {
        console.error('结束时间格式化错误:', error);
        return dateString;
    }
}

function renderFortuneContentNodes(container, fortuneText, fortuneMeaning, fortuneAdvice) {
    const text = document.createElement('div');
    text.className = 'fortune-text';
    text.id = 'fortune-text';
    text.textContent = fortuneText || '';

    const meaning = document.createElement('div');
    meaning.className = 'fortune-meaning';
    meaning.id = 'fortune-meaning';
    meaning.textContent = fortuneMeaning || '';

    const advice = document.createElement('div');
    advice.className = 'fortune-advice';
    advice.id = 'fortune-advice';
    advice.textContent = fortuneAdvice || '';

    container.replaceChildren(text, meaning, advice);
}

function renderSanitizedMarkup(container, markup) {
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

function formatTaskEndDateText(dateString) {
    if (!dateString) return { text: '', isOverdue: false };

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return { text: dateString, isOverdue: false };

        const now = new Date();
        const options = {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };

        return {
            text: date.toLocaleString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US', options),
            isOverdue: date < now
        };
    } catch (error) {
        console.error('结束时间格式化错误:', error);
        return { text: dateString, isOverdue: false };
    }
}

// 关闭任务列表
function closeTaskModal() {
    const taskList = document.getElementById('dashboard-task-list');
    if (taskList) {
        taskList.remove();
    }
}

// 显示完成率数据视图
// Dashboard stat-card interactions and completion-rate panel have been moved to js/dashboard-card-core.js.

function initDashboardCharts() {
    // 任务分布饼图
    const taskDistCtx = document.getElementById('taskDistributionChart');
    if (taskDistCtx) {
        const quadrantCounts = [0, 0, 0, 0];
        tasks.forEach(task => {
            if (task.priority >= 1 && task.priority <= 4) {
                quadrantCounts[task.priority - 1]++;
            }
        });

        // 改进的任务分布显示
        taskDistCtx.replaceChildren(createTaskDistributionFallback(quadrantCounts));
    }

    // 完成趋势图表
    const trendCtx = document.getElementById('completionTrendChart');
    if (trendCtx) {
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // 简单的完成趋势显示
        trendCtx.replaceChildren(createCompletionTrendFallback(completionRate, completedTasks, totalTasks));
    }

    // 更新效率指标
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 计算平均完成时间（基于实际数据）
    const avgCompletionTime = calculateAverageCompletionTime();

    // 计算生产力评分（综合指标）
    const productivityScore = calculateProductivityScore();

    const avgTimeEl = document.getElementById('avg-completion-time');
    const productivityEl = document.getElementById('productivity-score');

    if (avgTimeEl) avgTimeEl.textContent = `${avgCompletionTime} ${t('days')}`;
    if (productivityEl) productivityEl.textContent = `${productivityScore}%`;

    // 调用统计数据更新函数
    updateStats();

    // 初始化新的可视化图表
    if (typeof VisualizationCharts !== 'undefined' && VisualizationCharts.onViewSwitch) {
        // 确保Chart.js已加载
        if (typeof Chart !== 'undefined') {
            VisualizationCharts.onViewSwitch('dashboard-view');
        } else {
            console.warn('⚠️ Chart.js尚未加载，跳过可视化图表初始化');
        }
    }
}

function createTaskDistributionFallback(quadrantCounts) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dashboard-fallback dashboard-fallback-compact';
    const title = document.createElement('div');
    title.className = 'dashboard-fallback-title';
    const strong = document.createElement('strong');
    strong.textContent = `📊 ${t('taskDistributionStats')}`;
    title.appendChild(strong);

    const groups = document.createElement('div');
    groups.className = 'dashboard-fallback-groups';
    groups.append(
        createTaskDistributionRow([
            ['#ef5350', `🔴 ${t('q1Title')}: ${quadrantCounts[0]}`],
            ['#ffa726', `🟠 ${t('q2Title')}: ${quadrantCounts[1]}`]
        ]),
        createTaskDistributionRow([
            ['#42a5f5', `🔵 ${t('q3Title')}: ${quadrantCounts[2]}`],
            ['#66bb6a', `🟢 ${t('q4Title')}: ${quadrantCounts[3]}`]
        ])
    );

    const total = document.createElement('div');
    total.className = 'dashboard-fallback-total';
    total.textContent = `总任务数: ${quadrantCounts.reduce((a, b) => a + b, 0)}`;
    wrapper.append(title, groups, total);
    return wrapper;
}

function createTaskDistributionRow(items) {
    const row = document.createElement('div');
    row.className = 'dashboard-fallback-row';
    items.forEach(([color, text]) => {
        const item = document.createElement('div');
        item.className = 'dashboard-fallback-item';
        item.style.setProperty('--dashboard-fallback-color', color);
        item.textContent = text;
        row.appendChild(item);
    });
    return row;
}

function createCompletionTrendFallback(completionRate, completedTasks, totalTasks) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dashboard-fallback';

    const title = document.createElement('div');
    title.className = 'dashboard-fallback-title';
    const strong = document.createElement('strong');
    strong.textContent = `📈 ${t('completionTrendTitle')}`;
    title.appendChild(strong);

    const main = document.createElement('div');
    main.className = 'dashboard-trend-main';
    const rate = document.createElement('div');
    rate.className = 'dashboard-trend-rate';
    rate.textContent = `${completionRate}%`;
    const label = document.createElement('div');
    label.className = 'dashboard-trend-label';
    label.textContent = t('overallCompletionRate');
    const track = document.createElement('div');
    track.className = 'dashboard-trend-track';
    const bar = document.createElement('div');
    bar.className = 'dashboard-trend-bar';
    bar.style.width = `${completionRate}%`;
    track.appendChild(bar);
    main.append(rate, label, track);

    const footer = document.createElement('div');
    footer.className = 'dashboard-trend-footer';
    const completed = document.createElement('span');
    completed.textContent = `${t('completed')}: ${completedTasks}`;
    const total = document.createElement('span');
    total.textContent = `${t('total')}: ${totalTasks}`;
    footer.append(completed, total);

    wrapper.append(title, main, footer);
    return wrapper;
}

// 重新绑定任务事件的函数
function rebindTaskEvents() {
    console.log('重新绑定任务事件');

    // 重新绑定任务操作的事件委托
    document.removeEventListener('click', handleTaskAction);
    document.addEventListener('click', handleTaskAction);

    // 重新绑定任务复选框事件
    document.removeEventListener('change', handleTaskCheckboxChange);
    document.addEventListener('change', handleTaskCheckboxChange);

    console.log('任务事件重新绑定完成');
}

// 任务操作事件处理函数
function handleTaskAction(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;

    const taskId = target.dataset.taskId;
    const action = target.dataset.action;

    console.log('任务操作:', action, taskId);

    switch (action) {
        case 'edit':
            openModal(taskId);
            break;
        case 'copy':
            copyTask(e, taskId);
            break;
        case 'complete':
            toggleComplete(e, taskId);
            break;
        case 'delete':
            deleteTaskFromList(e, taskId);
            break;
    }
}

// 任务复选框变化事件处理函数
function handleTaskCheckboxChange(e) {
    if (e.target.matches('.task-checkbox input[type="checkbox"]')) {
        console.log('任务复选框状态改变:', e.target.checked, e.target.dataset.taskId);
        updateSelectAllCheckbox();
    }
}

// 页面可见性变化时重新加载数据和重新绑定事件
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
        console.log('页面重新可见，重新初始化系统');

        // 重新加载复盘数据
        if (reviewSystem) {
            console.log('重新加载复盘数据');
            reviewSystem.reviews = reviewSystem.loadReviews();
            reviewSystem.loadCurrentReview();
        }

        // 重新绑定任务事件（防止睡眠唤醒后事件丢失）
        rebindTaskEvents();

        // 重新渲染任务列表
        render();

        setTimeout(() => {
            reviewSystem.updateHistoryPreview();
        }, 200);
    }
});

// 【新增】初始化复盘系统函数
function initializeReviewSystem() {
    console.log('初始化ReviewSystem');
    reviewSystem = new ReviewSystem();
    reviewSystem.init();
}

// 防止页面刷新时数据丢失
window.addEventListener('beforeunload', function () {
    // 完全禁用beforeunload时的自动保存，避免创建无效记录
    console.log('页面即将卸载，跳过自动保存以防止创建无效记录');
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM加载完成，开始初始化...');

    try {
        // 首先检查登录状态
        checkLoginStatus();

        // 初始化登录相关功能
        initLoginFeature();
        initUserMenu();

        // 添加logo点击返回首页功能
        const logoSection = document.querySelector('.logo-section');
        const mainLogo = document.querySelector('.main-logo, .main-logo-image');
        if (logoSection || mainLogo) {
            const logoElement = logoSection || mainLogo;
            logoElement.classList.add('app-logo-clickable');
            logoElement.addEventListener('click', function () {
                // 如果当前不在首页，跳转到首页
                if (window.location.pathname !== '/' && !window.location.pathname.includes('index.html')) {
                    window.location.href = 'index.html';
                } else {
                    // 如果在首页，切换到列表视图
                    if (typeof switchView === 'function') {
                        switchView('list');
                    }
                }
            });
            console.log('✅ Logo点击返回首页功能已添加');
        }
    } catch (error) {
        console.error('❌ 初始化过程中发生错误:', error);
    }

    // 页面加载时创建初始备份
    setTimeout(() => {
        createInitialBackup();
    }, 3000); // 延迟3秒执行，确保所有数据已加载

    // 在DOM加载完成后获取所有DOM元素引用
    taskListEl = document.getElementById('task-list');
    initialAddContainerEl = document.getElementById('initial-add-container');
    taskFormContainerEl = document.getElementById('task-form-container');

    q1TasksEl = document.getElementById('q1-tasks');
    q2TasksEl = document.getElementById('q2-tasks');
    q3TasksEl = document.getElementById('q3-tasks');
    q4TasksEl = document.getElementById('q4-tasks');

    modalEl = document.getElementById('task-modal');
    modalTaskIdEl = document.getElementById('modal-task-id');
    modalTaskTitleEl = document.getElementById('modal-task-title');
    modalTaskTitleEnEl = document.getElementById('modal-task-title-en');
    modalTaskPriorityEl = document.getElementById('modal-task-priority');
    modalTaskStartEl = document.getElementById('modal-task-start');
    modalTaskEndEl = document.getElementById('modal-task-end');

    initializeTaskDetailPanel();

    // 初始化四象限视图模式
    try {
        initializeQuadrantViewMode();

        // 绑定视图模式切换按钮事件
        const viewModeToggleBtn = document.getElementById('view-mode-toggle');
        if (viewModeToggleBtn) {
            viewModeToggleBtn.addEventListener('click', toggleQuadrantViewMode);
            console.log('✅ 四象限视图模式切换按钮事件已绑定');
        } else {
            console.warn('⚠️ 找不到四象限视图模式切换按钮');
        }
    } catch (error) {
        console.error('❌ 初始化四象限视图模式失败:', error);
    }

    // 检查是否有分享链接
    checkFortuneShareLink();

    // 验证关键DOM元素是否存在（不阻止执行，只记录警告）
    if (!taskListEl || !initialAddContainerEl || !taskFormContainerEl) {
        console.warn('⚠️ 部分关键DOM元素未找到，但继续执行初始化');
    }

    if (!modalEl || !modalTaskTitleEl || !modalTaskPriorityEl) {
        console.warn('⚠️ 部分模态框DOM元素未找到，但继续执行初始化');
    }

    console.log('所有DOM元素已获取，开始初始化功能...');

    try {
        loadTasks();
        // 加载任务后立即渲染
        if (typeof render === 'function') {
            render();
        }
    } catch (error) {
        console.error('❌ 加载任务失败:', error);
    }

    try {
        initTheme();
    } catch (error) {
        console.error('❌ 初始化主题失败:', error);
    }

    // 添加清除所有提醒按钮
    try {
        addClearAllButton();
    } catch (error) {
        console.error('❌ 添加清除按钮失败:', error);
    }

    // 初始化日历
    try {
        initCalendar();
        updateDatePicker();
    } catch (error) {
        console.error('❌ 初始化日历失败:', error);
    }

    // 初始化每日一签系统
    try {
        // 延迟到用户打开每日一签页面时再初始化，避免首屏常驻对象和事件监听。
        window.fortuneSystem = null;
    } catch (error) {
        console.error('❌ 初始化每日一签系统失败:', error);
    }

    // 初始化语言
    try {
        updateLanguage();
    } catch (error) {
        console.error('❌ 初始化语言失败:', error);
    }

    // 绑定语言切换按钮事件
    const languageToggleBtn = document.getElementById('language-toggle-btn');
    if (languageToggleBtn) {
        languageToggleBtn.addEventListener('click', toggleLanguage);
        console.log('语言切换按钮事件已绑定');
    }

    // 绑定标签页切换事件
    const listTabBtn = document.getElementById('list-tab-btn');
    const quadrantTabBtn = document.getElementById('quadrant-tab-btn');
    const fortuneTabBtn = document.getElementById('fortune-tab-btn');

    if (listTabBtn) {
        listTabBtn.addEventListener('click', () => {
            console.log('切换到列表视图');
            switchView('list');
        });
        console.log('列表视图按钮事件已绑定');
    } else {
        console.error('列表视图按钮未找到！');
    }

    if (quadrantTabBtn) {
        quadrantTabBtn.addEventListener('click', () => {
            console.log('切换到四象限视图');
            switchView('quadrant');
        });
        console.log('四象限视图按钮事件已绑定');
    } else {
        console.error('四象限视图按钮未找到！');
    }

    // 添加每日一签标签页事件
    if (fortuneTabBtn) {
        fortuneTabBtn.addEventListener('click', function () {
            console.log('切换到每日一签视图');
            switchView('fortune');
        });
        console.log('每日一签视图按钮事件已绑定');
    }

    // 添加可视化看板标签页事件
    const dashboardTabBtn = document.getElementById('dashboard-tab-btn');

    if (dashboardTabBtn) {
        dashboardTabBtn.addEventListener('click', () => {
            console.log('切换到可视化看板视图');
            switchView('dashboard');
        });
        console.log('可视化看板视图按钮事件已绑定');
    } else {
        console.log('⚠️ 可视化看板视图按钮未找到，可能已被移除或重命名');
    }

    // 添加更多功能标签页事件
    const moreFeaturesTabBtn = document.getElementById('more-features-tab-btn');

    if (moreFeaturesTabBtn) {
        moreFeaturesTabBtn.addEventListener('click', () => {
            console.log('切换到更多功能视图');
            switchView('more-features');
        });
        console.log('更多功能视图按钮事件已绑定');
    } else {
        console.log('⚠️ 更多功能视图按钮未找到，可能已被移除或重命名');
    }

    // 添加每日一签标签页事件
    if (fortuneTabBtn) {
        fortuneTabBtn.addEventListener('click', () => {
            console.log('切换到每日一签视图');
            switchView('fortune');
        });
        console.log('每日一签视图按钮事件已绑定');
    } else {
        console.log('⚠️ 每日一签视图按钮未找到，可能已被移除或重命名');
    }

    // 数据备份按钮已移除，现在合并到更多功能中

    // 绑定更多功能视图中的功能按钮事件
    const fortuneFeatureBtn = document.getElementById('fortune-feature-btn');
    const pomodoroFeatureBtn = document.getElementById('pomodoro-feature-btn');
    const countdownFeatureBtn = document.getElementById('countdown-feature-btn');

    if (fortuneFeatureBtn) {
        fortuneFeatureBtn.addEventListener('click', () => {
            console.log('进入每日一签');
            switchView('fortune');
        });
        console.log('每日一签功能按钮事件已绑定');
    }

    if (pomodoroFeatureBtn) {
        pomodoroFeatureBtn.addEventListener('click', () => {
            console.log('进入番茄专注');
            switchView('pomodoro');
        });
        console.log('番茄专注功能按钮事件已绑定');
    }

    if (countdownFeatureBtn) {
        countdownFeatureBtn.addEventListener('click', () => {
            console.log('进入倒数纪念日');
            switchView('countdown');
        });
        console.log('倒数纪念日功能按钮事件已绑定');
    }

    // 绑定习惯打卡功能按钮事件
    const habitTrackerFeatureBtn = document.getElementById('habit-tracker-feature-btn');
    if (habitTrackerFeatureBtn) {
        habitTrackerFeatureBtn.addEventListener('click', () => {
            console.log('进入习惯打卡');
            switchView('habit-tracker');
        });
        console.log('习惯打卡功能按钮事件已绑定');
    }

    // 绑定时间管理可视化看板功能按钮事件
    const timeTrackerFeatureBtn = document.getElementById('time-tracker-feature-btn');
    if (timeTrackerFeatureBtn) {
        timeTrackerFeatureBtn.addEventListener('click', () => {
            console.log('进入时间管理可视化看板');
            switchView('time-tracker');
        });
        console.log('时间管理可视化看板功能按钮事件已绑定');
    }

    const calendarFeatureBtn = document.getElementById('calendar-feature-btn');
    if (calendarFeatureBtn) {
        calendarFeatureBtn.addEventListener('click', () => {
            console.log('进入沉浸式自然日历');
            switchView('calendar');
        });
        console.log('沉浸式自然日历功能按钮事件已绑定');
    }

    // 绑定时间管理相关事件
    bindTimeTrackerEvents();

    // 绑定仪表板统计卡片的点击事件
    bindDashboardCardEvents();

    // 【新增】复盘标签页点击事件
    const reviewTabBtn = document.getElementById('review-tab-btn');
    if (reviewTabBtn) {
        reviewTabBtn.addEventListener('click', () => {
            console.log('切换到顶级复盘视图');
            switchView('review');
        });
        console.log('顶级复盘视图按钮事件已绑定');
    }

    // 【新增】模板标签页点击事件
    const templatesTabBtn = document.getElementById('templates-tab-btn');
    if (templatesTabBtn) {
        templatesTabBtn.addEventListener('click', () => {
            console.log('切换到任务模板视图');
            switchView('templates');
        });
        console.log('任务模板视图按钮事件已绑定');
    }

    // 绑定添加任务按钮事件（只绑定list-view中的按钮）
    const initialAddBtn = document.querySelector('#list-view #initial-add-btn');
    if (initialAddBtn) {
        initialAddBtn.addEventListener('click', showInitialInput);
        console.log('添加任务按钮事件已绑定');
    } else {
        console.error('添加任务按钮未找到！');
    }

    // 绑定全选复选框事件 - 修复选择器问题
    const selectAllTasks = document.getElementById('select-all-tasks');
    if (selectAllTasks) {
        // 使用change事件而不是click事件，并添加调试信息
        selectAllTasks.addEventListener('change', function (e) {
            console.log('全选复选框被点击，当前状态:', e.target.checked);
            toggleSelectAllTasks();
        });
        console.log('全选复选框事件已绑定');
    } else {
        console.error('全选复选框未找到！');
    }

    // 绑定删除选中任务按钮事件
    const deleteSelectedBtn = document.querySelector('#delete-selected-btn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', deleteSelectedTasks);
        console.log('删除选中任务按钮事件已绑定');
    } else {
        console.error('删除选中任务按钮未找到！');
    }


    // 绑定恢复数据按钮事件
    const restoreTasksBtn = document.querySelector('#restore-tasks-btn');
    if (restoreTasksBtn) {
        restoreTasksBtn.addEventListener('click', showRestoreDataPreview);
        console.log('恢复数据按钮事件已绑定');
    } else {
        console.error('恢复数据按钮未找到！');
    }

    // 绑定排序下拉按钮
    const sortToggleBtn = document.getElementById('sort-toggle-btn');
    const sortMenu = document.getElementById('sort-menu');
    const sortCurrentLabel = document.getElementById('sort-current-label');
    if (sortToggleBtn && sortMenu) {
        // 初始化当前标签
        sortCurrentLabel && (sortCurrentLabel.textContent = getSortLabel(sortMode));
        sortToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sortMenu.style.display = sortMenu.style.display === 'none' || !sortMenu.style.display ? 'block' : 'none';
        });
        // 菜单项点击
        sortMenu.querySelectorAll('.sort-menu-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const value = e.currentTarget.getAttribute('data-value');
                sortMode = value || 'default';
                window.DataSyncStorage.setRaw('sort_mode', sortMode);
                if (sortCurrentLabel) sortCurrentLabel.textContent = getSortLabel(sortMode);
                sortMenu.style.display = 'none';
                render();
            });
        });
        // 点击外部关闭
        document.addEventListener('click', (evt) => {
            const within = evt.target.closest('.sort-dropdown');
            if (!within && sortMenu.style.display === 'block') {
                sortMenu.style.display = 'none';
            }
        });
    }

    // 绑定象限放大按钮事件
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const quadrantId = e.currentTarget.dataset.quadrant;
            if (quadrantId) {
                console.log('展开象限:', quadrantId);
                toggleQuadrantExpand(quadrantId);
            }
        });
    });

    // 绑定所有模态框关闭按钮事件
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                if (modal.id === 'help-modal') {
                    closeHelpModal();
                } else if (modal.id === 'profile-modal') {
                    closeProfileModal();
                } else if (modal.id === 'settings-modal') {
                    closeSettingsModal();
                } else {
                    closeModal();
                }
            }
        });
    });

    // 绑定模态框按钮事件
    const updateTaskBtn = document.getElementById('update-task-btn');
    if (updateTaskBtn) {
        updateTaskBtn.addEventListener('click', updateTask);
    }

    const setTopBtn = document.getElementById('set-top-btn');
    if (setTopBtn) {
        setTopBtn.addEventListener('click', setTop);
    }

    const duplicateTaskBtn = document.getElementById('duplicate-task-btn');
    if (duplicateTaskBtn) {
        duplicateTaskBtn.addEventListener('click', duplicateTask);
    }

    const deleteTaskBtn = document.getElementById('delete-task-btn');
    if (deleteTaskBtn) {
        deleteTaskBtn.addEventListener('click', deleteTask);
    }



    // 添加任务操作的事件委托（处理动态生成的任务元素）
    document.addEventListener('click', handleTaskAction);

    console.log('初始化完成');
    console.log('准备启动提醒系统');
    startReminderSystem();
    console.log('提醒系统启动完成');

    // 初始化通知系统
    console.log('准备初始化通知系统');
    initNotificationSystem();
    console.log('通知系统初始化完成');

    // PWA初始化
    console.log('第一个DOMContentLoaded: 开始初始化PWA');
    try {
        initPWA();
        console.log('PWA初始化调用成功');
    } catch (error) {
        console.error('PWA初始化失败:', error);
    }

    // 初始化拖拽排序
    setTimeout(initSortable, 100);

    // 初始化模态框拖拽
    if (modalEl) {
        makeDraggable(modalEl);
    }

    // 帮助链接点击事件
    const helpLink = document.getElementById('help-link');
    if (helpLink) {
        helpLink.addEventListener('click', function () {
            const helpPage = currentLanguage === 'zh' ? 'help.html' : 'help-en.html';
            window.open(helpPage, '_blank');
        });
    }

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl+N 或 Cmd+N 添加新任务
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (currentView === 'list') {
                showInitialInput();
            }
        }

        // ESC 关闭模态框
        if (e.key === 'Escape') {
            closeModal();
            closeHelpModal();
            closeProfileModal();
            closeSettingsModal();
        }
    });

    // 使用事件委托为任务复选框添加change事件监听器
    document.addEventListener('change', handleTaskCheckboxChange);

    // 初始化视图状态 - 确保默认显示列表视图
    console.log('初始化默认视图为列表视图');
    switchView('list');

    // 初始渲染
    render();

    // 渲染完成后更新全选复选框状态
    setTimeout(() => {
        updateSelectAllCheckbox();
    }, 100);

    // 【关键修复】初始化拖拽功能 - 必须在render()之后调用
    setTimeout(() => {
        initSortable();
        console.log('✅ 拖拽功能已初始化');
    }, 200);

    // 【新增】初始化复盘系统
    if (document.getElementById('review-view')) {
        initializeReviewSystem();
        console.log('复盘系统已初始化');
    }

    // 【新增】初始化复盘系统
    initializeReviewSystem();
    console.log('复盘系统已初始化');
});

// 【新增】添加必要的CSS动画
const style = document.createElement('style');
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

    .review-message {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.5px;
    }
`;
document.head.appendChild(style);
// 更新全选复选框状态
function updateSelectAllCheckbox() {
    // 只在列表视图中执行
    if (currentView !== 'list') {
        return;
    }

    const selectAllCheckbox = document.getElementById('select-all-tasks');
    if (!selectAllCheckbox) {
        console.log('全选复选框不存在');
        return;
    }

    // 防止在toggleSelectAllTasks执行期间被调用
    if (updateSelectAllCheckbox.isUpdating) {
        console.log('updateSelectAllCheckbox正在更新中，跳过此次调用');
        return;
    }

    updateSelectAllCheckbox.isUpdating = true;

    console.log('updateSelectAllCheckbox被调用');

    // 使用防抖处理，避免频繁更新
    clearTimeout(updateSelectAllCheckbox.timeout);
    updateSelectAllCheckbox.timeout = setTimeout(() => {
        // 只查询列表视图中的任务复选框
        const taskCheckboxes = document.querySelectorAll('#list-view .task-checkbox input[type="checkbox"]');
        const checkedCount = document.querySelectorAll('#list-view .task-checkbox input[type="checkbox"]:checked').length;

        console.log(`更新全选状态: 总任务数=${taskCheckboxes.length}, 选中数量=${checkedCount}`);

        if (taskCheckboxes.length === 0) {
            // 没有任务时，全选复选框不可用
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.disabled = true;
            console.log('设置全选复选框为禁用状态');
        } else if (checkedCount === 0) {
            // 没有选中任何任务
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.disabled = false;
            console.log('设置全选复选框为未选中状态');
        } else if (checkedCount === taskCheckboxes.length) {
            // 全部选中
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
            selectAllCheckbox.disabled = false;
            console.log('设置全选复选框为全选状态');
        } else {
            // 部分选中 - 设置为未选中但显示半选状态
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
            selectAllCheckbox.disabled = false;
            console.log('设置全选复选框为半选状态');
        }

        console.log(`全选复选框状态更新完成: checked=${selectAllCheckbox.checked}, indeterminate=${selectAllCheckbox.indeterminate}, disabled=${selectAllCheckbox.disabled}`);

        updateSelectAllCheckbox.isUpdating = false;
    }, 10);
}

// 全选/取消全选任务
function toggleSelectAllTasks() {
    // 只在列表视图中执行
    if (currentView !== 'list') {
        console.log('当前不在列表视图，跳过全选操作');
        return;
    }

    const selectAllCheckbox = document.getElementById('select-all-tasks');
    if (!selectAllCheckbox) {
        console.log('全选复选框不存在');
        return;
    }

    console.log('toggleSelectAllTasks被调用');

    // 获取列表视图中的所有任务复选框
    const taskCheckboxes = document.querySelectorAll('#list-view .task-checkbox input[type="checkbox"]');
    const checkedCount = document.querySelectorAll('#list-view .task-checkbox input[type="checkbox"]:checked').length;

    console.log(`当前状态: 总任务数=${taskCheckboxes.length}, 已选中=${checkedCount}`);

    // 根据当前选中的任务数量决定操作：如果全部未选中则全选，否则取消全选
    const shouldSelectAll = checkedCount === 0;

    console.log(`执行操作: ${shouldSelectAll ? '全选' : '取消全选'}`);

    // 设置所有任务复选框的状态
    taskCheckboxes.forEach(checkbox => {
        if (checkbox.checked !== shouldSelectAll) {
            checkbox.checked = shouldSelectAll;
            // 手动触发change事件以确保状态同步
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // 更新全选复选框状态
    selectAllCheckbox.checked = shouldSelectAll;
    selectAllCheckbox.indeterminate = false;

    console.log(`全选操作完成: 全选复选框状态=${selectAllCheckbox.checked}`);
}

// 删除选中的任务
function deleteSelectedTasks() {
    // 只在列表视图中执行
    if (currentView !== 'list') {
        showPageNotification(t('deleteOnlyInList'));
        return;
    }

    // 强制等待DOM更新完成
    setTimeout(async () => {
        console.log('=== 开始删除操作 ===');
        console.log('当前视图:', currentView);
        console.log('当前任务数量:', tasks.length);

        // 获取列表视图中所有选中的任务复选框
        const taskCheckboxes = document.querySelectorAll('#list-view .task-checkbox input[type="checkbox"]:checked');
        console.log('找到的选中复选框数量:', taskCheckboxes.length);

        const selectedTaskIds = [];

        // 收集选中任务的ID - 直接从复选框获取
        taskCheckboxes.forEach((checkbox, index) => {
            const taskId = checkbox.getAttribute('data-task-id');
            console.log(`复选框${index}:`, {
                id: taskId,
                checked: checkbox.checked,
                element: checkbox
            });
            if (taskId) {
                selectedTaskIds.push(taskId);
                console.log(`收集到选中任务: ${taskId}`);
            } else {
                console.warn('复选框没有data-task-id属性:', checkbox);
            }
        });

        console.log('最终选中的任务ID:', selectedTaskIds);
        console.log('当前所有任务ID:', tasks.map(t => t.id));

        if (selectedTaskIds.length === 0) {
            showPageNotification(t('selectTasksFirst'));
            return;
        }

        const confirmed = await showConfirmModal({
            title: '删除任务',
            message: `确定要删除选中的 ${selectedTaskIds.length} 个任务吗？`,
            type: 'danger',
            confirmText: '删除',
            cancelText: '取消'
        });
        if (confirmed) {
            console.log('用户确认删除操作');

            // 从提醒记录中移除
            selectedTaskIds.forEach(id => {
                notifiedTasks.delete(id);
            });

            // 从任务列表中移除 - 使用严格的字符串比较
            const originalTasksLength = tasks.length;
            const tasksToDelete = [];

            console.log('删除前的任务数组:', tasks.map(t => ({ id: t.id, title: t.title })));

            // 确保任务数组是有效的
            if (!Array.isArray(tasks)) {
                console.error('任务数组不是数组类型:', typeof tasks);
                tasks = [];
            }

            // 备份被删除的任务对象，以便回滚
            const deletedTaskObjects = tasks.filter(task =>
                task && typeof task === 'object' && selectedTaskIds.includes(task.id)
            );

            tasks = tasks.filter(task => {
                if (!task || typeof task !== 'object') {
                    console.warn('发现无效任务对象:', task);
                    return false;
                }

                const shouldKeep = !selectedTaskIds.includes(task.id);
                if (!shouldKeep) {
                    tasksToDelete.push(task.title || '未命名任务');
                }
                console.log(`任务 ${task.id} (${task.title}): ${shouldKeep ? '保留' : '删除'}`);
                return shouldKeep;
            });

            console.log('即将删除的任务:', tasksToDelete);
            console.log('删除后的任务数组:', tasks.map(t => ({ id: t.id, title: t.title })));

            console.log(`删除操作完成: 删除前${originalTasksLength}个任务, 删除后${tasks.length}个任务`);

            // 保存到本地存储
            const saved = saveTasks();
            if (saved === false) {
                // 保存失败，回滚
                tasks.push(...deletedTaskObjects);
                syncTasksToWindow();
                if (typeof showPageNotification === 'function') {
                    showPageNotification('删除失败，请重试');
                }
                return;
            }

            // 重新渲染页面
            render();

            // 显示成功消息
            showPageNotification(`成功删除${selectedTaskIds.length}个任务`);

            // 更新全选复选框状态
            setTimeout(() => {
                updateSelectAllCheckbox();
                console.log('删除操作完成，页面已重新渲染');
            }, 100);
        } else {
            console.log('用户取消删除操作');
        }
    }, 50);
}

// 从备份恢复任务数据
// 显示恢复数据预览
// showRestoreDataPreview has been moved to js/restore-preview-core.js.


// 更新恢复预览内容
// updateRestorePreview has been moved to js/restore-preview-core.js.


// 更新备份任务列表
// updateBackupTasksList has been moved to js/restore-preview-core.js.


// createBackupTaskPreviewItem has been moved to js/restore-preview-core.js.


// createBackupTaskMoreItem has been moved to js/restore-preview-core.js.


// 关闭恢复预览
// closeRestorePreview has been moved to js/restore-preview-core.js.


// 确认恢复数据
// confirmRestoreData has been moved to js/restore-preview-core.js.


// 保留原有的恢复函数作为备用
// restoreTasksFromBackup has been moved to js/restore-preview-core.js.

// 【新增】顶级复盘功能
// Top-level review system has been moved to js/review-system-core.js.

let reviewSystem;

// 时间显示功能
function updateTimeDisplay() {
    const now = new Date();
    const t = translations[currentLanguage];

    // 格式化日期：年月日
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    let dateStr;
    if (currentLanguage === 'zh') {
        dateStr = `${year}${t.year}${month}${t.month}${day}${t.day}`;
    } else {
        // 英文格式：MM/DD/YYYY
        dateStr = `${month}/${day}/${year}`;
    }

    // 格式化时间：时分秒
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}:${seconds}`;

    // 更新DOM元素
    const dateElement = document.getElementById('time-date');
    const timeElement = document.getElementById('time-time');

    if (dateElement) {
        dateElement.textContent = dateStr;
    }
    if (timeElement) {
        timeElement.textContent = timeStr;
    }

    // 调试信息（只在整分钟时输出，减少日志量）
    if (now.getSeconds() === 0) {
        console.log('时间已更新:', timeStr);
    }
}

// 初始化时间显示
function initTimeDisplay() {
    // 立即更新一次
    updateTimeDisplay();

    // 每秒更新一次
    const timeInterval = setInterval(updateTimeDisplay, 1000);

    // 页面可见性变化时重新同步时间
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            // 页面重新可见时立即更新时间
            updateTimeDisplay();
            console.log('页面重新可见，时间已同步');

            // 额外保护：重新绑定任务事件
            rebindTaskEvents();
        }
    });

    // 页面焦点恢复时重新绑定事件和同步时间（额外保护）
    window.addEventListener('focus', function () {
        console.log('页面获得焦点，重新绑定任务事件和同步时间');
        rebindTaskEvents();
        updateTimeDisplay();
    });

    // 存储定时器ID以便后续清理
    window.timeDisplayInterval = timeInterval;

    console.log('时间显示已初始化，每秒更新一次');
}

// 手动同步时间功能
function syncTime() {
    updateTimeDisplay();
    console.log('手动同步时间完成');
}

// 添加全局函数供调试使用
window.syncTime = syncTime;

// 检查时间显示状态
function checkTimeDisplayStatus() {
    const dateElement = document.getElementById('time-date');
    const timeElement = document.getElementById('time-time');
    const interval = window.timeDisplayInterval;

    console.log('=== 时间显示状态检查 ===');
    console.log('日期元素存在:', !!dateElement);
    console.log('时间元素存在:', !!timeElement);
    console.log('定时器运行中:', !!interval);
    console.log('当前显示时间:', timeElement ? timeElement.textContent : 'N/A');
    console.log('当前系统时间:', new Date().toLocaleString('zh-CN'));

    return {
        dateElement: !!dateElement,
        timeElement: !!timeElement,
        interval: !!interval,
        currentDisplay: timeElement ? timeElement.textContent : 'N/A',
        systemTime: new Date().toLocaleString('zh-CN')
    };
}
window.checkTimeDisplayStatus = checkTimeDisplayStatus;
// 页面加载完成后初始化时间显示
document.addEventListener('DOMContentLoaded', function () {
    console.log('=== DOMContentLoaded 事件触发 ===');

    try {
        console.log('开始初始化时间显示');
        initTimeDisplay();
        console.log('时间显示初始化完成');

        console.log('开始初始化性能优化');
        initPerformanceOptimizations();
        console.log('性能优化初始化完成');

        console.log('开始初始化键盘快捷键');
        initKeyboardShortcuts();
        console.log('键盘快捷键初始化完成');

        console.log('开始初始化离线支持');
        initOfflineSupport();
        console.log('离线支持初始化完成');

        console.log('开始初始化无障碍功能');
        initAccessibility();
        console.log('无障碍功能初始化完成');

        console.log('开始初始化错误处理');
        initErrorHandling();
        console.log('错误处理初始化完成');

        // PWA初始化
        console.log('DOMContentLoaded: 开始初始化PWA');
        try {
            initPWA();
            console.log('PWA初始化调用成功');
        } catch (error) {
            console.error('PWA初始化失败:', error);
        }

        console.log('开始初始化导出功能');
        initExportFeature();
        console.log('导出功能初始化完成');

        console.log('开始初始化API自动同步');
        initAPISync();
        console.log('API自动同步初始化完成');

        console.log('开始初始化四象限全屏功能');
        initQuadrantFullscreen();
        console.log('四象限全屏功能初始化完成');

        // 检查登录状态和权限
        console.log('开始检查登录状态和权限');
        checkLoginStatus();
        console.log('登录状态和权限检查完成');

        // 延迟调整导航栏宽度，确保DOM完全加载
        setTimeout(() => {
            adjustNavigationBarWidth();
        }, 100);

        // 检查更新状态
        checkUpdateStatus();

        // 处理Service Worker错误
        handleServiceWorkerErrors();

        // 处理URL hash参数，支持直接跳转到特定页面
        const hash = window.location.hash;

        // 检查是否从习惯打卡页面返回（优化加载）
        const isReturningFromHabit = window.DataSyncStorage.getSessionRaw('habit_tracker_return');
        if (isReturningFromHabit) {
            const returnTime = parseInt(isReturningFromHabit);
            const now = Date.now();

            // 如果是5秒内的返回，认为是快速返回
            if (now - returnTime < 5000) {
                console.log('检测到快速返回，跳过部分初始化');
                window.DataSyncStorage.removeSessionRaw('habit_tracker_return');

                // 直接切换到更多功能页面，不延迟
                if (hash === '#more-features') {
                    switchView('more-features');
                    return;
                }
            }
        }

        if (hash === '#more-features') {
            console.log('检测到hash参数，跳转到更多功能页面');
            setTimeout(() => {
                switchView('more-features');
            }, 100);
        }

        console.log('=== DOMContentLoaded 初始化完成 ===');
    } catch (error) {
        console.error('DOMContentLoaded 初始化过程中发生错误:', error);
    }
});

// 性能优化初始化
function initPerformanceOptimizations() {
    // 1. 图片懒加载
    initLazyLoading();

    // 2. 防抖和节流
    initDebounceThrottle();

    // 3. 内存管理
    initMemoryManagement();

    // 4. 性能监控
    initPerformanceMonitoring();
}

// 图片懒加载
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// 防抖和节流工具函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 初始化防抖和节流
function initDebounceThrottle() {
    // 搜索功能防抖
    window.debouncedSearch = debounce((query) => {
        // 搜索逻辑将在后续添加
        console.log('搜索:', query);
    }, 300);

    // 滚动事件节流
    window.throttledScroll = throttle(() => {
        // 滚动处理逻辑
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > 100) {
            document.body.classList.add('scrolled');
        } else {
            document.body.classList.remove('scrolled');
        }
    }, 100);

    // 绑定滚动事件
    window.addEventListener('scroll', window.throttledScroll);
}

// 内存管理
function initMemoryManagement() {
    // 定期清理未使用的DOM元素
    setInterval(() => {
        // 清理已移除的模态框
        const modals = document.querySelectorAll('.modal:not([style*="display: none"])');
        modals.forEach(modal => {
            if (!modal.offsetParent) {
                modal.remove();
            }
        });

        // 清理临时元素
        const tempElements = document.querySelectorAll('[data-temp="true"]');
        tempElements.forEach(el => {
            if (Date.now() - parseInt(el.dataset.created) > 300000) { // 5分钟
                el.remove();
            }
        });
    }, 60000); // 每分钟检查一次
}

// 性能监控
function initPerformanceMonitoring() {
    // 监控页面加载性能
    window.addEventListener('load', () => {
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;

            console.log('页面性能指标:', {
                loadTime: `${loadTime}ms`,
                domContentLoaded: `${domContentLoaded}ms`,
                firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 'N/A'
            });

            // 如果加载时间过长，显示优化提示
            if (loadTime > 3000) {
                console.warn('页面加载时间较长，建议优化');
            }
        }
    });

    // 内存监控已禁用以减少控制台输出
    // 如需启用，请取消注释以下代码并调整阈值
    /*
    if ('memory' in performance) {
        setInterval(() => {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            const totalMB = Math.round(memory.totalJSHeapSize / 1048576);

            if (usedMB > 150) { // 超过150MB时警告
                console.warn('内存使用较高:', `${usedMB}MB / ${totalMB}MB`);
            }
        }, 60000); // 每60秒检查一次
    }
    */
}

// 键盘快捷键初始化
function initKeyboardShortcuts() {
    // 快捷键映射
    const shortcuts = {
        'alt+n': () => {
            // Alt+N: 新建任务
            if (currentView === 'list') {
                const addBtn = document.getElementById('initial-add-btn');
                if (addBtn) addBtn.click();
            }
        },
        'alt+s': () => {
            // Alt+S: 保存当前内容
            if (currentView === 'list') {
                saveTasks();
                showPageNotification('任务已保存');
            }
        },
        'alt+f': () => {
            // Alt+F: 搜索任务
            showSearchDialog();
        },
        'ctrl+1': () => {
            // Ctrl+1: 切换到添加任务视图
            switchView('list');
        },
        'ctrl+2': () => {
            // Ctrl+2: 切换到四象限视图
            if (!isLoggedIn) {
                showNotification('请先登录以使用四象限视图', 'warning');
                return;
            }
            switchView('quadrant');
        },
        'ctrl+3': () => {
            // Ctrl+3: 切换到每日一签
            if (!isLoggedIn) {
                showNotification('请先登录以使用每日一签', 'warning');
                return;
            }
            switchView('fortune');
        },
        'ctrl+4': () => {
            // Ctrl+4: 切换到可视化看板
            if (!isLoggedIn) {
                showNotification('请先登录以使用可视化看板', 'warning');
                return;
            }
            switchView('dashboard');
        },
        'ctrl+5': () => {
            // Ctrl+5: 切换到顶级复盘
            if (!isLoggedIn) {
                showNotification('请先登录以使用顶级复盘', 'warning');
                return;
            }
            switchView('review');
        },
        'escape': () => {
            // ESC: 关闭模态框或取消操作
            closeAllModals();
        },
        'ctrl+shift+d': () => {
            // Ctrl+Shift+D: 切换深色模式
            toggleTheme();
        },
        'ctrl+shift+l': () => {
            // Ctrl+Shift+L: 切换语言
            toggleLanguage();
        },
        'ctrl+shift+h': () => {
            // Ctrl+Shift+H: 显示帮助
            showPageNotification('快捷键帮助：Alt+N(新建) Alt+S(保存) Alt+F(搜索) Ctrl+1-5(切换视图) Ctrl+Shift+D(主题) Ctrl+Shift+L(语言) ESC(关闭)');
        }
    };

    // 监听键盘事件
    document.addEventListener('keydown', (e) => {
        // 如果正在输入文本，不触发快捷键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
            return;
        }

        // 构建快捷键字符串
        let key = '';
        if (e.ctrlKey) key += 'ctrl+';
        if (e.shiftKey) key += 'shift+';
        if (e.altKey) key += 'alt+';
        key += e.key.toLowerCase();

        // 执行对应的快捷键
        if (shortcuts[key]) {
            e.preventDefault();
            shortcuts[key]();
            showShortcutHint(key);
        }
    });

    // 显示快捷键提示
    function showShortcutHint(shortcut) {
        const hint = document.createElement('div');
        hint.className = 'shortcut-hint';
        hint.textContent = `快捷键: ${shortcut}`;
        document.body.appendChild(hint);

        setTimeout(() => {
            hint.remove();
        }, 2000);
    }
}

// 显示搜索对话框
// showSearchDialog has been moved to js/search-dialog-core.js.


// createSearchDialogOverlay has been moved to js/search-dialog-core.js.


// 搜索任务
// searchTasks has been moved to js/search-dialog-core.js.


// 显示搜索结果
// displaySearchResults has been moved to js/search-dialog-core.js.


// createSearchResultItem has been moved to js/search-dialog-core.js.


// 高亮任务
// highlightTask has been moved to js/search-dialog-core.js.


// 获取优先级文本
// getPriorityText has been moved to js/export-feature-core.js.


// 关闭所有模态框
// closeAllModals has been moved to js/search-dialog-core.js.

// Offline support, accessibility, and global error handling have been moved to js/app-resilience-core.js.

// initErrorRecovery has been moved to js/backup-recovery-core.js.


// 创建初始备份
// createInitialBackup has been moved to js/backup-recovery-core.js.


// 手动创建备份
// createManualBackup has been moved to js/backup-recovery-core.js.


// 记录用户活动
// recordUserActivity has been moved to js/backup-recovery-core.js.


// 创建自动备份
// createAutoBackup has been moved to js/backup-recovery-core.js.

// 错误日志记录
// logError has been moved to js/backup-recovery-core.js.


// 获取错误日志
// getErrorLogs has been moved to js/backup-recovery-core.js.


// 清除错误日志
// clearErrorLogs has been moved to js/backup-recovery-core.js.


// 导出错误日志
// exportErrorLogs has been moved to js/backup-recovery-core.js.


// 导出功能初始化 - 版本 2.9.2
// initExportFeature has been moved to js/export-feature-core.js.


// 显示导出模态框
// showExportModal has been moved to js/export-feature-core.js.


// 隐藏导出模态框
// hideExportModal has been moved to js/export-feature-core.js.


// 更新导出预览
// updateExportPreview has been moved to js/export-feature-core.js.


// 获取导出任务数据
// getTasksForExport has been moved to js/export-feature-core.js.


// 生成Excel预览
// generateExcelPreview has been moved to js/export-feature-core.js.


// 生成PDF预览
// generatePDFPreview has been moved to js/export-feature-core.js.


// 生成Word预览
// generateWordPreview has been moved to js/export-feature-core.js.


// 生成Markdown预览
// generateMarkdownPreview has been moved to js/export-feature-core.js.


// 处理导出
// handleExport has been moved to js/export-feature-core.js.


// 导出到Excel
// exportToExcel has been moved to js/export-feature-core.js.


// 导出到PDF
// exportToPDF has been moved to js/export-feature-core.js.


// 生成PDF内容
// getJsPDFConstructor has been moved to js/export-feature-core.js.


// generatePDF has been moved to js/export-feature-core.js.


// 导出到Word
// exportToWord has been moved to js/export-feature-core.js.


// 导出到Markdown
// exportToMarkdown has been moved to js/export-feature-core.js.


// 辅助函数
// getQuadrantText has been moved to js/export-feature-core.js.


// getFormatName has been moved to js/export-feature-core.js.


// 下载文件
// downloadFile has been moved to js/export-feature-core.js.


// 动态加载脚本
// loadScript has been moved to js/export-feature-core.js.


// PWA, install prompts, update banner, and Service Worker error handling have been moved to js/pwa-update-core.js.

// Pomodoro and habit tracker have been moved to js/pomodoro-habit-core.js.

// ==================== 四象限全屏功能 ====================

/**
 * 初始化四象限全屏功能
 */
function initQuadrantFullscreen() {
    console.log('✅ 初始化四象限全屏功能');

    const centerBtn = document.getElementById('quadrant-center-fullscreen-btn');
    const quadrantView = document.getElementById('quadrant-view');

    if (!centerBtn || !quadrantView) {
        console.warn('⚠️ 全屏按钮或四象限视图未找到');
        return;
    }

    // 点击中间按钮切换全屏状态
    centerBtn.addEventListener('click', () => {
        if (quadrantView.classList.contains('fullscreen-mode')) {
            exitQuadrantFullscreen();
        } else {
            enterQuadrantFullscreen();
        }
    });

    // ESC键退出全屏
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && quadrantView.classList.contains('fullscreen-mode')) {
            exitQuadrantFullscreen();
        }
    });

    console.log('✅ 四象限全屏功能初始化完成');
}

/**
 * 进入四象限全屏模式
 */
function enterQuadrantFullscreen() {
    console.log('🚀 进入全屏模式');

    const quadrantView = document.getElementById('quadrant-view');
    const centerBtn = document.getElementById('quadrant-center-fullscreen-btn');
    const header = document.querySelector('header');
    const tabs = document.querySelector('.tabs');

    if (!quadrantView) return;

    // 添加全屏样式类
    quadrantView.classList.add('fullscreen-mode');

    // 更改按钮图标和提示
    if (centerBtn) {
        const icon = centerBtn.querySelector('.material-icons');
        if (icon) icon.textContent = 'fullscreen_exit';
        centerBtn.title = '退出全屏模式';
    }

    // 隐藏头部和导航栏
    if (header) header.style.display = 'none';
    if (tabs) tabs.style.display = 'none';

    // 隐藏滚动条
    document.body.style.overflow = 'hidden';

    // 显示提示
    showFullscreenToast('🎉 已进入沉浸式全屏模式，按 ESC 退出');

    console.log('✅ 全屏模式已开启');
}

/**
 * 退出四象限全屏模式
 */
function exitQuadrantFullscreen() {
    console.log('🔙 退出全屏模式');

    const quadrantView = document.getElementById('quadrant-view');
    const centerBtn = document.getElementById('quadrant-center-fullscreen-btn');
    const header = document.querySelector('header');
    const tabs = document.querySelector('.tabs');

    if (!quadrantView) return;

    // 移除全屏样式类
    quadrantView.classList.remove('fullscreen-mode');

    // 恢复按钮图标和提示
    if (centerBtn) {
        const icon = centerBtn.querySelector('.material-icons');
        if (icon) icon.textContent = 'fullscreen';
        centerBtn.title = '全屏模式';
        centerBtn.style.display = 'flex'; // ✅ 恢复显示中间按钮
    }

    // 显示头部和导航栏
    if (header) header.style.display = '';
    if (tabs) tabs.style.display = '';

    // 恢复滚动条
    document.body.style.overflow = '';

    console.log('✅ 全屏模式已关闭');
}

/**
 * 显示全屏提示
 */
function showFullscreenToast(message) {
    // 移除旧的提示
    const oldToast = document.querySelector('.fullscreen-toast');
    if (oldToast) oldToast.remove();

    // 创建新提示
    const toast = document.createElement('div');
    toast.className = 'fullscreen-toast';
    toast.textContent = message;

    document.body.appendChild(toast);

    // 3秒后自动移除
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 导出全屏功能
window.enterQuadrantFullscreen = enterQuadrantFullscreen;
window.exitQuadrantFullscreen = exitQuadrantFullscreen;

// 时间管理可视化看板系统已抽离至 js/time-tracker-system.js

// 沉浸式自然日历模块已抽离至 js/calendar-module.js

// 权限验证和调试机制已抽离至 js/permission-manager.js
