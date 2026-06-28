// AI服务管理器模块
// 从 script.js 中提取的AI功能

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
export class AIServiceManager {
    constructor() {
        this.services = createAIServiceState();
        this.currentService = 'deepseek';
        this.init();
    }
    
    init() {
        console.log('🤖 AI服务管理器初始化');
        this.loadAIConfig();
    }
    
    // 加载AI配置
    loadAIConfig() {
        console.log('🔧 加载AI配置...');
        
        const aiConfig = localStorage.getItem('aiConfig');
        if (aiConfig) {
            try {
                const config = JSON.parse(aiConfig);
                console.log('📋 找到AI配置:', config);
                
                Object.keys(this.services).forEach(serviceName => {
                    this.services[serviceName].enabled = config[serviceName]?.enabled || false;
                    this.services[serviceName].apiKey = config[serviceName]?.apiKey || null;
                });
                this.currentService = config.currentService || 'deepseek';
                
                console.log('✅ AI配置加载完成');
            } catch (error) {
                console.error('❌ 解析AI配置失败:', error);
            }
        }
        
        // 兼容旧的DeepSeek配置
        const oldDeepSeekKey = localStorage.getItem('deepSeekApiKey');
        if (oldDeepSeekKey && !this.services.deepseek.apiKey) {
            console.log('🔄 发现旧的DeepSeek配置，迁移中...');
            this.services.deepseek.apiKey = oldDeepSeekKey;
            this.services.deepseek.enabled = true;
            this.saveAIConfig();
        }
    }
    
    // 保存AI配置
    saveAIConfig() {
        const config = Object.fromEntries(Object.entries(this.services).map(([serviceName, service]) => [
            serviceName,
            {
                enabled: service.enabled,
                apiKey: service.apiKey
            }
        ]));
        config.currentService = this.currentService;
        localStorage.setItem('aiConfig', JSON.stringify(config));
    }
    
    // 设置API密钥
    setAPIKey(service, apiKey) {
        if (this.services[service]) {
            this.services[service].apiKey = apiKey;
            this.services[service].enabled = !!apiKey;
            if (apiKey) {
                this.currentService = service;
            }
            this.saveAIConfig();
            console.log(`✅ ${service} API密钥已设置`);
        }
    }
    
    // 获取当前可用的AI服务
    getAvailableService() {
        const selected = this.services[this.currentService];
        if (selected?.enabled && selected.apiKey) {
            return this.currentService;
        }

        for (const [serviceName, service] of Object.entries(this.services)) {
            if (service.enabled && service.apiKey) {
                return serviceName;
            }
        }
        return null;
    }
    
    // 调用AI服务
    async callAI(prompt, options = {}) {
        const serviceName = this.getAvailableService();
        if (!serviceName) {
            throw new Error('没有可用的AI服务');
        }
        
        const service = this.services[serviceName];
        console.log(`🤖 使用${service.name}服务处理请求`);
        
        try {
            const response = await this.makeAPIRequest(service, prompt, options);
            return this.parseAIResponse(response, serviceName);
        } catch (error) {
            console.error(`AI服务调用失败 (${serviceName}):`, error);
            throw error;
        }
    }
    
    // 发起API请求
    async makeAPIRequest(service, prompt, options) {
        if (!service.apiKey) {
            throw new Error('API Key未配置');
        }
        
        const requestBody = this.buildAIRequestBody(service, prompt, {
            ...options,
            systemPrompt: options.systemPrompt || '你是一个智能的任务管理助手。'
        });
        const requestHeaders = this.buildAIRequestHeaders(service);

        const response = await fetch(service.endpoint, {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败: ${response.status} ${errorText}`);
        }

        return await response.json();
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
            const service = this.services[serviceName];
            const content = service?.protocol === 'anthropic-messages'
                ? response.content?.map(part => part.text || '').join('').trim()
                : response.choices?.[0]?.message?.content;
            if (!content) {
                throw new Error('AI响应为空');
            }
            console.log(`✅ ${serviceName}响应:`, content);
            return content;
        } catch (error) {
            console.error('解析AI响应失败:', error);
            throw new Error('AI响应解析失败');
        }
    }
}
