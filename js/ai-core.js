// ==================== AI功能增强 ====================

const AI_SERVICE_PRESETS = {
    deepseek: { name: 'DeepSeek', endpoint: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat', protocol: 'openai-compatible' },
    openai: { name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-3.5-turbo', protocol: 'openai-compatible' },
    claude: { name: 'Claude', endpoint: 'https://api.anthropic.com/v1/messages', model: 'claude-sonnet-4-5', protocol: 'anthropic-messages' },
    kimi: { name: 'Kimi', endpoint: 'https://api.moonshot.cn/v1/chat/completions', model: 'kimi-k2.6', protocol: 'openai-compatible' },
    qwen: { name: '通义千问 Qwen', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', model: 'qwen-plus', protocol: 'openai-compatible' },
    glm: { name: 'GLM / Z.ai', endpoint: 'https://api.z.ai/api/paas/v4/chat/completions', model: 'glm-4.5-flash', protocol: 'openai-compatible' },
    minimax: { name: 'MiniMax', endpoint: 'https://api.minimax.io/v1/chat/completions', model: 'MiniMax-M3', protocol: 'openai-compatible' }
};

function createAIServiceState() {
    return Object.fromEntries(Object.entries(AI_SERVICE_PRESETS).map(([id, preset]) => [
        id,
        { ...preset, enabled: false, apiKey: null }
    ]));
}

// AI服务管理器
class AIServiceManager {
    constructor() {
        // 🔐 内部存储（真实的 API Key 存在这里）
        this._services = createAIServiceState();

        this.currentService = 'deepseek';

        // 🔐 使用 Proxy 保护 services 属性
        const self = this;
        this.services = new Proxy(this._services, {
            get(target, prop) {
                // 返回安全副本（不包含 apiKey）
                if (target[prop]) {
                    const service = target[prop];
                    return {
                        name: service.name,
                        enabled: service.enabled,
                        // 🔐 不暴露 apiKey
                        endpoint: service.endpoint,
                        model: service.model,
                        protocol: service.protocol
                    };
                }
                return target[prop];
            },
            set(target, prop, value) {
                // 允许修改，但记录警告
                SafeLogger.warn('⚠️ 出于安全考虑，建议使用 setAPIKey() 方法');
                target[prop] = value;
                return true;
            }
        });

        this.init();
    }

    async init() {
        debugLog('🤖 AI服务管理器初始化');
        await this.loadAIConfig();
    }

    // 加载AI配置
    async loadAIConfig() {
        debugLog('🔧 加载AI配置...');

        // 首先尝试从加密存储中加载
        let aiConfig = null;

        // 等待安全存储就绪
        if (window.secureStorage) {
            await window.secureStorage.ready();
            aiConfig = await window.secureStorage.getSecure('aiConfig');
        }

        // 如果加密存储中没有，尝试从旧的localStorage迁移
        if (!aiConfig) {
            const oldConfig = window.DataSyncStorage.getRaw('aiConfig');
            if (oldConfig) {
                try {
                    aiConfig = JSON.parse(oldConfig);
                    // 迁移到加密存储并删除明文
                    if (window.secureStorage) {
                        await window.secureStorage.setSecure('aiConfig', aiConfig);
                        window.DataSyncStorage.removeRaw('aiConfig');
                        debugLog('🔄 已迁移AI配置到加密存储');
                    }
                } catch (error) {
                    SafeLogger.error('❌ 解析AI配置失败:', error);
                }
            }
        }

        if (aiConfig) {
            try {
                debugLog('📋 找到AI配置');

                // 🔐 使用 _services 访问真实数据
                Object.keys(this._services).forEach(serviceName => {
                    this._services[serviceName].enabled = aiConfig[serviceName]?.enabled || false;
                    this._services[serviceName].apiKey = aiConfig[serviceName]?.apiKey || null;
                });
                this.currentService = aiConfig.currentService || 'deepseek';

                debugLog('✅ AI配置加载完成:', {
                    services: Object.fromEntries(Object.entries(this._services).map(([name, service]) => [
                        name,
                        { enabled: service.enabled, hasKey: !!service.apiKey }
                    ])),
                    currentService: this.currentService
                });
            } catch (error) {
                SafeLogger.error('❌ 解析AI配置失败:', error);
            }
        }

        // 兼容旧的DeepSeek配置
        const oldDeepSeekKey = window.DataSyncStorage.getRaw('deepSeekApiKey');
        if (oldDeepSeekKey && !this._services.deepseek.apiKey) {
            debugLog('🔄 发现旧的DeepSeek配置，迁移中...');
            this._services.deepseek.apiKey = oldDeepSeekKey;
            this._services.deepseek.enabled = true;
            await this.saveAIConfig();
            // 删除明文密钥
            window.DataSyncStorage.removeRaw('deepSeekApiKey');
        }

        // 如果仍然没有配置，尝试从AI签语配置中获取
        if (!this._services.deepseek.apiKey) {
            const fortuneApiKey = window.DataSyncStorage.getRaw('deepSeekApiKey');
            if (fortuneApiKey) {
                debugLog('🔄 从AI签语配置中获取API Key...');
                this._services.deepseek.apiKey = fortuneApiKey;
                this._services.deepseek.enabled = true;
                await this.saveAIConfig();
                window.DataSyncStorage.removeRaw('deepSeekApiKey');
            }
        }

        // 检查是否有可用的服务
        const availableService = this.getAvailableService();
        if (availableService) {
            debugLog('✅ 找到可用的AI服务:', availableService);
        } else {
            SafeLogger.warn('⚠️ 没有可用的AI服务，请配置API Key');
        }
    }

    // 保存AI配置
    async saveAIConfig() {
        const config = Object.fromEntries(Object.entries(this._services).map(([serviceName, service]) => [
            serviceName,
            {
                enabled: service.enabled,
                apiKey: service.apiKey
            }
        ]));
        config.currentService = this.currentService;

        if (window.secureStorage) {
            await window.secureStorage.ready();
            await window.secureStorage.setSecure('aiConfig', config);
            debugLog('✅ AI配置已加密保存');
        } else {
            // 降级方案：仍然使用明文存储（不推荐）
            SafeLogger.warn('⚠️ 安全存储未就绪，使用明文存储');
            window.DataSyncStorage.setRaw('aiConfig', JSON.stringify(config));
        }
    }

    // 设置API密钥
    async setAPIKey(service, apiKey) {
        if (this._services[service]) {
            this._services[service].apiKey = apiKey;
            this._services[service].enabled = !!apiKey;
            if (apiKey) {
                this.currentService = service;
            }
            await this.saveAIConfig();
            debugLog(`✅ ${service} API密钥已设置`);
        }
    }

    // 获取当前可用的AI服务
    getAvailableService() {
        const selected = this._services[this.currentService];
        if (selected?.enabled && selected.apiKey) {
            return this.currentService;
        }

        for (const [serviceName, service] of Object.entries(this._services)) {
            if (service.enabled && service.apiKey) {
                return serviceName;
            }
        }
        return null;
    }

    // 调试AI配置状态
    async debugAIConfig() {
        SafeLogger.debug('🔍 AI配置调试信息:');
        SafeLogger.debug('当前服务:', this.currentService);

        // 🔐 安全输出：不显示明文 API key
        SafeLogger.debug('服务状态:', Object.fromEntries(Object.entries(this._services).map(([name, service]) => [
            name,
            {
                enabled: service.enabled,
                hasKey: !!service.apiKey,
                keyLength: service.apiKey?.length || 0,
                keyPreview: service.apiKey ? '***' + service.apiKey.slice(-4) : '无'
            }
        ])));

        // 检查存储中的配置（加密）
        let storageInfo = {};
        if (window.secureStorage) {
            try {
                await window.secureStorage.ready();
                const aiConfigSecure = await window.secureStorage.getSecure('aiConfig');
                storageInfo = {
                    encrypted: !!aiConfigSecure,
                    encryption: 'AES-GCM 256-bit',
                    status: aiConfigSecure ? '🔐 已加密存储' : '无配置'
                };
            } catch (e) {
                storageInfo = { error: '无法读取加密配置' };
            }
        }
        // 检查是否还有明文配置（应该被迁移）
        const oldPlainConfig = window.DataSyncStorage.getRaw('aiConfig');
        const oldDeepSeekKey = window.DataSyncStorage.getRaw('deepSeekApiKey');
        if (oldPlainConfig || oldDeepSeekKey) {
            SafeLogger.warn('⚠️ 发现明文配置，建议迁移到加密存储');
        }

        SafeLogger.debug('存储配置:', storageInfo);

        // 🔐 安全返回：不包含明文 API key
        return {
            currentService: this.currentService,
            availableService: this.getAvailableService(),
            services: Object.fromEntries(Object.entries(this._services).map(([name, service]) => [
                name,
                {
                    enabled: service.enabled,
                    hasKey: !!service.apiKey,
                    keyLength: service.apiKey?.length || 0
                }
            ])),
            storage: storageInfo,
            hasPlaintext: !!(oldPlainConfig || oldDeepSeekKey)
        };
    }

    // 调用AI服务
    async callAI(prompt, options = {}) {
        const serviceName = this.getAvailableService();
        if (!serviceName) {
            throw new Error('没有可用的AI服务');
        }

        // 🔐 使用 _services 访问真实数据（包含 apiKey）
        const service = this._services[serviceName];
        SafeLogger.debug(`🤖 使用${service.name}服务处理请求`);

        try {
            const response = await this.makeAPIRequest(service, prompt, options);
            return this.parseAIResponse(response, serviceName);
        } catch (error) {
            SafeLogger.error(`AI服务调用失败 (${serviceName}):`, error);
            throw error;
        }
    }

    // 发起API请求
    async makeAPIRequest(service, prompt, options) {
        SafeLogger.debug('🔧 准备API请求:', {
            service: service.name,
            endpoint: service.endpoint,
            hasApiKey: !!service.apiKey
        });

        // 检查API Key
        if (!service.apiKey) {
            throw new Error('API Key未配置，请在管理员后台配置');
        }

        const systemPrompt = options.systemPrompt || '你是一个智能的任务管理助手，专门帮助用户分析任务并给出建议。';
        const requestBody = this.buildAIRequestBody(service, prompt, {
            ...options,
            systemPrompt
        });
        const requestHeaders = this.buildAIRequestHeaders(service);

        SafeLogger.debug('📤 发送API请求:', {
            model: requestBody.model,
            messageCount: requestBody.messages.length,
            maxTokens: requestBody.max_tokens,
            serviceName: service.name,
            endpoint: service.endpoint
        });

        try {
            const response = await fetch(service.endpoint, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify(requestBody)
            });

            SafeLogger.debug('📥 API响应状态:', response.status, response.statusText);

            if (!response.ok) {
                // 尝试获取详细错误信息
                let errorDetail = '';
                let errorMessage = '';
                try {
                    const errorResponse = await response.json();
                    errorDetail = errorResponse.error ? JSON.stringify(errorResponse.error) : '';
                    errorMessage = errorResponse.error?.message || errorResponse.message || '';
                } catch (e) {
                    errorDetail = await response.text();
                }

                SafeLogger.error('❌ API请求失败详情:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorDetail: errorDetail,
                    errorMessage: errorMessage,
                    model: requestBody.model,
                    endpoint: service.endpoint
                });

                // 提供更友好的错误信息
                if (response.status === 400 && errorMessage.includes('Model Not Exist')) {
                    throw new Error(`模型不存在: ${requestBody.model}。请检查模型名称是否正确。`);
                } else if (response.status === 401) {
                    throw new Error('API Key无效或已过期，请检查配置');
                } else if (response.status === 402) {
                    throw new Error('账户余额不足，请充值后重试');
                } else if (response.status === 429) {
                    throw new Error('请求频率过高，请稍后重试');
                } else {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}. ${errorMessage || errorDetail}`);
                }
            }

            const result = await response.json();
            SafeLogger.debug('AI request succeeded.', {
                hasChoices: Array.isArray(result?.choices),
                choiceCount: Array.isArray(result?.choices) ? result.choices.length : 0
            });
            return result;

        } catch (error) {
            SafeLogger.error('❌ API请求异常:', error);
            throw error;
        }
    }

    buildAIRequestBody(service, prompt, options = {}) {
        if (service.protocol === 'anthropic-messages') {
            return {
                model: service.model,
                system: options.systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 500,
                stream: false
            };
        }

        return {
            model: service.model,
            messages: [
                {
                    role: 'system',
                    content: options.systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 500,
            stream: false
        };
    }

    buildAIRequestHeaders(service) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (service.protocol === 'anthropic-messages') {
            headers['x-api-key'] = service.apiKey;
            headers['anthropic-version'] = '2023-06-01';
            headers['anthropic-dangerous-direct-browser-access'] = 'true';
            return headers;
        }

        headers.Authorization = `Bearer ${service.apiKey}`;
        return headers;
    }

    // 解析AI响应
    parseAIResponse(response, serviceName) {
        try {
            const service = this._services[serviceName];
            const content = service?.protocol === 'anthropic-messages'
                ? response.content?.map(part => part.text || '').join('').trim()
                : response.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('AI响应为空');
            }
            SafeLogger.debug(`✅ ${serviceName}响应:`, content);
            return content;
        } catch (error) {
            SafeLogger.error('解析AI响应失败:', error);
            throw new Error('AI响应解析失败');
        }
    }
}

// 智能任务分析器
class AITaskAnalyzer {
    constructor(aiService) {
        this.aiService = aiService;
    }

    // 分析任务并推荐象限分类
    async analyzeTask(taskText) {
        SafeLogger.debug('AI task text received.');

        // 调试AI配置状态
        SafeLogger.debug('🔧 AI服务配置调试:');
        this.aiService.debugAIConfig();

        // 检查AI服务是否可用
        const availableService = this.aiService.getAvailableService();
        if (!availableService) {
            SafeLogger.warn('⚠️ AI服务不可用，使用回退分析');
            SafeLogger.debug('🔍 可用服务检查:', {
                availableService: availableService,
                services: this.aiService.services
            });
            return this.fallbackAnalysis(taskText);
        }

        SafeLogger.debug('✅ 使用AI服务进行分析:', availableService);

        const prompt = `请分析以下任务，并推荐其在艾森豪威尔矩阵中的象限分类：

任务内容：${taskText}

请根据以下标准进行分析：
1. 重要性：对个人目标、工作成果、生活质量的直接影响程度
2. 紧急性：时间压力、截止日期、后果的严重程度

象限分类：
- 象限1（重要且紧急）：危机处理，需要立即行动
- 象限2（重要不紧急）：规划发展，应投入最多时间精力
- 象限3（不重要但紧急）：日常事务，可委托或快速处理
- 象限4（不重要不紧急）：休闲娱乐，适度放松

请返回JSON格式：
{
    "quadrant": 1-4,
    "importance": "高/中/低",
    "urgency": "高/中/低",
    "reason": "分析理由",
    "suggestion": "执行建议"
}`;

        try {
            const response = await this.aiService.callAI(prompt, {
                systemPrompt: '你是一个专业的任务管理顾问，擅长分析任务的重要性和紧急性，帮助用户进行时间管理。',
                temperature: 0.3,
                maxTokens: 300
            });

            SafeLogger.debug('AI response received.', { length: response?.length || 0 });

            // 尝试解析JSON响应
            let analysis;
            let jsonContent = response;

            // 先检查是否包含markdown代码块，如果包含则直接提取
            if (jsonContent.includes('```json')) {
                const codeBlockMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    jsonContent = codeBlockMatch[1].trim();
                    SafeLogger.debug('🔧 检测到JSON代码块，提取内容');
                }
            } else if (jsonContent.includes('```')) {
                const codeBlockMatch = jsonContent.match(/```\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    jsonContent = codeBlockMatch[1].trim();
                    SafeLogger.debug('🔧 检测到代码块，提取内容');
                }
            }

            try {
                analysis = JSON.parse(jsonContent);
                SafeLogger.debug('✅ 成功解析JSON:', analysis);
            } catch (parseError) {
                SafeLogger.warn('⚠️ JSON解析失败，尝试提取JSON部分');
                // 尝试匹配JSON对象
                const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        analysis = JSON.parse(jsonMatch[0]);
                        SafeLogger.debug('✅ 成功提取并解析JSON:', analysis);
                    } catch (extractError) {
                        SafeLogger.error('❌ JSON提取和解析都失败:', extractError);
                        throw new Error('无法解析AI响应为JSON格式');
                    }
                } else {
                    throw new Error('无法解析AI响应为JSON格式');
                }
            }

            // 验证分析结果
            if (!analysis.quadrant || analysis.quadrant < 1 || analysis.quadrant > 4) {
                throw new Error('AI返回的象限分类无效');
            }

            SafeLogger.debug('✅ 任务分析完成:', analysis);
            return analysis;

        } catch (error) {
            SafeLogger.error('❌ 任务分析失败:', error);
            SafeLogger.debug('🔄 使用回退分析');
            return this.fallbackAnalysis(taskText);
        }
    }

    // 回退分析（当AI服务不可用时）
    fallbackAnalysis(taskText) {
        const urgentKeywords = ['紧急', '马上', '立即', '今天', '明天', '截止', 'deadline'];
        const importantKeywords = ['重要', '关键', '核心', '主要', '必须', '必要'];

        const isUrgent = urgentKeywords.some(keyword => taskText.includes(keyword));
        const isImportant = importantKeywords.some(keyword => taskText.includes(keyword));

        let quadrant = 4; // 默认不重要不紧急
        if (isImportant && isUrgent) quadrant = 1;
        else if (isImportant && !isUrgent) quadrant = 2;
        else if (!isImportant && isUrgent) quadrant = 3;

        return {
            quadrant: quadrant,
            importance: isImportant ? '高' : '低',
            urgency: isUrgent ? '高' : '低',
            reason: '基于关键词的简单分析',
            suggestion: '建议使用AI服务获得更准确的分析'
        };
    }

    // 估算任务完成时间
    async estimateTaskDuration(taskText) {
        SafeLogger.debug('AI task text received.');

        // 检查AI服务是否可用
        if (!this.aiService.getAvailableService()) {
            SafeLogger.warn('⚠️ AI服务不可用，使用回退时间估算');
            return this.fallbackTimeEstimation(taskText);
        }

        const prompt = `请估算以下任务的完成时间：

任务内容：${taskText}

请根据任务类型智能估算时间：
- 许可证优化、配置调整类任务：30-60分钟
- 系统部署、环境搭建类任务：1-2小时
- 授权更新、权限配置类任务：15-30分钟
- 软件异常处理、故障排除：30分钟-1小时
- 文档编写、报告整理：1-3小时
- 会议、讨论类任务：30-60分钟
- 开发、编程类任务：2-8小时

请考虑：
1. 任务类型和复杂度
2. 所需技能水平
3. 资源需求和依赖
4. 可能的障碍和风险

请返回JSON格式：
{
    "estimatedMinutes": 数字,
    "confidence": "高/中/低",
    "factors": ["影响时间的因素"],
    "suggestion": "时间管理建议"
}`;

        try {
            const response = await this.aiService.callAI(prompt, {
                systemPrompt: '你是一个专业的时间管理顾问，擅长估算任务完成时间，帮助用户进行时间规划。',
                temperature: 0.3,
                maxTokens: 200
            });

            SafeLogger.debug('AI response received.', { length: response?.length || 0 });

            // 尝试解析JSON响应
            let estimation;
            let jsonContent = response;

            // 先检查是否包含markdown代码块，如果包含则直接提取
            if (jsonContent.includes('```json')) {
                const codeBlockMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    jsonContent = codeBlockMatch[1].trim();
                    SafeLogger.debug('🔧 检测到时间估算JSON代码块，提取内容');
                }
            } else if (jsonContent.includes('```')) {
                const codeBlockMatch = jsonContent.match(/```\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    jsonContent = codeBlockMatch[1].trim();
                    SafeLogger.debug('🔧 检测到时间估算代码块，提取内容');
                }
            }

            try {
                estimation = JSON.parse(jsonContent);
                SafeLogger.debug('✅ 成功解析时间估算JSON:', estimation);
            } catch (parseError) {
                SafeLogger.warn('⚠️ JSON解析失败，尝试提取JSON部分');
                // 尝试匹配JSON对象
                const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        estimation = JSON.parse(jsonMatch[0]);
                        SafeLogger.debug('✅ 成功提取并解析时间估算JSON:', estimation);
                    } catch (extractError) {
                        SafeLogger.error('❌ JSON提取和解析都失败:', extractError);
                        throw new Error('无法解析AI响应为JSON格式');
                    }
                } else {
                    throw new Error('无法解析AI响应为JSON格式');
                }
            }

            // 验证估算结果
            if (!estimation.estimatedMinutes || estimation.estimatedMinutes < 0) {
                throw new Error('AI返回的时间估算无效');
            }

            SafeLogger.debug('✅ 时间估算完成:', estimation);
            return estimation;

        } catch (error) {
            SafeLogger.error('❌ 时间估算失败:', error);
            SafeLogger.debug('🔄 使用回退时间估算');
            return this.fallbackTimeEstimation(taskText);
        }
    }

    // 回退时间估算
    fallbackTimeEstimation(taskText) {
        const text = taskText.toLowerCase();
        let estimatedMinutes = 30; // 默认30分钟

        // 根据关键词智能估算时间
        if (text.includes('许可证') || text.includes('许可') || text.includes('授权')) {
            estimatedMinutes = 45; // 许可证相关任务
        } else if (text.includes('部署') || text.includes('安装') || text.includes('配置')) {
            estimatedMinutes = 90; // 系统部署类任务
        } else if (text.includes('更新') || text.includes('升级')) {
            estimatedMinutes = 30; // 更新类任务
        } else if (text.includes('异常') || text.includes('错误') || text.includes('故障')) {
            estimatedMinutes = 60; // 故障处理类任务
        } else if (text.includes('会议') || text.includes('讨论') || text.includes('沟通')) {
            estimatedMinutes = 45; // 会议类任务
        } else if (text.includes('开发') || text.includes('编程') || text.includes('代码')) {
            estimatedMinutes = 180; // 开发类任务
        } else if (text.includes('文档') || text.includes('报告') || text.includes('整理')) {
            estimatedMinutes = 120; // 文档类任务
        } else {
            // 基于文本长度的简单估算
            const textLength = taskText.length;
            if (textLength < 10) estimatedMinutes = 15;
            else if (textLength < 30) estimatedMinutes = 30;
            else if (textLength < 50) estimatedMinutes = 60;
            else estimatedMinutes = 120;
        }

        return {
            estimatedMinutes: estimatedMinutes,
            confidence: '中',
            factors: ['基于关键词和文本长度的智能估算'],
            suggestion: '建议使用AI服务获得更准确的时间估算'
        };
    }
}

// 个性化签语生成器
class AIPersonalizedFortune {
    constructor(aiService) {
        this.aiService = aiService;
    }

    // 生成个性化签语
    async generatePersonalizedFortune(userProfile, taskContext) {
        SafeLogger.debug('🔮 开始生成个性化签语');

        const prompt = `请为以下用户生成个性化的每日签语：

用户信息：
- 工作状态：${userProfile.workStatus || '未知'}
- 最近任务：${taskContext.recentTasks || '无'}
- 完成率：${userProfile.completionRate || '未知'}
- 主要象限：${taskContext.mainQuadrant || '未知'}

请生成一个鼓励性的签语，包含：
1. 签语内容（简洁有力）
2. 含义解释（深入理解）
3. 今日建议（具体可执行）

请返回JSON格式：
{
    "text": "签语内容",
    "meaning": "含义解释",
    "advice": "今日建议",
    "personalized": true
}`;

        try {
            const response = await this.aiService.callAI(prompt);
            const fortune = JSON.parse(response);

            SafeLogger.debug('✅ 个性化签语生成完成:', fortune);
            return fortune;
        } catch (error) {
            SafeLogger.error('个性化签语生成失败:', error);
            // 回退到传统签语
            return this.fallbackFortune();
        }
    }

    // 回退签语
    fallbackFortune() {
        const traditionalFortunes = [
            {
                text: "今日事今日毕，明日事今日计",
                meaning: "把握当下，规划未来",
                advice: "专注于当前任务，同时为明天做好准备",
                personalized: false
            }
        ];

        return traditionalFortunes[Math.floor(Math.random() * traditionalFortunes.length)];
    }
}

// 初始化AI服务
const aiServiceManager = new AIServiceManager();
const aiTaskAnalyzer = new AITaskAnalyzer(aiServiceManager);
const aiPersonalizedFortune = new AIPersonalizedFortune(aiServiceManager);

// ==================== 第二阶段：智能分析功能 ====================

// AI行为分析器
class AIBehaviorAnalyzer {
    constructor() {
        this.userBehaviorData = {
            workPatterns: {},
            efficiencyCurves: {},
            taskPreferences: {},
            workloadHistory: []
        };
        this.init();
    }

    init() {
        SafeLogger.debug('🔍 AI行为分析器初始化');
        this.loadBehaviorData();
        this.startDataCollection();

        // 如果没有数据，生成演示数据
        if (this.userBehaviorData.workloadHistory.length === 0) {
            SafeLogger.debug('📊 没有历史数据，生成演示数据');
            this.generateDemoData();
        }
    }

    // 加载行为数据
    loadBehaviorData() {
        const savedData = window.DataSyncStorage.getRaw('userBehaviorData');
        if (savedData) {
            try {
                this.userBehaviorData = JSON.parse(savedData);
                SafeLogger.debug('📊 已加载用户行为数据:', this.userBehaviorData);
            } catch (error) {
                SafeLogger.error('❌ 加载行为数据失败:', error);
            }
        }
    }

    // 保存行为数据
    saveBehaviorData() {
        try {
            window.DataSyncStorage.setRaw('userBehaviorData', JSON.stringify(this.userBehaviorData));
            SafeLogger.debug('💾 行为数据已保存');
        } catch (error) {
            SafeLogger.error('❌ 保存行为数据失败:', error);
        }
    }

    // 开始数据收集
    startDataCollection() {
        // 监听任务创建事件
        document.addEventListener('taskCreated', (event) => {
            this.recordTaskCreation(event.detail);
        });

        // 监听任务完成事件
        document.addEventListener('taskCompleted', (event) => {
            this.recordTaskCompletion(event.detail);
        });

        // 定期分析数据
        setInterval(() => {
            this.analyzeWorkPatterns();
        }, 300000); // 每5分钟分析一次
    }

    // 记录任务创建
    recordTaskCreation(taskData) {
        const record = {
            timestamp: new Date().toISOString(),
            taskTitle: taskData.title,
            priority: taskData.priority,
            estimatedTime: taskData.estimatedTime,
            hour: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        };

        this.userBehaviorData.workloadHistory.push(record);
        SafeLogger.debug('📝 记录任务创建:', record);
        this.saveBehaviorData();
    }

    // 记录任务完成
    recordTaskCompletion(taskData) {
        const completionRecord = {
            timestamp: new Date().toISOString(),
            taskTitle: taskData.title,
            priority: taskData.priority,
            actualTime: taskData.actualTime,
            hour: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            completed: true
        };

        // 更新工作负荷历史
        this.userBehaviorData.workloadHistory.push(completionRecord);
        SafeLogger.debug('✅ 记录任务完成:', completionRecord);
        this.saveBehaviorData();
    }

    // 分析工作模式
    analyzeWorkPatterns() {
        SafeLogger.debug('🔍 开始分析工作模式...');

        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 过滤最近一周的数据
        const recentData = this.userBehaviorData.workloadHistory.filter(record => {
            const recordDate = new Date(record.timestamp);
            return recordDate >= lastWeek;
        });

        if (recentData.length === 0) {
            SafeLogger.debug('⚠️ 没有足够的数据进行分析，使用模拟数据进行演示');
            // 使用模拟数据进行演示
            this.generateDemoData();
            return;
        }

        // 检查数据质量
        const completedTasks = recentData.filter(record => record.completed).length;
        const totalTasks = recentData.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        SafeLogger.debug(`📊 数据统计: 总任务${totalTasks}个, 已完成${completedTasks}个, 完成率${completionRate.toFixed(1)}%`);

        // 如果数据太少，给出提示
        if (totalTasks < 5) {
            SafeLogger.debug('💡 建议: 至少需要5个任务才能进行有效分析');
        }

        if (completedTasks < 3) {
            SafeLogger.debug('💡 建议: 至少需要3个已完成任务才能分析效率模式');
        }

        // 分析工作时间分布
        this.analyzeWorkTimeDistribution(recentData);

        // 分析效率曲线
        this.analyzeEfficiencyCurve(recentData);

        // 分析任务偏好
        this.analyzeTaskPreferences(recentData);

        // 分析工作负荷
        this.analyzeWorkload(recentData);

        SafeLogger.debug('✅ 工作模式分析完成');
    }

    // 分析工作时间分布
    analyzeWorkTimeDistribution(data) {
        const hourDistribution = {};
        const dayDistribution = {};

        data.forEach(record => {
            const hour = record.hour;
            const day = record.dayOfWeek;

            hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
            dayDistribution[day] = (dayDistribution[day] || 0) + 1;
        });

        this.userBehaviorData.workPatterns = {
            hourDistribution,
            dayDistribution,
            peakHours: this.findPeakHours(hourDistribution),
            workDays: this.findWorkDays(dayDistribution)
        };

        SafeLogger.debug('⏰ 工作时间分析:', this.userBehaviorData.workPatterns);
    }

    // 分析效率曲线
    analyzeEfficiencyCurve(data) {
        const hourlyEfficiency = {};

        data.forEach(record => {
            if (record.completed) {
                const hour = record.hour;
                if (!hourlyEfficiency[hour]) {
                    hourlyEfficiency[hour] = { completed: 0, total: 0 };
                }
                hourlyEfficiency[hour].completed++;
            }

            const hour = record.hour;
            if (!hourlyEfficiency[hour]) {
                hourlyEfficiency[hour] = { completed: 0, total: 0 };
            }
            hourlyEfficiency[hour].total++;
        });

        // 计算每小时完成率
        const efficiencyRates = {};
        Object.keys(hourlyEfficiency).forEach(hour => {
            const stats = hourlyEfficiency[hour];
            efficiencyRates[hour] = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        });

        this.userBehaviorData.efficiencyCurves = {
            hourlyEfficiency: efficiencyRates,
            peakEfficiencyHours: this.findPeakEfficiencyHours(efficiencyRates),
            lowEfficiencyHours: this.findLowEfficiencyHours(efficiencyRates)
        };

        SafeLogger.debug('📈 效率曲线分析:', this.userBehaviorData.efficiencyCurves);
    }

    // 分析任务偏好
    analyzeTaskPreferences(data) {
        const priorityDistribution = {};
        const taskTypeAnalysis = {};

        data.forEach(record => {
            const priority = record.priority;
            priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;

            // 简单的任务类型分析（基于标题关键词）
            const taskType = this.categorizeTask(record.taskTitle);
            taskTypeAnalysis[taskType] = (taskTypeAnalysis[taskType] || 0) + 1;
        });

        this.userBehaviorData.taskPreferences = {
            priorityDistribution,
            taskTypeAnalysis,
            preferredPriority: this.findPreferredPriority(priorityDistribution),
            dominantTaskType: this.findDominantTaskType(taskTypeAnalysis)
        };

        SafeLogger.debug('🎯 任务偏好分析:', this.userBehaviorData.taskPreferences);
    }

    // 分析工作负荷
    analyzeWorkload(data) {
        const dailyWorkload = {};
        const weeklyTrend = [];

        // 按日期分组
        data.forEach(record => {
            const date = new Date(record.timestamp).toDateString();
            if (!dailyWorkload[date]) {
                dailyWorkload[date] = 0;
            }
            dailyWorkload[date]++;
        });

        // 计算每日工作负荷
        Object.keys(dailyWorkload).forEach(date => {
            weeklyTrend.push({
                date: date,
                workload: dailyWorkload[date]
            });
        });

        this.userBehaviorData.workloadAssessment = {
            dailyWorkload,
            weeklyTrend,
            averageDailyWorkload: this.calculateAverageWorkload(dailyWorkload),
            workloadTrend: this.analyzeWorkloadTrend(weeklyTrend)
        };

        SafeLogger.debug('⚖️ 工作负荷分析:', this.userBehaviorData.workloadAssessment);
    }

    // 获取工作模式分析结果
    getWorkPatternAnalysis() {
        return {
            workPatterns: this.userBehaviorData.workPatterns,
            efficiencyCurves: this.userBehaviorData.efficiencyCurves,
            taskPreferences: this.userBehaviorData.taskPreferences,
            workloadAssessment: this.userBehaviorData.workloadAssessment
        };
    }

    // 生成个性化建议
    generatePersonalizedRecommendations() {
        const analysis = this.getWorkPatternAnalysis();
        const recommendations = [];

        // 检查数据是否存在
        if (!analysis.workPatterns || !analysis.efficiencyCurves || !analysis.workloadAssessment) {
            SafeLogger.warn('⚠️ 分析数据不完整，生成基础建议');
            return [{
                type: 'info',
                title: '数据收集提示',
                description: '请继续使用系统创建和完成任务，系统将为您生成更精准的个性化建议。',
                priority: 'low'
            }];
        }

        // 基于工作时间分布的建议
        if (analysis.workPatterns.peakHours && analysis.workPatterns.peakHours.length > 0) {
            recommendations.push({
                type: 'workTime',
                title: '最佳工作时间',
                description: `您的工作高峰时段是 ${analysis.workPatterns.peakHours.join(', ')} 点，建议在此时间段安排重要任务。`,
                priority: 'high'
            });
        }

        // 基于效率曲线的建议
        if (analysis.efficiencyCurves.peakEfficiencyHours && analysis.efficiencyCurves.peakEfficiencyHours.length > 0) {
            recommendations.push({
                type: 'efficiency',
                title: '高效时段提醒',
                description: `您在 ${analysis.efficiencyCurves.peakEfficiencyHours.join(', ')} 点效率最高，建议安排复杂任务。`,
                priority: 'high'
            });
        }

        // 基于工作负荷的建议
        if (analysis.workloadAssessment.averageDailyWorkload && analysis.workloadAssessment.averageDailyWorkload > 10) {
            recommendations.push({
                type: 'workload',
                title: '工作负荷提醒',
                description: '您的工作负荷较高，建议适当调整任务分配，避免过度工作。',
                priority: 'medium'
            });
        }

        // 如果没有其他建议，添加通用建议
        if (recommendations.length === 0) {
            recommendations.push({
                type: 'general',
                title: '效率提升建议',
                description: '建议合理安排工作时间，保持工作与休息的平衡，提高工作效率。',
                priority: 'medium'
            });
        }

        return recommendations;
    }

    // 辅助方法
    findPeakHours(hourDistribution) {
        const sorted = Object.entries(hourDistribution)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
        return sorted.map(([hour]) => parseInt(hour));
    }

    findWorkDays(dayDistribution) {
        const sorted = Object.entries(dayDistribution)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
        return sorted.map(([day]) => parseInt(day));
    }

    findPeakEfficiencyHours(efficiencyRates) {
        const sorted = Object.entries(efficiencyRates)
            .filter(([, rate]) => rate > 70)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
        return sorted.map(([hour]) => parseInt(hour));
    }

    findLowEfficiencyHours(efficiencyRates) {
        const sorted = Object.entries(efficiencyRates)
            .filter(([, rate]) => rate < 30)
            .sort(([, a], [, b]) => a - b)
            .slice(0, 3);
        return sorted.map(([hour]) => parseInt(hour));
    }

    findPreferredPriority(priorityDistribution) {
        const sorted = Object.entries(priorityDistribution)
            .sort(([, a], [, b]) => b - a);
        return sorted.length > 0 ? parseInt(sorted[0][0]) : 1;
    }

    findDominantTaskType(taskTypeAnalysis) {
        const sorted = Object.entries(taskTypeAnalysis)
            .sort(([, a], [, b]) => b - a);
        return sorted.length > 0 ? sorted[0][0] : '其他';
    }

    categorizeTask(taskTitle) {
        const title = taskTitle.toLowerCase();
        if (title.includes('会议') || title.includes('讨论')) return '会议';
        if (title.includes('报告') || title.includes('文档')) return '文档';
        if (title.includes('邮件') || title.includes('沟通')) return '沟通';
        if (title.includes('开发') || title.includes('编程')) return '开发';
        if (title.includes('设计') || title.includes('创意')) return '设计';
        if (title.includes('学习') || title.includes('培训')) return '学习';
        return '其他';
    }

    calculateAverageWorkload(dailyWorkload) {
        const values = Object.values(dailyWorkload);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }

    analyzeWorkloadTrend(weeklyTrend) {
        if (weeklyTrend.length < 2) return 'stable';

        const recent = weeklyTrend.slice(-3);
        const older = weeklyTrend.slice(-6, -3);

        const recentAvg = recent.reduce((a, b) => a + b.workload, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b.workload, 0) / older.length;

        if (recentAvg > olderAvg * 1.2) return 'increasing';
        if (recentAvg < olderAvg * 0.8) return 'decreasing';
        return 'stable';
    }

    // 生成演示数据
    generateDemoData() {
        SafeLogger.debug('🎭 生成演示数据...');

        // 生成模拟的工作模式数据
        this.userBehaviorData.workPatterns = {
            hourDistribution: { 9: 3, 10: 5, 11: 4, 14: 6, 15: 7, 16: 5, 17: 3 },
            dayDistribution: { 1: 8, 2: 12, 3: 10, 4: 9, 5: 6 },
            peakHours: [15, 14, 10],
            workDays: [1, 2, 3, 4, 5]
        };

        // 生成模拟的效率曲线数据
        this.userBehaviorData.efficiencyCurves = {
            hourlyEfficiency: { 9: 75, 10: 85, 11: 80, 14: 90, 15: 95, 16: 85, 17: 70 },
            peakEfficiencyHours: [15, 14, 10],
            lowEfficiencyHours: [17, 9]
        };

        // 生成模拟的任务偏好数据
        this.userBehaviorData.taskPreferences = {
            priorityDistribution: { 1: 3, 2: 8, 3: 12, 4: 5 },
            taskTypeAnalysis: { 会议: 5, 文档: 8, 开发: 10, 沟通: 7, 其他: 3 },
            preferredPriority: 3,
            dominantTaskType: '开发'
        };

        // 生成模拟的工作负荷数据
        this.userBehaviorData.workloadAssessment = {
            dailyWorkload: {
                'Mon Oct 14 2024': 8,
                'Tue Oct 15 2024': 12,
                'Wed Oct 16 2024': 10,
                'Thu Oct 17 2024': 9,
                'Fri Oct 18 2024': 6
            },
            weeklyTrend: [
                { date: 'Mon Oct 14 2024', workload: 8 },
                { date: 'Tue Oct 15 2024', workload: 12 },
                { date: 'Wed Oct 16 2024', workload: 10 },
                { date: 'Thu Oct 17 2024', workload: 9 },
                { date: 'Fri Oct 18 2024', workload: 6 }
            ],
            averageDailyWorkload: 9,
            workloadTrend: 'stable'
        };

        SafeLogger.debug('✅ 演示数据生成完成');
    }

    // 评估数据质量
    evaluateDataQuality() {
        const recentData = this.userBehaviorData.workloadHistory;
        const completedTasks = recentData.filter(record => record.completed).length;
        const totalTasks = recentData.length;
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // 分析时间分布
        const hourDistribution = {};
        recentData.forEach(record => {
            hourDistribution[record.hour] = (hourDistribution[record.hour] || 0) + 1;
        });
        const uniqueHours = Object.keys(hourDistribution).length;

        // 分析任务类型
        const taskTypes = {};
        recentData.forEach(record => {
            const taskType = this.categorizeTask(record.taskTitle);
            taskTypes[taskType] = (taskTypes[taskType] || 0) + 1;
        });
        const uniqueTaskTypes = Object.keys(taskTypes).length;

        return {
            totalTasks,
            completedTasks,
            completionRate,
            uniqueHours,
            uniqueTaskTypes,
            quality: this.calculateDataQuality(totalTasks, completedTasks, uniqueHours, uniqueTaskTypes)
        };
    }

    // 计算数据质量评分
    calculateDataQuality(totalTasks, completedTasks, uniqueHours, uniqueTaskTypes) {
        let score = 0;

        // 任务数量评分 (0-40分)
        if (totalTasks >= 20) score += 40;
        else if (totalTasks >= 10) score += 30;
        else if (totalTasks >= 5) score += 20;
        else if (totalTasks >= 3) score += 10;

        // 完成率评分 (0-30分)
        if (completedTasks >= 10) score += 30;
        else if (completedTasks >= 5) score += 20;
        else if (completedTasks >= 3) score += 10;

        // 时间分布评分 (0-20分)
        if (uniqueHours >= 6) score += 20;
        else if (uniqueHours >= 4) score += 15;
        else if (uniqueHours >= 2) score += 10;

        // 任务类型多样性评分 (0-10分)
        if (uniqueTaskTypes >= 4) score += 10;
        else if (uniqueTaskTypes >= 2) score += 5;

        return Math.min(score, 100);
    }

    // 获取数据要求建议
    getDataRequirements() {
        const quality = this.evaluateDataQuality();

        const requirements = [];

        if (quality.totalTasks < 5) {
            requirements.push({
                type: 'task_count',
                title: '任务数量不足',
                description: `当前${quality.totalTasks}个任务，建议至少5个任务`,
                target: 5,
                current: quality.totalTasks
            });
        }

        if (quality.completedTasks < 3) {
            requirements.push({
                type: 'completion',
                title: '完成记录不足',
                description: `当前${quality.completedTasks}个已完成任务，建议至少3个`,
                target: 3,
                current: quality.completedTasks
            });
        }

        if (quality.uniqueHours < 3) {
            requirements.push({
                type: 'time_distribution',
                title: '时间分布不足',
                description: `当前覆盖${quality.uniqueHours}个时间段，建议至少3个不同时段`,
                target: 3,
                current: quality.uniqueHours
            });
        }

        if (quality.uniqueTaskTypes < 2) {
            requirements.push({
                type: 'task_diversity',
                title: '任务类型单一',
                description: `当前${quality.uniqueTaskTypes}种任务类型，建议至少2种`,
                target: 2,
                current: quality.uniqueTaskTypes
            });
        }

        return {
            quality: quality.quality,
            requirements,
            isReady: quality.quality >= 60
        };
    }
}

// 初始化AI行为分析器
const aiBehaviorAnalyzer = new AIBehaviorAnalyzer();

// ==================== 前端工作习惯分析功能 ====================

// 工作习惯分析相关函数
function loadBehaviorAnalysis() {
    SafeLogger.debug('🔍 加载工作习惯分析...');

    // 检查是否有行为分析器
    if (typeof aiBehaviorAnalyzer === 'undefined') {
        SafeLogger.warn('⚠️ AI行为分析器未初始化');
        showBehaviorAnalysisError('AI行为分析器未初始化');
        return;
    }

    try {
        // 先触发分析
        aiBehaviorAnalyzer.analyzeWorkPatterns();

        const analysis = aiBehaviorAnalyzer.getWorkPatternAnalysis();
        const recommendations = aiBehaviorAnalyzer.generatePersonalizedRecommendations();

        // 更新分析卡片
        updateBehaviorAnalysisCards(analysis);

        // 更新个性化建议
        updateBehaviorRecommendations(recommendations);

        SafeLogger.debug('✅ 工作习惯分析加载完成');
    } catch (error) {
        SafeLogger.error('❌ 加载工作习惯分析失败:', error);
        showBehaviorAnalysisError('分析过程中出现错误，请稍后重试');
    }
}

function updateBehaviorAnalysisCards(analysis) {
    // 更新时间分布
    const workTimeEl = document.getElementById('work-time-distribution');
    if (workTimeEl) {
        if (analysis.workPatterns && analysis.workPatterns.peakHours && analysis.workPatterns.peakHours.length > 0) {
            workTimeEl.textContent = `高峰时段: ${analysis.workPatterns.peakHours.join(', ')}点`;
        } else {
            workTimeEl.textContent = '数据不足';
        }
    }

    // 更新效率曲线
    const efficiencyEl = document.getElementById('efficiency-curve');
    if (efficiencyEl) {
        if (analysis.efficiencyCurves && analysis.efficiencyCurves.peakEfficiencyHours && analysis.efficiencyCurves.peakEfficiencyHours.length > 0) {
            efficiencyEl.textContent = `高效时段: ${analysis.efficiencyCurves.peakEfficiencyHours.join(', ')}点`;
        } else {
            efficiencyEl.textContent = '数据不足';
        }
    }

    // 更新任务偏好
    const preferencesEl = document.getElementById('task-preferences');
    if (preferencesEl) {
        if (analysis.taskPreferences && analysis.taskPreferences.dominantTaskType) {
            preferencesEl.textContent = `主要类型: ${analysis.taskPreferences.dominantTaskType}`;
        } else {
            preferencesEl.textContent = '数据不足';
        }
    }

    // 更新工作负荷
    const workloadEl = document.getElementById('workload-assessment');
    if (workloadEl) {
        if (analysis.workloadAssessment && analysis.workloadAssessment.averageDailyWorkload) {
            const avgWorkload = Math.round(analysis.workloadAssessment.averageDailyWorkload);
            workloadEl.textContent = `日均任务: ${avgWorkload}个`;
        } else {
            workloadEl.textContent = '数据不足';
        }
    }
}

function showBehaviorAnalysisError(message) {
    // 更新所有分析卡片显示错误状态
    const workTimeEl = document.getElementById('work-time-distribution');
    const efficiencyEl = document.getElementById('efficiency-curve');
    const preferencesEl = document.getElementById('task-preferences');
    const workloadEl = document.getElementById('workload-assessment');

    if (workTimeEl) workTimeEl.textContent = '分析失败';
    if (efficiencyEl) efficiencyEl.textContent = '分析失败';
    if (preferencesEl) preferencesEl.textContent = '分析失败';
    if (workloadEl) workloadEl.textContent = '分析失败';

    // 更新建议区域
    const recommendationsEl = document.getElementById('personalized-recommendations');
    if (recommendationsEl) {
        recommendationsEl.replaceChildren(createRecommendationMessage('⚠️', message));
    }
}

function updateBehaviorRecommendations(recommendations) {
    const recommendationsEl = document.getElementById('personalized-recommendations');
    if (!recommendationsEl) return;

    // 获取数据要求信息
    const dataRequirements = aiBehaviorAnalyzer.getDataRequirements();

    if (recommendations.length === 0 || !dataRequirements.isReady) {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(createRecommendationItem({
            icon: '📊',
            title: `数据质量评分: ${dataRequirements.quality}分`,
            description: '继续使用系统以提升分析精度'
        }));

        dataRequirements.requirements.forEach(requirement => {
            fragment.appendChild(createRequirementRecommendationItem(requirement));
        });
        recommendationsEl.replaceChildren(fragment);
        return;
    }

    const fragment = document.createDocumentFragment();
    recommendations.forEach(recommendation => {
        fragment.appendChild(createRecommendationItem({
            icon: getBehaviorRecommendationIcon(recommendation.type),
            title: recommendation.title,
            description: recommendation.description
        }));
    });
    recommendationsEl.replaceChildren(fragment);
}

function createRecommendationMessage(iconText, message) {
    const item = document.createElement('div');
    item.className = 'recommendation-item';

    const icon = document.createElement('span');
    icon.className = 'recommendation-icon';
    icon.textContent = iconText;

    const text = document.createElement('span');
    text.className = 'recommendation-text';
    text.textContent = message;

    item.append(icon, text);
    return item;
}

function createRecommendationItem({ icon, title, description }) {
    const item = document.createElement('div');
    item.className = 'recommendation-item';

    const iconEl = document.createElement('span');
    iconEl.className = 'recommendation-icon';
    iconEl.textContent = icon;

    const content = document.createElement('div');
    content.className = 'recommendation-content';

    const titleEl = document.createElement('div');
    titleEl.className = 'recommendation-title';
    titleEl.textContent = title || '';

    const descriptionEl = document.createElement('div');
    descriptionEl.className = 'recommendation-description';
    descriptionEl.textContent = description || '';

    content.append(titleEl, descriptionEl);
    item.append(iconEl, content);
    return item;
}

function createRequirementRecommendationItem(requirement) {
    const item = createRecommendationItem({
        icon: getRequirementIcon(requirement.type),
        title: requirement.title,
        description: requirement.description
    });

    const content = item.querySelector('.recommendation-content');
    const progress = document.createElement('div');
    progress.className = 'progress-bar';

    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    const percent = requirement.target ? (requirement.current / requirement.target) * 100 : 0;
    fill.style.width = `${percent}%`;

    const text = document.createElement('span');
    text.className = 'progress-text';
    text.textContent = `${requirement.current}/${requirement.target}`;

    progress.append(fill, text);
    content.appendChild(progress);
    return item;
}

function getBehaviorRecommendationIcon(type) {
    const icons = {
        'workTime': '⏰',
        'efficiency': '📈',
        'workload': '⚖️',
        'task': '🎯',
        'info': '📊',
        'general': '💡'
    };
    return icons[type] || '💡';
}

function getRequirementIcon(type) {
    const icons = {
        'task_count': '📝',
        'completion': '✅',
        'time_distribution': '⏰',
        'task_diversity': '🎯'
    };
    return icons[type] || '📊';
}

function refreshBehaviorAnalysis() {
    SafeLogger.debug('🔄 刷新工作习惯分析...');

    if (typeof aiBehaviorAnalyzer === 'undefined') {
        showNotification('AI行为分析器未初始化', 'error');
        return;
    }

    // 触发重新分析
    aiBehaviorAnalyzer.analyzeWorkPatterns();

    // 重新加载分析结果
    setTimeout(() => {
        loadBehaviorAnalysis();
        showNotification('工作习惯分析已刷新', 'success');
    }, 1000);
}

function exportBehaviorData() {
    SafeLogger.debug('📊 导出行为数据...');

    if (typeof aiBehaviorAnalyzer === 'undefined') {
        showNotification('AI行为分析器未初始化', 'error');
        return;
    }

    try {
        const analysis = aiBehaviorAnalyzer.getWorkPatternAnalysis();
        const dataStr = JSON.stringify(analysis, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `behavior-analysis-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
        showNotification('行为数据导出成功', 'success');
    } catch (error) {
        SafeLogger.error('❌ 导出行为数据失败:', error);
        showNotification('导出失败: ' + error.message, 'error');
    }
}

// 暴露到全局作用域
window.loadBehaviorAnalysis = loadBehaviorAnalysis;
window.refreshBehaviorAnalysis = refreshBehaviorAnalysis;
window.exportBehaviorData = exportBehaviorData;

// AI智能提醒系统已抽离至 js/smart-reminder-system.js

// ==================== 第二阶段剩余功能：瓶颈识别 ====================

// AI瓶颈识别系统
class AIBottleneckAnalyzer {
    constructor() {
        this.bottlenecks = [];
        this.efficiencyThresholds = {
            low: 0.3,
            medium: 0.6,
            high: 0.8
        };
        this.init();
    }

    init() {
        SafeLogger.debug('🔍 AI瓶颈识别系统初始化');
        this.startAnalysis();
    }

    // 开始分析
    startAnalysis() {
        // 每2小时分析一次瓶颈
        setInterval(() => {
            this.analyzeBottlenecks();
        }, 7200000);
    }

    // 分析瓶颈
    analyzeBottlenecks() {
        SafeLogger.debug('🔍 开始瓶颈分析...');

        const analysis = aiBehaviorAnalyzer.getWorkPatternAnalysis();
        if (!analysis.workPatterns || !analysis.efficiencyCurves) {
            SafeLogger.debug('⚠️ 数据不足，无法进行瓶颈分析');
            return;
        }

        const bottlenecks = [];

        // 分析效率瓶颈
        const efficiencyBottlenecks = this.analyzeEfficiencyBottlenecks(analysis);
        bottlenecks.push(...efficiencyBottlenecks);

        // 分析时间浪费点
        const timeWastePoints = this.analyzeTimeWastePoints(analysis);
        bottlenecks.push(...timeWastePoints);

        // 分析工作模式瓶颈
        const workPatternBottlenecks = this.analyzeWorkPatternBottlenecks(analysis);
        bottlenecks.push(...workPatternBottlenecks);

        // 分析任务类型瓶颈
        const taskTypeBottlenecks = this.analyzeTaskTypeBottlenecks(analysis);
        bottlenecks.push(...taskTypeBottlenecks);

        this.bottlenecks = bottlenecks;
        this.saveBottlenecks();

        SafeLogger.debug('✅ 瓶颈分析完成，发现', bottlenecks.length, '个瓶颈');
    }

    // 分析效率瓶颈
    analyzeEfficiencyBottlenecks(analysis) {
        const bottlenecks = [];
        const efficiencyCurves = analysis.efficiencyCurves.hourlyEfficiency || {};

        // 找出低效时段
        const lowEfficiencyHours = Object.entries(efficiencyCurves)
            .filter(([hour, efficiency]) => efficiency < this.efficiencyThresholds.low * 100)
            .map(([hour, efficiency]) => ({ hour: parseInt(hour), efficiency }));

        if (lowEfficiencyHours.length > 0) {
            bottlenecks.push({
                type: 'efficiency',
                title: '低效时段瓶颈',
                description: `发现${lowEfficiencyHours.length}个低效时段，平均效率${Math.round(lowEfficiencyHours.reduce((sum, h) => sum + h.efficiency, 0) / lowEfficiencyHours.length)}%`,
                severity: 'high',
                suggestions: [
                    '考虑在这些时段安排简单任务或休息',
                    '分析低效原因，如环境干扰、疲劳等',
                    '尝试调整工作安排，避开低效时段'
                ],
                hours: lowEfficiencyHours.map(h => h.hour)
            });
        }

        return bottlenecks;
    }

    // 分析时间浪费点
    analyzeTimeWastePoints(analysis) {
        const bottlenecks = [];
        const workPatterns = analysis.workPatterns;

        if (!workPatterns.hourDistribution) return bottlenecks;

        // 分析工作时间分布
        const hourDistribution = workPatterns.hourDistribution;
        const totalTasks = Object.values(hourDistribution).reduce((sum, count) => sum + count, 0);
        const averageTasksPerHour = totalTasks / Object.keys(hourDistribution).length;

        // 找出任务过于集中的时段
        const concentratedHours = Object.entries(hourDistribution)
            .filter(([hour, count]) => count > averageTasksPerHour * 1.5)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }));

        if (concentratedHours.length > 0) {
            bottlenecks.push({
                type: 'time_waste',
                title: '任务集中度过高',
                description: `发现${concentratedHours.length}个时段任务过于集中，可能导致效率下降`,
                severity: 'medium',
                suggestions: [
                    '尝试分散任务到不同时段',
                    '避免在同一时段安排过多任务',
                    '考虑任务优先级，合理安排时间'
                ],
                hours: concentratedHours.map(h => h.hour)
            });
        }

        return bottlenecks;
    }

    // 分析工作模式瓶颈
    analyzeWorkPatternBottlenecks(analysis) {
        const bottlenecks = [];
        const workPatterns = analysis.workPatterns;

        if (!workPatterns.peakHours || workPatterns.peakHours.length === 0) {
            bottlenecks.push({
                type: 'work_pattern',
                title: '工作模式不明确',
                description: '未发现明显的工作高峰时段，工作模式不够规律',
                severity: 'low',
                suggestions: [
                    '尝试建立固定的工作时间',
                    '观察自己的高效时段',
                    '制定规律的工作计划'
                ]
            });
        }

        return bottlenecks;
    }

    // 分析任务类型瓶颈
    analyzeTaskTypeBottlenecks(analysis) {
        const bottlenecks = [];
        const taskPreferences = analysis.taskPreferences;

        if (!taskPreferences.taskTypeAnalysis) return bottlenecks;

        const taskTypes = taskPreferences.taskTypeAnalysis;
        const totalTasks = Object.values(taskTypes).reduce((sum, count) => sum + count, 0);
        const dominantType = taskPreferences.dominantTaskType;
        const dominantCount = taskTypes[dominantType] || 0;
        const dominantRatio = dominantCount / totalTasks;

        // 检查任务类型是否过于单一
        if (dominantRatio > 0.7) {
            bottlenecks.push({
                type: 'task_diversity',
                title: '任务类型过于单一',
                description: `${dominantType}类型任务占比${Math.round(dominantRatio * 100)}%，缺乏多样性`,
                severity: 'medium',
                suggestions: [
                    '尝试增加任务类型的多样性',
                    '平衡不同类型的工作',
                    '避免过度专注于单一类型任务'
                ],
                dominantType,
                ratio: dominantRatio
            });
        }

        return bottlenecks;
    }

    // 获取瓶颈分析结果
    getBottleneckAnalysis() {
        return {
            bottlenecks: this.bottlenecks,
            totalBottlenecks: this.bottlenecks.length,
            highSeverity: this.bottlenecks.filter(b => b.severity === 'high').length,
            mediumSeverity: this.bottlenecks.filter(b => b.severity === 'medium').length,
            lowSeverity: this.bottlenecks.filter(b => b.severity === 'low').length
        };
    }

    // 生成改进建议
    generateImprovementSuggestions() {
        const analysis = this.getBottleneckAnalysis();
        const suggestions = [];

        if (analysis.highSeverity > 0) {
            suggestions.push({
                type: 'urgent',
                title: '紧急改进建议',
                description: `发现${analysis.highSeverity}个高严重性瓶颈，建议立即处理`,
                priority: 'high'
            });
        }

        if (analysis.mediumSeverity > 0) {
            suggestions.push({
                type: 'optimization',
                title: '优化建议',
                description: `发现${analysis.mediumSeverity}个中等严重性瓶颈，建议逐步优化`,
                priority: 'medium'
            });
        }

        if (analysis.totalBottlenecks === 0) {
            suggestions.push({
                type: 'excellent',
                title: '工作模式良好',
                description: '未发现明显瓶颈，工作模式较为健康',
                priority: 'low'
            });
        }

        return suggestions;
    }

    // 保存瓶颈分析结果
    saveBottlenecks() {
        try {
            window.DataSyncStorage.setRaw('bottleneckAnalysis', JSON.stringify(this.bottlenecks));
        } catch (error) {
            SafeLogger.error('❌ 保存瓶颈分析失败:', error);
        }
    }

    // 加载瓶颈分析结果
    loadBottlenecks() {
        try {
            const saved = window.DataSyncStorage.getRaw('bottleneckAnalysis');
            if (saved) {
                this.bottlenecks = JSON.parse(saved);
            }
        } catch (error) {
            SafeLogger.error('❌ 加载瓶颈分析失败:', error);
        }
    }
}

// 初始化AI瓶颈识别系统
const aiBottleneckAnalyzer = new AIBottleneckAnalyzer();

// AI智能日程规划系统已抽离至 js/smart-schedule-system.js

// AI智能任务分解系统已抽离至 js/task-decomposition-system.js

// AI智能健康管理系统已抽离至 js/smart-health-system.js

// 智能提醒系统前端管理已抽离至 js/smart-reminder-system.js

// 智能日程规划前端管理已抽离至 js/smart-schedule-system.js

// 智能任务分解前端管理已抽离至 js/task-decomposition-system.js

// 智能健康管理前端管理已抽离至 js/smart-health-system.js

// AI分析相关变量
let currentAIAnalysis = null;

// AI任务分析功能
async function analyzeTaskWithAI() {
    const taskInput = document.querySelector('.task-input');
    const taskText = taskInput.value.trim();

    if (!taskText) {
        showNotification('请先输入任务内容', 'warning');
        return;
    }

    // 检查AI服务状态
    const availableService = aiServiceManager.getAvailableService();
    if (!availableService) {
        showNotification('AI服务未配置，请在管理员后台配置API Key', 'warning');
        return;
    }

    SafeLogger.debug('🔧 AI服务状态检查:', {
        availableService: availableService,
        services: Object.fromEntries(Object.entries(aiServiceManager._services || {}).map(([name, service]) => [
            name,
            {
                enabled: service.enabled,
                hasKey: !!service.apiKey
            }
        ]))
    });

    const analyzeBtn = document.querySelector('.ai-analyze-btn');
    const originalText = analyzeBtn.textContent;
    analyzeBtn.textContent = '🤖 分析中...';
    analyzeBtn.disabled = true;

    try {
        SafeLogger.debug('AI task text received.');

        // 显示分析结果区域并清空之前的内容
        const analysisResult = document.getElementById('ai-analysis-result');
        analysisResult.style.display = 'block';

        // 清空之前的分析内容，显示加载状态
        clearAIAnalysisDisplay();
        showAIAnalysisLoading();

        // 并行获取任务分析和时间估算
        const [taskAnalysis, timeEstimation] = await Promise.all([
            aiTaskAnalyzer.analyzeTask(taskText),
            aiTaskAnalyzer.estimateTaskDuration(taskText)
        ]);

        // 保存分析结果
        currentAIAnalysis = {
            taskText: taskText,
            analysis: taskAnalysis,
            timeEstimation: timeEstimation
        };

        // 更新UI显示
        updateAIAnalysisDisplay(taskAnalysis, timeEstimation);

        showNotification('AI分析完成！', 'success');

    } catch (error) {
        SafeLogger.error('AI分析失败:', error);

        // 根据错误类型显示不同的提示
        let errorMessage = 'AI分析失败';
        if (error.message.includes('API Key未配置')) {
            errorMessage = '请先在管理员后台配置AI服务的API Key';
        } else if (error.message.includes('400')) {
            errorMessage = 'API请求格式错误，请检查API Key是否正确';
        } else if (error.message.includes('401')) {
            errorMessage = 'API Key无效，请检查API Key是否正确';
        } else if (error.message.includes('网络')) {
            errorMessage = '网络连接失败，请检查网络连接';
        } else {
            errorMessage = 'AI分析失败: ' + error.message;
        }

        showNotification(errorMessage, 'error');
    } finally {
        analyzeBtn.textContent = originalText;
        analyzeBtn.disabled = false;
    }
}

// 清空AI分析显示
function clearAIAnalysisDisplay() {
    const elements = [
        'ai-suggested-quadrant',
        'ai-importance',
        'ai-urgency',
        'ai-duration',
        'ai-reason-text',
        'ai-suggestion-text'
    ];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '';
            element.className = element.className.replace(/importance-\w+|urgency-\w+/, '');
        }
    });
}

// 显示AI分析加载状态
function showAIAnalysisLoading() {
    const elements = [
        { id: 'ai-suggested-quadrant', text: '分析中...' },
        { id: 'ai-importance', text: '分析中...' },
        { id: 'ai-urgency', text: '分析中...' },
        { id: 'ai-duration', text: '计算中...' },
        { id: 'ai-reason-text', text: '正在分析任务特征和优先级...' },
        { id: 'ai-suggestion-text', text: '正在生成执行建议...' }
    ];

    elements.forEach(({ id, text }) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
            element.style.opacity = '0.6';
        }
    });
}

// 更新AI分析显示
function updateAIAnalysisDisplay(analysis, timeEstimation) {
    // 更新象限建议
    const quadrantNames = ['', '重要且紧急', '重要不紧急', '不重要但紧急', '不重要不紧急'];
    const quadrantColors = ['', '#f44336', '#ff9800', '#2196f3', '#4caf50'];

    const suggestedQuadrant = document.getElementById('ai-suggested-quadrant');
    suggestedQuadrant.textContent = quadrantNames[analysis.quadrant];
    suggestedQuadrant.style.color = quadrantColors[analysis.quadrant];
    suggestedQuadrant.style.opacity = '1';

    // 更新重要性
    const importance = document.getElementById('ai-importance');
    importance.textContent = analysis.importance;
    importance.className = `detail-value importance-${analysis.importance}`;
    importance.style.opacity = '1';

    // 更新紧急性
    const urgency = document.getElementById('ai-urgency');
    urgency.textContent = analysis.urgency;
    urgency.className = `detail-value urgency-${analysis.urgency}`;
    urgency.style.opacity = '1';

    // 更新预计时间
    const duration = document.getElementById('ai-duration');
    const hours = Math.floor(timeEstimation.estimatedMinutes / 60);
    const minutes = timeEstimation.estimatedMinutes % 60;
    let timeText = '';
    if (hours > 0) timeText += `${hours}小时`;
    if (minutes > 0) timeText += `${minutes}分钟`;
    if (!timeText) timeText = '少于1分钟';
    duration.textContent = timeText;
    duration.style.opacity = '1';

    // 更新分析理由
    const reasonText = document.getElementById('ai-reason-text');
    reasonText.textContent = analysis.reason;
    reasonText.style.opacity = '1';

    // 更新执行建议
    const suggestionText = document.getElementById('ai-suggestion-text');
    suggestionText.textContent = analysis.suggestion;
    suggestionText.style.opacity = '1';
}

// 应用AI建议
function applyAISuggestion() {
    if (!currentAIAnalysis) return;

    const { analysis } = currentAIAnalysis;

    // 清除所有象限选择
    document.querySelectorAll('.quadrant-option').forEach(option => {
        option.classList.remove('selected');
    });

    // 选择AI推荐的象限
    const targetQuadrant = document.querySelector(`[data-priority="${analysis.quadrant}"]`);
    if (targetQuadrant) {
        targetQuadrant.classList.add('selected');
        targetQuadrant.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 关闭AI分析结果
    closeAIAnalysis();

    showNotification('已应用AI建议', 'success');
}

// 忽略AI建议
function ignoreAISuggestion() {
    closeAIAnalysis();
    showNotification('已忽略AI建议', 'info');
}

// 关闭AI分析结果
function closeAIAnalysis() {
    const analysisResult = document.getElementById('ai-analysis-result');
    analysisResult.style.display = 'none';
    currentAIAnalysis = null;
}

// 增强的个性化签语生成
async function generatePersonalizedFortune() {
    try {
        // 获取用户工作状态
        const userProfile = {
            workStatus: '忙碌',
            completionRate: calculateCompletionRate()
        };

        // 获取任务上下文
        const taskContext = {
            recentTasks: getRecentTasks(5),
            mainQuadrant: getMainQuadrant()
        };

        // 生成个性化签语
        const fortune = await aiPersonalizedFortune.generatePersonalizedFortune(userProfile, taskContext);

        // 更新签语显示
        if (fortune.personalized) {
            showNotification('已生成个性化签语！', 'success');
        }

        return fortune;
    } catch (error) {
        SafeLogger.error('个性化签语生成失败:', error);
        return null;
    }
}

// 计算任务完成率
function calculateCompletionRate() {
    if (tasks.length === 0) return '0%';
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = Math.round((completedTasks / tasks.length) * 100);
    return `${completionRate}%`;
}

// 获取最近任务
function getRecentTasks(count) {
    return tasks.slice(0, count).map(task => task.title).join('、');
}

// 获取主要象限
function getMainQuadrant() {
    const quadrantCounts = [0, 0, 0, 0];
    tasks.forEach(task => {
        if (task.priority >= 1 && task.priority <= 4) {
            quadrantCounts[task.priority - 1]++;
        }
    });

    const maxCount = Math.max(...quadrantCounts);
    const mainQuadrantIndex = quadrantCounts.indexOf(maxCount) + 1;
    const quadrantNames = ['', '重要且紧急', '重要不紧急', '不重要但紧急', '不重要不紧急'];
    return quadrantNames[mainQuadrantIndex];
}

// AI服务状态检查（调试用）
async function checkAIServiceStatus() {
    SafeLogger.debug('🔍 AI服务状态检查:');

    // 使用 debugAIConfig 获取安全的状态信息
    const status = await aiServiceManager.debugAIConfig();

    SafeLogger.debug('当前可用服务:', status.availableService);
    SafeLogger.debug('服务状态:', status.services);
    SafeLogger.debug('AI配置存储状态:', status.storage.status || status.storage);

    return status;
}

// 暴露到全局作用域，方便调试
window.checkAIServiceStatus = checkAIServiceStatus;

// 🔐 安全：不直接暴露 aiServiceManager 对象
// 只暴露必要的安全接口，防止控制台查看明文 API key
// 如需调试，请使用 checkAIServiceStatus() 函数
//
// 注意：即使不暴露到 window，用户仍然可以通过以下方式访问：
// 1. 使用 Chrome DevTools 的 "Memory" 标签页进行堆快照
// 2. 在代码中设置断点查看作用域变量
// 3. 使用 Object.values() 遍历 window 对象
//
// 为达到最佳安全性，建议：
// - 使用后端代理 API 请求（避免前端存储 API key）
// - 实现基于会话的临时 token 机制

