// ==================== 权限验证和调试机制 ====================

/**
 * 权限管理系统
 * 用于诊断、验证和修复用户权限问题
 */
const PermissionManager = {
    // 权限定义
    PERMISSIONS: {
        'add-task': { name: '添加任务', icon: '📝' },
        'quadrant-view': { name: '四象限视图', icon: '📊' },
        'fortune': { name: '每日一签', icon: '🔮' },
        'dashboard': { name: '可视化看板', icon: '📈' },
        'backup': { name: '更多功能', icon: '💾' },
        'review': { name: '顶级复盘', icon: '🔍' },
        'templates': { name: '任务模板', icon: '📋' }
    },

    // 权限名称映射（不依赖外部常量）
    PERMISSION_NAMES: {
        'add-task': '添加任务',
        'quadrant-view': '四象限视图',
        'fortune': '每日一签',
        'dashboard': '可视化看板',
        'backup': '更多功能',
        'review': '顶级复盘',
        'templates': '任务模板'
    },

    // 关键权限列表
    CRITICAL_PERMISSIONS: ['review', 'templates'],

    // 诊断用户权限
    diagnoseUserPermissions: function(username) {
        console.log('\n🔍 === 权限诊断开始 ===');
        console.log('目标用户:', username);

        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.username === username);

            if (!user) {
                console.log('❌ 用户不存在');
                return { success: false, error: '用户不存在' };
            }

            console.log('📋 用户基本信息:', {
                id: user.id,
                username: user.username,
                role: user.role,
                permissions: user.permissions,
                permissionsCount: user.permissions ? user.permissions.length : 0,
                permissionsType: typeof user.permissions
            });

            // 验证权限数据完整性
            const diagnosis = this.validatePermissions(user.permissions);

            console.log('✅ === 权限诊断完成 ===');
            return { success: true, user, diagnosis };

        } catch (error) {
            console.error('❌ 诊断过程出错:', error);
            return { success: false, error: error.message };
        }
    },

    // 验证权限数据
    validatePermissions: function(permissions) {
        console.log('🔍 验证权限数据:');

        const issues = [];
        // 使用内部的权限定义
        const validPermissions = Object.keys(this.PERMISSIONS);

        // 检查权限类型
        if (!Array.isArray(permissions)) {
            issues.push('权限不是数组类型');
            return { issues, isValid: false, cleanPermissions: [] };
        }

        // 检查权限为空
        if (permissions.length === 0) {
            issues.push('权限数组为空');
            return { issues, isValid: false, cleanPermissions: [] };
        }

        // 检查无效权限
        const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
        if (invalidPermissions.length > 0) {
            issues.push(`存在无效权限: ${invalidPermissions.join(', ')}`);
        }

        // 检查重复权限
        const uniquePermissions = [...new Set(permissions)];
        if (uniquePermissions.length !== permissions.length) {
            issues.push('存在重复权限');
        }

        // 检查关键权限
        const missingCritical = this.CRITICAL_PERMISSIONS.filter(p => !permissions.includes(p));
        if (missingCritical.length > 0) {
            issues.push(`缺失关键权限: ${missingCritical.join(', ')}`);
        }

        const cleanPermissions = permissions.filter(p => validPermissions.includes(p));

        console.log('  - 原始权限:', permissions);
        console.log('  - 有效权限:', cleanPermissions);
        console.log('  - 关键权限:', {
            review: permissions.includes('review'),
            templates: permissions.includes('templates')
        });
        console.log('  - 发现问题:', issues);

        return {
            issues,
            isValid: issues.length === 0,
            cleanPermissions,
            criticalStatus: {
                review: permissions.includes('review'),
                templates: permissions.includes('templates')
            }
        };
    },

    // 修复用户权限
    fixUserPermissions: function(username) {
        console.log('\n🔧 === 开始修复权限 ===');
        console.log('目标用户:', username);

        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.username === username);

            if (userIndex === -1) {
                console.log('❌ 用户不存在');
                return { success: false, error: '用户不存在' };
            }

            const user = users[userIndex];
            console.log('修复前权限:', user.permissions);

            // 确保权限是数组
            if (!Array.isArray(user.permissions)) {
                user.permissions = [];
            }

            // 设置完整权限（排除已删除的backup权限）
            const fullPermissions = Object.keys(this.PERMISSIONS).filter(p => p !== 'backup');
            user.permissions = [...fullPermissions];

            console.log('修复后权限:', user.permissions);

            // 保存到localStorage
            localStorage.setItem('users', JSON.stringify(users));

            // 立即验证
            const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const savedUser = savedUsers.find(u => u.username === username);

            if (savedUser && savedUser.permissions.includes('review') && savedUser.permissions.includes('templates')) {
                console.log('✅ 权限修复成功');

                // 如果是当前登录用户，更新会话
                if (currentUser && currentUser.username === username) {
                    currentUser.permissions = savedUser.permissions;
                    console.log('✅ 已更新当前用户会话');

                    // 重新应用菜单权限
                    setTimeout(() => {
                        updateMenuVisibility();
                        console.log('✅ 已重新应用菜单权限');
                    }, 100);
                }

                return { success: true, user: savedUser };
            } else {
                console.log('❌ 权限修复失败');
                return { success: false, error: '保存后权限验证失败' };
            }

        } catch (error) {
            console.error('❌ 修复过程出错:', error);
            return { success: false, error: error.message };
        }
    },

    // 监听localStorage变化
    startMonitoring: function() {
        console.log('👁️ === 启动权限监听 ===');

        const originalSetItem = localStorage.setItem;
        localStorage.setItem = (key, value) => {
            if (key === 'users') {
                console.log('🔄 检测到用户数据更新');

                try {
                    const users = JSON.parse(value);
                    const wqfgUser = users.find(u => u.username === 'WQFG');

                    if (wqfgUser) {
                        console.log('📋 WQFG用户权限:', wqfgUser.permissions);

                        // 检查关键权限
                        const criticalStatus = {
                            review: wqfgUser.permissions.includes('review'),
                            templates: wqfgUser.permissions.includes('templates')
                        };

                        console.log('🔑 关键权限状态:', criticalStatus);

                        // 如果缺失关键权限，立即警告
                        if (!criticalStatus.review || !criticalStatus.templates) {
                            console.warn('⚠️ 警告：WQFG用户即将丢失关键权限！');
                            console.warn('  review权限:', criticalStatus.review);
                            console.warn('  templates权限:', criticalStatus.templates);
                        }
                    }
                } catch (error) {
                    console.error('❌ 解析用户数据失败:', error);
                }
            }

            return originalSetItem.call(localStorage, key, value);
        };

        console.log('✅ 权限监听已启动');
    },

    // 一键修复WQFG用户权限
    quickFixWQFG: function() {
        console.log('🚀 === 一键修复WQFG权限 ===');
        return this.fixUserPermissions('WQFG');
    },

    // 验证菜单显示状态
    validateMenuDisplay: function() {
        console.log('\n🖥️ === 验证菜单显示状态 ===');

        const criticalMenus = {
            'review-tab-btn': '顶级复盘',
            'templates-tab-btn': '任务模板'
        };

        const results = {};

        Object.entries(criticalMenus).forEach(([menuId, menuName]) => {
            const element = document.getElementById(menuId);
            if (element) {
                const display = window.getComputedStyle(element).display;
                const visibility = window.getComputedStyle(element).visibility;

                results[menuId] = {
                    name: menuName,
                    exists: true,
                    display: display,
                    visibility: visibility,
                    isVisible: display !== 'none' && visibility !== 'hidden'
                };

                console.log(`  ${menuName} (${menuId}):`, results[menuId]);
            } else {
                results[menuId] = {
                    name: menuName,
                    exists: false,
                    isVisible: false
                };
                console.log(`  ${menuName} (${menuId}): 元素不存在`);
            }
        });

        // 检查当前用户权限
        if (currentUser) {
            console.log('当前用户权限:', currentUser.permissions);
        }

        return results;
    }
};

// 全局权限管理函数
window.PermissionManager = PermissionManager;

// 便捷的全局函数
window.diagnoseWQFG = () => PermissionManager.diagnoseUserPermissions('WQFG');
window.fixWQFG = () => PermissionManager.quickFixWQFG();
window.validateMenus = () => PermissionManager.validateMenuDisplay();

// 自动启动监听
PermissionManager.startMonitoring();

console.log('🎯 权限管理系统已加载');
console.log('使用 PermissionManager 进行权限管理');
console.log('快捷函数: diagnoseWQFG(), fixWQFG(), validateMenus()');
