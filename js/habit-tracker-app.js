/**
 * 习惯打卡功能 - 集成版
 * 使用 Font Awesome 图标
 * 可集成到主项目中
 */

class HabitTrackerApp {
    constructor() {
        this.habits = this.loadData() || [];
        this.selectedIcon = 'fa-running';
        this.editingId = null;
        this.currentFilter = 'all';
        this.calendarDate = new Date();
        this.calendarHabitFilter = 'all';
        this.settings = this.loadSettings();
        this.applyTheme(this.settings.theme);
        this.currentPage = 'main';
        this.init();
    }

    init() {
        this.updateUI();
        this.bindEvents();
        this.updateDate();
        console.log('习惯打卡功能已初始化');
    }

    // 绑定事件
    bindEvents() {
        // 导航按钮
        document.querySelectorAll('.ht-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
            });
        });

        // 添加习惯
        const addBtn = document.getElementById('ht-addHabitBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }

        const habitsList = document.getElementById('ht-habitsList');
        if (habitsList) {
            habitsList.addEventListener('click', event => {
                const actionButton = event.target.closest('[data-habit-action]');
                if (!actionButton || !habitsList.contains(actionButton)) return;

                const habitId = actionButton.closest('.ht-habit-card')?.dataset.id;
                if (!habitId) return;

                const action = actionButton.dataset.habitAction;
                if (action === 'toggle') {
                    this.toggleCheck(habitId);
                } else if (action === 'edit') {
                    this.editHabit(habitId);
                } else if (action === 'delete') {
                    this.deleteHabit(habitId);
                }
            });
        }

        // 筛选按钮
        const filterBtn = document.getElementById('ht-filterBtn');
        const filterMenu = document.getElementById('ht-filterMenu');
        if (filterBtn && filterMenu) {
            filterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                filterMenu.classList.toggle('show');
                filterBtn.parentElement.classList.toggle('show');
            });

            // 筛选选项
            filterMenu.querySelectorAll('.ht-filter-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    this.currentFilter = e.currentTarget.dataset.filter;

                    // 更新选中状态
                    filterMenu.querySelectorAll('.ht-filter-option').forEach(opt => {
                        opt.classList.remove('active');
                    });
                    e.currentTarget.classList.add('active');

                    // 关闭菜单
                    filterMenu.classList.remove('show');
                    filterBtn.parentElement.classList.remove('show');

                    // 更新显示
                    this.renderHabits();
                });
            });

            // 点击外部关闭筛选菜单
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.ht-filter-dropdown')) {
                    filterMenu.classList.remove('show');
                    filterBtn.parentElement.classList.remove('show');
                }
            });
        }

        // 模态框
        const closeModal = document.getElementById('ht-closeModal');
        const cancelBtn = document.getElementById('ht-cancelBtn');
        const saveBtn = document.getElementById('ht-saveBtn');

        if (closeModal) closeModal.addEventListener('click', () => this.closeModal());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveHabit());

        // 图标选择
        const iconPicker = document.getElementById('ht-iconPicker');
        if (iconPicker) {
            iconPicker.querySelectorAll('.ht-icon-option').forEach(icon => {
                icon.addEventListener('click', (e) => {
                    iconPicker.querySelectorAll('.ht-icon-option').forEach(i => i.classList.remove('selected'));
                    e.currentTarget.classList.add('selected');
                    this.selectedIcon = e.currentTarget.dataset.icon;
                });
            });
        }

        // 分类选择器
        const categorySelect = document.getElementById('ht-habitCategory');
        const customCategoryGroup = document.getElementById('ht-customCategoryGroup');
        if (categorySelect && customCategoryGroup) {
            categorySelect.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customCategoryGroup.style.display = 'block';
                } else {
                    customCategoryGroup.style.display = 'none';
                }
            });
        }

        // 模态框背景点击关闭
        const modalBackdrop = document.querySelector('.ht-modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.closeModal());
        }

        // 导出/导入
        const exportBtn = document.getElementById('ht-exportBtn');
        const importBtn = document.getElementById('ht-importBtn');
        const importFile = document.getElementById('ht-importFile');
        const clearBtn = document.getElementById('ht-clearBtn');

        if (exportBtn) exportBtn.addEventListener('click', () => this.exportData());
        if (importBtn) importBtn.addEventListener('click', () => importFile?.click());
        if (importFile) importFile.addEventListener('change', (e) => this.importData(e));
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearData());

        // 日历导航
        const prevMonth = document.getElementById('ht-prevMonth');
        const nextMonth = document.getElementById('ht-nextMonth');
        if (prevMonth) prevMonth.addEventListener('click', () => {
            this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
            this.renderCalendar();
        });
        if (nextMonth) nextMonth.addEventListener('click', () => {
            this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
            this.renderCalendar();
        });

        // 日历习惯筛选
        const calendarFilter = document.getElementById('ht-calendarHabitFilter');
        if (calendarFilter) {
            calendarFilter.addEventListener('change', (e) => {
                this.calendarHabitFilter = e.target.value;
                this.renderCalendar();
            });
        }

        // 设置页面事件
        this.bindSettingsEvents();
    }

    // 绑定设置事件
    bindSettingsEvents() {
        // 主题切换
        const themeColors = document.getElementById('ht-themeColors');
        if (themeColors) {
            themeColors.querySelectorAll('.ht-theme-color').forEach(color => {
                color.addEventListener('click', (e) => {
                    const theme = e.target.dataset.theme;
                    this.changeTheme(theme);
                });
            });
        }

        // 动画开关
        const animationToggle = document.getElementById('ht-animationToggle');
        if (animationToggle) {
            animationToggle.addEventListener('change', (e) => {
                this.settings.animation = e.target.checked;
                this.saveSettings();
                document.body.classList.toggle('ht-no-animation', !e.target.checked);
            });
        }
    }

    // 显示页面
    showPage(page) {
        this.currentPage = page;
        document.getElementById('ht-mainPage').style.display = page === 'main' ? 'block' : 'none';
        document.querySelectorAll('.ht-page').forEach(p => p.classList.remove('active'));

        // 更新导航按钮状态
        document.querySelectorAll('.ht-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === page) {
                btn.classList.add('active');
            }
        });

        // 主页面的返回按钮始终隐藏（通过"更多功能"tab返回）
        const mainBackBtn = document.getElementById('ht-backBtn');
        if (mainBackBtn) {
            mainBackBtn.style.display = 'none';
        }

        if (page !== 'main') {
            const pageEl = document.getElementById(`ht-${page}Page`);
            if (pageEl) pageEl.classList.add('active');
            if (page === 'stats') this.updateStats();
            if (page === 'calendar') this.renderCalendar();
            if (page === 'settings') this.updateSettingsPage();
        }
    }

    // 更新UI
    updateUI() {
        this.renderHabits();
        this.updateProgress();
    }

    // 渲染习惯列表
    renderHabits() {
        const list = document.getElementById('ht-habitsList');
        const empty = document.getElementById('ht-emptyState');
        if (!list || !empty) return;

        // 根据当前筛选条件过滤习惯
        const filteredHabits = this.currentFilter === 'all'
            ? this.habits
            : this.habits.filter(h => h.category === this.currentFilter);

        if (filteredHabits.length === 0) {
            list.replaceChildren();
            empty.classList.add('show');
            if (this.currentFilter !== 'all') {
                empty.querySelector('.ht-empty-title').textContent = '此分类暂无习惯';
            } else {
                empty.querySelector('.ht-empty-title').textContent = '还没有习惯';
            }
            return;
        }

        empty.classList.remove('show');

        const today = this.getToday();
        const fragment = document.createDocumentFragment();
        filteredHabits.forEach(habit => {
            fragment.appendChild(this.createHabitCard(habit, today));
        });
        list.replaceChildren(fragment);
    }

    createHabitCard(habit, today) {
        const isChecked = habit.checkins?.includes(today);
        const streak = this.calculateStreak(habit);

        const card = document.createElement('div');
        card.className = 'ht-habit-card';
        card.dataset.id = habit.id;
        if (isChecked) card.classList.add('completed');

        const main = document.createElement('div');
        main.className = 'ht-habit-main';

        const iconBox = document.createElement('div');
        iconBox.className = 'ht-habit-icon-box';
        const icon = document.createElement('i');
        icon.className = `fas ${habit.icon || 'fa-running'}`;
        iconBox.appendChild(icon);

        const content = document.createElement('div');
        content.className = 'ht-habit-content';

        const name = document.createElement('div');
        name.className = 'ht-habit-name';
        name.textContent = habit.name || '';

        const meta = document.createElement('div');
        meta.className = 'ht-habit-meta';

        const category = document.createElement('span');
        category.className = `ht-habit-category ${habit.category || 'custom'}`;
        const categoryIcon = document.createElement('i');
        categoryIcon.className = this.getCategoryIcon(habit.category);
        category.append(categoryIcon, document.createTextNode(` ${this.getCategoryName(habit.category, habit)}`));

        const streakEl = document.createElement('span');
        streakEl.className = 'ht-habit-streak';
        const fireIcon = document.createElement('i');
        fireIcon.className = 'fas fa-fire';
        streakEl.append(fireIcon, document.createTextNode(` ${streak}天`));

        const actions = document.createElement('div');
        actions.className = 'ht-habit-actions';

        const checkButton = document.createElement('button');
        checkButton.className = 'ht-check-btn';
        if (isChecked) checkButton.classList.add('checked');
        checkButton.dataset.habitAction = 'toggle';
        const checkIcon = document.createElement('i');
        checkIcon.className = `fas ${isChecked ? 'fa-check' : 'fa-circle'}`;
        checkButton.append(checkIcon, document.createTextNode(` ${isChecked ? '已打卡' : '打卡'}`));

        const editButton = document.createElement('button');
        editButton.className = 'ht-icon-btn';
        editButton.dataset.habitAction = 'edit';
        editButton.title = '编辑';
        const editIcon = document.createElement('i');
        editIcon.className = 'fas fa-edit';
        editButton.appendChild(editIcon);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'ht-icon-btn';
        deleteButton.dataset.habitAction = 'delete';
        deleteButton.title = '删除';
        const deleteIcon = document.createElement('i');
        deleteIcon.className = 'fas fa-trash';
        deleteButton.appendChild(deleteIcon);

        meta.append(category, streakEl);
        content.append(name, meta);
        actions.append(checkButton, editButton, deleteButton);
        main.append(iconBox, content, actions);
        card.appendChild(main);

        return card;
    }

    // 更新进度
    updateProgress() {
        const today = this.getToday();
        const total = this.habits.length;
        const completed = this.habits.filter(h => h.checkins?.includes(today)).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        const completedEl = document.getElementById('ht-completedCount');
        const totalCountEl = document.getElementById('ht-totalCount');
        const progressFillEl = document.getElementById('ht-progressFill');
        const progressPercentEl = document.getElementById('ht-progressPercent');

        if (completedEl) completedEl.textContent = completed;
        if (totalCountEl) totalCountEl.textContent = total;
        if (progressFillEl) progressFillEl.style.width = percent + '%';
        if (progressPercentEl) progressPercentEl.textContent = percent + '%';
    }

    // 更新日期
    updateDate() {
        const now = new Date();
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;
        const dateEl = document.getElementById('ht-todayDate');
        if (dateEl) dateEl.textContent = dateStr;
    }

    // 打开模态框
    openModal(habitId = null) {
        this.editingId = habitId;
        const modal = document.getElementById('ht-habitModal');
        const title = document.getElementById('ht-modalTitle');
        const customCategoryGroup = document.getElementById('ht-customCategoryGroup');

        if (!modal) return;

        if (habitId) {
            const habit = this.habits.find(h => h.id === habitId);
            if (!habit) return;
            title.textContent = '编辑习惯';
            document.getElementById('ht-habitName').value = habit.name;
            document.getElementById('ht-habitCategory').value = habit.category;
            document.getElementById('ht-habitNote').value = habit.note || '';
            this.selectedIcon = habit.icon;

            if (habit.category === 'custom' && habit.customCategory) {
                customCategoryGroup.style.display = 'block';
                document.getElementById('ht-customCategoryName').value = habit.customCategory;
            } else {
                customCategoryGroup.style.display = 'none';
            }

            document.querySelectorAll('.ht-icon-option').forEach(icon => {
                icon.classList.toggle('selected', icon.dataset.icon === habit.icon);
            });
        } else {
            title.textContent = '添加习惯';
            document.getElementById('ht-habitName').value = '';
            document.getElementById('ht-habitCategory').value = 'health';
            document.getElementById('ht-habitNote').value = '';
            document.getElementById('ht-customCategoryName').value = '';
            customCategoryGroup.style.display = 'none';
            this.selectedIcon = 'fa-running';

            document.querySelectorAll('.ht-icon-option').forEach((icon, i) => {
                icon.classList.toggle('selected', i === 0);
            });
        }

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('ht-habitModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
        this.editingId = null;
    }

    // 保存习惯
    saveHabit() {
        const name = document.getElementById('ht-habitName').value.trim();
        const category = document.getElementById('ht-habitCategory').value;
        const note = document.getElementById('ht-habitNote').value.trim();
        const customCategoryName = document.getElementById('ht-customCategoryName').value.trim();

        if (!name) {
            this.showNotification('请输入习惯名称', 'error');
            return;
        }

        if (category === 'custom' && !customCategoryName) {
            this.showNotification('请输入自定义分类名称', 'error');
            return;
        }

        const habitData = {
            name,
            icon: this.selectedIcon,
            category,
            note,
            checkins: []
        };

        if (category === 'custom') {
            habitData.customCategory = customCategoryName;
        }

        if (this.editingId) {
            const index = this.habits.findIndex(h => h.id === this.editingId);
            if (index !== -1) {
                this.habits[index] = { ...this.habits[index], ...habitData };
            }
        } else {
            habitData.id = Date.now().toString();
            habitData.createdAt = new Date().toISOString();
            this.habits.push(habitData);
        }

        this.saveData();
        this.updateUI();
        this.closeModal();
        this.showNotification(this.editingId ? '习惯已更新' : '习惯已添加', 'success');
    }

    // 编辑习惯
    editHabit(id) {
        this.openModal(id);
    }

    // 删除习惯
    deleteHabit(id) {
        if (confirm('确定要删除这个习惯吗？')) {
            this.habits = this.habits.filter(h => h.id !== id);
            this.saveData();
            this.updateUI();
            this.showNotification('习惯已删除', 'info');
        }
    }

    // 切换打卡
    toggleCheck(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        const today = this.getToday();
        if (!habit.checkins) habit.checkins = [];

        const index = habit.checkins.indexOf(today);
        if (index > -1) {
            habit.checkins.splice(index, 1);
            this.showNotification('已取消打卡', 'info');
        } else {
            habit.checkins.push(today);
            this.showNotification('打卡成功！', 'success');
        }

        this.saveData();
        this.updateUI();
    }

    // 计算连续天数
    calculateStreak(habit) {
        if (!habit.checkins || habit.checkins.length === 0) return 0;

        const sorted = [...habit.checkins].sort().reverse();
        let streak = 0;
        const today = new Date();

        for (let i = 0; i < sorted.length; i++) {
            const checkDate = new Date(sorted[i]);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);

            if (checkDate.toDateString() === expectedDate.toDateString()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    // 更新统计
    updateStats() {
        // 基础统计
        const totalHabits = this.habits.length;
        const totalCheckins = this.habits.reduce((sum, h) => sum + (h.checkins?.length || 0), 0);
        const longestStreak = Math.max(...this.habits.map(h => this.calculateStreak(h)), 0);

        // 计算本月完成率
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let monthCheckins = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = this.formatDate(new Date(year, month, day));
            monthCheckins += this.habits.filter(h => h.checkins?.includes(dateStr)).length;
        }

        const monthPossible = totalHabits * daysInMonth;
        const monthRate = monthPossible > 0 ? Math.round((monthCheckins / monthPossible) * 100) : 0;

        const totalHabitsEl = document.getElementById('ht-totalHabits');
        const totalCheckinsEl = document.getElementById('ht-totalCheckins');
        const longestStreakEl = document.getElementById('ht-longestStreak');
        const completionRateEl = document.getElementById('ht-completionRate');

        if (totalHabitsEl) totalHabitsEl.textContent = totalHabits;
        if (totalCheckinsEl) totalCheckinsEl.textContent = totalCheckins;
        if (longestStreakEl) longestStreakEl.textContent = longestStreak;
        if (completionRateEl) completionRateEl.textContent = monthRate + '%';

        // 渲染各个组件
        this.renderAchievements();
        this.renderTrendChart();
        this.renderCategoryChart();
        this.renderRanking();
        this.renderDataTable();
    }

    // 渲染成就徽章
    renderAchievements() {
        const grid = document.getElementById('ht-achievementsGrid');
        if (!grid) return;

        const achievements = [
            { icon: 'fa-star', name: '初来乍到', desc: '创建第1个习惯', check: () => this.habits.length >= 1 },
            { icon: 'fa-bullseye', name: '习惯达人', desc: '创建5个习惯', check: () => this.habits.length >= 5 },
            { icon: 'fa-trophy', name: '习惯大师', desc: '创建10个习惯', check: () => this.habits.length >= 10 },
            { icon: 'fa-check', name: '首次打卡', desc: '完成1次打卡', check: () => this.habits.some(h => h.checkins?.length > 0) },
            { icon: 'fa-certificate', name: '百日坚持', desc: '累计打卡100次', check: () => this.habits.reduce((sum, h) => sum + (h.checkins?.length || 0), 0) >= 100 },
            { icon: 'fa-fire', name: '七日连击', desc: '连续打卡7天', check: () => this.habits.some(h => this.calculateStreak(h) >= 7) },
            { icon: 'fa-bolt', name: '月度冠军', desc: '连续打卡30天', check: () => this.habits.some(h => this.calculateStreak(h) >= 30) }
        ];

        const fragment = document.createDocumentFragment();
        achievements.forEach(achievement => {
            fragment.appendChild(this.createAchievementBadge(achievement));
        });
        grid.replaceChildren(fragment);
    }

    createAchievementBadge(achievement) {
        const unlocked = achievement.check();

        const badge = document.createElement('div');
        badge.className = `ht-achievement-badge ${unlocked ? 'unlocked' : 'locked'}`;

        const iconWrap = document.createElement('div');
        iconWrap.className = 'ht-achievement-icon';
        const icon = document.createElement('i');
        icon.className = `fas ${achievement.icon}`;
        iconWrap.appendChild(icon);

        const name = document.createElement('div');
        name.className = 'ht-achievement-name';
        name.textContent = achievement.name;

        const desc = document.createElement('div');
        desc.className = 'ht-achievement-desc';
        desc.textContent = achievement.desc;

        badge.append(iconWrap, name, desc);
        return badge;
    }

    // 渲染趋势图表
    renderTrendChart() {
        const canvas = document.getElementById('ht-trendChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const data = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);

            const total = this.habits.length;
            const completed = this.habits.filter(h => h.checkins?.includes(dateStr)).length;
            const rate = total > 0 ? (completed / total) * 100 : 0;

            data.push(rate);
        }

        // 绘制网格线
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 绘制折线
        if (data.length > 1) {
            const stepX = width / (data.length - 1);

            // 绘制渐变填充
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
            gradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, height);
            data.forEach((value, index) => {
                const x = index * stepX;
                const y = height - (value / 100 * height);
                ctx.lineTo(x, y);
            });
            ctx.lineTo(width, height);
            ctx.closePath();
            ctx.fill();

            // 绘制线条
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 3;
            ctx.beginPath();
            data.forEach((value, index) => {
                const x = index * stepX;
                const y = height - (value / 100 * height);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();

            // 绘制数据点
            ctx.fillStyle = '#667eea';
            data.forEach((value, index) => {
                const x = index * stepX;
                const y = height - (value / 100 * height);

                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    // 渲染分类饼图
    renderCategoryChart() {
        const canvas = document.getElementById('ht-categoryChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;

        ctx.clearRect(0, 0, width, height);

        const categoryCounts = {};
        this.habits.forEach(habit => {
            const category = habit.category === 'custom' ? habit.customCategory || '自定义' : this.getCategoryName(habit.category);
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const categories = Object.keys(categoryCounts);
        if (categories.length === 0) {
            ctx.fillStyle = '#718096';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', centerX, centerY);
            return;
        }

        const total = this.habits.length;
        const colors = ['#667eea', '#48bb78', '#f6ad55', '#fc8181', '#9f7aea', '#4299e1'];

        let startAngle = -Math.PI / 2;

        categories.forEach((category, index) => {
            const count = categoryCounts[category];
            const sliceAngle = (count / total) * Math.PI * 2;
            const color = colors[index % colors.length];

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();

            startAngle += sliceAngle;
        });
    }

    // 渲染排行榜
    renderRanking() {
        const list = document.getElementById('ht-rankingList');
        if (!list) return;

        const sortedHabits = [...this.habits].sort((a, b) => {
            const aCount = a.checkins?.length || 0;
            const bCount = b.checkins?.length || 0;
            return bCount - aCount;
        });

        if (sortedHabits.length === 0) {
            list.replaceChildren(this.createEmptyDataMessage('暂无习惯数据'));
            return;
        }

        const fragment = document.createDocumentFragment();
        sortedHabits.slice(0, 10).forEach((habit, index) => {
            fragment.appendChild(this.createRankingItem(habit, index));
        });
        list.replaceChildren(fragment);
    }

    createEmptyDataMessage(message) {
        const text = document.createElement('p');
        text.style.cssText = 'text-align:center;color:#718096;padding:20px;';
        text.textContent = message;
        return text;
    }

    createRankingItem(habit, index) {
        const checkinCount = habit.checkins?.length || 0;
        const streak = this.calculateStreak(habit);
        const rankClass = index === 0 ? 'top1' : index === 1 ? 'top2' : index === 2 ? 'top3' : '';

        const item = document.createElement('div');
        item.className = 'ht-ranking-item';

        const number = document.createElement('div');
        number.className = `ht-ranking-number ${rankClass}`.trim();
        number.textContent = String(index + 1);

        const habitWrap = document.createElement('div');
        habitWrap.className = 'ht-ranking-habit';

        const iconWrap = document.createElement('div');
        iconWrap.className = 'ht-ranking-icon';
        const icon = document.createElement('i');
        icon.className = `fas ${habit.icon || 'fa-running'}`;
        iconWrap.appendChild(icon);

        const info = document.createElement('div');
        info.className = 'ht-ranking-info';

        const name = document.createElement('div');
        name.className = 'ht-ranking-name';
        name.textContent = habit.name || '';

        const meta = document.createElement('div');
        meta.className = 'ht-ranking-meta';
        const fireIcon = document.createElement('i');
        fireIcon.className = 'fas fa-fire';
        meta.append(
            fireIcon,
            document.createTextNode(` 连续 ${streak} 天 | ${this.getCategoryName(habit.category, habit)}`)
        );

        const count = document.createElement('div');
        count.className = 'ht-ranking-count';
        count.textContent = String(checkinCount);

        info.append(name, meta);
        habitWrap.append(iconWrap, info);
        item.append(number, habitWrap, count);

        return item;
    }

    // 渲染数据表格
    renderDataTable() {
        const tableDiv = document.getElementById('ht-dataTable');
        if (!tableDiv) return;

        if (this.habits.length === 0) {
            tableDiv.replaceChildren(this.createEmptyDataMessage('暂无习惯数据'));
            return;
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const table = document.createElement('table');
        table.className = 'ht-data-table';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['习惯', '分类', '总打卡', '本月打卡', '连续天数'].forEach(label => {
            const th = document.createElement('th');
            th.textContent = label;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        const tbody = document.createElement('tbody');
        this.habits.forEach(habit => {
            tbody.appendChild(this.createDataTableRow(habit, year, month, daysInMonth));
        });

        table.append(thead, tbody);
        tableDiv.replaceChildren(table);
    }

    createDataTableRow(habit, year, month, daysInMonth) {
        const totalCheckins = habit.checkins?.length || 0;

        let monthCheckins = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = this.formatDate(new Date(year, month, day));
            if (habit.checkins?.includes(dateStr)) {
                monthCheckins++;
            }
        }

        const streak = this.calculateStreak(habit);
        const row = document.createElement('tr');

        const habitCell = document.createElement('td');
        const habitName = document.createElement('div');
        habitName.className = 'ht-table-habit-name';
        const iconWrap = document.createElement('span');
        iconWrap.className = 'ht-table-habit-icon';
        const icon = document.createElement('i');
        icon.className = `fas ${habit.icon || 'fa-running'}`;
        iconWrap.appendChild(icon);
        habitName.append(iconWrap, document.createTextNode(` ${habit.name || ''}`));
        habitCell.appendChild(habitName);

        const categoryCell = document.createElement('td');
        categoryCell.textContent = this.getCategoryName(habit.category, habit);

        const totalCell = document.createElement('td');
        totalCell.textContent = String(totalCheckins);

        const monthCell = document.createElement('td');
        monthCell.textContent = String(monthCheckins);

        const streakCell = document.createElement('td');
        const fireIcon = document.createElement('i');
        fireIcon.className = 'fas fa-fire';
        streakCell.append(fireIcon, document.createTextNode(` ${streak}天`));

        row.append(habitCell, categoryCell, totalCell, monthCell, streakCell);
        return row;
    }

    // 渲染日历
    renderCalendar() {
        const grid = document.getElementById('ht-calendarGrid');
        if (!grid) return;

        this.updateCalendarHabitFilter();

        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        const monthEl = document.getElementById('ht-currentMonth');
        if (monthEl) monthEl.textContent = `${year}年${month + 1}月`;

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startWeekday = firstDay.getDay();

        const prevMonthDays = startWeekday;
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        grid.replaceChildren();

        for (let i = prevMonthDays - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const dayElement = this.createCalendarDay(day, true, year, month - 1);
            grid.appendChild(dayElement);
        }

        const today = new Date();
        const todayStr = this.formatDate(today);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const isToday = dateStr === todayStr;
            const dayElement = this.createCalendarDay(day, false, year, month, isToday, dateStr);
            grid.appendChild(dayElement);
        }

        const totalCells = grid.children.length;
        const remainingCells = 42 - totalCells;

        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createCalendarDay(day, true, year, month + 1);
            grid.appendChild(dayElement);
        }

        this.updateCalendarStats();
    }

    // 创建日历日期元素
    createCalendarDay(day, isOtherMonth, year, month, isToday = false, dateStr = null) {
        const dayElement = document.createElement('div');
        dayElement.className = 'ht-calendar-day';

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        if (!isOtherMonth && dateStr) {
            const checkinCount = this.getDateCheckinCount(dateStr);
            const totalHabits = this.calendarHabitFilter === 'all'
                ? this.habits.length
                : this.habits.filter(h => h.id === this.calendarHabitFilter).length;

            if (checkinCount > 0) {
                if (checkinCount === totalHabits && totalHabits > 0) {
                    dayElement.classList.add('has-checkin');
                } else {
                    dayElement.classList.add('partial-checkin');
                }

                dayElement.append(
                    this.createCalendarDayText('ht-day-number', String(day)),
                    this.createCalendarDayText('ht-day-checkins', `${checkinCount}/${totalHabits}`)
                );
            } else {
                dayElement.appendChild(this.createCalendarDayText('ht-day-number', String(day)));
            }
        } else {
            dayElement.appendChild(this.createCalendarDayText('ht-day-number', String(day)));
        }

        return dayElement;
    }

    createCalendarDayText(className, text) {
        const element = document.createElement('span');
        element.className = className;
        element.textContent = text;
        return element;
    }

    // 获取指定日期的打卡数
    getDateCheckinCount(dateStr) {
        const habits = this.calendarHabitFilter === 'all'
            ? this.habits
            : this.habits.filter(h => h.id === this.calendarHabitFilter);

        return habits.filter(habit => habit.checkins?.includes(dateStr)).length;
    }

    // 更新日历习惯筛选器
    updateCalendarHabitFilter() {
        const select = document.getElementById('ht-calendarHabitFilter');
        if (!select) return;

        const currentValue = select.value;
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '所有习惯';
        select.replaceChildren(allOption);

        this.habits.forEach(habit => {
            const option = document.createElement('option');
            option.value = habit.id;
            option.textContent = `${habit.name}`;
            select.appendChild(option);
        });

        select.value = currentValue;
    }

    // 更新日历统计
    updateCalendarStats() {
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const habits = this.calendarHabitFilter === 'all'
            ? this.habits
            : this.habits.filter(h => h.id === this.calendarHabitFilter);

        let totalCheckins = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = this.formatDate(new Date(year, month, day));
            totalCheckins += this.getDateCheckinCount(dateStr);
        }

        const totalPossible = habits.length * daysInMonth;
        const rate = totalPossible > 0 ? Math.round((totalCheckins / totalPossible) * 100) : 0;

        let currentStreak = 0;
        if (this.calendarHabitFilter === 'all') {
            currentStreak = Math.max(...this.habits.map(h => this.calculateStreak(h)), 0);
        } else {
            const habit = this.habits.find(h => h.id === this.calendarHabitFilter);
            currentStreak = habit ? this.calculateStreak(habit) : 0;
        }

        const monthCheckinsEl = document.getElementById('ht-monthCheckins');
        const monthRateEl = document.getElementById('ht-monthRate');
        const currentStreakEl = document.getElementById('ht-currentStreak');

        if (monthCheckinsEl) monthCheckinsEl.textContent = totalCheckins;
        if (monthRateEl) monthRateEl.textContent = rate + '%';
        if (currentStreakEl) currentStreakEl.textContent = currentStreak + '天';
    }

    // 导出数据
    exportData() {
        const data = JSON.stringify(this.habits, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `习惯打卡-${this.getToday()}.json`;
        a.click();
        this.showNotification('导出成功', 'success');
    }

    // 导入数据
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.habits = data;
                this.saveData();
                this.updateUI();
                this.showNotification('导入成功', 'success');
            } catch (err) {
                this.showNotification('导入失败', 'error');
            }
        };
        reader.readAsText(file);
    }

    // 清空数据
    clearData() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            this.habits = [];
            this.saveData();
            this.updateUI();
            this.showNotification('数据已清空', 'info');
        }
    }

    // 通知
    showNotification(message, type = 'info') {
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            info: '#4299e1'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${colors[type]};
            color: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;

        const icon = document.createElement('i');
        icon.className = `fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`;
        notification.append(icon, document.createTextNode(` ${message}`));

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 工具函数
    getToday() {
        return this.formatDate(new Date());
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    getCategoryName(category, habit = null) {
        const names = {
            health: '健康',
            study: '学习',
            work: '工作',
            life: '生活',
            custom: habit?.customCategory || '自定义'
        };
        return names[category] || category;
    }

    getCategoryIcon(category) {
        const icons = {
            health: 'fas fa-heart',
            study: 'fas fa-book',
            work: 'fas fa-briefcase',
            life: 'fas fa-home',
            custom: 'fas fa-tag'
        };
        return icons[category] || 'fas fa-tag';
    }

    loadData() {
        try {
            return JSON.parse(localStorage.getItem('habitTrackerData')) || [];
        } catch {
            return [];
        }
    }

    saveData() {
        localStorage.setItem('habitTrackerData', JSON.stringify(this.habits));
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('habitTrackerSettings'));
            return settings || {
                theme: 'purple',
                animation: true
            };
        } catch {
            return {
                theme: 'purple',
                animation: true
            };
        }
    }

    saveSettings() {
        localStorage.setItem('habitTrackerSettings', JSON.stringify(this.settings));
    }

    updateSettingsPage() {
        const themeColors = document.getElementById('ht-themeColors');
        if (themeColors) {
            themeColors.querySelectorAll('.ht-theme-color').forEach(color => {
                color.classList.toggle('active', color.dataset.theme === this.settings.theme);
            });
        }

        const animationToggle = document.getElementById('ht-animationToggle');
        if (animationToggle) {
            animationToggle.checked = this.settings.animation;
        }
    }

    changeTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
        this.applyTheme(theme);

        const themeColors = document.getElementById('ht-themeColors');
        if (themeColors) {
            themeColors.querySelectorAll('.ht-theme-color').forEach(color => {
                color.classList.toggle('active', color.dataset.theme === theme);
            });
        }
    }

    applyTheme(theme) {
        const themes = {
            purple: { primary: '#667eea', secondary: '#764ba2' },
            blue: { primary: '#4299e1', secondary: '#2b6cb0' },
            green: { primary: '#48bb78', secondary: '#38a169' },
            orange: { primary: '#f6ad55', secondary: '#ed8936' },
            pink: { primary: '#fc8181', secondary: '#f56565' }
        };

        const colors = themes[theme] || themes.purple;
        document.documentElement.style.setProperty('--ht-primary', colors.primary);
        document.documentElement.style.setProperty('--ht-secondary', colors.secondary);
    }
}

// 全局实例
let habitTrackerApp;

// 初始化
function initHabitTrackerApp() {
    if (!habitTrackerApp) {
        habitTrackerApp = new HabitTrackerApp();
    }
    return habitTrackerApp;
}
