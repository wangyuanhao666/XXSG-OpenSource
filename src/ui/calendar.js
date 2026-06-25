// 日历组件模块
// 简化的日历组件，用于日期选择和事件显示

import { startOfDay, addDays, getWeekdayIndex, isSameDay } from '../core/date-utils.js';

/**
 * 日历组件类
 */
export class Calendar {
    constructor(options = {}) {
        this.currentDate = options.currentDate || new Date();
        this.selectedDate = options.selectedDate || new Date();
        this.events = options.events || [];
        this.onDateSelect = options.onDateSelect || null;
        this.onEventClick = options.onEventClick || null;
    }

    /**
     * 获取当前月份的所有日期
     * @returns {Array} 日期数组
     */
    getMonthDates() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // 获取第一天是星期几（0=周日，需要转换为周一=0）
        const firstDayOfWeek = getWeekdayIndex(firstDay);

        // 计算需要显示的日期数组
        const dates = [];

        // 添加上个月的日期（填充）
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            dates.push({
                date: addDays(firstDay, -i - 1),
                isCurrentMonth: false
            });
        }

        // 添加当月的日期
        for (let day = 1; day <= lastDay.getDate(); day++) {
            dates.push({
                date: new Date(year, month, day),
                isCurrentMonth: true
            });
        }

        // 添加下个月的日期（填充到42天，6周）
        const remainingDays = 42 - dates.length;
        for (let i = 1; i <= remainingDays; i++) {
            dates.push({
                date: addDays(lastDay, i),
                isCurrentMonth: false
            });
        }

        return dates;
    }

    /**
     * 获取某日期的事件
     * @param {Date} date - 日期
     * @returns {Array} 事件数组
     */
    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.date);
            return isSameDay(eventDate, date);
        });
    }

    /**
     * 添加事件
     * @param {Object} event - 事件对象
     */
    addEvent(event) {
        this.events.push({
            id: event.id || `event-${Date.now()}`,
            title: event.title,
            date: event.date,
            type: event.type || 'default',
            ...event
        });
    }

    /**
     * 删除事件
     * @param {string} eventId - 事件ID
     */
    removeEvent(eventId) {
        this.events = this.events.filter(e => e.id !== eventId);
    }

    /**
     * 切换到上个月
     */
    previousMonth() {
        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() - 1,
            1
        );
    }

    /**
     * 切换到下个月
     */
    nextMonth() {
        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() + 1,
            1
        );
    }

    /**
     * 切换到今天
     */
    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
    }

    /**
     * 选择日期
     * @param {Date} date - 日期
     */
    selectDate(date) {
        this.selectedDate = date;
        if (this.onDateSelect) {
            this.onDateSelect(date);
        }
    }

    /**
     * 渲染日历HTML
     * @returns {string} HTML字符串
     */
    render() {
        const dates = this.getMonthDates();
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;

        let html = `
            <div class="calendar">
                <div class="calendar-header">
                    <button class="calendar-prev">‹</button>
                    <div class="calendar-title">${year}年${month}月</div>
                    <button class="calendar-next">›</button>
                </div>
                <div class="calendar-weekdays">
                    <div class="calendar-weekday">周一</div>
                    <div class="calendar-weekday">周二</div>
                    <div class="calendar-weekday">周三</div>
                    <div class="calendar-weekday">周四</div>
                    <div class="calendar-weekday">周五</div>
                    <div class="calendar-weekday">周六</div>
                    <div class="calendar-weekday">周日</div>
                </div>
                <div class="calendar-dates">
        `;

        dates.forEach(({ date, isCurrentMonth }) => {
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, this.selectedDate);
            const events = this.getEventsForDate(date);
            const hasEvents = events.length > 0;

            const classes = [
                'calendar-date',
                !isCurrentMonth && 'calendar-date-other-month',
                isToday && 'calendar-date-today',
                isSelected && 'calendar-date-selected',
                hasEvents && 'calendar-date-has-events'
            ].filter(Boolean).join(' ');

            html += `
                <div class="${classes}" data-date="${date.toISOString()}">
                    <div class="calendar-date-number">${date.getDate()}</div>
                    ${hasEvents ? `<div class="calendar-date-indicator">${events.length}</div>` : ''}
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }
}

/**
 * 创建日历实例
 * @param {Object} options - 选项
 * @returns {Calendar} 日历实例
 */
export function createCalendar(options) {
    return new Calendar(options);
}
