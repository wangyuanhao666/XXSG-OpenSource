function showSettingsModal() {
    console.log('⚙️ 显示账户设置模态框');
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        // 加载当前设置
        loadSettings();
        settingsModal.style.display = 'block';

        // 禁用背景页面滚动，避免双滚动条
        document.body.style.overflow = 'hidden';

        console.log('✅ 账户设置模态框已显示');
    } else {
        console.error('❌ 未找到设置模态框元素');
    }
}

// ==================== 头像更换功能 ====================

// 显示头像更换模态框
function showAvatarChangeModal() {
    console.log('🖼️ 显示头像更换模态框');

    const modal = document.createElement('div');
    modal.className = 'avatar-change-modal';
    modal.append(createAvatarChangeOverlay(), createAvatarChangeContent());

    document.body.appendChild(modal);

    // 加载当前头像
    loadCurrentAvatar();
}

function createAvatarChangeOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.addEventListener('click', closeAvatarChangeModal);
    return overlay;
}

function createAvatarChangeContent() {
    const content = document.createElement('div');
    content.className = 'modal-content';

    const header = document.createElement('div');
    header.className = 'modal-header';
    const title = document.createElement('h3');
    title.textContent = '🖼️ 更换头像';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeAvatarChangeModal);
    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.className = 'modal-body';
    const options = document.createElement('div');
    options.className = 'avatar-options';
    options.append(createAvatarUploadSection(), createAvatarPresetSection(), createAvatarPreviewSection());
    body.appendChild(options);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.type = 'button';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', closeAvatarChangeModal);
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn-primary';
    saveBtn.type = 'button';
    saveBtn.textContent = '保存头像';
    saveBtn.addEventListener('click', saveAvatarChange);
    footer.append(cancelBtn, saveBtn);

    content.append(header, body, footer);
    return content;
}

function createAvatarUploadSection() {
    const section = document.createElement('div');
    section.className = 'option-section';
    const title = document.createElement('h4');
    title.textContent = '📁 上传新头像';

    const uploadArea = document.createElement('div');
    uploadArea.className = 'upload-area';
    uploadArea.addEventListener('click', triggerFileInput);
    const icon = document.createElement('div');
    icon.className = 'upload-icon';
    icon.textContent = '📁';
    const text = document.createElement('div');
    text.className = 'upload-text';
    const primary = document.createElement('p');
    primary.textContent = '点击选择图片';
    const secondary = document.createElement('small');
    secondary.textContent = '支持 JPG、PNG、GIF 格式，最大 5MB';
    text.append(primary, secondary);
    uploadArea.append(icon, text);

    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'avatar-file-input';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.addEventListener('change', handleAvatarUpload);

    section.append(title, uploadArea, input);
    return section;
}

function createAvatarPresetSection() {
    const section = document.createElement('div');
    section.className = 'option-section';
    const title = document.createElement('h4');
    title.textContent = '🎨 选择预设头像';
    const presets = document.createElement('div');
    presets.className = 'preset-avatars';

    [
        ['default', '', 'person', '默认头像'],
        ['male', 'male', 'face', '男性头像'],
        ['female', 'female', 'face', '女性头像'],
        ['business', 'business', 'business_center', '商务头像'],
        ['creative', 'creative', 'palette', '创意头像'],
        ['tech', 'tech', 'computer', '科技头像']
    ].forEach(([type, circleClass, iconName, label]) => {
        presets.appendChild(createAvatarPreset(type, circleClass, iconName, label));
    });

    section.append(title, presets);
    return section;
}

function createAvatarPreset(type, circleClass, iconName, label) {
    const preset = document.createElement('div');
    preset.className = 'avatar-preset';
    preset.dataset.avatar = type;
    preset.addEventListener('click', () => selectPresetAvatar(type, preset));

    const circle = document.createElement('div');
    circle.className = circleClass ? `preset-circle ${circleClass}` : 'preset-circle';
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = iconName;
    circle.appendChild(icon);

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    preset.append(circle, labelEl);
    return preset;
}

function createAvatarPreviewSection() {
    const section = document.createElement('div');
    section.className = 'option-section';
    const title = document.createElement('h4');
    title.textContent = '🎯 当前头像预览';
    const wrapper = document.createElement('div');
    wrapper.className = 'current-avatar-preview';
    const preview = document.createElement('div');
    preview.className = 'preview-circle';
    preview.id = 'avatar-preview';
    renderAvatarPreset(preview, 'default');
    const label = document.createElement('p');
    label.textContent = '预览效果';
    wrapper.append(preview, label);
    section.append(title, wrapper);
    return section;
}

// 关闭头像更换模态框
function closeAvatarChangeModal() {
    const modal = document.querySelector('.avatar-change-modal');
    if (modal) {
        modal.remove();
    }
}

// 触发文件选择
function triggerFileInput() {
    document.getElementById('avatar-file-input').click();
}

// 处理头像上传
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 检查文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
        showNotification('文件大小不能超过 5MB', 'error');
        return;
    }

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
        showNotification('请选择图片文件', 'error');
        return;
    }

    // 预览上传的图片，并打开编辑器
    const reader = new FileReader();
    reader.onload = function (e) {
        showAvatarEditor(e.target.result);
    };
    reader.readAsDataURL(file);
}

// 显示头像编辑器（支持拖动和缩放）
function showAvatarEditor(imageData) {
    const editorModal = document.createElement('div');
    editorModal.className = 'avatar-editor-modal';
    editorModal.append(createAvatarEditorOverlay(), createAvatarEditorContent());

    document.body.appendChild(editorModal);

    // 初始化编辑器
    initAvatarEditor(imageData);
}

function createAvatarEditorOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'editor-overlay';
    overlay.addEventListener('click', closeAvatarEditor);
    return overlay;
}

function createAvatarEditorContent() {
    const content = document.createElement('div');
    content.className = 'editor-content';

    const header = document.createElement('div');
    header.className = 'editor-header';
    const title = document.createElement('h3');
    title.textContent = '🖼️ 编辑头像';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'editor-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeAvatarEditor);
    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.className = 'editor-body';
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'editor-canvas-container';
    const canvas = document.createElement('canvas');
    canvas.id = 'avatarCanvas';
    canvas.width = 400;
    canvas.height = 400;
    const instructions = document.createElement('div');
    instructions.className = 'editor-instructions';
    ['👆 拖动图片调整位置', '🔍 滚轮缩放图片'].forEach(text => {
        const line = document.createElement('p');
        line.textContent = text;
        instructions.appendChild(line);
    });
    canvasContainer.append(canvas, instructions);

    const controls = document.createElement('div');
    controls.className = 'editor-controls';
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    const zoomOutBtn = createAvatarEditorIconButton('zoom-btn', 'zoom_out');
    zoomOutBtn.addEventListener('click', () => zoomAvatar(-0.1));
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'zoom-label';
    zoomLabel.append(document.createTextNode('缩放: '));
    const zoomLevel = document.createElement('span');
    zoomLevel.id = 'zoomLevel';
    zoomLevel.textContent = '100%';
    zoomLabel.appendChild(zoomLevel);
    const zoomInBtn = createAvatarEditorIconButton('zoom-btn', 'zoom_in');
    zoomInBtn.addEventListener('click', () => zoomAvatar(0.1));
    zoomControls.append(zoomOutBtn, zoomLabel, zoomInBtn);

    const positionControls = document.createElement('div');
    positionControls.className = 'position-controls';
    const resetBtn = createAvatarEditorIconButton('reset-btn', 'restart_alt', '重置');
    resetBtn.addEventListener('click', resetAvatarPosition);
    positionControls.appendChild(resetBtn);
    controls.append(zoomControls, positionControls);
    body.append(canvasContainer, controls);

    const footer = document.createElement('div');
    footer.className = 'editor-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.type = 'button';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', closeAvatarEditor);
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-primary';
    confirmBtn.type = 'button';
    confirmBtn.textContent = '确认使用';
    confirmBtn.addEventListener('click', confirmAvatarEdit);
    footer.append(cancelBtn, confirmBtn);

    content.append(header, body, footer);
    return content;
}

function createAvatarEditorIconButton(className, iconName, label = '') {
    const button = document.createElement('button');
    button.className = className;
    button.type = 'button';
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.textContent = iconName;
    button.appendChild(icon);
    if (label) {
        button.appendChild(document.createTextNode(label));
    }
    return button;
}

// 初始化头像编辑器
let avatarEditorState = {
    canvas: null,
    ctx: null,
    image: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    startX: 0,
    startY: 0
};

function initAvatarEditor(imageData) {
    const canvas = document.getElementById('avatarCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = function () {
        avatarEditorState.canvas = canvas;
        avatarEditorState.ctx = ctx;
        avatarEditorState.image = img;

        // 计算初始缩放比例，使图片充满画布
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        avatarEditorState.scale = Math.max(scaleX, scaleY);

        // 居中显示
        avatarEditorState.offsetX = (canvas.width - img.width * avatarEditorState.scale) / 2;
        avatarEditorState.offsetY = (canvas.height - img.height * avatarEditorState.scale) / 2;

        drawAvatar();

        // 绑定事件
        bindAvatarEditorEvents();
    };

    img.src = imageData;
}

function drawAvatar() {
    const { canvas, ctx, image, scale, offsetX, offsetY } = avatarEditorState;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景（透明网格）
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制图片
    ctx.save();
    ctx.drawImage(
        image,
        offsetX,
        offsetY,
        image.width * scale,
        image.height * scale
    );
    ctx.restore();

    // 绘制圆形裁剪框
    ctx.save();
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 更新缩放比例显示
    const zoomLabel = document.getElementById('zoomLevel');
    if (zoomLabel) {
        zoomLabel.textContent = Math.round(scale * 100) + '%';
    }
}

function bindAvatarEditorEvents() {
    const canvas = avatarEditorState.canvas;

    // 鼠标拖动
    canvas.addEventListener('mousedown', (e) => {
        avatarEditorState.isDragging = true;
        avatarEditorState.startX = e.offsetX;
        avatarEditorState.startY = e.offsetY;
        canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!avatarEditorState.isDragging) return;

        const dx = e.offsetX - avatarEditorState.startX;
        const dy = e.offsetY - avatarEditorState.startY;

        avatarEditorState.offsetX += dx;
        avatarEditorState.offsetY += dy;
        avatarEditorState.startX = e.offsetX;
        avatarEditorState.startY = e.offsetY;

        drawAvatar();
    });

    canvas.addEventListener('mouseup', () => {
        avatarEditorState.isDragging = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        avatarEditorState.isDragging = false;
        canvas.style.cursor = 'grab';
    });

    // 触摸拖动
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        avatarEditorState.isDragging = true;
        avatarEditorState.startX = touch.clientX - rect.left;
        avatarEditorState.startY = touch.clientY - rect.top;
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!avatarEditorState.isDragging) return;
        e.preventDefault();

        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const dx = x - avatarEditorState.startX;
        const dy = y - avatarEditorState.startY;

        avatarEditorState.offsetX += dx;
        avatarEditorState.offsetY += dy;
        avatarEditorState.startX = x;
        avatarEditorState.startY = y;

        drawAvatar();
    });

    canvas.addEventListener('touchend', () => {
        avatarEditorState.isDragging = false;
    });

    // 鼠标滚轮缩放
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        zoomAvatar(delta);
    });

    canvas.style.cursor = 'grab';
}

function zoomAvatar(delta) {
    const newScale = avatarEditorState.scale + delta;
    if (newScale < 0.1 || newScale > 5) return;

    // 以画布中心为基准缩放
    const canvas = avatarEditorState.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const scaleRatio = newScale / avatarEditorState.scale;
    avatarEditorState.offsetX = centerX - (centerX - avatarEditorState.offsetX) * scaleRatio;
    avatarEditorState.offsetY = centerY - (centerY - avatarEditorState.offsetY) * scaleRatio;
    avatarEditorState.scale = newScale;

    drawAvatar();
}

function resetAvatarPosition() {
    const { canvas, image } = avatarEditorState;

    // 重置缩放比例
    const scaleX = canvas.width / image.width;
    const scaleY = canvas.height / image.height;
    avatarEditorState.scale = Math.max(scaleX, scaleY);

    // 重置位置
    avatarEditorState.offsetX = (canvas.width - image.width * avatarEditorState.scale) / 2;
    avatarEditorState.offsetY = (canvas.height - image.height * avatarEditorState.scale) / 2;

    drawAvatar();
}

function confirmAvatarEdit() {
    const { canvas, ctx, image, scale, offsetX, offsetY } = avatarEditorState;

    // 创建一个临时画布用于裁剪
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 200;
    tempCanvas.height = 200;
    const tempCtx = tempCanvas.getContext('2d');

    // 绘制圆形裁剪区域
    tempCtx.save();
    tempCtx.beginPath();
    tempCtx.arc(100, 100, 100, 0, Math.PI * 2);
    tempCtx.clip();

    // 计算缩放比例
    const ratio = 200 / canvas.width;
    tempCtx.drawImage(
        image,
        offsetX * ratio,
        offsetY * ratio,
        image.width * scale * ratio,
        image.height * scale * ratio
    );
    tempCtx.restore();

    // 获取裁剪后的图片数据
    const croppedImage = tempCanvas.toDataURL('image/png', 0.9);

    // 更新预览
    const preview = document.getElementById('avatar-preview');
    if (preview) {
        renderAvatarImage(preview, croppedImage, '头像预览');
    }

    // 保存头像数据
    window.currentAvatarData = croppedImage;
    window.currentAvatarType = 'upload';

    closeAvatarEditor();
    // 自动保存头像并关闭头像更换弹窗，回到个人资料页面
    saveAvatarChange();
}

function closeAvatarEditor() {
    const editorModal = document.querySelector('.avatar-editor-modal');
    if (editorModal) {
        editorModal.remove();
    }

    // 重置编辑器状态
    avatarEditorState = {
        canvas: null,
        ctx: null,
        image: null,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        isDragging: false,
        startX: 0,
        startY: 0
    };
}

// 选择预设头像
function selectPresetAvatar(avatarType, selectedElement = null) {
    // 移除其他选中状态
    document.querySelectorAll('.avatar-preset').forEach(preset => {
        preset.classList.remove('selected');
    });

    // 添加选中状态
    if (selectedElement) {
        selectedElement.classList.add('selected');
    } else {
        const preset = document.querySelector(`.avatar-preset[data-avatar="${avatarType}"]`);
        if (preset) preset.classList.add('selected');
    }

    // 更新预览
    const preview = document.getElementById('avatar-preview');
    if (preview) {
        renderAvatarPreset(preview, avatarType);
    }

    // 保存选择的预设头像
    window.currentAvatarData = avatarType;
    window.currentAvatarType = 'preset';

    // 自动保存预设头像并关闭弹窗
    setTimeout(function() {
        saveAvatarChange();
    }, 300);
}

// 加载当前头像
function loadCurrentAvatar() {
    const savedAvatar = window.DataSyncStorage.getRaw('userAvatar');
    if (savedAvatar) {
        try {
            const avatarData = JSON.parse(savedAvatar);
            const preview = document.getElementById('avatar-preview');
            if (!preview) return;

            if (avatarData.type === 'upload' && avatarData.data) {
                renderAvatarImage(preview, avatarData.data, '当前头像');
            } else if (avatarData.type === 'preset') {
                renderAvatarPreset(preview, avatarData.data);
            }
        } catch (error) {
            console.error('加载头像失败:', error);
        }
    }
}

// 保存头像更改
function saveAvatarChange() {
    if (!window.currentAvatarData) {
        showNotification('请先选择或上传头像', 'warning');
        return;
    }

    try {
        // 保存到localStorage
        const avatarData = {
            type: window.currentAvatarType,
            data: window.currentAvatarData,
            timestamp: new Date().toISOString()
        };

        window.DataSyncStorage.setRaw('userAvatar', JSON.stringify(avatarData));

        // 更新个人资料页面的头像显示
        updateProfileAvatar(avatarData);

        // 更新页面顶部的用户头像
        updateHeaderAvatar(avatarData);

        showNotification('头像保存成功！', 'success');
        closeAvatarChangeModal();

    } catch (error) {
        console.error('保存头像失败:', error);
        showNotification('保存头像失败，请重试', 'error');
    }
}

// 更新个人资料页面的头像
function updateProfileAvatar(avatarData) {
    const avatarCircle = document.querySelector('.avatar-circle');
    if (!avatarCircle) return;

    renderAvatarTarget(avatarCircle, avatarData, '用户头像');
}

// 更新页面顶部的用户头像
function updateHeaderAvatar(avatarData) {
    const headerAvatar = document.querySelector('.user-avatar');
    if (!headerAvatar) return;

    renderAvatarTarget(headerAvatar, avatarData, '用户头像');
}

function renderAvatarTarget(target, avatarData, altText) {
    if (!target || !avatarData) return;

    if (avatarData.type === 'upload' && avatarData.data) {
        renderAvatarImage(target, avatarData.data, altText);
    } else if (avatarData.type === 'preset') {
        renderAvatarPreset(target, avatarData.data);
    }
}

function renderAvatarImage(target, src, altText) {
    target.replaceChildren();
    target.style.background = '';
    const img = document.createElement('img');
    img.src = src;
    img.alt = altText;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;';
    target.appendChild(img);
}

function renderAvatarPreset(target, avatarType = 'default') {
    const iconMap = {
        'default': 'person',
        'male': 'face',
        'female': 'face',
        'business': 'business_center',
        'creative': 'palette',
        'tech': 'computer'
    };

    const colorMap = {
        'default': '#667eea',
        'male': '#4a90e2',
        'female': '#e91e63',
        'business': '#795548',
        'creative': '#9c27b0',
        'tech': '#607d8b'
    };

    const safeType = iconMap[avatarType] ? avatarType : 'default';
    target.replaceChildren();
    const icon = document.createElement('span');
    icon.className = 'material-icons';
    icon.style.color = colorMap[safeType];
    icon.textContent = iconMap[safeType];
    target.style.background = `linear-gradient(135deg, ${colorMap[safeType]}20 0%, ${colorMap[safeType]}10 100%)`;
    target.appendChild(icon);
}

// 初始化用户头像
function initializeUserAvatar() {
    console.log('🖼️ 初始化用户头像');

    const savedAvatar = window.DataSyncStorage.getRaw('userAvatar');
    if (savedAvatar) {
        try {
            const avatarData = JSON.parse(savedAvatar);

            // 更新页面顶部的用户头像
            updateHeaderAvatar(avatarData);

            // 如果个人资料页面已打开，也更新那里的头像
            const avatarCircle = document.querySelector('.avatar-circle');
            if (avatarCircle) {
                updateProfileAvatar(avatarData);
            }

            console.log('✅ 用户头像初始化完成');
        } catch (error) {
            console.error('❌ 初始化用户头像失败:', error);
        }
    }
}

function closeSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.style.display = 'none';
        settingsModal.classList.remove('active');
        // 恢复背景页面滚动 — 检查是否有其他模态框还开着
        const anyOpen = document.querySelectorAll('.modal[style*="display: block"], .modal.active, [id$="-modal"][style*="display: block"]');
        if (anyOpen.length === 0) {
            document.body.style.overflow = '';
        }
    }
}

function loadSettings() {
    console.log('⚙️ 加载用户偏好设置');
    // 加载用户偏好设置
    const autoSave = document.getElementById('auto-save');
    const taskNotifications = document.getElementById('task-notifications');
    const rememberMeSetting = document.getElementById('remember-me-setting');

    if (autoSave) {
        const autoSaveValue = window.SettingsStorage
            ? window.SettingsStorage.getBoolean('autoSave', true)
            : window.DataSyncStorage.getRaw('autoSave') !== 'false';
        autoSave.checked = autoSaveValue;
        updatePreferenceVisualState('auto-save', autoSaveValue);
        console.log('✅ 自动保存设置已加载:', autoSaveValue);
    } else {
        console.warn('⚠️ 未找到自动保存设置元素');
    }

    if (taskNotifications) {
        const taskNotificationsValue = window.SettingsStorage
            ? window.SettingsStorage.getBoolean('taskNotifications', true)
            : window.DataSyncStorage.getRaw('taskNotifications') !== 'false';
        taskNotifications.checked = taskNotificationsValue;
        updatePreferenceVisualState('task-notifications', taskNotificationsValue);
        console.log('✅ 任务通知设置已加载:', taskNotificationsValue);
    } else {
        console.warn('⚠️ 未找到任务通知设置元素');
    }

    if (rememberMeSetting) {
        const rememberMeValue = window.SettingsStorage
            ? window.SettingsStorage.getBoolean('rememberMe', true)
            : window.DataSyncStorage.getRaw('rememberMe') !== 'false';
        rememberMeSetting.checked = rememberMeValue;
        updatePreferenceVisualState('remember-me-setting', rememberMeValue, 'preference-remember-me');
        console.log('✅ 记住登录设置已加载:', rememberMeValue);
    } else {
        console.warn('⚠️ 未找到记住登录设置元素');
    }

    // 遥测设置加载
    const telemetrySetting = document.getElementById('telemetry-setting');
    if (telemetrySetting) {
        const telemetryValue = window.Telemetry ? window.Telemetry.isEnabled() : true;
        telemetrySetting.checked = telemetryValue;
        updatePreferenceVisualState('telemetry-setting', telemetryValue, 'preference-telemetry');
    }

    console.log('✅ 偏好设置加载完成');
}

// 切换偏好设置
function togglePreference(preferenceId) {
    console.log('🔄 切换偏好设置:', preferenceId);

    const checkbox = document.getElementById(preferenceId);

    // 根据preferenceId找到对应的preference item ID
    let preferenceItemId;
    if (preferenceId === 'remember-me-setting') {
        preferenceItemId = 'preference-remember-me';
    } else {
        preferenceItemId = `preference-${preferenceId}`;
    }

    const preferenceItem = document.getElementById(preferenceItemId);

    if (!checkbox || !preferenceItem) {
        console.error('❌ 未找到偏好设置元素:', {
            preferenceId,
            checkbox: !!checkbox,
            preferenceItem: !!preferenceItem,
            preferenceItemId
        });
        return;
    }

    // 切换选中状态
    const newState = !checkbox.checked;
    checkbox.checked = newState;

    // 更新视觉状态
    updatePreferenceVisualState(preferenceId, newState, preferenceItemId);

    // 保存到localStorage
    const storageKey = preferenceId === 'remember-me-setting' ? 'rememberMe' : preferenceId;
    window.DataSyncStorage.setRaw(storageKey, newState);

    // 遥测开关特殊处理
    if (preferenceId === 'telemetry-setting' && window.Telemetry) {
        if (newState) {
            window.Telemetry.enable();
        } else {
            window.Telemetry.disable();
        }
    }

    console.log(`✅ 偏好设置已切换: ${preferenceId} = ${newState}`);

    // 显示反馈
    const preferenceName = getPreferenceName(preferenceId);
    if (preferenceId === 'telemetry-setting') {
        showNotification(`匿名使用统计已${newState ? '启用' : '禁用'}`, 'success');
    } else {
        showNotification(`${preferenceName}已${newState ? '启用' : '禁用'}`, 'success');
    }
}

// 更新偏好设置的视觉状态
function updatePreferenceVisualState(preferenceId, isSelected, preferenceItemId = null) {
    // 如果没有提供preferenceItemId，则根据preferenceId计算
    if (!preferenceItemId) {
        if (preferenceId === 'remember-me-setting') {
            preferenceItemId = 'preference-remember-me';
        } else {
            preferenceItemId = `preference-${preferenceId}`;
        }
    }

    const preferenceItem = document.getElementById(preferenceItemId);

    if (!preferenceItem) {
        console.warn('⚠️ 未找到偏好设置视觉元素:', {
            preferenceId,
            preferenceItemId,
            element: !!preferenceItem
        });
        return;
    }

    if (isSelected) {
        preferenceItem.classList.add('selected');
    } else {
        preferenceItem.classList.remove('selected');
    }

    console.log(`✅ 偏好设置视觉状态已更新: ${preferenceId} = ${isSelected}`);
}

// 获取偏好设置名称
function getPreferenceName(preferenceId) {
    const names = {
        'auto-save': '自动保存任务',
        'task-notifications': '任务提醒通知',
        'remember-me-setting': '记住登录状态',
        'telemetry-setting': '匿名使用统计'
    };
    return names[preferenceId] || preferenceId;
}

function changePassword() {
    try {
        const currentCredential = document.getElementById('current-password').value;
        const newCredential = document.getElementById('new-password').value;
        const confirmCredential = document.getElementById('confirm-password').value;

        if (!currentCredential || !newCredential || !confirmCredential) {
            showNotification('请填写所有密码字段', 'error');
            return;
        }

        if (newCredential !== confirmCredential) {
            showNotification('新密码和确认密码不匹配', 'error');
            return;
        }

        if (newCredential.length < 6) {
            showNotification('新密码长度至少6位', 'error');
            return;
        }

        if (!currentUser) {
            showNotification('请先登录后再修改密码', 'error');
            return;
        }

        // 重新从会话中获取最新的用户数据，确保密码是最新的
        let latestUser = currentUser;
        const sessionStr = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                if (session.user && (session.user.username === currentUser.username || session.user.id === currentUser.id)) {
                    latestUser = session.user;
                    console.log('Latest user data loaded from session.', {
                        userId: latestUser.id || null,
                        username: latestUser.username || null
                    });
                }
            } catch (e) {
                console.warn('获取最新用户数据失败:', e);
            }
        }

        // 如果会话中没有找到用户，尝试从localStorage的users数组中获取最新数据
        if (latestUser === currentUser) {
            try {
                const users = window.UserStorage.getUsers();
                const userFromStorage = users.find(u =>
                    (u.username === currentUser.username) ||
                    (u.id && currentUser.id && u.id === currentUser.id)
                );
                if (userFromStorage) {
                    latestUser = userFromStorage;
                    console.log('Latest user data loaded from user list.', {
                        userId: latestUser.id || null,
                        username: latestUser.username || null
                    });
                }
            } catch (e) {
                console.warn('从用户列表获取数据失败:', e);
            }
        }

        console.log('Credential verification prepared.', {
            userId: latestUser.id || currentUser.id || null,
            username: latestUser.username || currentUser.username || null,
            sessionActive: Boolean(sessionStr)
        });

        // 验证当前密码（简单验证，实际应用中应该加密比较）
        if (currentCredential !== latestUser.password) {
            console.log('Credential verification failed.', {
                userId: latestUser.id || currentUser.id || null,
                username: latestUser.username || currentUser.username || null,
                credentialMatched: false
            });
            showNotification('当前密码不正确', 'error');
            return;
        }

        console.log('密码验证成功，开始更新密码');

        // 更新用户密码
        currentUser.password = newCredential;

        // 更新localStorage中的用户会话
        const localSessionStr = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');
        const sessionSessionStr = (window.SessionStorage.getSession('userSession') ? JSON.stringify(window.SessionStorage.getSession('userSession')) : '');

        if (localSessionStr) {
            try {
                const sess = JSON.parse(localSessionStr);
                sess.user = currentUser;
                const sanitizedSess = sanitizeSession(sess);
                window.SessionStorage.setSession(sanitizedSess, { remember: true });
                console.log('密码已更新到localStorage会话（安全存储）');
            } catch (e) {
                console.warn('localStorage会话更新失败:', e);
            }
        } else if (sessionSessionStr) {
            try {
                const sess = JSON.parse(sessionSessionStr);
                sess.user = currentUser;
                const sanitizedSess = sanitizeSession(sess);
                window.SessionStorage.setSession(sanitizedSess, { remember: false });
                console.log('密码已更新到sessionStorage会话（安全存储）');
            } catch (e) {
                console.warn('sessionStorage会话更新失败:', e);
            }
        }

        // 更新用户列表中的密码
        try {
            const usersStr = window.DataSyncStorage.getRaw('users');
            if (usersStr) {
                let users = JSON.parse(usersStr);
                users = users.map(u => {
                    if ((u.id && currentUser.id && u.id === currentUser.id) || (u.username === currentUser.username)) {
                        return { ...u, password: newCredential };
                    }
                    return u;
                });
                window.UserStorage.setUsers(users);
                console.log('用户列表中的密码已更新');
            }
        } catch (e) {
            console.warn('用户列表更新失败:', e);
        }

        showNotification('密码修改成功！', 'success');

        // 清空密码字段
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';

    } catch (err) {
        console.error('changePassword error', err);
        showNotification('密码修改失败，稍后重试', 'error');
    }
}

function saveSettings() {
    console.log('💾 保存用户偏好设置');
    try {
        const autoSaveEl = document.getElementById('auto-save');
        const taskNotificationsEl = document.getElementById('task-notifications');
        const rememberMeSettingEl = document.getElementById('remember-me-setting');

        if (!autoSaveEl || !taskNotificationsEl || !rememberMeSettingEl) {
            console.error('❌ 设置元素缺失:', {
                autoSave: !!autoSaveEl,
                taskNotifications: !!taskNotificationsEl,
                rememberMe: !!rememberMeSettingEl
            });
            showNotification('保存失败：设置元素缺失', 'error');
            return;
        }

        const autoSave = autoSaveEl.checked;
        const taskNotifications = taskNotificationsEl.checked;
        const rememberMeSetting = rememberMeSettingEl.checked;

        // 保存设置到localStorage
        if (window.SettingsStorage) {
            window.SettingsStorage.setBoolean('autoSave', autoSave);
            window.SettingsStorage.setBoolean('taskNotifications', taskNotifications);
            window.SettingsStorage.setBoolean('rememberMe', rememberMeSetting);
        } else {
            window.DataSyncStorage.setRaw('autoSave', autoSave);
            window.DataSyncStorage.setRaw('taskNotifications', taskNotifications);
            window.DataSyncStorage.setRaw('rememberMe', rememberMeSetting);
        }

        console.log('✅ 账户设置已保存:', { autoSave, taskNotifications, rememberMeSetting });
        showNotification('设置保存成功！', 'success');
        closeSettingsModal();
    } catch (err) {
        console.error('❌ saveSettings error', err);
        showNotification('设置保存失败，稍后重试', 'error');
    }
}

function exportUserData() {
    try {
        if (!currentUser) {
            showNotification('请先登录后再导出数据', 'warning');
            return;
        }

        const userData = {
            user: currentUser,
            tasks: tasks || [],
            settings: {
                autoSave: window.DataSyncStorage.getRaw('autoSave'),
                taskNotifications: window.DataSyncStorage.getRaw('taskNotifications'),
                rememberMe: window.DataSyncStorage.getRaw('rememberMe')
            },
            exportTime: new Date().toISOString()
        };

        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `user-data-${currentUser.username || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        showNotification('用户数据导出成功！', 'success');
    } catch (err) {
        console.error('exportUserData error', err);
        showNotification('数据导出失败，稍后重试', 'error');
    }
}

function importUserData() {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const userData = JSON.parse(e.target.result);

                    if (userData.tasks && Array.isArray(userData.tasks)) {
                        tasks = userData.tasks;
                        if (typeof renderTasks === 'function') {
                            renderTasks();
                        }
                    }

                    if (userData.settings && typeof userData.settings === 'object') {
                        Object.keys(userData.settings).forEach(key => {
                            if (userData.settings[key] !== null) {
                                window.DataSyncStorage.setRaw(key, userData.settings[key]);
                            }
                        });
                    }

                    showNotification('用户数据导入成功！', 'success');
                } catch (error) {
                    console.error('importUserData parse error', error);
                    showNotification('导入文件格式错误', 'error');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    } catch (err) {
        console.error('importUserData error', err);
        showNotification('数据导入失败，稍后重试', 'error');
    }
}
