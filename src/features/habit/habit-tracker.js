// 习惯打卡模块
// 从 script.js 中提取的习惯打卡核心功能

/**
 * 习惯打卡管理类
 */
export class HabitTracker {
    constructor() {
        this.habits = [];
        this.checkIns = [];
        this.currentDate = new Date();
        this.selectedDate = new Date();
    }

    /**
     * 加载数据
     */
    loadData() {
        const savedHabits = localStorage.getItem('habitTracker_habits');
        const savedCheckIns = localStorage.getItem('habitTracker_checkIns');

        if (savedHabits) {
            this.habits = JSON.parse(savedHabits);
        }

        if (savedCheckIns) {
            this.checkIns = JSON.parse(savedCheckIns);
        }

        console.log('📊 加载习惯数据:', this.habits.length, '个习惯');
        console.log('📊 加载打卡数据:', this.checkIns.length, '条记录');

        return { habits: this.habits, checkIns: this.checkIns };
    }

    /**
     * 保存数据
     */
    saveData() {
        localStorage.setItem('habitTracker_habits', JSON.stringify(this.habits));
        localStorage.setItem('habitTracker_checkIns', JSON.stringify(this.checkIns));
        console.log('✅ 习惯数据已保存');
    }

    /**
     * 添加习惯
     * @param {Object} habitData - 习惯数据
     * @returns {Object} 新创建的习惯
     */
    addHabit(habitData) {
        const newHabit = {
            id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: habitData.name || '未命名习惯',
            icon: habitData.icon || '⭐',
            color: habitData.color || '#667eea',
            category: habitData.category || 'other',
            frequency: habitData.frequency || 'daily', // daily, weekly, custom
            target: habitData.target || 1, // 目标次数
            createdAt: new Date().toISOString(),
            ...habitData
        };

        this.habits.push(newHabit);
        this.saveData();

        console.log('✅ 习惯已添加:', newHabit.name);
        return newHabit;
    }

    /**
     * 更新习惯
     * @param {string} habitId - 习惯ID
     * @param {Object} updates - 更新的数据
     * @returns {Object|null} 更新后的习惯
     */
    updateHabit(habitId, updates) {
        const habitIndex = this.habits.findIndex(h => h.id === habitId);

        if (habitIndex === -1) {
            console.warn('⚠️ 未找到习惯:', habitId);
            return null;
        }

        this.habits[habitIndex] = {
            ...this.habits[habitIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.saveData();
        console.log('✅ 习惯已更新:', this.habits[habitIndex].name);
        return this.habits[habitIndex];
    }

    /**
     * 删除习惯
     * @param {string} habitId - 习惯ID
     * @returns {boolean} 是否删除成功
     */
    deleteHabit(habitId) {
        const habitIndex = this.habits.findIndex(h => h.id === habitId);

        if (habitIndex === -1) {
            console.warn('⚠️ 未找到习惯:', habitId);
            return false;
        }

        const deletedHabit = this.habits[habitIndex];
        this.habits.splice(habitIndex, 1);

        // 同时删除相关的打卡记录
        this.checkIns = this.checkIns.filter(c => c.habitId !== habitId);

        this.saveData();
        console.log('✅ 习惯已删除:', deletedHabit.name);
        return true;
    }

    /**
     * 打卡
     * @param {string} habitId - 习惯ID
     * @param {Date} date - 打卡日期
     * @returns {Object} 打卡记录
     */
    checkIn(habitId, date = new Date()) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) {
            console.warn('⚠️ 未找到习惯:', habitId);
            return null;
        }

        const dateStr = this.formatDate(date);

        // 检查是否已打卡
        const existingCheckIn = this.checkIns.find(c =>
            c.habitId === habitId && c.date === dateStr
        );

        if (existingCheckIn) {
            console.log('ℹ️ 今日已打卡');
            return existingCheckIn;
        }

        // 创建打卡记录
        const checkIn = {
            id: `checkin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            habitId: habitId,
            date: dateStr,
            timestamp: new Date().toISOString()
        };

        this.checkIns.push(checkIn);
        this.saveData();

        console.log('✅ 打卡成功:', habit.name, dateStr);
        return checkIn;
    }

    /**
     * 取消打卡
     * @param {string} habitId - 习惯ID
     * @param {Date} date - 打卡日期
     * @returns {boolean} 是否取消成功
     */
    uncheckIn(habitId, date = new Date()) {
        const dateStr = this.formatDate(date);

        const checkInIndex = this.checkIns.findIndex(c =>
            c.habitId === habitId && c.date === dateStr
        );

        if (checkInIndex === -1) {
            console.log('ℹ️ 未找到打卡记录');
            return false;
        }

        this.checkIns.splice(checkInIndex, 1);
        this.saveData();

        console.log('✅ 已取消打卡');
        return true;
    }

    /**
     * 获取习惯的打卡记录
     * @param {string} habitId - 习惯ID
     * @returns {Array} 打卡记录数组
     */
    getHabitCheckIns(habitId) {
        return this.checkIns.filter(c => c.habitId === habitId);
    }

    /**
     * 获取某日期的打卡记录
     * @param {Date} date - 日期
     * @returns {Array} 打卡记录数组
     */
    getCheckInsByDate(date) {
        const dateStr = this.formatDate(date);
        return this.checkIns.filter(c => c.date === dateStr);
    }

    /**
     * 检查某日期是否已打卡
     * @param {string} habitId - 习惯ID
     * @param {Date} date - 日期
     * @returns {boolean} 是否已打卡
     */
    isCheckedIn(habitId, date = new Date()) {
        const dateStr = this.formatDate(date);
        return this.checkIns.some(c => c.habitId === habitId && c.date === dateStr);
    }

    /**
     * 获取连续打卡天数
     * @param {string} habitId - 习惯ID
     * @returns {number} 连续天数
     */
    getStreak(habitId) {
        const checkIns = this.getHabitCheckIns(habitId);
        if (checkIns.length === 0) return 0;

        // 按日期排序
        const sortedDates = checkIns
            .map(c => new Date(c.date))
            .sort((a, b) => b - a);

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (const checkInDate of sortedDates) {
            checkInDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((currentDate - checkInDate) / (1000 * 60 * 60 * 24));

            if (diffDays === streak) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * 获取总打卡次数
     * @param {string} habitId - 习惯ID
     * @returns {number} 总次数
     */
    getTotalCheckIns(habitId) {
        return this.getHabitCheckIns(habitId).length;
    }

    /**
     * 获取习惯统计
     * @param {string} habitId - 习惯ID
     * @returns {Object} 统计数据
     */
    getHabitStats(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return null;

        const checkIns = this.getHabitCheckIns(habitId);
        const streak = this.getStreak(habitId);
        const total = checkIns.length;

        // 计算完成率（最近30天）
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentCheckIns = checkIns.filter(c =>
            new Date(c.date) >= thirtyDaysAgo
        );

        const completionRate = (recentCheckIns.length / 30 * 100).toFixed(1);

        return {
            habitId,
            habitName: habit.name,
            streak,
            total,
            completionRate,
            recentCheckIns: recentCheckIns.length
        };
    }

    /**
     * 获取所有习惯统计
     * @returns {Array} 统计数据数组
     */
    getAllStats() {
        return this.habits.map(habit => this.getHabitStats(habit.id));
    }

    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @returns {string} 格式化的日期字符串 (YYYY-MM-DD)
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * 获取所有习惯
     * @returns {Array} 习惯数组
     */
    getHabits() {
        return this.habits;
    }

    /**
     * 根据ID获取习惯
     * @param {string} habitId - 习惯ID
     * @returns {Object|null} 习惯对象
     */
    getHabitById(habitId) {
        return this.habits.find(h => h.id === habitId) || null;
    }

    /**
     * 根据分类获取习惯
     * @param {string} category - 分类
     * @returns {Array} 习惯数组
     */
    getHabitsByCategory(category) {
        return this.habits.filter(h => h.category === category);
    }
}

// 导出单例实例
export const habitTracker = new HabitTracker();
