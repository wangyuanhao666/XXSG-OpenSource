(function () {
    function parseObject(rawValue, fallback = {}) {
        if (!rawValue) return { ...fallback };
        try {
            const parsed = JSON.parse(rawValue);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? { ...fallback, ...parsed } : { ...fallback };
        } catch (error) {
            console.warn('Failed to parse admin object data.', error);
            return { ...fallback };
        }
    }

    function parseArray(rawValue) {
        if (!rawValue) return [];
        try {
            const parsed = JSON.parse(rawValue);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('Failed to parse admin array data.', error);
            return [];
        }
    }

    function hasKey(key) {
        return localStorage.getItem(key) !== null;
    }

    function removeKey(key) {
        localStorage.removeItem(key);
    }

    function getRaw(key) {
        return localStorage.getItem(key);
    }

    function setRaw(key, value) {
        localStorage.setItem(key, String(value ?? ''));
    }

    function getObject(key, fallback = {}) {
        return parseObject(localStorage.getItem(key), fallback);
    }

    function setObject(key, value = {}) {
        const normalized = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        localStorage.setItem(key, JSON.stringify(normalized));
        return normalized;
    }

    function getLogs(key = 'systemLogs') {
        const data = getObject(key, { logs: [] });
        return Array.isArray(data.logs) ? data.logs : [];
    }

    function setLogs(logs, key = 'systemLogs', limit = 1000) {
        const normalized = (Array.isArray(logs) ? logs : []).slice(0, limit).map(log => ({
            time: log.time || log.timestamp || new Date().toISOString(),
            event: String(log.event || log.action || ''),
            status: String(log.status || 'info'),
            detail: String(log.detail || log.note || '')
        }));
        localStorage.setItem(key, JSON.stringify({ logs: normalized }));
        return normalized;
    }

    function addLog(log, key = 'systemLogs', limit = 200) {
        return setLogs([{ ...log, time: log.time || new Date().toISOString() }, ...getLogs(key)], key, limit);
    }

    function getPasswordChangeLog() {
        return parseArray(localStorage.getItem('adminPasswordChangeLog'));
    }

    function addPasswordChangeLog(entry) {
        const logs = getPasswordChangeLog();
        logs.push({
            timestamp: entry.timestamp || new Date().toISOString(),
            action: entry.action || 'password_changed',
            note: entry.note || ''
        });
        localStorage.setItem('adminPasswordChangeLog', JSON.stringify(logs.slice(-100)));
        return logs;
    }

    function setAdminPassword(value) {
        localStorage.setItem('adminPassword', String(value || ''));
    }

    window.AdminStorage = {
        hasKey,
        removeKey,
        getRaw,
        setRaw,
        getObject,
        setObject,
        getLogs,
        setLogs,
        addLog,
        getPasswordChangeLog,
        addPasswordChangeLog,
        setAdminPassword
    };
})();
