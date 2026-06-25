/**
 * 🔐 安全增强模块
 * 版本: 1.0.0
 * 日期: 2025-01-04
 * 功能: JWT令牌、密码哈希、会话管理、CSRF保护
 */

// ==================== 配置 ====================
const SECURITY_CONFIG = {
    // JWT配置
    JWT: {
        SECRET: 'xiangxian-shiguang-secret-key-2025', // 在生产环境应使用更复杂的密钥
        ALGORITHM: 'HS256',
        EXPIRES_IN: '24h', // 令牌有效期
        REFRESH_THRESHOLD: 60 * 60 * 1000 // 1小时内可刷新
    },

    // 会话配置
    SESSION: {
        TIMEOUT: 24 * 60 * 60 * 1000, // 24小时超时
        WARNING_TIME: 5 * 60 * 1000, // 提前5分钟警告
        ACTIVITY_CHECK_INTERVAL: 60 * 1000 // 每分钟检查活动状态
    },

    // 密码配置
    PASSWORD: {
        MIN_LENGTH: 6,
        REQUIRE_SPECIAL: false,
        HASH_ALGORITHM: 'SHA-256',
        ITERATIONS: 1000 // PBKDF2迭代次数
    },

    // CSRF配置
    CSRF: {
        TOKEN_LENGTH: 32,
        STORAGE_KEY: 'csrf_token',
        HEADER_NAME: 'X-CSRF-Token'
    }
};

// ==================== JWT令牌管理 ====================

/**
 * JWT工具类
 * 用于生成和验证JSON Web Token
 */
class JWTManager {
    constructor() {
        this.secret = SECURITY_CONFIG.JWT.SECRET;
    }

    /**
     * 生成JWT令牌
     * @param {Object} payload - 要编码的数据
     * @param {string} expiresIn - 过期时间（如'24h'）
     * @returns {Promise<string>} JWT令牌
     */
    async generateToken(payload, expiresIn = SECURITY_CONFIG.JWT.EXPIRES_IN) {
        try {
            // 创建Header
            const header = {
                alg: SECURITY_CONFIG.JWT.ALGORITHM,
                typ: 'JWT'
            };

            // 计算过期时间
            const now = Date.now();
            const exp = now + this._parseExpiration(expiresIn);

            // 创建Payload
            const tokenPayload = {
                ...payload,
                iat: Math.floor(now / 1000), // 签发时间
                exp: Math.floor(exp / 1000), // 过期时间
                jti: this._generateJTI() // 唯一标识符
            };

            // 移除敏感信息
            delete tokenPayload.password;

            // Base64URL编码
            const encodedHeader = this._base64UrlEncode(JSON.stringify(header));
            const encodedPayload = this._base64UrlEncode(JSON.stringify(tokenPayload));

            // 生成签名
            const data = `${encodedHeader}.${encodedPayload}`;
            const signature = await this._sign(data);

            return `${data}.${signature}`;
        } catch (error) {
            console.error('❌ 生成JWT令牌失败:', error);
            throw error;
        }
    }

    /**
     * 验证JWT令牌
     * @param {string} token - JWT令牌
     * @returns {Promise<Object|null>} 解码后的payload，验证失败返回null
     */
    async verifyToken(token) {
        try {
            if (!token || typeof token !== 'string') {
                console.warn('⚠️ 无效的令牌格式');
                return null;
            }

            const parts = token.split('.');
            if (parts.length !== 3) {
                console.warn('⚠️ 令牌格式错误');
                return null;
            }

            const [encodedHeader, encodedPayload, signature] = parts;

            // 验证签名
            const data = `${encodedHeader}.${encodedPayload}`;
            const expectedSignature = await this._sign(data);

            if (signature !== expectedSignature) {
                console.warn('⚠️ 令牌签名无效');
                return null;
            }

            // 解码Payload
            const payload = JSON.parse(this._base64UrlDecode(encodedPayload));

            // 检查过期时间
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                console.warn('⚠️ 令牌已过期');
                return null;
            }

            return payload;
        } catch (error) {
            console.error('❌ 验证JWT令牌失败:', error);
            return null;
        }
    }

    /**
     * 解码JWT令牌（不验证签名）
     * @param {string} token - JWT令牌
     * @returns {Object|null} 解码后的payload
     */
    decodeToken(token) {
        try {
            if (!token || typeof token !== 'string') {
                return null;
            }

            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }

            const payload = JSON.parse(this._base64UrlDecode(parts[1]));
            return payload;
        } catch (error) {
            console.error('❌ 解码JWT令牌失败:', error);
            return null;
        }
    }

    /**
     * 检查令牌是否即将过期
     * @param {string} token - JWT令牌
     * @param {number} threshold - 提前警告时间（毫秒）
     * @returns {boolean} 是否即将过期
     */
    isTokenExpiringSoon(token, threshold = SECURITY_CONFIG.JWT.REFRESH_THRESHOLD) {
        const payload = this.decodeToken(token);
        if (!payload || !payload.exp) {
            return false;
        }

        const now = Date.now();
        const exp = payload.exp * 1000;
        return (exp - now) < threshold;
    }

    /**
     * 刷新令牌
     * @param {string} token - 旧的JWT令牌
     * @returns {Promise<string|null>} 新的JWT令牌
     */
    async refreshToken(token) {
        const payload = await this.verifyToken(token);
        if (!payload) {
            return null;
        }

        // 生成新令牌（保留原有payload）
        const { iat, exp, jti, ...data } = payload;
        return await this.generateToken(data);
    }

    // ==================== 私有方法 ====================

    /**
     * 签名数据
     * @param {string} data - 要签名的数据
     * @returns {Promise<string>} 签名
     */
    async _sign(data) {
        const msgBuffer = new TextEncoder().encode(data + this.secret);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return this._base64UrlEncode(hashArray.map(b => String.fromCharCode(b)).join(''));
    }

    /**
     * Base64URL编码
     * @param {string} str - 要编码的字符串
     * @returns {string} Base64URL编码后的字符串
     */
    _base64UrlEncode(str) {
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Base64URL解码
     * @param {string} str - 要解码的字符串
     * @returns {string} 解码后的字符串
     */
    _base64UrlDecode(str) {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        return atob(str);
    }

    /**
     * 解析过期时间
     * @param {string} expiresIn - 过期时间字符串（如'24h', '30m'）
     * @returns {number} 毫秒数
     */
    _parseExpiration(expiresIn) {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error('无效的过期时间格式');
        }

        const value = parseInt(match[1]);
        const unit = match[2];

        const multipliers = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };

        return value * multipliers[unit];
    }

    /**
     * 生成JWT ID（JTI）
     * @returns {string} 随机JTI
     */
    _generateJTI() {
        return Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

// ==================== 密码哈希管理 ====================

/**
 * 密码哈希管理器
 * 使用Web Crypto API进行密码哈希
 */
class PasswordManager {
    /**
     * 哈希密码
     * @param {string} password - 明文密码
     * @param {string} salt - 盐值（可选，如果不提供则自动生成）
     * @returns {Promise<string>} 哈希后的密码（格式: salt:hash）
     */
    async hashPassword(password, salt = null) {
        try {
            // 如果没有提供盐值，生成随机盐
            if (!salt) {
                salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
            }

            // 使用PBKDF2进行密码哈希
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                'PBKDF2',
                false,
                ['deriveBits']
            );

            const hash = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: encoder.encode(salt),
                    iterations: SECURITY_CONFIG.PASSWORD.ITERATIONS,
                    hash: SECURITY_CONFIG.PASSWORD.HASH_ALGORITHM
                },
                keyMaterial,
                256
            );

            // 转换为十六进制字符串
            const hashArray = Array.from(new Uint8Array(hash));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // 返回格式: salt:hash
            return `${salt}:${hashHex}`;
        } catch (error) {
            console.error('❌ 密码哈希失败:', error);
            throw error;
        }
    }

    /**
     * 验证密码
     * @param {string} password - 明文密码
     * @param {string} hashedPassword - 哈希后的密码（格式: salt:hash）
     * @returns {Promise<boolean>} 是否匹配
     */
    async verifyPassword(password, hashedPassword) {
        try {
            if (!password || !hashedPassword) {
                return false;
            }

            // 分离盐值和哈希值
            const [salt, originalHash] = hashedPassword.split(':');
            if (!salt || !originalHash) {
                console.error('❌ 无效的哈希密码格式');
                return false;
            }

            // 使用相同的盐值哈希输入的密码
            const newHash = await this.hashPassword(password, salt);
            const newHashValue = newHash.split(':')[1];

            // 比较哈希值
            return originalHash === newHashValue;
        } catch (error) {
            console.error('❌ 密码验证失败:', error);
            return false;
        }
    }

    /**
     * 生成随机密码
     * @param {number} length - 密码长度
     * @returns {string} 随机密码
     */
    generateRandomPassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        const randomValues = crypto.getRandomValues(new Uint8Array(length));
        return Array.from(randomValues, byte => charset[byte % charset.length]).join('');
    }

    /**
     * 验证密码强度
     * @param {string} password - 密码
     * @returns {Object} 强度信息
     */
    validatePasswordStrength(password) {
        const result = {
            isValid: true,
            strength: 'weak',
            errors: []
        };

        if (password.length < SECURITY_CONFIG.PASSWORD.MIN_LENGTH) {
            result.isValid = false;
            result.errors.push(`密码长度至少${SECURITY_CONFIG.PASSWORD.MIN_LENGTH}位`);
        }

        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasLower) result.errors.push('需要包含小写字母');
        if (!hasUpper) result.errors.push('需要包含大写字母');
        if (!hasNumber) result.errors.push('需要包含数字');
        if (SECURITY_CONFIG.PASSWORD.REQUIRE_SPECIAL && !hasSpecial) {
            result.errors.push('需要包含特殊字符');
        }

        // 计算强度
        const conditions = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
        if (conditions >= 3 && password.length >= 8) {
            result.strength = 'strong';
        } else if (conditions >= 2 && password.length >= 6) {
            result.strength = 'medium';
        }

        return result;
    }
}

// ==================== 会话管理 ====================

/**
 * 会话管理器
 * 处理用户会话、过期检查、活动监控
 */
class SessionManager {
    constructor() {
        this.jwt = new JWTManager();
        this.activityTimer = null;
        this.warningShown = false;
    }

    /**
     * 创建用户会话
     * @param {Object} user - 用户对象
     * @param {boolean} rememberMe - 是否记住登录
     * @returns {Promise<Object>} 会话信息
     */
    async createSession(user, rememberMe = false) {
        try {
            // 生成JWT令牌
            const token = await this.jwt.generateToken({
                userId: user.id,
                username: user.username,
                role: user.role,
                permissions: user.permissions
            });

            // 生成CSRF令牌
            const csrfToken = this._generateCSRFToken();

            // 创建会话对象
            const session = {
                accessToken: token,
                csrfToken: csrfToken,
                rememberMe: rememberMe,
                createdAt: Date.now(),
                lastActivity: Date.now(),
                expiresAt: Date.now() + SECURITY_CONFIG.SESSION.TIMEOUT
            };

            // 存储会话
            if (rememberMe) {
                localStorage.setItem('app_session', JSON.stringify(session));
            } else {
                sessionStorage.setItem('app_session', JSON.stringify(session));
            }

            // 开始活动监控
            this.startActivityMonitoring();

            console.log('✅ 会话创建成功');
            return session;
        } catch (error) {
            console.error('❌ 创建会话失败:', error);
            throw error;
        }
    }

    /**
     * 获取当前会话
     * @returns {Object|null} 会话对象
     */
    getSession() {
        try {
            // 尝试从localStorage获取
            let sessionStr = localStorage.getItem('app_session');

            // 如果没有，尝试从sessionStorage获取
            if (!sessionStr) {
                sessionStr = sessionStorage.getItem('app_session');
            }

            if (!sessionStr) {
                return null;
            }

            const session = JSON.parse(sessionStr);

            // 检查是否过期
            if (this.isSessionExpired(session)) {
                this.destroySession();
                return null;
            }

            return session;
        } catch (error) {
            console.error('❌ 获取会话失败:', error);
            return null;
        }
    }

    /**
     * 验证会话
     * @returns {Promise<Object|null>} 用户信息，验证失败返回null
     */
    async validateSession() {
        try {
            const session = this.getSession();
            if (!session) {
                return null;
            }

            // 验证JWT令牌
            const payload = await this.jwt.verifyToken(session.accessToken);
            if (!payload) {
                console.warn('⚠️ JWT令牌验证失败');
                this.destroySession();
                return null;
            }

            // 更新最后活动时间
            this.updateActivity();

            return payload;
        } catch (error) {
            console.error('❌ 验证会话失败:', error);
            this.destroySession();
            return null;
        }
    }

    /**
     * 刷新会话
     * @returns {Promise<boolean>} 是否成功
     */
    async refreshSession() {
        try {
            const session = this.getSession();
            if (!session) {
                return false;
            }

            // 刷新JWT令牌
            const newToken = await this.jwt.refreshToken(session.accessToken);
            if (!newToken) {
                return false;
            }

            // 更新会话
            session.accessToken = newToken;
            session.lastActivity = Date.now();

            // 保存会话
            this._saveSession(session);

            console.log('✅ 会话已刷新');
            return true;
        } catch (error) {
            console.error('❌ 刷新会话失败:', error);
            return false;
        }
    }

    /**
     * 销毁会话
     */
    destroySession() {
        localStorage.removeItem('app_session');
        sessionStorage.removeItem('app_session');
        this.stopActivityMonitoring();
        console.log('✅ 会话已销毁');
    }

    /**
     * 检查会话是否过期
     * @param {Object} session - 会话对象
     * @returns {boolean} 是否过期
     */
    isSessionExpired(session) {
        if (!session || !session.expiresAt) {
            return true;
        }
        return Date.now() > session.expiresAt;
    }

    /**
     * 检查会话是否即将过期
     * @returns {boolean} 是否即将过期
     */
    isSessionExpiringSoon() {
        const session = this.getSession();
        if (!session) {
            return false;
        }

        const timeLeft = session.expiresAt - Date.now();
        return timeLeft < SECURITY_CONFIG.SESSION.WARNING_TIME;
    }

    /**
     * 更新活动时间
     */
    updateActivity() {
        const session = this.getSession();
        if (session) {
            session.lastActivity = Date.now();
            this._saveSession(session);
        }
    }

    /**
     * 开始活动监控
     */
    startActivityMonitoring() {
        // 监听用户活动
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => this.updateActivity(), { passive: true });
        });

        // 定期检查会话状态
        this.activityTimer = setInterval(() => {
            this._checkSessionStatus();
        }, SECURITY_CONFIG.SESSION.ACTIVITY_CHECK_INTERVAL);
    }

    /**
     * 停止活动监控
     */
    stopActivityMonitoring() {
        if (this.activityTimer) {
            clearInterval(this.activityTimer);
            this.activityTimer = null;
        }
    }

    // ==================== 私有方法 ====================

    /**
     * 保存会话
     * @param {Object} session - 会话对象
     */
    _saveSession(session) {
        if (session.rememberMe) {
            localStorage.setItem('app_session', JSON.stringify(session));
        } else {
            sessionStorage.setItem('app_session', JSON.stringify(session));
        }
    }

    /**
     * 检查会话状态
     * @private
     */
    _checkSessionStatus() {
        const session = this.getSession();

        if (!session) {
            return;
        }

        // 检查是否过期
        if (this.isSessionExpired(session)) {
            this.destroySession();
            this._handleSessionExpired();
            return;
        }

        // 检查是否即将过期
        if (this.isSessionExpiringSoon() && !this.warningShown) {
            this.warningShown = true;
            this._showSessionWarning();
        }

        // 检查是否需要刷新令牌
        if (this.jwt.isTokenExpiringSoon(session.accessToken)) {
            this.refreshSession();
        }
    }

    /**
     * 处理会话过期
     * @private
     */
    _handleSessionExpired() {
        console.log('⚠️ 会话已过期');
        // 显示提示或自动登出
        if (typeof showNotification === 'function') {
            showNotification('会话已过期，请重新登录', 'warning');
        }

        // 延迟跳转到登录页
        setTimeout(() => {
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }, 2000);
    }

    /**
     * 显示会话即将过期的警告
     * @private
     */
    _showSessionWarning() {
        const timeLeft = Math.floor((this.getSession().expiresAt - Date.now()) / 1000 / 60);
        if (typeof showNotification === 'function') {
            showNotification(`会话将在${timeLeft}分钟后过期`, 'warning');
        }
    }

    /**
     * 生成CSRF令牌
     * @returns {string} CSRF令牌
     * @private
     */
    _generateCSRFToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.CSRF.TOKEN_LENGTH)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
}

// ==================== CSRF保护 ====================

/**
 * CSRF保护管理器
 */
class CSRFManager {
    constructor() {
        this.token = null;
        this._loadToken();
    }

    /**
     * 获取CSRF令牌
     * @returns {string} CSRF令牌
     */
    getToken() {
        if (!this.token) {
            this.token = this._generateToken();
            this._saveToken();
        }
        return this.token;
    }

    /**
     * 验证CSRF令牌
     * @param {string} token - 要验证的令牌
     * @returns {boolean} 是否有效
     */
    validateToken(token) {
        return token === this.getToken();
    }

    /**
     * 刷新CSRF令牌
     */
    refreshToken() {
        this.token = this._generateToken();
        this._saveToken();
    }

    /**
     * 为请求添加CSRF令牌
     * @param {Object} headers - 请求头对象
     * @returns {Object} 添加了CSRF令牌的请求头
     */
    addTokenToHeaders(headers = {}) {
        headers[SECURITY_CONFIG.CSRF.HEADER_NAME] = this.getToken();
        return headers;
    }

    // ==================== 私有方法 ====================

    /**
     * 生成CSRF令牌
     * @returns {string}
     * @private
     */
    _generateToken() {
        return Array.from(crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.CSRF.TOKEN_LENGTH)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * 保存CSRF令牌
     * @private
     */
    _saveToken() {
        sessionStorage.setItem(SECURITY_CONFIG.CSRF.STORAGE_KEY, this.token);
    }

    /**
     * 加载CSRF令牌
     * @private
     */
    _loadToken() {
        this.token = sessionStorage.getItem(SECURITY_CONFIG.CSRF.STORAGE_KEY);
    }
}

// ==================== 导出 ====================

// 创建全局实例
window.Security = {
    JWT: new JWTManager(),
    Password: new PasswordManager(),
    Session: new SessionManager(),
    CSRF: new CSRFManager(),
    Config: SECURITY_CONFIG
};

console.log('🔐 安全模块已加载');
