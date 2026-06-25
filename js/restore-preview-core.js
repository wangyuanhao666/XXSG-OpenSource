(function () {
    'use strict';

function runtime() {
        return window.XXSGAppRuntime || {};
    }

    function showRestoreDataPreview() {

        // 获取当前用户 - 添加详细调试信息
        const userSessionLocal = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
        const userSessionSession = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');

        const userSession = userSessionLocal || userSessionSession;
        let currentUser = null;

        if (userSession) {
            try {
                const parsedSession = JSON.parse(userSession);

                // 检查会话结构
                if (parsedSession.user) {
                    // 新格式：{user: {...}, loginTime: '...', rememberMe: true}
                    currentUser = parsedSession.user;
                } else if (parsedSession.id) {
                    // 旧格式：直接是用户对象
                    currentUser = parsedSession;
                } else {
                }

            } catch (e) {
                console.error('解析用户会话失败:', e);
            }
        } else {
        }

        // 检查用户特定的备份数据
        let backupKey = 'taskBackups';
        let storageKey = 'tasks';
        if (currentUser && currentUser.id) {
            backupKey = `taskBackups_${currentUser.id}`;
            storageKey = `tasks_${currentUser.id}`;
        }


        // 检查所有可能的备份键
        const allKeys = Object.keys(localStorage);
        const backupKeys = allKeys.filter(key => key.startsWith('taskBackups'));

        const backupsData = window.DataSyncStorage.getRaw(backupKey);

        if (!backupsData) {
            // 如果没有找到用户特定的备份，检查是否有通用备份
            const generalBackup = window.DataSyncStorage.getRaw('taskBackups');
            if (generalBackup) {
                backupKey = 'taskBackups';
            } else {

                // 尝试从当前任务创建备份
                const currentTasks = window.DataSyncStorage.getRaw(storageKey);
                if (currentTasks) {
                    try {
                        const tasksArray = JSON.parse(currentTasks);
                        if (tasksArray.length > 0) {
                            createAutoBackup(tasksArray, currentUser);

                            // 重新检查备份
                            const newBackupsData = window.DataSyncStorage.getRaw(backupKey);
                            if (newBackupsData) {
                            } else {
                                showPageNotification('备份创建失败');
                                return;
                            }
                        } else {
                            showPageNotification('没有任务数据可以备份');
                            return;
                        }
                    } catch (e) {
                        console.error('解析任务数据失败:', e);
                        showPageNotification('任务数据格式错误');
                        return;
                    }
                } else {
                    showPageNotification('没有找到备份数据，也没有当前任务数据');
                    return;
                }
            }
        }

        try {
            const finalBackupData = window.DataSyncStorage.getRaw(backupKey);
            const backups = JSON.parse(finalBackupData);

            if (backups.length === 0) {
                showPageNotification('没有可用的备份数据');
                return;
            }

            // 获取最新的备份
            const latestBackup = backups[0];
            const backupTasks = latestBackup.tasks;

            if (backupTasks.length === 0) {
                showPageNotification('备份数据为空');
                return;
            }

            // 跳转到恢复数据页面

            window.location.href = `restore-page.html?v=${Date.now()}`;

        } catch (error) {
            console.error('解析备份数据失败:', error);
            showPageNotification('备份数据格式错误');
        }
    }

    function updateRestorePreview(backupTasks) {
        // 更新统计信息
        const total = backupTasks.length;
        const completed = backupTasks.filter(task => task.completed).length;
        const pending = total - completed;
        const pinned = backupTasks.filter(task => task.pinned).length;

        document.getElementById('backup-total-tasks').textContent = total;
        document.getElementById('backup-completed-tasks').textContent = completed;
        document.getElementById('backup-pending-tasks').textContent = pending;
        document.getElementById('backup-pinned-tasks').textContent = pinned;

        // 更新对比信息
        document.getElementById('current-tasks-count').textContent = (runtime().tasks || []).length;
        document.getElementById('backup-tasks-count').textContent = total;

        // 更新备份时间
        const backupTime = window.DataSyncStorage.getRaw('backup_time');
        if (backupTime) {
            document.getElementById('backup-time').textContent = new Date(backupTime).toLocaleString();
        } else {
            document.getElementById('backup-time').textContent = '未知';
        }

        // 更新任务列表预览
        updateBackupTasksList(backupTasks);
    }

    function updateBackupTasksList(backupTasks) {
        const container = document.getElementById('backup-tasks-list');
        if (!container) return;

        container.replaceChildren();

        // 统计显示的任务中的状态
        const displayedTasks = backupTasks.slice(0, 10);
        const displayedCompleted = displayedTasks.filter(task => task.completed).length;
        const displayedPending = displayedTasks.length - displayedCompleted;


        displayedTasks.forEach(task => {
            container.appendChild(createBackupTaskPreviewItem(task));
        });

        if (backupTasks.length > 10) {
            container.appendChild(createBackupTaskMoreItem(backupTasks.length - 10));
        }
    }

    function createBackupTaskPreviewItem(task) {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-preview-item';

        const title = document.createElement('div');
        title.className = 'task-preview-title';
        title.textContent = task.title || '';

        const status = document.createElement('div');
        status.className = `task-preview-status ${task.completed ? 'completed' : 'pending'}`;
        status.textContent = task.completed ? t('taskStatusCompleted') : t('taskStatusPending');

        const priority = document.createElement('div');
        priority.className = 'task-preview-priority';
        priority.textContent = getPriorityText(task.priority);

        taskItem.append(title, status, priority);
        return taskItem;
    }

    function createBackupTaskMoreItem(remainingCount) {
        const moreItem = document.createElement('div');
        moreItem.className = 'task-preview-item';

        const title = document.createElement('div');
        title.className = 'task-preview-title';
        title.style.color = 'var(--text-secondary)';
        title.style.fontStyle = 'italic';
        title.textContent = `还有 ${remainingCount} 个任务...`;

        moreItem.appendChild(title);
        return moreItem;
    }

    function closeRestorePreview() {
        const modal = document.getElementById('restore-preview-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function confirmRestoreData() {
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
        if (!backupsData) {
            showPageNotification('没有找到备份数据');
            return;
        }

        try {
            const backups = JSON.parse(backupsData);
            if (backups.length === 0) {
                showPageNotification('没有可用的备份数据');
                return;
            }

            // 获取最新的备份
            const latestBackup = backups[0];
            const backupTasks = latestBackup.tasks;

            if (backupTasks.length === 0) {
                showPageNotification('备份数据为空');
                return;
            }

            // 执行恢复
            runtime().tasks = backupTasks;
            runtime().saveTasks();
            runtime().render();
            closeRestorePreview();
            showPageNotification(`成功恢复${backupTasks.length}个任务`);
        } catch (error) {
            console.error('恢复备份数据失败:', error);
            showPageNotification('恢复备份数据失败，数据格式错误');
        }
    }

    function restoreTasksFromBackup() {
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
        if (!backupsData) {
            showPageNotification('没有找到备份数据');
            return;
        }

        try {
            const backups = JSON.parse(backupsData);
            if (backups.length === 0) {
                showPageNotification('没有可用的备份数据');
                return;
            }

            // 获取最新的备份
            const latestBackup = backups[0];
            const backupTasks = latestBackup.tasks;

            if (backupTasks.length === 0) {
                showPageNotification('备份数据为空');
                return;
            }

            if (confirm(`确定要恢复备份数据吗？这将覆盖当前的${(runtime().tasks || []).length}个任务，恢复${backupTasks.length}个任务。`)) {
                runtime().tasks = backupTasks;
                runtime().saveTasks();
                runtime().render();
                showPageNotification(`成功恢复${backupTasks.length}个任务`);
            }
        } catch (error) {
            console.error('恢复备份数据失败:', error);
            showPageNotification('恢复备份数据失败，数据格式错误');
        }
    }

    window.showRestoreDataPreview = showRestoreDataPreview;
    window.updateRestorePreview = updateRestorePreview;
    window.closeRestorePreview = closeRestorePreview;
    window.confirmRestoreData = confirmRestoreData;
    window.restoreTasksFromBackup = restoreTasksFromBackup;
})();
