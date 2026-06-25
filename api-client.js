/**
 * API 客户端 - 前端同步脚本
 * 将 localStorage 中的任务数据同步到 API 服务器
 *
 * Commercialization note:
 * This client talks to the optional local sync helper. Keep SaaS auth,
 * database sync, and AI proxy integrations behind future adapter APIs rather
 * than coupling production page code directly to this local endpoint.
 */

class TaskAPIClient {
    constructor(apiUrl = 'http://localhost:30301') {
        this.apiUrl = apiUrl;
        this.autoSyncInterval = null;
    }

    /**
     * 获取所有任务
     */
    async getAllTasks() {
        const response = await fetch(`${this.apiUrl}/api/tasks`);
        return await response.json();
    }

    /**
     * 按象限获取任务
     * @param {number} priority - 1-4
     */
    async getTasksByQuadrant(priority) {
        const response = await fetch(`${this.apiUrl}/api/tasks/quadrant/${priority}`);
        return await response.json();
    }

    /**
     * 获取未完成任务
     */
    async getActiveTasks() {
        const response = await fetch(`${this.apiUrl}/api/tasks/active`);
        return await response.json();
    }

    /**
     * 获取任务统计
     */
    async getStats() {
        const response = await fetch(`${this.apiUrl}/api/tasks/stats/summary`);
        return await response.json();
    }

    /**
     * 从 localStorage 读取任务并同步到服务器
     */
    async syncFromLocalStorage() {
        try {
            // 检查当前用户是否有 api-sync 权限
            const currentUser = window.SessionStorage?.getCurrentUser?.();
            const hasPermission = currentUser && Array.isArray(currentUser.permissions) &&
                currentUser.permissions.includes('api-sync');
            if (!hasPermission) {
                // 用户无 API 同步权限，跳过同步
                return { success: false, message: '用户无 API 同步权限' };
            }

            // 从 localStorage 获取任务
            const storageKey = this.getUserStorageKey('tasks');
            const tasksData = localStorage.getItem(storageKey);

            if (!tasksData) {
                console.log('⚠️ localStorage 中没有任务数据');
                return { success: false, message: '没有任务数据' };
            }

            const tasks = JSON.parse(tasksData);

            // 发送到 API 服务器
            const response = await fetch(`${this.apiUrl}/api/tasks/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tasks })
            });

            const result = await response.json();

            if (result.success) {
                console.log(`✅ 已同步 ${result.count} 个任务到 API 服务器`);
            }

            return result;
        } catch (error) {
            console.error('❌ 同步失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 从服务器恢复任务到 localStorage
     */
    async restoreToLocalStorage() {
        try {
            const response = await fetch(`${this.apiUrl}/api/tasks`);
            const result = await response.json();

            if (result.success) {
                const storageKey = this.getUserStorageKey('tasks');
                localStorage.setItem(storageKey, JSON.stringify(result.tasks));
                console.log(`✅ 已从 API 服务器恢复 ${result.count} 个任务`);

                // 触发页面刷新
                window.location.reload();
            }

            return result;
        } catch (error) {
            console.error('❌ 恢复失败:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 启动自动同步
     * @param {number} interval - 同步间隔（毫秒）
     */
    startAutoSync(interval = 60000) {
        if (this.autoSyncInterval) {
            console.log('⚠️ 自动同步已在运行');
            return;
        }

        console.log(`🔄 启动自动同步，间隔: ${interval / 1000} 秒`);
        this.syncFromLocalStorage(); // 立即同步一次

        this.autoSyncInterval = setInterval(() => {
            this.syncFromLocalStorage();
        }, interval);
    }

    /**
     * 停止自动同步
     */
    stopAutoSync() {
        if (this.autoSyncInterval) {
            clearInterval(this.autoSyncInterval);
            this.autoSyncInterval = null;
            console.log('⏹️ 已停止自动同步');
        }
    }

    /**
     * 获取用户特定的存储键
     */
    getUserStorageKey(key) {
        const currentUser = localStorage.getItem('currentUser');
        return currentUser ? `${currentUser}_${key}` : key;
    }

    /**
     * 测试 API 连接
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/api/health`);
            const result = await response.json();
            console.log('✅ API 服务器连接正常:', result);
            return true;
        } catch (error) {
            console.error('❌ 无法连接到 API 服务器:', error.message);
            return false;
        }
    }
}

// 导出
window.TaskAPIClient = TaskAPIClient;

// 如果直接运行此脚本，自动启动同步
if (typeof window !== 'undefined') {
    // 检查是否启用了 API 同步
    const enableAPISync = localStorage.getItem('enableAPISync') === 'true';

    if (enableAPISync) {
        const apiClient = new TaskAPIClient();
        const syncInterval = parseInt(localStorage.getItem('apiSyncInterval') || '60000');

        // 等待页面加载完成后再同步
        window.addEventListener('load', () => {
            setTimeout(() => {
                apiClient.testConnection().then(connected => {
                    if (connected) {
                        apiClient.startAutoSync(syncInterval);
                    }
                });
            }, 2000);
        });
    }
}
