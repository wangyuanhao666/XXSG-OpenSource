// ==================== 沉浸式自然日历模块 ====================
const calendarWeekdaysZh = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const calendarWeekdaysFullZh = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const calendarDotColorMap = {
    cyan: '#38bdf8',
    violet: '#a855f7',
    green: '#22c55e',
    amber: '#f59e0b',
    pink: '#ec4899'
};

const calendarEventSeed = [
    {
        id: 'cal-1',
        title: '晨间站会',
        calendar: 'team',
        color: 'cyan',
        start: '2025-03-03T09:00:00',
        end: '2025-03-03T09:40:00',
        location: '总部·A101会议室',
        attendees: ['产品团队', '研发联席'],
        description: '同步本周冲刺目标与阻塞事项。'
    },
    {
        id: 'cal-2',
        title: '品牌重塑方案讨论',
        calendar: 'work',
        color: 'violet',
        start: '2025-03-03T10:00:00',
        end: '2025-03-03T11:30:00',
        location: '总部·B203创意间',
        attendees: ['市场部', '设计中心'],
        description: '评审新版视觉稿，确定第一阶段交付节奏。'
    },
    {
        id: 'cal-3',
        title: '午间专注时段',
        calendar: 'focus',
        color: 'green',
        start: '2025-03-03T12:30:00',
        end: '2025-03-03T14:00:00',
        location: '专注室·静音区',
        attendees: ['本人'],
        description: '整理季度路标文档，保持深度思考。'
    },
    {
        id: 'cal-4',
        title: '客户远程演示',
        calendar: 'work',
        color: 'amber',
        start: '2025-03-03T14:30:00',
        end: '2025-03-03T16:00:00',
        location: 'Zoom · 客户项目组',
        attendees: ['渠道团队', '客户成功经理'],
        description: '展示最新原型，确认交付节点与反馈。'
    },
    {
        id: 'cal-5',
        title: '产品训练营',
        calendar: 'team',
        color: 'pink',
        start: '2025-03-04T08:30:00',
        end: '2025-03-04T09:30:00',
        location: '总部·多功能厅',
        attendees: ['产品实习生', '导师组'],
        description: '第二期训练营开场，讲解用户访谈技巧。'
    },
    {
        id: 'cal-6',
        title: 'Design Sprint 复盘',
        calendar: 'team',
        color: 'cyan',
        start: '2025-03-04T10:00:00',
        end: '2025-03-04T11:00:00',
        location: '总部·玻璃会议室',
        attendees: ['设计团队', '体验研究'],
        description: '回顾测试结果，梳理关键洞察。'
    },
    {
        id: 'cal-7',
        title: '午餐会 · 投资人更新',
        calendar: 'work',
        color: 'amber',
        start: '2025-03-05T12:30:00',
        end: '2025-03-05T13:30:00',
        location: '云顶餐厅·景观位',
        attendees: ['投资方伙伴A', 'CEO'],
        description: '介绍产品最新进度与核心指标。'
    },
    {
        id: 'cal-8',
        title: '跨部门联创工作坊',
        calendar: 'team',
        color: 'violet',
        start: '2025-03-06T13:00:00',
        end: '2025-03-06T15:00:00',
        location: '总部·灵感工坊',
        attendees: ['市场部', '研发部', '运营部'],
        description: '围绕春季新品策划联合推广方案。'
    },
    {
        id: 'cal-9',
        title: '深度写作时间',
        calendar: 'focus',
        color: 'green',
        start: '2025-03-07T09:30:00',
        end: '2025-03-07T11:30:00',
        location: '城市图书馆·三层',
        attendees: ['本人'],
        description: '撰写《下一代AI助手》系列文章稿件。'
    },
    {
        id: 'cal-10',
        title: '家庭徒步与午餐',
        calendar: 'personal',
        color: 'pink',
        start: '2025-03-08T10:30:00',
        end: '2025-03-08T13:30:00',
        location: '松岭国家公园',
        attendees: ['家人'],
        description: '山谷徒步，湖畔野餐，记录春日美景。'
    }
];

let calendarEvents = calendarEventSeed.map(event => ({
    ...event,
    start: new Date(event.start),
    end: new Date(event.end)
}));

// 加载保存的自定义事件
try {
    const savedEvents = window.CalendarEventStorage
        ? window.CalendarEventStorage.loadFromKeys(['calendar-custom-events', 'customCalendarEvents'])
        : JSON.parse(localStorage.getItem('calendar-custom-events') || '[]').map(savedEvent => ({
            ...savedEvent,
            start: new Date(savedEvent.start),
            end: new Date(savedEvent.end)
        }));
    const existingEventIds = new Set(calendarEvents.map(event => event.id));
    savedEvents.forEach(savedEvent => {
        if (!savedEvent || existingEventIds.has(savedEvent.id)) return;
        calendarEvents.push(savedEvent);
        existingEventIds.add(savedEvent.id);
    });
} catch (error) {
    console.warn('加载保存的事件失败:', error);
}

// 将 calendarEvents 暴露到全局，供其他模块使用
window.calendarEvents = calendarEvents;

const calendarEventMap = new Map(calendarEvents.map(event => [event.id, event]));
window.calendarEventMap = calendarEventMap;

function syncCalendarGlobalState() {
    window.calendarEvents = calendarEvents;
    window.calendarEventMap = calendarEventMap;
}

const CALENDAR_PROFILE_NAME_KEY = 'calendar-profile-name';
const CALENDAR_PROFILE_AVATAR_KEY = 'calendar-profile-avatar';
const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const AVATAR_CANVAS_SIZE = 320;

let calendarProfileName = '小象';
try {
    const storedName = localStorage.getItem(CALENDAR_PROFILE_NAME_KEY);
    if (storedName) {
        calendarProfileName = storedName;
    }
} catch (error) {
    console.warn('加载个人中心用户名失败:', error);
}

let calendarProfileAvatarDataUrl = '';
try {
    calendarProfileAvatarDataUrl = localStorage.getItem(CALENDAR_PROFILE_AVATAR_KEY) || '';
} catch (error) {
    console.warn('加载个人中心头像失败:', error);
}

// 自定义事件类型
const defaultCalendarTypes = [
    { id: 'work', name: '工作日程', color: '#60a5fa' },
    { id: 'team', name: '团队协作', color: '#a855f7' },
    { id: 'personal', name: '个人生活', color: '#f97316' },
    { id: 'focus', name: '深度专注', color: '#10b981' }
];
const defaultCalendarTypeIds = new Set(defaultCalendarTypes.map(type => type.id));
let calendarCustomTypes = [...defaultCalendarTypes];

// 加载保存的自定义类型
try {
    const savedTypes = JSON.parse(localStorage.getItem('calendar-custom-types') || '[]');
    savedTypes.forEach(type => {
        if (type && type.id && !defaultCalendarTypeIds.has(type.id)) {
            calendarCustomTypes.push(type);
        }
    });
} catch (error) {
    console.warn('加载自定义类型失败:', error);
}

let calendarInitialized = false;
let calendarViewMode = 'week';
let calendarSelectedDate = startOfDay(new Date());
let calendarMiniMonthDate = new Date(calendarSelectedDate.getFullYear(), calendarSelectedDate.getMonth(), 1);
let currentEditingEventId = null; // 当前正在编辑的事件ID
let calendarSearchKeyword = '';
const calendarActiveCalendars = new Set(['work', 'team', 'personal', 'focus']);
calendarCustomTypes.forEach(type => {
    if (!defaultCalendarTypeIds.has(type.id)) {
        calendarActiveCalendars.add(type.id);
    }
});

const CALENDAR_HOUR_HEIGHT = 80;
let pendingTypeDeleteId = null;
let calendarProfileAvatarInputEl = null;
let calendarProfileAvatarPreviewEl = null;
let calendarProfileAvatarImgEl = null;
let calendarProfileAvatarFallbackEl = null;
let calendarProfileChipAvatarEl = null;
let calendarProfileChipAvatarImgEl = null;
let calendarProfileChipFallbackEl = null;
let calendarAvatarRemoveBtnEl = null;
let calendarAvatarEditorModalEl = null;
let calendarAvatarCanvasEl = null;
let calendarAvatarCtx = null;
let calendarAvatarScaleInputEl = null;
const calendarAvatarCropState = {
    image: null,
    baseScale: 1,
    scaleFactor: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0
};

function persistCustomCalendarTypes() {
    try {
        const customOnly = calendarCustomTypes.filter(type => !defaultCalendarTypeIds.has(type.id));
        localStorage.setItem('calendar-custom-types', JSON.stringify(customOnly));
    } catch (error) {
        console.warn('保存自定义类型失败:', error);
    }
}


function syncQuadrantTasksToCalendar() {
    const activeTasks = tasks.filter(task =>
        task &&
        !task.completed &&
        Number(task.priority) >= 1 &&
        Number(task.priority) <= 4
    );

    if (activeTasks.length === 0) {
        showNotification('当前没有可同步的四象限任务', 'info');
        return;
    }

    const colors = {
        1: '#ef4444',
        2: '#f59e0b',
        3: '#3b82f6',
        4: '#10b981'
    };
    const names = {
        1: t('q1Title'),
        2: t('q2Title'),
        3: t('q3Title'),
        4: t('q4Title')
    };

    let created = 0;
    let updated = 0;
    const baseDate = startOfDay(calendarSelectedDate || new Date());

    activeTasks.forEach((task, index) => {
        const priority = Number(task.priority);
        const eventId = `event-task-${task.id}`;
        const existingEvent = calendarEventMap.get(eventId);
        let start = task.startDate ? new Date(task.startDate) : null;
        if (!start || Number.isNaN(start.getTime())) {
            start = new Date(baseDate);
            start.setHours(9 + (index % 8), 0, 0, 0);
        }

        let end = task.endDate ? new Date(task.endDate) : null;
        if (!end || Number.isNaN(end.getTime()) || end <= start) {
            end = new Date(start.getTime() + 60 * 60 * 1000);
        }

        const event = {
            ...(existingEvent || {}),
            id: eventId,
            title: getTaskDisplayTitle(task) || task.title || t('unnamedTask'),
            start,
            end,
            location: task.address || '',
            attendees: [],
            description: `从四象限同步：${names[priority] || ''}`,
            calendar: 'work',
            color: colors[priority] || '#60a5fa',
            sourceTaskId: task.id
        };

        calendarEventMap.set(eventId, event);
        const existingIndex = calendarEvents.findIndex(item => item.id === eventId);
        if (existingIndex !== -1) {
            calendarEvents[existingIndex] = event;
            updated++;
        } else {
            calendarEvents.push(event);
            created++;
        }
    });

    persistCustomEventsFromMap();
    renderCalendar();
    renderMiniCalendar();
    showNotification(`任务同步完成：新增 ${created} 个，更新 ${updated} 个`, 'success');
}

function initCalendarProfileUI() {
    if (!calendarProfileAvatarPreviewEl) {
        calendarProfileAvatarPreviewEl = document.getElementById('calendar-profile-avatar-preview');
    }
    if (!calendarProfileAvatarImgEl) {
        calendarProfileAvatarImgEl = document.getElementById('calendar-profile-avatar-img');
    }
    if (!calendarProfileAvatarFallbackEl) {
        calendarProfileAvatarFallbackEl = document.getElementById('calendar-profile-avatar-fallback');
    }
    if (!calendarProfileChipAvatarEl) {
        calendarProfileChipAvatarEl = document.getElementById('calendar-profile-chip-avatar');
    }
    if (!calendarProfileChipAvatarImgEl) {
        calendarProfileChipAvatarImgEl = document.getElementById('calendar-profile-chip-avatar-img');
    }
    if (!calendarProfileChipFallbackEl) {
        calendarProfileChipFallbackEl = document.getElementById('calendar-profile-chip-avatar-fallback');
    }
    if (!calendarAvatarRemoveBtnEl) {
        calendarAvatarRemoveBtnEl = document.getElementById('calendar-avatar-remove-btn');
    }
    if (!calendarProfileAvatarInputEl) {
        calendarProfileAvatarInputEl = document.getElementById('calendar-profile-avatar-input');
        if (calendarProfileAvatarInputEl) {
            calendarProfileAvatarInputEl.addEventListener('change', handleCalendarAvatarFileChange);
        }
    }

    const nameInput = document.getElementById('calendar-profile-name-input');
    if (nameInput && !nameInput.value) {
        nameInput.value = calendarProfileName;
    }

    updateCalendarProfileNameLabels(calendarProfileName);
    updateCalendarAvatarUI();
}

function updateCalendarProfileNameLabels(name) {
    if (!name) return;
    calendarProfileName = name;
    const profileNameEl = document.getElementById('calendar-profile-name');
    if (profileNameEl) {
        profileNameEl.textContent = calendarProfileName;
    }
    const modalNameEl = document.getElementById('calendar-profile-modal-name');
    if (modalNameEl) {
        modalNameEl.textContent = calendarProfileName;
    }
    const nameInput = document.getElementById('calendar-profile-name-input');
    if (nameInput && document.activeElement !== nameInput) {
        nameInput.value = calendarProfileName;
    }
}

function updateCalendarAvatarUI() {
    const hasAvatar = Boolean(calendarProfileAvatarDataUrl);

    if (calendarProfileAvatarPreviewEl) {
        calendarProfileAvatarPreviewEl.classList.toggle('has-image', hasAvatar);
    }
    if (calendarProfileAvatarImgEl) {
        if (hasAvatar) {
            calendarProfileAvatarImgEl.src = calendarProfileAvatarDataUrl;
            calendarProfileAvatarImgEl.removeAttribute('hidden');
        } else {
            calendarProfileAvatarImgEl.removeAttribute('src');
            calendarProfileAvatarImgEl.setAttribute('hidden', 'hidden');
        }
    }
    if (calendarProfileAvatarFallbackEl) {
        calendarProfileAvatarFallbackEl.style.opacity = hasAvatar ? '0' : '1';
        calendarProfileAvatarFallbackEl.style.visibility = hasAvatar ? 'hidden' : 'visible';
    }
    if (calendarProfileChipAvatarEl) {
        calendarProfileChipAvatarEl.classList.toggle('has-image', hasAvatar);
    }
    if (calendarProfileChipAvatarImgEl) {
        if (hasAvatar) {
            calendarProfileChipAvatarImgEl.src = calendarProfileAvatarDataUrl;
            calendarProfileChipAvatarImgEl.removeAttribute('hidden');
        } else {
            calendarProfileChipAvatarImgEl.removeAttribute('src');
            calendarProfileChipAvatarImgEl.setAttribute('hidden', 'hidden');
        }
    }
    if (calendarProfileChipFallbackEl) {
        calendarProfileChipFallbackEl.style.opacity = hasAvatar ? '0' : '1';
        calendarProfileChipFallbackEl.style.visibility = hasAvatar ? 'hidden' : 'visible';
    }
    if (calendarAvatarRemoveBtnEl) {
        calendarAvatarRemoveBtnEl.disabled = !hasAvatar;
    }
}

function initAvatarEditorRefs() {
    if (!calendarAvatarEditorModalEl) {
        calendarAvatarEditorModalEl = document.getElementById('calendar-avatar-editor-modal');
    }
    if (!calendarAvatarCanvasEl) {
        calendarAvatarCanvasEl = document.getElementById('calendar-avatar-editor-canvas');
        if (calendarAvatarCanvasEl) {
            calendarAvatarCtx = calendarAvatarCanvasEl.getContext('2d');
            calendarAvatarCanvasEl.addEventListener('pointerdown', handleAvatarEditorPointerDown);
            calendarAvatarCanvasEl.addEventListener('pointermove', handleAvatarEditorPointerMove);
            calendarAvatarCanvasEl.addEventListener('pointerup', handleAvatarEditorPointerUp);
            calendarAvatarCanvasEl.addEventListener('pointerleave', handleAvatarEditorPointerUp);
            calendarAvatarCanvasEl.addEventListener('pointercancel', handleAvatarEditorPointerUp);
        }
    }
    if (!calendarAvatarScaleInputEl) {
        calendarAvatarScaleInputEl = document.getElementById('calendar-avatar-scale-input');
        if (calendarAvatarScaleInputEl) {
            calendarAvatarScaleInputEl.addEventListener('input', handleAvatarScaleChange);
        }
    }
}

function openCalendarAvatarEditor(dataUrl) {
    if (!dataUrl) return;
    initAvatarEditorRefs();
    if (!calendarAvatarEditorModalEl || !calendarAvatarCanvasEl) {
        calendarProfileAvatarDataUrl = dataUrl;
        updateCalendarAvatarUI();
        return;
    }

    const img = new Image();
    img.onload = () => {
        calendarAvatarCropState.image = img;
        calendarAvatarCropState.baseScale = Math.max(
            AVATAR_CANVAS_SIZE / img.width,
            AVATAR_CANVAS_SIZE / img.height
        );
        calendarAvatarCropState.scaleFactor = 1;
        calendarAvatarCropState.scale = calendarAvatarCropState.baseScale;
        calendarAvatarCropState.offsetX = (AVATAR_CANVAS_SIZE - img.width * calendarAvatarCropState.scale) / 2;
        calendarAvatarCropState.offsetY = (AVATAR_CANVAS_SIZE - img.height * calendarAvatarCropState.scale) / 2;
        calendarAvatarCropState.active = true;
        calendarAvatarCropState.isDragging = false;
        calendarAvatarCropState.pointerId = null;
        if (calendarAvatarScaleInputEl) {
            calendarAvatarScaleInputEl.value = '1';
        }
        renderAvatarEditor();
        calendarAvatarEditorModalEl.style.display = 'flex';
    };
    img.onerror = () => {
        alert('无法加载图片，请尝试其他文件');
    };
    img.src = dataUrl;
}

function closeCalendarAvatarEditor() {
    calendarAvatarCropState.active = false;
    calendarAvatarCropState.isDragging = false;
    if (calendarAvatarEditorModalEl) {
        calendarAvatarEditorModalEl.style.display = 'none';
    }
}

function handleAvatarScaleChange(event) {
    if (!calendarAvatarCropState.image) return;
    const value = Number(event.target.value);
    calendarAvatarCropState.scaleFactor = value;
    calendarAvatarCropState.scale = calendarAvatarCropState.baseScale * calendarAvatarCropState.scaleFactor;
    clampAvatarEditorOffsets();
    renderAvatarEditor();
}

function handleAvatarEditorPointerDown(event) {
    if (!calendarAvatarCropState.image) return;
    event.preventDefault();
    calendarAvatarCropState.isDragging = true;
    calendarAvatarCropState.pointerId = event.pointerId;
    calendarAvatarCropState.lastX = event.clientX;
    calendarAvatarCropState.lastY = event.clientY;
    event.target.setPointerCapture(event.pointerId);
}

function handleAvatarEditorPointerMove(event) {
    if (!calendarAvatarCropState.isDragging || event.pointerId !== calendarAvatarCropState.pointerId) return;
    event.preventDefault();
    const dx = event.clientX - calendarAvatarCropState.lastX;
    const dy = event.clientY - calendarAvatarCropState.lastY;
    calendarAvatarCropState.offsetX += dx;
    calendarAvatarCropState.offsetY += dy;
    calendarAvatarCropState.lastX = event.clientX;
    calendarAvatarCropState.lastY = event.clientY;
    clampAvatarEditorOffsets();
    renderAvatarEditor();
}

function handleAvatarEditorPointerUp(event) {
    if (event.pointerId !== calendarAvatarCropState.pointerId) return;
    calendarAvatarCropState.isDragging = false;
    calendarAvatarCropState.pointerId = null;
    if (event.target && event.target.releasePointerCapture) {
        event.target.releasePointerCapture(event.pointerId);
    }
}

function clampAvatarEditorOffsets() {
    if (!calendarAvatarCropState.image) return;
    const displayWidth = calendarAvatarCropState.image.width * calendarAvatarCropState.scale;
    const displayHeight = calendarAvatarCropState.image.height * calendarAvatarCropState.scale;
    const margin = 2; // 额外延伸，避免边缘露底色

    if (displayWidth <= AVATAR_CANVAS_SIZE) {
        calendarAvatarCropState.offsetX = (AVATAR_CANVAS_SIZE - displayWidth) / 2;
    } else {
        const minX = AVATAR_CANVAS_SIZE - displayWidth - margin;
        const maxX = margin;
        calendarAvatarCropState.offsetX = Math.min(maxX, Math.max(calendarAvatarCropState.offsetX, minX));
    }

    if (displayHeight <= AVATAR_CANVAS_SIZE) {
        calendarAvatarCropState.offsetY = (AVATAR_CANVAS_SIZE - displayHeight) / 2;
    } else {
        const minY = AVATAR_CANVAS_SIZE - displayHeight - margin;
        const maxY = margin;
        calendarAvatarCropState.offsetY = Math.min(maxY, Math.max(calendarAvatarCropState.offsetY, minY));
    }
}

function renderAvatarEditor() {
    if (!calendarAvatarCtx || !calendarAvatarCropState.image) return;
    calendarAvatarCtx.clearRect(0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
    calendarAvatarCtx.fillStyle = '#f8fafc';
    calendarAvatarCtx.fillRect(0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);

    const displayWidth = calendarAvatarCropState.image.width * calendarAvatarCropState.scale;
    const displayHeight = calendarAvatarCropState.image.height * calendarAvatarCropState.scale;
    calendarAvatarCtx.drawImage(
        calendarAvatarCropState.image,
        calendarAvatarCropState.offsetX,
        calendarAvatarCropState.offsetY,
        displayWidth,
        displayHeight
    );

    // 遮罩圆形预览区域
    calendarAvatarCtx.save();
    calendarAvatarCtx.globalCompositeOperation = 'destination-in';
    calendarAvatarCtx.beginPath();
    calendarAvatarCtx.arc(
        AVATAR_CANVAS_SIZE / 2,
        AVATAR_CANVAS_SIZE / 2,
        AVATAR_CANVAS_SIZE / 2,
        0,
        Math.PI * 2
    );
    calendarAvatarCtx.closePath();
    calendarAvatarCtx.fill();
    calendarAvatarCtx.restore();

    // 外圈描边
    calendarAvatarCtx.save();
    calendarAvatarCtx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    calendarAvatarCtx.lineWidth = 4;
    calendarAvatarCtx.beginPath();
    calendarAvatarCtx.arc(
        AVATAR_CANVAS_SIZE / 2,
        AVATAR_CANVAS_SIZE / 2,
        AVATAR_CANVAS_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    calendarAvatarCtx.stroke();
    calendarAvatarCtx.restore();
}

function confirmCalendarAvatarEdit() {
    if (!calendarAvatarCropState.image) {
        closeCalendarAvatarEditor();
        return;
    }
    try {
        // 确保位置已限制在有效范围内
        clampAvatarEditorOffsets();

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = AVATAR_CANVAS_SIZE;
        exportCanvas.height = AVATAR_CANVAS_SIZE;
        const exportCtx = exportCanvas.getContext('2d');

        // 先填充白色背景，确保没有透明区域
        exportCtx.fillStyle = '#ffffff';
        exportCtx.fillRect(0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);

        // 使用用户在编辑器中调整好的位置和缩放
        const displayWidth = calendarAvatarCropState.image.width * calendarAvatarCropState.scale;
        const displayHeight = calendarAvatarCropState.image.height * calendarAvatarCropState.scale;

        // 确保图片至少覆盖整个画布（如果不够，则放大）
        const minWidth = AVATAR_CANVAS_SIZE;
        const minHeight = AVATAR_CANVAS_SIZE;
        const scaleX = displayWidth < minWidth ? minWidth / displayWidth : 1;
        const scaleY = displayHeight < minHeight ? minHeight / displayHeight : 1;
        const finalScale = Math.max(scaleX, scaleY);

        const finalWidth = displayWidth * finalScale;
        const finalHeight = displayHeight * finalScale;

        // 保持用户在编辑器中调整的相对位置，但确保覆盖画布
        const finalOffsetX = finalScale > 1
            ? (AVATAR_CANVAS_SIZE - finalWidth) / 2
            : calendarAvatarCropState.offsetX;
        const finalOffsetY = finalScale > 1
            ? (AVATAR_CANVAS_SIZE - finalHeight) / 2
            : calendarAvatarCropState.offsetY;

        // 绘制图片，不使用圆形裁剪，导出完整的正方形图片
        exportCtx.drawImage(
            calendarAvatarCropState.image,
            finalOffsetX,
            finalOffsetY,
            finalWidth,
            finalHeight
        );

        calendarProfileAvatarDataUrl = exportCanvas.toDataURL('image/png', 0.92);
        localStorage.setItem(CALENDAR_PROFILE_AVATAR_KEY, calendarProfileAvatarDataUrl);
    } catch (error) {
        console.warn('保存裁剪头像失败:', error);
    }
    updateCalendarAvatarUI();
    closeCalendarAvatarEditor();
}

function triggerCalendarAvatarUpload() {
    if (!calendarProfileAvatarInputEl) {
        initCalendarProfileUI();
    }
    if (calendarProfileAvatarInputEl) {
        calendarProfileAvatarInputEl.click();
    }
}

function handleCalendarAvatarFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        event.target.value = '';
        return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
        alert('图片大小不能超过 2MB');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        if (typeof reader.result !== 'string') {
            console.warn('头像数据解析失败');
            return;
        }
        openCalendarAvatarEditor(reader.result);
    };
    reader.onerror = () => {
        console.warn('读取头像数据失败');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function removeCalendarAvatar() {
    calendarProfileAvatarDataUrl = '';
    try {
        localStorage.removeItem(CALENDAR_PROFILE_AVATAR_KEY);
    } catch (error) {
        console.warn('移除头像失败:', error);
    }
    if (calendarProfileAvatarInputEl) {
        calendarProfileAvatarInputEl.value = '';
    }
    updateCalendarAvatarUI();
}

let calendarWeekGridEl = null;
let calendarMonthGridEl = null;
let calendarRangeLabelEl = null;
let calendarMiniGridEl = null;
let calendarMiniMonthLabelEl = null;
let calendarViewButtons = [];
let calendarPrevBtn = null;
let calendarNextBtn = null;
let calendarTodayBtn = null;
let calendarSearchInput = null;
let calendarAiToastEl = null;
let calendarAiPlayBtn = null;
let calendarAiCloseBtn = null;
let calendarModalEl = null;
let calendarModalTitleEl = null;
let calendarModalTimeEl = null;
let calendarModalLocationEl = null;
let calendarModalAttendeesEl = null;
let calendarModalDescriptionEl = null;
let calendarModalMaskEl = null;
let calendarModalCloseBtn = null;
let calendarModalEditBtn = null;
let calendarModalDeleteBtn = null;
let calendarDeleteTypeModalEl = null;
let calendarDeleteTypeMessageEl = null;

function ensureDeleteTypeModalRefs() {
    if (!calendarDeleteTypeModalEl) {
        calendarDeleteTypeModalEl = document.getElementById('calendar-delete-type-modal');
    }
    if (!calendarDeleteTypeMessageEl) {
        calendarDeleteTypeMessageEl = document.getElementById('calendar-delete-type-message');
    }
}
let calendarAudio = null;
let calendarAudioPlaying = false;
let calendarAiTimer = null;
let calendarAiShown = false;
let calendarFullscreenBtn = null;

function initCalendarModule() {
    if (calendarInitialized) return;

    calendarWeekGridEl = document.getElementById('calendar-week-grid');
    if (!calendarWeekGridEl) return;

    calendarMonthGridEl = document.getElementById('calendar-month-grid');
    calendarRangeLabelEl = document.getElementById('calendar-current-range');
    calendarMiniGridEl = document.getElementById('mini-calendar-grid');
    calendarMiniMonthLabelEl = document.getElementById('mini-calendar-month');
    calendarViewButtons = Array.from(document.querySelectorAll('[data-calendar-view]'));
    calendarPrevBtn = document.getElementById('calendar-prev-btn');
    calendarNextBtn = document.getElementById('calendar-next-btn');
    calendarTodayBtn = document.getElementById('calendar-today-btn');
    calendarSearchInput = document.getElementById('calendar-search-input');
    calendarAiToastEl = document.getElementById('calendar-ai-toast');
    calendarAiPlayBtn = document.getElementById('calendar-ai-play');
    calendarAiCloseBtn = document.getElementById('calendar-ai-close');
    calendarModalEl = document.getElementById('calendar-event-modal');
    calendarModalTitleEl = document.getElementById('calendar-modal-title');
    calendarModalTimeEl = document.getElementById('calendar-modal-time');
    calendarModalLocationEl = document.getElementById('calendar-modal-location');
    calendarModalAttendeesEl = document.getElementById('calendar-modal-attendees');
    calendarModalDescriptionEl = document.getElementById('calendar-modal-description');
    calendarModalMaskEl = document.getElementById('calendar-modal-mask');
    calendarModalCloseBtn = document.getElementById('calendar-modal-close-btn');
    calendarModalEditBtn = document.getElementById('calendar-modal-edit');
    calendarModalDeleteBtn = document.getElementById('calendar-modal-delete');
    calendarDeleteTypeModalEl = document.getElementById('calendar-delete-type-modal');
    calendarDeleteTypeMessageEl = document.getElementById('calendar-delete-type-message');
    calendarFullscreenBtn = document.getElementById('calendar-fullscreen-btn');

    // 新建事件按钮
    const calendarQuickCreateBtn = document.getElementById('calendar-quick-create');
    if (calendarQuickCreateBtn) {
        calendarQuickCreateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showCalendarCreateEventForm();
        });
    }

    // 快速创建按钮（侧边栏）
    const calendarSidebarCreateBtn = document.getElementById('calendar-sidebar-create');
    if (calendarSidebarCreateBtn) {
        calendarSidebarCreateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showCalendarCreateEventForm();
        });
    }

    // 设置按钮
    const calendarSettingBtn = document.getElementById('calendar-setting-btn');
    if (calendarSettingBtn) {
        calendarSettingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showCalendarSettings();
        });
    }

    if (calendarFullscreenBtn) {
        calendarFullscreenBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCalendarFullscreen();
        });
    }

    // 头像/个人中心按钮
    const calendarProfileChip = document.getElementById('calendar-profile-chip');
    if (calendarProfileChip) {
        calendarProfileChip.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showCalendarProfile();
        });
        // 添加鼠标样式提示
        calendarProfileChip.style.cursor = 'pointer';
    }

    initCalendarProfileUI();
    initAvatarEditorRefs();

    // 添加自定义类型按钮
    const addTypeBtn = document.getElementById('calendar-add-type-btn');
    if (addTypeBtn) {
        addTypeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showCalendarAddTypeModal();
        });
    }

    // 渲染自定义类型列表
    renderCalendarTypes();

    // 使用事件委托处理类型复选框
    const typesListEl = document.getElementById('calendar-types-list');
    if (typesListEl) {
        typesListEl.addEventListener('change', (e) => {
            if (e.target && e.target.type === 'checkbox' && e.target.dataset.calendar) {
                const calendarId = e.target.dataset.calendar;
                if (e.target.checked) {
                    calendarActiveCalendars.add(calendarId);
                } else {
                    calendarActiveCalendars.delete(calendarId);
                }
                renderCalendar();
                renderMiniCalendar();
            }
        });
    }

    if (calendarPrevBtn) {
        calendarPrevBtn.addEventListener('click', handleCalendarPrev);
    }
    if (calendarNextBtn) {
        calendarNextBtn.addEventListener('click', handleCalendarNext);
    }
    if (calendarTodayBtn) {
        calendarTodayBtn.addEventListener('click', () => {
            calendarSelectedDate = startOfDay(new Date());
            calendarMiniMonthDate = new Date(calendarSelectedDate.getFullYear(), calendarSelectedDate.getMonth(), 1);
            renderCalendar();
            renderMiniCalendar();
        });
    }
    const calendarSyncTasksBtn = document.getElementById('calendar-sync-tasks-btn');
    if (calendarSyncTasksBtn) {
        calendarSyncTasksBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            syncQuadrantTasksToCalendar();
        });
    }
    if (calendarSearchInput) {
        calendarSearchInput.addEventListener('input', handleCalendarSearch);
    }

    if (calendarViewButtons.length > 0) {
        calendarViewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.calendarView;
                if (!view) return;
                calendarViewMode = view;
                renderCalendar();
                renderMiniCalendar();
            });
        });
    }

    if (calendarWeekGridEl) {
        calendarWeekGridEl.addEventListener('click', handleCalendarEventClick);
        calendarWeekGridEl.addEventListener('keydown', event => {
            if (!event.target) return;
            if (event.target.classList.contains('event-card') && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                const eventId = event.target.dataset.eventId;
                if (eventId) {
                    openCalendarEventModal(eventId);
                }
            }
        });
    }

    if (calendarModalMaskEl) {
        calendarModalMaskEl.addEventListener('click', closeCalendarModal);
    }
    if (calendarModalCloseBtn) {
        calendarModalCloseBtn.addEventListener('click', closeCalendarModal);
    }
    if (calendarModalEditBtn) {
        calendarModalEditBtn.addEventListener('click', () => {
            if (calendarModalEditBtn.dataset.eventId) {
                editCalendarEvent(calendarModalEditBtn.dataset.eventId);
            }
        });
    }
    if (calendarModalDeleteBtn) {
        calendarModalDeleteBtn.addEventListener('click', () => {
            if (calendarModalDeleteBtn.dataset.eventId) {
                deleteCalendarEvent(calendarModalDeleteBtn.dataset.eventId);
            }
        });
    }

    if (calendarAiCloseBtn) {
        calendarAiCloseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            hideCalendarAiToast();
        });
    }
    if (calendarAiPlayBtn) {
        calendarAiPlayBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCalendarAudio();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('calendar-fullscreen-active')) {
            exitCalendarFullscreen();
        }
    });

    const miniPrev = document.getElementById('mini-calendar-prev');
    const miniNext = document.getElementById('mini-calendar-next');
    if (miniPrev) {
        miniPrev.addEventListener('click', () => {
            calendarMiniMonthDate = addMonths(calendarMiniMonthDate, -1);
            renderMiniCalendar();
        });
    }
    if (miniNext) {
        miniNext.addEventListener('click', () => {
            calendarMiniMonthDate = addMonths(calendarMiniMonthDate, 1);
            renderMiniCalendar();
        });
    }

    // 使用可用的音频源，如果加载失败则使用备用方案
    try {
        // 尝试使用一个公开可用的音频URL
        calendarAudio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
        calendarAudio.loop = true;
        calendarAudio.preload = 'auto';

        // 监听加载错误，如果失败则使用静默模式
        calendarAudio.addEventListener('error', (e) => {
            console.warn('音频加载失败，将使用静默模式');
            calendarAudio = null;
        });

        // 监听加载成功
        calendarAudio.addEventListener('canplaythrough', () => {
            console.log('✅ 背景音乐加载成功');
        });
    } catch (error) {
        console.warn('音频初始化失败:', error);
        calendarAudio = null;
    }

    renderCalendar();
    renderMiniCalendar();
    scheduleCalendarAiToast();

    calendarInitialized = true;
    console.log('🌄 沉浸式自然日历模块已初始化');
}

function renderCalendar() {
    if (!calendarInitialized) return;
    scheduleCalendarAiToast();

    if (calendarViewMode === 'month') {
        renderMonthView();
    } else {
        renderWeekOrDayView();
    }

    updateCalendarViewButtons();
    updateCalendarHeaderLabel();
}

function toggleCalendarFullscreen() {
    if (document.body.classList.contains('calendar-fullscreen-active')) {
        exitCalendarFullscreen();
    } else {
        enterCalendarFullscreen();
    }
}

function enterCalendarFullscreen() {
    document.body.classList.add('calendar-fullscreen-active');
    updateCalendarFullscreenButton(true);
    renderCalendar();
}

function exitCalendarFullscreen() {
    document.body.classList.remove('calendar-fullscreen-active');
    updateCalendarFullscreenButton(false);
    renderCalendar();
}

function updateCalendarFullscreenButton(isFullscreen) {
    const btn = calendarFullscreenBtn || document.getElementById('calendar-fullscreen-btn');
    if (!btn) return;
    const icon = btn.querySelector('.material-icons');
    if (icon) icon.textContent = isFullscreen ? 'fullscreen_exit' : 'fullscreen';
    btn.title = isFullscreen ? '退出全屏' : '沉浸全屏';
    btn.setAttribute('aria-label', btn.title);
}

function renderWeekOrDayView() {
    if (!calendarWeekGridEl) return;

    const startDate = calendarViewMode === 'day'
        ? startOfDay(calendarSelectedDate)
        : startOfWeek(calendarSelectedDate);
    const visibleDays = calendarViewMode === 'day' ? 1 : 7;

    calendarWeekGridEl.style.display = 'grid';
    if (calendarMonthGridEl) {
        calendarMonthGridEl.hidden = true;
        calendarMonthGridEl.style.display = 'none';
    }

    calendarWeekGridEl.style.gridTemplateColumns = calendarViewMode === 'day'
        ? '60px 1fr'
        : '60px repeat(7, 1fr)';

    const filteredEvents = getFilteredEvents();
    const hourRange = calculateVisibleHourRange(filteredEvents, startDate, visibleDays);
    const dayInfos = buildWeekGrid(startDate, visibleDays, hourRange);

    if (calendarViewMode === 'day') {
        const info = dayInfos[0];
        updateDayHeader(info.headerEl, calendarSelectedDate);
        info.columnEl.classList.add('selected');
        info.columnEl.dataset.date = calendarSelectedDate.toISOString();
        const eventsForDay = filteredEvents.filter(event => isSameDay(event.start, calendarSelectedDate));
        placeEventsInColumn(eventsForDay, info.slotContainer, calendarSelectedDate, hourRange);
    } else {
        dayInfos.forEach((info, index) => {
            const date = addDays(startDate, index);
            info.columnEl.dataset.date = date.toISOString();
            updateDayHeader(info.headerEl, date);
            const eventsForDay = filteredEvents.filter(event => isSameDay(event.start, date));
            placeEventsInColumn(eventsForDay, info.slotContainer, date, hourRange);
        });
    }
}

function renderMonthView() {
    if (!calendarMonthGridEl) return;
    calendarWeekGridEl.style.display = 'none';
    calendarMonthGridEl.hidden = false;
    calendarMonthGridEl.style.display = 'grid';
    calendarMonthGridEl.replaceChildren();

    const monthDate = new Date(calendarSelectedDate.getFullYear(), calendarSelectedDate.getMonth(), 1);
    calendarMiniMonthDate = new Date(monthDate);

    calendarWeekdaysZh.forEach(label => {
        const weekdayEl = document.createElement('div');
        weekdayEl.className = 'weekday';
        weekdayEl.textContent = label;
        calendarMonthGridEl.appendChild(weekdayEl);
    });

    const firstDayOfMonth = new Date(monthDate);
    const startOffset = getWeekdayIndex(firstDayOfMonth);
    const gridStart = addDays(firstDayOfMonth, -startOffset);
    const filteredEvents = getFilteredEvents();

    for (let i = 0; i < 42; i++) {
        const currentDate = addDays(gridStart, i);
        const cell = document.createElement('div');
        cell.className = 'month-cell';
        if (currentDate.getMonth() !== monthDate.getMonth()) {
            cell.classList.add('other-month');
        }
        if (isSameDay(currentDate, new Date())) {
            cell.classList.add('today');
        }
        if (isSameDay(currentDate, calendarSelectedDate)) {
            cell.classList.add('selected');
        }

        const numberEl = document.createElement('div');
        numberEl.className = 'date-number';
        numberEl.textContent = currentDate.getDate();
        cell.appendChild(numberEl);

        const eventsWrap = document.createElement('div');
        eventsWrap.className = 'month-events';
        const eventsForDay = filteredEvents.filter(event => isSameDay(event.start, currentDate));

        eventsForDay.slice(0, 2).forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'month-event';
            const color = getEventColor(event);
            eventEl.style.background = hexToRgba(color, 0.35);
            eventEl.style.borderColor = hexToRgba(color, 0.65);
            eventEl.style.color = '#ffffff';
            const text = document.createElement('span');
            text.textContent = event.title || '未命名事件';
            eventEl.appendChild(text);
            eventsWrap.appendChild(eventEl);
        });

        if (eventsForDay.length > 2) {
            const moreEl = document.createElement('div');
            moreEl.className = 'month-event more';
            moreEl.textContent = `+${eventsForDay.length - 2} 更多`;
            eventsWrap.appendChild(moreEl);
        }

        cell.appendChild(eventsWrap);
        cell.addEventListener('click', () => {
            calendarSelectedDate = startOfDay(currentDate);
            calendarViewMode = 'day';
            renderCalendar();
            renderMiniCalendar();
        });

        calendarMonthGridEl.appendChild(cell);
    }
}

function buildWeekGrid(startDate, visibleDays, hourRange) {
    const infos = [];
    calendarWeekGridEl.replaceChildren();

    const timeRail = document.createElement('div');
    timeRail.className = 'time-rail';
    for (let hour = hourRange.startHour; hour < hourRange.endHour; hour++) {
        const label = document.createElement('div');
        label.className = 'time-label';
        label.textContent = `${String(hour).padStart(2, '0')}:00`;
        timeRail.appendChild(label);
    }
    calendarWeekGridEl.appendChild(timeRail);

    for (let i = 0; i < visibleDays; i++) {
        const dayCol = document.createElement('div');
        dayCol.className = 'day-col';

        const header = document.createElement('div');
        header.className = 'day-header';
        dayCol.appendChild(header);

        const slotContainer = document.createElement('div');
        slotContainer.className = 'slot-container';
        // 确保容器有正确的定位和溢出控制
        slotContainer.style.position = 'relative';
        const slotHeight = (hourRange.endHour - hourRange.startHour) * CALENDAR_HOUR_HEIGHT;
        slotContainer.style.height = `${slotHeight}px`;
        slotContainer.style.overflow = 'hidden';
        slotContainer.style.width = '100%';
        for (let h = hourRange.startHour; h < hourRange.endHour; h++) {
            const slot = document.createElement('div');
            slot.className = 'hour-slot';
            slot.style.height = `${CALENDAR_HOUR_HEIGHT}px`;
            slotContainer.appendChild(slot);
        }
        dayCol.appendChild(slotContainer);

        calendarWeekGridEl.appendChild(dayCol);
        infos.push({ columnEl: dayCol, slotContainer, headerEl: header });
    }

    return infos;
}

function placeEventsInColumn(events, slotContainer, date, hourRange) {
    if (!slotContainer) return;
    const viewStartHour = hourRange.startHour;
    const viewEndHour = hourRange.endHour;
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), viewStartHour, 0, 0, 0);
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), viewEndHour, 0, 0, 0);

    const sortedEvents = [...events].sort((a, b) => a.start - b.start);
    const isSyncedTaskEvent = event => event && (event.sourceTaskId || String(event.id || '').startsWith('event-task-'));
    const compactSyncedTaskLayouts = new Map();
    let previousSyncedOriginalStart = null;
    let previousSyncedCompactStart = null;

    sortedEvents
        .filter(event => isSyncedTaskEvent(event) && isSameDay(event.start, date))
        .forEach(event => {
            const eventStart = Math.max(event.start.getTime(), dayStart.getTime());
            const eventEnd = Math.min(event.end.getTime(), dayEnd.getTime());
            if (eventEnd <= dayStart.getTime() || eventStart >= dayEnd.getTime()) {
                return;
            }

            const compactGap = 24 * 60000;
            const clusterBreak = 90 * 60000;
            const minDuration = 15 * 60000;
            let compactStart = eventStart;
            if (
                previousSyncedOriginalStart !== null &&
                eventStart - previousSyncedOriginalStart <= clusterBreak
            ) {
                compactStart = previousSyncedCompactStart + compactGap;
            }
            compactStart = Math.min(compactStart, dayEnd.getTime() - minDuration);
            const compactEnd = Math.min(compactStart + minDuration, dayEnd.getTime());

            compactSyncedTaskLayouts.set(event.id, {
                start: compactStart,
                end: compactEnd
            });
            previousSyncedOriginalStart = eventStart;
            previousSyncedCompactStart = compactStart;
        });
    const layouts = [];
    const active = [];
    const lanes = [];

    sortedEvents.forEach(event => {
        // 检查事件是否与当前日期匹配
        if (!isSameDay(event.start, date)) {
            return;
        }

        const compactTaskLayout = compactSyncedTaskLayouts.get(event.id);
        let eventStart = compactTaskLayout ? compactTaskLayout.start : Math.max(event.start.getTime(), dayStart.getTime());
        let eventEnd = compactTaskLayout ? compactTaskLayout.end : Math.min(event.end.getTime(), dayEnd.getTime());

        // 如果事件完全在视图范围外，跳过
        if (eventEnd <= dayStart.getTime() || eventStart >= dayEnd.getTime()) {
            return;
        }

        // 释放已结束的事件
        for (let i = active.length - 1; i >= 0; i--) {
            if (active[i].end <= eventStart) {
                lanes[active[i].lane] = false;
                active.splice(i, 1);
            }
        }

        let laneIndex = lanes.findIndex(occupied => !occupied);
        if (laneIndex === -1) {
            laneIndex = lanes.length;
            lanes.push(true);
        } else {
            lanes[laneIndex] = true;
        }

        const layout = {
            event,
            start: eventStart,
            end: eventEnd,
            lane: laneIndex,
            laneCount: active.length + 1
        };
        active.push(layout);
        layouts.push(layout);

        const activeCount = active.length;
        active.forEach(item => {
            item.laneCount = Math.max(item.laneCount, activeCount);
        });
    });

    const viewHeight = (viewEndHour - viewStartHour) * CALENDAR_HOUR_HEIGHT;
    const minuteHeight = CALENDAR_HOUR_HEIGHT / 60;

    layouts.forEach(layout => {
        const topMinutes = (layout.start - dayStart.getTime()) / 60000;
        const durationMinutes = Math.max(15, (layout.end - layout.start) / 60000); // 最小15分钟
        const height = durationMinutes * minuteHeight;
        const widthPercent = 100 / layout.laneCount;
        const leftPercent = widthPercent * layout.lane;

        const card = document.createElement('div');
        card.className = 'event-card';
        if (isSyncedTaskEvent(layout.event)) {
            card.classList.add('synced-task-event');
        }
        card.dataset.eventId = layout.event.id;

        const eventColor = getEventColor(layout.event);
        const darkerColor = adjustColorBrightness(eventColor, -20);
        card.style.background = `linear-gradient(135deg, ${eventColor}, ${darkerColor})`;
        card.style.borderColor = adjustColorBrightness(eventColor, -10);

        // 确保事件卡片在容器内，不超过容器高度
        const maxTop = viewHeight - height;
        const calculatedTop = topMinutes * minuteHeight;
        const finalTop = Math.max(0, Math.min(calculatedTop, maxTop));

        card.style.top = `${finalTop}px`;
        card.style.height = `${Math.min(height, viewHeight - finalTop)}px`;
        card.style.width = `calc(${widthPercent}% - 6px)`;
        card.style.left = `calc(${leftPercent}% + 3px)`;
        card.style.maxWidth = `calc(${widthPercent}% - 6px)`;
        card.style.boxSizing = 'border-box';
        card.style.position = 'absolute';
        card.tabIndex = 0;
        if (layout.event.title) {
            card.title = layout.event.title;
            card.setAttribute('aria-label', layout.event.title);
        }

        const title = document.createElement('div');
        title.className = 'event-title';
        title.textContent = layout.event.title || '未命名事件';
        card.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'event-meta';

        const time = document.createElement('div');
        time.className = 'event-time';
        time.textContent = formatTimeRange(layout.event.start, layout.event.end);
        meta.appendChild(time);

        const typeBadge = document.createElement('span');
        typeBadge.className = 'event-type-pill';
        typeBadge.textContent = getEventTypeName(layout.event.calendar);
        typeBadge.style.background = hexToRgba(eventColor, 0.18);
        typeBadge.style.color = eventColor;
        typeBadge.style.borderColor = hexToRgba(eventColor, 0.4);
        meta.appendChild(typeBadge);

        card.appendChild(meta);

        slotContainer.appendChild(card);
    });
}

function calculateVisibleHourRange(events, startDate, visibleDays) {
    const visibleStart = startOfDay(startDate);
    const visibleEnd = addDays(visibleStart, visibleDays);
    let minHour = Infinity;
    let maxHour = -Infinity;

    events.forEach(event => {
        if (event.end <= visibleStart || event.start >= visibleEnd) {
            return;
        }
        const eventStartHour = event.start.getHours() + event.start.getMinutes() / 60;
        const eventEndHour = event.end.getHours() + event.end.getMinutes() / 60;
        minHour = Math.min(minHour, Math.floor(eventStartHour));
        maxHour = Math.max(maxHour, Math.ceil(eventEndHour));
    });

    if (!isFinite(minHour) || !isFinite(maxHour)) {
        minHour = 8;
        maxHour = 16;
    }

    minHour = Math.max(0, minHour - 1);
    maxHour = Math.min(24, maxHour + 1);

    if (maxHour - minHour < 8) {
        maxHour = Math.min(24, minHour + 8);
    }

    return { startHour: minHour, endHour: maxHour };
}

function renderMiniCalendar() {
    if (!calendarMiniGridEl) return;
    calendarMiniGridEl.replaceChildren();

    const monthDate = new Date(calendarMiniMonthDate.getFullYear(), calendarMiniMonthDate.getMonth(), 1);
    if (calendarMiniMonthLabelEl) {
        calendarMiniMonthLabelEl.textContent = `${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`;
    }

    calendarWeekdaysZh.forEach(label => {
        const weekdayEl = document.createElement('div');
        weekdayEl.className = 'mc-cell mc-weekday';
        weekdayEl.textContent = label;
        calendarMiniGridEl.appendChild(weekdayEl);
    });

    const today = startOfDay(new Date());
    const startOffset = getWeekdayIndex(monthDate);
    const gridStart = addDays(monthDate, -startOffset);
    const totalCells = 42;

    for (let i = 0; i < totalCells; i++) {
        const currentDate = addDays(gridStart, i);
        const isCurrentMonth = currentDate.getMonth() === monthDate.getMonth();
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'mc-cell mc-date';
        cell.textContent = currentDate.getDate();
        cell.dataset.date = currentDate.toISOString();

        if (!isCurrentMonth) {
            cell.classList.add('muted');
        }
        if (isSameDay(currentDate, today)) {
            cell.classList.add('today');
        }
        if (isSameDay(currentDate, calendarSelectedDate)) {
            cell.classList.add('active');
        }

        cell.addEventListener('click', () => {
            calendarSelectedDate = startOfDay(currentDate);
            calendarViewMode = 'day';
            renderCalendar();
            renderMiniCalendar();
        });

        calendarMiniGridEl.appendChild(cell);
    }
}

function handleCalendarPrev() {
    if (calendarViewMode === 'day') {
        calendarSelectedDate = addDays(calendarSelectedDate, -1);
    } else if (calendarViewMode === 'week') {
        calendarSelectedDate = addDays(calendarSelectedDate, -7);
    } else {
        calendarSelectedDate = addMonths(calendarSelectedDate, -1);
    }
    calendarMiniMonthDate = new Date(calendarSelectedDate.getFullYear(), calendarSelectedDate.getMonth(), 1);
    renderCalendar();
    renderMiniCalendar();
}

function handleCalendarNext() {
    if (calendarViewMode === 'day') {
        calendarSelectedDate = addDays(calendarSelectedDate, 1);
    } else if (calendarViewMode === 'week') {
        calendarSelectedDate = addDays(calendarSelectedDate, 7);
    } else {
        calendarSelectedDate = addMonths(calendarSelectedDate, 1);
    }
    calendarMiniMonthDate = new Date(calendarSelectedDate.getFullYear(), calendarSelectedDate.getMonth(), 1);
    renderCalendar();
    renderMiniCalendar();
}

function handleCalendarSearch(event) {
    calendarSearchKeyword = event.target.value || '';
    renderCalendar();
}

function handleCalendarEventClick(event) {
    const card = event.target.closest('.event-card');
    if (!card) return;
    const eventId = card.dataset.eventId;
    if (!eventId) return;
    openCalendarEventModal(eventId);
}

function openCalendarEventModal(eventId) {
    const calendarEvent = calendarEventMap.get(eventId);
    if (!calendarEvent || !calendarModalEl) return;

    // 保存当前事件ID到按钮上
    if (calendarModalEditBtn) calendarModalEditBtn.dataset.eventId = eventId;
    if (calendarModalDeleteBtn) calendarModalDeleteBtn.dataset.eventId = eventId;

    if (calendarModalTitleEl) calendarModalTitleEl.textContent = calendarEvent.title;
    if (calendarModalTimeEl) calendarModalTimeEl.textContent = formatTimeRange(calendarEvent.start, calendarEvent.end);
    if (calendarModalLocationEl) calendarModalLocationEl.textContent = calendarEvent.location || '未填写地点';
    if (calendarModalAttendeesEl) calendarModalAttendeesEl.textContent = calendarEvent.attendees?.join('，') || '自由安排';
    if (calendarModalDescriptionEl) calendarModalDescriptionEl.textContent = calendarEvent.description || '暂无描述';

    calendarModalEl.classList.add('active');
    calendarModalEl.style.display = 'flex';
}

function closeCalendarModal() {
    if (!calendarModalEl) return;
    calendarModalEl.classList.remove('active');
    calendarModalEl.style.display = 'none';
    currentEditingEventId = null;
}

function updateDayHeader(headerEl, date) {
    if (!headerEl) return;
    const weekday = calendarWeekdaysZh[getWeekdayIndex(date)];
    const weekdayEl = document.createElement('span');
    weekdayEl.textContent = weekday;
    const dateEl = document.createElement('span');
    dateEl.textContent = `${date.getMonth() + 1}/${date.getDate()}`;
    headerEl.replaceChildren(weekdayEl, dateEl);
    const column = headerEl.parentElement;
    if (column) {
        column.classList.toggle('today', isSameDay(date, new Date()));
    }
}

function updateCalendarHeaderLabel() {
    if (!calendarRangeLabelEl) return;
    if (calendarViewMode === 'day') {
        calendarRangeLabelEl.textContent = formatDayLabel(calendarSelectedDate);
    } else if (calendarViewMode === 'week') {
        calendarRangeLabelEl.textContent = formatWeekRange(calendarSelectedDate);
    } else {
        calendarRangeLabelEl.textContent = formatMonthLabel(calendarSelectedDate);
    }
}

function updateCalendarViewButtons() {
    if (!calendarViewButtons.length) return;
    calendarViewButtons.forEach(btn => {
        const isActive = btn.dataset.calendarView === calendarViewMode;
        btn.classList.toggle('calendar-chip-active', isActive);
        btn.classList.toggle('calendar-primary', isActive);
        btn.setAttribute('aria-selected', isActive);
        btn.setAttribute('aria-pressed', isActive);
    });
}

function getFilteredEvents() {
    const keyword = calendarSearchKeyword.trim().toLowerCase();
    // 从 calendarEventMap 获取所有事件（包括新创建的）
    const allEvents = Array.from(calendarEventMap.values());
    return allEvents.filter(event => {
        if (!calendarActiveCalendars.has(event.calendar)) return false;
        if (!keyword) return true;
        const combined = [
            event.title,
            event.location || '',
            ...(event.attendees || []),
            event.description || ''
        ].join(' ').toLowerCase();
        return combined.includes(keyword);
    });
}

function scheduleCalendarAiToast() {
    if (!calendarAiToastEl || calendarAiShown) return;
    if (calendarAiTimer) {
        clearTimeout(calendarAiTimer);
    }
    calendarAiTimer = setTimeout(() => {
        calendarAiToastEl.classList.add('active');
        calendarAiShown = true;
        updateCalendarAudioButton();
    }, 3000);
}

function hideCalendarAiToast() {
    if (!calendarAiToastEl) return;
    calendarAiToastEl.classList.remove('active');
    if (calendarAudioPlaying) {
        toggleCalendarAudio();
    }
}

function toggleCalendarAudio() {
    if (!calendarAudio) {
        // 如果音频未加载，尝试重新初始化
        try {
            calendarAudio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
            calendarAudio.loop = true;
            calendarAudio.preload = 'auto';

            calendarAudio.addEventListener('error', (e) => {
                console.warn('音频加载失败');
                alert('抱歉，背景音乐暂时无法加载。您可以手动播放您喜欢的音乐。');
                calendarAudio = null;
                return;
            });
        } catch (error) {
            console.warn('音频初始化失败:', error);
            alert('抱歉，背景音乐暂时无法加载。您可以手动播放您喜欢的音乐。');
            return;
        }
    }

    if (calendarAudioPlaying) {
        calendarAudio.pause();
        calendarAudioPlaying = false;
    } else {
        calendarAudio.play().then(() => {
            calendarAudioPlaying = true;
            updateCalendarAudioButton();
        }).catch(error => {
            console.warn('音乐播放被浏览器阻止:', error);
            alert('音乐播放需要用户交互。请先点击页面任意位置，然后再点击播放按钮。');
            calendarAudioPlaying = false;
            updateCalendarAudioButton();
        });
    }
    updateCalendarAudioButton();
}

function updateCalendarAudioButton() {
    if (!calendarAiPlayBtn) return;
    const icon = calendarAudioPlaying ? 'pause' : 'play_arrow';
    const text = calendarAudioPlaying ? '暂停音乐' : '播放音乐';
    const iconEl = document.createElement('span');
    iconEl.className = 'material-icons';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = icon;
    calendarAiPlayBtn.replaceChildren(iconEl, document.createTextNode(text));
}

// 显示创建事件表单
function showCalendarCreateEventForm() {
    const modal = document.getElementById('calendar-create-event-modal');
    if (!modal) return;

    // 设置默认日期为当前选中的日期
    const dateInput = document.getElementById('calendar-event-date-input');
    if (dateInput && calendarSelectedDate) {
        const year = calendarSelectedDate.getFullYear();
        const month = String(calendarSelectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(calendarSelectedDate.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }

    // 设置默认时间为当前时间
    const startTimeInput = document.getElementById('calendar-event-start-time-input');
    const endTimeInput = document.getElementById('calendar-event-end-time-input');
    if (startTimeInput && endTimeInput) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        startTimeInput.value = `${hours}:${minutes}`;

        // 结束时间默认为开始时间后1小时
        const endTime = new Date(now.getTime() + 60 * 60 * 1000);
        const endHours = String(endTime.getHours()).padStart(2, '0');
        const endMinutes = String(endTime.getMinutes()).padStart(2, '0');
        endTimeInput.value = `${endHours}:${endMinutes}`;
    }

    // 清空其他输入
    document.getElementById('calendar-event-title-input').value = '';
    document.getElementById('calendar-event-location-input').value = '';
    document.getElementById('calendar-event-description-input').value = '';
    document.getElementById('calendar-event-category-select').value = 'personal';

    // 更新表单标题
    const modalTitle = modal.querySelector('.modal-header h3');
    if (modalTitle) modalTitle.textContent = '新建事件';

    currentEditingEventId = null;
    modal.style.display = 'flex';
}

// 关闭创建事件模态框
function closeCalendarCreateEventModal() {
    const modal = document.getElementById('calendar-create-event-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentEditingEventId = null;
}

// 保存日历事件
function saveCalendarEvent() {
    const titleInput = document.getElementById('calendar-event-title-input');
    const dateInput = document.getElementById('calendar-event-date-input');
    const startTimeInput = document.getElementById('calendar-event-start-time-input');
    const endTimeInput = document.getElementById('calendar-event-end-time-input');
    const locationInput = document.getElementById('calendar-event-location-input');
    const categorySelect = document.getElementById('calendar-event-category-select');
    const descriptionInput = document.getElementById('calendar-event-description-input');

    if (!titleInput || !titleInput.value.trim()) {
        alert('请输入事件标题');
        return;
    }

    if (!dateInput || !dateInput.value) {
        alert('请选择日期');
        return;
    }

    if (!startTimeInput || !startTimeInput.value) {
        alert('请选择开始时间');
        return;
    }

    if (!endTimeInput || !endTimeInput.value) {
        alert('请选择结束时间');
        return;
    }

    const [startHour, startMin] = startTimeInput.value.split(':').map(Number);
    const [endHour, endMin] = endTimeInput.value.split(':').map(Number);
    const [year, month, day] = dateInput.value.split('-').map(Number);

    const startDate = new Date(year, month - 1, day, startHour, startMin, 0, 0);
    const endDate = new Date(year, month - 1, day, endHour, endMin, 0, 0);

    if (endDate <= startDate) {
        alert('结束时间必须晚于开始时间');
        return;
    }

    // 从自定义类型中获取颜色
    const selectedType = calendarCustomTypes.find(t => t.id === (categorySelect ? categorySelect.value : 'personal'));
    const eventColor = selectedType ? selectedType.color : '#60a5fa';

    let eventId;
    let newEvent;

    if (currentEditingEventId) {
        // 编辑模式
        eventId = currentEditingEventId;
        const existingEvent = calendarEventMap.get(eventId);
        if (existingEvent) {
            newEvent = {
                ...existingEvent,
                title: titleInput.value.trim(),
                start: startDate,
                end: endDate,
                location: locationInput ? locationInput.value.trim() : '',
                description: descriptionInput ? descriptionInput.value.trim() : '',
                calendar: categorySelect ? categorySelect.value : 'personal',
                color: eventColor
            };
        }
    } else {
        // 新建模式
        eventId = 'event-' + Date.now();
        newEvent = {
            id: eventId,
            title: titleInput.value.trim(),
            start: startDate,
            end: endDate,
            location: locationInput ? locationInput.value.trim() : '',
            description: descriptionInput ? descriptionInput.value.trim() : '',
            calendar: categorySelect ? categorySelect.value : 'personal',
            color: eventColor
        };
        calendarEvents.push(newEvent);
    }

    // 更新 calendarEventMap
    calendarEventMap.set(eventId, newEvent);

    // 更新 calendarEvents 数组（如果是编辑）
    if (currentEditingEventId) {
        const index = calendarEvents.findIndex(e => e.id === eventId);
        if (index !== -1) {
            calendarEvents[index] = newEvent;
        }
    }

    persistCustomEventsFromMap();

    renderCalendar();
    renderMiniCalendar();

    console.log(currentEditingEventId ? '✅ 事件更新成功：' : '✅ 事件创建成功：', newEvent);
    closeCalendarCreateEventModal();
    currentEditingEventId = null;
}

// 显示日历设置
function showCalendarSettings() {
    const modal = document.getElementById('calendar-settings-modal');
    if (!modal) return;

    // 加载当前设置
    const defaultViewSelect = document.getElementById('calendar-default-view-select');
    const reminderSelect = document.getElementById('calendar-reminder-select');
    const themeSelect = document.getElementById('calendar-theme-select');

    if (defaultViewSelect) {
        defaultViewSelect.value = calendarViewMode || 'week';
    }

    // 这里可以从localStorage加载保存的设置
    const savedReminder = localStorage.getItem('calendar-reminder') || '15';
    const savedTheme = localStorage.getItem('calendar-theme') || 'auto';

    if (reminderSelect) reminderSelect.value = savedReminder;
    if (themeSelect) themeSelect.value = savedTheme;

    modal.style.display = 'flex';
}

// 关闭设置模态框
function closeCalendarSettingsModal() {
    const modal = document.getElementById('calendar-settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 保存日历设置
function saveCalendarSettings() {
    const defaultViewSelect = document.getElementById('calendar-default-view-select');
    const reminderSelect = document.getElementById('calendar-reminder-select');
    const themeSelect = document.getElementById('calendar-theme-select');

    if (defaultViewSelect) {
        calendarViewMode = defaultViewSelect.value;
        renderCalendar();
    }

    if (reminderSelect) {
        localStorage.setItem('calendar-reminder', reminderSelect.value);
    }

    if (themeSelect) {
        localStorage.setItem('calendar-theme', themeSelect.value);
    }

    closeCalendarSettingsModal();
    console.log('✅ 设置已保存');
}

// 显示个人中心
function showCalendarProfile() {
    const modal = document.getElementById('calendar-profile-modal');
    if (!modal) return;

    const nameInput = document.getElementById('calendar-profile-name-input');
    const modalName = document.getElementById('calendar-profile-modal-name');
    const eventsCount = document.getElementById('calendar-profile-events-count');
    const weekEventsCount = document.getElementById('calendar-profile-week-events-count');
    const displayName = calendarProfileName || '用户';

    updateCalendarProfileNameLabels(displayName);

    if (nameInput) nameInput.value = displayName;
    if (modalName) modalName.textContent = displayName;
    if (eventsCount) eventsCount.textContent = calendarEventMap.size + ' 个';
    if (weekEventsCount) weekEventsCount.textContent = getThisWeekEventsCount() + ' 个';

    updateCalendarAvatarUI();

    modal.style.display = 'flex';
}

// 关闭个人中心模态框
function closeCalendarProfileModal() {
    const modal = document.getElementById('calendar-profile-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 保存个人中心信息
function saveCalendarProfile() {
    const nameInput = document.getElementById('calendar-profile-name-input');

    if (nameInput && nameInput.value.trim()) {
        const newName = nameInput.value.trim();
        updateCalendarProfileNameLabels(newName);
        try {
            localStorage.setItem(CALENDAR_PROFILE_NAME_KEY, newName);
        } catch (error) {
            console.warn('保存个人中心用户名失败:', error);
        }
        console.log('✅ 用户名已更新：', newName);
    }

    closeCalendarProfileModal();
}

// 获取本周事件数量
function getThisWeekEventsCount() {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = addDays(weekStart, 6);

    let count = 0;
    calendarEventMap.forEach(event => {
        if (event.start >= weekStart && event.start <= weekEnd) {
            count++;
        }
    });

    return count;
}

// 渲染自定义类型列表
function renderCalendarTypes() {
    const typesList = document.getElementById('calendar-types-list');
    if (!typesList) return;

    // 清空现有列表
    typesList.replaceChildren();

    calendarCustomTypes.forEach(type => {
        const isDefault = defaultCalendarTypeIds.has(type.id);
        if (isDefault && !calendarActiveCalendars.has(type.id)) {
            calendarActiveCalendars.add(type.id);
        }

        const label = document.createElement('label');
        label.className = 'calendar-tag';
        label.dataset.calendarType = type.id;

        const content = document.createElement('span');
        content.className = 'calendar-tag-content';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `calendar-filter-${type.id}`;
        checkbox.dataset.calendar = type.id;
        checkbox.checked = calendarActiveCalendars.has(type.id);

        const dot = document.createElement('span');
        dot.className = 'tag-dot';
        dot.style.background = type.color;

        const text = document.createElement('span');
        text.textContent = type.name;

        content.appendChild(checkbox);
        content.appendChild(dot);
        content.appendChild(text);
        label.appendChild(content);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'calendar-type-delete';
        deleteBtn.dataset.calendarTypeId = type.id;
        deleteBtn.setAttribute('aria-label', `删除${type.name}`);
        const deleteIcon = document.createElement('span');
        deleteIcon.className = 'material-icons';
        deleteIcon.setAttribute('aria-hidden', 'true');
        deleteIcon.textContent = 'close';
        deleteBtn.appendChild(deleteIcon);
        deleteBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            showCalendarDeleteTypeModal(type.id);
        });
        label.appendChild(deleteBtn);

        typesList.appendChild(label);
    });

    // 更新创建事件表单的类型选项
    updateEventCategorySelect();
}

// 更新创建事件表单的类型选项
function updateEventCategorySelect() {
    const categorySelect = document.getElementById('calendar-event-category-select');
    if (!categorySelect) return;

    categorySelect.replaceChildren();
    calendarCustomTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.name;
        categorySelect.appendChild(option);
    });
}

// 显示添加自定义类型模态框
function showCalendarAddTypeModal() {
    const modal = document.getElementById('calendar-add-type-modal');
    if (!modal) return;

    const nameInput = document.getElementById('calendar-type-name-input');
    const colorInput = document.getElementById('calendar-type-color-input');
    if (nameInput) nameInput.value = '';
    if (colorInput) colorInput.value = '#667eea';
    modal.style.display = 'flex';
}

// 关闭添加自定义类型模态框
function closeCalendarAddTypeModal() {
    const modal = document.getElementById('calendar-add-type-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 保存自定义类型
function saveCalendarType() {
    const nameInput = document.getElementById('calendar-type-name-input');
    const colorInput = document.getElementById('calendar-type-color-input');

    if (!nameInput || !nameInput.value.trim()) {
        alert('请输入类型名称');
        return;
    }

    const typeId = 'type-' + Date.now();
    const newType = {
        id: typeId,
        name: nameInput.value.trim(),
        color: colorInput ? colorInput.value : '#667eea'
    };

    calendarCustomTypes.push(newType);
    calendarActiveCalendars.add(typeId);

    persistCustomCalendarTypes();

    renderCalendarTypes();
    renderCalendar();
    renderMiniCalendar();

    console.log('✅ 自定义类型添加成功：', newType);
    closeCalendarAddTypeModal();
}

function showCalendarDeleteTypeModal(typeId) {
    ensureDeleteTypeModalRefs();
    pendingTypeDeleteId = typeId;
    const type = calendarCustomTypes.find(t => t.id === typeId);
    if (calendarDeleteTypeMessageEl) {
        calendarDeleteTypeMessageEl.textContent = type
            ? `确定删除类型「${type.name}」及其相关事件吗？`
            : '确定删除该类型及其相关事件吗？';
    }
    if (calendarDeleteTypeModalEl) {
        calendarDeleteTypeModalEl.style.display = 'flex';
    }
}

function closeCalendarDeleteTypeModal() {
    ensureDeleteTypeModalRefs();
    pendingTypeDeleteId = null;
    if (calendarDeleteTypeModalEl) {
        calendarDeleteTypeModalEl.style.display = 'none';
    }
}

function confirmCalendarTypeDelete() {
    if (!pendingTypeDeleteId) {
        closeCalendarDeleteTypeModal();
        return;
    }
    deleteCalendarType(pendingTypeDeleteId);
    closeCalendarDeleteTypeModal();
}

function deleteCalendarType(typeId) {
    const type = calendarCustomTypes.find(t => t.id === typeId);
    if (!type) return;

    calendarCustomTypes = calendarCustomTypes.filter(t => t.id !== typeId);
    calendarActiveCalendars.delete(typeId);
    persistCustomCalendarTypes();

    calendarEvents = calendarEvents.filter(event => {
        if (event.calendar === typeId) {
            calendarEventMap.delete(event.id);
            return false;
        }
        return true;
    });
    calendarEventMap.clear();
    calendarEvents.forEach(event => calendarEventMap.set(event.id, event));
    syncCalendarGlobalState();
    persistCustomEventsFromMap();

    renderCalendarTypes();
    renderCalendar();
    renderMiniCalendar();
}

// 编辑事件
function editCalendarEvent(eventId) {
    console.log('📝 [editCalendarEvent] 开始编辑事件，ID:', eventId);
    const event = calendarEventMap.get(eventId);
    if (!event) {
        console.error('❌ [editCalendarEvent] 未找到事件');
        return;
    }

    // 先关闭事件详情模态框（这会重置 currentEditingEventId）
    closeCalendarModal();

    // 重要：必须在 closeCalendarModal() 之后设置，因为 closeCalendarModal 会重置为 null
    currentEditingEventId = eventId;
    console.log('✅ [editCalendarEvent] 已设置 currentEditingEventId =', currentEditingEventId);

    // 打开创建事件表单并填充数据
    const modal = document.getElementById('calendar-create-event-modal');
    if (!modal) return;

    const titleInput = document.getElementById('calendar-event-title-input');
    const dateInput = document.getElementById('calendar-event-date-input');
    const startTimeInput = document.getElementById('calendar-event-start-time-input');
    const endTimeInput = document.getElementById('calendar-event-end-time-input');
    const locationInput = document.getElementById('calendar-event-location-input');
    const categorySelect = document.getElementById('calendar-event-category-select');
    const descriptionInput = document.getElementById('calendar-event-description-input');

    if (titleInput) titleInput.value = event.title || '';
    if (dateInput) {
        const year = event.start.getFullYear();
        const month = String(event.start.getMonth() + 1).padStart(2, '0');
        const day = String(event.start.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }
    if (startTimeInput) {
        const hours = String(event.start.getHours()).padStart(2, '0');
        const minutes = String(event.start.getMinutes()).padStart(2, '0');
        startTimeInput.value = `${hours}:${minutes}`;
    }
    if (endTimeInput) {
        const hours = String(event.end.getHours()).padStart(2, '0');
        const minutes = String(event.end.getMinutes()).padStart(2, '0');
        endTimeInput.value = `${hours}:${minutes}`;
    }
    if (locationInput) locationInput.value = event.location || '';
    if (categorySelect) categorySelect.value = event.calendar || 'personal';
    if (descriptionInput) descriptionInput.value = event.description || '';

    // 更新表单标题
    const modalTitle = modal.querySelector('.modal-header h3');
    if (modalTitle) modalTitle.textContent = '编辑事件';

    modal.style.display = 'flex';

    console.log('🎯 [editCalendarEvent] 函数结束，currentEditingEventId =', currentEditingEventId);
}

// 删除事件
function deleteCalendarEvent(eventId) {
    if (!confirm('确定要删除这个事件吗？')) {
        return;
    }

    // 从 Map 和数组中删除
    calendarEventMap.delete(eventId);
    calendarEvents = calendarEvents.filter(event => event.id !== eventId);
    syncCalendarGlobalState();
    persistCustomEventsFromMap();

    renderCalendar();
    renderMiniCalendar();
    closeCalendarModal();

    console.log('✅ 事件删除成功');
}

// 关闭创建事件模态框
function closeCalendarCreateEventModal() {
    console.log('🚪 [closeCalendarCreateEventModal] 关闭模态框');
    console.log('🔍 [closeCalendarCreateEventModal] currentEditingEventId =', currentEditingEventId);

    const modal = document.getElementById('calendar-create-event-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // 重要：只在真正关闭时才重置编辑状态
    // 如果是从编辑模式打开的，保持 currentEditingEventId
    // 只有在保存或取消后才重置
    console.log('ℹ️ [closeCalendarCreateEventModal] 保持 currentEditingEventId 不变');
}

// 保存事件（创建或编辑）
function saveCalendarEvent() {
    console.log('💾 [saveCalendarEvent] 函数被调用');
    console.log('🔍 [saveCalendarEvent] currentEditingEventId =', currentEditingEventId);

    const titleInput = document.getElementById('calendar-event-title-input');
    const dateInput = document.getElementById('calendar-event-date-input');
    const startTimeInput = document.getElementById('calendar-event-start-time-input');
    const endTimeInput = document.getElementById('calendar-event-end-time-input');
    const locationInput = document.getElementById('calendar-event-location-input');
    const categorySelect = document.getElementById('calendar-event-category-select');
    const descriptionInput = document.getElementById('calendar-event-description-input');

    // 验证必填字段
    if (!titleInput || !titleInput.value.trim()) {
        alert('请输入事件标题');
        return;
    }
    if (!dateInput || !dateInput.value) {
        alert('请选择日期');
        return;
    }
    if (!startTimeInput || !startTimeInput.value) {
        alert('请选择开始时间');
        return;
    }
    if (!endTimeInput || !endTimeInput.value) {
        alert('请选择结束时间');
        return;
    }

    // 解析日期和时间
    const dateStr = dateInput.value;
    const startTimeStr = startTimeInput.value;
    const endTimeStr = endTimeInput.value;

    const [year, month, day] = dateStr.split('-').map(Number);
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    const [endHour, endMinute] = endTimeStr.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, startHour, startMinute);
    const endDate = new Date(year, month - 1, day, endHour, endMinute);

    // 验证时间逻辑
    if (endDate <= startDate) {
        alert('结束时间必须晚于开始时间');
        return;
    }

    const eventData = {
        title: titleInput.value.trim(),
        start: startDate,
        end: endDate,
        location: locationInput ? locationInput.value.trim() : '',
        calendar: categorySelect ? categorySelect.value : 'personal',
        description: descriptionInput ? descriptionInput.value.trim() : ''
    };

    if (currentEditingEventId) {
        // 编辑现有事件
        const existingEvent = calendarEventMap.get(currentEditingEventId);
        if (existingEvent) {
            // 更新事件属性
            existingEvent.title = eventData.title;
            existingEvent.start = eventData.start;
            existingEvent.end = eventData.end;
            existingEvent.location = eventData.location;
            existingEvent.calendar = eventData.calendar;
            existingEvent.description = eventData.description;

            // 同时更新 calendarEvents 数组中的事件
            const arrayIndex = calendarEvents.findIndex(e => e.id === currentEditingEventId);
            if (arrayIndex !== -1) {
                calendarEvents[arrayIndex] = existingEvent;
            }

            console.log('✅ 事件更新成功:', existingEvent);
        }
        // 重置编辑状态
        currentEditingEventId = null;
    } else {
        // 创建新事件
        const newEvent = {
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...eventData
        };

        // 添加到数组和Map
        calendarEvents.push(newEvent);
        calendarEventMap.set(newEvent.id, newEvent);

        console.log('✅ 事件创建成功:', newEvent);
    }

    // 持久化保存
    persistCustomEventsFromMap();

    // 重新渲染日历
    renderCalendar();
    renderMiniCalendar();

    // 关闭模态框
    closeCalendarCreateEventModal();

    // 重置表单标题
    const modal = document.getElementById('calendar-create-event-modal');
    if (modal) {
        const modalTitle = modal.querySelector('.modal-header h3');
        if (modalTitle) modalTitle.textContent = '新建事件';
    }
}

// 持久化保存日历事件
function persistCustomEventsFromMap() {
    try {
        const allEvents = Array.from(calendarEventMap.values());
        const eventsToSave = window.CalendarEventStorage
            ? window.CalendarEventStorage.setEvents('customCalendarEvents', allEvents)
            : allEvents.map(event => ({
                id: event.id,
                title: event.title,
                start: event.start instanceof Date ? event.start.toISOString() : event.start,
                end: event.end instanceof Date ? event.end.toISOString() : event.end,
                location: event.location || '',
                calendar: event.calendar || 'personal',
                description: event.description || '',
                color: event.color || '',
                sourceTaskId: event.sourceTaskId || ''
            }));
        const customEvents = eventsToSave.filter(event => String(event.id).startsWith('event-'));
        if (window.CalendarEventStorage) {
            window.CalendarEventStorage.setEvents('calendar-custom-events', customEvents);
        } else {
            localStorage.setItem('customCalendarEvents', JSON.stringify(eventsToSave));
            localStorage.setItem('calendar-custom-events', JSON.stringify(customEvents));
        }
        console.log('💾 已保存', eventsToSave.length, '个事件到localStorage');
    } catch (error) {
        console.error('❌ 保存事件失败:', error);
    }
}

// 调整颜色亮度
function adjustColorBrightness(color, percent) {
    if (!color || !color.startsWith('#')) {
        color = '#60a5fa';
    }
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + percent));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getEventColor(event) {
    if (event.color && event.color.startsWith('#')) {
        return event.color;
    }
    const type = calendarCustomTypes.find(t => t.id === event.calendar);
    return type ? type.color : '#60a5fa';
}

function getEventTypeName(calendarId) {
    const type = calendarCustomTypes.find(t => t.id === calendarId);
    return type ? type.name : '个人安排';
}

function hexToRgba(hex, alpha = 1) {
    let color = hex;
    if (!color || !color.startsWith('#')) {
        color = '#60a5fa';
    }
    const num = parseInt(color.replace('#', ''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatTimeRange(start, end) {
    const startStr = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    const endStr = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    return `${startStr} - ${endStr}`;
}

function formatWeekRange(date) {
    const start = startOfWeek(date);
    const end = addDays(start, 6);
    return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;
}

function formatDayLabel(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${calendarWeekdaysFullZh[getWeekdayIndex(date)]}`;
}

function formatMonthLabel(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function startOfWeek(date) {
    const start = startOfDay(date);
    const weekdayIndex = getWeekdayIndex(start); // 周一=0
    return addDays(start, -weekdayIndex);
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

function getWeekdayIndex(date) {
    return (date.getDay() + 6) % 7;
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}
