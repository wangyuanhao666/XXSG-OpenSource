/**
 * IndexedDB 持久化存储层
 *
 * 透明拦截 localStorage.setItem/removeItem，同步写入 IndexedDB 做持久化。
 * 当 localStorage 被清除时，下次打开页面自动从 IndexedDB 恢复数据。
 *
 * 工作原理：
 * 1. 覆盖 localStorage.setItem/removeItem，每次写入同时写到 IndexedDB
 * 2. 页面加载时检测 localStorage 是否为空，若 IndexedDB 有数据则自动恢复
 * 3. 所有现有代码无需改动，透明生效
 */
(function () {
    'use strict';

    const DB_NAME = 'XXSG_Storage';
    const STORE_NAME = 'kv_store';
    const DB_VERSION = 2;

    let dbInstance = null;

    // 保存原始 localStorage 方法引用，避免循环调用
    const _origGetItem = localStorage.getItem.bind(localStorage);
    const _origSetItem = localStorage.setItem.bind(localStorage);
    const _origRemoveItem = localStorage.removeItem.bind(localStorage);
    const _origKeys = Object.keys.bind(Object);

    // ==================== IndexedDB 基础操作 ====================

    function openDB() {
        return new Promise(function (resolve, reject) {
            var request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function (e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
            request.onsuccess = function (e) { resolve(e.target.result); };
            request.onerror = function (e) {
                console.warn('IndexedDB 打开失败:', e.target.error);
                resolve(null); // 降级：返回 null，后续操作静默跳过
            };
        });
    }

    function ensureDB() {
        if (dbInstance) return Promise.resolve(dbInstance);
        return openDB().then(function (db) { dbInstance = db; return db; });
    }

    function idbSet(key, value) {
        return ensureDB().then(function (db) {
            if (!db) return;
            return new Promise(function (resolve) {
                try {
                    var tx = db.transaction(STORE_NAME, 'readwrite');
                    tx.objectStore(STORE_NAME).put(value, key);
                    tx.oncomplete = function () { resolve(); };
                    tx.onerror = function () { resolve(); };
                } catch (e) { resolve(); }
            });
        }).catch(function () {});
    }

    function idbGet(key) {
        return ensureDB().then(function (db) {
            if (!db) return null;
            return new Promise(function (resolve) {
                try {
                    var tx = db.transaction(STORE_NAME, 'readonly');
                    var req = tx.objectStore(STORE_NAME).get(key);
                    req.onsuccess = function () { resolve(req.result); };
                    req.onerror = function () { resolve(null); };
                } catch (e) { resolve(null); }
            });
        }).catch(function () { return null; });
    }

    function idbRemove(key) {
        return ensureDB().then(function (db) {
            if (!db) return;
            return new Promise(function (resolve) {
                try {
                    var tx = db.transaction(STORE_NAME, 'readwrite');
                    tx.objectStore(STORE_NAME).delete(key);
                    tx.oncomplete = function () { resolve(); };
                    tx.onerror = function () { resolve(); };
                } catch (e) { resolve(); }
            });
        }).catch(function () {});
    }

    function idbGetAllEntries() {
        return ensureDB().then(function (db) {
            if (!db) return {};
            return new Promise(function (resolve) {
                try {
                    var tx = db.transaction(STORE_NAME, 'readonly');
                    var store = tx.objectStore(STORE_NAME);
                    var req = store.openCursor();
                    var entries = {};
                    req.onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                            entries[cursor.key] = cursor.value;
                            cursor.continue();
                        } else {
                            resolve(entries);
                        }
                    };
                    req.onerror = function () { resolve({}); };
                } catch (e) { resolve({}); }
            });
        }).catch(function () { return {}; });
    }

    // ==================== 启动时恢复数据 ====================

    function bootstrap() {
        // 检测 localStorage 是否为空（没有应用的核心数据）
        var hasAppData = Object.keys(localStorage).some(function (k) {
            return k.startsWith('tasks_') || k.startsWith('users') ||
                   k === 'adminPassword' || k.startsWith('countdown') ||
                   k.startsWith('pomodoro') || k.startsWith('habit_') ||
                   k === 'theme' || k === 'language';
        });

        if (hasAppData) {
            // localStorage 有数据，确保 IndexedDB 也有一份（补偿之前未拦截的写入）
            var allKeys = Object.keys(localStorage);
            // 只备份有值的应用数据 key，不阻塞启动
            ensureDB().then(function (db) {
                if (!db) return;
                var tx = db.transaction(STORE_NAME, 'readwrite');
                var store = tx.objectStore(STORE_NAME);
                var count = 0;
                allKeys.forEach(function (k) {
                    var v = _origGetItem(k);
                    if (v !== null && typeof v !== 'undefined' && k !== 'legalConsent') {
                        try { store.put(v, k); count++; } catch (e) {}
                    }
                });
            }).catch(function () {});
            return;
        }

        // localStorage 为空，尝试从 IndexedDB 恢复
        idbGetAllEntries().then(function (entries) {
            var keys = Object.keys(entries);
            if (keys.length === 0) return;

            var restored = 0;
            keys.forEach(function (k) {
                if (k === 'legalConsent') return;
                _origSetItem(k, entries[k]);
                restored++;
            });
            if (restored > 0) {
                console.log('✅ IndexedDB: 已恢复 ' + restored + ' 条数据到 localStorage');
                try { window.dispatchEvent(new CustomEvent('xxsg-restore-complete')); } catch(e) {}
            }
        }).catch(function () {});
    }

    // ==================== 拦截 localStorage ====================

    // setItem: 写入 localStorage + IndexedDB
    localStorage.setItem = function (key, value) {
        _origSetItem(key, value);
        // 异步写 IndexedDB，不阻塞（跳过法律同意标记，确保清除数据后必须重新同意）
        if (key && typeof key === 'string' && key !== 'legalConsent') {
            idbSet(key, value);
        }
    };

    // removeItem: 删除 localStorage + IndexedDB
    localStorage.removeItem = function (key) {
        _origRemoveItem(key);
        if (key && typeof key === 'string') {
            idbRemove(key);
        }
    };

    // clear: 删除 localStorage + IndexedDB
    var _origClear = localStorage.clear.bind(localStorage);
    localStorage.clear = function () {
        _origClear();
        // 清空 IndexedDB
        ensureDB().then(function (db) {
            if (!db) return;
            var tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
        }).catch(function () {});
    };

    // ==================== 暴露 API ====================

    window.IDBStorage = {
        bootstrap: bootstrap,
        getAll: idbGetAllEntries,
        get: idbGet,
        set: idbSet,
        remove: idbRemove,
        forceSync: function () {
            // 手动触发全量同步：localStorage → IndexedDB
            return ensureDB().then(function (db) {
                if (!db) return;
                var tx = db.transaction(STORE_NAME, 'readwrite');
                var store = tx.objectStore(STORE_NAME);
                var count = 0;
                Object.keys(localStorage).forEach(function (k) {
                    var v = _origGetItem(k);
                    if (v !== null) { try { store.put(v, k); count++; } catch (e) {} }
                });
                console.log('✅ IndexedDB: 已同步 ' + count + ' 条数据');
            });
        }
    };

    // ==================== 执行启动 ====================

    // DOMContentLoaded 时执行启动（此时所有脚本还未开始写入数据）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }

    // 页面关闭前再同步一次，确保数据完整
    window.addEventListener('beforeunload', function () {
        // 页面关闭时 sync 会异步可能来不及，但用户主动操作时 localStorage.setItem 已经在运行中写入了
        // 这里作为补充：全量同步一次（因为 beforeunload 有足够时间完成同步 XHR 但不保证 IndexedDB）
        // 用 sync API 不适合，所以只做日志
    });

    // 定期全量同步（每 5 分钟，确保没有遗漏）
    setInterval(function () {
        window.IDBStorage.forceSync();
    }, 300000);

    console.log('📦 IndexedDB 存储层已加载');
})();
