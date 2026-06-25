// Top-level review system.
// Extracted from script.js; language state is read through a tiny bridge so runtime toggles stay live.

function getReviewLanguage() {
    return window.XXSGAppLanguage?.current || 'zh';
}

function getReviewTranslations() {
    return window.XXSG_TRANSLATIONS || { zh: {}, en: {} };
}

class ReviewSystem {
    constructor() {
        this.reviews = {};
        this.eventsBound = false; // 添加事件绑定标志

        // 强制使用当前日期，不允许任何异常日期
        const now = new Date();
        this.currentDate = now;
        this.currentType = 'daily';

        console.log('ReviewSystem 构造函数调用');
        console.log('系统状态 - 当前日期:', this.currentDate.toISOString());
        console.log('系统状态 - 当前类型:', this.currentType);

        // 验证系统时间是否正常
        const currentYear = now.getFullYear();
        if (currentYear < 2020 || currentYear > 2030) {
            console.error('系统时间异常:', currentYear);
            alert('检测到系统时间异常，请检查您的系统时间设置');
        }

        this.loadReviews();
        console.log('- 加载的复盘数据数量:', Object.keys(this.reviews).length);

        this.cleanInvalidReviews();

        this.autoSaveTimer = null;
        this.historyUpdateTimer = null;
        this.isUpdatingHistory = false;

        // 确保DOM加载完成后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // 延迟初始化，确保所有元素都已渲染
            setTimeout(() => this.init(), 100);
        }
    }

    init() {
        console.log('ReviewSystem 初始化开始');
        console.log('已加载的复盘数据:', this.reviews);

        // ✅ 添加自定义拖拽缩放手柄
        this.enableCustomResize();

        this.bindEvents();
        this.updateDateDisplay();
        this.loadCurrentReview();

        // 延迟更新历史记录
        setTimeout(() => {
            this.updateHistoryPreview();
        }, 300);

        console.log('ReviewSystem 初始化完成');
    }

    // ✅ 自定义拖拽缩放 - 直接在 textarea 上监听右下角区域
    enableCustomResize() {
        console.log('启用自定义拖拽缩放');
        const textareas = document.querySelectorAll('.review-card-content textarea');
        console.log('找到的 textarea 数量:', textareas.length);

        textareas.forEach(textarea => {
            // 已绑定的跳过
            if (textarea.dataset.customResize === 'true') return;
            textarea.dataset.customResize = 'true';

            // 基础样式
            textarea.style.setProperty('height', '140px', 'important');
            textarea.style.setProperty('min-height', '90px', 'important');
            textarea.style.setProperty('overflow', 'auto', 'important');

            // 创建手柄元素（作为 textarea 的兄弟，绝对定位）
            const wrapper = document.createElement('div');
            wrapper.className = 'review-textarea-wrapper';
            textarea.parentNode.insertBefore(wrapper, textarea);
            wrapper.appendChild(textarea);

            const handle = document.createElement('div');
            handle.className = 'custom-resize-handle';
            wrapper.appendChild(handle);

            let startW, startH, startX, startY;
            let isDragging = false;

            // 在 document 上监听 mousedown，检测是否落在手柄区域
            const checkAndStartDrag = (e) => {
                const rect = handle.getBoundingClientRect();
                // 先检测是否在附近区域再输出日志（减少干扰）
                const nearX = e.clientX >= rect.left - 20 && e.clientX <= rect.right + 20;
                const nearY = e.clientY >= rect.top - 20 && e.clientY <= rect.bottom + 20;
                if (nearX && nearY) {
                    console.log('📐 手柄 rect:', rect, '鼠标:', e.clientX, e.clientY, 'textarea:', textarea.id);
                }
                // 检测点击是否在手柄范围内（含 5px 容差）
                if (e.clientX >= rect.left - 5 && e.clientX <= rect.right + 5 &&
                    e.clientY >= rect.top - 5 && e.clientY <= rect.bottom + 5) {
                    console.log('✋ 开始拖拽缩放:', textarea.id);
                    e.preventDefault();
                    startW = textarea.offsetWidth;
                    startH = textarea.offsetHeight;
                    startX = e.clientX;
                    startY = e.clientY;
                    isDragging = true;
                    handle.classList.add('dragging');
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                }
            };

            const onMouseMove = (e) => {
                if (!isDragging) return;
                // 限制宽度不能超过外框（卡片容器），防止溢出
                const cardWidth = wrapper.parentElement.clientWidth - 6;
                const w = Math.min(Math.max(200, startW + (e.clientX - startX)), cardWidth);
                const h = Math.max(90, startH + (e.clientY - startY));
                textarea.style.setProperty('width', w + 'px', 'important');
                textarea.style.setProperty('height', h + 'px', 'important');
                // 手柄跟随 textarea 右下角移动
                handle.style.left = (w - 20) + 'px';
                handle.style.top = (h - 20) + 'px';
            };

            const onMouseUp = () => {
                if (!isDragging) return;
                console.log('✅ 结束拖拽缩放:', textarea.id);
                isDragging = false;
                handle.classList.remove('dragging');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousedown', checkAndStartDrag);

            console.log(`已启用拖拽缩放: ${textarea.id}`);
        });
    }

    bindEvents() {
        // 防止重复绑定事件监听器
        if (this.eventsBound) {
            console.log('事件监听器已经绑定，跳过重复绑定');
            return;
        }

        console.log('开始绑定ReviewSystem事件监听器');

        // 创建可重用的自动保存处理函数
        this.autoSaveHandler = () => {
            this.scheduleAutoSave();
        };

        // 复盘类型切换
        document.querySelectorAll('.review-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchReviewType(e.target.dataset.type);
            });
        });

        // 日期导航 - 先移除已存在的事件监听器
        const reviewPrevBtn = document.getElementById('prev-review-date');
        const reviewNextBtn = document.getElementById('next-review-date');

        if (reviewPrevBtn) {
            // 克隆节点来移除所有事件监听器
            const newPrevBtn = reviewPrevBtn.cloneNode(true);
            reviewPrevBtn.parentNode.replaceChild(newPrevBtn, reviewPrevBtn);
            newPrevBtn.addEventListener('click', () => {
                console.log('点击后退按钮');
                this.navigateDate(-1);
            });
        }

        if (reviewNextBtn) {
            // 克隆节点来移除所有事件监听器
            const newNextBtn = reviewNextBtn.cloneNode(true);
            reviewNextBtn.parentNode.replaceChild(newNextBtn, reviewNextBtn);
            newNextBtn.addEventListener('click', () => {
                console.log('点击前进按钮');
                this.navigateDate(1);
            });
        }

        // 标记事件已绑定
        this.eventsBound = true;
        console.log('ReviewSystem事件监听器绑定完成');

        // 日期时间选择器
        document.getElementById('today-review-btn')?.addEventListener('click', () => {
            this.showDateTimePicker();
        });

        // 日期时间输入框事件
        const dateTimePicker = document.getElementById('date-time-picker');
        if (dateTimePicker) {
            dateTimePicker.addEventListener('change', (e) => {
                this.setCustomDateTime(e.target.value);
            });

            dateTimePicker.addEventListener('blur', () => {
                setTimeout(() => {
                    dateTimePicker.style.display = 'none';
                }, 200);
            });
        }

        // 心情选择 - 修复类名匹配问题
        document.querySelectorAll('.mood-btn').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectMood(e.target.dataset.mood);
            });
        });

        // 评分系统 - 修复类名匹配问题
        document.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', (e) => {
                this.setRating(parseInt(e.target.dataset.rating));
            });
        });

        // 操作按钮
        document.getElementById('save-review-btn')?.addEventListener('click', () => {
            this.saveReview();
        });

        document.getElementById('export-review-btn')?.addEventListener('click', () => {
            this.exportReview();
        });

        document.getElementById('clear-review-btn')?.addEventListener('click', () => {
            this.clearReview();
        });

        // 绑定复盘记录按钮事件
        const reviewHistoryBtn = document.getElementById('review-history-btn');
        console.log('复盘记录按钮元素:', reviewHistoryBtn);
        if (reviewHistoryBtn) {
            reviewHistoryBtn.addEventListener('click', () => {
                console.log('复盘记录按钮被点击');
                this.showReviewHistoryView();
            });
        } else {
            console.error('未找到复盘记录按钮元素');
        }

        // 绑定返回复盘按钮事件
        document.getElementById('back-to-review-btn')?.addEventListener('click', () => {
            this.showReviewMainView();
        });

        // 绑定历史筛选事件
        document.getElementById('history-type-filter')?.addEventListener('change', () => {
            this.filterReviewHistory();
        });

        document.getElementById('history-date-filter')?.addEventListener('change', () => {
            this.filterReviewHistory();
        });

        document.getElementById('clear-filters-btn')?.addEventListener('click', () => {
            this.clearHistoryFilters();
        });

        // 自动保存 - 使用可重用的处理函数
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', this.autoSaveHandler);
        });
    }

    switchReviewType(type) {
        this.currentType = type;

        // 更新按钮状态
        document.querySelectorAll('.review-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });

        // 显示对应的复盘模板 - 修复模板ID匹配
        document.querySelectorAll('.review-template').forEach(template => {
            template.style.display = template.id === `${type}-review-template` ? 'block' : 'none';
        });

        // ✅ 延迟启用 textarea resize，确保DOM已更新
        setTimeout(() => {
            this.enableCustomResize();
        }, 50);

        // 重新绑定当前显示模板中的textarea自动保存事件
        const currentTemplate = document.getElementById(`${type}-review-template`);
        if (currentTemplate) {
            currentTemplate.querySelectorAll('textarea').forEach(textarea => {
                // 移除旧的事件监听器（如果存在）
                textarea.removeEventListener('input', this.autoSaveHandler);
                // 绑定新的事件监听器
                textarea.addEventListener('input', this.autoSaveHandler);
            });
        }

        this.loadCurrentReview();
    }

    navigateDate(direction) {
        console.log('navigateDate 被调用:', {
            direction,
            currentDate: this.currentDate.toISOString(),
            currentDateString: this.currentDate.toDateString()
        });

        // 简化逻辑：不管什么复盘类型，都只进行简单的日期前进后退
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + direction);

        console.log('简化计算过程:', {
            originalDate: this.currentDate.toISOString(),
            originalDateString: this.currentDate.toDateString(),
            direction,
            newDate: newDate.toISOString(),
            newDateString: newDate.toDateString()
        });

        this.currentDate = newDate;
        this.updateDateDisplay();
        this.loadCurrentReview();
    }

    getDateStep() {
        // 简化：始终返回1天
        return 1;
    }

    showDateTimePicker() {
        const dateTimePicker = document.getElementById('date-time-picker');
        if (dateTimePicker) {
            // 设置当前日期时间为默认值
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            dateTimePicker.value = localDateTime;

            // 显示日期选择器
            dateTimePicker.style.display = 'block';
            dateTimePicker.focus();
        }
    }

    setCustomDateTime(dateTimeString) {
        if (dateTimeString) {
            this.currentDate = new Date(dateTimeString);
            this.updateDateDisplay();
            this.loadCurrentReview();

            // 隐藏日期选择器
            const dateTimePicker = document.getElementById('date-time-picker');
            if (dateTimePicker) {
                dateTimePicker.style.display = 'none';
            }
        }
    }

    goToToday() {
        this.currentDate = new Date();
        this.updateDateDisplay();
        this.loadCurrentReview();
    }

    updateDateDisplay() {
        const dateEl = document.getElementById('review-date-text');
        const weekdayEl = document.getElementById('review-date-weekday');

        if (dateEl) {
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            const locale = getReviewLanguage() === 'zh' ? 'zh-CN' : 'en-US';
            dateEl.textContent = this.currentDate.toLocaleDateString(locale, options);
        }

        if (weekdayEl) {
            if (getReviewLanguage() === 'zh') {
                const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
                weekdayEl.textContent = weekdays[this.currentDate.getDay()];
            } else {
                const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                weekdayEl.textContent = weekdays[this.currentDate.getDay()];
            }
        }
    }

    formatDate(date) {
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        return date.toLocaleDateString(getReviewLanguage() === 'zh' ? 'zh-CN' : 'en-US', options);
    }

    getReviewKey() {
        // 获取当前真实日期
        const now = new Date();
        const currentYear = now.getFullYear();

        // 确保 currentDate 是有效的 Date 对象且年份合理
        if (!this.currentDate ||
            !(this.currentDate instanceof Date) ||
            isNaN(this.currentDate.getTime()) ||
            this.currentDate.getFullYear() < 2020 ||
            this.currentDate.getFullYear() > currentYear) {
            console.warn('检测到无效日期，重置为当前日期:', this.currentDate);
            this.currentDate = now;
        }

        try {
            const dateStr = this.currentDate.toISOString().split('T')[0];
            const key = `${this.currentType}-${dateStr}`;

            // 额外验证生成的键名
            if (key.includes('2025') && currentYear < 2025) {
                console.error('检测到未来年份的键名，强制重置:', key);
                this.currentDate = now;
                const newDateStr = this.currentDate.toISOString().split('T')[0];
                return `${this.currentType}-${newDateStr}`;
            }

            console.log('生成复盘键名:', key);
            return key;
        } catch (error) {
            console.error('日期转换失败:', error);
            this.currentDate = now;
            const dateStr = this.currentDate.toISOString().split('T')[0];
            return `${this.currentType}-${dateStr}`;
        }
    }

    loadReviews() {
        try {
            return window.ProductivityStorage
                ? window.ProductivityStorage.getReviews('reviews')
                : JSON.parse(window.DataSyncStorage.getRaw('reviews') || '{}');
        } catch (error) {
            console.error('加载复盘数据失败:', error);
            return {};
        }
    }

    cleanInvalidReviews() {
        if (!this.reviews || typeof this.reviews !== 'object') {
            this.reviews = {};
            return;
        }

        const currentYear = new Date().getFullYear();
        const currentDate = new Date();
        let hasInvalidData = false;
        const invalidKeys = [];

        Object.keys(this.reviews).forEach(key => {
            const [type, dateStr] = key.split('-');

            // 检查键格式是否正确
            if (!type || !dateStr || !['daily', 'weekly', 'monthly', 'yearly'].includes(type)) {
                console.log('删除格式错误的记录:', key);
                invalidKeys.push(key);
                return;
            }

            const date = new Date(dateStr);

            // 检查日期是否无效
            if (isNaN(date.getTime())) {
                console.log('删除无效日期记录:', key, dateStr);
                invalidKeys.push(key);
                return;
            }

            // 严格的年份验证 - 删除所有未来年份的记录
            const recordYear = date.getFullYear();
            if (recordYear > currentYear || recordYear < 2020) {
                console.log('删除异常年份记录:', key, '年份:', recordYear, '当前年份:', currentYear);
                invalidKeys.push(key);
                return;
            }

            // 删除未来日期的记录
            if (date > currentDate) {
                console.log('删除未来日期记录:', key);
                invalidKeys.push(key);
                return;
            }
        });

        // 批量删除无效记录
        if (invalidKeys.length > 0) {
            invalidKeys.forEach(key => {
                delete this.reviews[key];
            });

            this.saveReviews();
            hasInvalidData = true;

            console.log(`已清理 ${invalidKeys.length} 条无效记录:`, invalidKeys);
            this.showMessage(`已清理 ${invalidKeys.length} 条无效复盘记录`);
        }

        if (!hasInvalidData) {
            console.log('未发现无效的复盘记录');
        }
    }

    saveReviews() {
        try {
            if (window.ProductivityStorage) {
                this.reviews = window.ProductivityStorage.setReviews('reviews', this.reviews);
            } else {
                const dataToSave = JSON.stringify(this.reviews);
                window.DataSyncStorage.setRaw('reviews', dataToSave);
            }
        } catch (error) {
            console.error('保存复盘数据失败:', error);
            this.showMessage('保存失败，请检查浏览器存储权限');
        }
    }

    loadCurrentReview() {
        const key = this.getReviewKey();
        const review = this.reviews[key] || {};

        console.log('加载复盘数据，键名:', key);
        console.log('复盘数据内容:', review);

        // 创建ID到字段名的映射
        const fieldMapping = {
            'daily-achievements': 'achievements',
            'daily-reflections': 'reflections',
            'daily-learnings': 'learnings',
            'daily-gratitude': 'gratitude',
            'daily-tomorrow-plan': 'tomorrowPlan',
            'weekly-goals': 'goalProgress',
            'weekly-efficiency': 'efficiencyAnalysis',
            'weekly-time': 'timeAllocation',
            'weekly-highlights': 'weekHighlights',
            'weekly-improvements': 'improvements',
            'weekly-relationships': 'relationships',
            'monthly-goals': 'goalProgress',
            'monthly-growth': 'growth',
            'monthly-analytics': 'analytics',
            'monthly-lessons': 'lessons',
            'monthly-improvements': 'improvements',
            'monthly-next-plan': 'nextPlan',
            'yearly-achievements': 'achievements',
            'yearly-goals': 'goals',
            'yearly-growth': 'growth',
            'yearly-skills': 'skills',
            'yearly-memories': 'memories',
            'yearly-challenges': 'challenges',
            'yearly-lessons': 'lessons',
            'yearly-next-goals': 'nextGoals'
        };

        // 只选择当前显示的复盘模板中的textarea
        const currentTemplate = document.getElementById(`${this.currentType}-review-template`);
        if (!currentTemplate) return;

        const textareas = currentTemplate.querySelectorAll('textarea');
        console.log('找到的textarea元素:', textareas.length);

        textareas.forEach(textarea => {
            let field = textarea.dataset.field;

            // 如果没有data-field属性，使用ID映射
            if (!field && textarea.id) {
                field = fieldMapping[textarea.id];
            }

            if (field) {
                textarea.value = review[field] || '';
                console.log(`加载字段 ${field}:`, review[field] || '(空)');
            }
        });

        // 加载心情
        this.selectMood(review.mood || '');

        // 加载评分
        this.setRating(review.rating || 0);

        // ✅ 确保加载后 textarea 可以拖动
        setTimeout(() => {
            this.enableCustomResize();
        }, 10);

        console.log('复盘数据加载完成');
    }

    selectMood(mood) {
        const moodGrid = document.querySelector('.mood-grid');
        const cancelBtn = document.querySelector('.cancel-mood-btn');
        const ratingSection = document.getElementById('rating-section');
        const moodCard = document.querySelector('.review-card.mood-rating');

        document.querySelectorAll('.mood-btn').forEach(option => {
            option.classList.toggle('selected', option.dataset.mood === mood);
        });

        if (mood) {
            // 添加选中状态类到心情卡片
            if (moodCard) moodCard.classList.add('has-selection');

            // 显示取消按钮和评分区域
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
            if (ratingSection) {
                ratingSection.style.display = 'flex';
                ratingSection.classList.add('show');
            }

            // 调整心情网格为2列布局
            if (moodGrid) moodGrid.classList.add('compact');

            // 根据心情自动设置评分
            const moodToRating = {
                '1': 2, '2': 3, '3': 5, '4': 7, '5': 9, '6': 10
            };

            const rating = moodToRating[mood] || 0;
            this.setRating(rating);
        } else {
            // 移除选中状态类
            if (moodCard) moodCard.classList.remove('has-selection');

            // 隐藏取消按钮和评分区域
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (ratingSection) {
                ratingSection.classList.remove('show');
                setTimeout(() => {
                    ratingSection.style.display = 'none';
                }, 300);
            }

            // 恢复心情网格为3列布局
            if (moodGrid) moodGrid.classList.remove('compact');
        }
    }

    setRating(rating) {
        document.querySelectorAll('.star').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });

        // 更新评分显示
        const ratingDisplay = document.getElementById('rating-display');
        if (ratingDisplay) {
            ratingDisplay.textContent = `${rating}/10`;
        }
    }

    cancelMoodSelection() {
        const moodGrid = document.querySelector('.mood-grid');
        const moodCard = document.querySelector('.review-card.mood-rating');

        // 清除所有心情按钮的选中状态
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        // 移除选中状态类
        if (moodCard) moodCard.classList.remove('has-selection');

        // 隐藏取消按钮和评分部分
        const cancelBtn = document.getElementById('cancel-mood-btn');
        const ratingSection = document.getElementById('rating-section');

        if (cancelBtn) cancelBtn.style.display = 'none';
        if (ratingSection) {
            ratingSection.classList.remove('show');
            setTimeout(() => {
                ratingSection.style.display = 'none';
            }, 300);
        }

        // 恢复心情网格为3列布局
        if (moodGrid) moodGrid.classList.remove('compact');

        // 重置评分为0
        this.setRating(0);

        // 触发自动保存
        this.scheduleAutoSave();
    }

    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        this.autoSaveTimer = setTimeout(() => {
            this.saveReview(true);
        }, 2000);
    }

    saveReview(isAutoSave = false) {
        const review = {
            date: this.currentDate.toISOString(),
            type: this.currentType,
            mood: document.querySelector('.mood-btn.selected')?.dataset.mood || '',
            rating: parseInt(document.getElementById('rating-display')?.textContent) || 0
        };

        const fieldMapping = {
            // 每日复盘字段
            'daily-achievements': 'achievements',
            'daily-reflections': 'reflections',
            'daily-learnings': 'learnings',
            'daily-gratitude': 'gratitude',
            'daily-tomorrow-plan': 'tomorrowPlan',

            // 每周复盘字段
            'weekly-goals': 'goalProgress',
            'weekly-efficiency': 'efficiencyAnalysis',
            'weekly-time': 'timeAllocation',
            'weekly-highlights': 'weekHighlights',
            'weekly-improvements': 'improvements',
            'weekly-relationships': 'relationships',

            // 每月复盘字段
            'monthly-goals': 'goalProgress',
            'monthly-growth': 'growth',
            'monthly-analytics': 'analytics',
            'monthly-lessons': 'lessons',
            'monthly-improvements': 'improvements',
            'monthly-next-plan': 'nextPlan',

            // 年度复盘字段
            'yearly-achievements': 'achievements',
            'yearly-goals': 'goals',
            'yearly-growth': 'growth',
            'yearly-skills': 'skills',
            'yearly-memories': 'memories',
            'yearly-challenges': 'challenges',
            'yearly-lessons': 'lessons',
            'yearly-next-goals': 'nextGoals'
        };

        // 收集所有textarea内容（只收集复盘区域内的）
        document.querySelectorAll('#review-view textarea').forEach(textarea => {
            const fieldName = fieldMapping[textarea.id] || textarea.dataset.field || textarea.id;
            if (fieldName && textarea.value.trim()) {
                review[fieldName] = textarea.value.trim();
            }
        });

        const key = this.getReviewKey();
        this.reviews[key] = review;
        this.saveReviews();

        if (!isAutoSave) {
            this.showMessage(t('reviewSaved'));
        }

        // 延迟更新历史记录
        clearTimeout(this.historyUpdateTimer);
        this.historyUpdateTimer = setTimeout(() => {
            this.updateHistoryPreview();
            this.updateDetailedHistoryView();
        }, 500);
    }

    clearReview() {
        if (confirm(t('confirmClear'))) {
            document.querySelectorAll('textarea').forEach(textarea => {
                textarea.value = '';
            });
            this.selectMood('');
            this.setRating(0);

            const key = this.getReviewKey();
            delete this.reviews[key];
            this.saveReviews();

            this.showMessage(t('reviewCleared'));

            // 延迟更新历史记录
            clearTimeout(this.historyUpdateTimer);
            this.historyUpdateTimer = setTimeout(() => {
                this.updateHistoryPreview();
            }, 200);
        }
    }

    exportReview() {
        const key = this.getReviewKey();
        const review = this.reviews[key];

        if (!review) {
            this.showMessage('没有可导出的复盘内容');
            return;
        }

        // 心情状态映射表（支持中英文）
        const moodMapping = {
            '1': getReviewLanguage() === 'zh' ? '很糟糕' : 'Very Bad',
            '2': getReviewLanguage() === 'zh' ? '不太好' : 'Not Good',
            '3': getReviewLanguage() === 'zh' ? '一般' : 'Average',
            '4': getReviewLanguage() === 'zh' ? '不错' : 'Good',
            '5': getReviewLanguage() === 'zh' ? '很好' : 'Very Good',
            '6': getReviewLanguage() === 'zh' ? '超棒' : 'Excellent'
        };

        // 类型名称映射
        const typeNames = {
            'daily': getReviewLanguage() === 'zh' ? '每日' : 'Daily',
            'weekly': getReviewLanguage() === 'zh' ? '每周' : 'Weekly',
            'monthly': getReviewLanguage() === 'zh' ? '每月' : 'Monthly',
            'yearly': getReviewLanguage() === 'zh' ? '每年' : 'Yearly'
        };

        let markdown = `# ${typeNames[this.currentType]} Review\n\n`;
        markdown += `**${getReviewLanguage() === 'zh' ? '日期' : 'Date'}**: ${this.formatDate(this.currentDate)}\n\n`;

        if (this.currentType === 'daily') {
            markdown += `## ${getReviewLanguage() === 'zh' ? '今日成就' : 'Today\'s Achievements'}\n${review.achievements || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '反思与洞察' : 'Reflections & Insights'}\n${review.reflections || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '关键学习' : 'Key Learnings'}\n${review.learnings || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '感恩记录' : 'Gratitude'}\n${review.gratitude || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '明日计划' : 'Tomorrow\'s Plan'}\n${review.tomorrowPlan || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '心情状态' : 'Mood'}\n${moodMapping[review.mood] || review.mood || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '整体评分' : 'Overall Rating'}\n${review.rating || 0}/10\n\n`;
        } else if (this.currentType === 'weekly') {
            markdown += `## ${getReviewLanguage() === 'zh' ? '本周目标达成' : 'Weekly Goal Achievement'}\n${review.goalProgress || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '工作效率分析' : 'Work Efficiency Analysis'}\n${review.efficiencyAnalysis || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '时间分配反思' : 'Time Allocation Reflection'}\n${review.timeAllocation || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '本周亮点' : 'Week Highlights'}\n${review.weekHighlights || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '下周改进计划' : 'Next Week Improvement Plan'}\n${review.improvements || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '人际关系与协作' : 'Relationships & Collaboration'}\n${review.relationships || ''}\n\n`;
        } else if (this.currentType === 'monthly') {
            markdown += `## ${getReviewLanguage() === 'zh' ? '本月目标回顾' : 'Monthly Goal Review'}\n${review.goalProgress || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '成长与突破' : 'Growth & Breakthroughs'}\n${review.growth || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '数据分析' : 'Data Analysis'}\n${review.analytics || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '经验总结' : 'Lessons Learned'}\n${review.lessons || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '待改进事项' : 'Areas for Improvement'}\n${review.improvements || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '下月规划' : 'Next Month Plan'}\n${review.nextPlan || ''}\n\n`;
        } else if (this.currentType === 'yearly') {
            markdown += `## ${getReviewLanguage() === 'zh' ? '年度成就盘点' : 'Yearly Achievements'}\n${review.achievements || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '个人成长' : 'Personal Growth'}\n${review.growth || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '知识技能' : 'Knowledge & Skills'}\n${review.skills || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '美好回忆' : 'Beautiful Memories'}\n${review.memories || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '挑战与困难' : 'Challenges & Difficulties'}\n${review.challenges || ''}\n\n`;
            markdown += `## ${getReviewLanguage() === 'zh' ? '明年展望' : 'Next Year Goals'}\n${review.nextGoals || ''}\n\n`;
        }

        this.downloadMarkdown(markdown, `${this.currentType}-review-${this.currentDate.toISOString().split('T')[0]}.md`);
    }

    downloadMarkdown(content, filename) {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    updateHistoryPreview() {
        const historyEl = document.getElementById('review-history-list');
        if (!historyEl) {
            // 历史记录容器不存在，静默返回
            return;
        }

        // 防止重复更新导致闪烁
        if (this.isUpdatingHistory) {
            return;
        }
        this.isUpdatingHistory = true;

        console.log('更新历史记录，当前复盘类型:', this.currentType);
        console.log('所有复盘数据:', this.reviews);

        const recentReviews = Object.entries(this.reviews)
            .filter(([key]) => {
                const matches = key.startsWith(this.currentType);
                console.log(`检查键 ${key}:`, matches);
                return matches;
            })
            .sort(([, a], [, b]) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        console.log('筛选出的最近复盘记录:', recentReviews);

        // 添加去重逻辑
        const seenDates = new Set();
        const uniqueRecentReviews = [];

        recentReviews.forEach(([key, review]) => {
            const dateKey = `${this.currentType}-${review.date.split('T')[0]}`;
            if (!seenDates.has(dateKey)) {
                seenDates.add(dateKey);
                uniqueRecentReviews.push([key, review]);
            }
        });

        console.log('去重后的复盘记录:', uniqueRecentReviews);

        historyEl.replaceChildren();

        if (recentReviews.length === 0) {
            historyEl.appendChild(this.createNoHistoryState());
        } else {
            recentReviews.forEach(([key, review]) => {
                const date = new Date(review.date);
                historyEl.appendChild(this.createRecentHistoryItem(key, review, date));
            });

            // 重新绑定点击事件
            historyEl.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const key = e.currentTarget.dataset.key;
                    console.log('点击历史记录项:', key);
                    this.loadHistoryReview(key);
                });

                // 添加悬停效果
                item.addEventListener('mouseenter', (e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                });

                item.addEventListener('mouseleave', (e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                });
            });
        }

        console.log('历史记录HTML已更新');

        // 延迟重置标志，防止过快的重复调用
        setTimeout(() => {
            this.isUpdatingHistory = false;
        }, 100);
    }

    createNoHistoryState() {
        const empty = document.createElement('div');
        empty.className = 'no-history';
        empty.textContent = t('noHistory');
        return empty;
    }

    createRecentHistoryItem(key, review, date) {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.dataset.key = key;
        item.style.cssText = 'cursor: pointer; padding: 10px; border-bottom: 1px solid #eee; transition: background-color 0.2s;';
        const dateEl = document.createElement('div');
        dateEl.className = 'history-date';
        dateEl.style.cssText = 'font-weight: bold; color: #333;';
        dateEl.textContent = this.formatDate(date);
        const preview = document.createElement('div');
        preview.className = 'history-preview';
        preview.style.cssText = 'color: #666; font-size: 14px; margin-top: 4px;';
        preview.textContent = this.getReviewPreview(review);
        item.append(dateEl, preview);
        return item;
    }

    getReviewPreview(review) {
        if (this.currentType === 'daily') {
            return review.achievements ? review.achievements.substring(0, 50) + '...' : '暂无内容';
        } else {
            return review.goalProgress ? review.goalProgress.substring(0, 50) + '...' : '暂无内容';
        }
    }

    loadHistoryReview(key) {
        console.log(`%c[诊断] --- 加载历史记录 ---`, 'color: green; font-weight: bold;');
        console.log(`%c[诊断] loadHistoryReview 被调用, 键名: "${key}"`, 'color: green;');
        const review = this.reviews[key];
        if (review) {
            console.log('%c[诊断] 找到的复盘对象:', 'color: green;', review);
            this.currentDate = new Date(review.date);
            console.log(`%c[诊断] 将当前日期设置为: ${this.currentDate.toISOString()}`, 'color: green;');
            this.updateDateDisplay();
            this.loadCurrentReview();
        } else {
            console.error(`[诊断] 错误: 没有找到键名为 "${key}" 的复盘记录`);
        }
        console.log(`%c[诊断] --- 历史记录加载完成 ---`, 'color: green; font-weight: bold;');
    }

    updateLanguage() {
        const t = getReviewTranslations()[getReviewLanguage()] || {};

        // 更新复盘类型按钮
        const typeButtons = {
            'daily': t.dailyReview,
            'weekly': t.weeklyReview,
            'monthly': t.monthlyReview,
            'yearly': t.yearlyReview
        };

        Object.entries(typeButtons).forEach(([type, text]) => {
            const btn = document.querySelector(`[data-type="${type}"]`);
            if (btn) btn.textContent = text;
        });

        // 更新日期导航按钮
        const countdownPrevBtn = document.getElementById('prev-date');
        if (countdownPrevBtn) countdownPrevBtn.title = t.previousDay;

        const countdownNextBtn = document.getElementById('next-date');
        if (countdownNextBtn) countdownNextBtn.title = t.nextDay;

        const todayBtn = document.getElementById('today-date');
        if (todayBtn) todayBtn.textContent = t.today;

        // 更新操作按钮
        const saveBtn = document.getElementById('save-review-btn');
        if (saveBtn) saveBtn.textContent = t.saveReview;

        const exportBtn = document.getElementById('export-review-btn');
        if (exportBtn) exportBtn.textContent = t.exportReview;

        const clearBtn = document.getElementById('clear-review-btn');
        if (clearBtn) clearBtn.textContent = t.clearReview;

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

        // 更新日期显示
        this.updateDateDisplay();

        // 更新历史预览
        this.updateHistoryPreview();
    }

    // 显示复盘记录历史视图
    showReviewHistoryView() {
        document.getElementById('review-content').style.display = 'none';
        document.getElementById('review-history-view').style.display = 'block';
        this.loadDetailedReviewHistory();
    }

    // 显示复盘主视图
    showReviewMainView() {
        document.getElementById('review-history-view').style.display = 'none';
        document.getElementById('review-content').style.display = 'block';
    }

    // 加载详细复盘历史记录
    loadDetailedReviewHistory() {
        console.log("%c[诊断] --- 加载详细复盘历史 ---", "color: green;");
        this.updateDetailedHistoryView();
    }

    // 获取过滤和排序后的复盘记录
    getFilteredAndSortedReviews() {
        const typeFilter = document.getElementById('history-type-filter')?.value || 'all';
        const dateFilter = document.getElementById('history-date-filter')?.value || '';

        let filteredReviews = Object.entries(this.reviews).filter(([key, review]) => {
            // 类型筛选
            if (typeFilter !== 'all' && !key.startsWith(typeFilter + '-')) {
                return false;
            }

            // 日期筛选
            if (dateFilter) {
                const reviewDate = new Date(review.date).toISOString().split('T')[0];
                if (reviewDate !== dateFilter) {
                    return false;
                }
            }

            return true;
        });

        // 按日期降序排序（最新的在前）
        filteredReviews.sort(([, a], [, b]) => {
            return new Date(b.date) - new Date(a.date);
        });

        return filteredReviews;
    }

    // 获取复盘类型显示名称
    getReviewTypeName(type) {
        const typeNames = {
            'daily': '日复盘',
            'weekly': '周复盘',
            'monthly': '月复盘',
            'yearly': '年复盘'
        };
        return typeNames[type] || type;
    }

    // 绑定历史记录项事件
    bindHistoryItemEvents(container) {
        if (!container) return;

        // 绑定查看按钮事件
        container.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = e.target.closest('.history-item-detailed').dataset.key;
                this.viewHistoryItem(key);
            });
        });

        // 绑定编辑按钮事件
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = e.target.closest('.history-item-detailed').dataset.key;
                this.editHistoryItem(key);
            });
        });

        // 绑定删除按钮事件
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const key = e.target.closest('.history-item-detailed').dataset.key;
                this.deleteHistoryItem(key);
            });
        });

        // 绑定历史记录项点击事件（查看详情）
        container.querySelectorAll('.history-item-detailed').forEach(item => {
            item.addEventListener('click', (e) => {
                // 如果点击的是按钮，不触发项目点击事件
                if (e.target.closest('button')) return;

                const key = item.dataset.key;
                this.viewHistoryItem(key);
            });
        });
    }

    updateDetailedHistoryView() {
        console.log("%c[诊断] --- 更新详细历史视图 ---", "color: blue;");
        const historyListEl = document.getElementById('review-history-list-detailed');
        if (!historyListEl) return;

        const reviews = this.getFilteredAndSortedReviews();

        historyListEl.replaceChildren();

        if (reviews.length === 0) {
            historyListEl.appendChild(this.createNoHistoryState());
        } else {
            reviews.forEach(([key, review]) => {
                const date = new Date(review.date);
                console.log(`%c[诊断] 渲染历史项: 键名="${key}", 内部日期="${review.date}"`, 'color: blue;');
                if (!key.includes(review.date.split('T')[0])) {
                    console.error(`%c[诊断] 发现不匹配项! 键名: ${key}, 内部日期: ${review.date}`, 'background-color: yellow;');
                }
                historyListEl.appendChild(this.createDetailedHistoryItem(key, review, date));
            });
        }

        this.bindHistoryItemEvents(historyListEl);
        console.log("%c[诊断] --- 详细历史视图更新完成 ---", "color: blue;");
    }

    createDetailedHistoryItem(key, review, date) {
        const item = document.createElement('div');
        item.className = 'history-item-detailed';
        item.dataset.key = key;
        const type = document.createElement('div');
        type.className = 'history-item-type';
        type.textContent = this.getReviewTypeName(review.type);
        const dateEl = document.createElement('div');
        dateEl.className = 'history-item-date';
        dateEl.textContent = this.formatDate(date);
        const preview = document.createElement('div');
        preview.className = 'history-item-preview';
        preview.textContent = this.getReviewPreview(review);
        const actions = document.createElement('div');
        actions.className = 'history-item-actions';
        actions.append(
            this.createHistoryActionButton('view-btn', 'fas fa-eye', t('view')),
            this.createHistoryActionButton('edit-btn', 'fas fa-pencil-alt', t('edit')),
            this.createHistoryActionButton('delete-btn', 'fas fa-trash', t('delete'))
        );
        item.append(type, dateEl, preview, actions);
        return item;
    }

    createHistoryActionButton(className, iconClass, label) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.title = label;
        const icon = document.createElement('i');
        icon.className = iconClass;
        const text = document.createElement('span');
        text.className = 'btn-text';
        text.textContent = label;
        button.append(icon, text);
        return button;
    }

    // 获取类型显示名称
    getTypeDisplayName(type) {
        const typeNames = {
            'daily': '日复盘',
            'weekly': '周复盘',
            'monthly': '月复盘',
            'yearly': '年复盘'
        };
        return typeNames[type] || type;
    }

    // 筛选复盘历史
    filterReviewHistory() {
        const typeFilter = document.getElementById('history-type-filter').value;
        const dateFilter = document.getElementById('history-date-filter').value;

        const historyItems = document.querySelectorAll('.history-item');

        historyItems.forEach(item => {
            const key = item.dataset.key;
            const [type, dateStr] = key.split('-');
            const itemDate = new Date(dateStr).toISOString().split('T')[0];

            let showItem = true;

            // 类型筛选
            if (typeFilter !== 'all' && type !== typeFilter) {
                showItem = false;
            }

            // 日期筛选
            if (dateFilter && itemDate !== dateFilter) {
                showItem = false;
            }

            item.style.display = showItem ? 'block' : 'none';
        });
    }

    // 清除筛选条件
    clearHistoryFilters() {
        document.getElementById('history-type-filter').value = 'all';
        document.getElementById('history-date-filter').value = '';
        this.filterReviewHistory();
    }

    // 查看历史记录详情
    viewHistoryItem(key) {
        const reviews = this.loadReviews();
        const review = reviews[key];
        if (!review) return;

        const modal = document.createElement('div');
        modal.className = 'modal';

        const type = key.split('-')[0];
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content review-detail-modal';

        const header = document.createElement('div');
        header.className = 'modal-header';

        const title = document.createElement('h3');
        title.textContent = `复盘详情 - ${this.getTypeDisplayName(type)}`;

        const closeBtn = document.createElement('span');
        closeBtn.className = 'modal-close';
        closeBtn.textContent = '\u00d7';
        header.append(title, closeBtn);

        const body = document.createElement('div');
        body.className = 'modal-body';
        body.appendChild(this.createReviewDetailContent(review, type));

        modalContent.append(header, body);
        modal.appendChild(modalContent);

        document.body.appendChild(modal);
        modal.style.display = 'block';

        // 绑定关闭事件
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    createReviewDetailContent(review, type) {
        const fieldMappings = this.getReviewFieldMappings();
        const mapping = fieldMappings[type] || {};
        const content = document.createElement('div');
        content.className = 'review-detail-content';

        Object.entries(review).forEach(([key, value]) => {
            if (key === 'mood') {
                const moodLabels = { '1': '很糟糕', '2': '不太好', '3': '一般', '4': '不错', '5': '很好' };
                content.appendChild(this.createReviewField(mapping[key] || key, moodLabels[value] || value));
            } else if (key === 'rating') {
                content.appendChild(this.createReviewField(mapping[key] || key, this.createRatingDisplay(value)));
            } else if (value && value.toString().trim() && !['date', 'type', 'updatedAt', 'profile-bio', 'profileBio'].includes(key)) {
                content.appendChild(this.createReviewField(mapping[key] || key, value.toString()));
            }
        });

        if (!content.children.length) {
            const empty = document.createElement('p');
            empty.textContent = '\u6682\u65e0\u5185\u5bb9';
            content.appendChild(empty);
        }

        return content;
    }

    getReviewFieldMappings() {
        return {
            'daily': {
                'achievements': '今日成就',
                'reflections': '今日反思',
                'learnings': '关键学习',
                'gratitude': '感恩记录',
                'tomorrowPlan': '明日计划',
                'mood': '今日心情',
                'rating': '整体评分'
            },
            'weekly': {
                'goalProgress': '本周目标回顾',
                'efficiencyAnalysis': '效率分析',
                'timeAllocation': '时间分配分析',
                'weekHighlights': '本周亮点',
                'improvements': '改进方向',
                'relationships': '人际关系与协作'
            },
            'monthly': {
                'goalProgress': '本月目标回顾',
                'growth': '成长与突破',
                'analytics': '数据分析',
                'lessons': '经验总结',
                'improvements': '待改进事项'
            },
            'yearly': {
                'achievements': '年度成就盘点',
                'goals': '年度目标回顾',
                'growth': '个人成长',
                'lessons': '经验总结',
                'nextGoals': '明年展望'
            }
        };
    }

    createReviewField(label, value) {
        const field = document.createElement('div');
        field.className = 'review-field';

        const heading = document.createElement('h4');
        heading.textContent = label;

        field.appendChild(heading);
        if (value instanceof Node) {
            field.appendChild(value);
        } else {
            const fieldContent = document.createElement('div');
            fieldContent.className = 'field-content';
            String(value).split('\n').forEach((line, index) => {
                if (index > 0) fieldContent.appendChild(document.createElement('br'));
                fieldContent.appendChild(document.createTextNode(line));
            });
            field.appendChild(fieldContent);
        }

        return field;
    }

    createRatingDisplay(rating) {
        const wrapper = document.createElement('div');
        wrapper.className = 'rating-display';

        if (!rating || rating === 0) {
            const empty = document.createElement('span');
            empty.className = 'rating-text';
            empty.textContent = '\u672a\u8bc4\u5206';
            wrapper.appendChild(empty);
            return wrapper;
        }

        const stars = document.createElement('div');
        stars.className = 'rating-stars-display';
        for (let i = 1; i <= 10; i++) {
            const star = document.createElement('span');
            star.className = `star ${i <= rating ? 'filled' : ''}`;
            star.textContent = i <= rating ? '\u2605' : '\u2606';
            stars.appendChild(star);
        }

        const number = document.createElement('span');
        number.className = 'rating-number';
        number.textContent = ` ${rating}/10`;
        stars.appendChild(number);
        wrapper.appendChild(stars);
        return wrapper;
    }

    // 编辑历史记录
    editHistoryItem(key) {
        console.log('编辑历史记录项:', key);

        const parts = key.split('-');
        if (parts.length < 2) {
            console.error('无效的记录键名:', key);
            this.deleteInvalidRecord(key);
            return;
        }

        const type = parts[0];
        const dateStr = parts.slice(1).join('-'); // 处理日期中可能包含的连字符
        const date = new Date(dateStr);

        // 增强的日期验证
        if (isNaN(date.getTime())) {
            console.error('无效日期:', dateStr);
            this.deleteInvalidRecord(key);
            return;
        }

        // 检查日期范围（2020年到当前年份+1）
        const currentYear = new Date().getFullYear();
        const year = date.getFullYear();
        if (year < 2020 || year > currentYear + 1) {
            console.error('日期超出有效范围:', dateStr);
            this.deleteInvalidRecord(key);
            return;
        }

        // 检查是否为合理的未来日期（不超过一年）
        const now = new Date();
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        if (date > oneYearFromNow) {
            console.error('日期过于遥远:', dateStr);
            this.deleteInvalidRecord(key);
            return;
        }

        // 验证通过，更新当前状态
        this.currentType = type;
        this.currentDate = date;

        this.showReviewMainView();
        this.switchReviewType(type);
        this.updateDateDisplay();
        this.loadCurrentReview();
    }

    // 新增：删除无效记录的辅助方法
    deleteInvalidRecord(key) {
        if (this.reviews && this.reviews[key]) {
            delete this.reviews[key];
            this.saveReviews();
            console.log('已删除无效记录:', key);

            // 刷新历史记录显示
            if (document.getElementById('review-history-view').style.display !== 'none') {
                this.loadDetailedReviewHistory();
            }
            this.updateHistoryPreview();
        }
    }

    // 删除历史记录
    deleteHistoryItem(key) {
        if (confirm(t('confirmDeleteHistory'))) {
            delete this.reviews[key];
            this.saveReviews();
            this.loadDetailedReviewHistory();
        }
    }

    // 格式化复盘内容用于显示
    formatReviewForDisplay(review, type) {
        const fieldMappings = {
            'daily': {
                'achievements': '今日成就',
                'reflections': '今日反思',
                'learnings': '关键学习',
                'gratitude': '感恩记录',
                'tomorrowPlan': '明日计划',
                'mood': '今日心情',
                'rating': '整体评分'
            },
            'weekly': {
                'goalProgress': '本周目标回顾',
                'efficiencyAnalysis': '效率分析',
                'timeAllocation': '时间分配分析',
                'weekHighlights': '本周亮点',
                'improvements': '改进方向',
                'relationships': '人际关系与协作'
            },
            'monthly': {
                'goalProgress': '本月目标回顾',
                'growth': '成长与突破',
                'analytics': '数据分析',
                'lessons': '经验总结',
                'improvements': '待改进事项'
            },
            'yearly': {
                'achievements': '年度成就盘点',
                'goals': '年度目标回顾',
                'growth': '个人成长',
                'lessons': '经验总结',
                'nextGoals': '明年展望'
            }
        };

        const mapping = fieldMappings[type] || {};
        let html = '';

        Object.entries(review).forEach(([key, value]) => {
            if (key === 'mood') {
                const moodLabels = { '1': '很糟糕', '2': '不太好', '3': '一般', '4': '不错', '5': '很好' };
                html += `
                    <div class="review-field">
                        <h4>${mapping[key] || key}</h4>
                        <div class="field-content">${moodLabels[value] || value}</div>
                    </div>
                `;
            } else if (key === 'rating') {
                html += `
                    <div class="review-field">
                        <h4>${mapping[key] || key}</h4>
                        <div class="rating-display">
                            ${this.generateStarDisplay(value)}
                        </div>
                    </div>
                `;
            } else if (value && value.toString().trim() && !['date', 'type', 'updatedAt', 'profile-bio', 'profileBio'].includes(key)) {
                html += `
                    <div class="review-field">
                        <h4>${mapping[key] || key}</h4>
                        <div class="field-content">${value.toString().replace(/\n/g, '<br>')}</div>
                    </div>
                `;
            }
        });

        return html || '<p>暂无内容</p>';
    }

    // 生成星级显示
    generateStarDisplay(rating) {
        if (!rating || rating === 0) {
            return '<span class="rating-text">未评分</span>';
        }

        const stars = [];
        for (let i = 1; i <= 10; i++) {
            stars.push(`<span class="star ${i <= rating ? 'filled' : ''}">${i <= rating ? '★' : '☆'}</span>`);
        }
        return `<div class="rating-stars-display">${stars.join('')} <span class="rating-number">${rating}/10</span></div>`;
    }

    showMessage(message) {
        // 创建临时消息提示
        const messageEl = document.createElement('div');
        messageEl.className = 'review-message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary-gradient);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow-medium);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => messageEl.remove(), 300);
        }, 3000);
    }
}

// 全局复盘系统实例

window.ReviewSystem = ReviewSystem;
