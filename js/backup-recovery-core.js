(function () {
    'use strict';

    function initErrorRecovery() {
        // 数据恢复
        window.recoverData = () => {
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

                // 检查用户特定的备份数据
                let backupKey = 'taskBackups';
                if (currentUser && currentUser.id) {
                    backupKey = `taskBackups_${currentUser.id}`;
                }

                const backupsData = window.DataSyncStorage.getRaw(backupKey);
                if (backupsData) {
                    const backups = JSON.parse(backupsData);
                    if (backups.length > 0) {
                        const latestBackup = backups[0];
                        const tasks = latestBackup.tasks;

                        // 根据用户ID构建存储键
                        let storageKey = 'tasks';
                        if (currentUser && currentUser.id) {
                            storageKey = `tasks_${currentUser.id}`;
                        }

                        window.DataSyncStorage.setRaw(storageKey, JSON.stringify(tasks));
                        showErrorNotification('数据已从备份恢复', 'success');
                        location.reload();
                    } else {
                        showErrorNotification('没有可用的备份数据', 'warning');
                    }
                } else {
                    showErrorNotification('没有可用的备份数据', 'warning');
                }
            } catch (error) {
                console.error('数据恢复失败:', error);
                showErrorNotification('数据恢复失败', 'error');
            }
        };

        // 自动备份（使用新的备份系统）
        setInterval(() => {
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

                // 根据用户ID构建存储键
                let storageKey = 'tasks';
                if (currentUser && currentUser.id) {
                    storageKey = `tasks_${currentUser.id}`;
                }

                const tasks = window.DataSyncStorage.getRaw(storageKey);
                if (tasks) {
                    try {
                        const tasksArray = JSON.parse(tasks);
                        if (tasksArray.length > 0) {
                            // 创建自动备份
                            createAutoBackup(tasksArray, currentUser);
                        }
                    } catch (e) {
                        console.error('解析任务数据失败:', e);
                    }
                }
            } catch (error) {
                console.error('自动备份失败:', error);
            }
        }, 60000); // 每1分钟检查一次，更频繁的检查
    }

    function createInitialBackup() {
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

            // 根据用户ID构建存储键
            let storageKey = 'tasks';
            if (currentUser && currentUser.id) {
                storageKey = `tasks_${currentUser.id}`;
            }

            const tasks = window.DataSyncStorage.getRaw(storageKey);
            if (tasks) {
                try {
                    const tasksArray = JSON.parse(tasks);
                    if (tasksArray.length > 0) {
                        createAutoBackup(tasksArray, currentUser);
                    } else {
                    }
                } catch (e) {
                    console.error('解析任务数据失败:', e);
                }
            } else {
            }
        } catch (error) {
            console.error('创建初始备份失败:', error);
        }
    }

    function createManualBackup() {
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

            // 获取当前任务数据
            let storageKey = 'tasks';
            if (currentUser && currentUser.id) {
                storageKey = `tasks_${currentUser.id}`;
            }

            const tasks = window.DataSyncStorage.getRaw(storageKey);
            if (!tasks) {
                showPageNotification('没有任务数据可以备份');
                return;
            }

            try {
                const tasksArray = JSON.parse(tasks);
                if (tasksArray.length === 0) {
                    showPageNotification('没有任务数据可以备份');
                    return;
                }

                createAutoBackup(tasksArray, currentUser);
                showPageNotification('备份创建成功！');

            } catch (e) {
                console.error('解析任务数据失败:', e);
                showPageNotification('任务数据格式错误');
            }

        } catch (error) {
            console.error('手动创建备份失败:', error);
            showPageNotification('创建备份失败');
        }
    }

    function recordUserActivity(currentUser) {
        try {
            const userActivityKey = `userActivity_${currentUser?.id || 'default'}`;
            const userActivity = JSON.parse(window.DataSyncStorage.getRaw(userActivityKey) || '{"lastActivity": null, "activityCount": 0}');
            const now = new Date();

            // 更新用户活动记录
            userActivity.lastActivity = now.toISOString();
            userActivity.activityCount = (userActivity.activityCount || 0) + 1;
            userActivity.lastAction = 'task_save';

            window.DataSyncStorage.setRaw(userActivityKey, JSON.stringify(userActivity));
        } catch (error) {
            console.error('记录用户活动失败:', error);
        }
    }

    function createAutoBackup(tasksArray, currentUser) {
        try {
            // 获取当前用户
            let backupKey = 'taskBackups';
            if (currentUser && currentUser.id) {
                backupKey = `taskBackups_${currentUser.id}`;
            }

            // 获取现有备份
            let backups = [];
            const existingBackups = window.DataSyncStorage.getRaw(backupKey);
            if (existingBackups) {
                backups = JSON.parse(existingBackups);
            }

            // 智能备份策略：基于用户活动模式
            const userActivityKey = `userActivity_${currentUser?.id || 'default'}`;
            const userActivity = JSON.parse(window.DataSyncStorage.getRaw(userActivityKey) || '{"lastActivity": null, "activityCount": 0}');
            const now = new Date();

            // 更新用户活动记录
            userActivity.lastActivity = now.toISOString();
            userActivity.activityCount = (userActivity.activityCount || 0) + 1;
            window.DataSyncStorage.setRaw(userActivityKey, JSON.stringify(userActivity));

            // 智能备份策略：检查是否需要创建新备份
            const lastBackupTime = window.DataSyncStorage.getRaw('lastAutoBackupTime');
            const lastBackupData = window.DataSyncStorage.getRaw('lastAutoBackupData');

            // 计算当前任务数据的哈希值，用于检测数据变化
            const currentDataHash = JSON.stringify(tasksArray).length + tasksArray.length;
            const hasDataChanged = !lastBackupData || lastBackupData !== currentDataHash.toString();

            // 基于用户活动模式的智能备份策略
            const isActiveUser = userActivity.activityCount > 5; // 活跃用户
            const timeSinceLastActivity = userActivity.lastActivity ?
                (now - new Date(userActivity.lastActivity)) / 1000 : 0;

            if (lastBackupTime) {
                const timeDiff = now - new Date(lastBackupTime);

                // 活跃用户：更频繁的备份
                if (isActiveUser) {
                    if (!hasDataChanged && timeDiff < 120000) { // 活跃用户：2分钟内且数据未变化，跳过备份
                        return;
                    }
                    if (hasDataChanged && timeDiff < 15000) { // 活跃用户：15秒内且数据有变化，跳过备份
                        return;
                    }
                } else {
                    // 非活跃用户：较少的备份
                    if (!hasDataChanged && timeDiff < 600000) { // 非活跃用户：10分钟内且数据未变化，跳过备份
                        return;
                    }
                    if (hasDataChanged && timeDiff < 60000) { // 非活跃用户：1分钟内且数据有变化，跳过备份
                        return;
                    }
                }
            }


            // 创建新备份
            const backup = {
                id: 'backup_' + now.getTime(),
                createdAt: now.toISOString(),
                tasks: JSON.parse(JSON.stringify(tasksArray)), // 深拷贝
                totalTasks: tasksArray.length,
                completedTasks: tasksArray.filter(task => task.completed).length,
                pendingTasks: tasksArray.filter(task => !task.completed).length,
                pinnedTasks: tasksArray.filter(task => task.pinned).length,
                isManual: false,
                expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天后过期
            };

            backups.unshift(backup); // 添加到开头

            // 限制备份数量（最多保留7个）
            if (backups.length > 7) {
                backups = backups.slice(0, 7);
            }

            // 保存备份
            window.DataSyncStorage.setRaw(backupKey, JSON.stringify(backups));
            window.DataSyncStorage.setRaw('lastAutoBackupTime', now.toISOString());
            window.DataSyncStorage.setRaw('lastAutoBackupData', currentDataHash.toString());


        } catch (error) {
            console.error('创建自动备份失败:', error);
        }
    }

    function logError(type, error, filename = '', lineno = 0) {
        const errorLog = {
            type,
            message: error.message || error,
            stack: error.stack || '',
            filename,
            lineno,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // 保存到localStorage
        try {
            const logs = JSON.parse(window.DataSyncStorage.getRaw('error_logs') || '[]');
            logs.push(errorLog);

            // 只保留最近100条错误日志
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }

            window.DataSyncStorage.setRaw('error_logs', JSON.stringify(logs));
        } catch (e) {
            console.error('保存错误日志失败:', e);
        }
    }

    function getErrorLogs() {
        try {
            return JSON.parse(window.DataSyncStorage.getRaw('error_logs') || '[]');
        } catch (e) {
            console.error('获取错误日志失败:', e);
            return [];
        }
    }

    function clearErrorLogs() {
        window.DataSyncStorage.removeRaw('error_logs');
        showErrorNotification('错误日志已清除', 'success');
    }

    function exportErrorLogs() {
        const logs = getErrorLogs();
        const dataStr = JSON.stringify(logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        showErrorNotification('错误日志已导出', 'success');
    }

    window.initErrorRecovery = initErrorRecovery;
    window.createInitialBackup = createInitialBackup;
    window.createManualBackup = createManualBackup;
    window.recordUserActivity = recordUserActivity;
    window.createAutoBackup = createAutoBackup;
    window.logError = logError;
    window.getErrorLogs = getErrorLogs;
    window.clearErrorLogs = clearErrorLogs;
    window.exportErrorLogs = exportErrorLogs;
})();
