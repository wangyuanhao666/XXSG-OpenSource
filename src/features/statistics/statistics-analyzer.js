// 统计分析模块
// 从 script.js 中提取的统计分析功能

/**
 * 统计分析类
 */
export class StatisticsAnalyzer {
    /**
     * 计算平均值
     * @param {Array} numbers - 数字数组
     * @returns {number} 平均值
     */
    static average(numbers) {
        if (!numbers || numbers.length === 0) return 0;
        const sum = numbers.reduce((acc, val) => acc + val, 0);
        return sum / numbers.length;
    }

    /**
     * 计算中位数
     * @param {Array} numbers - 数字数组
     * @returns {number} 中位数
     */
    static median(numbers) {
        if (!numbers || numbers.length === 0) return 0;

        const sorted = [...numbers].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        return sorted[mid];
    }

    /**
     * 计算标准差
     * @param {Array} numbers - 数字数组
     * @returns {number} 标准差
     */
    static standardDeviation(numbers) {
        if (!numbers || numbers.length === 0) return 0;

        const avg = this.average(numbers);
        const squareDiffs = numbers.map(value => Math.pow(value - avg, 2));
        const avgSquareDiff = this.average(squareDiffs);

        return Math.sqrt(avgSquareDiff);
    }

    /**
     * 分析任务完成情况
     * @param {Array} tasks - 任务数组
     * @returns {Object} 统计结果
     */
    static analyzeTaskCompletion(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const active = total - completed;

        const byPriority = {
            1: { total: 0, completed: 0 },
            2: { total: 0, completed: 0 },
            3: { total: 0, completed: 0 },
            4: { total: 0, completed: 0 }
        };

        tasks.forEach(task => {
            const priority = task.priority || 4;
            byPriority[priority].total++;
            if (task.completed) {
                byPriority[priority].completed++;
            }
        });

        // 计算各优先级完成率
        Object.keys(byPriority).forEach(priority => {
            const stats = byPriority[priority];
            stats.completionRate = stats.total > 0
                ? (stats.completed / stats.total * 100).toFixed(1)
                : 0;
        });

        return {
            total,
            completed,
            active,
            completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0,
            byPriority
        };
    }

    /**
     * 分析习惯打卡情况
     * @param {Array} checkIns - 打卡记录数组
     * @param {number} days - 分析天数
     * @returns {Object} 统计结果
     */
    static analyzeHabitCheckIns(checkIns, days = 30) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const recentCheckIns = checkIns.filter(c => {
            const checkInDate = new Date(c.timestamp);
            return checkInDate >= startDate;
        });

        // 按日期统计
        const byDate = {};
        recentCheckIns.forEach(checkIn => {
            const date = new Date(checkIn.date);
            const dateKey = date.toISOString().split('T')[0];
            byDate[dateKey] = (byDate[dateKey] || 0) + 1;
        });

        // 计算平均每日打卡数
        const avgPerDay = recentCheckIns.length / days;

        // 找出最活跃的一天
        let maxDate = null;
        let maxCount = 0;
        Object.entries(byDate).forEach(([date, count]) => {
            if (count > maxCount) {
                maxCount = count;
                maxDate = date;
            }
        });

        return {
            totalCheckIns: recentCheckIns.length,
            avgPerDay: avgPerDay.toFixed(1),
            maxDate,
            maxCount,
            byDate
        };
    }

    /**
     * 分析番茄钟使用情况
     * @param {Array} sessions - 番茄钟会话数组
     * @param {number} days - 分析天数
     * @returns {Object} 统计结果
     */
    static analyzePomodoroSessions(sessions, days = 7) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const recentSessions = sessions.filter(s => {
            const sessionDate = new Date(s.endTime);
            return sessionDate >= startDate;
        });

        const totalSessions = recentSessions.length;
        const totalMinutes = recentSessions.reduce((sum, s) => sum + s.duration / 60, 0);
        const avgSessionsPerDay = totalSessions / days;

        // 按日期统计
        const byDate = {};
        recentSessions.forEach(session => {
            const date = new Date(session.endTime);
            const dateKey = date.toISOString().split('T')[0];
            if (!byDate[dateKey]) {
                byDate[dateKey] = { count: 0, minutes: 0 };
            }
            byDate[dateKey].count++;
            byDate[dateKey].minutes += session.duration / 60;
        });

        return {
            totalSessions,
            totalMinutes: Math.round(totalMinutes),
            totalHours: (totalMinutes / 60).toFixed(1),
            avgSessionsPerDay: avgSessionsPerDay.toFixed(1),
            avgMinutesPerDay: (totalMinutes / days).toFixed(1),
            byDate
        };
    }

    /**
     * 生成趋势分析
     * @param {Array} data - 时间序列数据 [{date, value}]
     * @returns {Object} 趋势分析结果
     */
    static analyzeTrend(data) {
        if (!data || data.length < 2) {
            return { trend: 'stable', change: 0 };
        }

        const values = data.map(d => d.value);
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const avgFirst = this.average(firstHalf);
        const avgSecond = this.average(secondHalf);

        const change = ((avgSecond - avgFirst) / avgFirst * 100).toFixed(1);

        let trend = 'stable';
        if (change > 5) trend = 'up';
        else if (change < -5) trend = 'down';

        return {
            trend,
            change: parseFloat(change),
            avgFirst: avgFirst.toFixed(1),
            avgSecond: avgSecond.toFixed(1)
        };
    }
}

// 导出便捷函数
export const average = (numbers) => StatisticsAnalyzer.average(numbers);
export const median = (numbers) => StatisticsAnalyzer.median(numbers);
export const standardDeviation = (numbers) => StatisticsAnalyzer.standardDeviation(numbers);
export const analyzeTaskCompletion = (tasks) => StatisticsAnalyzer.analyzeTaskCompletion(tasks);
export const analyzeHabitCheckIns = (checkIns, days) => StatisticsAnalyzer.analyzeHabitCheckIns(checkIns, days);
export const analyzePomodoroSessions = (sessions, days) => StatisticsAnalyzer.analyzePomodoroSessions(sessions, days);
export const analyzeTrend = (data) => StatisticsAnalyzer.analyzeTrend(data);
