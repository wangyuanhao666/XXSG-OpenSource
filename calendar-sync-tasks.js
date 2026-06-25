// ==================== 任务同步功能 ====================

// 任务同步状态
let syncTasksData = [];
let selectedSyncTasks = new Set();

/**
 * 打开任务同步模态框
 */
function openCalendarSyncTasksModal() {
    const modal = document.getElementById('calendar-sync-tasks-modal');
    if (!modal) return;

    // 获取未完成的四象限任务
    loadUncompletedTasks();

    // 显示模态框
    modal.style.display = 'flex';

    // 添加动画
    setTimeout(() => {
        modal.querySelector('.modal-content').style.animation = 'modalSlideIn 0.3s ease-out';
    }, 10);
}

/**
 * 关闭任务同步模态框
 */
function closeCalendarSyncTasksModal() {
    const modal = document.getElementById('calendar-sync-tasks-modal');
    if (!modal) return;

    modal.style.display = 'none';

    // 清空选择
    selectedSyncTasks.clear();
    updateSelectedCount();
}

/**
 * 清理任务标题
 * 移除所有换行符和多余空格，保持正常的文字间距
 */
function cleanTaskTitle(title) {
    if (!title) return '未命名任务';

    // 1. 移除所有换行符
    let cleaned = title.replace(/\n/g, '');

    // 2. 移除所有空格
    cleaned = cleaned.replace(/\s/g, '');

    // 3. 在特定位置添加合理的空格
    // 在冒号后添加空格
    cleaned = cleaned.replace(/:/g, ': ');

    // 在中文和英文/数字之间添加空格
    cleaned = cleaned.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2');
    cleaned = cleaned.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2');

    // 4. 清理多余空格并去除首尾空格
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
}


/**
 * 加载未完成的任务
 */
function loadUncompletedTasks() {
    const listEl = document.getElementById('sync-tasks-list');
    if (!listEl) return;

    bindSyncTaskListEvents(listEl);

    // 从全局tasks数组获取未完成的任务
    // 确保tasks变量存在且是数组
    const allTasks = (typeof tasks !== 'undefined' && Array.isArray(tasks)) ? tasks : [];
    const uncompletedTasks = allTasks.filter(task => !task.completed);

    console.log('所有任务数量:', allTasks.length);
    console.log('未完成任务数量:', uncompletedTasks.length);
    console.log('未完成任务:', uncompletedTasks);

    if (uncompletedTasks.length === 0) {
        syncTasksData = [];
        listEl.replaceChildren(createSyncTasksEmptyState());
        return;
    }

    // 保存任务数据
    syncTasksData = uncompletedTasks;

    // 渲染任务列表
    const fragment = document.createDocumentFragment();
    uncompletedTasks.forEach((task, index) => {
        fragment.appendChild(createSyncTaskItem(task, index));
    });
    listEl.replaceChildren(fragment);

    // 更新选中计数
    updateSelectedCount();
}

function bindSyncTaskListEvents(listEl) {
    if (listEl.dataset.syncTaskEventsBound === 'true') return;
    listEl.dataset.syncTaskEventsBound = 'true';

    listEl.addEventListener('change', event => {
        const checkbox = event.target.closest('.sync-task-checkbox');
        if (!checkbox || !listEl.contains(checkbox)) return;
        toggleSyncTask(Number(checkbox.dataset.taskIndex));
    });

    listEl.addEventListener('click', event => {
        const title = event.target.closest('.sync-task-title');
        if (!title || !listEl.contains(title)) return;
        toggleTimeSettings(Number(title.dataset.taskIndex));
    });
}

function createSyncTasksEmptyState() {
    const empty = document.createElement('div');
    empty.className = 'sync-tasks-empty';

    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = 'task_alt';

    const title = document.createElement('p');
    title.textContent = '太棒了！所有任务都已完成';

    const subtitle = document.createElement('p');
    subtitle.style.cssText = 'font-size: 0.9rem; color: #94a3b8;';
    subtitle.textContent = '暂无未完成的任务需要同步';

    empty.append(icon, title, subtitle);
    return empty;
}

function createSyncTaskItem(task, index) {
    const priorityLabels = {
        1: '重要且紧急',
        2: '重要不紧急',
        3: '不重要但紧急',
        4: '不重要不紧急'
    };

    const priorityIcons = {
        1: 'priority_high',
        2: 'star',
        3: 'schedule',
        4: 'low_priority'
    };

    const defaultDate = task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const defaultStartTime = task.startDate ? new Date(task.startDate).toTimeString().slice(0, 5) : '09:00';
    const defaultEndTime = task.endDate ? new Date(task.endDate).toTimeString().slice(0, 5) : '10:00';

    const item = document.createElement('div');
    item.className = 'sync-task-item';
    item.dataset.taskId = task.id;

    const header = document.createElement('div');
    header.className = 'sync-task-header';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'sync-task-checkbox';
    checkbox.dataset.taskIndex = String(index);

    const title = document.createElement('span');
    title.className = 'sync-task-title';
    title.dataset.taskIndex = String(index);
    title.textContent = cleanTaskTitle(task.title || '未命名任务');

    const priority = document.createElement('span');
    priority.className = `sync-task-priority priority-${task.priority}`;
    const priorityIcon = document.createElement('span');
    priorityIcon.className = 'material-icons';
    priorityIcon.textContent = priorityIcons[task.priority] || 'label';
    priority.append(priorityIcon, document.createTextNode(priorityLabels[task.priority] || '未分类'));

    const settings = document.createElement('div');
    settings.className = 'sync-task-time-settings';
    settings.id = `time-settings-${index}`;
    settings.append(
        createTimeSettingInput(index, 'date', '日期', 'date', defaultDate),
        createTimeSettingInput(index, 'startTime', '开始时间', 'time', defaultStartTime),
        createTimeSettingInput(index, 'endTime', '结束时间', 'time', defaultEndTime)
    );

    header.append(checkbox, title, priority);
    item.append(header, settings);
    return item;
}

function createTimeSettingInput(index, field, labelText, type, value) {
    const group = document.createElement('div');
    group.className = 'time-setting-group';

    const label = document.createElement('label');
    label.className = 'time-setting-label';
    label.textContent = labelText;

    const input = document.createElement('input');
    input.type = type;
    input.className = 'time-setting-input';
    input.dataset.taskIndex = String(index);
    input.dataset.field = field;
    input.value = value;

    group.append(label, input);
    return group;
}

/**
 * 切换任务选择状态
 */
function toggleSyncTask(index) {
    const taskItem = document.querySelector(`.sync-task-item[data-task-id="${syncTasksData[index].id}"]`);
    const timeSettings = document.getElementById(`time-settings-${index}`);
    const checkbox = document.querySelector(`.sync-task-checkbox[data-task-index="${index}"]`);

    if (checkbox.checked) {
        selectedSyncTasks.add(index);
        taskItem.classList.add('selected');
        // 选中时自动展开时间设置
        if (timeSettings) {
            timeSettings.classList.add('show');
        }
    } else {
        selectedSyncTasks.delete(index);
        taskItem.classList.remove('selected');
        // 取消选中时不自动收起，让用户决定
        // if (timeSettings) {
        //     timeSettings.classList.remove('show');
        // }
    }

    updateSelectedCount();
}

/**
 * 切换时间设置区域的显示状态
 */
function toggleTimeSettings(index) {
    const timeSettings = document.getElementById(`time-settings-${index}`);
    if (timeSettings) {
        timeSettings.classList.toggle('show');
    }
}


/**
 * 全选任务
 */
function selectAllSyncTasks() {
    const checkboxes = document.querySelectorAll('.sync-task-checkbox');
    checkboxes.forEach((checkbox, index) => {
        if (!checkbox.checked) {
            checkbox.checked = true;
            toggleSyncTask(parseInt(checkbox.dataset.taskIndex));
        }
    });
}

/**
 * 取消全选
 */
function deselectAllSyncTasks() {
    const checkboxes = document.querySelectorAll('.sync-task-checkbox');
    checkboxes.forEach((checkbox, index) => {
        if (checkbox.checked) {
            checkbox.checked = false;
            toggleSyncTask(parseInt(checkbox.dataset.taskIndex));
        }
    });
}

/**
 * 更新选中计数
 */
function updateSelectedCount() {
    const countEl = document.getElementById('sync-selected-count');
    if (countEl) {
        countEl.textContent = `已选择 ${selectedSyncTasks.size} 个任务`;
    }
}

/**
 * 确认同步任务
 */
function confirmSyncTasks() {
    if (selectedSyncTasks.size === 0) {
        showNotification('请至少选择一个任务', 'warning');
        return;
    }

    // 收集选中任务的数据
    const tasksToSync = [];
    selectedSyncTasks.forEach(index => {
        const task = syncTasksData[index];
        const dateInput = document.querySelector(`.time-setting-input[data-task-index="${index}"][data-field="date"]`);
        const startTimeInput = document.querySelector(`.time-setting-input[data-task-index="${index}"][data-field="startTime"]`);
        const endTimeInput = document.querySelector(`.time-setting-input[data-task-index="${index}"][data-field="endTime"]`);

        if (dateInput && startTimeInput && endTimeInput) {
            tasksToSync.push({
                ...task,
                syncDate: dateInput.value,
                syncStartTime: startTimeInput.value,
                syncEndTime: endTimeInput.value
            });
        }
    });

    // 同步到日历
    syncTasksToCalendar(tasksToSync);

    // 关闭模态框
    closeCalendarSyncTasksModal();

    // 显示成功提示
    showNotification(`成功同步 ${tasksToSync.length} 个任务到日历`, 'success');
}

/**
 * 将任务同步到日历
 */
function syncTasksToCalendar(tasks) {
    console.log('开始同步任务到日历，任务数量:', tasks.length);

    // 获取或初始化日历自定义事件数组
    let customEvents = [];
    try {
        customEvents = JSON.parse(localStorage.getItem('calendar-custom-events') || '[]');
        console.log('当前日历事件数量:', customEvents.length);
    } catch (error) {
        console.error('读取日历事件失败:', error);
        customEvents = [];
    }

    tasks.forEach(task => {
        // 构建完整的日期时间字符串
        const startDateTime = `${task.syncDate}T${task.syncStartTime}:00`;
        const endDateTime = `${task.syncDate}T${task.syncEndTime}:00`;

        console.log('同步任务:', {
            title: task.title,
            start: startDateTime,
            end: endDateTime,
            priority: task.priority
        });

        // 创建日历事件（格式与日历系统一致）
        const event = {
            id: `sync-${task.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: task.title,
            start: startDateTime,  // ISO 8601 格式字符串
            end: endDateTime,      // ISO 8601 格式字符串
            calendar: getCategoryFromPriority(task.priority),
            color: getColorFromPriority(task.priority),
            description: task.notes || `从四象限同步的任务（优先级：${task.priority}）`,
            location: task.address || '',
            attendees: [],
            sourceTaskId: task.id, // 记录源任务ID
            synced: true,
            createdAt: new Date().toISOString()
        };

        customEvents.push(event);
        console.log('已添加事件:', event);
    });

    // 保存到localStorage
    try {
        localStorage.setItem('calendar-custom-events', JSON.stringify(customEvents));
        console.log('✅ 成功保存到localStorage，总事件数:', customEvents.length);
    } catch (error) {
        console.error('❌ 保存日历事件失败:', error);
        showPageNotification('保存失败：' + error.message, 'error');
        return;
    }

    // 更新全局 calendarEvents 数组和 calendarEventMap
    if (typeof calendarEvents !== 'undefined' && typeof calendarEventMap !== 'undefined') {
        // 只添加新同步的事件
        const newEventIds = tasks.map(t => customEvents.find(e => e.sourceTaskId === t.id)?.id).filter(Boolean);

        customEvents.forEach(event => {
            if (newEventIds.includes(event.id)) {
                // 转换日期字符串为 Date 对象
                const eventWithDates = {
                    ...event,
                    start: new Date(event.start),
                    end: new Date(event.end)
                };

                // 添加到全局数组
                calendarEvents.push(eventWithDates);

                // 添加到全局 Map
                calendarEventMap.set(event.id, eventWithDates);

                console.log('已添加到全局变量:', eventWithDates);
            }
        });
        console.log('✅ 已更新全局 calendarEvents 和 calendarEventMap，当前总数:', calendarEvents.length);
    } else {
        console.warn('⚠️ 全局变量 calendarEvents 或 calendarEventMap 不存在');
    }

    // 刷新日历视图
    if (typeof renderCalendar === 'function') {
        console.log('🔄 刷新日历视图...');
        renderCalendar();
        console.log('✅ 日历视图已刷新');
    } else {
        console.warn('⚠️ renderCalendar 函数不存在');
    }
}


/**
 * 根据优先级获取日历类别
 */
function getCategoryFromPriority(priority) {
    const categoryMap = {
        1: 'work',      // 重要且紧急 -> 工作日程
        2: 'focus',     // 重要不紧急 -> 深度专注
        3: 'team',      // 不重要但紧急 -> 团队协作
        4: 'personal'   // 不重要不紧急 -> 个人生活
    };
    return categoryMap[priority] || 'personal';
}

/**
 * 根据优先级获取日历颜色
 */
function getColorFromPriority(priority) {
    const colorMap = {
        1: 'amber',     // 重要且紧急 -> 琥珀色（警示）
        2: 'violet',    // 重要不紧急 -> 紫罗兰（重要）
        3: 'cyan',      // 不重要但紧急 -> 青色（提醒）
        4: 'green'      // 不重要不紧急 -> 绿色（轻松）
    };
    return colorMap[priority] || 'pink';
}


/**
 * 显示通知
 */
function showNotification(message, type = 'info') {
    // 如果已有showPageNotification函数，使用它
    if (typeof showPageNotification === 'function') {
        showPageNotification(message, type);
        return;
    }

    // 否则使用简单的alert
    alert(message);
}

// 初始化：绑定同步按钮事件
document.addEventListener('DOMContentLoaded', function () {
    const syncBtn = document.getElementById('calendar-sync-tasks-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', openCalendarSyncTasksModal);
    }
});
