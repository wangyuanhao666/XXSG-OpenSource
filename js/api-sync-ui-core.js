// API sync settings modal and manual sync actions.
// Extracted from script.js; task data is read through window.XXSGAppRuntime.

function getAPISyncTasks() {
    return window.XXSGAppRuntime?.tasks || [];
}

function showAPISyncModal() {
    // 创建模态框（如果不存在）
    let modal = document.getElementById('api-sync-modal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'api-sync-modal';
        modal.className = 'modal';
        modal.append(createAPISyncModalContent());
        document.body.appendChild(modal);
    }

    // 初始化状态
    const isEnabled = window.DataSyncStorage.getRaw('enableAPISync') === 'true';
    document.getElementById('api-sync-switch').checked = isEnabled;

    // 显示模态框
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // 更新状态
    updateAPIStatus();
}

function createAPISyncModalContent() {
    const content = document.createElement('div');
    content.className = 'modal-content api-sync-modal-content';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeAPISyncModal);

    const title = document.createElement('h2');
    title.className = 'api-sync-title';
    title.textContent = '🔄 API 同步设置';

    const autoSection = createAPISyncSection();
    const autoLayout = document.createElement('div');
    autoLayout.className = 'api-sync-auto-layout';

    const autoText = document.createElement('div');
    const autoTitle = document.createElement('h3');
    autoTitle.className = 'api-sync-section-title api-sync-section-title-compact';
    autoTitle.textContent = '自动同步';
    const autoDesc = document.createElement('p');
    autoDesc.className = 'api-sync-description';
    autoDesc.textContent = '每次任务变更时自动同步到 API 服务器';
    autoText.append(autoTitle, autoDesc);

    const switchLabel = document.createElement('label');
    switchLabel.className = 'switch api-sync-switch';
    const syncSwitch = document.createElement('input');
    syncSwitch.type = 'checkbox';
    syncSwitch.id = 'api-sync-switch';
    syncSwitch.addEventListener('change', toggleAPISync);
    const slider = document.createElement('span');
    slider.className = 'slider api-sync-slider';
    switchLabel.append(syncSwitch, slider);
    autoLayout.append(autoText, switchLabel);
    autoSection.appendChild(autoLayout);

    const status = document.createElement('div');
    status.id = 'api-sync-status';
    status.className = 'api-sync-status';

    const serverSection = createAPISyncSection();
    const serverTitle = document.createElement('h3');
    serverTitle.className = 'api-sync-section-title';
    serverTitle.textContent = '📡 API 服务器信息';
    serverSection.append(
        serverTitle,
        createAPISyncInfoLine('地址: ', 'http://localhost:30301'),
        createAPISyncInfoLine('数据文件: ', 'tasks-data.json', true)
    );

    const statsSection = createAPISyncSection();
    const statsTitle = document.createElement('h3');
    statsTitle.className = 'api-sync-section-title';
    statsTitle.textContent = '📊 任务统计';
    const statsGrid = document.createElement('div');
    statsGrid.className = 'api-sync-stats-grid';
    [
        ['api-total-tasks', '总数'],
        ['api-active-tasks', '未完成'],
        ['api-q1-tasks', '重要紧急'],
        ['api-q2-tasks', '重要不急']
    ].forEach(([id, label]) => statsGrid.appendChild(createAPISyncStat(id, label)));
    statsSection.append(statsTitle, statsGrid);

    const actions = document.createElement('div');
    actions.className = 'api-sync-actions';
    const syncBtn = createAPISyncButton('立即同步', 'btn-primary api-sync-action-primary');
    syncBtn.addEventListener('click', syncToAPINow);
    const refreshBtn = createAPISyncButton('刷新状态', 'btn-secondary api-sync-action-secondary');
    refreshBtn.addEventListener('click', updateAPIStatus);
    actions.append(syncBtn, refreshBtn);

    content.append(closeBtn, title, autoSection, status, serverSection, statsSection, actions);
    return content;
}

function createAPISyncSection() {
    const section = document.createElement('div');
    section.className = 'api-sync-section';
    return section;
}

function createAPISyncInfoLine(label, code, hasTopMargin = false) {
    const line = document.createElement('p');
    line.className = hasTopMargin ? 'api-sync-info-line api-sync-info-line-spaced' : 'api-sync-info-line';
    const codeEl = document.createElement('code');
    codeEl.className = 'api-sync-code';
    codeEl.textContent = code;
    line.append(document.createTextNode(label), codeEl);
    return line;
}

function createAPISyncStat(id, label) {
    const item = document.createElement('div');
    item.className = 'api-sync-stat';
    const value = document.createElement('div');
    value.className = 'stat-value api-sync-stat-value';
    value.id = id;
    value.textContent = '-';
    const labelEl = document.createElement('div');
    labelEl.className = 'api-sync-stat-label';
    labelEl.textContent = label;
    item.append(value, labelEl);
    return item;
}

function createAPISyncButton(text, className) {
    const button = document.createElement('button');
    button.className = className;
    button.textContent = text;
    return button;
}

function closeAPISyncModal() {
    const modal = document.getElementById('api-sync-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function toggleAPISync() {
    const isEnabled = document.getElementById('api-sync-switch').checked;
    window.DataSyncStorage.setRaw('enableAPISync', isEnabled.toString());

    if (isEnabled) {
        // 启用后立即同步一次
        syncToAPINow();
        showAPIStatus('success', '✅ 自动同步已启用！任务数据将实时同步到 API 服务器。');
    } else {
        showAPIStatus('info', 'ℹ️ 自动同步已禁用。');
    }

    // 更新卡片上的状态文本
    updateAPISyncCardStatus();
}

async function updateAPIStatus() {
    const statusEl = document.getElementById('api-sync-status');

    try {
        const response = await fetch('http://localhost:30301/api/health');
        if (!response.ok) throw new Error('API 服务器未响应');

        const statsRes = await fetch('http://localhost:30301/api/tasks/stats/summary');
        const statsData = await statsRes.json();

        if (statsData.success) {
            document.getElementById('api-total-tasks').textContent = statsData.stats.total;
            document.getElementById('api-active-tasks').textContent = statsData.stats.active;
            document.getElementById('api-q1-tasks').textContent = statsData.stats.byQuadrant[1].count;
            document.getElementById('api-q2-tasks').textContent = statsData.stats.byQuadrant[2].count;

            const isEnabled = window.DataSyncStorage.getRaw('enableAPISync') === 'true';
            if (isEnabled) {
                showAPIStatus('success', `✅ API 服务器连接正常，已同步 ${statsData.stats.total} 个任务`);
            } else {
                showAPIStatus('info', `ℹ️ API 服务器运行中，当前有 ${statsData.stats.total} 个任务（自动同步未启用）`);
            }
        }
    } catch (error) {
        showAPIStatus('error', '❌ 无法连接到 API 服务器，请先运行 `npm start` 启动服务器');
    }
}

async function syncToAPINow() {
    try {
        const response = await fetch('http://localhost:30301/api/tasks/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks: getAPISyncTasks() })
        });

        const data = await response.json();

        if (data.success) {
            showAPIStatus('success', `✅ 同步成功！已同步 ${data.count} 个任务到 API 服务器`);
            updateAPIStatus();
        } else {
            throw new Error(data.error || '同步失败');
        }
    } catch (error) {
        showAPIStatus('error', '❌ 同步失败: ' + error.message);
    }
}

function showAPIStatus(type, message) {
    const statusEl = document.getElementById('api-sync-status');
    statusEl.style.display = 'block';
    statusEl.classList.remove('api-sync-status-success', 'api-sync-status-error', 'api-sync-status-info');
    statusEl.classList.add(`api-sync-status-${type === 'success' || type === 'error' ? type : 'info'}`);

    statusEl.textContent = message;
}

function updateAPISyncCardStatus() {
    const statusText = document.getElementById('api-sync-status-text');
    if (statusText) {
        const isEnabled = window.DataSyncStorage.getRaw('enableAPISync') === 'true';
        statusText.textContent = isEnabled ? '已启用' : '未启用';
    }
}


window.showAPISyncModal = showAPISyncModal;
window.closeAPISyncModal = closeAPISyncModal;
window.toggleAPISync = toggleAPISync;
window.updateAPIStatus = updateAPIStatus;
window.syncToAPINow = syncToAPINow;
window.showAPIStatus = showAPIStatus;
window.updateAPISyncCardStatus = updateAPISyncCardStatus;
