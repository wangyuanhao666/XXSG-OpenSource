// AI任务分析模块
// 从 script.js 中提取的AI任务分析功能

import { AIServiceManager } from './ai-service.js';

/**
 * 智能任务分析器
 */
export class AITaskAnalyzer {
    constructor(aiService) {
        this.aiService = aiService || new AIServiceManager();
    }

    /**
     * 分析任务并推荐象限分类
     * @param {string} taskText - 任务文本
     * @returns {Promise<Object>} 分析结果
     */
    async analyzeTask(taskText) {
        console.log('AI task analysis started.');

        // 检查AI服务是否可用
        const availableService = this.aiService.getAvailableService();
        if (!availableService) {
            console.warn('⚠️ AI服务不可用，使用回退分析');
            return this.fallbackAnalysis(taskText);
        }

        console.log('✅ 使用AI服务进行分析:', availableService);

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

            console.log('AI response received.');

            // 解析JSON响应
            let analysis = this.parseAIResponse(response);

            // 验证分析结果
            if (!analysis.quadrant || analysis.quadrant < 1 || analysis.quadrant > 4) {
                throw new Error('AI返回的象限分类无效');
            }

            console.log('✅ 任务分析完成:', analysis);
            return analysis;

        } catch (error) {
            console.error('❌ 任务分析失败:', error);
            console.log('🔄 使用回退分析');
            return this.fallbackAnalysis(taskText);
        }
    }

    /**
     * 解析AI响应
     * @param {string} response - AI响应
     * @returns {Object} 解析后的分析结果
     */
    parseAIResponse(response) {
        let jsonContent = response;

        // 检查是否包含markdown代码块
        if (jsonContent.includes('```json')) {
            const codeBlockMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
                jsonContent = codeBlockMatch[1].trim();
                console.log('🔧 检测到JSON代码块，提取内容');
            }
        } else if (jsonContent.includes('```')) {
            const codeBlockMatch = jsonContent.match(/```\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
                jsonContent = codeBlockMatch[1].trim();
                console.log('🔧 检测到代码块，提取内容');
            }
        }

        try {
            return JSON.parse(jsonContent);
        } catch (parseError) {
            console.warn('⚠️ JSON解析失败，尝试提取JSON部分');
            // 尝试匹配JSON对象
            const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('无法解析AI响应为JSON格式');
        }
    }

    /**
     * 回退分析（当AI服务不可用时）
     * @param {string} taskText - 任务文本
     * @returns {Object} 分析结果
     */
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

    /**
     * 估算任务完成时间
     * @param {string} taskText - 任务文本
     * @returns {Promise<Object>} 时间估算结果
     */
    async estimateTaskDuration(taskText) {
        console.log('AI time estimation started.');

        // 检查AI服务是否可用
        if (!this.aiService.getAvailableService()) {
            console.warn('⚠️ AI服务不可用，使用回退时间估算');
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

            console.log('AI time estimation response received.');

            let estimation = this.parseAIResponse(response);

            // 验证估算结果
            if (!estimation.estimatedMinutes || estimation.estimatedMinutes < 0) {
                throw new Error('AI返回的时间估算无效');
            }

            console.log('✅ 时间估算完成:', estimation);
            return estimation;

        } catch (error) {
            console.error('❌ 时间估算失败:', error);
            console.log('🔄 使用回退时间估算');
            return this.fallbackTimeEstimation(taskText);
        }
    }

    /**
     * 回退时间估算
     * @param {string} taskText - 任务文本
     * @returns {Object} 时间估算结果
     */
    fallbackTimeEstimation(taskText) {
        const text = taskText.toLowerCase();
        let estimatedMinutes = 30; // 默认30分钟

        // 根据关键词智能估算时间
        if (text.includes('许可证') || text.includes('许可') || text.includes('授权')) {
            estimatedMinutes = 45;
        } else if (text.includes('部署') || text.includes('安装') || text.includes('配置')) {
            estimatedMinutes = 90;
        } else if (text.includes('更新') || text.includes('升级')) {
            estimatedMinutes = 30;
        } else if (text.includes('异常') || text.includes('错误') || text.includes('故障')) {
            estimatedMinutes = 60;
        } else if (text.includes('会议') || text.includes('讨论') || text.includes('沟通')) {
            estimatedMinutes = 45;
        } else if (text.includes('开发') || text.includes('编程') || text.includes('代码')) {
            estimatedMinutes = 180;
        } else if (text.includes('文档') || text.includes('报告') || text.includes('整理')) {
            estimatedMinutes = 120;
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
