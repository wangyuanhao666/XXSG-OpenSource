(function () {
    const STORAGE_KEY = 'pomodoroSessions';
    const DEFAULT_TASK_TITLE = '未选择任务';

    function createSessionId() {
        return `pomodoro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function toIsoDate(value, fallback = new Date()) {
        const date = value ? new Date(value) : fallback;
        if (Number.isNaN(date.getTime())) {
            return fallback.toISOString();
        }
        return date.toISOString();
    }

    function normalizeDuration(value) {
        const duration = Math.round(Number(value) || 0);
        return Math.max(0, duration);
    }

    function normalizeSession(session) {
        const fallbackDate = new Date();
        const date = toIsoDate(session?.date || session?.endTime, fallbackDate);
        const taskTitle = String(
            session?.taskTitle ||
            session?.task ||
            DEFAULT_TASK_TITLE
        ).trim() || DEFAULT_TASK_TITLE;

        return {
            id: session?.id || createSessionId(),
            date,
            endTime: toIsoDate(session?.endTime || date, fallbackDate),
            duration: normalizeDuration(session?.duration),
            task: String(session?.task || taskTitle),
            taskTitle,
            mode: session?.mode || 'work',
            completed: session?.completed !== false,
            source: session?.source || (session?.manual ? 'manual' : 'completed'),
            manual: Boolean(session?.manual)
        };
    }

    function parseSessions(rawValue) {
        if (!rawValue) return [];
        try {
            const sessions = JSON.parse(rawValue);
            return Array.isArray(sessions)
                ? sessions.map(normalizeSession).filter(session => session.duration > 0)
                : [];
        } catch (error) {
            console.warn('Failed to parse pomodoro sessions, falling back to an empty list.', error);
            return [];
        }
    }

    function getSessions() {
        return parseSessions(localStorage.getItem(STORAGE_KEY));
    }

    function saveSessions(sessions) {
        const safeSessions = Array.isArray(sessions)
            ? sessions.map(normalizeSession).filter(session => session.duration > 0)
            : [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeSessions));
        return safeSessions;
    }

    function addSession(session) {
        const sessions = getSessions();
        const normalizedSession = normalizeSession(session);
        if (normalizedSession.duration <= 0) {
            return sessions;
        }
        sessions.push(normalizedSession);
        saveSessions(sessions);
        return sessions;
    }

    window.PomodoroStorage = {
        STORAGE_KEY,
        normalizeSession,
        getSessions,
        saveSessions,
        addSession
    };
})();
