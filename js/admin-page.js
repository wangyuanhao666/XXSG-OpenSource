// ============================================================
// 🤖 AI服务管理器（管理员后台专用）
// ============================================================
const AI_SERVICE_PRESETS = {
    deepseek: { name: 'DeepSeek', endpoint: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat', protocol: 'openai-compatible', link: 'https://platform.deepseek.com' },
    openai: { name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-3.5-turbo', protocol: 'openai-compatible', link: 'https://platform.openai.com' },
    claude: { name: 'Claude', endpoint: 'https://api.anthropic.com/v1/messages', model: 'claude-sonnet-4-5', protocol: 'anthropic-messages', link: 'https://console.anthropic.com' },
    kimi: { name: 'Kimi', endpoint: 'https://api.moonshot.cn/v1/chat/completions', model: 'kimi-k2.6', protocol: 'openai-compatible', link: 'https://platform.moonshot.cn' },
    qwen: { name: '通义千问 Qwen', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus', protocol: 'openai-compatible', link: 'https://dashscope.aliyun.com' },
    glm: { name: 'GLM / Z.ai', endpoint: 'https://api.z.ai/api/paas/v4/chat/completions', model: 'glm-4.5-flash', protocol: 'openai-compatible', link: 'https://z.ai' },
    minimax: { name: 'MiniMax', endpoint: 'https://api.minimax.io/v1/chat/completions', model: 'MiniMax-M3', protocol: 'openai-compatible', link: 'https://platform.minimaxi.com' }
};

function createAIServiceState() {
    return Object.fromEntries(Object.entries(AI_SERVICE_PRESETS).map(([id, preset]) => [
        id,
        { ...preset, enabled: false, credential: null }
    ]));
}

function getAIServiceInputId(serviceName) {
    return serviceName === 'deepseek' ? 'deepseek-service-api-key' : `${serviceName}-api-key`;
}

function getActiveAIServiceName() {
    const activeTab = document.querySelector('.service-tab.active');
    return activeTab?.dataset.aiService || window.aiServiceManager?.currentService || 'deepseek';
}

function renderAIServiceConfigMarkup() {
    const tabs = Object.entries(AI_SERVICE_PRESETS).map(([serviceName, preset], index) => `
            <button class="service-tab ${index === 0 ? 'active' : ''}" data-ai-service="${serviceName}" data-admin-action="switchAIService">
                ${preset.name}
            </button>
    `).join('');

    const panels = Object.entries(AI_SERVICE_PRESETS).map(([serviceName, preset], index) => {
        const inputId = getAIServiceInputId(serviceName);
        return `
            <div id="${serviceName}-config" class="service-config ${index === 0 ? 'active' : ''}">
                <div class="form-group">
                    <label for="${inputId}">🔑 ${preset.name} API Key:</label>
                    <input type="password" id="${inputId}" placeholder="请输入 ${preset.name} API Key">
                    <small>
                        获取方式：访问 <a href="${preset.link}" target="_blank" rel="noopener noreferrer">${preset.name} 平台</a>
                        · 默认模型：<code>${preset.model}</code>
                    </small>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="service-tabs">
            ${tabs}
        </div>
        ${panels}
    `;
}

class AIServiceManager {
    constructor() {
        this._services = createAIServiceState();
        this.currentService = 'deepseek';
        this._initialized = false;
        this.init();
    }

    async init() {
        console.log('🤖 AI服务管理器初始化（管理员后台）');
        await this.loadAIConfig();
        this._initialized = true;
    }

    async loadAIConfig() {
        console.log('🔧 加载AI配置...');

        let aiConfig = null;

        if (window.secureStorage) {
            await window.secureStorage.ready();
            aiConfig = await window.secureStorage.getSecure('aiConfig');
        }

        if (!aiConfig) {
            const oldConfig = window.AdminStorage.getRaw('aiConfig');
            if (oldConfig) {
                try {
                    aiConfig = JSON.parse(oldConfig);
                    if (window.secureStorage) {
                        await window.secureStorage.setSecure('aiConfig', aiConfig);
                        window.AdminStorage.removeKey('aiConfig');
                    }
                } catch (error) {
                    console.error('❌ 解析AI配置失败:', error);
                }
            }
        }

        if (aiConfig) {
            Object.keys(this._services).forEach(serviceName => {
                this._services[serviceName].enabled = aiConfig[serviceName]?.enabled || false;
                this._services[serviceName].credential = aiConfig[serviceName]?.apiKey || null;
            });
            this.currentService = aiConfig.currentService || 'deepseek';

            console.log('✅ AI配置加载完成:', Object.fromEntries(Object.entries(this._services).map(([serviceName, service]) => [
                serviceName,
                { enabled: service.enabled, credentialConfigured: !!service.credential }
            ])));
        }
    }

    async setAPIKey(service, credential) {
        if (this._services[service]) {
            this._services[service].credential = credential;
            this._services[service].enabled = !!credential;
            if (credential) {
                this.currentService = service;
            }
            await this.saveAIConfig();
            console.log(`✅ ${service} API密钥已设置`);
        }
    }

    async saveAIConfig() {
        const config = Object.fromEntries(Object.entries(this._services).map(([serviceName, service]) => [
            serviceName,
            {
                enabled: service.enabled,
                apiKey: service.credential
            }
        ]));
        config.currentService = this.currentService;

        if (window.secureStorage) {
            await window.secureStorage.ready();
            await window.secureStorage.setSecure('aiConfig', config);
            console.log('✅ AI配置已加密保存');
        } else {
            console.warn('⚠️ 安全存储未就绪，使用明文存储');
            window.AdminStorage.setRaw('aiConfig', JSON.stringify(config));
        }
    }

    getAvailableService() {
        const selected = this._services[this.currentService];
        if (selected?.enabled && selected.credential) {
            return this.currentService;
        }

        for (const [serviceName, service] of Object.entries(this._services)) {
            if (service.enabled && service.credential) {
                return serviceName;
            }
        }
        return null;
    }

    async debugAIConfig() {
        console.log('🔍 AI配置调试信息:');
        console.log('当前服务:', this.currentService);
        console.log('服务状态:', Object.fromEntries(Object.entries(this._services).map(([serviceName, service]) => [
            serviceName,
            {
                enabled: service.enabled,
                credentialConfigured: !!service.credential
            }
        ])));
    }
}

// 创建全局实例（等待 secureStorage 加载）
async function initAIServiceManager() {
    // 等待 secureStorage 就绪
    if (window.secureStorage) {
        await window.secureStorage.ready();
    }
    window.aiServiceManager = new AIServiceManager();
    console.log('✅ AI服务管理器已创建（管理员后台版本）');
}

// 页面加载后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAIServiceManager);
} else {
    initAIServiceManager();
}

const adminActionHandlers = {
    logout,
    quickCreateUser,
    quickViewStats,
    quickBackup,
    goToUserManagement,
    goToAIConfig,
    goToPasswordManagement,
    goToAPISyncConfig,
    goToSystemStats,
    closeEditUserModal,
    closeCreateUserModal,
    showMainPage,
    saveAIConfig,
    testAIKey,
    exportChartData,
    refreshUsageReport,
    resetUsageStats,
    createNewUser,
    loadUserList,
    applyAllFilters,
    quickRefresh,
    toggleAutoRefresh,
    toggleDarkMode,
    showHelp,
    refreshSystemStats,
    exportSystemStats,
    exportAdvancedReport,
    resetSystemStats
};

document.addEventListener('click', function handleAdminDelegatedClick(event) {
    const dismissButton = event.target.closest('[data-admin-dismiss]');
    if (dismissButton) {
        dismissButton.parentElement?.parentElement?.remove();
        return;
    }

    const actionButton = event.target.closest('[data-admin-action]');
    if (!actionButton) return;

    event.preventDefault();
    const action = actionButton.dataset.adminAction;
    if (action === 'switchAIService') {
        switchAIService(actionButton.dataset.aiService);
        return;
    }

    if (action === 'saveAIServiceConfig') {
        saveAIServiceConfig(actionButton.dataset.aiService, event);
        return;
    }

    if (action === 'editUser') {
        editUser(actionButton.dataset.userId);
        return;
    }

    if (action === 'deleteUser') {
        deleteUser(actionButton.dataset.userId);
        return;
    }

    adminActionHandlers[action]?.(event);
});

document.addEventListener('change', function handleAdminDelegatedChange(event) {
    const control = event.target.closest('[data-admin-change]');
    if (!control) return;

    const handlers = {
        updateChart,
        applyTimeFilter,
        applyUserFilter,
        applyFeatureFilter
    };
    handlers[control.dataset.adminChange]?.(event);
});

// ============================================================
// 🔐 加密/解密函数（保持与主脚本一致）
// ============================================================
// ========== API KEY 加密/解密函数 ==========
// 简单加密：Base64 + 反转（防君子不防小人）
function encryptApiKey(credential) {
    try {
        // Base64编码
        const base64 = btoa(credential);
        // 反转字符串
        const encrypted = base64.split('').reverse().join('');
        return encrypted;
    } catch (e) {
        console.error('API Key加密失败:', e);
        return '';
    }
}

function decryptApiKey(encrypted) {
    try {
        // 反转字符串
        const reversed = encrypted.split('').reverse().join('');
        // Base64解码
        const decrypted = atob(reversed);
        return decrypted;
    } catch (e) {
        console.error('API Key解密失败:', e);
        return '';
    }
}

// 安全保存API KEY（加密后存储）
function saveApiKeySecure(key, value) {
    const encrypted = encryptApiKey(value);
    window.AdminStorage.setRaw(key, encrypted);
}

// 安全读取API KEY（解密后返回）
function getApiKeySecure(key) {
    const encrypted = window.AdminStorage.getRaw(key);
    if (!encrypted) return null;
    return decryptApiKey(encrypted);
}

// 从aiConfig获取解密后的API KEY
async function getDecryptedApiKeyFromConfig(serviceName) {
    try {
        let aiConfig = null;

        // 首先尝试从加密存储读取
        if (window.secureStorage) {
            await window.secureStorage.ready();
            aiConfig = await window.secureStorage.getSecure('aiConfig');
        }

        // 降级：从 localStorage 读取（可能未迁移）
        if (!aiConfig) {
            const plainConfig = window.AdminStorage.getRaw('aiConfig');
            if (plainConfig) {
                aiConfig = JSON.parse(plainConfig);
            }
        }

        if (!aiConfig) return null;

        const serviceConfig = aiConfig[serviceName];
        if (serviceConfig) {
            // 兼容旧的 provider credential 字段
            const encryptedKey = serviceConfig.apiKey || serviceConfig.api;
            if (encryptedKey) {
                return decryptApiKey(encryptedKey);
            }
        }
        return null;
    } catch (e) {
        console.error('获取解密API KEY失败:', e);
        return null;
    }
}

// 权限定义对象
const PERMISSIONS = {
    'add-task': {
        name: '添加任务',
        description: '允许用户创建和管理任务',
        icon: '📝'
    },
    'quadrant-view': {
        name: '四象限视图',
        description: '允许用户使用四象限时间管理视图',
        icon: '📊'
    },
      'dashboard': {
        name: '可视化看板',
        description: '允许用户查看数据可视化看板和统计图表',
        icon: '📈'
    },
    'review': {
        name: '顶级复盘',
        description: '允许用户进行深度复盘和总结分析',
        icon: '🔍'
    },
    'templates': {
        name: '任务模板',
        description: '允许用户创建和使用任务模板',
        icon: '📋'
    },
    'habit-tracker': {
        name: '习惯打卡',
        description: '允许用户使用习惯打卡功能，记录和统计习惯养成',
        icon: '✅'
    },
    'pomodoro': {
        name: '番茄专注',
        description: '允许用户使用番茄计时器，提升专注力和效率',
        icon: '🍅'
    },
    'countdown': {
        name: '倒数日',
        description: '允许用户创建和管理倒数日，记录重要日期',
        icon: '📅'
    },
    'time-tracker': {
        name: '时间管理看板',
        description: '允许用户使用时间管理可视化看板，记录和查看时间分配',
        icon: '⏱️'
    },
    'calendar': {
        name: '沉浸式日历',
        description: '允许用户使用沉浸式自然日历，在山景云海中规划日程',
        icon: '🌄'
    },
    'fortune': {
        name: '每日一签',
        description: '允许用户查看每日签语（包括传统签语和AI生成）',
        icon: '🔮'
    },
    'more-features': {
        name: '更多功能',
        description: '允许用户访问更多功能页面',
        icon: '⚙️'
    },
    'backup': {
        name: '数据备份',
        description: '允许用户备份和恢复数据',
        icon: '💾'
    },
    'api-sync': {
        name: 'API同步',
        description: '允许任务数据通过API自动同步到外部服务器',
        icon: '🔄'
    }
};

// 检查管理员登录状态
function checkAdminStatus() {
    const session = window.SessionStorage.getSession('userSession');
    return Boolean(session?.user && session.user.role === 'admin');
}

// 🔧 添加权限修复工具
window.debugAdminPermissions = function() {
    console.log('🔧 === 管理员权限调试 ===');

    const users = window.UserStorage.getUsers();
    console.log('所有用户:', users);

    const wqfgUser = users.find(u => u.username === 'WQFG');
    if (wqfgUser) {
        console.log('WQFG用户:', {
            username: wqfgUser.username,
            permissions: wqfgUser.permissions,
            permissionsCount: wqfgUser.permissions.length,
            permissionsType: typeof wqfgUser.permissions
        });
    }

    const currentUser = window.SessionStorage.getCurrentUser();
    if (currentUser) console.log('Current session user:', currentUser.username);

    console.log('PERMISSIONS对象:', Object.keys(PERMISSIONS));
};

// 🔧 修复编辑用户权限加载 - 已移除强制权限修改
window.fixEditUserPermissionLoading = function() {
    console.log('🔧 === 修复编辑用户权限加载 ===');

    // 重写editUser函数
    const originalEditUser = window.editUser;
    if (originalEditUser) {
        window.editUser = function(userId) {
            console.log('🔧 使用修复版本的editUser函数');

            const users = window.UserStorage.getUsers();
            const user = users.find(u => u.id === userId);

            if (!user) {
                alert('用户不存在');
                return;
            }

            console.log('🔧 编辑用户:', user.username);

            // 🔧 完全尊重用户原有的权限，不进行任何强制修改
            let userPermissions = Array.isArray(user.permissions) ? [...user.permissions] : [];

            console.log('🔧 用户权限:', userPermissions);
            console.log('🔧 权限数量:', userPermissions.length);

            console.log('📋 最终使用的权限:', userPermissions);

            // 创建编辑用户模态对话框
            const modalHTML = `
                <div id="edit-user-modal" class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>
                                <span class="material-icons">✏️</span>
                                编辑用户 - ${user.username}
                            </h3>
        <button class="modal-close" data-admin-action="closeEditUserModal">
                                <span class="material-icons">✖️</span>
                            </button>
                        </div>
                        <form id="edit-user-form" class="modal-body">
                            <!-- 基本信息分组 -->
                            <div class="form-section">
                                <div class="form-section-title">👤 基本信息</div>
                                <div class="form-group">
                                    <label for="edit-username">🎯 用户名 *</label>
                                    <input type="text" id="edit-username" value="${user.username}" placeholder="请输入用户名" required>
                                </div>
                                <div class="form-group">
                                    <label for="edit-email">📧 邮箱</label>
                                    <input type="email" id="edit-email" value="${user.email || ''}" placeholder="请输入邮箱（可选）">
                                </div>
                                <div class="form-group">
                                    <label for="edit-role">⭐ 用户类型</label>
                                    <select id="edit-role">
                                        <option value="normal" ${user.role === 'normal' ? 'selected' : ''}>👤 普通用户</option>
                                        <option value="vip" ${user.role === 'vip' ? 'selected' : ''}>⭐ VIP用户</option>
                                    </select>
                                </div>
                            </div>

                            <!-- 安全设置分组 -->
                            <div class="form-section">
                                <div class="form-section-title">🔒 安全设置</div>
                                <div class="form-group">
                                    <label for="edit-password">🔑 新密码（留空则不修改）</label>
                                    <input type="password" id="edit-password" placeholder="输入新密码（可选）">
                                </div>
                            </div>

                            <!-- 权限设置分组 -->
                            <div class="form-group">
                                <label>⚙️ 功能权限</label>
                                <div class="permissions-grid">
                                    ${Object.entries(PERMISSIONS || {}).map(([key, permission]) => `
                                        <div class="permission-item">
                                            <label class="permission-label">
                                                <input type="checkbox" name="edit-permissions" value="${key}" ${userPermissions.includes(key) ? 'checked' : ''}>
                                                <span class="permission-icon">${permission.icon}</span>
                                                <div class="permission-info">
                                                    <div class="permission-name">${permission.name}</div>
                                                    <div class="permission-desc">${permission.description}</div>
                                                </div>
                                            </label>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            ${user.username === 'WQFG' ? `
                            <div class="alert alert-warning" style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
                                ⚠️ WQFG用户建议只保留"添加任务"和"四象限视图"两个权限
                            </div>
                            ` : ''}
                        </form>
                        <div class="modal-footer">
                <button type="button" class="admin-btn secondary" data-admin-action="closeEditUserModal">
                                <span class="material-icons">❌</span>
                                取消
                            </button>
                            <button type="submit" form="edit-user-form" class="admin-btn">
                                <span class="material-icons">✅</span>
                                保存修改
                            </button>
                        </div>
                    </div>
                </div>
            `;

            appendAdminMarkup(document.body, modalHTML);

            // 绑定表单提交事件
            const form = document.getElementById('edit-user-form');
            if (form) {
                form.addEventListener('submit', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔧 表单提交事件触发');
                    handleEditUser(userId);
                });

                // 添加保存按钮的直接点击事件处理（备用方案）
                const saveButton = document.querySelector('button[type="submit"][form="edit-user-form"]');
                if (saveButton) {
                    saveButton.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔧 保存按钮点击事件触发');
                        handleEditUser(userId);
                    });
                }
            }
        };
    }
};

// 自动应用修复
fixEditUserPermissionLoading();

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminStatus()) {
        alert('请先登录管理员账号');
        window.location.href = 'login.html';
        return;
    }

    console.log('管理员后台页面加载完成');

    // 加载系统概览数据
    loadDashboardData();
});

// 加载仪表盘数据
function loadDashboardData() {
    // 加载用户数据
    const users = window.UserStorage.getUsers();
    const totalUsers = users.length;
    const vipUsers = users.filter(u => u.role === 'vip').length;

    // 加载任务数据
    const tasks = window.TaskStorage.getTasks();
    const totalTasks = tasks.length;

    // 计算系统运行率（模拟）
    const uptime = 95 + Math.floor(Math.random() * 5); // 95-100%

    // 更新界面
    animateCounter('total-users-count', totalUsers);
    animateCounter('vip-users-count', vipUsers);
    document.getElementById('system-uptime').textContent = uptime + '%';
    animateCounter('total-tasks', totalTasks);
}

// 数字动画效果
function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let currentValue = 0;
    const increment = targetValue / 30; // 30帧动画
    const duration = 1000; // 1秒
    const frameTime = duration / 30;

    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            element.textContent = targetValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(currentValue);
        }
    }, frameTime);
}

// 快捷操作：创建用户
function quickCreateUser() {
    goToUserManagement();
    // 延迟打开创建用户表单
    setTimeout(() => {
        const createBtn = document.querySelector('.admin-actions button[onclick*="showCreateUser"]');
        if (createBtn) {
            createBtn.click();
        }
    }, 500);
}

// 快捷操作：查看统计
function quickViewStats() {
    goToSystemStats();
}

// 快捷操作：数据备份
function quickBackup() {
    const confirmBackup = confirm('确认要备份当前数据吗？');
    if (confirmBackup) {
        try {
            const backupData = {
                users: window.UserStorage.getUsers(),
                tasks: window.TaskStorage.getTasks(),
                adminPassword: window.AdminStorage.getRaw('adminPassword'),
                aiConfig: window.AdminStorage.getRaw('aiFortuneEnabled'),
                exportTime: new Date().toISOString()
            };

            const dataStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `admin_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('✅ 数据备份成功！');
        } catch (error) {
            console.error('备份失败:', error);
            alert('❌ 备份失败，请稍后重试');
        }
    }
}

// 退出登录
function logout() {
    if (confirm('确定要退出登录吗？')) {
        window.SessionStorage.clearSessions(['userSession']);
        window.location.href = 'login.html';
    }
}

// 跳转到用户管理
function goToUserManagement() {
    // 创建用户管理页面
    createUserManagementPage();
}

// 跳转到AI配置
function goToAIConfig() {
    // 创建AI配置页面
    createAIConfigPage();
}

// 跳转到API同步配置
function goToAPISyncConfig() {
    createAPISyncConfigPage();
}

// 跳转到密码管理
function goToPasswordManagement() {
    // 创建密码管理页面
    createPasswordManagementPage();
}

// 跳转到系统统计
function goToSystemStats() {
    // 创建系统统计页面
    createSystemStatsPage();
}

// 页面加载时初始化AI配置显示
function initAIConfigDisplay() {
    // 加载所有 AI 服务配置
    Object.keys(AI_SERVICE_PRESETS).forEach(serviceName => loadAIServiceConfig(serviceName));
}

// 创建AI配置页面
function createAIConfigPage() {
    // 隐藏主内容
    const mainContainer = document.querySelector('.admin-container');
    mainContainer.style.display = 'none';

    // 创建AI配置页面HTML
    const aiConfigHTML = `
        <div class="ai-config-page">
            <div class="ai-config-header">
    <button class="back-btn" data-admin-action="showMainPage">
                        <span class="material-icons">arrow_back</span>
                        返回主页
                    </button>
                <h1>🤖 AI配置</h1>
                <p>统一配置 AI 签语和 AI 服务能力，支持多家主流大模型 API</p>
            </div>

            <div class="ai-config-content">
                <div class="config-card">
                    <div class="config-info">
                        <h3>📋 配置说明</h3>
                        <p>AI 签语和 AI 任务分析共用下方 AI 服务配置。选择任一服务商并保存 API Key 后，即可启用 AI 签语和 AI 服务能力。</p>
                    </div>

                    <form id="ai-key-config-form" class="config-form">
                        <div class="form-group">
                            <h3 class="ai-config-section-title">🔑 AI 签语使用的 API Key</h3>
                            <p class="ai-config-section-note">
                                请在下方“AI 服务配置”中选择 DeepSeek、OpenAI、Claude、Kimi、通义千问、GLM/Z.ai 或 MiniMax，并保存对应 API Key。AI 签语会自动使用当前已配置的可用服务。
                            </p>
                        </div>

                        <!-- AI服务配置 -->
                        <div class="ai-services-config">
                            <h3>🤖 AI服务配置</h3>
                            <p class="ai-service-note">AI 签语和 AI 任务分析支持 DeepSeek、OpenAI、Claude、Kimi、通义千问、GLM/Z.ai、MiniMax。当前为浏览器侧 BYOK 模式，API Key 只保存在当前浏览器本地，请勿把真实 Key 提交到仓库。</p>
                            ${renderAIServiceConfigMarkup()}
                        </div>

                        <div class="config-status" id="config-status">
                            <h4>📊 当前状态</h4>
                            <div class="status-item">
                                <span>当前AI服务：</span>
                                <span id="current-ai-service-status" class="status-badge">未配置</span>
                            </div>
                            <div class="status-item">
                                <span>API Key状态：</span>
                                <span id="api-key-status" class="status-badge">未配置</span>
                            </div>
                            <div class="status-item">
                                <span>AI功能状态：</span>
                                <span id="ai-function-status" class="status-badge">未启用</span>
                            </div>
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

                        <div class="form-actions" style="margin-top: 1.5rem; margin-bottom: 2rem; text-align: center;">
            <button type="button" data-admin-action="saveAIConfig" class="admin-btn">💾 保存当前配置</button>
            <button type="button" data-admin-action="testAIKey" class="admin-btn ai">🧪 测试当前AI服务</button>
                        </div>

                        <!-- 使用统计 -->
                        <div class="usage-report" id="usage-report" style="margin-top: 2rem;">
                            <h4>📈 使用统计</h4>
                            <div class="report-grid">
                                <div class="report-card">
                                    <div class="report-icon">🔗</div>
                                    <div class="report-content">
                                        <div class="report-title">API请求次数</div>
                                        <div class="report-value" id="api-requests-count">0</div>
                                    </div>
                                </div>
                                <div class="report-card">
                                    <div class="report-icon">🤖</div>
                                    <div class="report-content">
                                        <div class="report-title">AI签语生成</div>
                                        <div class="report-value" id="ai-generations-count">0</div>
                                    </div>
                                </div>
                                <div class="report-card success">
                                    <div class="report-icon">✅</div>
                                    <div class="report-content">
                                        <div class="report-title">生成成功</div>
                                        <div class="report-value" id="success-count">0</div>
                                    </div>
                                </div>
                                <div class="report-card error">
                                    <div class="report-icon">❌</div>
                                    <div class="report-content">
                                        <div class="report-title">生成失败</div>
                                        <div class="report-value" id="failed-count">0</div>
                                    </div>
                                </div>
                                <div class="report-card info">
                                    <div class="report-icon">📊</div>
                                    <div class="report-content">
                                        <div class="report-title">成功率</div>
                                        <div class="report-value" id="success-rate">0%</div>
                                    </div>
                                </div>
                                <div class="report-card">
                                    <div class="report-icon">🔄</div>
                                    <div class="report-content">
                                        <div class="report-title">最后重置</div>
                                        <div class="report-value" id="last-reset">-</div>
                                    </div>
                                </div>
                            </div>

                            <!-- 折线图报表区域 -->
                            <div class="chart-section">
                                <h5>📊 历史趋势图</h5>
                                <div class="chart-container">
                                    <canvas id="usageChart" width="400" height="200"></canvas>
                                </div>
                                <div class="chart-controls">
            <select id="chartPeriod" data-admin-change="updateChart">
                                        <option value="7">最近7天</option>
                                        <option value="30">最近30天</option>
                                        <option value="90">最近90天</option>
                                    </select>
            <button type="button" data-admin-action="exportChartData" class="admin-btn small">📥 导出数据</button>
                                </div>
                            </div>

                            <div class="report-actions">
            <button type="button" data-admin-action="refreshUsageReport" class="admin-btn small">🔄 刷新数据</button>
            <button type="button" data-admin-action="resetUsageStats" class="admin-btn small danger">🗑️ 重置统计</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .ai-config-page {
            max-width: 800px;
            margin: 0 auto;
        }

        .config-card {
            background: white;
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .config-info {
            background: var(--theme-primary-gradient);
            padding: 1.5rem;
            border-radius: 16px;
            margin-bottom: 2rem;
            color: white;
            box-shadow: 0 10px 30px rgba(var(--theme-primary-rgb), 0.3);
        }

        .config-info h3 {
            margin: 0 0 0.5rem 0;
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .config-info p {
            margin: 0;
            color: rgba(255, 255, 255, 0.9);
            line-height: 1.5;
            font-size: 0.95rem;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .ai-config-section-title,
        .ai-services-config h3 {
            margin: 0 0 0.75rem 0;
            color: #1f2937;
            font-size: 1.05rem;
            font-weight: 700;
            line-height: 1.4;
        }

        .ai-config-section-note,
        .ai-service-note {
            margin: 0 0 1rem 0;
            color: #4b5563;
            font-size: 0.95rem;
            line-height: 1.65;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #333;
        }

        .form-group input[type="password"] {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }

        .form-group input[type="password"]:focus {
            outline: none;
            border-color: var(--theme-primary);
        }

        .form-group small {
            display: block;
            margin-top: 0.5rem;
            color: #666;
            font-size: 0.9rem;
            line-height: 1.4;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            font-weight: 500;
        }

        .checkbox-label input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: var(--theme-primary);
        }

        .config-status {
            background: var(--theme-primary-gradient);
            padding: 1.5rem;
            border-radius: 16px;
            margin-bottom: 2rem;
            color: white;
            box-shadow: 0 10px 30px rgba(var(--theme-primary-rgb), 0.3);
        }

        .config-status h4 {
            margin: 0 0 1rem 0;
            color: white;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
            padding: 0.5rem 0;
            color: rgba(255, 255, 255, 0.9);
            font-size: 0.95rem;
        }

        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }

        .status-success {
            background: rgba(40, 167, 69, 0.2);
            color: #28a745;
            border: 1px solid rgba(40, 167, 69, 0.3);
        }

        .status-error {
            background: rgba(220, 53, 69, 0.2);
            color: #dc3545;
            border: 1px solid rgba(220, 53, 69, 0.3);
        }

        /* 使用统计报表样式 */
        .usage-report {
            background: #ffffff;
            padding: 2rem;
            border-radius: 16px;
            margin-bottom: 2rem;
            color: #0f172a;
            border: 1px solid #dbe3ef;
            box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
        }

        .usage-report h4 {
            margin: 0 0 1.5rem 0;
            color: #0f172a;
            font-size: 1.2rem;
            font-weight: 600;
        }

        .report-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
            .report-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 480px) {
            .report-grid {
                grid-template-columns: 1fr;
            }
        }

        .report-card {
            background: #f8fafc;
            backdrop-filter: none;
            border: 1px solid #dbe3ef;
            border-radius: 12px;
            padding: 1rem;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .report-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .report-card.success {
            background: #ecfdf5;
            border-color: #a7f3d0;
        }

        .report-card.error {
            background: #fef2f2;
            border-color: #fecaca;
        }

        .report-card.info {
            background: #eff6ff;
            border-color: #bfdbfe;
        }

        .report-icon {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .report-title {
            font-size: 0.85rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #64748b;
            opacity: 1;
        }

        .report-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--theme-primary);
        }

        .report-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        .admin-btn.small {
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
            border-radius: 8px;
            background: var(--theme-primary-soft);
            color: var(--theme-primary);
            border: 1px solid var(--theme-primary-border);
            transition: all 0.3s ease;
        }

        .admin-btn.small:hover {
            background: var(--theme-primary);
            color: #ffffff;
            transform: translateY(-1px);
        }

        .admin-btn.small.danger {
            background: #fef2f2;
            color: #dc2626;
            border-color: #fecaca;
        }

        .admin-btn.small.danger:hover {
            background: #dc2626;
            color: #ffffff;
        }

        /* 折线图样式 */
        .chart-section {
            background: #f8fafc;
            border-radius: 12px;
            padding: 1.5rem;
            margin-top: 1.5rem;
            backdrop-filter: none;
            border: 1px solid #dbe3ef;
        }

        .chart-section h5 {
            margin: 0 0 1rem 0;
            color: #0f172a;
            font-size: 1rem;
            font-weight: 600;
        }

        .chart-container {
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            padding: 1rem;
            margin-bottom: 1rem;
            position: relative;
            height: 300px;
        }

        .chart-controls {
            display: flex;
            gap: 1rem;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
        }

        .chart-controls select {
            background: #ffffff;
            color: #0f172a;
            border: 1px solid #dbe3ef;
            border-radius: 8px;
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
            outline: none;
        }

        .chart-controls select option {
            background: #ffffff;
            color: #0f172a;
        }

        .form-actions {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .form-actions .admin-btn {
            flex: 1;
            min-width: 200px;
        }
    `;
    document.head.appendChild(style);

    // 替换主内容区域
    renderAdminMarkup(mainContainer, aiConfigHTML);
    mainContainer.style.display = 'block';

    // 加载当前配置状态
    loadAIConfigStatus();

    // 加载使用统计报表
    loadUsageReport();

    // 初始化折线图
    setTimeout(() => {
        initChart();
    }, 100);

    // 设置自动刷新报表（每30秒刷新一次）
    setInterval(() => {
        loadUsageReport();
        updateChart();
    }, 30000);

    // 监听统计更新事件
    window.addEventListener('aiFortuneStatsUpdated', function(event) {
        console.log('收到统计更新事件:', event.detail);
        loadUsageReport();
        updateChart();
    });

    // 绑定表单提交事件
    document.getElementById('ai-key-config-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveAIConfig();
    });
}

// 显示主页面
function showMainPage() {
    // 重新加载页面以显示主内容
    window.location.reload();
}

// 加载AI配置状态（使用安全存储）
async function loadAIConfigStatus() {
    let aiCredential;
    const aiEnabled = window.AdminStorage.getRaw('aiFortuneEnabled') === 'true';
    const autoFallback = window.AdminStorage.getRaw('aiAutoFallback') === 'true';

    // 尝试从安全存储获取API密钥
    if (window.secureGetApiKey) {
        aiCredential = await window.secureGetApiKey('deepSeek');
        // 如果安全存储没有，尝试从旧的localStorage获取
        if (!aiCredential) {
            aiCredential = getApiKeySecure('deepSeekApiKey');
            // 如果找到旧的明文API密钥，迁移到加密存储
            if (!aiCredential) {
                const plaintextKey = window.AdminStorage.getRaw('deepSeekApiKey');
                if (plaintextKey) {
                    aiCredential = plaintextKey;
                    saveApiKeySecure('deepSeekApiKey', aiCredential);
                    window.AdminStorage.removeKey('deepSeekApiKey');
                }
            }
        }
    } else {
        aiCredential = getApiKeySecure('deepSeekApiKey');
        // 如果没有加密密钥，尝试读取明文并迁移
        if (!aiCredential) {
            const plaintextKey = window.AdminStorage.getRaw('deepSeekApiKey');
            if (plaintextKey) {
                aiCredential = plaintextKey;
                saveApiKeySecure('deepSeekApiKey', aiCredential);
                window.AdminStorage.removeKey('deepSeekApiKey');
            }
        }
    }

    // 更新表单值
    const configuredAIService = window.aiServiceManager && typeof window.aiServiceManager.getAvailableService === 'function'
        ? window.aiServiceManager.getAvailableService()
        : null;
    if (!aiCredential && configuredAIService) {
        aiCredential = configuredAIService;
    }

    if (document.getElementById('enable-ai-fortune')) {
        document.getElementById('enable-ai-fortune').checked = aiEnabled;
    }
    if (document.getElementById('auto-fallback')) {
        document.getElementById('auto-fallback').checked = autoFallback;
    }

    // 更新状态显示
    const apiKeyStatus = document.getElementById('api-key-status');
    const aiFunctionStatus = document.getElementById('ai-function-status');
    const currentAIServiceStatus = document.getElementById('current-ai-service-status');

    if (currentAIServiceStatus) {
        if (configuredAIService) {
            currentAIServiceStatus.textContent = AI_SERVICE_PRESETS[configuredAIService]?.name || configuredAIService;
            currentAIServiceStatus.className = 'status-badge status-success';
        } else {
            currentAIServiceStatus.textContent = '未配置';
            currentAIServiceStatus.className = 'status-badge status-error';
        }
    }

    if (apiKeyStatus) {
        if (aiCredential) {
            apiKeyStatus.textContent = '已配置';
            apiKeyStatus.className = 'status-badge status-success';
        } else {
            apiKeyStatus.textContent = '未配置';
            apiKeyStatus.className = 'status-badge status-error';
        }
    }

    if (aiFunctionStatus) {
        if (aiEnabled) {
            aiFunctionStatus.textContent = '已启用';
            aiFunctionStatus.className = 'status-badge status-success';
        } else {
            aiFunctionStatus.textContent = '未启用';
            aiFunctionStatus.className = 'status-badge status-error';
        }
    }

    // 加载新的AI服务配置
    initAIConfigDisplay();

}

// ============================================================
// 🔄 API同步配置页面
// ============================================================
function createAPISyncConfigPage() {
    // 隐藏主内容
    const mainContainer = document.querySelector('.admin-container');
    mainContainer.style.display = 'none';

    // 页面 HTML（样式由 admin-page.css 提供）
    const html = `
        <div class="api-sync-page">
            <div class="api-sync-header">
                <button class="back-btn" data-admin-action="showMainPage">
                        <span class="material-icons">arrow_back</span>
                        返回主页
                    </button>
                <h1>🔄 API同步设置</h1>
                <p>管理任务数据与外部API服务器的自动同步</p>
            </div>

            <div class="api-sync-cards">

                <!-- 卡片一：同步设置 + 服务器状态（合并为一张卡片，减少视觉碎片） -->
                <div class="api-sync-card">
                    <div class="api-sync-card-header">
                        <h3 class="api-sync-card-title">📋 同步设置</h3>
                    </div>
                    <div class="api-sync-toggle-row">
                        <div class="api-sync-toggle-text">
                            <h4>自动同步</h4>
                            <p class="api-sync-toggle-desc">每次任务变更时自动同步到 API 服务器</p>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="admin-api-sync-switch">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="api-sync-tip">
                        🔒 启用后，仅拥有 <strong>API同步</strong> 权限的用户其任务数据才会被同步
                    </div>

                    <div class="api-sync-divider"></div>

                    <div class="api-sync-card-header">
                        <h3 class="api-sync-card-title">📡 服务器状态</h3>
                    </div>
                    <div id="admin-api-sync-status" class="api-sync-status-box info">检查中...</div>
                    <div class="api-sync-server-info">
                        <span>地址：<code>http://localhost:30301</code></span>
                        <span>数据文件：<code>tasks-data.json</code></span>
                    </div>
                </div>

                <!-- 卡片二：任务统计 + 操作按钮 -->
                <div class="api-sync-card">
                    <div class="api-sync-card-header">
                        <h3 class="api-sync-card-title">📊 任务统计</h3>
                    </div>
                    <div class="api-sync-stats">
                        <div class="api-sync-stat-item">
                            <div class="stat-num" id="admin-api-total-tasks">-</div>
                            <div class="stat-label">总数</div>
                        </div>
                        <div class="api-sync-stat-item">
                            <div class="stat-num" id="admin-api-active-tasks">-</div>
                            <div class="stat-label">未完成</div>
                        </div>
                        <div class="api-sync-stat-item">
                            <div class="stat-num" id="admin-api-q1-tasks">-</div>
                            <div class="stat-label">重要紧急</div>
                        </div>
                        <div class="api-sync-stat-item">
                            <div class="stat-num" id="admin-api-q2-tasks">-</div>
                            <div class="stat-label">重要不急</div>
                        </div>
                    </div>

                    <div class="api-sync-divider"></div>

                    <div class="api-sync-actions">
                        <button class="admin-btn" id="admin-sync-now-btn">⏎ 立即同步</button>
                        <button class="admin-btn secondary" id="admin-refresh-status-btn">⟳ 刷新状态</button>
                    </div>
                </div>

            </div>
        </div>
    `;

    // 渲染页面
    const container = document.querySelector('.admin-container');
    renderAdminMarkup(container, html);
    container.style.display = 'block';

    // 加载配置状态
    loadAPISyncAdminStatus();
}

// 加载API同步管理后台状态
async function loadAPISyncAdminStatus() {
    const isEnabled = window.DataSyncStorage.getRaw('enableAPISync') === 'true';
    const switchEl = document.getElementById('admin-api-sync-switch');
    if (switchEl) {
        switchEl.checked = isEnabled;
        switchEl.addEventListener('change', function() {
            const checked = this.checked;
            window.DataSyncStorage.setRaw('enableAPISync', checked.toString());
            if (checked) {
                showAPISyncAdminStatus('synced', '✅ 自动同步已启用，任务变更时将自动同步');
                syncToAPINowAdmin();
            } else {
                showAPISyncAdminStatus('info', 'ℹ️ 自动同步已禁用');
            }
        });
    }

    // 绑定按钮
    const syncBtn = document.getElementById('admin-sync-now-btn');
    if (syncBtn) syncBtn.addEventListener('click', syncToAPINowAdmin);

    const refreshBtn = document.getElementById('admin-refresh-status-btn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshAPISyncAdminStatus);

    // 首次刷新状态
    refreshAPISyncAdminStatus();
}

function showAPISyncAdminStatus(type, message) {
    const el = document.getElementById('admin-api-sync-status');
    if (!el) return;
    el.className = 'api-sync-status-box ' + type;
    el.textContent = message;
}

async function refreshAPISyncAdminStatus() {
    const el = document.getElementById('admin-api-sync-status');
    if (!el) return;
    showAPISyncAdminStatus('info', '⏳ 正在检查 API 服务器状态...');

    try {
        const response = await fetch('http://localhost:30301/api/health');
        if (!response.ok) throw new Error('服务器未响应');

        const statsRes = await fetch('http://localhost:30301/api/tasks/stats/summary');
        const statsData = await statsRes.json();

        if (statsData.success) {
            document.getElementById('admin-api-total-tasks').textContent = statsData.stats.total;
            document.getElementById('admin-api-active-tasks').textContent = statsData.stats.active;
            document.getElementById('admin-api-q1-tasks').textContent = statsData.stats.byQuadrant[1]?.count || 0;
            document.getElementById('admin-api-q2-tasks').textContent = statsData.stats.byQuadrant[2]?.count || 0;

            const isEnabled = window.DataSyncStorage.getRaw('enableAPISync') === 'true';
            showAPISyncAdminStatus('synced',
                isEnabled
                    ? `✅ 服务器连接正常，已同步 ${statsData.stats.total} 个任务`
                    : `ℹ️ 服务器运行中，${statsData.stats.total} 个任务（自动同步未启用）`
            );
        }
    } catch (error) {
        showAPISyncAdminStatus('error', '❌ 无法连接到 API 服务器，请先运行 `npm start` 启动服务器');
    }
}

async function syncToAPINowAdmin() {
    showAPISyncAdminStatus('info', '⏳ 正在同步...');
    try {
        const tasks = typeof window.XXSGAppRuntime?.tasks !== 'undefined'
            ? window.XXSGAppRuntime.tasks
            : (window.TaskStorage ? window.TaskStorage.getTasks() : []);

        const response = await fetch('http://localhost:30301/api/tasks/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks })
        });
        const data = await response.json();
        if (data.success) {
            showAPISyncAdminStatus('synced', `✅ 同步成功！已同步 ${data.count} 个任务到 API 服务器`);
            refreshAPISyncAdminStatus();
        } else {
            throw new Error(data.error || '同步失败');
        }
    } catch (error) {
        showAPISyncAdminStatus('error', '❌ 同步失败: ' + error.message);
    }
}

// 保存AI配置（使用安全存储）
async function saveAIConfig() {
    const activeService = getActiveAIServiceName();
    const activeInput = document.getElementById(getAIServiceInputId(activeService));
    const hasNewCredential = Boolean(activeInput && !activeInput.readOnly && activeInput.value.trim());

    if (hasNewCredential) {
        const serviceCredential = activeInput.value.trim();
        const isValid = await testAIServiceKey(activeService, serviceCredential);
        if (!isValid) {
            alert('当前服务 API Key 测试失败，请检查 Key、模型额度或网络连接。');
            return;
        }

        if (window.aiServiceManager) {
            await window.aiServiceManager.setAPIKey(activeService, serviceCredential);
            loadAIServiceConfig(activeService);
        } else {
            await saveAIServiceConfig(activeService, null, { silent: true });
        }
    }

    const configuredAIService = window.aiServiceManager && typeof window.aiServiceManager.getAvailableService === 'function'
        ? window.aiServiceManager.getAvailableService()
        : null;
    const aiEnabled = document.getElementById('enable-ai-fortune').checked;
    const autoFallback = document.getElementById('auto-fallback').checked;

    const credentialConfigured = Boolean(configuredAIService);
    console.log('AI config saved.', { credentialConfigured, aiEnabled, autoFallback });

    if (!configuredAIService && aiEnabled) {
        alert('请先在下方 AI 服务配置中保存任一服务商 API Key，再启用 AI 签语功能');
        return;
    }

    // 保存配置到安全存储
    if (false) {
        if (window.secureSaveApiKey) {
            await window.secureSaveApiKey('deepSeek', aiCredential);
            window.AdminStorage.removeKey('deepSeekApiKey'); // 删除明文密钥
            console.log('✅ AI签语API Key已安全保存');
        } else {
            saveApiKeySecure('deepSeekApiKey', aiCredential);
            console.log('✅ AI签语API Key已加密保存');
        }
    }
    window.AdminStorage.setRaw('aiFortuneEnabled', aiEnabled.toString());
    window.AdminStorage.setRaw('aiAutoFallback', autoFallback.toString());

    console.log('✅ AI配置保存完成');
    alert('AI 配置保存成功！');

    // 更新状态显示
    await loadAIConfigStatus();
}

// 创建用户管理页面
function createUserManagementPage() {
    // 隐藏主内容
    const mainContainer = document.querySelector('.admin-container');
    mainContainer.style.display = 'none';

    // 创建用户管理页面HTML
    const userManagementHTML = `
        <div class="user-management-page">
            <div class="user-management-header">
            <button class="back-btn" data-admin-action="showMainPage">
                    <span class="material-icons">arrow_back</span>
                    返回主页
                </button>
                <h1>👥 用户管理</h1>
                <p>管理系统用户，创建新用户，分配权限，查看用户统计信息</p>
            </div>

            <div class="user-management-content">
                <!-- 紧凑的统计卡片 -->
                <div class="stats-grid">
                    <div class="stat-item-compact">
                        <div class="stat-icon">👥</div>
                        <div class="stat-info">
                            <div class="stat-label">总用户数</div>
                            <div class="stat-value" id="total-users">0</div>
                        </div>
                    </div>
                    <div class="stat-item-compact">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-info">
                            <div class="stat-label">VIP用户</div>
                            <div class="stat-value" id="vip-users">0</div>
                        </div>
                    </div>
                    <div class="stat-item-compact">
                        <div class="stat-icon">👤</div>
                        <div class="stat-info">
                            <div class="stat-label">普通用户</div>
                            <div class="stat-value" id="normal-users">0</div>
                        </div>
                    </div>
                </div>

                <!-- VIP用户说明 -->
                <div class="vip-info">
                    <div class="info-icon">💡</div>
                    <div class="info-content">
                        <strong>VIP用户说明：</strong>VIP用户是拥有特殊权限的高级用户，可以在编辑用户时设置角色为"VIP用户"来升级用户等级。
                    </div>
                </div>

                <!-- 操作按钮区域 -->
                <div class="action-section">
            <button class="create-user-btn" data-admin-action="createNewUser">
                        <span class="material-icons">person_add</span>
                        创建新用户
                    </button>
                </div>

                <!-- 用户列表 -->
                <div class="user-list-section">
                    <div class="section-header">
                        <h3>用户列表</h3>
                        <div class="list-actions">
            <button class="refresh-btn" data-admin-action="loadUserList">
                                <span class="material-icons">refresh</span>
                                刷新
                            </button>
                        </div>
                    </div>
                    <div class="user-list" id="user-list">
                        <div class="empty-state">
                            <div class="empty-icon">👥</div>
                            <h3>暂无用户</h3>
                            <p>系统中还没有任何用户，点击上方按钮创建第一个用户</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .user-management-page {
            max-width: 1200px;
            margin: 0 auto;
        }

        .user-management-content {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            max-width: 800px;
            margin: 0 auto;
        }

        /* 紧凑的统计网格 */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .stat-item-compact {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
        }

        .stat-item-compact:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        }

        .stat-icon {
            font-size: 1.5rem;
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--theme-primary-gradient);
            border-radius: 10px;
            color: white;
            box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
        }

        .stat-info {
            flex: 1;
        }

        .stat-label {
            font-size: 0.85rem;
            color: #718096;
            font-weight: 500;
            margin-bottom: 0.25rem;
        }

        .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #2d3748;
            background: var(--theme-primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        /* 操作按钮区域 */
        .action-section {
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
        }

        .create-user-btn {
            background: var(--theme-primary-gradient);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 15px rgba(var(--theme-primary-rgb), 0.3);
            transition: all 0.3s ease;
        }

        .create-user-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(var(--theme-primary-rgb), 0.4);
        }

        /* 用户列表区域 */
        .user-list-section {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .section-header h3 {
            margin: 0;
            color: #2d3748;
            font-size: 1.25rem;
            font-weight: 600;
        }

        .list-actions {
            display: flex;
            gap: 0.5rem;
        }

        .refresh-btn {
            background: rgba(var(--theme-primary-rgb), 0.1);
            color: var(--theme-primary);
            border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            transition: all 0.3s ease;
        }

        .refresh-btn:hover {
            background: rgba(var(--theme-primary-rgb), 0.2);
            transform: translateY(-1px);
        }

        /* VIP用户说明样式 */
        .vip-info {
            background: rgba(255, 193, 7, 0.1);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 12px;
            padding: 1.25rem;
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
        }

        .info-icon {
            font-size: 1.25rem;
            flex-shrink: 0;
        }

        .info-content {
            flex: 1;
            font-size: 0.9rem;
            line-height: 1.4;
            color: #2d3748;
        }

        .info-content strong {
            color: #d69e2e;
        }

        .user-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .user-item {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 1.25rem;
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid rgba(var(--theme-primary-rgb), 0.1);
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .user-item:hover {
            transform: translateX(4px);
            box-shadow: 0 8px 24px rgba(var(--theme-primary-rgb), 0.15);
            border-color: rgba(var(--theme-primary-rgb), 0.3);
            background: rgba(255, 255, 255, 1);
        }

        .user-info {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            min-width: 0;
        }

        .user-avatar {
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 14px;
            background: var(--theme-primary-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 700;
            font-size: 1.3rem;
            box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
            flex-shrink: 0;
        }

        .user-details {
            flex: 1;
            min-width: 0;
        }

        .user-name {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .user-role {
            background: var(--theme-primary-gradient);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            box-shadow: 0 2px 8px rgba(var(--theme-primary-rgb), 0.25);
        }

        .user-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            color: #64748b;
            font-size: 0.85rem;
            margin-top: 0.5rem;
        }

        .user-meta-item {
            display: flex;
            align-items: center;
            gap: 0.25rem;
        }

        .user-permissions {
            background: rgba(var(--theme-primary-rgb), 0.08);
            border: 1px solid rgba(var(--theme-primary-rgb), 0.15);
            padding: 0.75rem 1rem;
            border-radius: 12px;
            margin-top: 0.75rem;
        }

        .user-permissions-title {
            font-size: 0.75rem;
            color: #64748b;
            font-weight: 600;
            margin-bottom: 0.5rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .user-permissions-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .permission-tag {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            background: white;
            color: var(--theme-primary);
            padding: 0.35rem 0.75rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 500;
            border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .user-actions-buttons {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            flex-shrink: 0;
        }

        .user-actions-buttons .admin-btn {
            padding: 0.6rem 1rem;
            font-size: 0.85rem;
            min-width: auto;
            width: auto;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 0.35rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .user-actions-buttons .admin-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .user-actions-buttons .admin-btn .material-icons {
            font-size: 16px;
        }

        .empty-state {
            text-align: center;
            padding: 3rem 2rem;
            color: #718096;
        }

        .empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.6;
        }

        .empty-state h3 {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
            color: #2d3748;
        }

        .empty-state p {
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
            line-height: 1.4;
        }

        /* 响应式设计 */
        @media (max-width: 1200px) {
            .user-management-header {
                max-width: 700px;
            }
            .user-management-content {
                max-width: 700px;
            }
        }

        @media (max-width: 1024px) {
            .user-management-header {
                max-width: 600px;
            }
            .user-management-content {
                max-width: 600px;
            }
        }

        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
                gap: 0.75rem;
                max-width: 100%;
            }

            .stat-item-compact {
                padding: 1rem;
            }

            .stat-icon {
                width: 2.5rem;
                height: 2.5rem;
                font-size: 1.5rem;
            }

            .stat-value {
                font-size: 1.25rem;
            }

            .user-item {
                grid-template-columns: auto 1fr;
                gap: 1rem;
            }

            .user-avatar {
                width: 3rem;
                height: 3rem;
                font-size: 1.1rem;
            }

            .user-actions-buttons {
                grid-column: 1 / -1;
                justify-content: flex-end;
                padding-top: 0.75rem;
                border-top: 1px solid rgba(var(--theme-primary-rgb), 0.1);
            }
        }

        @media (max-width: 480px) {
            .user-management-header {
                padding: 1.5rem;
            }

            .user-management-header h1 {
                font-size: 1.8rem;
            }

            .user-list-section {
                padding: 1rem;
            }

            .stat-item-compact {
                padding: 0.75rem;
            }

            .create-user-btn {
                padding: 0.75rem 1.5rem;
                font-size: 0.9rem;
            }
        }

        /* 模态对话框样式 */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 1rem;
        }

        .modal-content {
            background: white;
            border-radius: 24px;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
            max-width: 600px;
            width: 100%;
            max-height: calc(100vh - 2rem);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: slideInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-header {
            padding: 2rem 2rem 1.5rem;
            border-bottom: 2px solid rgba(var(--theme-primary-rgb), 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
            flex-shrink: 0;
        }

        .modal-header h3 {
            margin: 0;
            color: #1a202c;
            font-size: 1.6rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: var(--theme-primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .modal-header h3 .material-icons {
            font-size: 1.8rem;
            background: var(--theme-primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .modal-close {
            background: rgba(100, 116, 139, 0.1);
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 0.6rem;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-close:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            transform: rotate(90deg);
        }

        .modal-close .material-icons {
            font-size: 1.5rem;
        }

        .modal-body {
            padding: 2rem;
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }

        .modal-body::-webkit-scrollbar {
            width: 8px;
        }

        .modal-body::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
        }

        .modal-body::-webkit-scrollbar-thumb {
            background: rgba(var(--theme-primary-rgb), 0.3);
            border-radius: 10px;
        }

        .modal-body::-webkit-scrollbar-thumb:hover {
            background: rgba(var(--theme-primary-rgb), 0.5);
        }

        .modal-body .form-group {
            margin-bottom: 1.75rem;
        }

        .modal-body .form-group:last-child {
            margin-bottom: 0;
        }

        .modal-body .form-group label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
            font-weight: 700;
            color: #1a202c;
            font-size: 0.95rem;
        }

        .modal-body .form-group label::before {
            content: '';
            width: 4px;
            height: 1rem;
            background: var(--theme-primary-gradient);
            border-radius: 2px;
        }

        .modal-body .form-group input,
        .modal-body .form-group select {
            width: 100%;
            padding: 0.9rem 1.2rem;
            border: 2px solid rgba(var(--theme-primary-rgb), 0.15);
            border-radius: 14px;
            font-size: 1rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: rgba(248, 250, 252, 0.6);
            color: #1a202c;
            font-weight: 500;
        }

        .modal-body .form-group input::placeholder {
            color: #94a3b8;
        }

        .modal-body .form-group input:focus,
        .modal-body .form-group select:focus {
            outline: none;
            border-color: var(--theme-primary);
            background: white;
            box-shadow: 0 0 0 4px rgba(var(--theme-primary-rgb), 0.1), 0 4px 12px rgba(var(--theme-primary-rgb), 0.15);
            transform: translateY(-1px);
        }

        .modal-footer {
            padding: 1.5rem 2rem 2rem;
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            border-top: 2px solid rgba(var(--theme-primary-rgb), 0.1);
            background: rgba(248, 250, 252, 0.5);
            flex-shrink: 0;
        }

        .modal-footer .admin-btn {
            min-width: 120px;
            padding: 0.8rem 1.5rem;
            font-size: 1rem;
            font-weight: 700;
        }

        /* 权限选择样式 */
        .permissions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
            max-height: 400px;
            overflow-y: auto;
            padding: 1rem;
            background: rgba(var(--theme-primary-rgb), 0.03);
            border-radius: 14px;
            border: 2px solid rgba(var(--theme-primary-rgb), 0.1);
        }

        .permissions-grid::-webkit-scrollbar {
            width: 8px;
        }

        .permissions-grid::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
            border-radius: 10px;
        }

        .permissions-grid::-webkit-scrollbar-thumb {
            background: rgba(var(--theme-primary-rgb), 0.3);
            border-radius: 10px;
        }

        .permissions-grid::-webkit-scrollbar-thumb:hover {
            background: rgba(var(--theme-primary-rgb), 0.5);
        }

        .permission-item {
            border: 2px solid rgba(var(--theme-primary-rgb), 0.15);
            border-radius: 14px;
            padding: 1rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            background: white;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .permission-item:hover {
            border-color: var(--theme-primary);
            background: rgba(var(--theme-primary-rgb), 0.05);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(var(--theme-primary-rgb), 0.15);
        }

        .permission-item:has(input:checked) {
            border-color: var(--theme-primary);
            background: linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.2);
        }

        .permission-label {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            cursor: pointer;
            margin: 0;
        }

        .permission-label input[type="checkbox"] {
            width: 22px;
            height: 22px;
            accent-color: var(--theme-primary);
            margin: 0;
            margin-top: 0.15rem;
            cursor: pointer;
            flex-shrink: 0;
        }

        .permission-icon {
            font-size: 1.5rem;
            width: 2rem;
            text-align: center;
            flex-shrink: 0;
        }

        .permission-info {
            flex: 1;
            min-width: 0;
        }

        .permission-name {
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 0.35rem;
            font-size: 0.95rem;
            line-height: 1.3;
        }

        .permission-desc {
            font-size: 0.8rem;
            color: #64748b;
            line-height: 1.4;
        }

        /* 表单分组样式 */
        .form-section {
            background: rgba(var(--theme-primary-rgb), 0.03);
            border: 2px solid rgba(var(--theme-primary-rgb), 0.1);
            border-radius: 14px;
            padding: 1.5rem;
            margin-bottom: 1.75rem;
        }

        .form-section-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--theme-primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .form-section-title::before {
            content: '';
            width: 4px;
            height: 1.5rem;
            background: var(--theme-primary-gradient);
            border-radius: 2px;
        }

        .user-permissions {
            margin-top: 0.5rem;
            font-size: 0.9rem;
            color: #4a5568;
            background: rgba(var(--theme-primary-rgb), 0.1);
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            border-left: 3px solid var(--theme-primary);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* 响应式优化 */
        @media (max-width: 768px) {
            .modal-content {
                max-width: 100%;
                border-radius: 20px 20px 0 0;
                margin-top: auto;
            }

            .modal-header {
                padding: 1.5rem;
            }

            .modal-header h3 {
                font-size: 1.4rem;
            }

            .modal-body {
                padding: 1.5rem;
            }

            .modal-footer {
                padding: 1rem 1.5rem 1.5rem;
                flex-wrap: wrap;
            }

            .modal-footer .admin-btn {
                flex: 1;
                min-width: calc(50% - 0.5rem);
            }

            .permissions-grid {
                grid-template-columns: 1fr;
                max-height: 300px;
            }

            .form-section {
                padding: 1rem;
            }
        }

        @media (max-width: 480px) {
            .modal-header h3 {
                font-size: 1.2rem;
            }

            .modal-body .form-group label {
                font-size: 0.9rem;
            }

            .permission-name {
                font-size: 0.85rem;
            }

            .permission-desc {
                font-size: 0.75rem;
            }
        }
    `;
    document.head.appendChild(style);

    // 替换主内容区域
    renderAdminMarkup(mainContainer, userManagementHTML);
    mainContainer.style.display = 'block';

    // 加载用户列表
    loadUserList();
}

// 创建密码管理页面
function createPasswordManagementPage() {
    // 隐藏主内容
    const mainContainer = document.querySelector('.admin-container');
    mainContainer.style.display = 'none';

    // 创建密码管理页面HTML
    const passwordManagementHTML = `
        <div class="password-management-page">
            <div class="password-management-header">
            <button class="back-btn" data-admin-action="showMainPage">
                    <span class="material-icons">arrow_back</span>
                    返回主页
                </button>
                <h1>🔐 密码管理</h1>
                <p>修改管理员密码，设置安全策略，确保系统安全性</p>
            </div>

            <div class="password-management-content">
                <div class="password-card">
                    <h3>
                        <span class="material-icons">lock</span>
                        修改管理员密码
                    </h3>
                    <form id="change-password-form">
                        <div class="form-group">
                            <label for="current-password">当前密码</label>
                            <input type="password" id="current-password" placeholder="请输入当前密码" required>
                        </div>
                        <div class="form-group">
                            <label for="new-password">新密码</label>
                            <input type="password" id="new-password" placeholder="请输入新密码（至少8位）" required>
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">确认新密码</label>
                            <input type="password" id="confirm-password" placeholder="请再次输入新密码" required>
                        </div>
                        <button type="submit" class="admin-btn warning">
                            <span class="material-icons">save</span>
                            修改密码
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // 替换主内容区域
    renderAdminMarkup(mainContainer, passwordManagementHTML);
    mainContainer.style.display = 'block';

    // 绑定表单提交事件
    document.getElementById('change-password-form').addEventListener('submit', function(e) {
        e.preventDefault();
        changePassword();
    });
}

// 创建系统统计页面
function createSystemStatsPage() {
    // 隐藏主内容
    const mainContainer = document.querySelector('.admin-container');
    mainContainer.style.display = 'none';

    // 创建系统统计页面HTML
    const systemStatsHTML = `
        <div class="system-stats-page">
            <div class="system-stats-header">
                <div class="header-top">
        <button class="logout-btn" data-admin-action="logout">
                        <span class="material-icons">logout</span>
                        退出登录
                    </button>
                </div>
        <button class="back-btn" data-admin-action="showMainPage">
                    <span class="material-icons">arrow_back</span>
                    返回主页
                </button>
                <h1>📊 系统统计</h1>
                <p>查看系统使用情况，用户活跃度，功能使用统计等数据。为决策提供数据支持。</p>
            </div>

            <div class="system-stats-content">
                <!-- 统计概览卡片 -->
                <div class="stats-overview">
                    <div class="overview-card">
                        <div class="overview-icon">👥</div>
                        <div class="overview-content">
                            <h3>用户统计</h3>
                            <div class="overview-stats">
                                <div class="stat-item">
                                    <span class="stat-label">总用户数</span>
                                    <span class="stat-value" id="total-users">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">活跃用户</span>
                                    <span class="stat-value" id="active-users">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">新注册</span>
                                    <span class="stat-value" id="new-users">0</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="overview-card">
                        <div class="overview-icon">🎯</div>
                        <div class="overview-content">
                            <h3>功能使用</h3>
                            <div class="overview-stats">
                                <div class="stat-item">
                                    <span class="stat-label">AI签语</span>
                                    <span class="stat-value" id="ai-fortune-count">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">传统签语</span>
                                    <span class="stat-value" id="traditional-fortune-count">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">成功率</span>
                                    <span class="stat-value" id="success-rate">0%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="overview-card">
                        <div class="overview-icon">⚡</div>
                        <div class="overview-content">
                            <h3>系统性能</h3>
                            <div class="overview-stats">
                                <div class="stat-item">
                                    <span class="stat-label">API调用</span>
                                    <span class="stat-value" id="api-calls">0</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">响应时间</span>
                                    <span class="stat-value" id="response-time">0ms</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">错误率</span>
                                    <span class="stat-value" id="error-rate">0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 数据筛选区域 -->
                <div class="data-filters">
                    <div class="filter-card">
                        <h3>🔍 数据筛选</h3>
                        <div class="filter-controls">
                            <div class="filter-group">
                                <label>时间范围：</label>
                <select id="timeRange" data-admin-change="applyTimeFilter">
                                    <option value="7">最近7天</option>
                                    <option value="30" selected>最近30天</option>
                                    <option value="90">最近90天</option>
                                    <option value="365">最近1年</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>用户类型：</label>
                <select id="userType" data-admin-change="applyUserFilter">
                                    <option value="all">全部用户</option>
                                    <option value="vip">VIP用户</option>
                                    <option value="normal">普通用户</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label>功能类型：</label>
                <select id="featureType" data-admin-change="applyFeatureFilter">
                                    <option value="all">全部功能</option>
                                    <option value="ai">AI签语</option>
                                    <option value="traditional">传统签语</option>
                                </select>
                            </div>
                <button class="admin-btn primary" data-admin-action="applyAllFilters">
                                <span class="material-icons">filter_list</span>
                                应用筛选
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 图表展示区域 -->
                <div class="charts-section">
                    <div class="chart-card">
                        <h3>📈 用户活跃度趋势</h3>
                        <div class="chart-container">
                            <canvas id="userActivityChart"></canvas>
                        </div>
                    </div>

                    <div class="chart-card">
                        <h3>📊 功能使用对比</h3>
                        <div class="chart-container">
                            <canvas id="featureUsageChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- 详细数据表格 -->
                <div class="data-tables">
                    <div class="table-card">
                        <h3>👥 用户统计详情</h3>
                        <div class="table-container">
                            <table id="userStatsTable">
                                <thead>
                                    <tr>
                                        <th>用户类型</th>
                                        <th>数量</th>
                                        <th>占比</th>
                                        <th>活跃度</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>VIP用户</td>
                                        <td id="vip-count">0</td>
                                        <td id="vip-percentage">0%</td>
                                        <td id="vip-activity">高</td>
                                    </tr>
                                    <tr>
                                        <td>普通用户</td>
                                        <td id="normal-count">0</td>
                                        <td id="normal-percentage">0%</td>
                                        <td id="normal-activity">中</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="table-card">
                        <h3>🔧 系统日志</h3>
                        <div class="table-container">
                            <table id="systemLogTable">
                                <thead>
                                    <tr>
                                        <th>时间</th>
                                        <th>事件</th>
                                        <th>状态</th>
                                        <th>详情</th>
                                    </tr>
                                </thead>
                                <tbody id="systemLogBody">
                                    <!-- 动态生成日志内容 -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 高级分析区域 -->
                <div class="advanced-analytics">
                    <div class="analytics-card">
                        <h3>📈 趋势分析</h3>
                        <div class="trend-analysis">
                            <div class="trend-item">
                                <span class="trend-label">用户增长趋势</span>
                                <span class="trend-value" id="user-growth-trend">+12%</span>
                                <span class="trend-indicator positive">↗</span>
                            </div>
                            <div class="trend-item">
                                <span class="trend-label">功能使用趋势</span>
                                <span class="trend-value" id="feature-usage-trend">+8%</span>
                                <span class="trend-indicator positive">↗</span>
                            </div>
                            <div class="trend-item">
                                <span class="trend-label">系统性能趋势</span>
                                <span class="trend-value" id="performance-trend">-5%</span>
                                <span class="trend-indicator negative">↘</span>
                            </div>
                        </div>
                    </div>

                    <div class="analytics-card">
                        <h3>🎯 预测分析</h3>
                        <div class="prediction-analysis">
                            <div class="prediction-item">
                                <span class="prediction-label">预计下周用户数</span>
                                <span class="prediction-value" id="predicted-users">156</span>
                            </div>
                            <div class="prediction-item">
                                <span class="prediction-label">预计API调用量</span>
                                <span class="prediction-value" id="predicted-api-calls">2,340</span>
                            </div>
                            <div class="prediction-item">
                                <span class="prediction-label">预计响应时间</span>
                                <span class="prediction-value" id="predicted-response-time">245ms</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 用户体验优化区域 -->
                <div class="ux-enhancements">
                    <div class="loading-indicator" id="loadingIndicator" style="display: none;">
                        <div class="loading-spinner"></div>
                        <span>正在加载数据...</span>
                    </div>

                    <div class="notification-area" id="notificationArea"></div>

                    <div class="quick-actions">
                        <h3>⚡ 快速操作</h3>
                        <div class="quick-action-buttons">
            <button class="quick-btn" data-admin-action="quickRefresh" title="快速刷新">
                                <span class="material-icons">refresh</span>
                                快速刷新
                            </button>
            <button class="quick-btn" data-admin-action="toggleAutoRefresh" title="自动刷新">
                                <span class="material-icons">autorenew</span>
                                <span id="autoRefreshText">开启自动刷新</span>
                            </button>
            <button class="quick-btn" data-admin-action="toggleDarkMode" title="深色模式">
                                <span class="material-icons">dark_mode</span>
                                <span id="darkModeText">深色模式</span>
                            </button>
            <button class="quick-btn" data-admin-action="showHelp" title="帮助">
                                <span class="material-icons">help</span>
                                帮助
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 操作按钮区域 -->
                <div class="stats-actions">
                <button class="admin-btn primary" data-admin-action="refreshSystemStats">
                        <span class="material-icons">refresh</span>
                        刷新数据
                    </button>
                <button class="admin-btn secondary" data-admin-action="exportSystemStats">
                        <span class="material-icons">download</span>
                        导出报告
                    </button>
                <button class="admin-btn info" data-admin-action="exportAdvancedReport">
                        <span class="material-icons">analytics</span>
                        高级报告
                    </button>
                <button class="admin-btn warning" data-admin-action="resetSystemStats">
                        <span class="material-icons">restart_alt</span>
                        重置统计
                    </button>
                </div>
            </div>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .header-top {
            position: absolute;
            top: 1rem;
            left: 1rem;
            z-index: 100;
        }

        .system-stats-header .logout-btn {
            background: rgba(220, 53, 69, 0.1);
            color: #dc3545;
            border: 1px solid rgba(220, 53, 69, 0.2);
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.3rem;
            position: static !important;
            top: auto !important;
            right: auto !important;
            z-index: auto !important;
        }

        .system-stats-header .logout-btn:hover {
            background: #dc3545;
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
        }

        /* .back-btn 使用 admin-page.css 的统一样式 */

        .system-stats-content {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }

        /* 统计概览卡片 — 一行三个紧凑卡片 */
        .stats-overview {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
        }

        .overview-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 12px;
            padding: 0.9rem 1rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .overview-icon {
            font-size: 1.6rem;
            width: 2.6rem;
            height: 2.6rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--theme-primary-gradient);
            border-radius: 10px;
            color: white;
            flex-shrink: 0;
        }

        .overview-content { flex: 1; min-width: 0; }
        .overview-content h3 {
            margin: 0 0 0.3rem 0;
            color: #2d3748;
            font-size: 0.88rem;
            font-weight: 600;
        }

        .overview-stats { display: flex; flex-direction: column; gap: 0.15rem; }
        .overview-stats .stat-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.1rem 0;
        }
        .overview-stats .stat-label {
            color: #718096;
            font-size: 0.75rem;
        }
        .overview-stats .stat-value {
            color: #2d3748;
            font-weight: 600;
            font-size: 0.82rem;
        }

        /* 图表区域 */
        .charts-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
            gap: 1rem;
        }

        .chart-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 14px;
            padding: 1.25rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .chart-card h3 {
            margin: 0 0 0.75rem 0;
            color: #2d3748;
            font-size: 1rem;
            font-weight: 600;
        }

        .chart-container {
            position: relative;
            height: 260px;
        }

        /* 数据表格 */
        .data-tables {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .table-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 14px;
            padding: 1.25rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .table-card h3 {
            margin: 0 0 0.75rem 0;
            color: #2d3748;
            font-size: 1rem;
            font-weight: 600;
        }

        .table-container {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }

        th, td {
            padding: 0.6rem 0.75rem;
            text-align: left;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        th {
            background: rgba(var(--theme-primary-rgb), 0.1);
            color: #2d3748;
            font-weight: 600;
        }

        td {
            color: #4a5568;
        }

        /* 操作按钮 — 与卡片宽度对齐 */
        .stats-actions {
            display: flex;
            gap: 0.75rem;
            justify-content: center;
            flex-wrap: wrap;
        }

        .stats-actions .admin-btn {
            min-width: 0;
            flex: 1;
            max-width: 180px;
        }

        /* 状态样式 */
        .status-success {
            color: #28a745;
            font-weight: 600;
        }

        .status-error {
            color: #dc3545;
            font-weight: 600;
        }

        /* 高级分析区域 */
        .advanced-analytics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .analytics-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .analytics-card h3 {
            margin: 0 0 1rem 0;
            color: #2d3748;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .trend-analysis, .prediction-analysis {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .trend-item, .prediction-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .trend-item:last-child, .prediction-item:last-child {
            border-bottom: none;
        }

        .trend-label, .prediction-label {
            color: #718096;
            font-size: 0.9rem;
        }

        .trend-value, .prediction-value {
            color: #2d3748;
            font-weight: 600;
            font-size: 1rem;
        }

        .trend-indicator {
            font-size: 1.2rem;
            font-weight: bold;
        }

        .trend-indicator.positive {
            color: #28a745;
        }

        .trend-indicator.negative {
            color: #dc3545;
        }

        /* 数据筛选区域 */
        .data-filters {
            margin-bottom: 2rem;
        }

        .filter-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .filter-card h3 {
            margin: 0 0 1rem 0;
            color: #2d3748;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .filter-controls {
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
        }

        .filter-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .filter-group label {
            color: #2d3748;
            font-weight: 500;
            font-size: 0.9rem;
        }

        .filter-group select {
            padding: 0.5rem 0.75rem;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            background: white;
            color: #2d3748;
            font-size: 0.9rem;
            min-width: 120px;
        }

        .filter-group select:focus {
            outline: none;
            border-color: var(--theme-primary);
            box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb), 0.1);
        }

        /* AI服务配置样式 */
        .ai-services-config {
            margin-top: 2rem;
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .ai-services-config h3 {
            margin: 0 0 1.5rem 0;
            color: #2d3748;
            font-size: 1.2rem;
            font-weight: 600;
        }

        .service-tabs {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
        }

        .service-tab {
            background: rgba(var(--theme-primary-rgb), 0.1);
            color: var(--theme-primary);
            border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .service-tab:hover {
            background: rgba(var(--theme-primary-rgb), 0.2);
        }

        .service-tab.active {
            background: var(--theme-primary);
            color: white;
            border-color: var(--theme-primary);
        }

        .service-config {
            display: none;
        }

        .service-config.active {
            display: block;
        }

        .service-config .form-group {
            margin-bottom: 1rem;
        }

        .service-config .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #2d3748;
            font-weight: 600;
            font-size: 0.95rem;
        }

        .service-config .form-group input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 0.95rem;
            background: #f8fafc;
            transition: all 0.3s ease;
        }

        .service-config .form-group input:focus {
            outline: none;
            border-color: var(--theme-primary);
            box-shadow: 0 0 0 3px rgba(var(--theme-primary-rgb), 0.1);
            background: white;
        }

        .service-config .form-group small {
            display: block;
            margin-top: 0.5rem;
            color: #718096;
            font-size: 0.85rem;
        }

        .service-config .form-group small a {
            color: var(--theme-primary);
            text-decoration: none;
        }

        .service-config .form-group small a:hover {
            text-decoration: underline;
        }


        /* 用户体验优化样式 */
        .ux-enhancements {
            margin-bottom: 2rem;
        }

        .loading-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            padding: 1rem;
            background: rgba(var(--theme-primary-rgb), 0.1);
            border-radius: 8px;
            color: var(--theme-primary);
            font-weight: 500;
        }

        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(var(--theme-primary-rgb), 0.3);
            border-top: 2px solid var(--theme-primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .notification-area {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
        }

        .notification {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border-left: 4px solid var(--theme-primary);
            animation: slideIn 0.3s ease-out;
        }

        .notification.success {
            border-left-color: #28a745;
        }

        .notification.error {
            border-left-color: #dc3545;
        }

        .notification.warning {
            border-left-color: #ffc107;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .quick-actions {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            margin-bottom: 1rem;
        }

        .quick-actions h3 {
            margin: 0 0 1rem 0;
            color: #2d3748;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .quick-action-buttons {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
        }

        .quick-btn {
            background: rgba(var(--theme-primary-rgb), 0.1);
            color: var(--theme-primary);
            border: 1px solid rgba(var(--theme-primary-rgb), 0.2);
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }

        .quick-btn:hover {
            background: var(--theme-primary);
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(var(--theme-primary-rgb), 0.3);
        }

        .quick-btn.active {
            background: var(--theme-primary);
            color: white;
        }

        /* 深色模式样式 */
        .dark-mode {
            background: #1a1a1a;
            color: #e2e8f0;
        }

        .dark-mode .system-stats-header,
        .dark-mode .overview-card,
        .dark-mode .chart-card,
        .dark-mode .table-card,
        .dark-mode .analytics-card,
        .dark-mode .filter-card,
        .dark-mode .quick-actions {
            background: rgba(45, 55, 72, 0.95);
            border-color: rgba(255, 255, 255, 0.1);
        }

        .dark-mode h1,
        .dark-mode h3,
        .dark-mode .stat-value,
        .dark-mode .trend-value,
        .dark-mode .prediction-value {
            color: #e2e8f0;
        }

        .dark-mode .stat-label,
        .dark-mode .trend-label,
        .dark-mode .prediction-label {
            color: #a0aec0;
        }

        .dark-mode .filter-group select {
            background: #2d3748;
            color: #e2e8f0;
            border-color: rgba(255, 255, 255, 0.2);
        }

        /* 无障碍访问样式 */
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }

        .focus-visible {
            outline: 2px solid var(--theme-primary);
            outline-offset: 2px;
        }

        /* 高对比度模式 */
        @media (prefers-contrast: high) {
            .overview-card,
            .chart-card,
            .table-card,
            .analytics-card,
            .filter-card,
            .quick-actions {
                border: 2px solid #000;
            }

            .admin-btn {
                border: 2px solid #000;
            }
        }

        /* 减少动画模式 */
        @media (prefers-reduced-motion: reduce) {
            .loading-spinner {
                animation: none;
            }

            .notification {
                animation: none;
            }

            .quick-btn {
                transition: none;
            }
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .stats-overview {
                grid-template-columns: 1fr;
            }

            .charts-section {
                grid-template-columns: 1fr;
            }

            .data-tables {
                grid-template-columns: 1fr;
            }

            .stats-actions {
                flex-direction: column;
                align-items: center;
            }
        }
    `;
    document.head.appendChild(style);

    // 替换主内容区域
    renderAdminMarkup(mainContainer, systemStatsHTML);
    mainContainer.style.display = 'block';

    // 初始化统计数据
    initSystemStats();

    // 初始化图表
    setTimeout(() => {
        initSystemCharts();
    }, 100);

    // 初始化高级分析功能
    setTimeout(() => {
        initAdvancedAnalytics();
    }, 200);

    // 初始化用户体验优化功能
    setTimeout(() => {
        initUXEnhancements();
        initResponsiveDesign();
        initPerformanceMonitoring();
        validateData();
    }, 300);
}

// 初始化系统统计数据
function initSystemStats() {
    console.log('初始化系统统计数据');

    // 初始化系统统计数据存储
    initSystemStatsStorage();

    // 加载用户数据
    const users = window.UserStorage.getUsers();
    const totalUsers = users.length;
    const vipUsers = users.filter(user => user.role === 'vip').length;
    const normalUsers = totalUsers - vipUsers;

    // 计算活跃用户（基于最近7天的活动）
    const activeUsers = calculateActiveUsers();
    const newUsers = calculateNewUsers();

    // 更新用户统计
    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('active-users').textContent = activeUsers;
    document.getElementById('new-users').textContent = newUsers;

    // 更新用户详情表格
    document.getElementById('vip-count').textContent = vipUsers;
    document.getElementById('normal-count').textContent = normalUsers;
    document.getElementById('vip-percentage').textContent = totalUsers > 0 ? Math.round((vipUsers / totalUsers) * 100) + '%' : '0%';
    document.getElementById('normal-percentage').textContent = totalUsers > 0 ? Math.round((normalUsers / totalUsers) * 100) + '%' : '0%';

    // 动态计算并更新活跃度
    document.getElementById('vip-activity').textContent = calculateUserActivityLevel('vip');
    document.getElementById('normal-activity').textContent = calculateUserActivityLevel('normal');

    // 加载AI签语统计数据
    const aiStats = window.AdminStorage.getObject('aiFortuneStats');
    const aiFortuneCount = aiStats.totalAiGenerations || 0;
    const apiCalls = aiStats.totalApiRequests || 0;
    const successRate = aiStats.totalAiGenerations > 0 ?
        Math.round((aiStats.successfulGenerations / aiStats.totalAiGenerations) * 100) : 0;

    // 获取传统签语使用数据
    const traditionalFortuneCount = getTraditionalFortuneCount();

    // 更新功能使用统计
    document.getElementById('ai-fortune-count').textContent = aiFortuneCount;
    document.getElementById('traditional-fortune-count').textContent = traditionalFortuneCount;
    document.getElementById('success-rate').textContent = successRate + '%';

    // 获取系统性能数据
    const systemPerformance = getSystemPerformance();

    // 更新系统性能统计
    document.getElementById('api-calls').textContent = apiCalls;
    document.getElementById('response-time').textContent = systemPerformance.avgResponseTime + 'ms';
    document.getElementById('error-rate').textContent = systemPerformance.errorRate + '%';

    // 生成系统日志
    generateSystemLogs();

    // 记录页面访问
    recordPageAccess('system-stats');
}

// 初始化系统图表
function initSystemCharts() {
    console.log('初始化系统图表');

    // 销毁现有图表
    destroyExistingCharts();

    // 用户活跃度趋势图
    initUserActivityChart();

    // 功能使用对比图
    initFeatureUsageChart();

    // 系统性能监控图
    initSystemPerformanceChart();

    // 用户类型分布图
    initUserTypeChart();
}

// 销毁现有图表
function destroyExistingCharts() {
    if (window.systemCharts) {
        Object.values(window.systemCharts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                try {
                    chart.destroy();
                } catch (error) {
                    console.warn('销毁图表时出错:', error);
                }
            }
        });
        window.systemCharts = {};
    }
}

// 用户活跃度趋势图
function initUserActivityChart() {
    const userActivityCtx = document.getElementById('userActivityChart');
    if (!userActivityCtx) return;

    // 获取最近7天的数据
    const userActivityData = getUserActivityData();

    // 初始化图表实例存储
    if (!window.systemCharts) {
        window.systemCharts = {};
    }

    window.systemCharts.userActivityChart = new Chart(userActivityCtx, {
        type: 'line',
        data: {
            labels: userActivityData.labels,
            datasets: [{
                label: '活跃用户',
                data: userActivityData.data,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

// 功能使用对比图
function initFeatureUsageChart() {
    const featureUsageCtx = document.getElementById('featureUsageChart');
    if (!featureUsageCtx) return;

    // 获取功能使用数据
    const featureData = getFeatureUsageData();

    window.systemCharts.featureUsageChart = new Chart(featureUsageCtx, {
        type: 'doughnut',
        data: {
            labels: ['AI签语', '传统签语'],
            datasets: [{
                data: featureData,
                backgroundColor: ['#4f46e5', '#6366f1'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.parsed / total) * 100);
                            return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// 系统性能监控图
function initSystemPerformanceChart() {
    // 添加系统性能图表到页面
    const chartsSection = document.querySelector('.charts-section');
    if (chartsSection && !document.getElementById('systemPerformanceChart')) {
        const performanceChartHTML = `
            <div class="chart-card">
                <h3>⚡ 系统性能监控</h3>
                <div class="chart-container">
                    <canvas id="systemPerformanceChart"></canvas>
                </div>
            </div>
        `;
        appendAdminMarkup(chartsSection, performanceChartHTML);
    }

    const performanceCtx = document.getElementById('systemPerformanceChart');
    if (!performanceCtx) return;

    // 获取系统性能数据
    const performanceData = getSystemPerformanceData();

    window.systemCharts.systemPerformanceChart = new Chart(performanceCtx, {
        type: 'bar',
        data: {
            labels: ['API调用', '响应时间(ms)', '错误率(%)', '成功率(%)'],
            datasets: [{
                label: '性能指标',
                data: performanceData,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(220, 53, 69, 0.8)',
                    'rgba(40, 167, 69, 0.8)'
                ],
                borderColor: [
                    '#4f46e5',
                    '#6366f1',
                    '#dc3545',
                    '#28a745'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// 用户类型分布图
function initUserTypeChart() {
    // 添加用户类型分布图表到页面
    const chartsSection = document.querySelector('.charts-section');
    if (chartsSection && !document.getElementById('userTypeChart')) {
        const userTypeChartHTML = `
            <div class="chart-card">
                <h3>👥 用户类型分布</h3>
                <div class="chart-container">
                    <canvas id="userTypeChart"></canvas>
                </div>
            </div>
        `;
        appendAdminMarkup(chartsSection, userTypeChartHTML);
    }

    const userTypeCtx = document.getElementById('userTypeChart');
    if (!userTypeCtx) return;

    // 获取用户类型数据
    const userTypeData = getUserTypeData();

    window.systemCharts.userTypeChart = new Chart(userTypeCtx, {
        type: 'pie',
        data: {
            labels: ['VIP用户', '普通用户'],
            datasets: [{
                data: userTypeData,
                backgroundColor: ['#ffc107', '#6c757d'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                }
            }
        }
    });
}

// 获取用户活动数据
function getUserActivityData() {
    const userActivity = window.AdminStorage.getObject('userActivity');
    const labels = [];
    const data = [];

    // 获取最近7天的数据
    for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('zh-CN', { weekday: 'short' });

        labels.push(dayName);
        data.push(userActivity.dailyActiveUsers?.[dateStr] || 0);
    }

    return { labels, data };
}

// 获取功能使用数据
function getFeatureUsageData() {
    const aiStats = window.AdminStorage.getObject('aiFortuneStats');
    const systemStats = window.AdminStorage.getObject('systemStats');

    const aiCount = aiStats.totalAiGenerations || 0;
    const traditionalCount = systemStats.traditionalFortuneCount || 0;

    return [aiCount, traditionalCount];
}

// 获取系统性能数据
function getSystemPerformanceData() {
    const systemStats = window.AdminStorage.getObject('systemStats');
    const aiStats = window.AdminStorage.getObject('aiFortuneStats');

    const totalGenerations = aiStats.totalAiGenerations || 0;
    const successfulGenerations = aiStats.successfulGenerations || 0;
    const successRate = totalGenerations > 0 ? Math.round((successfulGenerations / totalGenerations) * 100) : 0;
    const errorRate = 100 - successRate;

    return [
        systemStats.totalApiCalls || 0,
        systemStats.avgResponseTime || 0,
        errorRate,
        successRate
    ];
}

// 获取用户类型数据
function getUserTypeData() {
    const users = window.UserStorage.getUsers();
    const vipUsers = users.filter(user => user.role === 'vip').length;
    const normalUsers = users.length - vipUsers;

    return [vipUsers, normalUsers];
}

// 生成系统日志
function generateSystemLogs() {
    const logBody = document.getElementById('systemLogBody');
    if (!logBody) return;

    // 从localStorage获取真实日志数据
    const systemLogs = { logs: window.AdminStorage.getLogs('systemLogs') };
    const logs = systemLogs.logs || [];

    // 如果没有日志，生成一些示例日志
    if (logs.length === 0) {
        const sampleLogs = [
            { time: new Date().toISOString(), event: '系统启动', status: '成功', detail: '系统正常启动' },
            { time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), event: '页面访问', status: '成功', detail: '访问系统统计页面' },
            { time: new Date(Date.now() - 10 * 60 * 1000).toISOString(), event: '数据刷新', status: '成功', detail: '统计数据已更新' }
        ];

        logBody.replaceChildren(...sampleLogs.map(createSystemLogRow));
    } else {
        // 显示最新的10条日志
        const recentLogs = logs.slice(0, 10);
        logBody.replaceChildren(...recentLogs.map(createSystemLogRow));
    }
}

function createSystemLogRow(log) {
    const row = document.createElement('tr');
    const time = document.createElement('td');
    time.textContent = new Date(log.time).toLocaleString('zh-CN');
    const event = document.createElement('td');
    event.textContent = log.event || '';
    const statusCell = document.createElement('td');
    const status = document.createElement('span');
    status.className = `status-${log.status === '成功' ? 'success' : 'error'}`;
    status.textContent = log.status || '';
    statusCell.appendChild(status);
    const detail = document.createElement('td');
    detail.textContent = log.detail || '';
    row.append(time, event, statusCell, detail);
    return row;
}

function renderAdminMarkup(container, markup) {
    if (!container) return;
    container.replaceChildren(...createSanitizedAdminNodes(markup));
}

function appendAdminMarkup(container, markup) {
    if (!container) return;
    container.append(...createSanitizedAdminNodes(markup));
}

function createSanitizedAdminNodes(markup) {
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
    return [...root.childNodes].map(node => document.importNode(node, true));
}

// 刷新系统统计
function refreshSystemStats() {
    console.log('刷新系统统计数据');
    initSystemStats();
    initSystemCharts();
    alert('数据已刷新');
}

// 导出系统统计
function exportSystemStats() {
    console.log('导出系统统计报告');

    // 收集所有统计数据
    const exportData = {
        exportTime: new Date().toISOString(),
        userStats: {
            totalUsers: document.getElementById('total-users').textContent,
            activeUsers: document.getElementById('active-users').textContent,
            newUsers: document.getElementById('new-users').textContent,
            vipUsers: document.getElementById('vip-count').textContent,
            normalUsers: document.getElementById('normal-count').textContent
        },
        featureStats: {
            aiFortuneCount: document.getElementById('ai-fortune-count').textContent,
            traditionalFortuneCount: document.getElementById('traditional-fortune-count').textContent,
            successRate: document.getElementById('success-rate').textContent
        },
        systemStats: {
            apiCalls: document.getElementById('api-calls').textContent,
            responseTime: document.getElementById('response-time').textContent,
            errorRate: document.getElementById('error-rate').textContent
        },
        charts: {
            userActivity: getUserActivityData(),
            featureUsage: getFeatureUsageData(),
            systemPerformance: getSystemPerformanceData(),
            userType: getUserTypeData()
        }
    };

    // 生成CSV格式的报告
    const csvContent = generateCSVReport(exportData);

    // 下载文件
    downloadFile(csvContent, 'system-stats-report.csv', 'text/csv');

    alert('统计报告已导出！');
}

// 生成CSV报告
function generateCSVReport(data) {
    let csv = '系统统计报告\n';
    csv += `导出时间,${data.exportTime}\n\n`;

    csv += '用户统计\n';
    csv += '指标,数值\n';
    csv += `总用户数,${data.userStats.totalUsers}\n`;
    csv += `活跃用户,${data.userStats.activeUsers}\n`;
    csv += `新注册用户,${data.userStats.newUsers}\n`;
    csv += `VIP用户,${data.userStats.vipUsers}\n`;
    csv += `普通用户,${data.userStats.normalUsers}\n\n`;

    csv += '功能使用统计\n';
    csv += '指标,数值\n';
    csv += `AI签语次数,${data.featureStats.aiFortuneCount}\n`;
    csv += `传统签语次数,${data.featureStats.traditionalFortuneCount}\n`;
    csv += `成功率,${data.featureStats.successRate}\n\n`;

    csv += '系统性能统计\n';
    csv += '指标,数值\n';
    csv += `API调用次数,${data.systemStats.apiCalls}\n`;
    csv += `平均响应时间,${data.systemStats.responseTime}\n`;
    csv += `错误率,${data.systemStats.errorRate}\n\n`;

    csv += '用户活跃度趋势\n';
    csv += '日期,活跃用户数\n';
    data.charts.userActivity.labels.forEach((label, index) => {
        csv += `${label},${data.charts.userActivity.data[index]}\n`;
    });

    return csv;
}

// 下载文件
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 实时数据更新
function startRealTimeUpdates() {
    // 每30秒更新一次数据
    setInterval(() => {
        if (document.querySelector('.system-stats-page')) {
            console.log('实时更新系统统计数据');
            initSystemStats();
            initSystemCharts();
        }
    }, 30000);
}

// 启动实时更新
startRealTimeUpdates();

// ==================== 第三阶段：高级功能开发 ====================

// 初始化高级分析
function initAdvancedAnalytics() {
    console.log('初始化高级分析功能');

    // 计算趋势分析
    calculateTrendAnalysis();

    // 计算预测分析
    calculatePredictionAnalysis();

    // 初始化数据筛选
    initDataFilters();
}

// 计算趋势分析
function calculateTrendAnalysis() {
    // 用户增长趋势
    const userGrowthTrend = calculateUserGrowthTrend();
    document.getElementById('user-growth-trend').textContent = userGrowthTrend + '%';

    // 功能使用趋势
    const featureUsageTrend = calculateFeatureUsageTrend();
    document.getElementById('feature-usage-trend').textContent = featureUsageTrend + '%';

    // 系统性能趋势
    const performanceTrend = calculatePerformanceTrend();
    document.getElementById('performance-trend').textContent = performanceTrend + '%';
}

// 计算用户增长趋势
function calculateUserGrowthTrend() {
    const users = window.UserStorage.getUsers();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentUsers = users.filter(user => {
        const userDate = new Date(user.createdAt || user.registeredAt || now);
        return userDate >= weekAgo;
    }).length;

    const previousUsers = users.filter(user => {
        const userDate = new Date(user.createdAt || user.registeredAt || now);
        return userDate >= twoWeeksAgo && userDate < weekAgo;
    }).length;

    if (previousUsers === 0) return recentUsers > 0 ? 100 : 0;

    const growthRate = Math.round(((recentUsers - previousUsers) / previousUsers) * 100);
    return Math.max(growthRate, 0);
}

// 计算功能使用趋势
function calculateFeatureUsageTrend() {
    const aiStats = window.AdminStorage.getObject('aiFortuneStats');
    const systemStats = window.AdminStorage.getObject('systemStats');

    const currentUsage = (aiStats.totalAiGenerations || 0) + (systemStats.traditionalFortuneCount || 0);

    // 模拟历史数据计算趋势
    const historicalUsage = Math.max(currentUsage * 0.8, 1);
    const growthRate = Math.round(((currentUsage - historicalUsage) / historicalUsage) * 100);

    return Math.max(growthRate, 0);
}

// 计算系统性能趋势
function calculatePerformanceTrend() {
    const systemStats = window.AdminStorage.getObject('systemStats');
    const currentResponseTime = systemStats.avgResponseTime || 200;

    // 模拟历史性能数据
    const historicalResponseTime = currentResponseTime * 1.1;
    const performanceChange = Math.round(((currentResponseTime - historicalResponseTime) / historicalResponseTime) * 100);

    return performanceChange;
}

// 计算预测分析
function calculatePredictionAnalysis() {
    // 预测下周用户数
    const predictedUsers = predictNextWeekUsers();
    document.getElementById('predicted-users').textContent = predictedUsers;

    // 预测API调用量
    const predictedApiCalls = predictNextWeekApiCalls();
    document.getElementById('predicted-api-calls').textContent = predictedApiCalls.toLocaleString();

    // 预测响应时间
    const predictedResponseTime = predictNextWeekResponseTime();
    document.getElementById('predicted-response-time').textContent = predictedResponseTime + 'ms';
}

// 预测下周用户数
function predictNextWeekUsers() {
    const users = window.UserStorage.getUsers();
    const currentUsers = users.length;

    // 基于历史增长率的简单预测
    const growthRate = calculateUserGrowthTrend() / 100;
    const predictedGrowth = Math.round(currentUsers * growthRate);

    return currentUsers + predictedGrowth;
}

// 预测下周API调用量
function predictNextWeekApiCalls() {
    const systemStats = window.AdminStorage.getObject('systemStats');
    const currentApiCalls = systemStats.totalApiCalls || 0;

    // 基于当前使用模式的预测
    const dailyAverage = currentApiCalls / 30; // 假设30天的数据
    const weeklyPrediction = Math.round(dailyAverage * 7);

    return weeklyPrediction;
}

// 预测下周响应时间
function predictNextWeekResponseTime() {
    const systemStats = window.AdminStorage.getObject('systemStats');
    const currentResponseTime = systemStats.avgResponseTime || 200;

    // 基于性能趋势的预测
    const performanceTrend = calculatePerformanceTrend();
    const trendFactor = 1 + (performanceTrend / 100);
    const predictedTime = Math.round(currentResponseTime * trendFactor);

    return Math.max(predictedTime, 100); // 最小100ms
}

// 初始化数据筛选
function initDataFilters() {
    console.log('初始化数据筛选功能');

    // 设置默认筛选器状态
    window.currentFilters = {
        timeRange: 30,
        userType: 'all',
        featureType: 'all'
    };
}

// 应用时间筛选
function applyTimeFilter() {
    const timeRange = document.getElementById('timeRange').value;
    window.currentFilters.timeRange = parseInt(timeRange);
    console.log('应用时间筛选:', timeRange + '天');
    refreshFilteredData();
}

// 应用用户类型筛选
function applyUserFilter() {
    const userType = document.getElementById('userType').value;
    window.currentFilters.userType = userType;
    console.log('应用用户类型筛选:', userType);
    refreshFilteredData();
}

// 应用功能类型筛选
function applyFeatureFilter() {
    const featureType = document.getElementById('featureType').value;
    window.currentFilters.featureType = featureType;
    console.log('应用功能类型筛选:', featureType);
    refreshFilteredData();
}

// 应用所有筛选
function applyAllFilters() {
    console.log('应用所有筛选器');
    refreshFilteredData();
    alert('筛选器已应用！');
}

// 刷新筛选后的数据
function refreshFilteredData() {
    console.log('刷新筛选后的数据');

    // 重新计算统计数据
    initSystemStats();

    // 重新初始化图表
    initSystemCharts();

    // 更新高级分析
    calculateTrendAnalysis();
    calculatePredictionAnalysis();
}

// 导出高级报告
function exportAdvancedReport() {
    console.log('导出高级分析报告');

    // 收集高级分析数据
    const advancedData = {
        exportTime: new Date().toISOString(),
        trendAnalysis: {
            userGrowthTrend: document.getElementById('user-growth-trend').textContent,
            featureUsageTrend: document.getElementById('feature-usage-trend').textContent,
            performanceTrend: document.getElementById('performance-trend').textContent
        },
        predictionAnalysis: {
            predictedUsers: document.getElementById('predicted-users').textContent,
            predictedApiCalls: document.getElementById('predicted-api-calls').textContent,
            predictedResponseTime: document.getElementById('predicted-response-time').textContent
        },
        filters: window.currentFilters || {},
        charts: {
            userActivity: getUserActivityData(),
            featureUsage: getFeatureUsageData(),
            systemPerformance: getSystemPerformanceData(),
            userType: getUserTypeData()
        }
    };

    // 生成高级报告
    const reportContent = generateAdvancedReport(advancedData);

    // 下载文件
    downloadFile(reportContent, 'advanced-analytics-report.csv', 'text/csv');

    alert('高级分析报告已导出！');
}

// 生成高级报告
function generateAdvancedReport(data) {
    let report = '高级分析报告\n';
    report += `导出时间,${data.exportTime}\n\n`;

    report += '趋势分析\n';
    report += '指标,数值\n';
    report += `用户增长趋势,${data.trendAnalysis.userGrowthTrend}\n`;
    report += `功能使用趋势,${data.trendAnalysis.featureUsageTrend}\n`;
    report += `系统性能趋势,${data.trendAnalysis.performanceTrend}\n\n`;

    report += '预测分析\n';
    report += '指标,预测值\n';
    report += `预计下周用户数,${data.predictionAnalysis.predictedUsers}\n`;
    report += `预计API调用量,${data.predictionAnalysis.predictedApiCalls}\n`;
    report += `预计响应时间,${data.predictionAnalysis.predictedResponseTime}\n\n`;

    report += '筛选条件\n';
    report += `时间范围,${data.filters.timeRange}天\n`;
    report += `用户类型,${data.filters.userType}\n`;
    report += `功能类型,${data.filters.featureType}\n\n`;

    report += '图表数据\n';
    report += '用户活跃度趋势\n';
    report += '日期,活跃用户数\n';
    data.charts.userActivity.labels.forEach((label, index) => {
        report += `${label},${data.charts.userActivity.data[index]}\n`;
    });

    return report;
}

// ==================== 性能优化和缓存机制 ====================

// 数据缓存
const dataCache = {
    userStats: null,
    systemStats: null,
    charts: null,
    lastUpdate: null,
    cacheTimeout: 30000 // 30秒缓存
};

// 检查缓存是否有效
function isCacheValid() {
    if (!dataCache.lastUpdate) return false;
    return (Date.now() - dataCache.lastUpdate) < dataCache.cacheTimeout;
}

// 获取缓存的用户统计数据
function getCachedUserStats() {
    if (isCacheValid() && dataCache.userStats) {
        console.log('使用缓存的用户统计数据');
        return dataCache.userStats;
    }

    console.log('计算新的用户统计数据');
    const users = window.UserStorage.getUsers();
    const totalUsers = users.length;
    const vipUsers = users.filter(user => user.role === 'vip').length;
    const normalUsers = totalUsers - vipUsers;
    const activeUsers = calculateActiveUsers();
    const newUsers = calculateNewUsers();

    dataCache.userStats = {
        totalUsers,
        vipUsers,
        normalUsers,
        activeUsers,
        newUsers
    };

    return dataCache.userStats;
}

// 获取缓存的系统统计数据
function getCachedSystemStats() {
    if (isCacheValid() && dataCache.systemStats) {
        console.log('使用缓存的系统统计数据');
        return dataCache.systemStats;
    }

    console.log('计算新的系统统计数据');
    const aiStats = window.AdminStorage.getObject('aiFortuneStats');
    const systemStats = window.AdminStorage.getObject('systemStats');

    const aiFortuneCount = aiStats.totalAiGenerations || 0;
    const traditionalFortuneCount = systemStats.traditionalFortuneCount || 0;
    const apiCalls = aiStats.totalApiRequests || 0;
    const successRate = aiStats.totalAiGenerations > 0 ?
        Math.round((aiStats.successfulGenerations / aiStats.totalAiGenerations) * 100) : 0;

    dataCache.systemStats = {
        aiFortuneCount,
        traditionalFortuneCount,
        apiCalls,
        successRate,
        avgResponseTime: systemStats.avgResponseTime || 200,
        errorRate: 100 - successRate
    };

    return dataCache.systemStats;
}

// 更新缓存时间戳
function updateCacheTimestamp() {
    dataCache.lastUpdate = Date.now();
}

// 清除缓存
function clearCache() {
    dataCache.userStats = null;
    dataCache.systemStats = null;
    dataCache.charts = null;
    dataCache.lastUpdate = null;
    console.log('缓存已清除');
}

// 优化的数据刷新函数
function optimizedRefreshSystemStats() {
    console.log('优化的数据刷新');

    // 清除缓存
    clearCache();

    // 重新计算统计数据
    initSystemStats();

    // 重新初始化图表
    initSystemCharts();

    // 更新高级分析
    calculateTrendAnalysis();
    calculatePredictionAnalysis();

    // 更新缓存时间戳
    updateCacheTimestamp();
}

// 优化的图表初始化
function optimizedInitSystemCharts() {
    console.log('优化的图表初始化');

    // 检查图表是否已存在
    const existingCharts = window.systemCharts || {};

    // 销毁现有图表
    Object.values(existingCharts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });

    // 重新初始化图表
    initUserActivityChart();
    initFeatureUsageChart();
    initSystemPerformanceChart();
    initUserTypeChart();

    // 更新缓存时间戳
    updateCacheTimestamp();
}

// 延迟加载优化
function lazyLoadCharts() {
    // 使用Intersection Observer API检测图表是否在视口中
    const chartContainers = document.querySelectorAll('.chart-container');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chartId = entry.target.querySelector('canvas')?.id;
                if (chartId && !window.systemCharts?.[chartId]) {
                    console.log('延迟加载图表:', chartId);
                    // 这里可以添加特定图表的延迟加载逻辑
                }
            }
        });
    }, {
        threshold: 0.1
    });

    chartContainers.forEach(container => {
        observer.observe(container);
    });
}

// 内存优化
function optimizeMemory() {
    try {
        // 限制日志数量
        const systemLogs = { logs: window.AdminStorage.getLogs('systemLogs') };
        if (systemLogs.logs && systemLogs.logs.length > 500) { // 减少到500条
            systemLogs.logs = systemLogs.logs.slice(-500);
            window.AdminStorage.setLogs(systemLogs.logs || [], 'systemLogs');
            console.log('日志数量已优化，保留最近500条');
        }

        // 清理过期的用户活动数据
        const userActivity = window.AdminStorage.getObject('userActivity');
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 减少到7天

        if (userActivity.dailyActiveUsers) {
            Object.keys(userActivity.dailyActiveUsers).forEach(date => {
                if (date < sevenDaysAgo) {
                    delete userActivity.dailyActiveUsers[date];
                }
            });
            window.AdminStorage.setObject('userActivity', userActivity);
            console.log('过期用户活动数据已清理');
        }

        // 清理图表缓存
        if (window.systemCharts) {
            Object.values(window.systemCharts).forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    try {
                        chart.destroy();
                    } catch (error) {
                        console.warn('清理图表缓存时出错:', error);
                    }
                }
            });
        }

        // 清理DOM缓存
        const unusedElements = document.querySelectorAll('.chart-container:not(:has(canvas))');
        unusedElements.forEach(el => el.remove());

    } catch (error) {
        console.error('内存优化时出错:', error);
    }
}

// 定期优化
function startPeriodicOptimization() {
    // 每2分钟执行一次内存优化
    setInterval(() => {
        optimizeMemory();
    }, 2 * 60 * 1000);

    // 每5分钟清除缓存
    setInterval(() => {
        clearCache();
    }, 5 * 60 * 1000);
}

// 启动性能优化
startPeriodicOptimization();

// ==================== 第四阶段：优化和完善 ====================

// 用户体验优化功能
let autoRefreshInterval = null;
let isDarkMode = false;
let isAutoRefreshEnabled = false;

// 显示加载指示器
function showLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
    }
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    const indicator = document.getElementById('loadingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
    }
}

// 显示通知
function showNotification(message, type = 'info', duration = 3000) {
    const notificationArea = document.getElementById('notificationArea');
    if (!notificationArea) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    const row = document.createElement('div');
    row.className = 'admin-notification-row';
    const text = document.createElement('span');
    text.textContent = message;
    const dismiss = document.createElement('button');
    dismiss.dataset.adminDismiss = '';
    dismiss.className = 'admin-notification-dismiss';
    dismiss.textContent = '×';
    row.append(text, dismiss);
    notification.appendChild(row);

    notificationArea.appendChild(notification);

    // 自动移除通知
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// 快速刷新
function quickRefresh() {
    showLoadingIndicator();
    showNotification('正在快速刷新数据...', 'info', 2000);

    setTimeout(() => {
        optimizedRefreshSystemStats();
        hideLoadingIndicator();
        showNotification('数据刷新完成！', 'success', 2000);
    }, 1000);
}

// 切换自动刷新
function toggleAutoRefresh() {
    const autoRefreshText = document.getElementById('autoRefreshText');
    const quickBtn = event.target.closest('.quick-btn');

    if (isAutoRefreshEnabled) {
        // 停止自动刷新
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
        isAutoRefreshEnabled = false;
        autoRefreshText.textContent = '开启自动刷新';
        quickBtn.classList.remove('active');
        showNotification('自动刷新已关闭', 'info', 2000);
    } else {
        // 开启自动刷新
        autoRefreshInterval = setInterval(() => {
            console.log('自动刷新数据');
            optimizedRefreshSystemStats();
        }, 60000); // 每分钟刷新一次

        isAutoRefreshEnabled = true;
        autoRefreshText.textContent = '关闭自动刷新';
        quickBtn.classList.add('active');
        showNotification('自动刷新已开启（每分钟）', 'success', 2000);
    }
}

// 切换深色模式
function toggleDarkMode() {
    const darkModeText = document.getElementById('darkModeText');
    const quickBtn = event.target.closest('.quick-btn');
    const body = document.body;

    if (isDarkMode) {
        // 关闭深色模式
        body.classList.remove('dark-mode');
        isDarkMode = false;
        darkModeText.textContent = '深色模式';
        quickBtn.classList.remove('active');
        window.AdminStorage.setRaw('darkMode', 'false');
        showNotification('已切换到浅色模式', 'info', 2000);
    } else {
        // 开启深色模式
        body.classList.add('dark-mode');
        isDarkMode = true;
        darkModeText.textContent = '浅色模式';
        quickBtn.classList.add('active');
        window.AdminStorage.setRaw('darkMode', 'true');
        showNotification('已切换到深色模式', 'success', 2000);
    }
}

// 显示帮助
function showHelp() {
    const helpContent = `
        <div style="max-width: 500px; padding: 1rem;">
            <h3>📊 系统统计功能帮助</h3>
            <div style="margin-bottom: 1rem;">
                <h4>主要功能：</h4>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    <li>实时数据统计和展示</li>
                    <li>高级数据分析和预测</li>
                    <li>多维度数据筛选</li>
                    <li>图表可视化展示</li>
                    <li>数据导出和报告生成</li>
                </ul>
            </div>
            <div style="margin-bottom: 1rem;">
                <h4>快速操作：</h4>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    <li>快速刷新：立即更新数据</li>
                    <li>自动刷新：每分钟自动更新</li>
                    <li>深色模式：切换界面主题</li>
                    <li>帮助：显示使用说明</li>
                </ul>
            </div>
            <div>
                <h4>快捷键：</h4>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    <li>Ctrl+R：刷新数据</li>
                    <li>Ctrl+D：切换深色模式</li>
                    <li>Ctrl+H：显示帮助</li>
                </ul>
            </div>
        </div>
    `;

    showNotification(helpContent, 'info', 10000);
}

// 初始化用户体验功能
function initUXEnhancements() {
    console.log('初始化用户体验优化功能');

    // 检查深色模式设置
    const savedDarkMode = window.AdminStorage.getRaw('darkMode');
    if (savedDarkMode === 'true') {
        document.body.classList.add('dark-mode');
        isDarkMode = true;
        const darkModeText = document.getElementById('darkModeText');
const quickBtn = document.querySelector('.quick-btn[data-admin-action="toggleDarkMode"]');
        if (darkModeText) darkModeText.textContent = '浅色模式';
        if (quickBtn) quickBtn.classList.add('active');
    }

    // 添加键盘快捷键
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey) {
            switch(e.key) {
                case 'r':
                    e.preventDefault();
                    quickRefresh();
                    break;
                case 'd':
                    e.preventDefault();
                    toggleDarkMode();
                    break;
                case 'h':
                    e.preventDefault();
                    showHelp();
                    break;
            }
        }
    });

    // 添加无障碍访问支持
    addAccessibilitySupport();

    // 初始化错误处理
    initErrorHandling();
}

// 添加无障碍访问支持
function addAccessibilitySupport() {
    // 为所有按钮添加ARIA标签
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (!button.getAttribute('aria-label') && button.textContent) {
            button.setAttribute('aria-label', button.textContent.trim());
        }
    });

    // 为图表添加描述
    const charts = document.querySelectorAll('canvas');
    charts.forEach((chart, index) => {
        const chartId = chart.id;
        const description = getChartDescription(chartId);
        chart.setAttribute('aria-label', description);
        chart.setAttribute('role', 'img');
    });

    // 添加焦点管理
    const focusableElements = document.querySelectorAll('button, select, input');
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.classList.add('focus-visible');
        });
        element.addEventListener('blur', function() {
            this.classList.remove('focus-visible');
        });
    });
}

// 获取图表描述
function getChartDescription(chartId) {
    const descriptions = {
        'userActivityChart': '用户活跃度趋势图，显示最近7天的活跃用户数量变化',
        'featureUsageChart': '功能使用对比图，显示AI签语和传统签语的使用比例',
        'systemPerformanceChart': '系统性能监控图，显示API调用、响应时间、错误率和成功率',
        'userTypeChart': '用户类型分布图，显示VIP用户和普通用户的分布情况'
    };
    return descriptions[chartId] || '数据图表';
}

// 初始化错误处理
function initErrorHandling() {
    // 全局错误处理
    window.addEventListener('error', function(e) {
        console.error('系统错误:', e.error);
        // 只在严重错误时显示通知
        if (e.error && e.error.message && !e.error.message.includes('Chart')) {
            showNotification('系统发生错误，请刷新页面重试', 'error', 3000);
        }
    });

    // Promise错误处理
    window.addEventListener('unhandledrejection', function(e) {
        console.error('未处理的Promise错误:', e.reason);
        // 只在网络相关错误时显示通知
        if (e.reason && e.reason.message && e.reason.message.includes('fetch')) {
            showNotification('网络连接错误，请检查网络', 'warning', 3000);
        }
    });

    // 网络错误处理
    window.addEventListener('online', function() {
        showNotification('网络连接已恢复', 'success', 2000);
    });

    window.addEventListener('offline', function() {
        showNotification('网络连接已断开，部分功能可能不可用', 'warning', 3000);
    });
}

// 增强的响应式设计
function initResponsiveDesign() {
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        // 延迟执行，避免频繁触发
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
            console.log('窗口大小变化，重新调整布局');
            // 重新初始化图表以适应新尺寸
            if (window.systemCharts) {
                Object.values(window.systemCharts).forEach(chart => {
                    if (chart && typeof chart.resize === 'function') {
                        chart.resize();
                    }
                });
            }
        }, 250);
    });

    // 检测设备类型
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

    if (isMobile) {
        document.body.classList.add('mobile-device');
        showNotification('检测到移动设备，已优化布局', 'info', 3000);
    } else if (isTablet) {
        document.body.classList.add('tablet-device');
    }
}

// 数据验证和错误恢复
function validateData() {
    try {
        // 验证localStorage数据完整性
        const requiredKeys = ['users', 'aiFortuneStats', 'systemStats'];
        const missingKeys = requiredKeys.filter(key => !window.AdminStorage.getRaw(key));

        if (missingKeys.length > 0) {
            console.warn('缺少必要的数据:', missingKeys);
            showNotification('检测到数据不完整，正在修复...', 'warning', 3000);

            // 重新初始化缺失的数据
            initSystemStatsStorage();
        }

        return true;
    } catch (error) {
        console.error('数据验证失败:', error);
        showNotification('数据验证失败，请刷新页面', 'error', 5000);
        return false;
    }
}

// 性能监控
function initPerformanceMonitoring() {
    // 监控页面加载性能
    window.addEventListener('load', function() {
        const loadTime = performance.now();
        console.log('页面加载时间:', loadTime + 'ms');

        if (loadTime > 5000) { // 提高阈值到5秒
            showNotification('页面加载较慢，建议检查网络连接', 'warning', 3000);
        }
    });

    // 监控内存使用
    if (performance.memory) {
        let memoryWarningCount = 0;
        setInterval(() => {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);

            if (usedMB > 150) { // 提高阈值到150MB
                memoryWarningCount++;
                console.warn('内存使用较高:', usedMB + 'MB / ' + totalMB + 'MB');

                // 只在第一次或每5次警告时显示通知
                if (memoryWarningCount === 1 || memoryWarningCount % 5 === 0) {
                    showNotification('内存使用较高，建议刷新页面', 'warning', 3000);
                }
            } else {
                memoryWarningCount = 0; // 重置计数器
            }
        }, 60000); // 改为每60秒检查一次
    }
}

// 重置系统统计
function resetSystemStats() {
    if (confirm('确定要重置所有统计数据吗？此操作不可恢复！')) {
        window.AdminStorage.removeKey('aiFortuneStats');
        window.AdminStorage.removeKey('aiFortuneDailyStats');
        window.AdminStorage.removeKey('systemStats');
        window.AdminStorage.removeKey('userActivity');
        window.AdminStorage.removeKey('systemLogs');
        alert('统计数据已重置');
        refreshSystemStats();
    }
}

// ==================== 第二阶段：数据收集和存储机制 ====================

// 初始化系统统计数据存储
function initSystemStatsStorage() {
    // 初始化系统统计数据
    if (!window.AdminStorage.hasKey('systemStats')) {
        const systemStats = {
            totalPageViews: 0,
            totalUserSessions: 0,
            totalFortuneGenerations: 0,
            totalApiCalls: 0,
            totalErrors: 0,
            avgResponseTime: 0,
            lastUpdated: new Date().toISOString()
        };
        window.AdminStorage.setObject('systemStats', systemStats);
    }

    // 初始化用户活动数据
    if (!window.AdminStorage.hasKey('userActivity')) {
        const userActivity = {
            dailyActiveUsers: {},
            weeklyActiveUsers: {},
            monthlyActiveUsers: {},
            userSessions: [],
            lastUpdated: new Date().toISOString()
        };
        window.AdminStorage.setObject('userActivity', userActivity);
    }

    // 初始化系统日志
    if (!window.AdminStorage.hasKey('systemLogs')) {
        const systemLogs = {
            logs: [],
            maxLogs: 1000,
            lastUpdated: new Date().toISOString()
        };
        window.AdminStorage.setLogs(systemLogs.logs || [], 'systemLogs');
    }
}

// 计算活跃用户数
function calculateActiveUsers() {
    const userActivity = window.AdminStorage.getObject('userActivity');
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let activeUsers = 0;
    for (let date = weekAgo; date <= today; date++) {
        if (userActivity.dailyActiveUsers && userActivity.dailyActiveUsers[date]) {
            activeUsers += userActivity.dailyActiveUsers[date];
        }
    }

    return Math.max(activeUsers, 0);
}

// 计算新注册用户数
function calculateNewUsers() {
    const users = window.UserStorage.getUsers();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return users.filter(user => {
        const userDate = new Date(user.createdAt || user.registeredAt || Date.now());
        return userDate >= weekAgo;
    }).length;
}

// 计算用户活跃度
function calculateUserActivityLevel(userType) {
    const users = window.UserStorage.getUsers();
    const userActivity = window.AdminStorage.getObject('userActivity');

    // 根据用户类型筛选用户
    const targetUsers = users.filter(user => {
        if (userType === 'vip') {
            return user.role === 'vip';
        } else {
            return user.role !== 'vip';
        }
    });

    // 如果没有用户，返回"无"
    if (targetUsers.length === 0) {
        return '无';
    }

    // 计算最近7天的活跃用户数
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let activeCount = 0;
    const targetUserIds = targetUsers.map(user => user.id);

    // 统计活跃用户
    for (let date = weekAgo; date <= today; date++) {
        if (userActivity.userSessions) {
            const daySessions = userActivity.userSessions.filter(session =>
                session.date === date && targetUserIds.includes(session.userId)
            );
            const uniqueUsers = new Set(daySessions.map(session => session.userId));
            activeCount += uniqueUsers.size;
        }
    }

    // 计算活跃度百分比
    const totalPossibleActivity = targetUsers.length * 7; // 7天
    const activityPercentage = totalPossibleActivity > 0 ? (activeCount / totalPossibleActivity) * 100 : 0;

    // 根据活跃度百分比返回等级
    if (activityPercentage >= 50) {
        return '高';
    } else if (activityPercentage >= 20) {
        return '中';
    } else if (activityPercentage > 0) {
        return '低';
    } else {
        return '无';
    }
}

// 获取传统签语使用次数
function getTraditionalFortuneCount() {
    const systemStats = window.AdminStorage.getObject('systemStats');
    return systemStats.traditionalFortuneCount || 0;
}

// 获取系统性能数据
function getSystemPerformance() {
    const systemStats = window.AdminStorage.getObject('systemStats');
    const aiStats = window.AdminStorage.getObject('aiFortuneStats');

    const totalGenerations = aiStats.totalAiGenerations || 0;
    const failedGenerations = aiStats.failedGenerations || 0;
    const errorRate = totalGenerations > 0 ? Math.round((failedGenerations / totalGenerations) * 100) : 0;

    // 使用真实的响应时间数据，如果没有则使用合理的默认值
    const avgResponseTime = systemStats.avgResponseTime || 200;

    return {
        avgResponseTime: avgResponseTime,
        errorRate: errorRate
    };
}

// 记录页面访问
function recordPageAccess(pageName) {
    const systemStats = window.AdminStorage.getObject('systemStats');
    systemStats.totalPageViews = (systemStats.totalPageViews || 0) + 1;
    systemStats.lastUpdated = new Date().toISOString();
    window.AdminStorage.setObject('systemStats', systemStats);

    // 记录到系统日志
    addSystemLog('页面访问', '成功', `访问${pageName}页面`);
}

// 记录用户活动
function recordUserActivity(userId, activityType) {
    const userActivity = window.AdminStorage.getObject('userActivity');
    const today = new Date().toISOString().split('T')[0];

    // 初始化数据结构
    if (!userActivity.dailyActiveUsers) userActivity.dailyActiveUsers = {};
    if (!userActivity.userSessions) userActivity.userSessions = [];

    // 记录今日活跃用户
    if (!userActivity.dailyActiveUsers[today]) {
        userActivity.dailyActiveUsers[today] = 0;
    }

    // 检查用户是否已经在今日活跃用户中
    const todaySessions = userActivity.userSessions.filter(session =>
        session.date === today && session.userId === userId
    );

    if (todaySessions.length === 0) {
        userActivity.dailyActiveUsers[today]++;
        userActivity.userSessions.push({
            userId: userId,
            date: today,
            activityType: activityType,
            timestamp: new Date().toISOString()
        });
    }

    userActivity.lastUpdated = new Date().toISOString();
    window.AdminStorage.setObject('userActivity', userActivity);
}

// 记录系统日志
function addSystemLog(event, status, detail) {
    const systemLogs = { logs: window.AdminStorage.getLogs('systemLogs') };

    if (!systemLogs.logs) systemLogs.logs = [];

    const logEntry = {
        id: Date.now(),
        time: new Date().toISOString(),
        event: event,
        status: status,
        detail: detail
    };

    systemLogs.logs.unshift(logEntry);

    // 限制日志数量
    if (systemLogs.logs.length > (systemLogs.maxLogs || 1000)) {
        systemLogs.logs = systemLogs.logs.slice(0, systemLogs.maxLogs);
    }

    systemLogs.lastUpdated = new Date().toISOString();
    window.AdminStorage.setLogs(systemLogs.logs || [], 'systemLogs');
}

// 记录API调用
function recordApiCall(responseTime, success) {
    const systemStats = window.AdminStorage.getObject('systemStats');

    systemStats.totalApiCalls = (systemStats.totalApiCalls || 0) + 1;

    if (!success) {
        systemStats.totalErrors = (systemStats.totalErrors || 0) + 1;
    }

    // 更新平均响应时间
    const currentAvg = systemStats.avgResponseTime || 0;
    const totalCalls = systemStats.totalApiCalls;
    systemStats.avgResponseTime = Math.round((currentAvg * (totalCalls - 1) + responseTime) / totalCalls);

    systemStats.lastUpdated = new Date().toISOString();
    window.AdminStorage.setObject('systemStats', systemStats);

    // 记录到系统日志
    addSystemLog('API调用', success ? '成功' : '失败', `响应时间: ${responseTime}ms`);
}

// 记录签语生成
function recordFortuneGeneration(type, success) {
    const systemStats = window.AdminStorage.getObject('systemStats');

    systemStats.totalFortuneGenerations = (systemStats.totalFortuneGenerations || 0) + 1;

    if (type === 'traditional') {
        systemStats.traditionalFortuneCount = (systemStats.traditionalFortuneCount || 0) + 1;
    }

    systemStats.lastUpdated = new Date().toISOString();
    window.AdminStorage.setObject('systemStats', systemStats);

    // 记录到系统日志
    addSystemLog('签语生成', success ? '成功' : '失败', `${type === 'ai' ? 'AI' : '传统'}签语生成`);
}

// 加载用户列表
function loadUserList() {
    const users = window.UserStorage.getUsers();
    const userList = document.getElementById('user-list');

    // 更新统计信息 - 排除管理员账户
    const regularUsers = users.filter(user => user.role !== 'admin');
    const totalUsers = regularUsers.length;
    const vipUsers = regularUsers.filter(user => user.role === 'vip').length;
    const normalUsers = regularUsers.filter(user => user.role === 'normal').length;

    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('vip-users').textContent = vipUsers;
    document.getElementById('normal-users').textContent = normalUsers;

    if (regularUsers.length === 0) {
        userList.replaceChildren(createAdminEmptyUserState());
        return;
    }

    userList.replaceChildren(...regularUsers.map(user => {
        const permissionTags = user.permissions ?
            user.permissions.map(p => {
                const perm = PERMISSIONS[p];
                return perm ? createPermissionTag(`${perm.icon} ${perm.name}`) : null;
            }).filter(Boolean) :
            [createPermissionTag('⚠️ 无权限')];

        const userInitial = user.username.charAt(0).toUpperCase();
        const roleLabel = user.role === 'vip' ? '⭐ VIP用户' : '👤 普通用户';
        const createdDate = new Date(user.createdAt).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return createAdminUserListItem(user, {
            permissionTags,
            userInitial,
            roleLabel,
            createdDate
        });
    }));
}

function createAdminEmptyUserState() {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const icon = document.createElement('div');
    icon.className = 'empty-icon';
    icon.textContent = '👥';
    const title = document.createElement('h3');
    title.textContent = '暂无用户';
    const first = document.createElement('p');
    first.textContent = '系统中还没有任何普通用户';
    const second = document.createElement('p');
    second.textContent = '点击"创建新用户"开始添加用户';
    empty.append(icon, title, first, second);
    return empty;
}

function createPermissionTag(text) {
    const tag = document.createElement('span');
    tag.className = 'permission-tag';
    tag.textContent = text;
    return tag;
}

function createAdminUserListItem(user, state) {
    const item = document.createElement('div');
    item.className = 'user-item';
    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.textContent = state.userInitial;
    const info = document.createElement('div');
    info.className = 'user-info';
    const details = document.createElement('div');
    details.className = 'user-details';
    const name = document.createElement('div');
    name.className = 'user-name';
    name.append(document.createTextNode(user.username || ''), createUserRole(state.roleLabel));
    const meta = document.createElement('div');
    meta.className = 'user-meta';
    meta.append(
        createUserMetaItem('📧', user.email || '无邮箱'),
        createUserMetaItem('📅', state.createdDate)
    );
    details.append(name, meta);
    const permissions = document.createElement('div');
    permissions.className = 'user-permissions';
    const permissionsTitle = document.createElement('div');
    permissionsTitle.className = 'user-permissions-title';
    permissionsTitle.textContent = '⚙️ 功能权限';
    const permissionsList = document.createElement('div');
    permissionsList.className = 'user-permissions-list';
    permissionsList.append(...state.permissionTags);
    permissions.append(permissionsTitle, permissionsList);
    info.append(details, permissions);
    const actions = document.createElement('div');
    actions.className = 'user-actions-buttons';
    actions.append(
        createAdminUserActionButton('editUser', user.id, '✏️', '编辑'),
        createAdminUserActionButton('deleteUser', user.id, '🗑️', '删除', true)
    );
    item.append(avatar, info, actions);
    return item;
}

function createUserRole(text) {
    const role = document.createElement('span');
    role.className = 'user-role';
    role.textContent = text;
    return role;
}

function createUserMetaItem(iconText, label) {
    const item = document.createElement('span');
    item.className = 'user-meta-item';
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.style.fontSize = '14px';
    icon.textContent = iconText;
    item.append(icon, document.createTextNode(label));
    return item;
}

function createAdminUserActionButton(action, userId, iconText, label, danger = false) {
    const button = document.createElement('button');
    button.className = danger ? 'admin-btn danger' : 'admin-btn';
    button.dataset.adminAction = action;
    button.dataset.userId = userId;
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = iconText;
    button.append(icon, document.createTextNode(label));
    return button;
}

// 创建新用户
function createNewUser() {
    // 创建模态对话框
    const modalHTML = `
        <div id="create-user-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>
                        <span class="material-icons">person_add</span>
                        创建新用户
                    </h3>
        <button class="modal-close" data-admin-action="closeCreateUserModal">
                        <span class="material-icons">close</span>
                    </button>
                </div>
                <form id="create-user-form" class="modal-body">
                    <div class="form-group">
                        <label for="new-username">用户名 *</label>
                        <input type="text" id="new-username" placeholder="请输入用户名" required>
                    </div>
                    <div class="form-group">
                        <label for="new-password">初始密码 *</label>
                        <input type="password" id="new-password" placeholder="请输入初始密码" required>
                    </div>
                    <div class="form-group">
                        <label for="new-email">邮箱</label>
                        <input type="email" id="new-email" placeholder="请输入邮箱（可选）">
                    </div>
                    <div class="form-group">
                        <label for="new-role">用户类型</label>
                        <select id="new-role">
                            <option value="normal">普通用户</option>
                            <option value="vip">VIP用户</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>用户权限</label>
                        <div class="permissions-grid">
                            ${Object.entries(PERMISSIONS).map(([key, permission]) => `
                                <div class="permission-item">
                                    <label class="permission-label">
                                        <input type="checkbox" name="permissions" value="${key}" checked>
                                        <span class="permission-icon">${permission.icon}</span>
                                        <div class="permission-info">
                                            <div class="permission-name">${permission.name}</div>
                                            <div class="permission-desc">${permission.description}</div>
                                        </div>
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </form>
                <div class="modal-footer">
                <button type="button" class="admin-btn secondary" data-admin-action="closeCreateUserModal">取消</button>
                    <button type="submit" form="create-user-form" class="admin-btn">创建用户</button>
                </div>
            </div>
        </div>
    `;

    appendAdminMarkup(document.body, modalHTML);

    // 绑定表单提交事件
    document.getElementById('create-user-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleCreateUser();
    });
}

// 处理创建用户
async function handleCreateUser() {
    const username = document.getElementById('new-username').value.trim();
    const initialCredential = document.getElementById('new-password').value;
    const email = document.getElementById('new-email').value.trim();
    const role = document.getElementById('new-role').value;

    if (!username || !initialCredential) {
        alert('请填写用户名和密码');
        return;
    }

    // 获取选中的权限
    const checkedBoxes = document.querySelectorAll('input[name="permissions"]:checked');
    console.log('🔧 被选中的复选框数量:', checkedBoxes.length);
    console.log('🔧 被选中的复选框:', Array.from(checkedBoxes).map(cb => cb.value));

    const selectedPermissions = Array.from(checkedBoxes)
        .map(checkbox => checkbox.value);

    console.log('🔧 选中的权限数组:', selectedPermissions);
    console.log('🔧 权限数量:', selectedPermissions.length);

    if (selectedPermissions.length === 0) {
        alert('请至少选择一个权限');
        return;
    }

    // 检查用户名是否已存在
    const users = window.UserStorage.getUsers();
    if (users.find(user => user.username === username)) {
        alert('用户名已存在，请选择其他用户名');
        return;
    }

    const passwordHash = (window.Security && window.Security.Password && window.Security.Password.hashPassword)
        ? await window.Security.Password.hashPassword(initialCredential)
        : initialCredential;

    const newUser = {
        id: 'user_' + Date.now(),
        username: username,
        password: passwordHash,
        email: email || '',
        role: role,
        permissions: selectedPermissions,
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
        passwordMigrated: passwordHash !== initialCredential
    };

    users.push(newUser);
    window.UserStorage.setUsers(users);

    // 验证保存是否成功
    const savedUsers = window.UserStorage.getUsers();
    const savedUser = savedUsers.find(u => u.username === username);
    console.log('🔧 从localStorage读取的用户:', savedUser);
    console.log('🔧 保存的用户权限:', savedUser ? savedUser.permissions : '未找到');

    alert(`用户创建成功！\n用户名：${username}\n权限数量：${selectedPermissions.length}\n权限列表：${selectedPermissions.join('、')}`);
    closeCreateUserModal();
    loadUserList();
}

// 关闭创建用户模态框
function closeCreateUserModal() {
    const modal = document.getElementById('create-user-modal');
    if (modal) {
        modal.remove();
    }
}

// 编辑用户
function editUser(userId) {
    const users = window.UserStorage.getUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
        alert('用户不存在');
        return;
    }

    // 🔧 强化用户权限处理
    console.log('🔧 编辑用户权限修复版本');
    console.log('用户:', user.username);
    console.log('原始权限:', user.permissions);
    console.log('权限类型:', typeof user.permissions);
    console.log('是否为数组:', Array.isArray(user.permissions));

    // 🔧 使用用户实际权限，不强制修复
    let userPermissions = Array.isArray(user.permissions) ? [...user.permissions] : [];

    console.log('🔧 使用用户实际权限');
    console.log('用户:', user.username);
    console.log('原始权限:', user.permissions);
    console.log('权限数量:', userPermissions.length);

    // 🔧 调试：检查PERMISSIONS对象
    console.log('🔧 PERMISSIONS对象:', PERMISSIONS);
    console.log('🔧 PERMISSIONS键数量:', Object.keys(PERMISSIONS).length);
    console.log('🔧 Object.entries结果:', Object.entries(PERMISSIONS));

    console.log('📋 最终编辑权限:', userPermissions);
    console.log('权限数量:', userPermissions.length);

    // 🔧 调试：检查每个权限的包含情况
    Object.keys(PERMISSIONS).forEach(key => {
        const hasPermission = userPermissions.includes(key);
        console.log(`权限 ${key} (${PERMISSIONS[key].name}): ${hasPermission ? '✓ 有' : '✗ 无'}`);
    });

    // 🔧 确保权限选项正确生成
    const permissionEntries = Object.entries(PERMISSIONS || {});
    console.log('🔧 权限条目数量:', permissionEntries.length);

    // 创建权限选项HTML
    const permissionsHTML = permissionEntries.map(([key, permission]) => `
        <div class="permission-item">
            <label class="permission-label">
                <input type="checkbox" name="edit-permissions" value="${key}" ${userPermissions.includes(key) ? 'checked' : ''}>
                <span class="permission-icon">${permission.icon || '🔧'}</span>
                <div class="permission-info">
                    <div class="permission-name">${permission.name || key}</div>
                    <div class="permission-desc">${permission.description || ''}</div>
                </div>
            </label>
        </div>
    `).join('');

    // 创建编辑用户模态对话框
    const modalHTML = `
        <div id="edit-user-modal" class="modal-overlay" style="display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0,0,0,0.5) !important; z-index: 9999 !important; align-items: center !important; justify-content: center !important;">
            <div class="modal-content" style="max-width: 90% !important; max-height: 90% !important; overflow-y: auto !important; background: white !important; border-radius: 15px !important; box-shadow: 0 20px 40px rgba(0,0,0,0.2) !important;">
                <div class="modal-header">
                    <h3>
                        <span class="material-icons">✏️</span>
                        编辑用户 - ${user.username}
                    </h3>
        <button class="modal-close" data-admin-action="closeEditUserModal">
                        <span class="material-icons">✖️</span>
                    </button>
                </div>
                <form id="edit-user-form" class="modal-body">
                    <!-- 基本信息分组 -->
                    <div class="form-section">
                        <div class="form-section-title">👤 基本信息</div>
                        <div class="form-group">
                            <label for="edit-username">🎯 用户名 *</label>
                            <input type="text" id="edit-username" value="${user.username}" placeholder="请输入用户名" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-email">📧 邮箱</label>
                            <input type="email" id="edit-email" value="${user.email || ''}" placeholder="请输入邮箱（可选）">
                        </div>
                        <div class="form-group">
                            <label for="edit-role">⭐ 用户类型</label>
                            <select id="edit-role">
                                <option value="normal" ${user.role === 'normal' ? 'selected' : ''}>👤 普通用户</option>
                                <option value="vip" ${user.role === 'vip' ? 'selected' : ''}>⭐ VIP用户</option>
                            </select>
                        </div>
                    </div>

                    <!-- 安全设置分组 -->
                    <div class="form-section">
                        <div class="form-section-title">🔒 安全设置</div>
                        <div class="form-group">
                            <label for="edit-password">🔑 新密码（留空则不修改）</label>
                            <input type="password" id="edit-password" placeholder="输入新密码（可选）">
                        </div>
                    </div>

                    <!-- 权限设置分组 -->
                    <div class="form-group">
                        <label>⚙️ 功能权限 (${permissionEntries.length}个选项)</label>
                        <div class="permissions-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; margin-top: 1rem; max-height: 400px; overflow-y: auto; padding: 1rem; background: rgba(var(--theme-primary-rgb), 0.03); border-radius: 14px; border: 2px solid rgba(var(--theme-primary-rgb), 0.1);">
                            ${permissionsHTML}
                        </div>
                        <div style="margin-top: 10px; color: #666; font-size: 0.9rem;">
                            💡 提示：选择用户可以使用的功能权限
                        </div>
                    </div>
                </form>
                <div class="modal-footer">
                <button type="button" class="admin-btn secondary" data-admin-action="closeEditUserModal">
                        <span class="material-icons">❌</span>
                        取消
                    </button>
                    <button type="submit" form="edit-user-form" class="admin-btn">
                        <span class="material-icons">✅</span>
                        保存修改
                    </button>
                </div>
            </div>
        </div>
    `;

    console.log('🔧 插入模态框HTML到页面...');
    appendAdminMarkup(document.body, modalHTML);
    console.log('🔧 模态框已插入，检查DOM元素...');

    // 验证模态框是否正确插入
    const modalElement = document.getElementById('edit-user-modal');
    const permissionsGrid = modalElement ? modalElement.querySelector('.permissions-grid') : null;
    const checkboxes = permissionsGrid ? permissionsGrid.querySelectorAll('input[type="checkbox"]') : [];

    console.log('🔧 模态框元素:', modalElement ? '✅ 找到' : '❌ 未找到');
    console.log('🔧 权限网格:', permissionsGrid ? '✅ 找到' : '❌ 未找到');
    console.log('🔧 复选框数量:', checkboxes.length);
    console.log('🔧 生成的HTML长度:', modalHTML.length);

    // 🔧 重要修复：在模态框创建后立即修复权限复选框状态
    setTimeout(() => {
        console.log('🔧 修复权限复选框状态...');

        // 重新获取用户权限（确保是最新的）
        const updatedUsers = window.UserStorage.getUsers();
        const updatedUser = updatedUsers.find(u => u.id === userId);

        if (updatedUser) {
            const updatedPermissions = Array.isArray(updatedUser.permissions) ? [...updatedUser.permissions] : [];
            console.log('📋 最新用户权限:', updatedPermissions);

            // 重新设置所有复选框状态
            const checkboxes = document.querySelectorAll('input[name="edit-permissions"]');
            checkboxes.forEach(checkbox => {
                const shouldBeChecked = updatedPermissions.includes(checkbox.value);
                checkbox.checked = shouldBeChecked;

                console.log(`复选框 ${checkbox.value} (${PERMISSIONS[checkbox.value]?.name || checkbox.value}): ${shouldBeChecked ? '✓ 选中' : '✗ 未选中'}`);
            });

            console.log('✅ 权限复选框状态已修复');
        } else {
            console.error('❌ 无法获取最新用户数据');
        }
    }, 100);

    // 绑定表单提交事件
    const form = document.getElementById('edit-user-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔧 表单提交事件触发');
            console.log('🔧 阻止默认提交行为');
            handleEditUser(userId);
        });
    } else {
        console.error('❌ 未找到编辑用户表单');
    }

    // 🔧 添加保存按钮的直接点击事件处理（备用方案）
    const saveButton = document.querySelector('button[type="submit"][form="edit-user-form"]');
    if (saveButton) {
        saveButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔧 保存按钮点击事件触发');
            handleEditUser(userId);
        });
        console.log('✅ 保存按钮事件已绑定');
    } else {
        console.log('⚠️ 未找到保存按钮');
    }
}

function isStoredCredentialHash(credential) {
    return typeof credential === 'string' && credential.includes(':');
}

async function verifyCredentialIfPossible(inputCredential, storedCredential) {
    if (!inputCredential || !storedCredential) {
        return false;
    }

    if (isStoredCredentialHash(storedCredential) && window.Security?.Password?.verifyPassword) {
        return window.Security.Password.verifyPassword(inputCredential, storedCredential);
    }

    return inputCredential === storedCredential;
}

async function hashCredentialIfPossible(credential) {
    if (window.Security?.Password?.hashPassword) {
        return window.Security.Password.hashPassword(credential);
    }
    return credential;
}

// 处理编辑用户
async function handleEditUser(userId) {
    const username = document.getElementById('edit-username').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const role = document.getElementById('edit-role').value;
    const editedCredential = document.getElementById('edit-password').value;

    if (!username) {
        alert('用户名不能为空');
        return;
    }

    // 🔧 简化权限获取逻辑，避免复杂操作
    console.log('🔧 开始获取用户权限...');
    const allCheckboxes = document.querySelectorAll('input[name="edit-permissions"]');
    let selectedPermissions = [];

    console.log(`找到 ${allCheckboxes.length} 个权限复选框`);

    // 简单直接地获取选中的权限
    allCheckboxes.forEach((checkbox, index) => {
        if (checkbox.checked) {
            selectedPermissions.push(checkbox.value);
            console.log(`✓ 选中权限: ${checkbox.value} (${PERMISSIONS[checkbox.value]?.name || checkbox.value})`);
        }
    });

    // 🔧 移除所有强制权限限制，完全尊重管理员选择
    if (username === 'WQFG') {
        console.log('🔧 检测到WQFG用户，完全尊重管理员权限选择...');

        // 完全移除权限限制，使用管理员选择的所有权限
        // 不再进行任何过滤

        console.log('🔧 WQFG用户最终权限:', selectedPermissions);
        console.log('🔧 权限数量:', selectedPermissions.length);

        // 只有在完全没有任何权限时才设置默认权限
        if (selectedPermissions.length === 0) {
            selectedPermissions = ['add-task', 'quadrant-view'];
            console.log('⚠️ WQFG用户完全没有选择权限，设置基础权限');
        }
    }

    // 确保至少有一个权限
    if (selectedPermissions.length === 0) {
        alert('请至少选择一个权限');
        return;
    }

    console.log('🔧 最终选中的权限:', selectedPermissions);
    console.log('🔧 权限数量:', selectedPermissions.length);

    const users = window.UserStorage.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        alert('用户不存在');
        return;
    }

    // 检查用户名是否与其他用户冲突
    const existingUser = users.find(u => u.username === username && u.id !== userId);
    if (existingUser) {
        alert('用户名已存在，请选择其他用户名');
        return;
    }

    // 🔧 简化权限保存逻辑
    // 去重并确保权限是数组
    const cleanPermissions = [...new Set(selectedPermissions)];

    console.log('🔧 清理后的权限:', cleanPermissions);

    // 更新用户信息
    users[userIndex].username = username;
    users[userIndex].email = email;
    users[userIndex].role = role;
    users[userIndex].permissions = cleanPermissions;
    if (editedCredential) {
        const passwordHash = await hashCredentialIfPossible(editedCredential);
        users[userIndex].password = passwordHash;
        users[userIndex].passwordMigrated = passwordHash !== editedCredential;
    }

    console.log('🔧 准备保存的用户数据:', {
        username: users[userIndex].username,
        permissions: users[userIndex].permissions,
        permissionsCount: users[userIndex].permissions.length
    });

    // 简单直接的保存逻辑
    try {
        window.UserStorage.setUsers(users);
        console.log('✅ 用户数据已保存');

        // 验证保存结果
        const savedUsers = window.UserStorage.getUsers();
        const savedUser = savedUsers.find(u => u.id === userId);

        if (savedUser) {
            console.log('✅ 保存验证成功:', savedUser.permissions);
            console.log('📋 保存后权限数量:', savedUser.permissions.length);

            // 🔧 详细验证：检查是否与预期一致
            const isCorrect = JSON.stringify(savedUser.permissions) === JSON.stringify(cleanPermissions);
            console.log('📋 权限一致性检查:', isCorrect ? '✅ 一致' : '❌ 不一致');

            if (!isCorrect) {
                console.error('❌ 保存的权限与预期不符:');
                console.error('  预期权限:', cleanPermissions);
                console.error('  实际权限:', savedUser.permissions);
            }

            // 🔧 特殊验证：如果是WQFG用户，确保权限保存正确
            if (savedUser.username === 'WQFG') {
                console.log('🔧 WQFG用户权限特别验证:');
                console.log('  保存权限:', savedUser.permissions);
                console.log('  权限是否为空:', savedUser.permissions.length === 0);
            }

            // 获取权限名称
            const permissionNames = cleanPermissions.map(p => {
                const permissionNameMap = {
                    'add-task': '添加任务',
                    'quadrant-view': '四象限视图',
                    'dashboard': '可视化看板',
                    'review': '顶级复盘',
                    'templates': '任务模板',
                    'more-features': '更多功能',
                    'fortune': '每日一签',
                    'habit-tracker': '习惯打卡',
                    'pomodoro': '番茄专注',
                    'countdown': '倒数日'
                };
                return permissionNameMap[p] || PERMISSIONS[p]?.name || p;
            }).join('、');

            alert(`用户信息修改成功！\n权限：${permissionNames}`);
            closeEditUserModal();
            loadUserList();
        } else {
            alert('保存失败：找不到用户数据');
        }

    } catch (error) {
        console.error('❌ 保存失败:', error);
        alert('保存失败: ' + error.message);
    }
}

// 关闭编辑用户模态框
function closeEditUserModal() {
    const modal = document.getElementById('edit-user-modal');
    if (modal) {
        modal.remove();
    }
}

// 删除用户
function deleteUser(userId) {
    if (confirm('确定要删除这个用户吗？')) {
        const users = window.UserStorage.getUsers();
        const updatedUsers = users.filter(user => user.id !== userId);
        window.UserStorage.setUsers(updatedUsers);
        alert('用户删除成功！');
        loadUserList();
    }
}

// 修改密码
async function changePassword() {
    const currentCredential = document.getElementById('current-password').value;
    const newCredential = document.getElementById('new-password').value;
    const confirmCredential = document.getElementById('confirm-password').value;

    if (!currentCredential || !newCredential || !confirmCredential) {
        alert('请填写所有字段');
        return;
    }

    if (newCredential !== confirmCredential) {
        alert('新密码和确认密码不匹配');
        return;
    }

    if (newCredential.length < 8) {
        alert('新密码至少需要8位');
        return;
    }

    const storedAdminCredential = window.AdminStorage.getRaw('adminPassword') || '';
    if (!(await verifyCredentialIfPossible(currentCredential, storedAdminCredential))) {
        alert('当前密码不正确');
        return;
    }

    const hashedCredential = await hashCredentialIfPossible(newCredential);
    window.AdminStorage.setAdminPassword(hashedCredential);
    window.AdminStorage.addPasswordChangeLog({ action: 'password_changed', note: 'admin page update' });
    alert('密码修改成功！');

    // 清空表单
    document.getElementById('change-password-form').reset();
}

// AI服务配置管理
function switchAIService(serviceName) {
    // 切换标签页
    document.querySelectorAll('.service-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-ai-service="${serviceName}"]`)?.classList.add('active');

    // 切换配置面板
    document.querySelectorAll('.service-config').forEach(config => {
        config.classList.remove('active');
    });
    document.getElementById(`${serviceName}-config`).classList.add('active');

    // 加载已保存的配置
    loadAIServiceConfig(serviceName);
}

// 加载AI服务配置到输入框
async function loadAIServiceConfig(serviceName) {
    try {
        let aiConfig = null;

        // 优先从加密存储读取
        if (window.secureStorage) {
            await window.secureStorage.ready();
            aiConfig = await window.secureStorage.getSecure('aiConfig');
        }

        // 降级：从 localStorage 读取
        if (!aiConfig) {
            const plainConfig = window.AdminStorage.getRaw('aiConfig');
            if (plainConfig) {
                aiConfig = JSON.parse(plainConfig);
            }
        }

        if (!aiConfig) aiConfig = {};

        const serviceConfig = aiConfig[serviceName];

        // 根据服务名称获取正确的输入框ID
        const inputId = getAIServiceInputId(serviceName);
        const input = document.getElementById(inputId);

        // 🔧 优化：只有当 serviceConfig 存在且 credential 有值时才显示已配置
        const hasConfiguredCredential = serviceConfig?.apiKey &&
                              serviceConfig.apiKey.length > 0;

        if (hasConfiguredCredential && input) {
            // 兼容旧的 provider credential 字段
            let serviceCredential = serviceConfig.apiKey || serviceConfig.api;

            // 如果使用的是旧的 provider credential 字段，迁移到兼容存储字段并加密
            if (serviceConfig.api && !serviceConfig.apiKey) {
                console.log('⚠️ 检测到旧的api字段，正在迁移到兼容存储字段...');
                serviceCredential = serviceConfig.api;
                // 检查是否需要加密
                if (!serviceCredential.includes('==') && serviceCredential.length > 50) {
                    // 明文，需要加密
                    serviceCredential = encryptApiKey(serviceCredential);
                    console.log('✅ 已加密并迁移到兼容存储字段');
                } else {
                    console.log('✅ 已迁移到兼容存储字段');
                }
                // 更新配置
                aiConfig[serviceName] = {
                    enabled: serviceConfig.enabled || true,
                    apiKey: serviceCredential
                };
                // 删除旧的api字段
                delete aiConfig[serviceName].api;
                // 保存更新后的配置到加密存储
                if (window.secureStorage) {
                    await window.secureStorage.setSecure('aiConfig', aiConfig);
                    window.AdminStorage.removeKey('aiConfig'); // 清除明文
                } else {
                    window.AdminStorage.setRaw('aiConfig', JSON.stringify(aiConfig));
                }
                // 更新本地引用
                serviceConfig.apiKey = serviceCredential;
                delete serviceConfig.api;
            }

            // 检查兼容存储字段是否为明文（未加密），如果是明文则自动迁移到加密存储
            if (serviceConfig.apiKey) {
                let encryptedKey = serviceConfig.apiKey;
                if (!encryptedKey.includes('==') && encryptedKey.length > 50) {
                    // 可能是明文API KEY，需要迁移
                    console.log('⚠️ 检测到明文API KEY，正在迁移到加密存储...');
                    encryptedKey = encryptApiKey(encryptedKey);
                    aiConfig[serviceName].apiKey = encryptedKey;
                    if (window.secureStorage) {
                        await window.secureStorage.setSecure('aiConfig', aiConfig);
                        window.AdminStorage.removeKey('aiConfig');
                    } else {
                        window.AdminStorage.setRaw('aiConfig', JSON.stringify(aiConfig));
                    }
                    console.log('✅ API KEY已迁移到加密存储');
                }
            }

            // 🔧 修复：如果 credential 是加密的，先解密再存储
            let decryptedKey = serviceCredential;
            if (serviceCredential && serviceCredential.includes('==')) {
                // 加密的 Key，需要解密
                try {
                    decryptedKey = decryptApiKey(serviceCredential);
                    console.log('🔓 已解密 API Key');
                } catch (e) {
                    console.warn('⚠️ 解密失败，使用原始值:', e);
                    decryptedKey = serviceCredential;
                }
            }

            // 🔧 优化：显示掩码字符（保持良好的用户体验）
            // 使用 • 字符作为掩码，长度与原 API Key 相同
            const maskLength = Math.max(40, decryptedKey?.length || 0);
            const maskedKey = '•'.repeat(maskLength);

            // 将真实的 API Key 存储在 dataset 中
            input.dataset.credential = decryptedKey;
            input.value = maskedKey; // 显示掩码字符
            input.placeholder = '';
            input.style.color = '#4CAF50';
            input.readOnly = true; // 设置为只读，防止用户编辑掩码

            // 添加点击事件：点击时清空，允许用户重新输入
            if (input.dataset.maskClickBound !== 'true') {
                input.dataset.maskClickBound = 'true';
                input.addEventListener('click', function() {
                    if (this.value && this.value.startsWith('•')) {
                        this.value = '';
                        this.readOnly = false;
                        this.placeholder = '请输入新的 API Key';
                        this.style.color = '';
                    }
                });
            }

            // 添加配置状态指示
            const statusIndicator = document.createElement('small');
            statusIndicator.textContent = '✅ 已配置';
            statusIndicator.style.color = '#4CAF50';
            statusIndicator.style.fontWeight = 'bold';

            // 移除旧的状态指示
            const oldStatus = input.parentNode.querySelector('.config-status');
            if (oldStatus) {
                oldStatus.remove();
            }

            // 添加新的状态指示
            statusIndicator.className = 'config-status';
            input.parentNode.appendChild(statusIndicator);

            console.log(`✅ ${serviceName}配置已加载`);
        } else if (input) {
            // 🔧 优化：未配置时清空所有状态
            input.value = '';
            input.placeholder = `请输入${AI_SERVICE_PRESETS[serviceName]?.name || serviceName} API Key`;
            input.style.color = '';
            input.readOnly = false; // 确保可编辑
            input.dataset.credential = ''; // 清空 dataset

            // 移除状态指示
            const oldStatus = input.parentNode.querySelector('.config-status');
            if (oldStatus) {
                oldStatus.remove();
            }

            // 移除点击事件（如果有）
            input.dataset.maskClickBound = '';

            console.log(`⚠️ ${serviceName}配置未找到`);
        } else {
            console.warn(`AI service config input is not mounted: ${serviceName}`);
        }
    } catch (error) {
        console.error('加载AI服务配置失败:', error);
    }
}

// 保存AI服务配置
async function saveAIServiceConfig(serviceName, event, options = {}) {
    const silent = Boolean(options.silent);
    // 🔧 阻止事件冒泡和默认行为，防止触发表单提交
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // 根据服务名称获取正确的输入框ID
    const inputId = getAIServiceInputId(serviceName);
    const credentialInput = document.getElementById(inputId);

    if (!credentialInput) {
        console.error(`找不到输入框: ${inputId}`);
        alert('找不到API Key输入框，请刷新页面重试');
        return;
    }

    // 🔧 修复：优先从 dataset 读取已配置的 API Key，如果没有则从输入框读取新值
    let serviceCredential = credentialInput.value.trim();

    // 如果输入框为空但 dataset 中有已配置的 Key，说明用户没有修改
    if (!serviceCredential && credentialInput.dataset.credential) {
        console.log('📋 使用已配置的 API Key');
        serviceCredential = credentialInput.dataset.credential;
    }

    if (!serviceCredential) {
        alert('请输入API Key');
        return;
    }

    try {
        console.log(`🔧 开始保存${serviceName}配置...`);

        // 测试API Key
        console.log('🧪 测试API Key...');
        const isValid = await testAIServiceKey(serviceName, serviceCredential);

        if (isValid) {
            console.log('✅ API Key测试通过，开始保存配置...');

            // 保存到AI服务管理器
            if (window.aiServiceManager) {
                await window.aiServiceManager.setAPIKey(serviceName, serviceCredential);
                console.log('✅ 已保存到AI服务管理器');
            } else {
                // 读取现有配置
                let aiConfig = {};
                if (window.secureStorage) {
                    await window.secureStorage.ready();
                    aiConfig = await window.secureStorage.getSecure('aiConfig') || {};
                }

                // 降级：从 localStorage 读取
                if (!aiConfig || Object.keys(aiConfig).length === 0) {
                    const plainConfig = window.AdminStorage.getRaw('aiConfig');
                    if (plainConfig) {
                        aiConfig = JSON.parse(plainConfig);
                    }
                }

                // 保存到加密存储（API KEY明文，由SecureStorage加密）
                aiConfig[serviceName] = {
                    enabled: true,
                    apiKey: serviceCredential // 存储明文，由SecureStorage统一加密
                };
                aiConfig.currentService = serviceName;

                if (window.secureStorage) {
                    await window.secureStorage.setSecure('aiConfig', aiConfig);
                    window.AdminStorage.removeKey('aiConfig'); // 清除明文
                    console.log('✅ 已加密保存到安全存储');
                } else {
                    // 降级方案：使用旧的加密方式
                    aiConfig[serviceName].apiKey = encryptApiKey(serviceCredential);
                    window.AdminStorage.setRaw('aiConfig', JSON.stringify(aiConfig));
                    console.log('✅ 已加密保存到localStorage（降级方案）');
                }
            }

            // 重新加载配置显示
            setTimeout(() => {
                loadAIServiceConfig(serviceName);
            }, 100);

            alert(`${serviceName} API Key配置成功！`);
            console.log(`🎉 ${serviceName}配置保存成功`);
        } else {
            console.error('❌ API Key测试失败');
            alert('API Key无效，请检查后重试。\n\n可能的原因：\n1. API Key格式错误\n2. API Key已过期\n3. 网络连接问题');
        }
    } catch (error) {
        console.error('❌ 保存AI服务配置失败:', error);
        alert(`配置保存失败: ${error.message}\n\n请检查控制台获取详细错误信息。`);
    }
}

// 测试AI服务API Key
async function testAIServiceKey(serviceName, serviceCredential) {
    const preset = AI_SERVICE_PRESETS[serviceName];
    if (!preset) {
        console.error('未知AI服务:', serviceName);
        return false;
    }

    try {
            const credentialConfigured = Boolean(serviceCredential);
            console.log('AI credential test started.', { serviceName, credentialConfigured });

        // 确保API Key是有效的字符串
        if (!serviceCredential || typeof serviceCredential !== 'string') {
            console.error('API Key无效或格式错误');
            return false;
        }

        // 🔧 修复：只移除首尾空格，不移除中间字符
        // 之前的正则 /[^\x20-\x7E]/g 会错误地移除 API Key 中的有效字符
        const cleanCredential = serviceCredential.trim();

        if (cleanCredential.length === 0) {
            console.error('API Key为空');
            return false;
        }

        const requestHeaders = buildAIServiceTestHeaders(preset, cleanCredential);
        const requestBody = buildAIServiceTestBody(preset);

        const response = await fetch(preset.endpoint, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody)
        });

        console.log('📥 API测试响应:', response.status, response.statusText);

        if (response.ok) {
            console.log('✅ API Key测试成功');
            return true;
        } else {
            const errorText = await response.text();
                console.error('AI credential test failed.', { status: response.status });
            return false;
        }

    } catch (error) {
        console.error('❌ 测试API Key异常:', error);
        return false;
    }
}

function buildAIServiceTestHeaders(preset, serviceCredential) {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    if (preset.protocol === 'anthropic-messages') {
        headers['x-api-key'] = serviceCredential;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
        return headers;
    }

    headers.Authorization = `Bearer ${serviceCredential}`;
    return headers;
}

function buildAIServiceTestBody(preset) {
    if (preset.protocol === 'anthropic-messages') {
        return {
            model: preset.model,
            messages: [
                {
                    role: 'user',
                    content: 'test'
                }
            ],
            max_tokens: 5,
            temperature: 0.1,
            stream: false
        };
    }

    return {
        model: preset.model,
        messages: [
            {
                role: 'user',
                content: 'test'
            }
        ],
        max_tokens: 5,
        temperature: 0.1,
        stream: false
    };
}

// 测试API Key
async function legacyDeepSeekFortuneTestAIKey() {
    // 使用AI签语专用的API Key输入框
    const credentialInput = document.getElementById('deepseek-fortune-api-key');

    if (!credentialInput) {
        alert('找不到API Key输入框');
        return;
    }

    const aiCredential = credentialInput.value.trim();

    if (!aiCredential) {
        alert('请先输入API Key');
        return;
    }

    // 清理API Key，移除可能的特殊字符
    const cleanCredential = aiCredential.trim().replace(/[^\x20-\x7E]/g, '');

    if (cleanCredential !== aiCredential.trim()) {
        console.warn('API Key中检测到非ASCII字符，已进行清理');
    }

    const testBtn = document.querySelector('.admin-btn.ai');
    const originalText = testBtn.textContent;
    testBtn.textContent = '🔄 测试中...';
    testBtn.disabled = true;

    try {
        console.log('开始测试AI签语API Key...');
    const credentialConfigured = Boolean(cleanCredential);
    console.log('AI credential status:', credentialConfigured ? 'configured' : 'missing');

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanCredential}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个智慧的中文签语生成器，专门为用户生成每日励志签语。请用简洁优美的中文回复，格式为JSON：{"text":"签语内容","meaning":"含义解释","advice":"今日建议"}'
                    },
                    {
                        role: 'user',
                        content: '请生成一个关于努力奋斗的签语'
                    }
                ],
                temperature: 0.8,
                max_tokens: 200
            })
        });

        console.log('API响应状态:', response.status);

        if (response.ok) {
            const data = await response.json();

            if (data.choices && data.choices[0] && data.choices[0].message) {
                const content = data.choices[0].message.content;
                alert('API Key测试成功！\n\nAI生成内容：\n' + content);
            } else {
                alert('API Key测试成功，但响应格式异常');
            }
        } else {
            let errorMessage = '';
            try {
                const errorData = await response.json();
                console.error('API错误响应:', errorData);
                errorMessage = errorData.error?.message || JSON.stringify(errorData);
            } catch (e) {
                const errorText = await response.text();
            console.error('AI API error response received as text.');
                errorMessage = errorText;
            }

            if (response.status === 401) {
                alert('AI签语API Key无效或已过期，请检查Key是否正确\n\n错误详情: ' + errorMessage);
            } else if (response.status === 429) {
                alert('API调用频率过高，请稍后重试\n\n错误详情: ' + errorMessage);
            } else if (response.status === 400) {
                alert('API请求格式错误，可能是API Key格式不正确\n\n错误详情: ' + errorMessage);
            } else {
                alert(`AI签语API Key测试失败 (${response.status})\n\n错误详情: ${errorMessage}`);
            }
        }
    } catch (error) {
        console.error('测试API Key时发生错误:', error);
        alert('网络错误，请检查网络连接: ' + error.message);
    } finally {
        testBtn.textContent = originalText;
        testBtn.disabled = false;
    }
}

// 加载使用统计报表
// Override legacy DeepSeek-only tester: AI fortune now uses the shared multi-provider service config.
async function testAIKey() {
    const manager = window.aiServiceManager;
    if (!manager || typeof manager.getAvailableService !== 'function') {
        alert('AI 服务管理器未初始化，请刷新页面后重试');
        return false;
    }

    const serviceName = manager.currentService && manager._services?.[manager.currentService]?.credential
        ? manager.currentService
        : manager.getAvailableService();
    const serviceCredential = serviceName ? manager._services?.[serviceName]?.credential : null;

    if (!serviceName || !serviceCredential) {
        alert('请先在下方 AI 服务配置中保存任一服务商 API Key');
        return false;
    }

    const testBtn = document.querySelector('.admin-btn.ai');
    const originalText = testBtn ? testBtn.textContent : '';
    if (testBtn) {
        testBtn.textContent = '🧪 测试中...';
        testBtn.disabled = true;
    }

    try {
        const isValid = await testAIServiceKey(serviceName, serviceCredential);
        const displayName = AI_SERVICE_PRESETS[serviceName]?.name || serviceName;
        alert(isValid ? `${displayName} API Key 测试成功！` : `${displayName} API Key 测试失败，请检查 Key、模型额度或网络连接。`);
    } catch (error) {
        alert('AI 服务测试失败：' + error.message);
    } finally {
        if (testBtn) {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    }
}

function loadUsageReport() {
    try {
        // 从localStorage获取统计数据
        const stats = window.AdminStorage.getObject('aiFortuneStats');

        console.log('从localStorage加载的统计数据:', stats);
        console.log('aiFortuneStats loaded through AdminStorage.');

        // 更新报表显示
        document.getElementById('api-requests-count').textContent = stats.totalApiRequests || 0;
        document.getElementById('ai-generations-count').textContent = stats.totalAiGenerations || 0;
        document.getElementById('success-count').textContent = stats.successfulGenerations || 0;
        document.getElementById('failed-count').textContent = stats.failedGenerations || 0;

        // 计算成功率
        const successRate = stats.totalAiGenerations > 0 ?
            ((stats.successfulGenerations / stats.totalAiGenerations) * 100).toFixed(1) : 0;
        document.getElementById('success-rate').textContent = successRate + '%';

        // 显示最后重置时间
        if (stats.lastResetDate) {
            const resetDate = new Date(stats.lastResetDate);
            document.getElementById('last-reset').textContent = resetDate.toLocaleDateString();
        } else {
            document.getElementById('last-reset').textContent = '-';
        }

        console.log('使用统计报表已加载:', stats);
    } catch (error) {
        console.error('加载使用统计报表失败:', error);
    }
}

// 刷新使用统计报表
function refreshUsageReport() {
    loadUsageReport();
    console.log('使用统计报表已刷新');
}

// 重置使用统计
function resetUsageStats() {
    if (confirm('确定要重置所有使用统计数据吗？此操作不可恢复！')) {
        try {
            // 重置统计数据
            const resetStats = {
                totalApiRequests: 0,
                totalAiGenerations: 0,
                successfulGenerations: 0,
                failedGenerations: 0,
                lastResetDate: new Date().toISOString()
            };

            window.AdminStorage.setObject('aiFortuneStats', resetStats);
            window.AdminStorage.removeKey('aiFortuneDailyStats');

            // 刷新报表显示
            loadUsageReport();
            updateChart();

            alert('使用统计数据已重置！');
            console.log('使用统计数据已重置');
        } catch (error) {
            console.error('重置使用统计数据失败:', error);
            alert('重置统计数据失败，请重试');
        }
    }
}

// 折线图相关变量
let usageChart = null;

// 初始化折线图
function initChart() {
    const ctx = document.getElementById('usageChart');
    if (!ctx) return;

    const period = parseInt(document.getElementById('chartPeriod').value) || 7;
    const historicalData = getHistoricalData(period);

    if (usageChart) {
        usageChart.destroy();
    }

    usageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historicalData.labels,
            datasets: [
                {
                    label: 'API请求次数',
                    data: historicalData.data.map(d => d.apiRequests),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'AI签语生成',
                    data: historicalData.data.map(d => d.totalGenerations),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: '生成成功',
                    data: historicalData.data.map(d => d.successfulGenerations),
                    borderColor: '#FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: '生成失败',
                    data: historicalData.data.map(d => d.failedGenerations),
                    borderColor: '#F44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'white',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'white',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: 'white',
                        font: {
                            size: 10
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// 更新折线图
function updateChart() {
    initChart();
}

// 获取历史数据
function getHistoricalData(days = 30) {
    const dailyStats = window.AdminStorage.getObject('aiFortuneDailyStats');
    const endDate = new Date();

    const historicalData = [];
    const labels = [];

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(endDate.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = `${date.getMonth() + 1}/${date.getDate()}`;

        labels.unshift(dayLabel);

        const dayData = dailyStats[dateStr] || {
            apiRequests: 0,
            totalGenerations: 0,
            successfulGenerations: 0,
            failedGenerations: 0
        };

        historicalData.unshift(dayData);
    }

    return { labels, data: historicalData };
}

// 导出图表数据
function exportChartData() {
    try {
        const period = parseInt(document.getElementById('chartPeriod').value) || 7;
        const historicalData = getHistoricalData(period);

        const csvContent = [
            ['日期', 'API请求次数', 'AI签语生成', '生成成功', '生成失败'],
            ...historicalData.labels.map((label, index) => [
                label,
                historicalData.data[index].apiRequests,
                historicalData.data[index].totalGenerations,
                historicalData.data[index].successfulGenerations,
                historicalData.data[index].failedGenerations
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `AI签语使用统计_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('数据导出成功');
    } catch (error) {
        console.error('导出数据失败:', error);
        alert('导出数据失败，请重试');
    }
}

// 检查AI配置状态（管理员用）
async function checkAIConfigStatus() {
    console.log('🔍 检查AI配置状态:');

    // 检查加密存储中的配置
    let storageInfo = {
        encrypted: false,
        hasPlain: false,
        hasOldKey: false
    };

    if (window.secureStorage) {
        await window.secureStorage.ready();
        const hasEncrypted = await window.secureStorage.isSecure('aiConfig');
        storageInfo.encrypted = hasEncrypted;
    }

    // 检查是否还有明文配置（应该被迁移）
    const aiConfigPlain = window.AdminStorage.getRaw('aiConfig');
    storageInfo.hasPlain = !!aiConfigPlain;

    // 检查旧的DeepSeek配置
    const oldDeepSeekKey = window.AdminStorage.getRaw('deepSeekApiKey');
    storageInfo.hasOldKey = !!oldDeepSeekKey;

    console.log('存储状态:', {
        加密存储: storageInfo.encrypted ? '🔐 已加密' : '无',
        明文残留: storageInfo.hasPlain ? '⚠️ 是（建议迁移）' : '否',
        旧密钥: storageInfo.hasOldKey ? '⚠️ 存在（建议删除）' : '无'
    });

    // 检查AI服务管理器状态
    if (window.aiServiceManager) {
        const status = await window.aiServiceManager.debugAIConfig();
        console.log('AI服务管理器状态:', status);
    } else {
        console.log('❌ AI服务管理器未初始化');
    }

    return {
        storage: storageInfo,
        aiServiceManager: !!window.aiServiceManager,
        availableService: window.aiServiceManager ? window.aiServiceManager.getAvailableService() : null
    };
}

// 暴露到全局作用域，方便调试
window.checkAIConfigStatus = checkAIConfigStatus;
