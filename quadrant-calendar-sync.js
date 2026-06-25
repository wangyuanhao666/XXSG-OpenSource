// ==================== 四象限任务自动同步到日历功能 ====================

/**
 * 四象限任务日历同步器
 * 自动将四象限未完成任务同步到沉浸式自然日历
 */
const QuadrantTaskCalendarSync = {
    // 同步任务的前缀标识
    TASK_EVENT_PREFIX: 'sync-task-',

    // 象限到日历类型的映射
    quadrantToCalendarMap: {
        1: 'work',      // 重要且紧急 → 工作日程（蓝色）
        2: 'focus',     // 重要不紧急 → 深度专注（绿色）
        3: 'team',      // 不重要紧急 → 团队协作（紫色）
        4: 'personal'   // 不重要不紧急 → 个人生活（橙色）
    },

    /**
     * 自动同步未完成任务到日历
     * @param {boolean} forceRefresh - 是否强制刷新（移除已完成任务）
     */
    syncUncompletedTasks: function(forceRefresh = false) {
        console.log('🔄 开始同步四象限任务到日历...');

        try {
            // 1. 获取所有任务
            const tasks = this.getAllTasks();

            if (!tasks || tasks.length === 0) {
                console.log('📭 没有找到任务数据');
                return;
            }

            // 2. 过滤未完成任务
            const uncompletedTasks = tasks.filter(task => !task.completed);

            console.log(`📊 总任务: ${tasks.length}, 未完成: ${uncompletedTasks.length}`);

            // 3. 如果强制刷新，先移除所有同步的任务事件
            if (forceRefresh) {
                this.removeSyncedTasks();
            }

            // 4. 将未完成任务转换为日历事件
            const newEvents = uncompletedTasks
                .filter(task => {
                    // 检查是否已经同步过
                    const eventId = this.TASK_EVENT_PREFIX + task.id;
                    return !window.calendarEvents.some(event => event.id === eventId);
                })
                .map(task => this.taskToCalendarEvent(task));

            // 5. 添加新事件到日历
            if (newEvents.length > 0) {
                window.calendarEvents.push(...newEvents);

                // 保存到localStorage
                this.saveSyncedEvents(newEvents);

                console.log(`✅ 成功同步 ${newEvents.length} 个未完成任务到日历`);

                // 重新渲染日历
                this.refreshCalendarView();
            } else {
                console.log('ℹ️ 所有未完成任务已同步，无需重复同步');
            }

            // 6. 更新按钮提示
            this.updateSyncButtonTooltip(uncompletedTasks.length);

        } catch (error) {
            console.error('❌ 同步任务失败:', error);
        }
    },

    /**
     * 刷新同步：移除已完成的任务事件
     */
    refreshAndFilterCompleted: function() {
        console.log('🔄 刷新日历，移除已完成的任务...');

        try {
            // 1. 获取所有任务
            const tasks = this.getAllTasks();

            if (!tasks || tasks.length === 0) {
                console.log('📭 没有找到任务数据');
                return;
            }

            // 2. 获取已完成任务的ID集合
            const completedTaskIds = new Set(
                tasks
                    .filter(task => task.completed)
                    .map(task => task.id)
            );

            // 3. 移除日历中已完成的任务事件
            const beforeCount = window.calendarEvents.length;
            window.calendarEvents = window.calendarEvents.filter(event => {
                if (event.id && event.id.startsWith(this.TASK_EVENT_PREFIX)) {
                    const taskId = event.id.replace(this.TASK_EVENT_PREFIX, '');
                    return !completedTaskIds.has(taskId);
                }
                return true;
            });

            const removedCount = beforeCount - window.calendarEvents.length;

            if (removedCount > 0) {
                console.log(`✅ 已移除 ${removedCount} 个已完成任务事件`);

                // 更新localStorage
                this.updateLocalStorageEvents();

                // 重新渲染日历
                this.refreshCalendarView();
            } else {
                console.log('ℹ️ 没有已完成的任务需要移除');
            }

            // 4. 重新同步未完成任务
            this.syncUncompletedTasks(false);

        } catch (error) {
            console.error('❌ 刷新失败:', error);
        }
    },

    /**
     * 获取所有任务
     */
    getAllTasks: function() {
        try {
            let tasks = [];

            // 尝试从多个可能的位置读取任务数据
            const storageKeys = [
                'tasks',
                'quadrantTasks'
            ];

            // 尝试获取当前用户ID
            let currentUserId = '';
            try {
                currentUserId = localStorage.getItem('currentUserId') || '';
            } catch (e) {
                // 忽略错误
            }

            if (currentUserId) {
                storageKeys.push(`tasks_${currentUserId}`);
            }

            for (const key of storageKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            tasks = parsed;
                            console.log(`📦 从 ${key} 读取到 ${tasks.length} 个任务`);
                            break;
                        }
                    } catch (e) {
                        console.warn(`解析 ${key} 失败:`, e);
                    }
                }
            }

            return tasks;
        } catch (error) {
            console.error('获取任务失败:', error);
            return [];
        }
    },

    /**
     * 将任务转换为日历事件
     */
    taskToCalendarEvent: function(task) {
        // 截止日期，如果没有则使用今天
        let taskDate = new Date();
        if (task.dueDate) {
            taskDate = new Date(task.dueDate);
        } else if (task.deadline) {
            taskDate = new Date(task.deadline);
        }

        // 设置开始时间（上午9点）
        const startDate = new Date(taskDate);
        startDate.setHours(9, 0, 0, 0);

        // 设置结束时间（上午10点，默认1小时）
        const endDate = new Date(taskDate);
        endDate.setHours(10, 0, 0, 0);

        // 获取日历类型
        const calendarType = this.quadrantToCalendarMap[task.priority] || 'personal';

        // 获取颜色
        let color = '#f97316'; // 默认橙色
        if (window.calendarCustomTypes) {
            const calendarTypeInfo = window.calendarCustomTypes.find(type => type.id === calendarType);
            if (calendarTypeInfo) {
                color = calendarTypeInfo.color;
            }
        }

        return {
            id: this.TASK_EVENT_PREFIX + task.id,
            title: task.title || '未命名任务',
            calendar: calendarType,
            color: color,
            start: startDate,
            end: endDate,
            location: '四象限任务',
            attendees: [],
            description: task.description || '',
            // 标记为同步任务
            _syncedFromQuadrant: true,
            _originalTaskId: task.id,
            _taskPriority: task.priority
        };
    },

    /**
     * 移除所有同步的任务事件
     */
    removeSyncedTasks: function() {
        const beforeCount = window.calendarEvents.length;
        window.calendarEvents = window.calendarEvents.filter(event =>
            !event.id || !event.id.startsWith(this.TASK_EVENT_PREFIX)
        );
        const removedCount = beforeCount - window.calendarEvents.length;

        if (removedCount > 0) {
            console.log(`🗑️ 已移除 ${removedCount} 个旧的同步任务事件`);
        }
    },

    /**
     * 保存同步的事件到localStorage
     */
    saveSyncedEvents: function(newEvents) {
        try {
            // 读取现有的自定义事件
            let existingEvents = [];
            try {
                const saved = localStorage.getItem('calendar-custom-events');
                if (saved) {
                    existingEvents = JSON.parse(saved);
                }
            } catch (e) {
                console.warn('读取现有事件失败:', e);
            }

            // 过滤掉旧的同步任务事件
            existingEvents = existingEvents.filter(event =>
                !event.id || !event.id.startsWith(this.TASK_EVENT_PREFIX)
            );

            // 添加新的事件
            const eventsToSave = [
                ...existingEvents,
                ...newEvents.map(event => ({
                    id: event.id,
                    title: event.title,
                    calendar: event.calendar,
                    color: event.color,
                    start: event.start.toISOString(),
                    end: event.end.toISOString(),
                    location: event.location,
                    attendees: event.attendees,
                    description: event.description,
                    _syncedFromQuadrant: true,
                    _originalTaskId: event._originalTaskId,
                    _taskPriority: event._taskPriority
                }))
            ];

            // 保存到localStorage
            localStorage.setItem('calendar-custom-events', JSON.stringify(eventsToSave));
            console.log(`💾 已保存 ${newEvents.length} 个同步事件到localStorage`);

        } catch (error) {
            console.error('保存同步事件失败:', error);
        }
    },

    /**
     * 更新localStorage中的事件（移除已完成的）
     */
    updateLocalStorageEvents: function() {
        try {
            // 读取现有的自定义事件
            let existingEvents = [];
            try {
                const saved = localStorage.getItem('calendar-custom-events');
                if (saved) {
                    existingEvents = JSON.parse(saved);
                }
            } catch (e) {
                console.warn('读取现有事件失败:', e);
            }

            // 只保留非同步任务事件，以及当前calendarEvents中存在的同步事件
            const syncedEventIds = new Set(
                window.calendarEvents
                    .filter(event => event.id && event.id.startsWith(this.TASK_EVENT_PREFIX))
                    .map(event => event.id)
            );

            const eventsToSave = existingEvents.filter(event => {
                if (event.id && event.id.startsWith(this.TASK_EVENT_PREFIX)) {
                    return syncedEventIds.has(event.id);
                }
                return true;
            });

            // 保存到localStorage
            localStorage.setItem('calendar-custom-events', JSON.stringify(eventsToSave));
            console.log(`💾 已更新localStorage中的事件`);

        } catch (error) {
            console.error('更新localStorage事件失败:', error);
        }
    },

    /**
     * 刷新日历视图
     */
    refreshCalendarView: function() {
        try {
            // 重新渲染当前视图
            if (typeof window.renderWeekView === 'function') {
                window.renderWeekView();
            }
            if (typeof window.renderMonthView === 'function') {
                window.renderMonthView();
            }
            if (typeof window.renderMiniCalendar === 'function') {
                window.renderMiniCalendar();
            }

            console.log('🎨 日历视图已刷新');
        } catch (error) {
            console.warn('刷新日历视图失败:', error);
        }
    },

    /**
     * 更新同步按钮的提示文本
     */
    updateSyncButtonTooltip: function(uncompletedCount) {
        const syncBtn = document.getElementById('calendar-sync-tasks-btn');
        if (syncBtn) {
            syncBtn.title = `点击刷新同步（当前${uncompletedCount}个未完成任务）`;
        }
    },

    /**
     * 初始化自动同步
     */
    init: function(retryCount = 0) {
        const MAX_RETRIES = 20; // 最大重试次数（20 * 500ms = 10秒）

        console.log('🚀 初始化四象限任务自动同步...');

        // 确保calendarEvents可用
        if (!window.calendarEvents) {
            if (retryCount < MAX_RETRIES) {
                console.warn(`⚠️ calendarEvents 未定义，等待初始化... (${retryCount + 1}/${MAX_RETRIES})`);
                setTimeout(() => this.init(retryCount + 1), 500);
            } else {
                console.error('❌ calendarEvents 初始化超时，已达到最大重试次数');
                console.error('提示：请确保 script.js 在 quadrant-calendar-sync.js 之前加载');
            }
            return;
        }

        // 绑定刷新同步按钮事件
        const syncBtn = document.getElementById('calendar-sync-tasks-btn');
        if (syncBtn) {
            // 移除旧的事件监听器（如果有）
            const newSyncBtn = syncBtn.cloneNode(true);
            syncBtn.parentNode.replaceChild(newSyncBtn, syncBtn);

            // 添加新的事件监听器
            newSyncBtn.addEventListener('click', () => {
                console.log('🔄 用户点击刷新同步按钮');
                this.refreshAndFilterCompleted();

                // 显示提示消息
                if (typeof window.showNotification === 'function') {
                    window.showNotification('任务同步已刷新，已过滤已完成任务', 'success');
                } else {
                    alert('任务同步已刷新，已过滤已完成任务');
                }
            });
        }

        // 页面加载时自动同步
        setTimeout(() => {
            this.syncUncompletedTasks(false);
        }, 1000);
    }
};

// 当DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        QuadrantTaskCalendarSync.init();
    });
} else {
    // 等待script.js加载完成
    window.addEventListener('load', () => {
        setTimeout(() => {
            QuadrantTaskCalendarSync.init();
        }, 100);
    });
}

// 监听视图切换，当切换到日历视图时自动同步
const setupObserver = () => {
    const calendarView = document.getElementById('calendar-pro-view');
    if (calendarView) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (calendarView.style.display !== 'none') {
                        console.log('📍 切换到日历视图，自动同步任务...');
                        setTimeout(() => {
                            QuadrantTaskCalendarSync.syncUncompletedTasks(false);
                        }, 500);
                    }
                }
            });
        });

        observer.observe(calendarView, {
            attributes: true,
            attributeFilter: ['style']
        });
    }
};

// 延迟设置观察器，确保DOM已加载
setTimeout(setupObserver, 1500);

console.log('✅ 四象限任务日历同步模块已加载');
