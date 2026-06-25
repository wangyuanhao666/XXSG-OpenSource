(function () {
    const RECORDS_KEY = 'timeTrackerRecords';
    const CATEGORIES_KEY = 'timeTrackerCategories';
    const GOALS_KEY = 'timeTrackerGoals';

    function parseJson(rawValue, fallback) {
        if (!rawValue) return fallback;
        try {
            const parsed = JSON.parse(rawValue);
            return parsed ?? fallback;
        } catch (error) {
            console.warn('Failed to parse time tracker data, falling back to defaults.', error);
            return fallback;
        }
    }

    function clampNumber(value, fallback, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.min(Math.max(number, min), max);
    }

    function createId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    function normalizeRecord(record) {
        if (!record || typeof record !== 'object') return null;
        const name = String(record.name || '').trim();
        if (!name) return null;
        return {
            ...record,
            id: String(record.id || createId('time-record')),
            name,
            categoryId: String(record.categoryId || ''),
            hours: clampNumber(record.hours, 0, 0, 18),
            minutes: clampNumber(record.minutes, 0, 0, 59),
            date: record.date || new Date().toISOString().split('T')[0],
            note: String(record.note || '').trim()
        };
    }

    function normalizeRecords(records) {
        if (!Array.isArray(records)) return [];
        return records.map(normalizeRecord).filter(Boolean);
    }

    function normalizeCategory(category) {
        if (!category || typeof category !== 'object') return null;
        const name = String(category.name || '').trim();
        if (!name) return null;
        return {
            ...category,
            id: String(category.id || createId('time-category')),
            name,
            color: String(category.color || '#667eea'),
            icon: String(category.icon || '📝')
        };
    }

    function normalizeCategories(categories) {
        if (!Array.isArray(categories)) return [];
        return categories.map(normalizeCategory).filter(Boolean);
    }

    function normalizeGoal(goal) {
        if (!goal || typeof goal !== 'object') return null;
        const name = String(goal.name || '').trim();
        if (!name) return null;
        return {
            ...goal,
            id: String(goal.id || createId('time-goal')),
            name,
            hours: clampNumber(goal.hours, 1, 0.25, 18),
            categoryId: String(goal.categoryId || '')
        };
    }

    function normalizeGoals(goals) {
        if (!Array.isArray(goals)) return [];
        return goals.map(normalizeGoal).filter(Boolean);
    }

    function getRecords(storageKey = RECORDS_KEY) {
        return normalizeRecords(parseJson(localStorage.getItem(storageKey), []));
    }

    function setRecords(records = [], storageKey = RECORDS_KEY) {
        const normalized = normalizeRecords(records);
        localStorage.setItem(storageKey, JSON.stringify(normalized));
        return normalized;
    }

    function getCategories(storageKey = CATEGORIES_KEY) {
        return normalizeCategories(parseJson(localStorage.getItem(storageKey), []));
    }

    function setCategories(categories = [], storageKey = CATEGORIES_KEY) {
        const normalized = normalizeCategories(categories);
        localStorage.setItem(storageKey, JSON.stringify(normalized));
        return normalized;
    }

    function getGoals(storageKey = GOALS_KEY) {
        return normalizeGoals(parseJson(localStorage.getItem(storageKey), []));
    }

    function setGoals(goals = [], storageKey = GOALS_KEY) {
        const normalized = normalizeGoals(goals);
        localStorage.setItem(storageKey, JSON.stringify(normalized));
        return normalized;
    }

    window.TimeTrackerStorage = {
        normalizeRecord,
        normalizeRecords,
        getRecords,
        setRecords,
        normalizeCategory,
        normalizeCategories,
        getCategories,
        setCategories,
        normalizeGoal,
        normalizeGoals,
        getGoals,
        setGoals
    };
})();
