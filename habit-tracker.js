// 习惯打卡系统 - 全新设计
class HabitTracker {
    constructor() {
        this.habits = this.loadData() || [];
        this.selectedIcon = '🏃';
        this.editingId = null;
        this.currentFilter = 'all';
        this.calendarDate = new Date();
        this.calendarHabitFilter = 'all';
        this.settings = this.loadSettings();
        this.applyTheme(this.settings.theme);
        this.init();
    }

    init() {
        this.updateUI();
        this.bindEvents();
        this.updateDate();
    }

    // 绑定事件
    bindEvents() {
        // 导航按钮
        document.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showPage(e.target.dataset.page);
            });
        });

        // 返回按钮
        document.querySelectorAll('[data-back]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showPage('main');
            });
        });

        // 添加习惯
        document.getElementById('addHabitBtn').addEventListener('click', () => {
            this.openModal();
        });

        // 筛选按钮
        const filterBtn = document.getElementById('filterBtn');
        const filterMenu = document.getElementById('filterMenu');
        
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterMenu.classList.toggle('show');
        });

        // 筛选选项
        document.querySelectorAll('.filter-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.currentFilter = filter;
                
                // 更新选中状态
                document.querySelectorAll('.filter-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // 关闭菜单
                filterMenu.classList.remove('show');
                
                // 更新显示
                this.renderHabits();
            });
        });

        // 点击外部关闭筛选菜单
        document.addEventListener('click', (e) => {
            const actionButton = e.target.closest('[data-habit-action]');
            if (actionButton) {
                const habitId = actionButton.dataset.habitId;
                if (actionButton.dataset.habitAction === 'toggle') {
                    this.toggleCheck(habitId);
                    return;
                }
                if (actionButton.dataset.habitAction === 'edit') {
                    this.editHabit(habitId);
                    return;
                }
                if (actionButton.dataset.habitAction === 'delete') {
                    this.deleteHabit(habitId);
                    return;
                }
            }

            if (!e.target.closest('.filter-dropdown')) {
                filterMenu.classList.remove('show');
            }
        });

        // 模态框
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveHabit();
        });

        // 图标选择
        document.querySelectorAll('.icon-option').forEach(icon => {
            icon.addEventListener('click', (e) => {
                document.querySelectorAll('.icon-option').forEach(i => i.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedIcon = e.target.dataset.icon;
            });
        });

        // 分类选择器监听
        const categorySelect = document.getElementById('habitCategory');
        const customCategoryGroup = document.getElementById('customCategoryGroup');
        
        categorySelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customCategoryGroup.style.display = 'block';
            } else {
                customCategoryGroup.style.display = 'none';
            }
        });

        // 模态框背景点击关闭
        document.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeModal();
        });

        // 导出/导入
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('importBtn')?.addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile')?.addEventListener('change', (e) => this.importData(e));
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearData());

        // 日历导航
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.calendarDate.setMonth(this.calendarDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.calendarDate.setMonth(this.calendarDate.getMonth() + 1);
            this.renderCalendar();
        });

        // 日历习惯筛选
        document.getElementById('calendarHabitFilter')?.addEventListener('change', (e) => {
            this.calendarHabitFilter = e.target.value;
            this.renderCalendar();
        });

        // 设置页面事件
        this.bindSettingsEvents();
    }

    // 绑定设置事件
    bindSettingsEvents() {
        // 主题切换
        document.querySelectorAll('.theme-color').forEach(color => {
            color.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.changeTheme(theme);
            });
        });

        // 动画开关
        document.getElementById('animationToggle')?.addEventListener('change', (e) => {
            this.settings.animation = e.target.checked;
            this.saveSettings();
            document.body.classList.toggle('no-animation', !e.target.checked);
        });

        // 紧凑布局
        document.getElementById('compactToggle')?.addEventListener('change', (e) => {
            this.settings.compact = e.target.checked;
            this.saveSettings();
            document.body.classList.toggle('compact-mode', e.target.checked);
        });

        // 提醒开关
        document.getElementById('reminderToggle')?.addEventListener('change', (e) => {
            this.settings.reminder = e.target.checked;
            this.saveSettings();
            document.getElementById('reminderTimeItem').style.display = e.target.checked ? 'flex' : 'none';
        });

        // 提醒时间
        document.getElementById('reminderTime')?.addEventListener('change', (e) => {
            this.settings.reminderTime = e.target.value;
            this.saveSettings();
        });

        // 备份按钮
        document.getElementById('backupBtn')?.addEventListener('click', () => this.createBackup());
    }

    // 显示页面
    showPage(page) {
        document.querySelector('.main-page').style.display = page === 'main' ? 'block' : 'none';
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        if (page !== 'main') {
            document.getElementById(page + 'Page')?.classList.add('active');
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
        const list = document.getElementById('habitsList');
        const empty = document.getElementById('emptyState');
        
        const filteredHabits = this.currentFilter === 'all' 
            ? this.habits 
            : this.habits.filter(h => h.category === this.currentFilter);
        
        list.replaceChildren();

        if (filteredHabits.length === 0) {
            empty.classList.add('show');
            if (this.currentFilter !== 'all') {
                empty.querySelector('.empty-title').textContent = '\u6B64\u5206\u7C7B\u6682\u65E0\u4E60\u60EF';
            } else {
                empty.querySelector('.empty-title').textContent = '\u8FD8\u6CA1\u6709\u4E60\u60EF';
            }
            return;
        }

        empty.classList.remove('show');
        
        const today = this.getToday();
        filteredHabits.forEach(habit => {
            list.appendChild(this.createHabitCard(habit, today));
        });
    }

    createHabitCard(habit, today) {
        const isChecked = habit.checkins?.includes(today);
        const streak = this.calculateStreak(habit);

        const card = document.createElement('div');
        card.className = `habit-card ${isChecked ? 'completed' : ''}`.trim();
        card.dataset.id = habit.id;

        const main = document.createElement('div');
        main.className = 'habit-main';

        const icon = document.createElement('div');
        icon.className = 'habit-icon-box';
        icon.textContent = habit.icon || '';

        const content = document.createElement('div');
        content.className = 'habit-content';

        const name = document.createElement('div');
        name.className = 'habit-name';
        name.textContent = habit.name || '';

        const meta = document.createElement('div');
        meta.className = 'habit-meta';

        const category = document.createElement('span');
        category.className = `habit-category ${habit.category || ''}`.trim();
        category.textContent = this.getCategoryName(habit.category, habit);

        const streakText = document.createElement('span');
        streakText.className = 'habit-streak';
        streakText.textContent = `\uD83D\uDD25 ${streak}\u5929`;

        meta.append(category, streakText);
        content.append(name, meta);

        const actions = document.createElement('div');
        actions.className = 'habit-actions';

        const checkButton = document.createElement('button');
        checkButton.className = `check-btn ${isChecked ? 'checked' : ''}`.trim();
        checkButton.dataset.habitAction = 'toggle';
        checkButton.dataset.habitId = habit.id;
        checkButton.textContent = isChecked ? '\u2713 \u5DF2\u6253\u5361' : '\u25CB \u6253\u5361';

        const editButton = document.createElement('button');
        editButton.className = 'icon-btn';
        editButton.dataset.habitAction = 'edit';
        editButton.dataset.habitId = habit.id;
        editButton.title = '\u7F16\u8F91';
        editButton.textContent = '\u270F\uFE0F';

        const deleteButton = document.createElement('button');
        deleteButton.className = 'icon-btn';
        deleteButton.dataset.habitAction = 'delete';
        deleteButton.dataset.habitId = habit.id;
        deleteButton.title = '\u5220\u9664';
        deleteButton.textContent = '\uD83D\uDDD1\uFE0F';

        actions.append(checkButton, editButton, deleteButton);
        main.append(icon, content, actions);
        card.appendChild(main);
        return card;
    }

    updateProgress() {
        const today = this.getToday();
        const total = this.habits.length;
        const completed = this.habits.filter(h => h.checkins?.includes(today)).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        document.getElementById('completedCount').textContent = completed;
        document.getElementById('totalCount').textContent = total;
        document.getElementById('progressFill').style.width = percent + '%';
        document.getElementById('progressPercent').textContent = percent + '%';
    }

    // 更新日期
    updateDate() {
        const now = new Date();
        const days = ['日', '一', '二', '三', '四', '五', '六'];
        const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;
        document.getElementById('todayDate').textContent = dateStr;
    }

    // 打开模态框
    openModal(habitId = null) {
        this.editingId = habitId;
        const modal = document.getElementById('habitModal');
        const title = document.getElementById('modalTitle');
        const customCategoryGroup = document.getElementById('customCategoryGroup');
        
        if (habitId) {
            const habit = this.habits.find(h => h.id === habitId);
            title.textContent = '编辑习惯';
            document.getElementById('habitName').value = habit.name;
            document.getElementById('habitCategory').value = habit.category;
            document.getElementById('habitNote').value = habit.note || '';
            this.selectedIcon = habit.icon;
            
            // 处理自定义分类显示
            if (habit.category === 'custom' && habit.customCategory) {
                customCategoryGroup.style.display = 'block';
                document.getElementById('customCategoryName').value = habit.customCategory;
            } else {
                customCategoryGroup.style.display = 'none';
            }
            
            document.querySelectorAll('.icon-option').forEach(icon => {
                icon.classList.toggle('selected', icon.dataset.icon === habit.icon);
            });
        } else {
            title.textContent = '添加习惯';
            document.getElementById('habitName').value = '';
            document.getElementById('habitCategory').value = 'health';
            document.getElementById('habitNote').value = '';
            document.getElementById('customCategoryName').value = '';
            customCategoryGroup.style.display = 'none';
            this.selectedIcon = '🏃';
            
            document.querySelectorAll('.icon-option').forEach((icon, i) => {
                icon.classList.toggle('selected', i === 0);
            });
        }
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 关闭模态框
    closeModal() {
        document.getElementById('habitModal').classList.remove('show');
        document.body.style.overflow = '';
        this.editingId = null;
    }

    // 保存习惯
    saveHabit() {
        const name = document.getElementById('habitName').value.trim();
        const category = document.getElementById('habitCategory').value;
        const note = document.getElementById('habitNote').value.trim();
        const customCategoryName = document.getElementById('customCategoryName').value.trim();

        if (!name) {
            alert('请输入习惯名称');
            return;
        }

        // 如果选择了自定义分类，必须输入自定义分类名称
        if (category === 'custom' && !customCategoryName) {
            alert('请输入自定义分类名称');
            return;
        }

        const habitData = {
            name,
            icon: this.selectedIcon,
            category,
            note,
            checkins: []
        };

        // 如果是自定义分类，保存自定义分类名称
        if (category === 'custom') {
            habitData.customCategory = customCategoryName;
        }

        if (this.editingId) {
            const index = this.habits.findIndex(h => h.id === this.editingId);
            this.habits[index] = { ...this.habits[index], ...habitData };
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

        document.getElementById('totalHabits').textContent = totalHabits;
        document.getElementById('totalCheckins').textContent = totalCheckins;
        document.getElementById('longestStreak').textContent = longestStreak + '天';
        document.getElementById('completionRate').textContent = monthRate + '%';

        // 渲染各个组件
        this.renderAchievements();
        this.renderTrendChart();
        this.renderCategoryChart();
        this.renderRanking();
        this.renderDataTable();
    }

    // 渲染成就徽章
    renderAchievements() {
        const grid = document.getElementById('achievementsGrid');
        if (!grid) return;

        const achievements = [
            { icon: '🌟', name: '初来乍到', desc: '创建第1个习惯', check: () => this.habits.length >= 1 },
            { icon: '🎯', name: '习惯达人', desc: '创建5个习惯', check: () => this.habits.length >= 5 },
            { icon: '🏆', name: '习惯大师', desc: '创建10个习惯', check: () => this.habits.length >= 10 },
            { icon: '✅', name: '首次打卡', desc: '完成1次打卡', check: () => this.habits.some(h => h.checkins?.length > 0) },
            { icon: '💯', name: '百日坚持', desc: '累计打卡100次', check: () => this.habits.reduce((sum, h) => sum + (h.checkins?.length || 0), 0) >= 100 },
            { icon: '🔥', name: '七日连击', desc: '连续打卡7天', check: () => this.habits.some(h => this.calculateStreak(h) >= 7) },
            { icon: '⚡', name: '月度冠军', desc: '连续打卡30天', check: () => this.habits.some(h => this.calculateStreak(h) >= 30) },
            { icon: '👑', name: '完美主义', desc: '本月完成率100%', check: () => {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                const dayOfMonth = today.getDate();
                let totalChecks = 0;
                for (let day = 1; day <= dayOfMonth; day++) {
                    const dateStr = this.formatDate(new Date(year, month, day));
                    const dayChecks = this.habits.filter(h => h.checkins?.includes(dateStr)).length;
                    totalChecks += dayChecks;
                }
                return this.habits.length > 0 && totalChecks === this.habits.length * dayOfMonth;
            }}
        ];

        grid.replaceChildren(...achievements.map(ach => this.createAchievementBadge(ach)));
    }

    createAchievementBadge(achievement) {
        const badge = document.createElement('div');
        badge.className = `achievement-badge ${achievement.check() ? 'unlocked' : 'locked'}`;

        const icon = document.createElement('div');
        icon.className = 'achievement-icon';
        icon.textContent = achievement.icon || '';

        const name = document.createElement('div');
        name.className = 'achievement-name';
        name.textContent = achievement.name || '';

        const desc = document.createElement('div');
        desc.className = 'achievement-desc';
        desc.textContent = achievement.desc || '';

        badge.append(icon, name, desc);
        return badge;
    }

    // 渲染趋势图表（最近30天）
    renderTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // 获取最近30天数据
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

    // 渲染分类饥图
    renderCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;

        ctx.clearRect(0, 0, width, height);

        // 统计各分类习惯数量
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

            // 绘制馅块
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            // 绘制边框
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 绘制标签
            const labelAngle = startAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const percentage = Math.round((count / total) * 100);
            ctx.fillText(`${percentage}%`, labelX, labelY);

            startAngle += sliceAngle;
        });

        // 绘制图例
        const legendX = 20;
        let legendY = height - (categories.length * 25) - 10;

        categories.forEach((category, index) => {
            const color = colors[index % colors.length];
            const count = categoryCounts[category];

            // 颜色块
            ctx.fillStyle = color;
            ctx.fillRect(legendX, legendY, 15, 15);

            // 文字
            ctx.fillStyle = '#2d3748';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${category} (${count})`, legendX + 20, legendY + 12);

            legendY += 25;
        });
    }

    // 渲染排行榜
    renderRanking() {
        const list = document.getElementById('rankingList');
        if (!list) return;

        const sortedHabits = [...this.habits].sort((a, b) => {
            const aCount = a.checkins?.length || 0;
            const bCount = b.checkins?.length || 0;
            return bCount - aCount;
        });

        list.replaceChildren();

        if (sortedHabits.length === 0) {
            list.appendChild(this.createEmptyDataMessage());
            return;
        }

        sortedHabits.slice(0, 10).forEach((habit, index) => {
            const checkinCount = habit.checkins?.length || 0;
            const streak = this.calculateStreak(habit);
            const rankClass = index === 0 ? 'top1' : index === 1 ? 'top2' : index === 2 ? 'top3' : '';
            list.appendChild(this.createRankingItem(habit, index, rankClass, streak, checkinCount));
        });
    }

    createEmptyDataMessage() {
        const message = document.createElement('p');
        message.style.cssText = 'text-align:center;color:#718096;padding:20px;';
        message.textContent = '\u6682\u65E0\u4E60\u60EF\u6570\u636E';
        return message;
    }

    createRankingItem(habit, index, rankClass, streak, checkinCount) {
        const item = document.createElement('div');
        item.className = 'ranking-item';

        const number = document.createElement('div');
        number.className = `ranking-number ${rankClass}`.trim();
        number.textContent = String(index + 1);

        const habitWrap = document.createElement('div');
        habitWrap.className = 'ranking-habit';

        const icon = document.createElement('div');
        icon.className = 'ranking-icon';
        icon.textContent = habit.icon || '';

        const info = document.createElement('div');
        info.className = 'ranking-info';

        const name = document.createElement('div');
        name.className = 'ranking-name';
        name.textContent = habit.name || '';

        const meta = document.createElement('div');
        meta.className = 'ranking-meta';
        meta.textContent = `\uD83D\uDD25 \u8FDE\u7EED ${streak} \u5929 | ${this.getCategoryName(habit.category, habit)}`;

        info.append(name, meta);
        habitWrap.append(icon, info);

        const count = document.createElement('div');
        count.className = 'ranking-count';
        count.textContent = String(checkinCount);

        item.append(number, habitWrap, count);
        return item;
    }

    renderDataTable() {
        const tableDiv = document.getElementById('dataTable');
        if (!tableDiv) return;

        if (this.habits.length === 0) {
            const empty = document.createElement('p');
            empty.style.textAlign = 'center';
            empty.style.color = '#718096';
            empty.style.padding = '20px';
            empty.textContent = '\u6682\u65e0\u4e60\u60ef\u6570\u636e';
            tableDiv.replaceChildren(empty);
            return;
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['\u4e60\u60ef', '\u5206\u7c7b', '\u603b\u6253\u5361', '\u672c\u6708\u6253\u5361', '\u672c\u6708\u5b8c\u6210\u7387', '\u8fde\u7eed\u5929\u6570', '\u5b8c\u6210\u8fdb\u5ea6'].forEach(label => {
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
        const row = document.createElement('tr');
        const totalCheckins = habit.checkins?.length || 0;
        let monthCheckins = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = this.formatDate(new Date(year, month, day));
            if (habit.checkins?.includes(dateStr)) {
                monthCheckins++;
            }
        }

        const monthRate = Math.round((monthCheckins / daysInMonth) * 100);
        const streak = this.calculateStreak(habit);

        const nameCell = document.createElement('td');
        const nameWrap = document.createElement('div');
        nameWrap.className = 'table-habit-name';
        const icon = document.createElement('span');
        icon.className = 'table-habit-icon';
        icon.textContent = habit.icon || '';
        const name = document.createElement('span');
        name.textContent = habit.name || '';
        nameWrap.append(icon, name);
        nameCell.appendChild(nameWrap);

        row.append(
            nameCell,
            this.createTableCell(this.getCategoryName(habit.category, habit)),
            this.createTableCell(String(totalCheckins)),
            this.createTableCell(String(monthCheckins)),
            this.createTableCell(`${monthRate}%`),
            this.createTableCell(`\uD83D\uDD25 ${streak}\u5929`),
            this.createProgressCell(monthRate)
        );

        return row;
    }

    createTableCell(value) {
        const cell = document.createElement('td');
        cell.textContent = value;
        return cell;
    }

    createProgressCell(monthRate) {
        const cell = document.createElement('td');
        const bar = document.createElement('div');
        bar.className = 'table-progress-bar';
        const fill = document.createElement('div');
        fill.className = 'table-progress-fill';
        fill.style.width = `${Math.max(0, Math.min(100, monthRate))}%`;
        bar.appendChild(fill);
        cell.appendChild(bar);
        return cell;
    }

    // 渲染日历
    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        // 更新习惯选择器
        this.updateCalendarHabitFilter();

        // 更新月份标题
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;

        // 获取当月第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startWeekday = firstDay.getDay();

        // 计算需要显示的上月天数
        const prevMonthDays = startWeekday;
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        // 清空日历
        grid.replaceChildren();

        // 添加上月天数
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const dayElement = this.createCalendarDay(day, true, year, month - 1);
            grid.appendChild(dayElement);
        }

        // 添加本月天数
        const today = new Date();
        const todayStr = this.formatDate(today);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = this.formatDate(date);
            const isToday = dateStr === todayStr;
            const dayElement = this.createCalendarDay(day, false, year, month, isToday, dateStr);
            grid.appendChild(dayElement);
        }

        // 添加下月天数（填满网格）
        const totalCells = grid.children.length;
        const remainingCells = 42 - totalCells; // 6周 * 7天

        for (let day = 1; day <= remainingCells; day++) {
            const dayElement = this.createCalendarDay(day, true, year, month + 1);
            grid.appendChild(dayElement);
        }

        // 更新统计信息
        this.updateCalendarStats();
    }

    // 创建日历日期元素
    createCalendarDay(day, isOtherMonth, year, month, isToday = false, dateStr = null) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        if (isToday) {
            dayElement.classList.add('today');
        }

        // 计算当天的打卡数
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
                    this.createCalendarDayText('day-number', day),
                    this.createCalendarDayText('day-checkins', `${checkinCount}/${totalHabits}`)
                );
            } else {
                dayElement.appendChild(this.createCalendarDayText('day-number', day));
            }

            // 添加点击事件
            dayElement.addEventListener('click', () => {
                this.showDayDetail(dateStr);
            });
        } else {
            dayElement.appendChild(this.createCalendarDayText('day-number', day));
        }

        return dayElement;
    }

    // 获取指定日期的打卡数
    createCalendarDayText(className, value) {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = String(value);
        return span;
    }

    getDateCheckinCount(dateStr) {
        const habits = this.calendarHabitFilter === 'all' 
            ? this.habits 
            : this.habits.filter(h => h.id === this.calendarHabitFilter);

        return habits.filter(habit => habit.checkins?.includes(dateStr)).length;
    }

    // 显示日期详情
    showDayDetail(dateStr) {
        const habits = this.calendarHabitFilter === 'all' 
            ? this.habits 
            : this.habits.filter(h => h.id === this.calendarHabitFilter);

        const checkedHabits = habits.filter(h => h.checkins?.includes(dateStr));

        if (checkedHabits.length === 0) {
            this.showNotification(`${dateStr} 暂无打卡记录`, 'info');
            return;
        }

        const habitList = checkedHabits.map(h => `${h.icon} ${h.name}`).join('\n');
        alert(`${dateStr} 打卡记录：\n\n${habitList}`);
    }

    // 更新日历习惯筛选器
    updateCalendarHabitFilter() {
        const select = document.getElementById('calendarHabitFilter');
        if (!select) return;

        const currentValue = select.value;
        select.replaceChildren();
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '所有习惯';
        select.appendChild(allOption);

        this.habits.forEach(habit => {
            const option = document.createElement('option');
            option.value = habit.id;
            option.textContent = `${habit.icon} ${habit.name}`;
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

        // 计算当前连续打卡
        let currentStreak = 0;
        if (this.calendarHabitFilter === 'all') {
            // 所有习惯的最大连续天数
            currentStreak = Math.max(...this.habits.map(h => this.calculateStreak(h)), 0);
        } else {
            const habit = this.habits.find(h => h.id === this.calendarHabitFilter);
            currentStreak = habit ? this.calculateStreak(habit) : 0;
        }

        document.getElementById('monthCheckins').textContent = totalCheckins;
        document.getElementById('monthRate').textContent = rate + '%';
        document.getElementById('currentStreak').textContent = currentStreak + '天';
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
        notification.textContent = message;
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

    loadData() {
        try {
            return JSON.parse(localStorage.getItem('habitTracker')) || [];
        } catch {
            return [];
        }
    }

    saveData() {
        localStorage.setItem('habitTracker', JSON.stringify(this.habits));
    }

    // 设置管理
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('habitTrackerSettings'));
            return settings || {
                theme: 'purple',
                animation: true,
                compact: false,
                reminder: false,
                reminderTime: '20:00',
                firstUseDate: new Date().toISOString()
            };
        } catch {
            return {
                theme: 'purple',
                animation: true,
                compact: false,
                reminder: false,
                reminderTime: '20:00',
                firstUseDate: new Date().toISOString()
            };
        }
    }

    saveSettings() {
        localStorage.setItem('habitTrackerSettings', JSON.stringify(this.settings));
    }

    // 更新设置页面
    updateSettingsPage() {
        // 更新主题选择
        document.querySelectorAll('.theme-color').forEach(color => {
            color.classList.toggle('active', color.dataset.theme === this.settings.theme);
        });

        // 更新开关状态
        document.getElementById('animationToggle').checked = this.settings.animation;
        document.getElementById('compactToggle').checked = this.settings.compact;
        document.getElementById('reminderToggle').checked = this.settings.reminder;
        document.getElementById('reminderTime').value = this.settings.reminderTime;

        // 显示/隐藏提醒时间
        document.getElementById('reminderTimeItem').style.display = this.settings.reminder ? 'flex' : 'none';

        // 更新关于信息
        document.getElementById('aboutTotalHabits').textContent = this.habits.length;
        document.getElementById('aboutTotalCheckins').textContent = 
            this.habits.reduce((sum, h) => sum + (h.checkins?.length || 0), 0);

        // 计算使用天数
        const firstUse = new Date(this.settings.firstUseDate);
        const today = new Date();
        const daysDiff = Math.floor((today - firstUse) / (1000 * 60 * 60 * 24));
        document.getElementById('aboutUsageDays').textContent = daysDiff + '天';
    }

    // 主题切换
    changeTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
        this.applyTheme(theme);
        
        // 更新选中状态
        document.querySelectorAll('.theme-color').forEach(color => {
            color.classList.toggle('active', color.dataset.theme === theme);
        });
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
        document.documentElement.style.setProperty('--theme-primary', colors.primary);
        document.documentElement.style.setProperty('--theme-secondary', colors.secondary);
    }

    // 创建备份
    createBackup() {
        const backup = {
            habits: this.habits,
            settings: this.settings,
            backupDate: new Date().toISOString(),
            version: '2.0.0'
        };

        const data = JSON.stringify(backup, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `习惯打卡备份-${this.getToday()}.json`;
        a.click();
        this.showNotification('备份创建成功', 'success');
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// 初始化
const tracker = new HabitTracker();

// 快速返回到更多功能页面（优化版）
function fastBackToMoreFeatures() {
    // 使用 sessionStorage 缓存当前页面状态
    try {
        // 保存返回时间戳，用于检测是否可以使用后退
        sessionStorage.setItem('habit_tracker_return', Date.now());
        
        // 优先使用浏览器后退（最快）
        if (document.referrer && document.referrer.includes('index.html')) {
            console.log('使用浏览器后退返回');
            window.history.back();
            return;
        }
        
        // 使用 replace 而不是 href，避免在历史记录中添加新条目
        console.log('使用快速跳转返回');
        window.location.replace('index.html#more-features');
    } catch (error) {
        // 降级方案
        console.warn('快速返回失败，使用标准方式:', error);
        window.location.href = 'index.html#more-features';
    }
}
