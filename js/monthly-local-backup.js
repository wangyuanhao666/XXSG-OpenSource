(function () {
    'use strict';

    const FORMAT = 'xxsg-full-local-v1';
    const blockedKey = /password|credential|session|token|secret|api.?key|private.?key|auth|jwt|bearer|oauth|cookie|csrf|refresh|verification|2fa|mfa|otp|^users$|^_xxsg_|^aiConfig$|^admin|^remember|^telemetry|^legalConsent|^taskBackups|^lastAutoBackup|_backup(?:_time)?$|^error_logs$|^pendingActions$|^_heartbeat/i;
    let pending = false;
    let completedPeriod = '';
    let activeUserId = '';
    let timerStarted = false;
    let warnedCalendar = false;
    let warnedFailure = false;

    function isContentKey(key) {
        return typeof key === 'string' && key.length > 0 && key.length <= 200 && !blockedKey.test(key);
    }

    function collectEntries() {
        const entries = {};
        for (const key of Object.keys(localStorage)) {
            if (!isContentKey(key)) continue;
            const value = localStorage.getItem(key);
            if (value !== null) entries[key] = value;
        }
        return entries;
    }

    function browserId() {
        const key = '_xxsg_backup_browser_id';
        let value = localStorage.getItem(key);
        if (!value) {
            value = crypto.randomUUID();
            localStorage.setItem(key, value);
        }
        return value;
    }

    function restore(data, currentUserId) {
        if (!data || data.format !== FORMAT || !data.entries || typeof data.entries !== 'object' || Array.isArray(data.entries)) {
            throw new Error('完整备份文件格式不正确');
        }
        const pairs = Object.entries(data.entries);
        if (!pairs.length || pairs.some(([key, value]) => !isContentKey(key) || typeof value !== 'string')) {
            throw new Error('完整备份内容不正确');
        }
        if (!currentUserId) throw new Error('请先登录账号，再恢复完整备份');

        for (const [key, value] of pairs) localStorage.setItem(key, value);
        const oldId = String(data.ownerId || '');
        const newId = String(currentUserId);
        if (oldId && oldId !== newId) {
            for (const [key, value] of pairs) {
                if (key.endsWith(`_${oldId}`)) {
                    const mappedKey = `${key.slice(0, -oldId.length)}${newId}`;
                    if (isContentKey(mappedKey)) localStorage.setItem(mappedKey, value);
                }
            }
        }
        return pairs.length;
    }

    async function checkBackup() {
        if (pending || !activeUserId) return;
        if (navigator.onLine === false) return;
        if (location.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(location.hostname) || location.port !== '8080') return;

        pending = true;
        try {
            const scheduleResponse = await fetch('/api/local-backup/schedule', { cache: 'no-store' });
            if (!scheduleResponse.ok) throw new Error(`日程 HTTP ${scheduleResponse.status}`);
            const schedule = await scheduleResponse.json();
            if (!schedule.due || schedule.period === completedPeriod) return;
            if (!schedule.calendarVerified && !warnedCalendar) {
                warnedCalendar = true;
                console.warn('尚无该年份的中国大陆法定节假日安排，暂按周一至周五计算月末备份日期');
                if (typeof window.showNotification === 'function') {
                    window.showNotification('节假日日历待更新，月末备份暂按周一至周五安排', 'warning');
                }
            }
            const entries = collectEntries();
            if (!Object.keys(entries).length) return;
            const response = await fetch('/api/local-backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ format: FORMAT, userId: activeUserId, browserId: browserId(), period: schedule.period, entries }),
                cache: 'no-store',
                credentials: 'same-origin'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            if (!['created', 'existing'].includes(result.status)) throw new Error('无效的备份响应');
            completedPeriod = schedule.period;
            warnedFailure = false;
            console.info(schedule.late ? '月末完整备份已补做到项目 backups 文件夹:' : '月末完整备份已保存到项目 backups 文件夹:', result.filename);
        } catch (error) {
            if (navigator.onLine === false) return;
            console.error('月度完整备份失败，请检查本地服务器:', error);
            if (!warnedFailure && typeof window.showNotification === 'function') {
                warnedFailure = true;
                window.showNotification('月度本地备份失败，请检查本地服务器', 'error');
            }
        } finally {
            pending = false;
        }
    }

    function backup(_tasks, userId) {
        if (!userId) return;
        if (location.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(location.hostname) || location.port !== '8080') return;
        activeUserId = String(userId);
        if (!timerStarted) {
            timerStarted = true;
            setInterval(checkBackup, 60 * 60 * 1000);
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) checkBackup();
            });
            window.addEventListener('online', checkBackup);
        }
        return checkBackup();
    }

    window.XXSGMonthlyLocalBackup = { backup, restore, isContentKey, format: FORMAT };
})();
