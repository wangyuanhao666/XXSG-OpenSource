// 任务管理模块
// 从 script.js 中提取的任务CRUD相关功能

import { getUserStorageKey } from '../core/storage-utils.js';

// 全局任务数组（将在主文件中初始化）
let tasks = [];

/**
 * 设置任务数组引用
 * @param {Array} tasksArray - 任务数组
 */
export function setTasks(tasksArray) {
    tasks = tasksArray;
}

/**
 * 获取任务数组
 * @returns {Array} 任务数组
 */
export function getTasks() {
    return tasks;
}

/**
 * 保存任务到localStorage
 */
export function saveTasks() {
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
        const currentTasks = localStorage.getItem(storageKey);
        if (currentTasks) {
            localStorage.setItem(storageKey + '_backup', currentTasks);
            localStorage.setItem(storageKey + '_backup_time', new Date().toISOString());
        }

        // 保存新数据
        const tasksToSave = tasks.map(task => ({
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

        localStorage.setItem(storageKey, JSON.stringify(tasksToSave));
        console.log('✅ 任务已保存，共', tasksToSave.length, '个任务');

        return true;
    } catch (error) {
        console.error('❌ 保存任务失败:', error);
        return false;
    }
}

/**
 * 从localStorage加载任务
 */
export function loadTasks() {
    const storageKey = getUserStorageKey('tasks');
    const storedTasks = localStorage.getItem(storageKey);

    if (storedTasks) {
        try {
            const parsedTasks = JSON.parse(storedTasks);

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
                console.log('✅ 从localStorage加载了', tasks.length, '个有效任务');

                // 如果有效任务数量少于原始数量，保存修复后的数据
                if (validTasks.length < parsedTasks.length) {
                    console.log('🔧 修复了', parsedTasks.length - validTasks.length, '个无效任务');
                    saveTasks();
                }
            } else {
                console.log('⚠️ localStorage中没有有效任务数据');
                tasks = [];
            }
        } catch (error) {
            console.error('❌ 解析任务数据失败:', error);
            tasks = [];
        }
    } else {
        console.log('ℹ️ localStorage中没有任务数据');
        tasks = [];
    }

    return tasks;
}

/**
 * 添加新任务
 * @param {Object} taskData - 任务数据
 * @returns {Object} 新创建的任务
 */
export function addTask(taskData) {
    const newTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: taskData.title || '未命名任务',
        priority: taskData.priority || 4,
        completed: false,
        pinned: false,
        createdAt: new Date().toISOString(),
        titleTranslations: {
            zh: taskData.title || '未命名任务',
            en: taskData.titleEn || ''
        },
        ...taskData
    };

    tasks.push(newTask);
    saveTasks();

    console.log('✅ 任务已添加:', newTask.title);
    return newTask;
}

/**
 * 更新任务
 * @param {string} taskId - 任务ID
 * @param {Object} updates - 更新的数据
 * @returns {Object|null} 更新后的任务
 */
export function updateTask(taskId, updates) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        console.warn('⚠️ 未找到任务:', taskId);
        return null;
    }

    tasks[taskIndex] = {
        ...tasks[taskIndex],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    saveTasks();
    console.log('✅ 任务已更新:', tasks[taskIndex].title);
    return tasks[taskIndex];
}

/**
 * 删除任务
 * @param {string} taskId - 任务ID
 * @returns {boolean} 是否删除成功
 */
export function deleteTask(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        console.warn('⚠️ 未找到任务:', taskId);
        return false;
    }

    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);
    saveTasks();

    console.log('✅ 任务已删除:', deletedTask.title);
    return true;
}

/**
 * 根据ID获取任务
 * @param {string} taskId - 任务ID
 * @returns {Object|null} 任务对象
 */
export function getTaskById(taskId) {
    return tasks.find(t => t.id === taskId) || null;
}

/**
 * 根据优先级获取任务
 * @param {number} priority - 优先级（1-4）
 * @returns {Array} 任务数组
 */
export function getTasksByPriority(priority) {
    return tasks.filter(t => t.priority === priority);
}

/**
 * 获取已完成的任务
 * @returns {Array} 已完成的任务数组
 */
export function getCompletedTasks() {
    return tasks.filter(t => t.completed);
}

/**
 * 获取未完成的任务
 * @returns {Array} 未完成的任务数组
 */
export function getActiveTasks() {
    return tasks.filter(t => !t.completed);
}

/**
 * 获取置顶的任务
 * @returns {Array} 置顶的任务数组
 */
export function getPinnedTasks() {
    return tasks.filter(t => t.pinned);
}

/**
 * 切换任务完成状态
 * @param {string} taskId - 任务ID
 * @returns {Object|null} 更新后的任务
 */
export function toggleTaskComplete(taskId) {
    const task = getTaskById(taskId);
    if (!task) return null;

    return updateTask(taskId, {
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
    });
}

/**
 * 切换任务置顶状态
 * @param {string} taskId - 任务ID
 * @returns {Object|null} 更新后的任务
 */
export function toggleTaskPin(taskId) {
    const task = getTaskById(taskId);
    if (!task) return null;

    return updateTask(taskId, {
        pinned: !task.pinned
    });
}

/**
 * 复制任务
 * @param {string} taskId - 任务ID
 * @returns {Object|null} 新创建的任务
 */
export function duplicateTask(taskId) {
    const originalTask = getTaskById(taskId);
    if (!originalTask) return null;

    const duplicatedTask = {
        ...originalTask,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${originalTask.title} (副本)`,
        completed: false,
        createdAt: new Date().toISOString(),
        titleTranslations: {
            zh: `${originalTask.titleTranslations?.zh || originalTask.title} (副本)`,
            en: originalTask.titleTranslations?.en ? `${originalTask.titleTranslations.en} (Copy)` : ''
        }
    };

    tasks.push(duplicatedTask);
    saveTasks();

    console.log('✅ 任务已复制:', duplicatedTask.title);
    return duplicatedTask;
}

/**
 * 清空所有任务
 * @param {boolean} includeCompleted - 是否包括已完成的任务
 */
export function clearTasks(includeCompleted = false) {
    if (includeCompleted) {
        tasks = [];
    } else {
        tasks = tasks.filter(t => t.completed);
    }
    saveTasks();
    console.log('✅ 任务已清空');
}

/**
 * 获取任务统计
 * @returns {Object} 统计数据
 */
export function getTaskStats() {
    const total = tasks.length;
    const completed = getCompletedTasks().length;
    const active = getActiveTasks().length;
    const pinned = getPinnedTasks().length;

    const byPriority = {
        1: getTasksByPriority(1).length,
        2: getTasksByPriority(2).length,
        3: getTasksByPriority(3).length,
        4: getTasksByPriority(4).length
    };

    return {
        total,
        completed,
        active,
        pinned,
        completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0,
        byPriority
    };
}
