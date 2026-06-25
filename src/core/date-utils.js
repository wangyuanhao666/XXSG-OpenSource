// 日期工具函数模块
// 从 script.js 中提取的日期处理相关函数

// 日历星期标签（中文）
const calendarWeekdaysFullZh = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/**
 * 格式化时间范围
 * @param {Date} start - 开始时间
 * @param {Date} end - 结束时间
 * @returns {string} 格式化的时间范围字符串
 */
export function formatTimeRange(start, end) {
    return `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')} - ${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 格式化周范围
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的周范围字符串
 */
export function formatWeekRange(date) {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
}

/**
 * 格式化日期标签
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的日期标签
 */
export function formatDayLabel(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${calendarWeekdaysFullZh[getWeekdayIndex(date)]}`;
}

/**
 * 格式化月份标签
 * @param {Date} date - 日期对象
 * @returns {string} 格式化的月份标签
 */
export function formatMonthLabel(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

/**
 * 获取一天的开始时间（00:00:00）
 * @param {Date} date - 日期对象
 * @returns {Date} 一天开始的日期对象
 */
export function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * 获取一周的开始时间（周一00:00:00）
 * @param {Date} date - 日期对象
 * @returns {Date} 一周开始的日期对象
 */
export function startOfWeek(date) {
    const start = startOfDay(date);
    const weekdayIndex = getWeekdayIndex(start); // 周一=0
    return addDays(start, -weekdayIndex);
}

/**
 * 添加天数
 * @param {Date} date - 日期对象
 * @param {number} days - 要添加的天数
 * @returns {Date} 新的日期对象
 */
export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * 添加月份
 * @param {Date} date - 日期对象
 * @param {number} months - 要添加的月份数
 * @returns {Date} 新的日期对象
 */
export function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

/**
 * 获取星期索引（周一=0, 周日=6）
 * @param {Date} date - 日期对象
 * @returns {number} 星期索引
 */
export function getWeekdayIndex(date) {
    return (date.getDay() + 6) % 7;
}

/**
 * 判断两个日期是否是同一天
 * @param {Date} a - 第一个日期
 * @param {Date} b - 第二个日期
 * @returns {boolean} 是否是同一天
 */
export function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

/**
 * 格式化任务日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化的日期字符串
 */
export function formatTaskDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}

/**
 * 格式化任务结束日期
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化的结束日期字符串
 */
export function formatTaskEndDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return `已逾期${Math.abs(diffDays)}天`;
    } else if (diffDays === 0) {
        return '今天到期';
    } else if (diffDays === 1) {
        return '明天到期';
    } else if (diffDays <= 7) {
        return `${diffDays}天后到期`;
    } else {
        return formatTaskDate(dateString);
    }
}

/**
 * 格式化详细时间戳
 * @param {Object} task - 任务对象
 * @returns {string} 格式化的时间戳字符串
 */
export function formatDetailTimestamp(task) {
    if (!task.createdAt) return '';
    const date = new Date(task.createdAt);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}
