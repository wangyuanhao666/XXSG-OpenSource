// AI行为分析模块
// 从 script.js 中提取的AI行为分析功能

/**
 * AI行为分析器类
 */
export class AIBehaviorAnalyzer {
    constructor() {
        this.userBehaviorData = {
            workPatterns: {},
            efficiencyCurves: {},
            taskPreferences: {},
            workloadHistory: []
        };
    }

    /**
     * 加载行为数据
     */
    loadBehaviorData() {
        const savedData = localStorage.getItem('userBehaviorData');
        if (savedData) {
            try {
                this.userBehaviorData = JSON.parse(savedData);
                console.log('📊 已加载用户行为数据');
                return this.userBehaviorData;
            } catch (error) {
                console.error('❌ 加载行为数据失败:', error);
                return null;
            }
        }
        return null;
    }

    /**
     * 保存行为数据
     */
    saveBehaviorData() {
        try {
            localStorage.setItem('userBehaviorData', JSON.stringify(this.userBehaviorData));
            console.log('💾 行为数据已保存');
            return true;
        } catch (error) {
            console.error('❌ 保存行为数据失败:', error);
            return false;
        }
    }

    /**
     * 记录任务创建
     * @param {Object} taskData - 任务数据
     */
    recordTaskCreation(taskData) {
        const record = {
            timestamp: new Date().toISOString(),
            taskTitle: taskData.title,
            priority: taskData.priority,
            estimatedTime: taskData.estimatedTime,
            hour: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            type: 'creation'
        };

        this.userBehaviorData.workloadHistory.push(record);
        console.log('📝 记录任务创建:', record.taskTitle);
        this.saveBehaviorData();
    }

    /**
     * 记录任务完成
     * @param {Object} taskData - 任务数据
     */
    recordTaskCompletion(taskData) {
        const completionRecord = {
            timestamp: new Date().toISOString(),
            taskTitle: taskData.title,
            priority: taskData.priority,
            actualTime: taskData.actualTime,
            hour: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            completed: true,
            type: 'completion'
        };

        this.userBehaviorData.workloadHistory.push(completionRecord);
        console.log('✅ 记录任务完成:', completionRecord.taskTitle);
        this.saveBehaviorData();
    }

    /**
     * 分析工作时间分布
     * @param {Array} data - 工作数据
     * @returns {Object} 时间分布统计
     */
    analyzeWorkTimeDistribution(data = null) {
        const workData = data || this.userBehaviorData.workloadHistory;

        // 按小时统计
        const hourlyDistribution = {};
        for (let i = 0; i < 24; i++) {
            hourlyDistribution[i] = 0;
        }

        workData.forEach(record => {
            const hour = record.hour;
            hourlyDistribution[hour]++;
        });

        // 找出最活跃的时间段
        let peakHour = 0;
        let maxCount = 0;
        for (const [hour, count] of Object.entries(hourlyDistribution)) {
            if (count > maxCount) {
                maxCount = count;
                peakHour = parseInt(hour);
            }
        }

        console.log('⏰ 最活跃时间段:', peakHour + ':00');

        return {
            hourlyDistribution,
            peakHour,
            peakCount: maxCount
        };
    }

    /**
     * 分析效率曲线
     * @param {Array} data - 工作数据
     * @returns {Object} 效率分析结果
     */
    analyzeEfficiencyCurve(data = null) {
        const workData = data || this.userBehaviorData.workloadHistory;
        const completedTasks = workData.filter(record => record.completed);

        if (completedTasks.length === 0) {
            console.log('⚠️ 没有完成的任务数据');
            return null;
        }

        // 按小时统计完成率
        const hourlyEfficiency = {};
        for (let i = 0; i < 24; i++) {
            hourlyEfficiency[i] = { total: 0, completed: 0, rate: 0 };
        }

        workData.forEach(record => {
            const hour = record.hour;
            hourlyEfficiency[hour].total++;
            if (record.completed) {
                hourlyEfficiency[hour].completed++;
            }
        });

        // 计算完成率
        for (const hour in hourlyEfficiency) {
            const data = hourlyEfficiency[hour];
            if (data.total > 0) {
                data.rate = (data.completed / data.total) * 100;
            }
        }

        // 找出效率最高的时间段
        let bestHour = 0;
        let bestRate = 0;
        for (const [hour, data] of Object.entries(hourlyEfficiency)) {
            if (data.rate > bestRate && data.total >= 2) { // 至少2个任务才有参考价值
                bestRate = data.rate;
                bestHour = parseInt(hour);
            }
        }

        console.log('🎯 效率最高时间段:', bestHour + ':00', '完成率:', bestRate.toFixed(1) + '%');

        return {
            hourlyEfficiency,
            bestHour,
            bestRate
        };
    }

    /**
     * 分析任务偏好
     * @param {Array} data - 工作数据
     * @returns {Object} 任务偏好分析
     */
    analyzeTaskPreferences(data = null) {
        const workData = data || this.userBehaviorData.workloadHistory;

        // 按优先级统计
        const priorityStats = {
            1: { count: 0, completed: 0 },
            2: { count: 0, completed: 0 },
            3: { count: 0, completed: 0 },
            4: { count: 0, completed: 0 }
        };

        workData.forEach(record => {
            const priority = record.priority || 4;
            priorityStats[priority].count++;
            if (record.completed) {
                priorityStats[priority].completed++;
            }
        });

        // 计算各优先级的完成率
        for (const priority in priorityStats) {
            const stats = priorityStats[priority];
            stats.completionRate = stats.count > 0 ? (stats.completed / stats.count) * 100 : 0;
        }

        console.log('📊 任务优先级偏好:', priorityStats);

        return priorityStats;
    }

    /**
     * 分析工作负荷
     * @param {Array} data - 工作数据
     * @returns {Object} 工作负荷分析
     */
    analyzeWorkload(data = null) {
        const workData = data || this.userBehaviorData.workloadHistory;

        // 按星期统计
        const weeklyStats = {};
        for (let i = 0; i < 7; i++) {
            weeklyStats[i] = { count: 0, completed: 0 };
        }

        workData.forEach(record => {
            const dayOfWeek = record.dayOfWeek;
            weeklyStats[dayOfWeek].count++;
            if (record.completed) {
                weeklyStats[dayOfWeek].completed++;
            }
        });

        // 找出最忙碌的一天
        let busiestDay = 0;
        let maxTasks = 0;
        for (const [day, stats] of Object.entries(weeklyStats)) {
            if (stats.count > maxTasks) {
                maxTasks = stats.count;
                busiestDay = parseInt(day);
            }
        }

        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        console.log('📅 最忙碌的一天:', dayNames[busiestDay], '任务数:', maxTasks);

        return {
            weeklyStats,
            busiestDay,
            busiestDayName: dayNames[busiestDay],
            maxTasks
        };
    }

    /**
     * 生成工作建议
     * @returns {Object} 工作建议
     */
    generateRecommendations() {
        const timeDistribution = this.analyzeWorkTimeDistribution();
        const efficiencyCurve = this.analyzeEfficiencyCurve();
        const taskPreferences = this.analyzeTaskPreferences();
        const workload = this.analyzeWorkload();

        const recommendations = [];

        // 基于效率曲线的建议
        if (efficiencyCurve && efficiencyCurve.bestHour) {
            recommendations.push({
                type: 'efficiency',
                title: '最佳工作时间',
                message: `您在${efficiencyCurve.bestHour}:00左右效率最高，建议在这个时间段处理重要任务。`,
                icon: '🎯'
            });
        }

        // 基于工作时间分布的建议
        if (timeDistribution && timeDistribution.peakHour) {
            recommendations.push({
                type: 'worktime',
                title: '工作习惯',
                message: `您通常在${timeDistribution.peakHour}:00左右最活跃，可以利用这个时间段集中处理任务。`,
                icon: '⏰'
            });
        }

        // 基于任务偏好的建议
        if (taskPreferences) {
            const highPriorityRate = taskPreferences[1].completionRate;
            if (highPriorityRate < 50 && taskPreferences[1].count > 0) {
                recommendations.push({
                    type: 'priority',
                    title: '优先级管理',
                    message: '重要紧急任务的完成率较低，建议优先处理这类任务。',
                    icon: '⚠️'
                });
            }
        }

        // 基于工作负荷的建议
        if (workload && workload.maxTasks > 10) {
            recommendations.push({
                type: 'workload',
                title: '工作负荷',
                message: `${workload.busiestDayName}通常任务较多，建议提前规划或分散任务。`,
                icon: '📅'
            });
        }

        console.log('💡 生成了', recommendations.length, '条工作建议');

        return recommendations;
    }

    /**
     * 获取完整分析报告
     * @returns {Object} 分析报告
     */
    getAnalysisReport() {
        const data = this.userBehaviorData.workloadHistory;

        if (data.length === 0) {
            return {
                hasData: false,
                message: '暂无数据，请先使用系统记录您的工作习惯'
            };
        }

        return {
            hasData: true,
            dataPoints: data.length,
            timeDistribution: this.analyzeWorkTimeDistribution(),
            efficiencyCurve: this.analyzeEfficiencyCurve(),
            taskPreferences: this.analyzeTaskPreferences(),
            workload: this.analyzeWorkload(),
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * 清空行为数据
     */
    clearData() {
        this.userBehaviorData = {
            workPatterns: {},
            efficiencyCurves: {},
            taskPreferences: {},
            workloadHistory: []
        };
        this.saveBehaviorData();
        console.log('🗑️ 行为数据已清空');
    }
}

// 导出单例实例
export const behaviorAnalyzer = new AIBehaviorAnalyzer();
