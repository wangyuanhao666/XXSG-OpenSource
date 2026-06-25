/**
 * 匿名使用统计遥测服务
 *
 * 每天发送一次心跳，包含匿名功能使用数据。
 * 不收集任何用户身份信息、任务内容、密码等隐私数据。
 *
 * 用户可以在 账户设置 → 偏好设置 中关闭。
 */
(function () {
    'use strict';

    var STORAGE_KEY_CONSENT = 'telemetryConsent';
    var STORAGE_KEY_LAST_BEAT = 'telemetryLastBeat';
    var STORAGE_KEY_FIRST_VISIT = 'telemetryFirstVisit';
    var STORAGE_KEY_USER_ID = 'telemetryUserId';
    var API_ENDPOINT = '/api/telemetry';

    // ==================== 匿名用户 ID（不关联任何个人身份） ====================

    function getAnonymousId() {
        var id = localStorage.getItem(STORAGE_KEY_USER_ID);
        if (!id) {
            id = 'u_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
            localStorage.setItem(STORAGE_KEY_USER_ID, id);
        }
        return id;
    }

    // ==================== 功能使用检测 ====================

    function detectUsedFeatures() {
        var features = [];

        // 检查各功能模块是否有数据（仅检查存在性，不检查内容）
        if (localStorage.getItem('tasks') || hasTasksByUser()) features.push('quadrant');
        if (localStorage.getItem('pomodoroSessions')) features.push('pomodoro');
        if (localStorage.getItem('habit_records') || localStorage.getItem('habitTrackerData')) features.push('habit');
        if (localStorage.getItem('calendarEvents') || localStorage.getItem('calendar_events')) features.push('calendar');
        if (localStorage.getItem('countdownEvents')) features.push('countdown');
        if (localStorage.getItem('fortuneViewCount') || localStorage.getItem('lastFortuneDate')) features.push('fortune');
        if (localStorage.getItem('timeTrackerRecords')) features.push('timeTracker');

        return features;
    }

    // 检测是否有按用户存储的任务
    function hasTasksByUser() {
        var keys = Object.keys(localStorage);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].indexOf('tasks_') === 0) return true;
        }
        return false;
    }

    // ==================== 任务总数统计（仅数字） ====================

    function countTasks() {
        try {
            var total = 0;
            var keys = Object.keys(localStorage);
            for (var i = 0; i < keys.length; i++) {
                if (keys[i].indexOf('tasks_') === 0) {
                    var raw = localStorage.getItem(keys[i]);
                    if (raw) {
                        var tasks = JSON.parse(raw);
                        if (Array.isArray(tasks)) total += tasks.length;
                    }
                }
            }
            return total;
        } catch (e) {
            return -1;
        }
    }

    // ==================== 发送心跳 ====================

    function sendHeartbeat() {
        var consent = localStorage.getItem(STORAGE_KEY_CONSENT);
        if (consent === 'false' || consent === null) {
            return; // 用户未同意或已关闭，不发
        }

        var today = new Date().toISOString().slice(0, 10);
        var lastBeat = localStorage.getItem(STORAGE_KEY_LAST_BEAT);
        if (lastBeat === today) return; // 今天已发过

        var firstVisit = localStorage.getItem(STORAGE_KEY_FIRST_VISIT);
        if (!firstVisit) {
            firstVisit = Date.now().toString();
            localStorage.setItem(STORAGE_KEY_FIRST_VISIT, firstVisit);
        }

        var data = {
            id: getAnonymousId(),
            day: today,
            firstVisitDay: new Date(parseInt(firstVisit, 10)).toISOString().slice(0, 10),
            features: detectUsedFeatures(),
            taskCount: countTasks(),
            t: Date.now()
        };

        // 使用 sendBeacon 或 fetch，静默发送，不影响用户体验
        var payload = JSON.stringify(data);
        if (navigator.sendBeacon) {
            navigator.sendBeacon(API_ENDPOINT, payload);
            localStorage.setItem(STORAGE_KEY_LAST_BEAT, today);
        } else {
            fetch(API_ENDPOINT, {
                method: 'POST',
                body: payload,
                headers: { 'Content-Type': 'application/json' }
            }).then(function () {
                localStorage.setItem(STORAGE_KEY_LAST_BEAT, today);
            }).catch(function () {
                // 静默失败，不影响用户
            });
        }
    }

    // ==================== 公开 API ====================

    window.Telemetry = {
        /** 启用遥测 */
        enable: function () {
            localStorage.setItem(STORAGE_KEY_CONSENT, 'true');
            localStorage.removeItem(STORAGE_KEY_LAST_BEAT); // 强制今天发送
            sendHeartbeat();
        },

        /** 禁用遥测 */
        disable: function () {
            localStorage.setItem(STORAGE_KEY_CONSENT, 'false');
        },

        /** 当前状态 */
        isEnabled: function () {
            var val = localStorage.getItem(STORAGE_KEY_CONSENT);
            return val !== 'false';
        },

        /** 强制发送一次（用于测试） */
        sendNow: function () {
            localStorage.removeItem(STORAGE_KEY_LAST_BEAT);
            sendHeartbeat();
        },

        /** 获取已收集的功能使用数据（用于设置页面展示） */
        getStats: function () {
            return {
                features: detectUsedFeatures(),
                taskCount: countTasks(),
                enabled: this.isEnabled()
            };
        }
    };

    // ==================== 初始化 ====================

    // 首次访问时，默认启用遥测（用户可随时关闭）
    if (localStorage.getItem(STORAGE_KEY_CONSENT) === null) {
        localStorage.setItem(STORAGE_KEY_CONSENT, 'true');
    }

    // 页面加载完成后发送心跳
    if (document.readyState === 'complete') {
        sendHeartbeat();
    } else {
        window.addEventListener('load', sendHeartbeat);
    }

    // 页面关闭前尝试发送（使用 sendBeacon）
    window.addEventListener('beforeunload', function () {
        var consent = localStorage.getItem(STORAGE_KEY_CONSENT);
        if (consent === 'false') return;
        var today = new Date().toISOString().slice(0, 10);
        var lastBeat = localStorage.getItem(STORAGE_KEY_LAST_BEAT);
        if (lastBeat === today) return;

        if (navigator.sendBeacon) {
            var data = {
                id: getAnonymousId(),
                day: today,
                features: detectUsedFeatures(),
                taskCount: countTasks(),
                t: Date.now()
            };
            navigator.sendBeacon(API_ENDPOINT, JSON.stringify(data));
        }
    });

})();
