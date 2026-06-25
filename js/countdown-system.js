
function renderSafeModuleMarkup(container, markup) {
    if (!container) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${markup}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    root.querySelectorAll('script, iframe, object, embed, link, meta').forEach(node => node.remove());
    root.querySelectorAll('*').forEach(node => {
        [...node.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const value = attr.value.trim().toLowerCase();
            if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
                node.removeAttribute(attr.name);
            }
        });
    });
    container.replaceChildren(...[...root.childNodes].map(node => document.importNode(node, true)));
}

// ==================== 倒数纪念日功能 ====================

// 倒数纪念日系统类
class CountdownSystem {
    constructor() {
        this.events = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.sortBy = 'date';
        this.sortOrder = 'asc';

        this.init();
    }

    init() {
        console.log('📅 倒数纪念日系统初始化');
        this.loadData();
        this.bindEvents();
        this.renderEvents();
        this.startCountdownUpdate();
    }

    loadData() {
        try {
            const saved = localStorage.getItem('countdownEvents');
            if (saved) {
                this.events = JSON.parse(saved);
            }
        } catch (error) {
            console.error('加载倒数纪念日数据失败:', error);
            this.events = [];
        }
    }

    saveData() {
        try {
            localStorage.setItem('countdownEvents', JSON.stringify(this.events));
        } catch (error) {
            console.error('保存倒数纪念日数据失败:', error);
        }
    }

    bindEvents() {
        // 防止重复绑定事件监听器
        if (this.eventsBound) {
            console.log('⚠️ 倒数纪念日事件监听器已经绑定，跳过重复绑定');
            return;
        }
        this.eventsBound = true;

        // 添加纪念日按钮
        const addBtn = document.getElementById('add-countdown-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddModal());
        }

        // 搜索功能
        const searchInput = document.getElementById('countdown-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderEvents();
            });
        }

        // 筛选按钮
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 移除所有active类
                filterBtns.forEach(b => b.classList.remove('active'));
                // 添加active类到当前按钮
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderEvents();
            });
        });

        // 数据管理按钮
        const exportBtn = document.querySelector('.export-btn');
        const importBtn = document.querySelector('.import-btn');
        const clearBtn = document.querySelector('.clear-btn');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importData());
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllData());
        }

        document.addEventListener('click', (event) => {
            const closeButton = event.target.closest('[data-countdown-close]');
            if (closeButton) {
                closeButton.closest('.countdown-add-modal, .countdown-edit-modal')?.remove();
                return;
            }

            const iconOption = event.target.closest('[data-countdown-icon]');
            if (iconOption) {
                this.selectIcon(decodeURIComponent(iconOption.dataset.countdownIcon), iconOption);
                return;
            }

            const actionButton = event.target.closest('[data-countdown-action]');
            if (actionButton) {
                event.stopPropagation();
                const action = actionButton.dataset.countdownAction;
                const eventId = actionButton.dataset.eventId;
                if (action === 'save') this.saveEvent();
                else if (action === 'update') this.updateEvent(eventId);
                else if (action === 'edit') this.editEvent(eventId);
                else if (action === 'delete') this.deleteEvent(eventId);
                return;
            }

            const card = event.target.closest('.countdown-card[data-event-id]');
            if (card) {
                this.editEvent(card.dataset.eventId);
            }
        });

        console.log('✅ 倒数纪念日事件监听器已绑定');
    }

    showAddModal() {
        const modal = document.createElement('div');
        modal.className = 'countdown-add-modal';

        renderSafeModuleMarkup(modal, `
            <div class="modal-overlay" data-countdown-close></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="countdown-modal-title">添加纪念日</h3>
                    <button class="close-btn" data-countdown-close>&times;</button>
                </div>
                <div class="modal-body countdown-modal-body">
                    <div class="form-grid countdown-form-grid">
                        <div class="form-group">
                            <label class="countdown-form-label">纪念日名称</label>
                            <input class="countdown-form-control" type="text" id="countdown-name" placeholder="输入纪念日名称">
                        </div>

                        <div class="form-group">
                            <label class="countdown-form-label">类型</label>
                            <select class="countdown-form-control" id="countdown-type">
                                <option value="anniversary">纪念日</option>
                                <option value="birthday">生日</option>
                                <option value="holiday">节日</option>
                                <option value="countdown">倒数日</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="countdown-form-label">目标日期</label>
                            <input class="countdown-form-control countdown-form-control-sm" type="date" id="countdown-date">
                        </div>

                        <div class="form-group">
                            <label class="countdown-form-label">图标</label>
                            <div class="icon-selector countdown-icon-selector">
                                ${this.getIconOptions()}
                            </div>
                        </div>

                        <div class="form-group countdown-form-wide">
                            <div class="countdown-settings-panel countdown-settings-panel-spaced">
                                <div class="countdown-check-row countdown-check-row-spaced">
                                    <input class="countdown-check-input" type="checkbox" id="countdown-reminder">
                                    <label class="countdown-check-label">🔔 提醒设置</label>
                                </div>
                                <div id="reminder-settings" class="countdown-settings-body">
                                    <div class="countdown-settings-grid">
                                        <div>
                                            <label class="countdown-form-label-sm">提前提醒</label>
                                            <select class="countdown-form-control countdown-form-control-sm" id="reminder-advance">
                                                <option value="1">提前1天</option>
                                                <option value="3">提前3天</option>
                                                <option value="7">提前1周</option>
                                                <option value="30">提前1个月</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="countdown-form-label-sm">提醒时间</label>
                                            <input class="countdown-form-control countdown-form-control-sm" type="time" id="reminder-time" value="09:00">
                                        </div>
                                    </div>
                                    <div class="countdown-sub-settings">
                                        <div class="countdown-check-row countdown-check-row-tight">
                                            <input class="countdown-check-input" type="checkbox" id="reminder-browser" checked>
                                            <span class="countdown-check-text">浏览器通知</span>
                                        </div>
                                        <div class="countdown-check-row">
                                            <input class="countdown-check-input" type="checkbox" id="reminder-sound">
                                            <span class="countdown-check-text">声音提醒</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group countdown-form-wide">
                            <div class="countdown-settings-panel">
                                <div class="countdown-check-row">
                                    <input class="countdown-check-input" type="checkbox" id="countdown-repeat">
                                    <label class="countdown-check-label">🔄 重复设置</label>
                                </div>
                                <div id="repeat-settings" class="countdown-settings-body">
                                    <div class="countdown-settings-grid">
                                        <div>
                                            <label class="countdown-form-label-sm">重复类型</label>
                                            <select class="countdown-form-control countdown-form-control-sm" id="repeat-type">
                                                <option value="yearly">每年重复</option>
                                                <option value="monthly">每月重复</option>
                                                <option value="weekly">每周重复</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="countdown-form-label-sm">重复次数</label>
                                            <input class="countdown-form-control countdown-form-control-sm" type="number" id="repeat-count" placeholder="不限制" min="1">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer countdown-modal-footer">
                        <button class="countdown-modal-button" data-countdown-close>取消</button>
                        <button class="countdown-modal-button countdown-modal-button-primary" data-countdown-action="save">保存</button>
                    </div>
                </div>
            </div>
        `);

        document.body.appendChild(modal);

        // 绑定提醒设置显示/隐藏
        const reminderCheckbox = document.getElementById('countdown-reminder');
        const reminderSettings = document.getElementById('reminder-settings');
        if (reminderCheckbox && reminderSettings) {
            reminderCheckbox.addEventListener('change', function () {
                reminderSettings.classList.toggle('is-visible', this.checked);
            });
        }

        // 绑定重复设置显示/隐藏
        const repeatCheckbox = document.getElementById('countdown-repeat');
        const repeatSettings = document.getElementById('repeat-settings');
        if (repeatCheckbox && repeatSettings) {
            repeatCheckbox.addEventListener('change', function () {
                repeatSettings.classList.toggle('is-visible', this.checked);
            });
        }

        // 设置默认日期为今天
        const dateInput = document.getElementById('countdown-date');
        if (dateInput) {
            const today = new Date();
            dateInput.value = today.toISOString().split('T')[0];
        }
    }

    getIconOptions(selectedIcon = null) {
        const icons = [
            // 传统节日
            '🧨', '🏮', '🌿', '🚣', '🌌', '🕯️', '🌕', '🌼', '❄️',
            // 现代节日
            '🎊', '🔨', '🇨🇳', '🎓', '💐', '🎈',
            // 其他节日
            '🎄', '🎉', '🎁', '⭐', '🌟', '💫', '🔥', '💕',
            // 生活相关
            '🎂', '💍', '💼', '💰', '🏠', '💳', '🩺', '🐾',
            // 工作学习
            '🆔', '📝', '🏫', '📄', '📅', '📋', '📊', '✈️',
            // 其他
            '🎯', '🏆', '🎈', '🎪', '🎨', '🎬', '🎮', '🎸'
        ];

        return icons.map(icon => {
            const isSelected = selectedIcon === icon;
            return `
                <div class="icon-option${isSelected ? ' is-selected' : ''}" data-countdown-icon="${encodeURIComponent(icon)}">
                    ${icon}
                </div>
            `;
        }).join('');
    }

    selectIcon(icon, target = null) {
        // 移除所有选中状态
        document.querySelectorAll('.icon-option').forEach(option => {
            option.classList.remove('is-selected');
        });

        // 设置当前选中状态
        if (target) {
            target.classList.add('is-selected');
        }

        // 保存选中的图标
        this.selectedIcon = icon;
    }

    saveEvent() {
        const name = document.getElementById('countdown-name').value.trim();
        const type = document.getElementById('countdown-type').value;
        const date = document.getElementById('countdown-date').value;
        const reminderEnabled = document.getElementById('countdown-reminder').checked;
        const reminderAdvance = document.getElementById('reminder-advance').value;
        const reminderTime = document.getElementById('reminder-time').value;
        const reminderBrowser = document.getElementById('reminder-browser').checked;
        const reminderSound = document.getElementById('reminder-sound').checked;
        const repeatEnabled = document.getElementById('countdown-repeat').checked;
        const repeatType = document.getElementById('repeat-type').value;
        const repeatCount = document.getElementById('repeat-count').value;

        if (!name || !date) {
            alert('请填写完整的纪念日信息');
            return;
        }

        const event = {
            id: Date.now().toString(),
            name: name,
            icon: this.selectedIcon || '📅',
            type: type,
            date: date,
            reminder: {
                enabled: reminderEnabled,
                advanceDays: parseInt(reminderAdvance),
                time: reminderTime,
                browserNotification: reminderBrowser,
                soundNotification: reminderSound
            },
            repeat: {
                enabled: repeatEnabled,
                type: repeatType,
                count: repeatCount ? parseInt(repeatCount) : null
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.events.push(event);
        this.saveData();
        this.renderEvents();

        // 关闭模态框
        document.querySelector('.countdown-add-modal').remove();

        console.log('📅 纪念日已保存:', event);
        this.showNotification('纪念日已添加', 'success');
    }

    renderEvents() {
        const grid = document.getElementById('countdown-grid');
        if (!grid) return;

        let filteredEvents = this.events;

        // 应用搜索过滤
        if (this.searchQuery) {
            filteredEvents = filteredEvents.filter(event =>
                event.name.toLowerCase().includes(this.searchQuery)
            );
        }

        // 应用类型过滤
        if (this.currentFilter !== 'all') {
            filteredEvents = filteredEvents.filter(event =>
                event.type === this.currentFilter
            );
        }

        // 排序
        filteredEvents.sort((a, b) => {
            if (this.sortBy === 'date') {
                return this.sortOrder === 'asc' ?
                    new Date(a.date) - new Date(b.date) :
                    new Date(b.date) - new Date(a.date);
            }
            return 0;
        });

        if (filteredEvents.length === 0) {
            renderSafeModuleMarkup(grid, `
                <div class="empty-countdown">
                    <div class="empty-countdown-icon">📅</div>
                    <h3 class="empty-countdown-title">还没有纪念日</h3>
                    <p class="empty-countdown-text">点击"添加纪念日"开始创建您的第一个纪念日</p>
                </div>
            `);
            return;
        }

        renderSafeModuleMarkup(grid, filteredEvents.map(event => this.createEventCard(event)).join(''));
    }

    createEventCard(event) {
        const daysLeft = this.calculateDaysLeft(event.date);
        const status = this.getEventStatus(daysLeft);

        return `
            <div class="countdown-card countdown-card-${status}" data-event-id="${event.id}">
                <div class="countdown-card-header">
                    <div class="countdown-card-heading">
                        <div class="countdown-card-icon">${event.icon}</div>
                        <div>
                            <h3 class="countdown-card-title">${event.name}</h3>
                            <p class="countdown-card-date">${this.formatDate(event.date)}</p>
                        </div>
                    </div>
                    <div class="countdown-card-badges">
                        <span class="countdown-card-badge countdown-card-badge-status">${this.getStatusText(status)}</span>
                        <span class="countdown-card-badge countdown-card-badge-type">${this.getTypeText(event.type)}</span>
                    </div>
                </div>
                <div class="countdown-card-number-wrap">
                    <div class="countdown-card-number">${Math.abs(daysLeft)}</div>
                    <div class="countdown-card-unit">${daysLeft >= 0 ? '天后' : '天前'}</div>
                </div>
                <div class="countdown-card-actions">
                    <button class="countdown-card-button countdown-card-button-edit" data-countdown-action="edit" data-event-id="${event.id}">编辑</button>
                    <button class="countdown-card-button countdown-card-button-delete" data-countdown-action="delete" data-event-id="${event.id}">删除</button>
                </div>
            </div>
        `;
    }

    calculateDaysLeft(targetDate) {
        const today = new Date();
        const target = new Date(targetDate);
        const diffTime = target - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getEventStatus(daysLeft) {
        if (daysLeft < 0) return 'overdue';
        if (daysLeft === 0) return 'today';
        if (daysLeft <= 3) return 'urgent';
        if (daysLeft <= 7) return 'soon';
        return 'normal';
    }

    getStatusColor(status) {
        const colors = {
            overdue: '#dc3545',    // 红色 - 已过期
            today: '#ffc107',       // 黄色 - 今天
            urgent: '#fd7e14',      // 橙色 - 紧急
            soon: '#20c997',        // 青色 - 即将到来
            normal: '#667eea'       // 蓝紫色 - 正常（更醒目）
        };
        return colors[status] || '#667eea';
    }

    getStatusText(status) {
        const texts = {
            overdue: '已过期',
            today: '今天',
            urgent: '紧急',
            soon: '即将到来',
            normal: '正常'
        };
        return texts[status] || '正常';
    }

    getTypeText(type) {
        const texts = {
            anniversary: '纪念日',
            birthday: '生日',
            holiday: '节日',
            countdown: '倒数日'
        };
        return texts[type] || '纪念日';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    editEvent(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;

        // 显示编辑模态框
        const modal = document.createElement('div');
        modal.className = 'countdown-edit-modal';

        renderSafeModuleMarkup(modal, `
            <div class="modal-overlay" data-countdown-close></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="countdown-modal-title">编辑纪念日</h3>
                    <button class="close-btn" data-countdown-close>&times;</button>
                </div>
                <div class="modal-body countdown-modal-body">
                    <div class="form-grid countdown-form-grid">
                        <div class="form-group">
                            <label class="countdown-form-label">纪念日名称</label>
                            <input class="countdown-form-control" type="text" id="edit-countdown-name" value="${event.name}" placeholder="输入纪念日名称">
                        </div>

                        <div class="form-group">
                            <label class="countdown-form-label">类型</label>
                            <select class="countdown-form-control" id="edit-countdown-type">
                                <option value="anniversary" ${event.type === 'anniversary' ? 'selected' : ''}>纪念日</option>
                                <option value="birthday" ${event.type === 'birthday' ? 'selected' : ''}>生日</option>
                                <option value="holiday" ${event.type === 'holiday' ? 'selected' : ''}>节日</option>
                                <option value="countdown" ${event.type === 'countdown' ? 'selected' : ''}>倒数日</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="countdown-form-label">目标日期</label>
                            <input class="countdown-form-control countdown-form-control-sm" type="date" id="edit-countdown-date" value="${event.date}">
                        </div>

                        <div class="form-group">
                            <label class="countdown-form-label">图标</label>
                            <div class="icon-selector countdown-icon-selector">
                                ${this.getIconOptions(event.icon)}
                            </div>
                        </div>

                        <div class="form-group countdown-form-wide">
                            <div class="countdown-settings-panel countdown-settings-panel-spaced">
                                <div class="countdown-check-row countdown-check-row-spaced">
                                    <input class="countdown-check-input" type="checkbox" id="edit-countdown-reminder" ${event.reminder.enabled ? 'checked' : ''}>
                                    <label class="countdown-check-label">🔔 提醒设置</label>
                                </div>
                                <div id="edit-reminder-settings" class="countdown-settings-body${event.reminder.enabled ? ' is-visible' : ''}">
                                    <div class="countdown-settings-grid">
                                        <div>
                                            <label class="countdown-form-label-sm">提前提醒</label>
                                            <select class="countdown-form-control countdown-form-control-sm" id="edit-reminder-advance">
                                                <option value="1" ${event.reminder.advanceDays === 1 ? 'selected' : ''}>提前1天</option>
                                                <option value="3" ${event.reminder.advanceDays === 3 ? 'selected' : ''}>提前3天</option>
                                                <option value="7" ${event.reminder.advanceDays === 7 ? 'selected' : ''}>提前1周</option>
                                                <option value="30" ${event.reminder.advanceDays === 30 ? 'selected' : ''}>提前1个月</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="countdown-form-label-sm">提醒时间</label>
                                            <input class="countdown-form-control countdown-form-control-sm" type="time" id="edit-reminder-time" value="${event.reminder.time || '09:00'}">
                                        </div>
                                    </div>
                                    <div class="countdown-sub-settings">
                                        <div class="countdown-check-row countdown-check-row-tight">
                                            <input class="countdown-check-input" type="checkbox" id="edit-reminder-browser" ${event.reminder.browserNotification !== false ? 'checked' : ''}>
                                            <span class="countdown-check-text">浏览器通知</span>
                                        </div>
                                        <div class="countdown-check-row">
                                            <input class="countdown-check-input" type="checkbox" id="edit-reminder-sound" ${event.reminder.soundNotification ? 'checked' : ''}>
                                            <span class="countdown-check-text">声音提醒</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group countdown-form-wide">
                            <div class="countdown-settings-panel">
                                <div class="countdown-check-row">
                                    <input class="countdown-check-input" type="checkbox" id="edit-countdown-repeat" ${event.repeat.enabled ? 'checked' : ''}>
                                    <label class="countdown-check-label">🔄 重复设置</label>
                                </div>
                                <div id="edit-repeat-settings" class="countdown-settings-body${event.repeat.enabled ? ' is-visible' : ''}">
                                    <div class="countdown-settings-grid">
                                        <div>
                                            <label class="countdown-form-label-sm">重复类型</label>
                                            <select class="countdown-form-control countdown-form-control-sm" id="edit-repeat-type">
                                                <option value="yearly" ${event.repeat.type === 'yearly' ? 'selected' : ''}>每年重复</option>
                                                <option value="monthly" ${event.repeat.type === 'monthly' ? 'selected' : ''}>每月重复</option>
                                                <option value="weekly" ${event.repeat.type === 'weekly' ? 'selected' : ''}>每周重复</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label class="countdown-form-label-sm">重复次数</label>
                                            <input class="countdown-form-control countdown-form-control-sm" type="number" id="edit-repeat-count" value="${event.repeat.count || ''}" placeholder="不限制" min="1">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="modal-footer countdown-modal-footer">
                        <button class="countdown-modal-button" data-countdown-close>取消</button>
                        <button class="countdown-modal-button countdown-modal-button-primary" data-countdown-action="update" data-event-id="${eventId}">保存</button>
                    </div>
                </div>
            </div>
        `);

        document.body.appendChild(modal);

        // 绑定提醒设置显示/隐藏
        const reminderCheckbox = document.getElementById('edit-countdown-reminder');
        const reminderSettings = document.getElementById('edit-reminder-settings');
        if (reminderCheckbox && reminderSettings) {
            reminderCheckbox.addEventListener('change', function () {
                reminderSettings.classList.toggle('is-visible', this.checked);
            });
        }

        // 绑定重复设置显示/隐藏
        const repeatCheckbox = document.getElementById('edit-countdown-repeat');
        const repeatSettings = document.getElementById('edit-repeat-settings');
        if (repeatCheckbox && repeatSettings) {
            repeatCheckbox.addEventListener('change', function () {
                repeatSettings.classList.toggle('is-visible', this.checked);
            });
        }

        // 设置当前选中的图标
        this.selectedIcon = event.icon;
    }

    updateEvent(eventId) {
        const name = document.getElementById('edit-countdown-name').value.trim();
        const type = document.getElementById('edit-countdown-type').value;
        const date = document.getElementById('edit-countdown-date').value;
        const reminderEnabled = document.getElementById('edit-countdown-reminder').checked;
        const reminderAdvance = document.getElementById('edit-reminder-advance').value;
        const reminderTime = document.getElementById('edit-reminder-time').value;
        const reminderBrowser = document.getElementById('edit-reminder-browser').checked;
        const reminderSound = document.getElementById('edit-reminder-sound').checked;
        const repeatEnabled = document.getElementById('edit-countdown-repeat').checked;
        const repeatType = document.getElementById('edit-repeat-type').value;
        const repeatCount = document.getElementById('edit-repeat-count').value;

        if (!name || !date) {
            alert('请填写完整的纪念日信息');
            return;
        }

        // 找到要更新的事件
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex === -1) return;

        // 更新事件信息
        this.events[eventIndex] = {
            ...this.events[eventIndex],
            name: name,
            icon: this.selectedIcon || this.events[eventIndex].icon,
            type: type,
            date: date,
            reminder: {
                enabled: reminderEnabled,
                advanceDays: parseInt(reminderAdvance),
                time: reminderTime,
                browserNotification: reminderBrowser,
                soundNotification: reminderSound
            },
            repeat: {
                enabled: repeatEnabled,
                type: repeatType,
                count: repeatCount ? parseInt(repeatCount) : null
            },
            updatedAt: new Date().toISOString()
        };

        this.saveData();
        this.renderEvents();

        // 关闭模态框
        document.querySelector('.countdown-edit-modal').remove();

        console.log('📅 纪念日已更新:', this.events[eventIndex]);
        this.showNotification('纪念日已更新', 'success');
    }

    deleteEvent(eventId) {
        if (confirm('确定要删除这个纪念日吗？')) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.saveData();
            this.renderEvents();
            this.showNotification('纪念日已删除', 'success');
        }
    }

    startCountdownUpdate() {
        // 每分钟更新一次倒计时
        setInterval(() => {
            this.renderEvents();
        }, 60000);
    }

    exportData() {
        const dataStr = JSON.stringify(this.events, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'countdown-events.json';
        link.click();
        URL.revokeObjectURL(url);
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedEvents = JSON.parse(e.target.result);
                        this.events = [...this.events, ...importedEvents];
                        this.saveData();
                        this.renderEvents();
                        this.showNotification('数据导入成功', 'success');
                    } catch (error) {
                        alert('文件格式错误');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    clearAllData() {
        if (confirm('确定要清空所有纪念日数据吗？此操作不可恢复！')) {
            this.events = [];
            this.saveData();
            this.renderEvents();
            this.showNotification('数据已清空', 'success');
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 全局倒数纪念日系统实例
let countdownSystem = null;

// 打开添加纪念日模态框
function openCountdownModal() {
    const modal = document.getElementById('add-countdown-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

// 关闭添加纪念日模态框
function closeCountdownModal() {
    try {
        console.log('🔄 关闭倒数纪念日模态框...');

        const modal = document.getElementById('add-countdown-modal');
        if (!modal) {
            console.warn('⚠️ 未找到模态框元素');
            return;
        }

        // 隐藏模态框
        modal.style.display = 'none';
        console.log('✅ 模态框已隐藏');

        // 恢复页面滚动
        document.body.style.overflow = '';
        console.log('✅ 页面滚动已恢复');

        // 清空表单
        const nameInput = document.getElementById('event-name');
        const dateInput = document.getElementById('event-date');
        const typeInput = document.getElementById('event-type');

        if (nameInput) {
            nameInput.value = '';
            console.log('✅ 名称输入已清空');
        }
        if (dateInput) {
            dateInput.value = '';
            console.log('✅ 日期输入已清空');
        }
        if (typeInput) {
            typeInput.value = 'anniversary';
            console.log('✅ 类型选择已重置');
        }

        console.log('✅ 模态框关闭完成');
    } catch (error) {
        console.error('❌ 关闭模态框时出错:', error);
        // 强制恢复页面状态
        try {
            const modal = document.getElementById('add-countdown-modal');
            if (modal) modal.style.display = 'none';
            document.body.style.overflow = '';
        } catch (e) {
            console.error('❌ 强制恢复失败:', e);
        }
    }
}

// 保存纪念日事件
function saveCountdownEvent() {
    const name = document.getElementById('event-name').value.trim();
    const date = document.getElementById('event-date').value;
    const type = document.getElementById('event-type').value;

    if (!name) {
        alert('请输入纪念日名称');
        return;
    }

    if (!date) {
        alert('请选择日期');
        return;
    }

    const newEvent = {
        id: Date.now().toString(),
        name: name,
        date: date,
        type: type,
        icon: '📅',
        createdAt: new Date().toISOString()
    };

    if (countdownSystem) {
        countdownSystem.events.push(newEvent);
        countdownSystem.saveData();
        countdownSystem.renderEvents();
    }

    closeCountdownModal();
    alert('纪念日添加成功！');
}

// 初始化倒数纪念日功能
function initCountdownSystem() {
    if (!countdownSystem) {
        countdownSystem = new CountdownSystem();
    }
    console.log('📅 倒数纪念日功能已初始化');

    // 为取消按钮添加事件监听器（防止onclick不生效）
    setTimeout(() => {
        const cancelBtn = document.querySelector('#add-countdown-modal .btn-cancel');
        if (cancelBtn) {
            // 移除旧的onclick属性，使用事件监听器
            cancelBtn.removeAttribute('onclick');
            cancelBtn.addEventListener('click', function(e) {
                console.log('✅ 取消按钮事件监听器被触发');
                e.preventDefault();
                e.stopPropagation();
                closeCountdownModal();
            });
            console.log('✅ 倒数纪念日取消按钮事件监听器已绑定');
        } else {
            console.warn('⚠️ 未找到倒数纪念日取消按钮');
        }
    }, 1000);
}

// 全局习惯打卡系统实例
