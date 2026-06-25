(function () {
    const SESSION_KEYS = ['userSession', 'app_session'];

    function parseObject(rawValue) {
        if (!rawValue) return null;
        try {
            const parsed = JSON.parse(rawValue);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (error) {
            console.warn('Failed to parse session data.', error);
            return null;
        }
    }

    function sanitizeUser(user) {
        if (!user || typeof user !== 'object') return user || null;
        const { password, adminPassword, token, accessToken, refreshToken, ...safeUser } = user;
        return safeUser;
    }

    function sanitizeSession(session) {
        if (!session || typeof session !== 'object') return null;
        const safeSession = { ...session };
        if (safeSession.user) safeSession.user = sanitizeUser(safeSession.user);
        delete safeSession.password;
        return safeSession;
    }

    function readFromArea(area, key) {
        return sanitizeSession(parseObject(area.getItem(key)));
    }

    function getSession(key = 'userSession') {
        return readFromArea(localStorage, key) || readFromArea(sessionStorage, key);
    }

    function getCurrentUser() {
        const userSession = getSession('userSession');
        if (userSession?.user) return userSession.user;
        const appSession = getSession('app_session');
        return appSession?.user || null;
    }

    function setSession(session, options = {}) {
        const key = options.key || 'userSession';
        const remember = options.remember !== false;
        const safeSession = sanitizeSession(session);
        if (!safeSession) return null;
        const payload = JSON.stringify(safeSession);
        if (remember) {
            localStorage.setItem(key, payload);
            sessionStorage.removeItem(key);
        } else {
            sessionStorage.setItem(key, payload);
            localStorage.removeItem(key);
        }
        return safeSession;
    }

    function clearSessions(keys = SESSION_KEYS) {
        keys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }

    function migrateStoredSessions(keys = SESSION_KEYS) {
        keys.forEach(key => {
            [localStorage, sessionStorage].forEach(area => {
                const current = parseObject(area.getItem(key));
                const safe = sanitizeSession(current);
                if (safe) area.setItem(key, JSON.stringify(safe));
            });
        });
    }

    window.SessionStorage = {
        sanitizeUser,
        sanitizeSession,
        getSession,
        getCurrentUser,
        setSession,
        clearSessions,
        migrateStoredSessions
    };
})();
