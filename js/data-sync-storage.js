(function () {
    function parseJSON(rawValue, fallback) {
        if (!rawValue) return fallback;
        try {
            return JSON.parse(rawValue);
        } catch (error) {
            console.warn('Failed to parse sync data.', error);
            return fallback;
        }
    }

    function readStorageSnapshot() {
        const userStorage = window.UserStorage;
        const sessionStorageApi = window.SessionStorage;
        const settingsStorage = window.SettingsStorage;
        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            users: userStorage ? userStorage.getUsers() : parseJSON(localStorage.getItem('users'), []),
            userSession: sessionStorageApi ? sessionStorageApi.getSession('userSession') : parseJSON(localStorage.getItem('userSession') || window.sessionStorage.getItem('userSession'), null),
            adminPassword: localStorage.getItem('adminPassword'),
            aiConfig: localStorage.getItem('aiFortuneEnabled'),
            settings: {
                theme: settingsStorage ? settingsStorage.getString('theme', '') : localStorage.getItem('theme'),
                language: settingsStorage ? settingsStorage.getString('language', 'zh', ['zh', 'en']) : localStorage.getItem('language'),
                sortMode: settingsStorage ? settingsStorage.getString('sort_mode', 'default') : localStorage.getItem('sort_mode')
            }
        };
    }

    function getRaw(key) {
        return localStorage.getItem(key);
    }

    function setRaw(key, value) {
        localStorage.setItem(key, String(value));
        return value;
    }

    function removeRaw(key) {
        localStorage.removeItem(key);
    }

    function keys(prefix = '') {
        return Object.keys(localStorage).filter(key => key.startsWith(prefix));
    }

    function getSessionRaw(key) {
        return localStorage.getItem(key) || sessionStorage.getItem(key);
    }

    function setSessionRaw(key, value) {
        sessionStorage.setItem(key, String(value));
        return value;
    }

    function removeSessionRaw(key) {
        sessionStorage.removeItem(key);
    }

    function normalizeImportData(data) {
        const payload = data && typeof data === 'object' ? data : {};
        return {
            ...payload,
            users: window.UserStorage ? window.UserStorage.normalizeUsers(payload.users) : (Array.isArray(payload.users) ? payload.users : []),
            userSession: window.SessionStorage ? window.SessionStorage.sanitizeSession(payload.userSession) : payload.userSession || null
        };
    }

    function applyImportData(data) {
        const payload = normalizeImportData(data);
        if (window.UserStorage) {
            window.UserStorage.setUsers(payload.users);
        } else {
            localStorage.setItem('users', JSON.stringify(payload.users));
        }
        if (payload.userSession && window.SessionStorage) {
            window.SessionStorage.setSession(payload.userSession, { remember: true });
        }
        if (payload.adminPassword) localStorage.setItem('adminPassword', String(payload.adminPassword));
        if (payload.aiConfig !== undefined && payload.aiConfig !== null) localStorage.setItem('aiFortuneEnabled', String(payload.aiConfig));
        if (payload.settings) {
            if (payload.settings.theme) localStorage.setItem('theme', payload.settings.theme);
            if (payload.settings.language) localStorage.setItem('language', payload.settings.language);
            if (payload.settings.sortMode) localStorage.setItem('sort_mode', payload.settings.sortMode);
        }
        return payload;
    }

    window.DataSyncStorage = {
        parseJSON,
        getRaw,
        setRaw,
        removeRaw,
        keys,
        getSessionRaw,
        setSessionRaw,
        removeSessionRaw,
        readStorageSnapshot,
        normalizeImportData,
        applyImportData
    };
})();
