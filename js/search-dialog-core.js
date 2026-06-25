(function () {
    'use strict';

function runtime() {
        return window.XXSGAppRuntime || {};
    }

    function getPriorityText(priority) {
        switch (priority) {
            case 1: return t('q1Title'); // 重要且紧急
            case 2: return t('q2Title'); // 重要不紧急
            case 3: return t('q3Title'); // 不重要但紧急
            case 4: return t('q4Title'); // 不重要不紧急
            default: return t('uncategorized');
        }
    }

    function showSearchDialog() {
        const searchDialog = document.createElement('div');
        searchDialog.id = 'search-dialog';
        searchDialog.appendChild(createSearchDialogOverlay());

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .search-dialog-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease-out;
            }

            .search-dialog-content {
                background: var(--card-bg);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-xl);
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow: hidden;
                animation: slideInUp 0.3s ease-out;
            }

            .search-dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid var(--border-color);
            }

            .search-dialog-header h3 {
                margin: 0;
                color: var(--text-primary);
            }

            .search-dialog-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--text-muted);
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-sm);
                transition: all 0.2s ease;
            }

            .search-dialog-close:hover {
                background: var(--bg-secondary);
                color: var(--text-primary);
            }

            .search-dialog-body {
                padding: 20px;
            }

            #search-input {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid var(--border-color);
                border-radius: var(--radius-md);
                font-size: 1rem;
                outline: none;
                transition: border-color 0.2s ease;
            }

            #search-input:focus {
                border-color: var(--primary-color);
            }

            .search-results {
                margin-top: 16px;
                max-height: 400px;
                overflow-y: auto;
            }

            .search-result-item {
                padding: 12px;
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .search-result-item:hover {
                background: var(--bg-secondary);
                border-color: var(--primary-color);
            }

            .search-result-title {
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 4px;
            }

            .search-result-meta {
                font-size: 0.875rem;
                color: var(--text-muted);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideInUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(searchDialog);

        // 绑定事件
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        const closeBtn = document.querySelector('.search-dialog-close');

        // 搜索功能
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length < 2) {
                searchResults.replaceChildren();
                return;
            }

            const results = searchTasks(query);
            displaySearchResults(results, searchResults);
        });

        // 关闭对话框
        closeBtn.addEventListener('click', () => {
            searchDialog.remove();
        });

        searchDialog.addEventListener('click', (e) => {
            if (e.target === searchDialog.querySelector('.search-dialog-overlay')) {
                searchDialog.remove();
            }
        });

        // ESC键关闭
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                searchDialog.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    function createSearchDialogOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'search-dialog-overlay';
        const content = document.createElement('div');
        content.className = 'search-dialog-content';

        const header = document.createElement('div');
        header.className = 'search-dialog-header';
        const title = document.createElement('h3');
        title.textContent = '搜索任务';
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'search-dialog-close';
        close.textContent = '×';
        header.append(title, close);

        const body = document.createElement('div');
        body.className = 'search-dialog-body';
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'search-input';
        input.placeholder = '输入任务标题或描述...';
        input.autofocus = true;
        const results = document.createElement('div');
        results.id = 'search-results';
        results.className = 'search-results';
        body.append(input, results);

        content.append(header, body);
        overlay.appendChild(content);
        return overlay;
    }

    function searchTasks(query) {
        const results = [];
        const lowerQuery = query.toLowerCase();

        (runtime().tasks || []).forEach(task => {
            const title = task.title.toLowerCase();
            const description = (task.description || '').toLowerCase();

            if (title.includes(lowerQuery) || description.includes(lowerQuery)) {
                results.push({
                    ...task,
                    matchType: title.includes(lowerQuery) ? 'title' : 'description'
                });
            }
        });

        return results;
    }

    function displaySearchResults(results, container) {
        container.replaceChildren();

        if (results.length === 0) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'search-result-item';
            emptyItem.textContent = t('noTasksFound');
            container.appendChild(emptyItem);
            return;
        }

        results.forEach(task => {
            const item = createSearchResultItem(task);
            item.addEventListener('click', () => {
                const currentTask = (runtime().tasks || []).find(t => String(t.id) === String(task.id));
                if (currentTask) {
                    // 切换到任务列表视图并高亮任务
                    switchView('list');
                    setTimeout(() => {
                        highlightTask(String(task.id));
                    }, 100);
                }
                const dialog = document.getElementById('search-dialog');
                if (dialog) dialog.remove();
            });
            container.appendChild(item);
        });
    }

    function createSearchResultItem(task) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.dataset.taskId = task.id;

        const title = document.createElement('div');
        title.className = 'search-result-title';
        title.textContent = task.title || t('untitledTask') || 'Untitled';

        const meta = document.createElement('div');
        meta.className = 'search-result-meta';
        const createdAt = task.createdAt ? new Date(task.createdAt) : null;
        const createdText = createdAt && !Number.isNaN(createdAt.getTime())
            ? createdAt.toLocaleDateString()
            : '-';
        meta.textContent = [
            `${t('priority')}: ${getPriorityText(task.priority)}`,
            `${t('status')}: ${task.completed ? t('taskStatusCompleted') : t('taskStatusPending')}`,
            `${t('creationTime')}: ${createdText}`
        ].join(' | ');

        item.append(title, meta);
        return item;
    }

    function highlightTask(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.style.background = 'var(--primary-color)';
            taskElement.style.color = 'white';
            taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
                taskElement.style.background = '';
                taskElement.style.color = '';
            }, 3000);
        }
    }

    function closeAllModals() {
        const modals = document.querySelectorAll('.modal, #search-dialog');
        modals.forEach(modal => {
            if (modal.style.display !== 'none') {
                modal.style.display = 'none';
            }
        });
    }

    window.showSearchDialog = showSearchDialog;
    window.searchTasks = searchTasks;
    window.displaySearchResults = displaySearchResults;
    window.highlightTask = highlightTask;
    window.closeAllModals = closeAllModals;
})();
