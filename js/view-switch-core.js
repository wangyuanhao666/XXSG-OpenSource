// Main SPA view switching.
// Extracted from script.js; mutable app state is accessed through window.XXSGAppRuntime.

function getSwitchTasks() {
    return window.XXSGAppRuntime?.tasks || [];
}

function switchView(view) {
    // 使用缓存的DOM元素
    const views = getCachedViews();
    const tabButtons = getCachedTabButtons();
    const taskActions = document.getElementById('task-actions');
    const moreFeaturesTabBtn = document.getElementById('more-features-tab-btn');

    // 更新当前视图状态
    window.XXSGAppRuntime.currentView = view;

    // 隐藏所有视图（使用缓存）
    const viewValues = Object.values(views);
    for (const v of viewValues) {
        if (v) v.style.display = 'none';
    }

    // 移除所有标签的激活状态
    tabButtons.forEach(btn => btn.classList.remove('active'));

    // 切换视图显示
    if (view === 'list') {
        if (views.listView) views.listView.style.display = 'block';
        if (tabButtons[0]) tabButtons[0].classList.add('active');

        if (getSwitchTasks().length > 0 && taskActions) {
            taskActions.style.display = 'flex';
        }
    } else if (view === 'quadrant') {
        if (views.quadrantView) views.quadrantView.style.display = 'grid';
        if (tabButtons[1]) tabButtons[1].classList.add('active');

        if (taskActions) {
            taskActions.style.display = 'none';
        }

        // 如果有展开的象限，恢复到正常状态
        if (window.XXSGAppRuntime.expandedQuadrant) {
            const expandedEl = document.getElementById(window.XXSGAppRuntime.expandedQuadrant);
            if (expandedEl) {
                document.getElementById('quadrant-view')?.classList.remove('fullscreen-mode');
                expandedEl.classList.remove('expanded');
                const expandBtn = expandedEl.querySelector('.expand-btn .material-icons');
                if (expandBtn) {
                    expandBtn.textContent = 'fullscreen';
                }
                window.XXSGAppRuntime.expandedQuadrant = null;

                document.querySelectorAll('.quadrant').forEach(q => {
                    q.style.display = 'flex';
                });
            }
        }

        // 重新初始化四象限拖拽功能
        setTimeout(() => {
            initSortable();
        }, 100);
    } else if (view === 'fortune') {
        if (views.fortuneView) views.fortuneView.style.display = 'block';
        if (tabButtons[5]) tabButtons[5].classList.add('active'); // fortune是索引5

        if (taskActions) {
            taskActions.style.display = 'none';
        }
        ensureFortuneSystem();
    } else if (view === 'dashboard') {
        if (views.dashboardView) views.dashboardView.style.display = 'block';
        if (tabButtons[2]) tabButtons[2].classList.add('active'); // 可视化看板标签

        if (taskActions) {
            taskActions.style.display = 'none';
        }

        // 初始化或更新图表
        ensureChartJsLoaded(() => {
            ensureVisualizationChartsLoaded(() => initDashboardCharts());
        });

        // 绑定统计卡片的点击事件
        bindDashboardCardEvents();

        // 加载工作习惯分析
        loadBehaviorAnalysis();

        // 加载智能提醒系统
        loadSmartReminderSystem();

        // 加载智能日程规划
        loadSmartScheduleSystem();

        // 加载智能健康管理
        loadSmartHealthSystem();
    } else if (view === 'review') {
        if (views.reviewView) views.reviewView.style.display = 'block';
        if (tabButtons[3]) tabButtons[3].classList.add('active'); // 🔧 修复：review应该是索引3

        if (taskActions) {
            taskActions.style.display = 'none';
        }

        // 初始化复盘系统（如果还未初始化）
        if (!window.XXSGAppRuntime.reviewSystem && views.reviewView) {
            window.XXSGAppRuntime.reviewSystem = new ReviewSystem();
        }

        // 更新复盘系统语言
        if (window.XXSGAppRuntime.reviewSystem) {
            window.XXSGAppRuntime.reviewSystem.updateLanguage();
        }
    } else if (view === 'templates') {
        if (views.templatesView) views.templatesView.style.display = 'block';
        if (tabButtons[4]) tabButtons[4].classList.add('active'); // 🔧 修复：templates应该是索引4

        if (taskActions) {
            taskActions.style.display = 'none';
        }

        // 初始化模板系统
        initTemplateSystem();
    } else if (view === 'backup') {
        // 备份功能通过模态框实现，不是独立视图
        console.log('打开备份功能模态框');
        // 这里可以触发备份相关的模态框或功能
        // 暂时显示列表视图作为默认行为
        if (views.listView) views.listView.style.display = 'block';
        if (tabButtons[0]) tabButtons[0].classList.add('active');

        if (taskActions) {
            taskActions.style.display = 'flex';
        }

        // 触发备份功能
        const backupBtn = document.getElementById('backup-tasks-btn');
        if (backupBtn) {
            backupBtn.click();
        }
    } else if (view === 'more-features') {
        if (views.moreFeaturesView) views.moreFeaturesView.style.display = 'block';
        if (moreFeaturesTabBtn) moreFeaturesTabBtn.classList.add('active'); // 使用ID而不是索引

        if (taskActions) {
            taskActions.style.display = 'none';
        }
    } else if (view === 'pomodoro') {
        if (views.pomodoroView) views.pomodoroView.style.display = 'block';
        // 番茄专注没有对应的导航栏标签页，保持"更多功能"为active
        if (moreFeaturesTabBtn) moreFeaturesTabBtn.classList.add('active');

        if (taskActions) {
            taskActions.style.display = 'none';
        }

        // 初始化番茄专注功能
        initPomodoroTimer();
    } else if (view === 'countdown') {
        if (views.countdownView) views.countdownView.style.display = 'block';
        // 倒数纪念日没有对应的导航栏标签页，保持"更多功能"为active
        if (moreFeaturesTabBtn) moreFeaturesTabBtn.classList.add('active');

        if (taskActions) {
            taskActions.style.display = 'none';
        }

        // 初始化倒数纪念日功能
        initCountdownSystem();
    } else if (view === 'calendar') {
        if (views.calendarProView) views.calendarProView.style.display = 'block';
        // 沉浸式自然日历没有对应的导航栏标签页，保持"更多功能"为active
        if (moreFeaturesTabBtn) moreFeaturesTabBtn.classList.add('active');

        if (taskActions) {
            taskActions.style.display = 'none';
        }

        initCalendarModule();
        renderCalendar();
    } else if (view === 'habit-tracker') {
        if (views.habitTrackerView) views.habitTrackerView.style.display = 'block';
        // 习惯打卡没有对应的导航栏标签页，保持"更多功能"为active
        if (moreFeaturesTabBtn) moreFeaturesTabBtn.classList.add('active');

        if (taskActions) {
            taskActions.style.display = 'none';
        }
        initHabitTrackerApp();
    } else if (view === 'time-tracker') {
        if (views.timeTrackerView) views.timeTrackerView.style.display = 'block';
        // 时间管理可视化看板没有对应的导航栏标签页，保持"更多功能"为active
        if (moreFeaturesTabBtn) moreFeaturesTabBtn.classList.add('active');

        if (taskActions) {
            taskActions.style.display = 'none';
        }

        // 初始化时间管理可视化看板功能
        ensureChartJsLoaded(() => initTimeTrackerSystem());
    }

    // 重新渲染任务列表以更新图标显示（仅对任务相关视图）
    if (view === 'list' || view === 'quadrant') {
        render();
    }

    // 更新视图模式切换按钮的可见性
    updateViewModeToggleButtonVisibility();
}

// 模态框相关函数

window.switchView = switchView;
