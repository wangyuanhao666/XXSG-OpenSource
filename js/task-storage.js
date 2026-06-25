(function () {
    const DEFAULT_TASK_TITLE = '未命名任务';

    function createTaskId() {
        return `task-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    function normalizePriority(value) {
        const priority = Number(value);
        return priority >= 1 && priority <= 4 ? priority : 4;
    }

    function normalizeDate(value) {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString();
    }

    function normalizeSubtasks(subtasks) {
        if (!Array.isArray(subtasks)) return [];
        return subtasks
            .filter(subtask => subtask && typeof subtask === 'object')
            .map(subtask => ({
                ...subtask,
                id: subtask.id || createTaskId(),
                title: String(subtask.title || DEFAULT_TASK_TITLE).trim() || DEFAULT_TASK_TITLE,
                completed: Boolean(subtask.completed)
            }));
    }

    function normalizeTask(task) {
        if (!task || typeof task !== 'object') return null;
        const title = String(task.title || DEFAULT_TASK_TITLE).trim() || DEFAULT_TASK_TITLE;
        const normalized = {
            ...task,
            id: task.id || createTaskId(),
            title,
            priority: normalizePriority(task.priority),
            completed: Boolean(task.completed),
            pinned: Boolean(task.pinned),
            createdAt: normalizeDate(task.createdAt) || new Date().toISOString(),
            updatedAt: normalizeDate(task.updatedAt) || task.updatedAt || '',
            startDate: normalizeDate(task.startDate),
            endDate: normalizeDate(task.endDate),
            subtasks: normalizeSubtasks(task.subtasks),
            titleTranslations: {
                zh: task.titleTranslations?.zh || title,
                en: task.titleTranslations?.en || ''
            }
        };
        return normalized;
    }

    function normalizeTasks(tasks) {
        if (!Array.isArray(tasks)) return [];
        return tasks.map(normalizeTask).filter(Boolean);
    }

    function parseTasks(rawValue) {
        if (!rawValue) return [];
        try {
            return normalizeTasks(JSON.parse(rawValue));
        } catch (error) {
            console.warn('Failed to parse tasks, falling back to an empty list.', error);
            return [];
        }
    }

    function getTasks(storageKey = 'tasks') {
        return parseTasks(localStorage.getItem(storageKey));
    }

    function setTasks(storageKey = 'tasks', tasks = []) {
        const normalizedTasks = normalizeTasks(tasks);
        localStorage.setItem(storageKey, JSON.stringify(normalizedTasks));
        return normalizedTasks;
    }

    function loadFirstAvailable(candidateKeys = ['tasks']) {
        const triedKeys = [];
        const seenKeys = new Set();
        for (const key of candidateKeys) {
            if (!key || seenKeys.has(key)) continue;
            seenKeys.add(key);
            triedKeys.push(key);
            const rawValue = localStorage.getItem(key);
            if (rawValue) {
                return {
                    key,
                    triedKeys,
                    tasks: parseTasks(rawValue)
                };
            }
        }
        return {
            key: null,
            triedKeys,
            tasks: []
        };
    }

    function backup(storageKey) {
        const currentTasks = localStorage.getItem(storageKey);
        if (!currentTasks) return false;
        localStorage.setItem(`${storageKey}_backup`, currentTasks);
        localStorage.setItem(`${storageKey}_backup_time`, new Date().toISOString());
        return true;
    }

    window.TaskStorage = {
        normalizeTask,
        normalizeTasks,
        parseTasks,
        getTasks,
        setTasks,
        loadFirstAvailable,
        backup
    };
})();
