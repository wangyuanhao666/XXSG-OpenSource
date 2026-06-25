/**
 * 🔐 安全存储管理器
 * 提供加密的localStorage和sessionStorage操作
 * 使用Web Crypto API进行AES-GCM加密
 * 版本: 1.0.0
 * 日期: 2025-01-08
 */

class SecureStorage {
    constructor() {
        this.key = null;
        this.keySalt = 'xxsg-secure-storage-salt-2025';
        this.isReady = false;
        this._init();
    }

    /**
     * 初始化加密密钥
     * @private
     */
    async _init() {
        try {
            // 每次都从相同的盐值派生密钥，不需要存储
            this.key = await this._generateKey();
            console.log('🔑 加密密钥已生成');
            this.isReady = true;
        } catch (error) {
            console.error('❌ 初始化安全存储失败:', error);
            throw error;
        }
    }

    /**
     * 等待存储管理器就绪
     * @returns {Promise<void>}
     */
    async ready() {
        while (!this.isReady) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    /**
     * 生成加密密钥（每次都从相同参数派生，不需要导出和存储）
     * @private
     */
    async _generateKey() {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(this.keySalt),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        // 使用用户的浏览器指纹作为额外的盐值
        const fingerprint = this._generateFingerprint();

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(fingerprint),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,  // 不可导出，提高安全性
            ['encrypt', 'decrypt']
        );
    }

    /**
     * 生成浏览器指纹
     * @private
     */
    _generateFingerprint() {
        const values = [
            navigator.userAgent,
            navigator.language,
            screen.width,
            screen.height,
            new Date().getTimezoneOffset(),
            !!window.sessionStorage
        ];
        return values.join('|');
    }

    /**
     * 加密数据
     * @param {string} data - 要加密的数据
     * @returns {Promise<string>} 加密后的数据（Base64格式）
     * @private
     */
    async _encrypt(data) {
        try {
            const encoder = new TextEncoder();
            const iv = crypto.getRandomValues(new Uint8Array(12));

            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.key,
                encoder.encode(data)
            );

            // 组合IV和加密数据
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            return btoa(String.fromCharCode(...combined));
        } catch (error) {
            console.error('❌ 加密失败:', error);
            throw error;
        }
    }

    /**
     * 解密数据
     * @param {string} encryptedData - 加密的数据（Base64格式）
     * @returns {Promise<string>} 解密后的数据
     * @private
     */
    async _decrypt(encryptedData) {
        try {
            const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

            // 分离IV和加密数据
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                this.key,
                encrypted
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('❌ 解密失败:', error);
            return null;
        }
    }

    /**
     * 安全地存储数据
     * @param {string} key - 存储键名
     * @param {any} value - 要存储的值
     * @param {boolean} useSessionStorage - 是否使用sessionStorage
     * @returns {Promise<boolean>} 是否成功
     */
    async setSecure(key, value, useSessionStorage = false) {
        try {
            await this.ready();

            const jsonValue = JSON.stringify(value);
            const encrypted = await this._encrypt(jsonValue);

            const storageKey = `__secure_${key}`;
            const storage = useSessionStorage ? sessionStorage : localStorage;

            storage.setItem(storageKey, encrypted);
            console.log(`✅ 安全存储: ${storageKey}`);
            return true;
        } catch (error) {
            console.error(`❌ 安全存储失败 (${key}):`, error);
            return false;
        }
    }

    /**
     * 安全地获取数据
     * @param {string} key - 存储键名
     * @param {any} defaultValue - 默认值
     * @returns {Promise<any>} 存储的值
     */
    async getSecure(key, defaultValue = null) {
        try {
            await this.ready();

            // 先尝试localStorage，再尝试sessionStorage
            let storageKey = `__secure_${key}`;
            let encrypted = localStorage.getItem(storageKey);

            if (!encrypted) {
                encrypted = sessionStorage.getItem(storageKey);
            }

            if (!encrypted) {
                return defaultValue;
            }

            const decrypted = await this._decrypt(encrypted);

            if (!decrypted) {
                console.warn(`⚠️ 解密失败，返回默认值: ${key}`);
                return defaultValue;
            }

            return JSON.parse(decrypted);
        } catch (error) {
            console.error(`❌ 安全获取失败 (${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * 删除安全存储的数据
     * @param {string} key - 存储键名
     */
    removeSecure(key) {
        const storageKey = `__secure_${key}`;
        localStorage.removeItem(storageKey);
        sessionStorage.removeItem(storageKey);
        console.log(`🗑️ 删除安全存储: ${storageKey}`);
    }

    /**
     * 清除所有安全存储的数据
     */
    clearSecure() {
        const keys = [
            'adminPassword',
            'deepSeekApiKey',
            'aiConfig',
            'userCredentials',
            'savedCredentials'
        ];

        keys.forEach(key => this.removeSecure(key));
        console.log('🗑️ 清除所有安全存储');
    }

    /**
     * 迁移现有的明文数据到加密存储
     * @returns {Promise<Object>} 迁移结果
     */
    async migrateExistingData() {
        console.log('🔄 开始迁移现有数据到加密存储...');

        const result = {
            migrated: [],
            failed: [],
            cleaned: []
        };

        try {
            await this.ready();

            // 1. 迁移管理员密码
            const adminPassword = localStorage.getItem('adminPassword');
            if (adminPassword && !adminPassword.includes(':')) {
                await this.setSecure('adminPassword', adminPassword);
                result.migrated.push('adminPassword');
                localStorage.removeItem('adminPassword');
            }

            // 2. 迁移DeepSeek API密钥
            const deepSeekKey = localStorage.getItem('deepSeekApiKey');
            if (deepSeekKey) {
                await this.setSecure('deepSeekApiKey', deepSeekKey);
                result.migrated.push('deepSeekApiKey');
                localStorage.removeItem('deepSeekApiKey');
            }

            // 3. 迁移AI配置
            const aiConfig = localStorage.getItem('aiConfig');
            if (aiConfig) {
                const config = JSON.parse(aiConfig);
                await this.setSecure('aiConfig', config);
                result.migrated.push('aiConfig');
                localStorage.removeItem('aiConfig');
            }

            // 4. 迁移保存的凭据
            const savedCredentials = localStorage.getItem('savedCredentials');
            if (savedCredentials) {
                const credentials = JSON.parse(savedCredentials);
                await this.setSecure('savedCredentials', credentials);
                result.migrated.push('savedCredentials');
                localStorage.removeItem('savedCredentials');
            }

            // 5. 清理会话中的敏感信息
            sessionStorage.removeItem('userSession');
            result.cleaned.push('userSession');

            // 6. 标记迁移完成
            localStorage.setItem('secure_storage_migration', 'completed');
            localStorage.setItem('secure_storage_migration_date', new Date().toISOString());

            console.log('✅ 数据迁移完成:', result);
            return result;
        } catch (error) {
            console.error('❌ 数据迁移失败:', error);
            result.failed.push(error.message);
            return result;
        }
    }

    /**
     * 验证存储的数据是否加密
     * @param {string} key - 存储键名
     * @returns {Promise<boolean>} 是否已加密
     */
    async isSecure(key) {
        const storageKey = `__secure_${key}`;
        return !!(localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey));
    }

    /**
     * 获取加密存储的状态信息
     * @returns {Promise<Object>} 状态信息
     */
    async getStatus() {
        const items = {
            adminPassword: await this.isSecure('adminPassword'),
            deepSeekApiKey: await this.isSecure('deepSeekApiKey'),
            aiConfig: await this.isSecure('aiConfig'),
            savedCredentials: await this.isSecure('savedCredentials')
        };

        const allSecure = Object.values(items).every(v => v);

        return {
            allSecure,
            items,
            migrationCompleted: localStorage.getItem('secure_storage_migration') === 'completed',
            migrationDate: localStorage.getItem('secure_storage_migration_date')
        };
    }
}

// 创建全局实例
const secureStorage = new SecureStorage();

// 导出（同时导出大小写版本，兼容不同的使用方式）
window.SecureStorage = secureStorage;
window.secureStorage = secureStorage;  // 🔧 兼容小写版本

console.log('🔐 安全存储管理器已加载');
