// 番茄钟计时器模块
// 从 script.js 中提取的番茄钟核心功能

/**
 * 番茄钟计时器类
 */
export class PomodoroTimer {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = 25 * 60; // 25分钟，以秒为单位
        this.workTime = 25 * 60;
        this.shortBreakTime = 5 * 60;
        this.longBreakTime = 15 * 60;
        this.currentMode = 'work'; // work, shortBreak, longBreak
        this.cycle = 0;
        this.timer = null;
        this.selectedTask = null;
        this.isCountdownMode = true;
        this.sessions = []; // 完成的番茄钟记录
    }

    /**
     * 加载数据
     */
    loadData() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        const savedSessions = localStorage.getItem('pomodoroSessions');

        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.workTime = settings.workTime || 25 * 60;
                this.shortBreakTime = settings.shortBreakTime || 5 * 60;
                this.longBreakTime = settings.longBreakTime || 15 * 60;
                this.isCountdownMode = settings.isCountdownMode !== false;
                console.log('✅ 番茄钟设置已加载');
            } catch (error) {
                console.error('❌ 加载番茄钟设置失败:', error);
            }
        }

        if (savedSessions) {
            try {
                this.sessions = JSON.parse(savedSessions);
                console.log('✅ 番茄钟记录已加载:', this.sessions.length, '个');
            } catch (error) {
                console.error('❌ 加载番茄钟记录失败:', error);
            }
        }
    }

    /**
     * 保存数据
     */
    saveData() {
        const settings = {
            workTime: this.workTime,
            shortBreakTime: this.shortBreakTime,
            longBreakTime: this.longBreakTime,
            isCountdownMode: this.isCountdownMode
        };

        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
        localStorage.setItem('pomodoroSessions', JSON.stringify(this.sessions));
        console.log('✅ 番茄钟数据已保存');
    }

    /**
     * 开始计时
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;

        // 开始计时
        this.timer = setInterval(() => {
            if (this.isCountdownMode) {
                this.currentTime--;
                if (this.currentTime <= 0) {
                    this.completeSession();
                }
            } else {
                this.currentTime++;
            }
        }, 1000);

        console.log('🍅 番茄专注开始');
        return true;
    }

    /**
     * 暂停计时
     */
    pause() {
        if (!this.isRunning) return false;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            clearInterval(this.timer);
            console.log('⏸️ 番茄专注暂停');
        } else {
            this.start();
            console.log('▶️ 番茄专注继续');
        }

        return this.isPaused;
    }

    /**
     * 停止计时
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;

        clearInterval(this.timer);
        console.log('⏹️ 番茄专注停止');

        return true;
    }

    /**
     * 重置计时器
     */
    reset() {
        this.stop();

        if (this.isCountdownMode) {
            this.currentTime = this.workTime;
        } else {
            this.currentTime = 0;
        }

        console.log('🔄 番茄钟已重置');
        return true;
    }

    /**
     * 完成一个番茄钟
     */
    completeSession() {
        this.stop();
        this.cycle++;

        // 记录完成的番茄钟
        const session = {
            id: `session-${Date.now()}`,
            startTime: new Date(Date.now() - this.workTime * 1000).toISOString(),
            endTime: new Date().toISOString(),
            duration: this.workTime,
            mode: this.currentMode,
            taskId: this.selectedTask?.id || null,
            taskTitle: this.selectedTask?.title || '未关联任务'
        };

        this.sessions.push(session);
        this.saveData();

        console.log('✅ 番茄钟完成！周期:', this.cycle);

        // 切换到休息模式
        if (this.cycle % 4 === 0) {
            this.switchToBreak('long');
        } else {
            this.switchToBreak('short');
        }

        return session;
    }

    /**
     * 切换到休息模式
     * @param {string} type - 休息类型 ('short' 或 'long')
     */
    switchToBreak(type) {
        if (type === 'long') {
            this.currentMode = 'longBreak';
            this.currentTime = this.longBreakTime;
            console.log('☕ 切换到长休息');
        } else {
            this.currentMode = 'shortBreak';
            this.currentTime = this.shortBreakTime;
            console.log('☕ 切换到短休息');
        }
    }

    /**
     * 切换到工作模式
     */
    switchToWork() {
        this.currentMode = 'work';
        this.currentTime = this.workTime;
        console.log('💼 切换到工作模式');
    }

    /**
     * 切换计时模式
     * @param {string} mode - 'countdown' 或 'countup'
     */
    switchMode(mode) {
        this.isCountdownMode = mode === 'countdown';
        this.reset();
        this.saveData();
        console.log('🔄 切换计时模式:', mode);
    }

    /**
     * 设置工作时长
     * @param {number} minutes - 分钟数
     */
    setWorkTime(minutes) {
        this.workTime = minutes * 60;
        if (this.currentMode === 'work') {
            this.currentTime = this.workTime;
        }
        this.saveData();
        console.log('⏱️ 工作时长设置为:', minutes, '分钟');
    }

    /**
     * 设置短休息时长
     * @param {number} minutes - 分钟数
     */
    setShortBreakTime(minutes) {
        this.shortBreakTime = minutes * 60;
        if (this.currentMode === 'shortBreak') {
            this.currentTime = this.shortBreakTime;
        }
        this.saveData();
        console.log('⏱️ 短休息时长设置为:', minutes, '分钟');
    }

    /**
     * 设置长休息时长
     * @param {number} minutes - 分钟数
     */
    setLongBreakTime(minutes) {
        this.longBreakTime = minutes * 60;
        if (this.currentMode === 'longBreak') {
            this.currentTime = this.longBreakTime;
        }
        this.saveData();
        console.log('⏱️ 长休息时长设置为:', minutes, '分钟');
    }

    /**
     * 关联任务
     * @param {Object} task - 任务对象
     */
    setTask(task) {
        this.selectedTask = task;
        console.log('📌 关联任务:', task?.title || '无');
    }

    /**
     * 获取当前时间（格式化）
     * @returns {string} MM:SS 格式
     */
    getFormattedTime() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * 获取进度百分比
     * @returns {number} 0-100
     */
    getProgress() {
        let totalTime;
        if (this.currentMode === 'work') {
            totalTime = this.workTime;
        } else if (this.currentMode === 'shortBreak') {
            totalTime = this.shortBreakTime;
        } else {
            totalTime = this.longBreakTime;
        }

        if (this.isCountdownMode) {
            return ((totalTime - this.currentTime) / totalTime) * 100;
        } else {
            return Math.min((this.currentTime / totalTime) * 100, 100);
        }
    }

    /**
     * 获取今日统计
     * @returns {Object} 统计数据
     */
    getTodayStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySessions = this.sessions.filter(session => {
            const sessionDate = new Date(session.endTime);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate.getTime() === today.getTime();
        });

        const totalMinutes = todaySessions.reduce((sum, session) => sum + session.duration / 60, 0);

        return {
            count: todaySessions.length,
            totalMinutes: Math.round(totalMinutes),
            sessions: todaySessions
        };
    }

    /**
     * 获取本周统计
     * @returns {Object} 统计数据
     */
    getWeekStats() {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weekSessions = this.sessions.filter(session => {
            const sessionDate = new Date(session.endTime);
            return sessionDate >= weekAgo;
        });

        const totalMinutes = weekSessions.reduce((sum, session) => sum + session.duration / 60, 0);

        return {
            count: weekSessions.length,
            totalMinutes: Math.round(totalMinutes),
            sessions: weekSessions
        };
    }

    /**
     * 获取所有统计
     * @returns {Object} 统计数据
     */
    getAllStats() {
        const totalMinutes = this.sessions.reduce((sum, session) => sum + session.duration / 60, 0);

        return {
            totalSessions: this.sessions.length,
            totalMinutes: Math.round(totalMinutes),
            totalHours: Math.round(totalMinutes / 60 * 10) / 10,
            today: this.getTodayStats(),
            week: this.getWeekStats()
        };
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
        this.sessions = [];
        this.saveData();
        console.log('🗑️ 番茄钟历史已清空');
    }
}

// 导出单例实例
export const pomodoroTimer = new PomodoroTimer();
