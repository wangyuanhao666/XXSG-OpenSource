// Main page language application routine.
// Extracted from script.js; reads language state through the shared app bridge.

function getCurrentLanguage() {
    return window.XXSGAppLanguage?.current || 'zh';
}

function getLanguageTranslations() {
    return window.XXSG_TRANSLATIONS || { zh: {}, en: {} };
}

function updateLanguage() {
    const t = getLanguageTranslations()[getCurrentLanguage()];

    // 更新页面标题
    document.title = t.pageTitle;

    const logoEl = document.querySelector('.logo');
    if (logoEl) logoEl.textContent = t.logo;

    const mainTitleEl = document.querySelector('.main-title');
    if (mainTitleEl) mainTitleEl.textContent = t.mainTitle;

    const subTitleEl = document.querySelector('.sub-title');
    if (subTitleEl) subTitleEl.textContent = t.subTitle;

    // 更新语言切换按钮文本
    const languageTextEl = document.querySelector('#language-toggle-btn .language-text');
    if (languageTextEl) languageTextEl.textContent = getCurrentLanguage() === 'zh' ? '中' : 'EN';

    // 更新标签页
    console.log('更新标签页文本，当前语言:', getCurrentLanguage());
    const tabButtons = [
        'list-tab-btn',
        'quadrant-tab-btn',
        'fortune-tab-btn',
        'dashboard-tab-btn',
        'review-tab-btn',
        'templates-tab-btn',
        'more-features-tab-btn'
    ];

    const tabKeys = ['listTab', 'quadrantTab', 'fortuneTab', 'dashboardTab', 'reviewTab', 'templatesTab', 'moreFeaturesTab'];

    tabButtons.forEach((btnId, index) => {
        const btnEl = document.getElementById(btnId);
        if (btnEl && tabKeys[index]) {
            const newText = t[tabKeys[index]];
            console.log(`更新${tabKeys[index]}:`, t[tabKeys[index]], '->', newText);
            const labelEl = btnEl.querySelector('.tab-label');
            if (labelEl) {
                setMultilineText(labelEl, newText);
            } else {
                setMultilineText(btnEl, newText);
            }

            // 添加或移除英文模式CSS类
            if (getCurrentLanguage() === 'en') {
                btnEl.classList.add('english-mode');
            } else {
                btnEl.classList.remove('english-mode');
            }
        }
    });

    // 更新四象限标题
    const q1TitleEl = document.querySelector('#q1 .title-text');
    if (q1TitleEl) setQuadrantTitle(q1TitleEl, '#f44336', t.q1Title);

    const q2TitleEl = document.querySelector('#q2 .title-text');
    if (q2TitleEl) setQuadrantTitle(q2TitleEl, '#ff9800', t.q2Title);

    const q3TitleEl = document.querySelector('#q3 .title-text');
    if (q3TitleEl) setQuadrantTitle(q3TitleEl, '#2196f3', t.q3Title);

    const q4TitleEl = document.querySelector('#q4 .title-text');
    if (q4TitleEl) setQuadrantTitle(q4TitleEl, '#4caf50', t.q4Title);

    // 更新添加任务按钮
    const initialAddBtnEl = document.querySelector('#initial-add-btn span:last-child');
    if (initialAddBtnEl) {
        initialAddBtnEl.textContent = t.addTask;
    }

    // 更新全选和删除按钮
    const selectAllLabelEl = document.querySelector('label[for="select-all-tasks"]');
    if (selectAllLabelEl) {
        selectAllLabelEl.textContent = t.selectAll;
    }

    const deleteSelectedBtnEl = document.querySelector('#delete-selected-btn span:last-child');
    if (deleteSelectedBtnEl) {
        deleteSelectedBtnEl.textContent = t.deleteSelected;
    }

    // 更新导出数据按钮
    const exportDataBtnEl = document.querySelector('#export-tasks-btn span:last-child');
    if (exportDataBtnEl) {
        exportDataBtnEl.textContent = t.exportData;
    }

    // 更新恢复数据按钮
    const restoreDataBtnEl = document.querySelector('#restore-tasks-btn span:last-child');
    if (restoreDataBtnEl) {
        restoreDataBtnEl.textContent = t.restoreData;
    }

    // 更新可视化看板
    const statLabels = document.querySelectorAll('.stat-label');
    if (statLabels.length >= 3) {
        statLabels[0].textContent = t.totalTasks;
        statLabels[1].textContent = t.completedTasks;
        statLabels[2].textContent = t.completionRate;
    }

    // 更新看板卡片标题
    const cardHeaders = document.querySelectorAll('.card-header h3');
    if (cardHeaders.length >= 3) {
        cardHeaders[0].textContent = t.taskDistribution;
        cardHeaders[1].textContent = t.completionTrend;
        cardHeaders[2].textContent = t.efficiencyMetrics;
    }

    // 更新效率指标标签
    const metricLabels = document.querySelectorAll('.metric-label');
    if (metricLabels.length >= 2) {
        metricLabels[0].textContent = t.avgCompletionTime;
        metricLabels[1].textContent = t.productivityScore;
    }

    // 更新每日一签
    const fortuneTitleEl = document.querySelector('.fortune-title');
    if (fortuneTitleEl) {
        fortuneTitleEl.textContent = t.dailyFortune;
    }

    const fortuneSubtitleEl = document.querySelector('.fortune-subtitle');
    if (fortuneSubtitleEl) {
        fortuneSubtitleEl.textContent = t.fortuneSubtitle;
    }

    const drawFortuneBtnEl = document.querySelector('#draw-fortune-btn .btn-text');
    if (drawFortuneBtnEl) {
        drawFortuneBtnEl.textContent = t.drawFortune;
    }

    const shareFortuneBtnEl = document.querySelector('#share-fortune-btn .btn-text');
    if (shareFortuneBtnEl) {
        shareFortuneBtnEl.textContent = t.shareFortune;
    }

    const resetFortuneBtnEl = document.querySelector('#reset-fortune-btn .btn-text');
    if (resetFortuneBtnEl) {
        resetFortuneBtnEl.textContent = t.resetFortune;
    }

    const envelopeTextEl = document.querySelector('.envelope-text');
    if (envelopeTextEl) {
        envelopeTextEl.textContent = t.clickToDraw;
    }

    // 更新日历导航按钮
    const prevMonthBtn = document.getElementById('prev-month');
    if (prevMonthBtn) {
        prevMonthBtn.title = t.prevMonth;
    }

    const nextMonthBtn = document.getElementById('next-month');
    if (nextMonthBtn) {
        nextMonthBtn.title = t.nextMonth;
    }

    // 更新日历显示
    updateCalendarDisplay();

    // 更新HTML lang属性
    document.documentElement.lang = getCurrentLanguage() === 'zh' ? 'zh-CN' : 'en';

    // 更新复盘内容的placeholder文本
    const placeholderMappings = {
        'daily-achievements': t.dailyAchievementsPlaceholder,
        'daily-reflections': t.dailyReflectionsPlaceholder,
        'daily-learnings': t.dailyLearningsPlaceholder,
        'daily-gratitude': t.dailyGratitudePlaceholder,
        'daily-tomorrow-plan': t.dailyTomorrowPlanPlaceholder,
        'weekly-goals': t.weeklyGoalsPlaceholder,
        'weekly-efficiency': t.weeklyEfficiencyPlaceholder,
        'weekly-time': t.weeklyTimePlaceholder,
        'weekly-highlights': t.weeklyHighlightsPlaceholder,
        'weekly-improvements': t.weeklyImprovementsPlaceholder,
        'weekly-relationships': t.weeklyRelationshipsPlaceholder,
        'monthly-goals': t.monthlyGoalsPlaceholder,
        'monthly-growth': t.monthlyGrowthPlaceholder,
        'monthly-analytics': t.monthlyAnalyticsPlaceholder,
        'monthly-lessons': t.monthlyLessonsPlaceholder,
        'monthly-improvements': t.monthlyImprovementsPlaceholder,
        'monthly-next-plan': t.monthlyNextPlanPlaceholder,
        'yearly-achievements': t.yearlyAchievementsPlaceholder,
        'yearly-growth': t.yearlyGrowthPlaceholder,
        'yearly-skills': t.yearlySkillsPlaceholder,
        'yearly-memories': t.yearlyMemoriesPlaceholder,
        'yearly-challenges': t.yearlyChallengesPlaceholder,
        'yearly-next-goals': t.yearlyNextGoalsPlaceholder
    };

    Object.entries(placeholderMappings).forEach(([id, placeholder]) => {
        const element = document.getElementById(id);
        if (element) {
            element.placeholder = placeholder;
        }
    });

    // 更新复盘页面的标题文本
    const reviewTitleMappings = {
        'daily-achievements': t.achievements,
        'daily-reflections': t.reflections,
        'daily-learnings': t.learnings,
        'daily-gratitude': t.gratitude,
        'daily-tomorrow-plan': t.tomorrowPlan,
        'daily-mood': t.mood
    };

    Object.entries(reviewTitleMappings).forEach(([id, title]) => {
        const element = document.querySelector(`#${id} h3`);
        if (element) {
            element.textContent = title;
        }
    });

    // 更新心情状态标签
    const moodMappings = {
        '1': t.moodVeryBad,
        '2': t.moodNotGood,
        '3': t.moodAverage,
        '4': t.moodGood,
        '5': t.moodVeryGood,
        '6': t.moodAwesome
    };

    Object.entries(moodMappings).forEach(([moodValue, moodText]) => {
        const moodBtn = document.querySelector(`[data-mood="${moodValue}"]`);
        if (moodBtn) {
            moodBtn.title = moodText;
            const moodTextElement = moodBtn.parentElement.querySelector('.mood-text');
            if (moodTextElement) {
                moodTextElement.textContent = moodText;
            }
        }
    });

    // 更新取消按钮文本
    const cancelBtn = document.querySelector('.cancel-mood-btn');
    if (cancelBtn) {
        cancelBtn.textContent = t.cancel;
    }

    // 更新复盘记录按钮文本
    const reviewHistoryBtn = document.getElementById('review-history-btn');
    if (reviewHistoryBtn) {
        const span = reviewHistoryBtn.querySelector('span:last-child');
        if (span) span.textContent = t.reviewHistory;
    }

    // 更新复盘记录历史标题
    const reviewHistoryTitle = document.querySelector('#review-history-view h2');
    if (reviewHistoryTitle) {
        reviewHistoryTitle.textContent = t.reviewHistoryTitle;
    }

    // 更新返回按钮文本
    const backToReviewBtn = document.getElementById('back-to-review-btn');
    if (backToReviewBtn) {
        backToReviewBtn.textContent = t.backToReview;
    }

    // 更新每周复盘标题
    const weeklyTitleMappings = {
        'weekly-goals': t.weeklyGoalAchievement,
        'weekly-efficiency': t.workEfficiencyAnalysis,
        'weekly-time': t.timeAllocationReflection,
        'weekly-highlights': t.weeklyHighlights,
        'weekly-improvements': t.nextWeekImprovementPlan,
        'weekly-relationships': t.interpersonalRelationships
    };

    Object.entries(weeklyTitleMappings).forEach(([id, title]) => {
        const element = document.querySelector(`#${id} h3`);
        if (element) {
            element.textContent = title;
        }
    });

    // 更新每月复盘标题
    const monthlyTitleMappings = {
        'monthly-goals': t.monthlyGoalAchievement,
        'monthly-growth': t.personalGrowth,
        'monthly-analytics': t.keyMetrics,
        'monthly-lessons': t.importantLessons,
        'monthly-improvements': t.improvementAreas,
        'monthly-next-plan': t.nextMonthPlan
    };

    Object.entries(monthlyTitleMappings).forEach(([id, title]) => {
        const element = document.querySelector(`#${id} h3`);
        if (element) {
            element.textContent = title;
        }
    });

    // 更新年度复盘标题
    const yearlyTitleMappings = {
        'yearly-achievements': t.yearlyAchievements,
        'yearly-growth': t.personalGrowthYearly,
        'yearly-skills': t.knowledgeSkills,
        'yearly-memories': t.beautifulMemories,
        'yearly-challenges': t.majorChallenges,
        'yearly-next-goals': t.nextYearGoals
    };

    Object.entries(yearlyTitleMappings).forEach(([id, title]) => {
        const element = document.querySelector(`#${id} h3`);
        if (element) {
            element.textContent = title;
        }
    });

    // 更新所有带有data-translate属性的元素
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (t[key]) {
            element.textContent = t[key];
        }
    });

    document.querySelectorAll('[data-translate-title]').forEach(element => {
        const key = element.getAttribute('data-translate-title');
        if (t[key]) element.title = t[key];
    });

    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (t[key]) element.placeholder = t[key];
    });

    document.querySelectorAll('[data-translate-aria-label]').forEach(element => {
        const key = element.getAttribute('data-translate-aria-label');
        if (t[key]) element.setAttribute('aria-label', t[key]);
    });

    applyKnownStaticTranslations();

    // 重新渲染任务列表以应用新语言
    render();

    // 更新日历显示
    if (typeof updateCalendarDisplay === 'function') {
        updateCalendarDisplay();
    }

    // 更新时间显示
    if (typeof updateTimeDisplay === 'function') {
        updateTimeDisplay();
    }

    // 【新增】更新每日一签的语言内容
    if (window.fortuneSystem) {
        window.fortuneSystem.updateFortuneLanguage();
    }

    // 【新增】更新复盘系统的语言内容
    const activeReviewSystem = window.XXSGAppRuntime?.reviewSystem;
    if (activeReviewSystem) {
        activeReviewSystem.updateLanguage();
    }

    window.dispatchEvent(new CustomEvent('xxsg:language-changed', {
        detail: { language: getCurrentLanguage() }
    }));
}


window.updateLanguage = updateLanguage;
