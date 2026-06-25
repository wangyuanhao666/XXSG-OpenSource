// 验证工具模块
// 从 script.js 中提取的验证相关功能

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 验证手机号格式（中国）
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
export function validatePhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}

/**
 * 验证用户名格式
 * @param {string} username - 用户名
 * @returns {Object} 验证结果
 */
export function validateUsername(username) {
    if (!username || username.trim().length === 0) {
        return { valid: false, message: '用户名不能为空' };
    }

    if (username.length < 3) {
        return { valid: false, message: '用户名至少3个字符' };
    }

    if (username.length > 20) {
        return { valid: false, message: '用户名最多20个字符' };
    }

    const usernameRegex = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
    if (!usernameRegex.test(username)) {
        return { valid: false, message: '用户名只能包含字母、数字、下划线和中文' };
    }

    return { valid: true, message: '用户名格式正确' };
}

/**
 * 验证密码强度
 * @param {string} credential - 密码
 * @returns {Object} 验证结果
 */
export function validatePassword(credential) {
    if (!credential || credential.length === 0) {
        return { valid: false, strength: 0, message: '密码不能为空' };
    }

    if (credential.length < 6) {
        return { valid: false, strength: 0, message: '密码至少6个字符' };
    }

    let strength = 0;

    // 包含小写字母
    if (/[a-z]/.test(credential)) strength++;
    // 包含大写字母
    if (/[A-Z]/.test(credential)) strength++;
    // 包含数字
    if (/\d/.test(credential)) strength++;
    // 包含特殊字符
    if (/[!@#$%^&*(),.?":{}|<>]/.test(credential)) strength++;
    // 长度超过8
    if (credential.length >= 8) strength++;

    const strengthText = ['很弱', '弱', '中等', '强', '很强'][Math.min(strength - 1, 4)];

    return {
        valid: strength >= 2,
        strength: strength,
        strengthText: strengthText,
        message: strength >= 2 ? `密码强度：${strengthText}` : '密码太弱，建议包含大小写字母、数字和特殊字符'
    };
}

/**
 * 验证任务标题
 * @param {string} title - 任务标题
 * @returns {Object} 验证结果
 */
export function validateTaskTitle(title) {
    if (!title || title.trim().length === 0) {
        return { valid: false, message: '任务标题不能为空' };
    }

    if (title.length > 100) {
        return { valid: false, message: '任务标题最多100个字符' };
    }

    return { valid: true, message: '任务标题格式正确' };
}

/**
 * 验证日期格式
 * @param {string} dateString - 日期字符串
 * @returns {Object} 验证结果
 */
export function validateDate(dateString) {
    if (!dateString) {
        return { valid: false, message: '日期不能为空' };
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return { valid: false, message: '日期格式无效' };
    }

    return { valid: true, date: date, message: '日期格式正确' };
}

/**
 * 验证URL格式
 * @param {string} url - URL地址
 * @returns {boolean} 是否有效
 */
export function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * 验证数字范围
 * @param {number} value - 数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {Object} 验证结果
 */
export function validateRange(value, min, max) {
    if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, message: '必须是有效数字' };
    }

    if (value < min) {
        return { valid: false, message: `值不能小于${min}` };
    }

    if (value > max) {
        return { valid: false, message: `值不能大于${max}` };
    }

    return { valid: true, message: '数值在有效范围内' };
}

/**
 * 验证必填字段
 * @param {Object} data - 数据对象
 * @param {Array} requiredFields - 必填字段列表
 * @returns {Object} 验证结果
 */
export function validateRequired(data, requiredFields) {
    const missing = [];

    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim().length === 0)) {
            missing.push(field);
        }
    }

    if (missing.length > 0) {
        return {
            valid: false,
            missing: missing,
            message: `缺少必填字段：${missing.join(', ')}`
        };
    }

    return { valid: true, message: '所有必填字段已填写' };
}

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {Array} allowedTypes - 允许的文件类型
 * @returns {Object} 验证结果
 */
export function validateFileType(file, allowedTypes) {
    if (!file) {
        return { valid: false, message: '未选择文件' };
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
        return {
            valid: false,
            message: `不支持的文件类型。允许的类型：${allowedTypes.join(', ')}`
        };
    }

    return { valid: true, message: '文件类型正确' };
}

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSizeMB - 最大文件大小（MB）
 * @returns {Object} 验证结果
 */
export function validateFileSize(file, maxSizeMB) {
    if (!file) {
        return { valid: false, message: '未选择文件' };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
        return {
            valid: false,
            message: `文件太大。最大允许${maxSizeMB}MB，当前${(file.size / 1024 / 1024).toFixed(2)}MB`
        };
    }

    return { valid: true, message: '文件大小符合要求' };
}
