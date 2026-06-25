// AI服务管理器模块
// 从 script.js 中提取的AI功能

// AI服务管理器
export class AIServiceManager {
    constructor() {
        this.services = {
            deepseek: {
                name: 'DeepSeek',
                enabled: false,
                apiKey: null,
                endpoint: 'https://api.deepseek.com/chat/completions'
            },
            openai: {
                name: 'OpenAI',
                enabled: false,
                apiKey: null,
                endpoint: 'https://api.openai.com/v1/chat/completions'
            }
        };
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
                
                this.services.deepseek.enabled = config.deepseek?.enabled || false;
                this.services.deepseek.apiKey = config.deepseek?.apiKey || null;
                this.services.openai.enabled = config.openai?.enabled || false;
                this.services.openai.apiKey = config.openai?.apiKey || null;
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
        const config = {
            deepseek: {
                enabled: this.services.deepseek.enabled,
                apiKey: this.services.deepseek.apiKey
            },
            openai: {
                enabled: this.services.openai.enabled,
                apiKey: this.services.openai.apiKey
            },
            currentService: this.currentService
        };
        localStorage.setItem('aiConfig', JSON.stringify(config));
    }
    
    // 设置API密钥
    setAPIKey(service, apiKey) {
        if (this.services[service]) {
            this.services[service].apiKey = apiKey;
            this.services[service].enabled = !!apiKey;
            this.saveAIConfig();
            console.log(`✅ ${service} API密钥已设置`);
        }
    }
    
    // 获取当前可用的AI服务
    getAvailableService() {
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
        
        const requestBody = {
            model: service.name === 'DeepSeek' ? 'deepseek-chat' : 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: options.systemPrompt || '你是一个智能的任务管理助手。'
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
        
        const response = await fetch(service.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${service.apiKey}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API请求失败: ${response.status} ${errorText}`);
        }
        
        return await response.json();
    }
    
    // 解析AI响应
    parseAIResponse(response, serviceName) {
        try {
            const content = response.choices[0].message.content;
            console.log(`✅ ${serviceName}响应:`, content);
            return content;
        } catch (error) {
            console.error('解析AI响应失败:', error);
            throw new Error('AI响应解析失败');
        }
    }
}
