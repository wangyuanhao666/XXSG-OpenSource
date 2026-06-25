// ===== 任务模板系统 =====

// 模板数据结构
// template = {
//     id: string,
//     name: string,
//     description: string,
//     priority: number (1-4),
//     tasks: array of { title: string, priority: number },
//     createdAt: string (ISO date),
//     updatedAt: string (ISO date)
// }

// 加载模板数据
function loadTemplates() {
    try {
        templates = window.ProductivityStorage
            ? window.ProductivityStorage.getTemplates('taskTemplates')
            : JSON.parse(localStorage.getItem('taskTemplates') || '[]');
    } catch (e) {
        console.error('加载模板数据失败:', e);
        templates = [];
    }
}

// 保存模板数据
function saveTemplates() {
    try {
        if (window.ProductivityStorage) {
            templates = window.ProductivityStorage.setTemplates('taskTemplates', templates);
        } else {
            localStorage.setItem('taskTemplates', JSON.stringify(templates));
        }
    } catch (e) {
        console.error('保存模板数据失败:', e);
    }
}

// 创建模板
function createTemplate(templateData) {
    const template = {
        id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: templateData.name,
        description: templateData.description || '',
        priority: templateData.priority || 4,
        tasks: templateData.tasks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    templates.unshift(template);
    saveTemplates();
    return template;
}

// 更新模板
function updateTemplate(templateId, templateData) {
    const index = templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
        templates[index] = {
            ...templates[index],
            ...templateData,
            id: templateId, // 保持原有ID
            updatedAt: new Date().toISOString()
        };
        saveTemplates();
        return templates[index];
    }
    return null;
}

// 删除模板
function deleteTemplate(templateId) {
    const index = templates.findIndex(t => t.id === templateId);
    if (index !== -1) {
        templates.splice(index, 1);
        saveTemplates();
        return true;
    }
    return false;
}


// 渲染模板列表
function renderTemplates() {
    const templatesGrid = document.getElementById('templates-grid');
    const templatesEmpty = document.getElementById('templates-empty');

    if (!templatesGrid || !templatesEmpty) return;

    if (templates.length === 0) {
        templatesGrid.style.display = 'none';
        templatesEmpty.style.display = 'block';
        return;
    }

    templatesEmpty.style.display = 'none';
    templatesGrid.style.display = 'grid';

    const priorityColors = {
        1: '#f44336', // 重要且紧急
        2: '#ff9800', // 重要不紧急
        3: '#2196f3', // 不重要但紧急
        4: '#4caf50'  // 不重要不紧急
    };

    const priorityLabels = {
        1: t('q1Title'),
        2: t('q2Title'),
        3: t('q3Title'),
        4: t('q4Title')
    };

    const fragment = document.createDocumentFragment();
    templates.forEach(template => {
        fragment.appendChild(createTemplateCard(template, priorityColors, priorityLabels));
    });
    templatesGrid.replaceChildren(fragment);
}

function createTemplateCard(template, priorityColors, priorityLabels) {
    const card = document.createElement('div');
    card.className = `template-card priority-${template.priority}`;
    card.dataset.templateId = template.id;

    const header = document.createElement('div');
    header.className = 'template-card-header';

    const title = document.createElement('h3');
    title.className = 'template-card-title';
    title.textContent = template.name;

    const actions = document.createElement('div');
    actions.className = 'template-card-actions';
    actions.append(
        createTemplateActionButton('edit', 'edit', t('editTemplate'), 'template-card-action'),
        createTemplateActionButton('delete', 'delete', t('deleteTemplate'), 'template-card-action danger')
    );

    const description = document.createElement('div');
    description.className = 'template-card-description';
    description.textContent = template.description || t('noDescription');

    const meta = document.createElement('div');
    meta.className = 'template-card-meta';

    const priority = document.createElement('div');
    priority.className = 'template-priority';
    const priorityDot = document.createElement('span');
    priorityDot.className = 'template-priority-dot';
    priorityDot.style.backgroundColor = priorityColors[template.priority];
    const priorityText = document.createElement('span');
    priorityText.textContent = priorityLabels[template.priority];
    priority.append(priorityDot, priorityText);

    const taskCount = document.createElement('div');
    taskCount.className = 'template-task-count';
    taskCount.textContent = `${template.tasks.length} ${t('tasks')}`;

    const footer = document.createElement('div');
    footer.className = 'template-card-footer';
    footer.append(
        createTemplateActionButton('apply', 'add_task', t('applyTemplate'), 'template-apply-btn', true),
        createTemplateActionButton('edit', 'edit', t('editTemplate'), 'template-edit-btn', true)
    );

    header.append(title, actions);
    meta.append(priority, taskCount);
    card.append(header, description, meta, footer);
    return card;
}

function createTemplateActionButton(action, iconName, label, className, showLabel = false) {
    const button = document.createElement('button');
    button.className = className;
    button.dataset.templateAction = action;
    button.title = label;

    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = iconName;
    button.appendChild(icon);

    if (showLabel) {
        const text = document.createElement('span');
        text.textContent = label;
        button.appendChild(text);
    }

    return button;
}

// 创建模板模态框
function showCreateTemplateModal() {
    const modal = document.getElementById('template-modal');
    const modalTitle = document.getElementById('template-modal-title');
    const templateId = document.getElementById('template-id');
    const templateName = document.getElementById('template-name');
    const templateDescription = document.getElementById('template-description');
    const templatePriority = document.getElementById('template-priority');
    const templateTasksList = document.getElementById('template-tasks-list');

    if (!modal) return;

    // 重置表单
    templateId.value = '';
    templateName.value = '';
    templateDescription.value = '';
    templatePriority.value = '4';
    templateTasksList.replaceChildren();

    // 设置标题
    modalTitle.textContent = t('createTemplate');

    // 显示模态框
    modal.style.display = 'block';

    // 添加一个默认任务项
    addTemplateTaskItem();
}

// 编辑模板模态框
function editTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const modal = document.getElementById('template-modal');
    const modalTitle = document.getElementById('template-modal-title');
    const templateIdInput = document.getElementById('template-id');
    const templateName = document.getElementById('template-name');
    const templateDescription = document.getElementById('template-description');
    const templatePriority = document.getElementById('template-priority');
    const templateTasksList = document.getElementById('template-tasks-list');

    if (!modal) return;

    // 填充表单
    templateIdInput.value = template.id;
    templateName.value = template.name;
    templateDescription.value = template.description;
    templatePriority.value = template.priority;

    // 设置标题
    modalTitle.textContent = t('editTemplate');

    // 渲染任务列表
    templateTasksList.replaceChildren();
    template.tasks.forEach(task => {
        addTemplateTaskItem(task.title);
    });

    // 如果没有任务，添加一个默认项
    if (template.tasks.length === 0) {
        addTemplateTaskItem();
    }

    // 显示模态框
    modal.style.display = 'block';
}

// 添加模板任务项
function addTemplateTaskItem(title = '') {
    const templateTasksList = document.getElementById('template-tasks-list');
    if (!templateTasksList) return;

    const taskItem = document.createElement('div');
    taskItem.className = 'template-task-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'template-task-input';
    input.placeholder = t('taskTitlePlaceholder');
    input.value = title;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'template-task-remove';
    removeButton.dataset.templateTaskAction = 'remove';
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = 'close';
    removeButton.appendChild(icon);

    taskItem.append(input, removeButton);

    templateTasksList.appendChild(taskItem);
}

// 移除模板任务项
function removeTemplateTaskItem(button) {
    const taskItem = button.closest('.template-task-item');
    if (taskItem) {
        taskItem.remove();
    }
}

// 保存模板
function saveTemplate() {
    const templateId = document.getElementById('template-id').value;
    const templateName = document.getElementById('template-name').value.trim();
    const templateDescription = document.getElementById('template-description').value.trim();
    const templatePriority = parseInt(document.getElementById('template-priority').value);
    const templateTasks = Array.from(document.querySelectorAll('.template-task-input'))
        .map(input => input.value.trim())
        .filter(title => title.length > 0);

    if (!templateName) {
        alert(t('pleaseEnterTemplateName'));
        return;
    }

    if (templateTasks.length === 0) {
        alert(t('pleaseAddAtLeastOneTask'));
        return;
    }

    const templateData = {
        name: templateName,
        description: templateDescription,
        priority: templatePriority,
        tasks: templateTasks.map(title => ({ title, priority: templatePriority }))
    };

    if (templateId) {
        // 更新现有模板
        updateTemplate(templateId, templateData);
    } else {
        // 创建新模板
        createTemplate(templateData);
    }

    // 关闭模态框
    closeTemplateModal();

    // 刷新模板列表
    renderTemplates();
}

// 关闭模板模态框
function closeTemplateModal() {
    const modal = document.getElementById('template-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 删除模板确认
async function deleteTemplateConfirm(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const confirmed = await showConfirmModal({
        title: '删除模板',
        message: t('confirmDeleteTemplate').replace('{name}', template.name),
        type: 'danger',
        confirmText: '删除',
        cancelText: '取消'
    });
    if (confirmed) {
        deleteTemplate(templateId);
        renderTemplates();
    }
}
// 应用模板
function applyTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return false;

    const newTasks = template.tasks.map(taskTemplate => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: taskTemplate.title,
        titleTranslations: {
            zh: taskTemplate.title,
            en: ''
        },
        completed: false,
        priority: taskTemplate.priority || template.priority,
        createdAt: new Date().toISOString(),
        startDate: null,
        endDate: null,
        pinned: false
    }));

    // 将新任务添加到任务列表开头
    tasks.unshift(...newTasks);
    saveTasks();

    // 刷新显示
    render();

    // 显示成功消息
    showPageNotification(t('templateAppliedSuccessfully'));
    return true;
}

// 模板筛选
function filterTemplates() {
    const priorityFilter = document.getElementById('template-priority-filter')?.value;
    const searchFilter = document.getElementById('template-search')?.value.toLowerCase();

    const filteredTemplates = templates.filter(template => {
        const matchesPriority = !priorityFilter || priorityFilter === 'all' || template.priority.toString() === priorityFilter;
        const matchesSearch = !searchFilter || template.name.toLowerCase().includes(searchFilter) ||
            template.description.toLowerCase().includes(searchFilter);
        return matchesPriority && matchesSearch;
    });

    // 临时替换模板数组进行渲染
    const originalTemplates = templates;
    templates = filteredTemplates;
    renderTemplates();
    templates = originalTemplates;
}

// 初始化模板系统
function initTemplateSystem() {
    loadTemplates();
    renderTemplates();

    // 绑定事件监听器
    const createTemplateBtn = document.getElementById('create-template-btn');
    const templateSaveBtn = document.getElementById('template-save-btn');
    const templateCancelBtn = document.getElementById('template-cancel-btn');
    const addTemplateTaskBtn = document.getElementById('add-template-task');
    const templatePriorityFilter = document.getElementById('template-priority-filter');
    const templateSearch = document.getElementById('template-search');
    const templatesGrid = document.getElementById('templates-grid');
    const templateTasksList = document.getElementById('template-tasks-list');

    if (createTemplateBtn) {
        createTemplateBtn.addEventListener('click', showCreateTemplateModal);
    }

    if (templateSaveBtn) {
        templateSaveBtn.addEventListener('click', saveTemplate);
    }

    if (templateCancelBtn) {
        templateCancelBtn.addEventListener('click', closeTemplateModal);
    }

    if (addTemplateTaskBtn) {
        addTemplateTaskBtn.addEventListener('click', () => addTemplateTaskItem());
    }

    if (templatePriorityFilter) {
        templatePriorityFilter.addEventListener('change', filterTemplates);
    }

    if (templateSearch) {
        templateSearch.addEventListener('input', filterTemplates);
    }

    if (templatesGrid && templatesGrid.dataset.templateEventsBound !== 'true') {
        templatesGrid.dataset.templateEventsBound = 'true';
        templatesGrid.addEventListener('click', event => {
            const actionButton = event.target.closest('[data-template-action]');
            if (!actionButton || !templatesGrid.contains(actionButton)) return;

            const templateId = actionButton.closest('.template-card')?.dataset.templateId;
            if (!templateId) return;

            const action = actionButton.dataset.templateAction;
            if (action === 'apply') {
                applyTemplate(templateId);
            } else if (action === 'edit') {
                editTemplate(templateId);
            } else if (action === 'delete') {
                deleteTemplateConfirm(templateId);
            }
        });
    }

    if (templateTasksList && templateTasksList.dataset.templateTaskEventsBound !== 'true') {
        templateTasksList.dataset.templateTaskEventsBound = 'true';
        templateTasksList.addEventListener('click', event => {
            const removeButton = event.target.closest('[data-template-task-action="remove"]');
            if (!removeButton || !templateTasksList.contains(removeButton)) return;
            removeTemplateTaskItem(removeButton);
        });
    }

    // 模态框关闭事件
    const templateModal = document.getElementById('template-modal');
    if (templateModal) {
        templateModal.addEventListener('click', (e) => {
            if (e.target === templateModal) {
                closeTemplateModal();
            }
        });

        const modalClose = templateModal.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', closeTemplateModal);
        }
    }
}

// 检查分享链接
function ensureFortuneSystem() {
    if (!window.fortuneSystem) {
        window.fortuneSystem = new FortuneSystem();
        selectedDate = window.fortuneSystem.selectedDate || selectedDate;
        updateCalendarDisplay();
    }
    return window.fortuneSystem;
}

function checkFortuneShareLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const fortuneParam = urlParams.get('fortune');

    if (fortuneParam) {
        try {
            // 解码分享数据
            const shareData = JSON.parse(atob(fortuneParam));

            // 验证数据格式
            if (shareData.fortune && shareData.date && shareData.version) {
                // 显示分享的签文
                showSharedFortune(shareData);

                // 清理URL参数
                const newUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        } catch (error) {
            console.error('解析分享链接失败:', error);
        }
    }
}

// 显示分享的签文
function showSharedFortune(shareData) {
    // 切换到每日一签视图
    switchView('fortune');

    // 显示分享提示
    setTimeout(() => {
        const message = currentLanguage === 'zh'
            ? '正在显示分享的签文...'
            : 'Showing shared fortune...';
        fortuneSystem.showMessage(message);

        // 显示分享的签文内容
        setTimeout(() => {
            displaySharedFortune(shareData.fortune);
        }, 1000);
    }, 500);
}

// 显示分享的签文内容
function displaySharedFortune(fortune) {
    const fortuneCard = document.getElementById('fortune-card');
    const fortuneEnvelope = document.getElementById('fortune-envelope');
    const fortuneContent = document.getElementById('fortune-content');
    const fortuneText = document.getElementById('fortune-text');
    const fortuneMeaning = document.getElementById('fortune-meaning');
    const fortuneAdvice = document.getElementById('fortune-advice');

    if (fortuneCard && fortuneEnvelope && fortuneContent && fortuneText && fortuneMeaning) {
        // 隐藏信封，显示内容
        fortuneEnvelope.style.display = 'none';
        fortuneContent.style.display = 'block';

        // 设置签文内容
        fortuneText.textContent = fortune.text;
        fortuneMeaning.textContent = fortune.meaning;

        if (fortune.advice && fortuneAdvice) {
            fortuneAdvice.textContent = fortune.advice;
        }

        // 显示分享按钮
        const shareBtn = document.getElementById('share-fortune-btn');
        const resetBtn = document.getElementById('reset-fortune-btn');
        const drawBtn = document.getElementById('draw-fortune-btn');

        if (shareBtn) shareBtn.style.display = 'inline-flex';
        if (resetBtn) resetBtn.style.display = 'inline-flex';
        if (drawBtn) drawBtn.style.display = 'none';

        // 添加分享标识
        const shareIndicator = document.createElement('div');
        shareIndicator.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ffd700;
            color: #333;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        `;
        shareIndicator.textContent = currentLanguage === 'zh' ? '分享' : 'Shared';
        fortuneCard.appendChild(shareIndicator);

        // 显示成功消息
        const message = currentLanguage === 'zh'
            ? '分享的签文已显示！'
            : 'Shared fortune displayed!';
        fortuneSystem.showMessage(message);
    }
}
