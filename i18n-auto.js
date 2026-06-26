(function () {
    const ZH_TO_EN = {
        '象限时光': 'Quadrant Time',
        '输入任务标题...': 'Enter task title...',
        'AI分析': 'AI Analysis',
        '提交': 'Submit',
        '重要且紧急': 'Important & Urgent',
        '重要不紧急': 'Important & Not Urgent',
        '不重要但紧急': 'Not Important & Urgent',
        '不重要且紧急': 'Not Important & Urgent',
        '不重要不紧急': 'Not Important & Not Urgent',
        '不重要紧急': 'Not Important & Urgent',
        '重要紧急': 'Important & Urgent',
        '全选': 'Select All',
        '选择全部': 'Select All',
        '默认排序': 'Default Sort',
        '导出数据': 'Export Data',
        '恢复数据': 'Restore Data',
        '删除所选': 'Delete Selected',
        '刷新数据': 'Refresh Data',
        '刷新': 'Refresh',
        '数据': 'Data',
        '导出': 'Export',
        '导入': 'Import',
        '保存': 'Save',
        '取消': 'Cancel',
        '关闭': 'Close',
        '确认': 'Confirm',
        '删除': 'Delete',
        '编辑': 'Edit',
        '返回': 'Back',
        '开始': 'Start',
        '暂停': 'Pause',
        '停止': 'Stop',
        '重置': 'Reset',
        '继续': 'Resume',
        '已完成': 'Completed',
        '未完成': 'Incomplete',
        '待完成': 'Pending',
        '已置顶': 'Pinned',
        '进行中': 'In Progress',
        '未分类': 'Uncategorized',
        '未知': 'Unknown',
        '无标题': 'Untitled',
        '未命名任务': 'Untitled Task',
        '高': 'High',
        '中': 'Medium',
        '低': 'Low',
        '开始时间': 'Start Time',
        '结束时间': 'End Time',
        '到期时间': 'Due Time',
        '创建时间': 'Created At',
        '优先级': 'Priority',
        '任务标题': 'Task Title',
        '任务描述': 'Task Description',
        '任务备注': 'Task Notes',
        '任务详情': 'Task Details',
        '总任务数': 'Total Tasks',
        '当前任务数': 'Current Tasks',
        '任务总数': 'Total Tasks',
        '总任务': 'Total Tasks',
        '总计': 'Total',
        '任务数量': 'Task Count',
        '数据可视化看板': 'Data Visualization Dashboard',
        '任务分类统计': 'Task Category Stats',
        '效率趋势分析': 'Efficiency Trend Analysis',
        '工作分布分析': 'Work Distribution Analysis',
        '效率评分': 'Efficiency Score',
        '显示已完成任务': 'Show completed tasks',
        '显示未完成任务': 'Show incomplete tasks',
        '刷新所有图表': 'Refresh all charts',
        '导出图表': 'Export charts',
        '图表已刷新': 'Charts refreshed',
        '图表导出功能开发中': 'Chart export is coming soon',
        '点击柱形筛选任务，双击查看详情': 'Click a bar to filter tasks, double-click for details',
        '点击柱形可筛选任务列表': 'Click a bar to filter the task list',
        '双击数据点查看当日详细任务': 'Double-click a point to view that day\'s tasks',
        '点击扇区筛选任务，双击查看详情': 'Click a slice to filter tasks, double-click for details',
        '双击查看详情': 'Double-click for details',
        '双击查看当日任务': 'Double-click to view that day\'s tasks',
        '暂无数据可显示': 'No data to display',
        '暂无任务': 'No tasks',
        '当日无任务': 'No tasks that day',
        '任务详情': 'Task Details',
        '个任务': 'tasks',
        '个': '',
        '共': 'Total',
        '近30天': 'Last 30 Days',
        '近90天': 'Last 90 Days',
        '按分类': 'By Category',
        '按象限': 'By Quadrant',
        '按状态': 'By Status',
        '今日': 'Today',
        '本周': 'This Week',
        '本月': 'This Month',
        '全部': 'All',
        '导出任务数据': 'Export Task Data',
        '选择格式和设置，导出您的任务数据': 'Choose a format and settings to export your task data',
        '选择导出格式': 'Choose Export Format',
        '电子表格格式，适合数据分析': 'Spreadsheet format for data analysis',
        '便携式文档，适合打印和分享': 'Portable document for printing and sharing',
        '文档格式，适合编辑和协作': 'Document format for editing and collaboration',
        '纯文本格式，适合版本控制': 'Plain text format for version control',
        '网页格式，适合在线查看': 'Web page format for online viewing',
        '预览': 'Preview',
        '选择导出格式查看预览': 'Choose an export format to preview',
        '导出设置': 'Export Settings',
        '包含已完成的任务': 'Include completed tasks',
        '包含任务备注': 'Include task notes',
        '包含创建日期': 'Include created dates',
        '包含创建和完成日期': 'Include created and completed dates',
        '包含优先级信息': 'Include priority information',
        '包含优先级详情': 'Include priority details',
        '更新预览': 'Update Preview',
        '开始导出': 'Start Export',
        '请先添加一些任务后再进行导出': 'Add some tasks before exporting',
        '格式预览': 'Format Preview',
        '预览内容生成失败': 'Failed to generate preview',
        '错误信息': 'Error',
        '导出时间': 'Export Time',
        '没有可导出的任务数据': 'No task data to export',
        '文件导出成功': 'file exported successfully',
        '导出失败，请重试': 'Export failed, please try again',
        '恢复数据': 'Restore Data',
        '从备份文件恢复您的任务数据': 'Restore your task data from a backup file',
        '重要警告': 'Important Warning',
        '恢复数据将覆盖当前的所有任务数据，此操作不可撤销！': 'Restoring data will overwrite all current task data. This action cannot be undone!',
        '请确保您已经备份了当前数据，或者确定要替换现有数据。': 'Make sure you have backed up current data, or that you really want to replace it.',
        '备份周期管理': 'Backup Cycle Management',
        '备份管理': 'Backup Management',
        '备份数量': 'Backups',
        '创建备份': 'Create Backup',
        '选择备份文件': 'Choose Backup File',
        '点击选择文件或拖拽文件到此处': 'Click to choose a file or drag it here',
        '支持 JSON、CSV、TXT 格式的备份文件': 'Supports JSON, CSV, and TXT backup files',
        '请选择备份文件查看预览...': 'Choose a backup file to preview...',
        '数据预览': 'Data Preview',
        '清除文件': 'Clear File',
        '开始恢复': 'Start Restore',
        '正在恢复数据，请稍候...': 'Restoring data, please wait...',
        '恢复成功': 'Restore Successful',
        '数据已成功恢复到系统中！': 'Data has been restored successfully!',
        '您可以返回主页查看恢复的任务数据。': 'You can return home to view restored tasks.',
        '备份文件包含': 'Backup file contains',
        '无法解析备份文件内容': 'Unable to parse backup file content',
        '请先选择备份文件': 'Choose a backup file first',
        '文件格式不正确，请选择有效的备份文件': 'Invalid file format. Choose a valid backup file',
        '数据恢复成功': 'Data restored successfully',
        '恢复数据失败，请检查文件格式': 'Restore failed. Check the file format',
        '暂无备份数据': 'No backup data',
        '暂无任务数据': 'No task data',
        '系统会自动创建备份，您也可以手动创建': 'The system creates backups automatically, and you can also create one manually',
        '手动备份': 'Manual Backup',
        '自动备份': 'Auto Backup',
        '首次使用，将创建新周期': 'First use, a new cycle will be created',
        '当前周期': 'Current Cycle',
        '下次清理': 'Next Cleanup',
        '清理过期': 'Clean Expired',
        '开始新周期': 'Start New Cycle',
        '第22周': 'Week 22',
        '第': 'Week ',
        '周': '',
        '备份不存在': 'Backup not found',
        '备份下载成功': 'Backup downloaded successfully',
        '备份已删除': 'Backup deleted',
        '立即清理': 'Clean Now',
        '每日一签': 'Daily Fortune',
        '番茄专注': 'Pomodoro Focus',
        '习惯打卡': 'Habit Tracker',
        '倒数纪念日': 'Countdown Days',
        '时间管理可视化看板': 'Time Analytics Dashboard',
        '沉浸式自然日历': 'Immersive Nature Calendar',
        'API 同步设置': 'API Sync Settings',
        '更多功能': 'More',
        '任务模板': 'Task Templates',
        '顶级复盘': 'Top Review',
        '可视化看板': 'Dashboard',
        '四象限视图': 'Four Quadrants',
        '添加任务': 'Add Task',
        '让重要的事不再匆忙，让匆忙的事不再重要': 'Make important things less rushed, and rushed things less important',
        '账号登录': 'Account Login',
        '管理员后台登录': 'Admin Login',
        '用户名或邮箱': 'Username or Email',
        '密码': 'Password',
        '记住我': 'Remember Me',
        '登录': 'Log In',
        '忘记密码？': 'Forgot password?',
        '数据同步': 'Data Sync',
        '还没有账号？本地注册 / 创建账号': 'No account yet? Create a local account',
        '还没有账号？': 'No account yet?',
        '本地注册 / 创建账号': 'Create a local account',
        '管理员后台': 'Admin Console'
    };

    Object.assign(ZH_TO_EN, {
        '工作习惯分析': 'Work Habit Analysis',
        '工作时间分布': 'Work Time Distribution',
        '效率曲线': 'Efficiency Curve',
        '任务偏好': 'Task Preference',
        '工作负荷': 'Workload',
        '个性建议': 'Personalized Suggestions',
        '最佳工作时间': 'Best Work Time',
        '高效时段提醒': 'High-Efficiency Time Reminder',
        '工作负荷提醒': 'Workload Reminder',
        '高峰时段': 'Peak Hours',
        'High峰时段': 'Peak Hours',
        '高效时段': 'High-Efficiency Period',
        '普通时段': 'Normal Period',
        '主要类型': 'Primary Type',
        '日均任务': 'Daily Tasks',
        '其他': 'Other',
        '高效': 'Efficient',
        '低效': 'Low Efficiency',
        '智能健康管理': 'Smart Health Management',
        '健康评分': 'Health Score',
        '工作强度': 'Work Intensity',
        '压力水平': 'Stress Level',
        '健康建议': 'Health Suggestions',
        '工作强度趋势': 'Work Intensity Trend',
        '压力水平趋势': 'Stress Level Trend',
        '工作强度过高': 'Work Intensity Too High',
        '压力水平较高': 'Stress Level Is High',
        '您已经工作较长时间，建议休息一下': 'You have been working for a long time. Consider taking a break.',
        '建议按时用餐，选择营养均衡的食物': 'Eat on time and choose balanced, nutritious food.',
        '已经工作较长时间，建议休息一下': 'You have been working for a long time. Consider taking a break.',
        '建议按时用餐': 'Eat on time',
        '选择营养均衡的食物': 'choose balanced, nutritious food',
        '智能任务分解': 'Smart Task Breakdown',
        '分解状态': 'Breakdown Status',
        '分解进度': 'Breakdown Progress',
        '复杂度': 'Complexity',
        '待分解': 'Pending Breakdown',
        '待分析': 'Pending Analysis',
        '正在分析任务复杂度...': 'Analyzing task complexity...',
        '任务复杂度较低，无需分解': 'Task complexity is low. No breakdown needed.',
        '复杂度阈值': 'Complexity Threshold',
        '智能日程规划': 'Smart Schedule Planning',
        '今日日程': "Today's Schedule",
        '今日时间线': "Today's Timeline",
        'Today日程': "Today's Schedule",
        'Today时间线': "Today's Timeline",
        '时间利用率': 'Time Utilization',
        '效率优化': 'Efficiency Optimization',
        '已生成': 'Generated',
        '良好': 'Good',
        '智能提醒系统': 'Smart Reminder System',
        '工作负荷监控': 'Workload Monitoring',
        '疲劳检测': 'Fatigue Detection',
        '疲劳状态': 'Fatigue Status',
        '最佳执行时间': 'Best Execution Time',
        '启用工作负荷提醒': 'Enable workload reminders',
        '启用疲劳检测提醒': 'Enable fatigue detection reminders',
        '工作强度检查': 'Work intensity check',
        '疲劳检测提醒': 'Fatigue detection reminder',
        '工作负荷过高提醒': 'High workload reminder',
        '当前工作负荷较高，建议适当休息或调整任务分配': 'Current workload is high. Consider resting or adjusting task allocation.',
        '设置': 'Settings',
        '系统设置': 'System Settings',
        '音效设置': 'Sound Settings',
        '时间设置': 'Time Settings',
        '提醒设置': 'Reminder Settings',
        '主题设置': 'Theme Settings',
        '默认视图': 'Default View',
        '启用': 'Enable',
        '开启': 'Enable',
        '禁用': 'Disable',
        '不提醒': 'No Reminder',
        '提前': 'Before',
        '分钟': 'Minutes',
        '小时': 'Hour',
        '阈值': 'Threshold',
        '检查': 'Check',
        '频率': 'Frequency',
        '保存设置': 'Save Settings',
        '测试音效': 'Test Sound',
        '音量': 'Volume',
        '工作完成音效': 'Work Completion Sound',
        '休息开始音效': 'Break Start Sound',
        '工作时间': 'Work Time',
        '短休息时间': 'Short Break Time',
        '长休息时间': 'Long Break Time',
        '选择专注任务': 'Select Focus Task',
        '暂无任务，请先添加任务': 'No tasks yet. Add a task first.',
        '专注': 'Focus',
        '番茄倒计时': 'Pomodoro Timer',
        '正计时': 'Count Up',
        '时间管理': 'Time Management',
        '类别管理': 'Category Management',
        '添加新类别': 'Add Category',
        '添加时间记录': 'Add Time Record',
        '今日时间记录': "Today's Time Records",
        '剩余清醒时间': 'Awake Time Left',
        '今日总计': 'Today Total',
        '时间分配': 'Time Distribution',
        '趋势分析': 'Trend Analysis',
        '目标追踪': 'Goal Tracking',
        '筛选': 'Filter',
        '主页': 'Home',
        '统计': 'Stats',
        '日历': 'Calendar',
        '快速创建': 'Quick Create',
        '我的日历': 'My Calendars',
        '新建事件': 'Create Event',
        '编辑事件': 'Edit Event',
        '删除事件': 'Delete Event',
        '事件标题': 'Event Title',
        '日期': 'Date',
        '地点': 'Location',
        '所属类别': 'Category',
        '描述': 'Description',
        '工作日程': 'Work',
        '团队协作': 'Team',
        '个人生活': 'Personal',
        '深度专注': 'Deep Focus',
        '快速创建': 'Quick Create',
        '任务同步': 'Task Sync',
        '从四象限同步任务': 'Sync Tasks from Quadrants',
        '同步选中任务': 'Sync Selected Tasks',
        '取消全选': 'Deselect All',
        '已选择': 'Selected',
        '任务': 'Tasks',
        '日程规划': 'Schedule Planning',
        '日程': 'Schedule',
        '时间线': 'Timeline',
        '在线': 'Online',
        '离线': 'Offline'
    });

    const EN_TO_ZH = Object.entries(ZH_TO_EN).reduce((result, [zh, en]) => {
        if (en && !result[en]) result[en] = zh;
        return result;
    }, {});
    const originalText = new WeakMap();
    const originalAttrs = new WeakMap();
    const textKeys = Object.keys(ZH_TO_EN).sort((a, b) => b.length - a.length);
    const reverseTextKeys = Object.keys(EN_TO_ZH).sort((a, b) => b.length - a.length);
    const textRegex = /[\u4e00-\u9fff]/;
    const skippedSelector = [
        'script',
        'style',
        'noscript',
        'textarea',
        'input',
        '[contenteditable="true"]',
        '.task-title',
        '.task-name',
        '.task-text',
        '.task-content',
        '.task-description',
        '.task-notes',
        '.notes-text',
        '.task-item-title',
        '.task-card-title',
        '.habit-name',
        '.habit-notes',
        '.calendar-event-title',
        '.event-title'
    ].join(',');

    function getLanguage() {
        return localStorage.getItem('language') || document.documentElement.lang?.slice(0, 2) || 'zh';
    }

    function translateString(value) {
        if (!value || !textRegex.test(value)) return value;

        let result = value;
        textKeys.forEach(source => {
            if (result.includes(source)) {
                result = result.split(source).join(ZH_TO_EN[source]);
            }
        });
        return result;
    }

    function restoreString(value) {
        if (!value) return value;

        let result = value;
        reverseTextKeys.forEach(source => {
            if (result.includes(source)) {
                result = result.split(source).join(EN_TO_ZH[source]);
            }
        });
        return result;
    }

    function shouldSkipElement(element) {
        return !element || element.closest(skippedSelector);
    }

    function translateTextNode(node, language) {
        const parent = node.parentElement;
        if (shouldSkipElement(parent)) return;

        const currentValue = node.nodeValue;
        if (textRegex.test(currentValue)) {
            originalText.set(node, currentValue);
        } else if (!originalText.has(node)) {
            originalText.set(node, node.nodeValue);
        }

        const sourceValue = originalText.get(node);
        let nextValue;
        if (language === 'en') {
            nextValue = translateString(sourceValue);
        } else if (textRegex.test(currentValue)) {
            nextValue = currentValue;
        } else if (sourceValue && textRegex.test(sourceValue)) {
            nextValue = sourceValue;
        } else {
            nextValue = restoreString(currentValue);
        }

        if (node.nodeValue !== nextValue) {
            node.nodeValue = nextValue;
        }
    }

    function translateAttributes(element, language) {
        if (!element || shouldSkipElement(element)) return;
        ['title', 'placeholder', 'aria-label', 'alt'].forEach(attr => {
            if (!element.hasAttribute(attr)) return;

            let store = originalAttrs.get(element);
            if (!store) {
                store = {};
                originalAttrs.set(element, store);
            }

            const currentValue = element.getAttribute(attr);
            if (textRegex.test(currentValue)) {
                store[attr] = currentValue;
            } else if (!Object.prototype.hasOwnProperty.call(store, attr)) {
                store[attr] = currentValue;
            }

            const sourceValue = store[attr];
            let nextValue;
            if (language === 'en') {
                nextValue = translateString(sourceValue);
            } else if (textRegex.test(currentValue)) {
                nextValue = currentValue;
            } else if (sourceValue && textRegex.test(sourceValue)) {
                nextValue = sourceValue;
            } else {
                nextValue = restoreString(currentValue);
            }

            if (element.getAttribute(attr) !== nextValue) {
                element.setAttribute(attr, nextValue);
            }
        });
    }

    function apply(root = document) {
        const language = getLanguage();
        document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
        document.title = language === 'en' ? translateString(document.title) : (originalTitle || document.title);

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                if (shouldSkipElement(node.parentElement)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => translateTextNode(node, language));

        const elements = root.nodeType === Node.ELEMENT_NODE ? [root, ...root.querySelectorAll('*')] : [...document.querySelectorAll('*')];
        elements.forEach(element => translateAttributes(element, language));
    }

    const originalTitle = document.title;
    let observer = null;
    let scheduled = false;

    function scheduleApply() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            apply(document);
        });
    }

    function start() {
        apply(document);
        observer = new MutationObserver(mutations => {
            if (getLanguage() !== 'en') return;
            if (mutations.some(mutation => mutation.addedNodes.length || mutation.type === 'characterData')) {
                scheduleApply();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    window.XXSG_I18N = {
        apply,
        translateString,
        dictionary: ZH_TO_EN
    };

    window.addEventListener('xxsg:language-changed', scheduleApply);
    window.addEventListener('storage', event => {
        if (event.key === 'language') scheduleApply();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
})();
