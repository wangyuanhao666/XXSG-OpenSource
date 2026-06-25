(function () {
    const DEBUG_ENABLED = window.DEBUG_MODE === true;

    function redactValue(value) {
        if (typeof value === 'string') {
            return value
                .replace(/sk-[A-Za-z0-9_-]{8,}/g, '[redacted-secret]')
                .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted-token]');
        }
        if (Array.isArray(value)) return value.map(redactValue);
        if (value && typeof value === 'object') {
            const output = {};
            for (const [key, nestedValue] of Object.entries(value)) {
                if (/password|apiKey|api_key|token|authorization|secret/i.test(key)) {
                    output[key] = '[redacted]';
                } else {
                    output[key] = redactValue(nestedValue);
                }
            }
            return output;
        }
        return value;
    }

    function emit(level, args) {
        if (level === 'debug' && !DEBUG_ENABLED) return;
        const method = level === 'debug' ? 'log' : level;
        console[method](...args.map(redactValue));
    }

    window.SafeLogger = {
        debug: (...args) => emit('debug', args),
        info: (...args) => emit('log', args),
        warn: (...args) => emit('warn', args),
        error: (...args) => emit('error', args)
    };
})();
