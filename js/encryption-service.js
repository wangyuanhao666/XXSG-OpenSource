/**
 * 透明 localStorage 加密层
 *
 * AES-GCM 256-bit。在 localStorage.getItem/setItem 层面工作，
 * 现有存储代码无需修改。
 *
 * 核心机制：
 * 1. 页面加载时批量解密所有值到内存缓存
 * 2. getItem → 查缓存，命中即返回解密值
 * 3. setItem → 加密后写入，同时更新缓存
 * 4. IndexedDB restore 完成后 → 重新扫描解密缓存
 * 5. 无密钥时延迟生成（等 IndexedDB 恢复完再决定）
 *
 * 兼容性：
 * - indexeddb-storage.js 在加密层之前加载，捕获 native getItem/setItem
 * - 备份时存的是加密密文，恢复时写的也是密文
 * - 解密在 getItem 层完成，用户代码无感
 */
(function () {
    'use strict';

    var KEY_NAME = '_xxsg_enc_key';
    var ALGORITHM = 'AES-GCM';
    var cache = {};       // key → decrypted string
    var cryptoKey = null;
    var ready = false;
    var failed = false;

    var SKIP_PREFIXES = ['_xxsg_', 'legalConsent', 'telemetry',
        'backupNotice', '_heartbeat', '_first_visit',
        'enableAPISync', 'aiFortune', 'theme', 'language',
        'rememberMe', 'autoSave', 'taskNotifications',
        'sort_mode', 'adminPassword', 'telemetryConsent',
        'telemetryLastBeat', 'telemetryUserId', 'telemetryFirstVisit'];

    function shouldEncrypt(key) {
        if (!key || typeof key !== 'string') return false;
        for (var i = 0; i < SKIP_PREFIXES.length; i++) {
            if (key.indexOf(SKIP_PREFIXES[i]) === 0) return false;
        }
        return true;
    }

    // ==================== 工具函数 ====================

    function b64ToBytes(b64) {
        var bin = atob(b64), u8 = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        return u8;
    }

    function bytesToB64(u8) {
        var bin = '';
        for (var i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
        return btoa(bin);
    }

    // ==================== 密钥管理 ====================

    function loadKeyFromStorage() { return localStorage.getItem(KEY_NAME); }
    function saveKeyToStorage(b64) { localStorage.setItem(KEY_NAME, b64); }

    async function importKey(b64) {
        return await crypto.subtle.importKey(
            'raw', b64ToBytes(b64),
            { name: ALGORITHM }, false, ['encrypt', 'decrypt']
        );
    }

    async function makeKey() {
        var k = await crypto.subtle.generateKey(
            { name: ALGORITHM, length: 256 }, true, ['encrypt', 'decrypt']
        );
        var raw = new Uint8Array(await crypto.subtle.exportKey('raw', k));
        saveKeyToStorage(bytesToB64(raw));
        return k;
    }

    // ==================== 批量解密 ====================

    async function scanAndDecrypt() {
        if (!cryptoKey) return 0;
        var count = 0;
        var keys = Object.keys(localStorage);
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (!shouldEncrypt(k) || cache.hasOwnProperty(k)) continue;
            var raw = localStorage.getItem(k);
            if (!raw || raw.indexOf('.') < 1) continue;
            try {
                var dot = raw.indexOf('.');
                var iv = b64ToBytes(raw.substring(0, dot));
                var data = b64ToBytes(raw.substring(dot + 1)).buffer;
                var dec = await crypto.subtle.decrypt(
                    { name: ALGORITHM, iv: iv }, cryptoKey, data);
                cache[k] = new TextDecoder().decode(dec);
                count++;
            } catch (e) { /* 密钥不匹配或旧数据 */ }
        }
        return count;
    }

    // ==================== 加密写入 ====================

    async function encryptAndSet(key, value) {
        if (!cryptoKey) {
            cryptoKey = await makeKey();
            ready = true;
        }
        var iv = crypto.getRandomValues(new Uint8Array(12));
        var enc = await crypto.subtle.encrypt(
            { name: ALGORITHM, iv: iv },
            cryptoKey, new TextEncoder().encode(value)
        );
        var ct = bytesToB64(iv) + '.' + bytesToB64(new Uint8Array(enc));
        _origSetItem(key, ct);
        cache[key] = value;
    }

    // ==================== 拦截 localStorage ====================

    var _origGetItem = localStorage.getItem.bind(localStorage);
    var _origSetItem = localStorage.setItem.bind(localStorage);
    var _origRemoveItem = localStorage.removeItem.bind(localStorage);
    var _origClear = localStorage.clear.bind(localStorage);

    localStorage.getItem = function (key) {
        if (key && cache.hasOwnProperty(key)) return cache[key];
        return _origGetItem(key);
    };

    localStorage.setItem = function (key, value) {
        if (!key || !shouldEncrypt(key) || failed) {
            _origSetItem(key, value);
            return;
        }
        if (cache.hasOwnProperty(key)) delete cache[key];
        encryptAndSet(key, String(value));
    };

    localStorage.removeItem = function (key) {
        if (key && cache.hasOwnProperty(key)) delete cache[key];
        _origRemoveItem(key);
    };

    localStorage.clear = function () {
        cache = {};
        _origClear();
    };

    // ==================== 初始化 ====================

    async function init() {
        try {
            if (!window.crypto || !window.crypto.subtle) { failed = true; return; }

            var b64 = loadKeyFromStorage();
            if (b64) { cryptoKey = await importKey(b64); ready = true; }
            // 无密钥 → 等 IndexedDB 恢复 + 延迟生成
            else { await new Promise(function (r) { setTimeout(r, 1800); });
                b64 = loadKeyFromStorage();
                if (b64) cryptoKey = await importKey(b64);
                // 还没有 → 首次使用，第一次写入时生成
            }

            if (cryptoKey) await scanAndDecrypt();

            // 监听 IndexedDB 恢复完成事件
            window.addEventListener('xxsg-restore-complete', function () {
                var b64 = loadKeyFromStorage();
                if (b64 && !cryptoKey) {
                    importKey(b64).then(function (k) {
                        cryptoKey = k; ready = true; scanAndDecrypt();
                    });
                } else if (cryptoKey) {
                    scanAndDecrypt();
                }
            });
        } catch (e) { failed = true; }
    }

    // ==================== 公开 API ====================

    window.EncryptionService = {
        ready: function () { return ready; },
        available: function () { return !failed; },
        /** 手动迁移所有明文数据为加密存储 */
        migrateAll: async function () {
            if (failed) return 0;
            if (!cryptoKey) { cryptoKey = await makeKey(); ready = true; }
            var count = 0;
            var keys = Object.keys(localStorage);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                if (!shouldEncrypt(k)) continue;
                var raw = _origGetItem(k);
                if (!raw || raw.indexOf('.') > 0) continue;
                await encryptAndSet(k, raw);
                count++;
            }
            return count;
        },
        reset: function () {
            cryptoKey = null; ready = false; cache = {};
            _origRemoveItem(KEY_NAME);
        }
    };

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init);
    else init();

})();
