// 格式化工具模块
// 从 script.js 中提取的格式化相关功能

/**
 * 格式化数字（千分位）
 * @param {number} num - 数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num) {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString('zh-CN');
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + units[i];
}

/**
 * 格式化时长（秒转为可读格式）
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时长
 */
export function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}秒`;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0) parts.push(`${minutes}分钟`);
    if (secs > 0) parts.push(`${secs}秒`);

    return parts.join('');
}

/**
 * 格式化百分比
 * @param {number} value - 数值（0-1或0-100）
 * @param {number} decimals - 小数位数
 * @param {boolean} isDecimal - 是否是小数形式（0-1）
 * @returns {string} 格式化后的百分比
 */
export function formatPercentage(value, decimals = 1, isDecimal = false) {
    const percentage = isDecimal ? value * 100 : value;
    return percentage.toFixed(decimals) + '%';
}

/**
 * 格式化货币
 * @param {number} amount - 金额
 * @param {string} currency - 货币符号
 * @returns {string} 格式化后的货币
 */
export function formatCurrency(amount, currency = '¥') {
    return currency + formatNumber(amount.toFixed(2));
}

/**
 * 格式化相对时间
 * @param {Date|string} date - 日期
 * @returns {string} 相对时间描述
 */
export function formatRelativeTime(date) {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now - targetDate;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return '刚刚';
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}周前`;
    if (diffDay < 365) return `${Math.floor(diffDay / 30)}个月前`;
    return `${Math.floor(diffDay / 365)}年前`;
}

/**
 * 格式化电话号码
 * @param {string} phone - 电话号码
 * @returns {string} 格式化后的电话号码
 */
export function formatPhoneNumber(phone) {
    if (!phone) return '';

    // 移除所有非数字字符
    const cleaned = phone.replace(/\D/g, '');

    // 中国手机号格式：138-1234-5678
    if (cleaned.length === 11) {
        return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }

    return phone;
}

/**
 * 格式化银行卡号
 * @param {string} cardNumber - 银行卡号
 * @returns {string} 格式化后的银行卡号
 */
export function formatBankCard(cardNumber) {
    if (!cardNumber) return '';

    // 移除所有空格
    const cleaned = cardNumber.replace(/\s/g, '');

    // 每4位添加一个空格
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * 格式化文本（截断并添加省略号）
 * @param {string} text - 文本
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀（默认...）
 * @returns {string} 格式化后的文本
 */
export function truncateText(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + suffix;
}

/**
 * 格式化JSON（美化输出）
 * @param {Object} obj - 对象
 * @param {number} indent - 缩进空格数
 * @returns {string} 格式化后的JSON字符串
 */
export function formatJSON(obj, indent = 2) {
    try {
        return JSON.stringify(obj, null, indent);
    } catch (error) {
        console.error('格式化JSON失败:', error);
        return '';
    }
}

/**
 * 格式化优先级文本
 * @param {number} priority - 优先级（1-4）
 * @returns {string} 优先级文本
 */
export function formatPriority(priority) {
    const priorities = {
        1: '重要且紧急',
        2: '重要不紧急',
        3: '不重要但紧急',
        4: '不重要不紧急'
    };
    return priorities[priority] || '未知';
}

/**
 * 格式化完成率
 * @param {number} completed - 已完成数
 * @param {number} total - 总数
 * @returns {string} 完成率文本
 */
export function formatCompletionRate(completed, total) {
    if (total === 0) return '0%';
    const rate = (completed / total * 100).toFixed(1);
    return `${rate}% (${completed}/${total})`;
}

/**
 * 首字母大写
 * @param {string} str - 字符串
 * @returns {string} 首字母大写的字符串
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 驼峰转下划线
 * @param {string} str - 驼峰字符串
 * @returns {string} 下划线字符串
 */
export function camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * 下划线转驼峰
 * @param {string} str - 下划线字符串
 * @returns {string} 驼峰字符串
 */
export function snakeToCamel(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 移除HTML标签
 * @param {string} html - HTML字符串
 * @returns {string} 纯文本
 */
export function stripHTML(html) {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    return doc.body.textContent || '';
}

/**
 * 转义HTML特殊字符
 * @param {string} text - 文本
 * @returns {string} 转义后的文本
 */
export function escapeHTML(text) {
    return String(text || '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}
