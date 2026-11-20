// ==================== 权限验证和调试机制 ====================

/**
 * 权限管理系统
 * 用于诊断、验证和修复用户权限问题
 */
const PermissionManager = {
    PERMISSIONS: window.XXSGPermissionCatalog,
    PERMISSION_NAMES: Object.fromEntries(Object.entries(window.XXSGPermissionCatalog).map(([key, item]) => [key, item.name])),

    // 诊断用户权限
    diagnoseUserPermissions: function(username) {
        console.log('\n🔍 === 权限诊断开始 ===');
        console.log('目标用户:', username);

        try {
            const users = window.UserStorage.getUsers();
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

        const cleanPermissions = uniquePermissions.filter(p => validPermissions.includes(p));

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

            // 保留旧版本或扩展功能的权限，仅清理重复项。
            const cleanPermissions = [...new Set(Array.isArray(user.permissions) ? user.permissions : [])];
            user.permissions = cleanPermissions;

            console.log('修复后权限:', user.permissions);

            // 保存到localStorage
            localStorage.setItem('users', JSON.stringify(users));

            // 立即验证
            const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const savedUser = savedUsers.find(u => u.username === username);

            if (savedUser && JSON.stringify(savedUser.permissions) === JSON.stringify(cleanPermissions)) {
                console.log('✅ 权限修复成功');

                // 如果是当前登录用户，更新会话
                if (typeof currentUser !== 'undefined' && currentUser && currentUser.username === username) {
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

    // 验证菜单显示状态
    validateMenuDisplay: function() {
        console.log('\n🖥️ === 验证菜单显示状态 ===');

        const criticalMenus = {
            'review-tab-btn': '顶级复盘',
            'time-train-tab-btn': '时光列车'
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
window.validateMenus = () => PermissionManager.validateMenuDisplay();

console.log('🎯 权限管理系统已加载');
console.log('使用 PermissionManager 进行权限管理');
console.log('快捷函数: validateMenus()');
