(function () {
    const DEFAULT_PERMISSIONS = [
        'add-task',
        'quadrant-view',
        'fortune',
        'pomodoro',
        'habit-tracker',
        'countdown',
        'time-tracker',
        'calendar'
    ];

    function createUserId(prefix = 'user') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    function parseArray(rawValue) {
        if (!rawValue) return [];
        try {
            const parsed = JSON.parse(rawValue);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('Failed to parse users, falling back to an empty list.', error);
            return [];
        }
    }

    function uniqueStrings(values) {
        return [...new Set((Array.isArray(values) ? values : [])
            .map(value => String(value || '').trim())
            .filter(Boolean))];
    }

    function normalizeRole(role) {
        return ['admin', 'vip', 'normal', 'user'].includes(role) ? role : 'normal';
    }

    function sanitizeUser(user = {}) {
        if (!user || typeof user !== 'object') return null;
        const username = String(user.username || '').trim();
        if (!username) return null;
        const role = normalizeRole(user.role);
        return {
            ...user,
            id: user.id || createUserId(role === 'admin' ? 'admin' : 'user'),
            username,
            email: String(user.email || '').trim(),
            role,
            permissions: role === 'admin'
                ? uniqueStrings(user.permissions || DEFAULT_PERMISSIONS)
                : uniqueStrings(user.permissions || DEFAULT_PERMISSIONS),
            createdAt: user.createdAt || user.createdTime || new Date().toISOString(),
            updatedAt: user.updatedAt || ''
        };
    }

    function normalizeUsers(users) {
        const seen = new Set();
        return (Array.isArray(users) ? users : [])
            .map(sanitizeUser)
            .filter(Boolean)
            .filter(user => {
                const key = user.username.toLowerCase();
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
    }

    function getUsers(key = 'users') {
        return normalizeUsers(parseArray(localStorage.getItem(key)));
    }

    function setUsers(users, key = 'users') {
        const normalized = normalizeUsers(users);
        localStorage.setItem(key, JSON.stringify(normalized));
        return normalized;
    }

    function getRegularUsers(key = 'users') {
        return getUsers(key).filter(user => user.role !== 'admin');
    }

    function findUserByUsername(username, key = 'users') {
        const target = String(username || '').trim().toLowerCase();
        return getUsers(key).find(user => user.username.toLowerCase() === target) || null;
    }

    function upsertUser(user, key = 'users') {
        const nextUser = sanitizeUser(user);
        if (!nextUser) return getUsers(key);
        const users = getUsers(key);
        const index = users.findIndex(item => item.username.toLowerCase() === nextUser.username.toLowerCase());
        if (index >= 0) {
            users[index] = { ...users[index], ...nextUser, updatedAt: new Date().toISOString() };
        } else {
            users.push(nextUser);
        }
        return setUsers(users, key);
    }

    function removeUser(userId, key = 'users') {
        const nextUsers = getUsers(key).filter(user => user.id !== userId);
        return setUsers(nextUsers, key);
    }

    window.UserStorage = {
        DEFAULT_PERMISSIONS,
        sanitizeUser,
        normalizeUsers,
        getUsers,
        setUsers,
        getRegularUsers,
        findUserByUsername,
        upsertUser,
        removeUser
    };
})();
