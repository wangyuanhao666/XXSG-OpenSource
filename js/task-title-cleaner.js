/**
 * Cleans task titles rendered from imported or AI-assisted task text.
 */
(function () {
    window.cleanTaskTitle = function (title) {
        if (!title) return '?????';
        let cleaned = String(title).replace(/\n/g, '');
        cleaned = cleaned.replace(/\s/g, '');
        cleaned = cleaned.replace(/:/g, ': ');
        cleaned = cleaned.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2');
        cleaned = cleaned.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2');
        return cleaned.replace(/\s+/g, ' ').trim();
    };
})();
