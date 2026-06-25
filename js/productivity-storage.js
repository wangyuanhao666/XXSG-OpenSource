(function () {
    const DEFAULT_NOTIFICATION_SETTINGS = {
        enabled: true,
        sound: true,
        vibration: true,
        advanceTime: 5,
        showOverdue: true
    };

    function createId(prefix) {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    function parseJson(rawValue, fallback) {
        if (!rawValue) return fallback;
        try {
            const parsed = JSON.parse(rawValue);
            return parsed ?? fallback;
        } catch (error) {
            console.warn('Failed to parse productivity data, falling back to defaults.', error);
            return fallback;
        }
    }

    function clampNumber(value, fallback, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.min(Math.max(number, min), max);
    }

    function normalizeTemplateTask(task) {
        if (!task || typeof task !== 'object') return null;
        const title = String(task.title || task.text || '').trim();
        if (!title) return null;
        return {
            ...task,
            id: task.id || createId('template-task'),
            title,
            text: task.text || title,
            completed: Boolean(task.completed)
        };
    }

    function normalizeTemplate(template) {
        if (!template || typeof template !== 'object') return null;
        const name = String(template.name || '').trim();
        if (!name) return null;
        return {
            ...template,
            id: template.id || createId('template'),
            name,
            description: String(template.description || '').trim(),
            priority: clampNumber(template.priority, 4, 1, 4),
            tasks: Array.isArray(template.tasks)
                ? template.tasks.map(normalizeTemplateTask).filter(Boolean)
                : [],
            createdAt: template.createdAt || new Date().toISOString(),
            updatedAt: template.updatedAt || ''
        };
    }

    function normalizeTemplates(templates) {
        if (!Array.isArray(templates)) return [];
        return templates.map(normalizeTemplate).filter(Boolean);
    }

    function getTemplates(storageKey = 'taskTemplates') {
        return normalizeTemplates(parseJson(localStorage.getItem(storageKey), []));
    }

    function setTemplates(storageKey = 'taskTemplates', templates = []) {
        const normalized = normalizeTemplates(templates);
        localStorage.setItem(storageKey, JSON.stringify(normalized));
        return normalized;
    }

    function normalizeReview(review) {
        if (!review || typeof review !== 'object') return null;
        const normalized = { ...review };
        if (!normalized.date) normalized.date = new Date().toISOString();
        if (!normalized.type) normalized.type = 'daily';
        return normalized;
    }

    function normalizeReviews(reviews) {
        if (!reviews || typeof reviews !== 'object' || Array.isArray(reviews)) return {};
        return Object.entries(reviews).reduce((result, [key, review]) => {
            const normalized = normalizeReview(review);
            if (key && normalized) result[key] = normalized;
            return result;
        }, {});
    }

    function getReviews(storageKey = 'reviews') {
        return normalizeReviews(parseJson(localStorage.getItem(storageKey), {}));
    }

    function setReviews(storageKey = 'reviews', reviews = {}) {
        const normalized = normalizeReviews(reviews);
        localStorage.setItem(storageKey, JSON.stringify(normalized));
        return normalized;
    }

    function normalizeNotificationSettings(settings = {}) {
        return {
            ...DEFAULT_NOTIFICATION_SETTINGS,
            ...settings,
            enabled: settings.enabled !== false,
            sound: settings.sound !== false,
            vibration: settings.vibration !== false,
            advanceTime: clampNumber(settings.advanceTime, DEFAULT_NOTIFICATION_SETTINGS.advanceTime, 1, 1440),
            showOverdue: settings.showOverdue !== false
        };
    }

    function getNotificationSettings(storageKey = 'notificationSettings') {
        return normalizeNotificationSettings(parseJson(localStorage.getItem(storageKey), {}));
    }

    function setNotificationSettings(storageKey = 'notificationSettings', settings = {}) {
        const normalized = normalizeNotificationSettings(settings);
        localStorage.setItem(storageKey, JSON.stringify(normalized));
        return normalized;
    }

    window.ProductivityStorage = {
        normalizeTemplate,
        normalizeTemplates,
        getTemplates,
        setTemplates,
        normalizeReview,
        normalizeReviews,
        getReviews,
        setReviews,
        normalizeNotificationSettings,
        getNotificationSettings,
        setNotificationSettings
    };
})();
