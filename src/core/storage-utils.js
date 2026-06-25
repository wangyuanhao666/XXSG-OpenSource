// 本地存储工具模块
// 从 script.js 中提取的存储相关函数

/**
 * 获取用户特定的存储键
 * @param {string} key - 基础键名
 * @returns {string} 用户特定的存储键
 */
export function getUserStorageKey(key) {
    // 如果有当前用户，返回用户特定的键
    if (window.currentUser && window.currentUser.username) {
        return `${window.currentUser.username}_${key}`;
    }
    // 否则返回通用键
    return key;
}

/**
 * 保存数据到localStorage
 * @param {string} key - 存储键
 * @param {any} data - 要存储的数据
 * @returns {boolean} 是否保存成功
 */
export function saveToStorage(key, data) {
    try {
        const storageKey = getUserStorageKey(key);
        localStorage.setItem(storageKey, JSON.stringify(data));
        console.log(`✅ 数据已保存: ${storageKey}`);
        return true;
    } catch (error) {
        console.error(`❌ 保存数据失败: ${key}`, error);
        return false;
    }
}

/**
 * 从localStorage加载数据
 * @param {string} key - 存储键
 * @param {any} defaultValue - 默认值
 * @returns {any} 加载的数据或默认值
 */
export function loadFromStorage(key, defaultValue = null) {
    try {
        const storageKey = getUserStorageKey(key);
        const data = localStorage.getItem(storageKey);
        if (data) {
            return JSON.parse(data);
        }
        return defaultValue;
    } catch (error) {
        console.error(`❌ 加载数据失败: ${key}`, error);
        return defaultValue;
    }
}

/**
 * 从localStorage删除数据
 * @param {string} key - 存储键
 * @returns {boolean} 是否删除成功
 */
export function removeFromStorage(key) {
    try {
        const storageKey = getUserStorageKey(key);
        localStorage.removeItem(storageKey);
        console.log(`✅ 数据已删除: ${storageKey}`);
        return true;
    } catch (error) {
        console.error(`❌ 删除数据失败: ${key}`, error);
        return false;
    }
}

/**
 * 清空所有存储数据
 * @returns {boolean} 是否清空成功
 */
export function clearAllStorage() {
    try {
        localStorage.clear();
        console.log('✅ 所有数据已清空');
        return true;
    } catch (error) {
        console.error('❌ 清空数据失败', error);
        return false;
    }
}

/**
 * 获取存储大小（字节）
 * @returns {number} 存储大小
 */
export function getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
        }
    }
    return total;
}

/**
 * 获取存储大小（可读格式）
 * @returns {string} 格式化的存储大小
 */
export function getStorageSizeFormatted() {
    const bytes = getStorageSize();
    if (bytes < 1024) {
        return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
}

/**
 * 检查存储是否可用
 * @returns {boolean} 存储是否可用
 */
export function isStorageAvailable() {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.error('❌ localStorage不可用', error);
        return false;
    }
}

/**
 * 导出所有数据
 * @returns {Object} 所有存储的数据
 */
export function exportAllData() {
    const data = {};
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            try {
                data[key] = JSON.parse(localStorage[key]);
            } catch (error) {
                data[key] = localStorage[key];
            }
        }
    }
    return data;
}

/**
 * 导入数据
 * @param {Object} data - 要导入的数据
 * @param {boolean} clearFirst - 是否先清空现有数据
 * @returns {boolean} 是否导入成功
 */
export function importData(data, clearFirst = false) {
    try {
        if (clearFirst) {
            localStorage.clear();
        }
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
            }
        }
        console.log('✅ 数据导入成功');
        return true;
    } catch (error) {
        console.error('❌ 数据导入失败', error);
        return false;
    }
}
