(function () {
    function parseObject(rawValue, fallback = {}) {
        if (!rawValue) return { ...fallback };
        try {
            const parsed = JSON.parse(rawValue);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                ? { ...fallback, ...parsed }
                : { ...fallback };
        } catch (error) {
            console.warn('Failed to parse settings, falling back to defaults.', error);
            return { ...fallback };
        }
    }

    function clampNumber(value, fallback, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.min(Math.max(number, min), max);
    }

    function normalizeTime(value, fallback) {
        const text = String(value || '').trim();
        return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
    }

    function getObject(key, fallback = {}) {
        return parseObject(localStorage.getItem(key), fallback);
    }

    function setObject(key, value = {}, normalizer) {
        const normalized = typeof normalizer === 'function' ? normalizer(value) : { ...value };
        localStorage.setItem(key, JSON.stringify(normalized));
        return normalized;
    }

    function getString(key, fallback = '', allowedValues) {
        const value = localStorage.getItem(key);
        if (!value) return fallback;
        if (Array.isArray(allowedValues) && !allowedValues.includes(value)) return fallback;
        return value;
    }

    function setString(key, value, fallback = '', allowedValues) {
        const normalized = Array.isArray(allowedValues) && !allowedValues.includes(value) ? fallback : value;
        localStorage.setItem(key, normalized);
        return normalized;
    }

    function getBoolean(key, fallback = true) {
        const value = localStorage.getItem(key);
        if (value === null) return fallback;
        return value !== 'false';
    }

    function setBoolean(key, value) {
        const normalized = Boolean(value);
        localStorage.setItem(key, normalized.toString());
        return normalized;
    }

    function normalizeReminderSettings(settings = {}) {
        return {
            enableNotifications: settings.enableNotifications !== false,
            enablePageNotifications: settings.enablePageNotifications !== false,
            workloadThreshold: clampNumber(settings.workloadThreshold, 0.8, 0, 1),
            enableWorkloadReminders: settings.enableWorkloadReminders !== false,
            fatigueThreshold: clampNumber(settings.fatigueThreshold, 50, 0, 100),
            enableFatigueReminders: settings.enableFatigueReminders !== false,
            enableOptimalTimeReminders: settings.enableOptimalTimeReminders !== false,
            workIntensityInterval: clampNumber(settings.workIntensityInterval, 300000, 60000, 86400000),
            fatigueCheckInterval: clampNumber(settings.fatigueCheckInterval, 1800000, 60000, 86400000)
        };
    }

    function getReminderSettings() {
        return normalizeReminderSettings(getObject('reminderSettings'));
    }

    function setReminderSettings(settings) {
        return setObject('reminderSettings', settings, normalizeReminderSettings);
    }

    function normalizeScheduleSettings(settings = {}) {
        return {
            workStartTime: normalizeTime(settings.workStartTime, '09:00'),
            workEndTime: normalizeTime(settings.workEndTime, '18:00'),
            lunchStartTime: normalizeTime(settings.lunchStartTime, '12:00'),
            lunchEndTime: normalizeTime(settings.lunchEndTime, '13:00'),
            bufferTime: clampNumber(settings.bufferTime, 15, 0, 120),
            breakInterval: clampNumber(settings.breakInterval, 90, 15, 240),
            breakDuration: clampNumber(settings.breakDuration, 15, 5, 120),
            enableAIAnalysis: settings.enableAIAnalysis !== false,
            enableWorkPatterns: settings.enableWorkPatterns !== false,
            enableConflictDetection: settings.enableConflictDetection !== false,
            peakHoursWeight: clampNumber(settings.peakHoursWeight, 2, 0, 10),
            taskPreference: ['balanced', 'urgent', 'important'].includes(settings.taskPreference) ? settings.taskPreference : 'balanced',
            enableScheduleReminders: settings.enableScheduleReminders !== false,
            reminderAdvance: clampNumber(settings.reminderAdvance, 10, 5, 30)
        };
    }

    function getScheduleSettings() {
        return normalizeScheduleSettings(getObject('scheduleSettings'));
    }

    function setScheduleSettings(settings) {
        return setObject('scheduleSettings', settings, normalizeScheduleSettings);
    }

    window.SettingsStorage = {
        getObject,
        setObject,
        getString,
        setString,
        getBoolean,
        setBoolean,
        normalizeReminderSettings,
        getReminderSettings,
        setReminderSettings,
        normalizeScheduleSettings,
        getScheduleSettings,
        setScheduleSettings
    };
})();
