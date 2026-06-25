/**
 * 📊 统一日志管理系统
 * 用于控制和管理控制台日志输出，减少内存使用和性能影响
 * 版本: 1.0.0
 */

(function(global) {
    'use strict';

    // 日志级别枚举
    const LogLevel = {
        ERROR: 0,    // 错误：必须显示
        WARN: 1,     // 警告：重要提示
        INFO: 2,     // 信息：一般信息
        DEBUG: 3,    // 调试：开发调试用
        TRACE: 4     // 追踪：详细的执行追踪
    };

    // 当前日志级别（可通过Logger.setLevel()修改）
    let currentLevel = LogLevel.INFO;

    // 日志统计
    const stats = {
        error: 0,
        warn: 0,
        info: 0,
        debug: 0,
        trace: 0,
        total: 0,
        startTime: Date.now()
    };

    // 模块过滤器（只显示指定模块的日志）
    const moduleFilters = new Set();

    // 模块黑名单（不显示这些模块的日志）
    const moduleBlacklist = new Set([
        'permission',      // 权限检查日志
        'menu',           // 菜单更新日志
        'storage',        // 存储操作日志
        'render',         // 渲染日志
        'event',          // 事件日志
        'dom'             // DOM操作日志
    ]);

    /**
     * 格式化日志前缀
     */
    function formatPrefix(level, module) {
        const now = new Date();
        const time = now.toLocaleTimeString('zh-CN', { hour12: false });
        const levelStr = ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'][level];
        const moduleStr = module ? `[${module}]` : '';
        return `${time} ${levelStr} ${moduleStr}`;
    }

    /**
     * 检查是否应该输出该日志
     */
    function shouldLog(level, module) {
        // 检查日志级别
        if (level > currentLevel) {
            return false;
        }

        // 检查模块黑名单
        if (module && moduleBlacklist.has(module)) {
            return false;
        }

        // 检查模块过滤器（如果设置了，只显示白名单中的模块）
        if (moduleFilters.size > 0) {
            if (!moduleFilters.has(module)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 更新统计信息
     */
    function updateStats(level) {
        const levels = ['error', 'warn', 'info', 'debug', 'trace'];
        stats[levels[level]]++;
        stats.total++;
    }

    /**
     * 核心日志函数
     */
    function log(level, module, args) {
        if (!shouldLog(level, module)) {
            return;
        }

        updateStats(level);

        const prefix = formatPrefix(level, module);
        const consoleMethod = ['error', 'warn', 'info', 'log', 'log'][level];

        // 添加前缀并输出
        const newArgs = [prefix, ...args];
        console[consoleMethod](...newArgs);

        // 如果是错误或警告，同时输出堆栈
        if (level <= LogLevel.WARN) {
            console.trace('调用堆栈:');
        }
    }

    /**
     * Logger API
     */
    const Logger = {
        // 日志级别
        Level: LogLevel,

        /**
         * 设置日志级别
         */
        setLevel: function(level) {
            if (typeof level === 'string') {
                level = LogLevel[level.toUpperCase()];
            }
            if (typeof level === 'number' && level >= 0 && level <= 4) {
                currentLevel = level;
                this.info('logger', `日志级别已设置为: ${['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'][level]}`);
            }
        },

        /**
         * 获取当前日志级别
         */
        getLevel: function() {
            return currentLevel;
        },

        /**
         * 添加模块过滤器
         */
        addModuleFilter: function(module) {
            moduleFilters.add(module);
        },

        /**
         * 移除模块过滤器
         */
        removeModuleFilter: function(module) {
            moduleFilters.delete(module);
        },

        /**
         * 清空模块过滤器
         */
        clearModuleFilters: function() {
            moduleFilters.clear();
        },

        /**
         * 添加模块到黑名单
         */
        addModuleBlacklist: function(module) {
            moduleBlacklist.add(module);
        },

        /**
         * 从黑名单移除模块
         */
        removeModuleBlacklist: function(module) {
            moduleBlacklist.delete(module);
        },

        /**
         * 获取日志统计
         */
        getStats: function() {
            const elapsed = Date.now() - stats.startTime;
            return {
                ...stats,
                elapsed: elapsed,
                rate: stats.total / (elapsed / 1000) // 每秒日志数
            };
        },

        /**
         * 重置统计
         */
        resetStats: function() {
            stats.error = 0;
            stats.warn = 0;
            stats.info = 0;
            stats.debug = 0;
            stats.trace = 0;
            stats.total = 0;
            stats.startTime = Date.now();
        },

        /**
         * 打印统计报告
         */
        printStats: function() {
            const s = this.getStats();
            console.log('=== 日志统计报告 ===');
            console.log(`运行时间: ${(s.elapsed / 1000).toFixed(2)}秒`);
            console.log(`总日志数: ${s.total}`);
            console.log(`日志速率: ${s.rate.toFixed(2)}条/秒`);
            console.log(`  - 错误: ${s.error}`);
            console.log(`  - 警告: ${s.warn}`);
            console.log(`  - 信息: ${s.info}`);
            console.log(`  - 调试: ${s.debug}`);
            console.log(`  - 追踪: ${s.trace}`);
        },

        // 便捷方法
        error: function(module, ...args) {
            log(LogLevel.ERROR, module, args);
        },

        warn: function(module, ...args) {
            log(LogLevel.WARN, module, args);
        },

        info: function(module, ...args) {
            log(LogLevel.INFO, module, args);
        },

        debug: function(module, ...args) {
            log(LogLevel.DEBUG, module, args);
        },

        trace: function(module, ...args) {
            log(LogLevel.TRACE, module, args);
        }
    };

    // 导出到全局
    global.Logger = Logger;

    // 兼容旧的debugLog函数
    global.debugLog = function(...args) {
        if (currentLevel >= LogLevel.DEBUG) {
            Logger.debug('legacy', ...args);
        }
    };

    // 初始化：从localStorage读取日志级别配置
    const savedLevel = localStorage.getItem('logger_level');
    if (savedLevel !== null) {
        Logger.setLevel(parseInt(savedLevel));
    }

    // 开发模式下设置为INFO，生产模式下设置为WARN
    if (window.location.hostname === 'localhost' || window.location.protocol === 'file:') {
        Logger.setLevel(LogLevel.INFO);
    } else {
        Logger.setLevel(LogLevel.WARN);
    }

    // 定期清理控制台（如果日志过多）
    let logCount = 0;
    let lastCleanTime = Date.now();

    // 清理控制台函数
    function cleanConsoleIfNeeded() {
        const now = Date.now();
        const elapsedSinceLastClean = now - lastCleanTime;

        // 每60秒或日志超过500条时清理一次
        if (logCount > 500 || (logCount > 100 && elapsedSinceLastClean > 60000)) {
            // 使用原生console.clear，避免循环
            const nativeClear = console.clear.bind(console);
            nativeClear();
            logCount = 0;
            lastCleanTime = now;

            // 直接使用原生console输出清理信息，避免通过Logger
            const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
            console.log(`%c[${time}] INFO [logger] 控制台已清理（${elapsedSinceLastClean / 1000}秒内${logCount}条日志）`, 'color: #888;');
        }
    }

    // 监听所有console方法
    const consoleMethods = ['log', 'info', 'warn', 'error', 'debug', 'trace'];
    const originalMethods = {};

    consoleMethods.forEach(method => {
        originalMethods[method] = console[method].bind(console);

        console[method] = function(...args) {
            logCount++;
            cleanConsoleIfNeeded();
            return originalMethods[method].apply(console, args);
        };
    });

    // 页面卸载时保存日志级别
    window.addEventListener('beforeunload', function() {
        localStorage.setItem('logger_level', currentLevel.toString());
    });

    // 启动提示
    Logger.info('logger', '日志管理系统已启动');
    Logger.info('logger', `当前日志级别: ${['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'][currentLevel]}`);
    Logger.info('logger', '使用 Logger.setLevel(0-4) 调整级别');
    Logger.info('logger', '使用 Logger.getStats() 查看统计');

    // 生产环境禁用原始 console.log（避免用户数据和控制台杂乱）
    if (window.location.hostname !== 'localhost' && window.location.protocol !== 'file:') {
        const _origConsoleLog = console.log;
        const _origConsoleDebug = console.debug;
        const _origConsoleInfo = console.info;
        const _origConsoleWarn = console.warn;
        console.log = function() {};
        console.debug = function() {};
        console.info = function() {};
        // 保留 console.warn 和 console.error 让开发者仍能看到警告和错误
    }

    // 🔧 过滤浏览器扩展错误
    if (typeof window !== 'undefined') {
        const originalErrorHandler = window.onerror;
        window.onerror = function(message, source, lineno, colno, error) {
            // 忽略浏览器扩展相关的错误
            if (source && (
                source.includes('giveFreely') ||
                source.includes('chrome-extension://') ||
                source.includes('extensions://') ||
                message.includes('A listener indicated an asynchronous response') ||
                message.includes('message channel closed')
            )) {
                return true; // 阻止错误显示
            }

            // 调用原始错误处理器
            if (originalErrorHandler) {
                return originalErrorHandler.call(this, message, source, lineno, colno, error);
            }

            return false;
        };

        // 过滤未捕获的Promise错误
        window.addEventListener('unhandledrejection', function(event) {
            if (event.reason && event.reason.message && (
                event.reason.message.includes('message channel closed') ||
                event.reason.message.includes('asynchronous response')
            )) {
                event.preventDefault(); // 阻止错误显示
            }
        });
    }

})(typeof window !== 'undefined' ? window : global);
