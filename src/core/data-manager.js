// 数据管理模块
// 从 script.js 中提取的数据导入导出功能

/**
 * 导出用户数据
 * @param {string} format - 导出格式 ('json' 或 'csv')
 * @returns {Object} 导出结果
 */
export function exportUserData(format = 'json') {
    try {
        const exportData = {
            version: '1.0',
            exportTime: new Date().toISOString(),
            data: {
                tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
                habits: JSON.parse(localStorage.getItem('habitTracker_habits') || '[]'),
                checkIns: JSON.parse(localStorage.getItem('habitTracker_checkIns') || '[]'),
                pomodoroSessions: JSON.parse(localStorage.getItem('pomodoroSessions') || '[]'),
                pomodoroSettings: JSON.parse(localStorage.getItem('pomodoroSettings') || '{}'),
                userBehaviorData: JSON.parse(localStorage.getItem('userBehaviorData') || '{}'),
                settings: {
                    theme: localStorage.getItem('theme') || 'light',
                    language: localStorage.getItem('language') || 'zh'
                }
            }
        };

        if (format === 'json') {
            return {
                success: true,
                data: exportData,
                blob: new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }),
                filename: `XXSG_数据备份_${new Date().toISOString().split('T')[0]}.json`
            };
        } else if (format === 'csv') {
            // 简化的CSV导出（仅任务）
            const tasks = exportData.data.tasks;
            const csvHeader = 'ID,标题,优先级,完成状态,创建时间\n';
            const csvRows = tasks.map(task =>
                `"${task.id}","${task.title}",${task.priority},${task.completed ? '是' : '否'},"${task.createdAt}"`
            ).join('\n');
            const csvContent = csvHeader + csvRows;

            return {
                success: true,
                data: csvContent,
                blob: new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }),
                filename: `XXSG_任务数据_${new Date().toISOString().split('T')[0]}.csv`
            };
        }

        throw new Error('不支持的导出格式');

    } catch (error) {
        console.error('❌ 导出数据失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 下载导出的数据
 * @param {Blob} blob - 数据Blob
 * @param {string} filename - 文件名
 */
export function downloadData(blob, filename) {
    try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('✅ 数据已下载:', filename);
        return true;
    } catch (error) {
        console.error('❌ 下载数据失败:', error);
        return false;
    }
}

/**
 * 导入用户数据
 * @param {File} file - 导入的文件
 * @param {boolean} merge - 是否合并数据（false则覆盖）
 * @returns {Promise<Object>} 导入结果
 */
export async function importUserData(file, merge = false) {
    try {
        const content = await file.text();
        const importData = JSON.parse(content);

        // 验证数据格式
        if (!importData.version || !importData.data) {
            throw new Error('无效的数据格式');
        }

        // 备份当前数据
        const backupResult = createBackup();
        console.log('📦 已创建备份:', backupResult.backupId);

        // 导入数据
        const data = importData.data;

        if (merge) {
            // 合并模式：合并新旧数据
            const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const newTasks = data.tasks || [];

            // 去重合并（基于ID）
            const taskMap = new Map();
            existingTasks.forEach(task => taskMap.set(task.id, task));
            newTasks.forEach(task => {
                if (!taskMap.has(task.id)) {
                    taskMap.set(task.id, task);
                }
            });

            localStorage.setItem('tasks', JSON.stringify(Array.from(taskMap.values())));

            // 其他数据类似处理
            if (data.habits) {
                const existingHabits = JSON.parse(localStorage.getItem('habitTracker_habits') || '[]');
                const habitMap = new Map();
                existingHabits.forEach(habit => habitMap.set(habit.id, habit));
                data.habits.forEach(habit => {
                    if (!habitMap.has(habit.id)) {
                        habitMap.set(habit.id, habit);
                    }
                });
                localStorage.setItem('habitTracker_habits', JSON.stringify(Array.from(habitMap.values())));
            }

        } else {
            // 覆盖模式：直接替换
            if (data.tasks) localStorage.setItem('tasks', JSON.stringify(data.tasks));
            if (data.habits) localStorage.setItem('habitTracker_habits', JSON.stringify(data.habits));
            if (data.checkIns) localStorage.setItem('habitTracker_checkIns', JSON.stringify(data.checkIns));
            if (data.pomodoroSessions) localStorage.setItem('pomodoroSessions', JSON.stringify(data.pomodoroSessions));
            if (data.pomodoroSettings) localStorage.setItem('pomodoroSettings', JSON.stringify(data.pomodoroSettings));
            if (data.userBehaviorData) localStorage.setItem('userBehaviorData', JSON.stringify(data.userBehaviorData));
            if (data.settings) {
                if (data.settings.theme) localStorage.setItem('theme', data.settings.theme);
                if (data.settings.language) localStorage.setItem('language', data.settings.language);
            }
        }

        console.log('✅ 数据导入成功');

        return {
            success: true,
            message: '数据导入成功',
            backupId: backupResult.backupId,
            itemsImported: {
                tasks: data.tasks?.length || 0,
                habits: data.habits?.length || 0,
                checkIns: data.checkIns?.length || 0,
                sessions: data.pomodoroSessions?.length || 0
            }
        };

    } catch (error) {
        console.error('❌ 导入数据失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 创建数据备份
 * @returns {Object} 备份结果
 */
export function createBackup() {
    try {
        const backupId = `backup_${Date.now()}`;
        const backupData = {
            id: backupId,
            timestamp: new Date().toISOString(),
            data: {
                tasks: localStorage.getItem('tasks'),
                habits: localStorage.getItem('habitTracker_habits'),
                checkIns: localStorage.getItem('habitTracker_checkIns'),
                pomodoroSessions: localStorage.getItem('pomodoroSessions'),
                pomodoroSettings: localStorage.getItem('pomodoroSettings'),
                userBehaviorData: localStorage.getItem('userBehaviorData')
            }
        };

        // 保存备份到localStorage
        const backups = JSON.parse(localStorage.getItem('dataBackups') || '[]');
        backups.push(backupData);

        // 只保留最近10个备份
        if (backups.length > 10) {
            backups.shift();
        }

        localStorage.setItem('dataBackups', JSON.stringify(backups));

        console.log('✅ 备份创建成功:', backupId);

        return {
            success: true,
            backupId: backupId,
            timestamp: backupData.timestamp
        };

    } catch (error) {
        console.error('❌ 创建备份失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 恢复备份
 * @param {string} backupId - 备份ID
 * @returns {Object} 恢复结果
 */
export function restoreBackup(backupId) {
    try {
        const backups = JSON.parse(localStorage.getItem('dataBackups') || '[]');
        const backup = backups.find(b => b.id === backupId);

        if (!backup) {
            throw new Error('备份不存在');
        }

        // 恢复数据
        const data = backup.data;
        if (data.tasks) localStorage.setItem('tasks', data.tasks);
        if (data.habits) localStorage.setItem('habitTracker_habits', data.habits);
        if (data.checkIns) localStorage.setItem('habitTracker_checkIns', data.checkIns);
        if (data.pomodoroSessions) localStorage.setItem('pomodoroSessions', data.pomodoroSessions);
        if (data.pomodoroSettings) localStorage.setItem('pomodoroSettings', data.pomodoroSettings);
        if (data.userBehaviorData) localStorage.setItem('userBehaviorData', data.userBehaviorData);

        console.log('✅ 备份恢复成功:', backupId);

        return {
            success: true,
            backupId: backupId,
            timestamp: backup.timestamp
        };

    } catch (error) {
        console.error('❌ 恢复备份失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 获取所有备份
 * @returns {Array} 备份列表
 */
export function getBackups() {
    try {
        const backups = JSON.parse(localStorage.getItem('dataBackups') || '[]');
        return backups.map(backup => ({
            id: backup.id,
            timestamp: backup.timestamp,
            date: new Date(backup.timestamp).toLocaleString('zh-CN')
        }));
    } catch (error) {
        console.error('❌ 获取备份列表失败:', error);
        return [];
    }
}

/**
 * 删除备份
 * @param {string} backupId - 备份ID
 * @returns {boolean} 是否删除成功
 */
export function deleteBackup(backupId) {
    try {
        const backups = JSON.parse(localStorage.getItem('dataBackups') || '[]');
        const filteredBackups = backups.filter(b => b.id !== backupId);
        localStorage.setItem('dataBackups', JSON.stringify(filteredBackups));

        console.log('✅ 备份已删除:', backupId);
        return true;
    } catch (error) {
        console.error('❌ 删除备份失败:', error);
        return false;
    }
}

/**
 * 清空所有数据
 * @param {boolean} createBackupFirst - 是否先创建备份
 * @returns {Object} 清空结果
 */
export function clearAllData(createBackupFirst = true) {
    try {
        let backupId = null;

        if (createBackupFirst) {
            const backupResult = createBackup();
            backupId = backupResult.backupId;
        }

        // 清空数据
        localStorage.removeItem('tasks');
        localStorage.removeItem('habitTracker_habits');
        localStorage.removeItem('habitTracker_checkIns');
        localStorage.removeItem('pomodoroSessions');
        localStorage.removeItem('pomodoroSettings');
        localStorage.removeItem('userBehaviorData');

        console.log('✅ 所有数据已清空');

        return {
            success: true,
            backupId: backupId
        };

    } catch (error) {
        console.error('❌ 清空数据失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 获取数据统计
 * @returns {Object} 数据统计
 */
export function getDataStats() {
    try {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const habits = JSON.parse(localStorage.getItem('habitTracker_habits') || '[]');
        const checkIns = JSON.parse(localStorage.getItem('habitTracker_checkIns') || '[]');
        const sessions = JSON.parse(localStorage.getItem('pomodoroSessions') || '[]');
        const backups = JSON.parse(localStorage.getItem('dataBackups') || '[]');

        // 计算存储大小
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }

        return {
            tasks: tasks.length,
            habits: habits.length,
            checkIns: checkIns.length,
            sessions: sessions.length,
            backups: backups.length,
            storageSize: totalSize,
            storageSizeFormatted: (totalSize / 1024).toFixed(2) + ' KB'
        };

    } catch (error) {
        console.error('❌ 获取数据统计失败:', error);
        return null;
    }
}
