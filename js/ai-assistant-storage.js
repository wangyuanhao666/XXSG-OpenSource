(function () {
    const KEYS = {
        reminders: 'smartReminders',
        scheduleData: 'aiScheduleData',
        decompositionData: 'aiTaskDecompositionData',
        decompositionHistory: 'decompositionHistory',
        decompositionSettings: 'decompositionSettings',
        healthData: 'aiHealthData'
    };

    const DEFAULT_SCHEDULE_DATA = {
        dailySchedule: [],
        timeBlocks: [],
        conflicts: [],
        optimizations: []
    };

    const DEFAULT_DECOMPOSITION_DATA = {
        decomposedTasks: [],
        taskHierarchy: {},
        dependencies: {},
        milestones: []
    };

    const DEFAULT_HEALTH_DATA = {
        workIntensity: [],
        stressLevel: [],
        breakHistory: [],
        healthRecommendations: [],
        wellnessScore: 0
    };

    function parseJson(rawValue, fallback) {
        if (!rawValue) return clone(fallback);
        try {
            const parsed = JSON.parse(rawValue);
            return parsed ?? clone(fallback);
        } catch (error) {
            console.warn('Failed to parse AI assistant data, falling back to defaults.', error);
            return clone(fallback);
        }
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function clampNumber(value, fallback, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.min(Math.max(number, min), max);
    }

    function normalizeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizeScheduleData(data = {}) {
        return {
            dailySchedule: normalizeArray(data.dailySchedule),
            timeBlocks: normalizeArray(data.timeBlocks),
            conflicts: normalizeArray(data.conflicts),
            optimizations: normalizeArray(data.optimizations)
        };
    }

    function normalizeDecompositionData(data = {}) {
        return {
            decomposedTasks: normalizeArray(data.decomposedTasks),
            taskHierarchy: data.taskHierarchy && typeof data.taskHierarchy === 'object' ? data.taskHierarchy : {},
            dependencies: data.dependencies && typeof data.dependencies === 'object' ? data.dependencies : {},
            milestones: normalizeArray(data.milestones)
        };
    }

    function normalizeDecompositionSettings(settings = {}) {
        return {
            maxSubTasks: clampNumber(settings.maxSubTasks ?? settings.maxSubtasks, 8, 2, 20),
            minTaskDuration: clampNumber(settings.minTaskDuration ?? settings.minDuration, 15, 5, 60),
            maxTaskDuration: clampNumber(settings.maxTaskDuration ?? settings.maxDuration, 240, 60, 480),
            complexityThreshold: clampNumber(settings.complexityThreshold, 0.7, 0.1, 1),
            aiModel: ['smart', 'hierarchical', 'time-based', 'priority-based'].includes(settings.aiModel) ? settings.aiModel : 'smart',
            decompositionDepth: ['shallow', 'medium', 'deep'].includes(settings.decompositionDepth) ? settings.decompositionDepth : 'medium',
            autoDependencies: settings.autoDependencies !== false,
            outputFormat: ['hierarchical', 'list', 'timeline', 'mindmap'].includes(settings.outputFormat) ? settings.outputFormat : 'hierarchical',
            includeMilestones: settings.includeMilestones !== false,
            showDependencies: settings.showDependencies !== false,
            exportFormat: ['json', 'csv', 'markdown', 'excel'].includes(settings.exportFormat) ? settings.exportFormat : 'json',
            historyRetention: clampNumber(settings.historyRetention, 30, 0, 365),
            autoCleanup: settings.autoCleanup !== false,
            maxHistoryItems: clampNumber(settings.maxHistoryItems, 100, 10, 1000),
            lastUpdated: settings.lastUpdated || ''
        };
    }

    function normalizeHealthData(data = {}) {
        return {
            workIntensity: normalizeArray(data.workIntensity),
            stressLevel: normalizeArray(data.stressLevel),
            breakHistory: normalizeArray(data.breakHistory),
            healthRecommendations: normalizeArray(data.healthRecommendations),
            wellnessScore: clampNumber(data.wellnessScore, 0, 0, 100)
        };
    }

    function getArray(key) {
        return normalizeArray(parseJson(localStorage.getItem(key), []));
    }

    function setArray(key, value = []) {
        const normalized = normalizeArray(value);
        localStorage.setItem(key, JSON.stringify(normalized));
        return normalized;
    }

    function getObject(key, fallback, normalizer) {
        const parsed = parseJson(localStorage.getItem(key), fallback);
        return normalizer(parsed);
    }

    function setObject(key, value, normalizer) {
        const normalized = normalizer(value);
        localStorage.setItem(key, JSON.stringify(normalized));
        return normalized;
    }

    function getReminders() {
        return getArray(KEYS.reminders);
    }

    function setReminders(reminders = []) {
        return setArray(KEYS.reminders, reminders);
    }

    function getScheduleData() {
        return getObject(KEYS.scheduleData, DEFAULT_SCHEDULE_DATA, normalizeScheduleData);
    }

    function setScheduleData(data = DEFAULT_SCHEDULE_DATA) {
        return setObject(KEYS.scheduleData, data, normalizeScheduleData);
    }

    function getDecompositionData() {
        return getObject(KEYS.decompositionData, DEFAULT_DECOMPOSITION_DATA, normalizeDecompositionData);
    }

    function setDecompositionData(data = DEFAULT_DECOMPOSITION_DATA) {
        return setObject(KEYS.decompositionData, data, normalizeDecompositionData);
    }

    function getDecompositionHistory() {
        return getArray(KEYS.decompositionHistory);
    }

    function setDecompositionHistory(history = []) {
        return setArray(KEYS.decompositionHistory, history);
    }

    function getDecompositionSettings() {
        return getObject(KEYS.decompositionSettings, {}, normalizeDecompositionSettings);
    }

    function setDecompositionSettings(settings = {}) {
        return setObject(KEYS.decompositionSettings, settings, normalizeDecompositionSettings);
    }

    function getHealthData() {
        return getObject(KEYS.healthData, DEFAULT_HEALTH_DATA, normalizeHealthData);
    }

    function setHealthData(data = DEFAULT_HEALTH_DATA) {
        return setObject(KEYS.healthData, data, normalizeHealthData);
    }

    window.AIAssistantStorage = {
        normalizeScheduleData,
        normalizeDecompositionData,
        normalizeDecompositionSettings,
        normalizeHealthData,
        getReminders,
        setReminders,
        getScheduleData,
        setScheduleData,
        getDecompositionData,
        setDecompositionData,
        getDecompositionHistory,
        setDecompositionHistory,
        getDecompositionSettings,
        setDecompositionSettings,
        getHealthData,
        setHealthData
    };
})();
