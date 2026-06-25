// ==================== 番茄专注功能 ====================

// 番茄专注计时器类
class PomodoroTimer {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentTime = 25 * 60; // 25分钟，以秒为单位
        this.workTime = 25 * 60;
        this.shortBreakTime = 5 * 60;
        this.longBreakTime = 15 * 60;
        this.currentMode = 'work'; // work, shortBreak, longBreak
        this.cycle = 0;
        this.timer = null;
        this.selectedTask = null;
        this.isCountdownMode = true;
        this.currentTrendPeriod = 7;

        this.init();
    }

    init() {
        console.log('🍅 番茄专注计时器初始化');
        this.bindEvents();
        this.updateDisplay();
        this.loadData();
    }

    bindEvents() {
        // 模式切换按钮
        const countdownModeBtn = document.getElementById('countdown-mode');
        const countupModeBtn = document.getElementById('countup-mode');

        if (countdownModeBtn) {
            countdownModeBtn.addEventListener('click', () => this.switchMode('countdown'));
        }

        if (countupModeBtn) {
            countupModeBtn.addEventListener('click', () => this.switchMode('countup'));
        }

        // 控制按钮
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');
        const resetBtn = document.getElementById('reset-btn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop({ savePartial: true }));
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        // 任务选择按钮
        const focusSelectBtn = document.getElementById('focus-select-btn');
        if (focusSelectBtn) {
            focusSelectBtn.addEventListener('click', () => this.showTaskSelector());
        }

        // 设置按钮
        const timeSettingsBtn = document.getElementById('time-settings-btn');
        const soundSettingsBtn = document.getElementById('sound-settings-btn');

        if (timeSettingsBtn) {
            timeSettingsBtn.addEventListener('click', () => this.showTimeSettings());
        }

        if (soundSettingsBtn) {
            soundSettingsBtn.addEventListener('click', () => this.showSoundSettings());
        }

        // 统计区域：周期切换按钮
        const periodBtns = document.querySelectorAll('.period-btn');
        periodBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                periodBtns.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.currentTrendPeriod = Number(e.currentTarget.dataset.period) || 7;
                this.updateTrendChart(this.currentTrendPeriod);
            });
        });

        // 统计区域：添加记录按钮
        const addRecordBtn = document.getElementById('add-record-btn');
        if (addRecordBtn) {
            addRecordBtn.addEventListener('click', () => this.showAddRecordModal());
        }
    }

    switchMode(mode) {
        const countdownBtn = document.getElementById('countdown-mode');
        const countupBtn = document.getElementById('countup-mode');

        if (mode === 'countdown') {
            countdownBtn?.classList.add('active');
            countupBtn?.classList.remove('active');
            this.isCountdownMode = true;
        } else {
            countdownBtn?.classList.remove('active');
            countupBtn?.classList.add('active');
            this.isCountdownMode = false;
        }

        this.reset();
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;

        this.updateControlState('running');

        // 开始计时
        this.timer = setInterval(() => {
            if (this.isCountdownMode) {
                this.currentTime--;
                if (this.currentTime <= 0) {
                    this.completeSession();
                }
            } else {
                this.currentTime++;
            }
            this.updateDisplay();
        }, 1000);

        console.log('🍅 番茄专注开始');
    }

    pause() {
        if (!this.isRunning && !this.isPaused) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            clearInterval(this.timer);
            this.isRunning = false;
            this.setButtonText('pause-btn', '继续');
        } else {
            this.setButtonText('pause-btn', '暂停');
            this.start();
        }

        console.log('🍅 番茄专注暂停/继续');
    }

    stop(options = {}) {
        const { savePartial = false } = options;
        const elapsedSeconds = this.getElapsedFocusSeconds();

        this.isRunning = false;
        this.isPaused = false;

        clearInterval(this.timer);

        if (savePartial && elapsedSeconds >= 60 && this.currentMode === 'work') {
            this.saveSession(elapsedSeconds, {
                completed: false,
                source: 'stopped'
            });
            this.showNotification(`已保存 ${Math.ceil(elapsedSeconds / 60)} 分钟专注记录`, 'success');
        }

        this.updateControlState('idle');
        this.setButtonText('pause-btn', '暂停');

        console.log('🍅 番茄专注停止');
    }

    getElapsedFocusSeconds() {
        if (this.currentMode !== 'work') return 0;
        if (this.isCountdownMode) {
            return Math.max(0, this.workTime - this.currentTime);
        }
        return Math.max(0, this.currentTime);
    }

    updateControlState(state) {
        const startBtn = document.getElementById('start-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const stopBtn = document.getElementById('stop-btn');

        if (startBtn) startBtn.style.display = state === 'running' ? 'none' : 'inline-flex';
        if (pauseBtn) pauseBtn.style.display = state === 'running' ? 'inline-flex' : 'none';
        if (stopBtn) stopBtn.style.display = state === 'running' ? 'inline-flex' : 'none';
    }

    setButtonText(buttonId, text) {
        const button = document.getElementById(buttonId);
        const label = button?.querySelector('.btn-text');
        if (label) {
            label.textContent = text;
        } else if (button) {
            button.textContent = text;
        }
    }

    reset() {
        this.stop();

        if (this.isCountdownMode) {
            this.currentTime = this.workTime;
        } else {
            this.currentTime = 0;
        }

        this.updateDisplay();
        console.log('🍅 番茄专注重置');
    }

    completeSession() {
        this.stop();

        if (this.isCountdownMode) {
            this.cycle++;
            this.saveSession();
            this.playConfiguredCompletionSound(this.currentMode);
            this.showCompletionNotification();

            // 自动切换到休息模式
            if (this.currentMode === 'work') {
                this.currentMode = this.cycle % 4 === 0 ? 'longBreak' : 'shortBreak';
                this.currentTime = this.currentMode === 'longBreak' ? this.longBreakTime : this.shortBreakTime;
            } else {
                this.currentMode = 'work';
                this.currentTime = this.workTime;
            }
        }

        this.updateDisplay();
    }

    updateDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (!timerDisplay) return;

        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // 更新进度圆环
        this.updateProgressCircle();
    }

    updateProgressCircle() {
        const progressCircle = document.querySelector('.timer-progress');
        if (!progressCircle) return;

        const totalTime = this.isCountdownMode ? this.getCurrentModeDuration() : 3600; // 正计时默认1小时进度
        const progress = this.isCountdownMode ?
            (totalTime - this.currentTime) / totalTime :
            this.currentTime / totalTime;

        const circumference = 2 * Math.PI * 90;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (progress * circumference);

        progressCircle.style.strokeDasharray = strokeDasharray;
        progressCircle.style.strokeDashoffset = strokeDashoffset;
    }

    getCurrentModeDuration() {
        if (this.currentMode === 'shortBreak') return this.shortBreakTime;
        if (this.currentMode === 'longBreak') return this.longBreakTime;
        return this.workTime;
    }

    showTaskSelector() {
        // 显示任务选择器模态框
        const taskSelector = document.createElement('div');
        taskSelector.className = 'task-selector-modal';

        taskSelector.append(
            this.createPomodoroOverlay(taskSelector),
            this.createTaskSelectorContent(taskSelector)
        );

        document.body.appendChild(taskSelector);
    }

    createTaskSelectorContent(modal) {
        const content = this.createPomodoroModalContent('500px', '80vh');
        const header = this.createPomodoroModalHeader('选择专注任务', modal);

        const body = document.createElement('div');
        body.className = 'modal-body pomodoro-modal-body pomodoro-task-selector-body';

        const taskListEl = document.createElement('div');
        taskListEl.className = 'task-list';
        this.populateTaskSelectorList(taskListEl);
        body.appendChild(taskListEl);

        content.append(header, body);
        return content;
    }

    populateTaskSelectorList(taskListEl) {
        // 获取任务列表
        const taskList = tasks || [];
        if (taskList.length === 0) {
            const empty = document.createElement('p');
            empty.textContent = '暂无任务，请先添加任务';
            taskListEl.appendChild(empty);
            return;
        }

        taskList.forEach(task => {
            taskListEl.appendChild(this.createTaskSelectorItem(task));
        });
    }

    createTaskSelectorItem(task) {
        const item = document.createElement('div');
        item.className = 'task-item pomodoro-selector-task';
        item.addEventListener('click', () => this.selectTask(task.id));

        const title = document.createElement('div');
        title.className = 'task-title pomodoro-selector-title';
        title.textContent = task.title || '未命名任务';

        const priority = document.createElement('div');
        priority.className = `task-priority pomodoro-priority-badge priority-${task.priority}`;
        priority.textContent = this.getPriorityText(task.priority);

        item.append(title, priority);
        return item;
    }

    selectTask(taskId) {
        const task = tasks.find(t => String(t.id) === String(taskId));
        if (task) {
            this.selectedTask = task;
            document.getElementById('focus-select-btn').textContent = task.title;
            const modal = document.querySelector('.task-selector-modal');
            if (modal) modal.remove();
            console.log('🍅 选择专注任务:', task.title);
        }
    }

    getPriorityText(priority) {
        const priorityMap = {
            1: '高',
            2: '中',
            3: '低'
        };
        return priorityMap[priority] || '中';
    }

    getPriorityColor(priority) {
        const colorMap = {
            1: '#ff4757', // 高优先级 - 红色
            2: '#ffa502', // 中优先级 - 橙色
            3: '#2ed573'  // 低优先级 - 绿色
        };
        return colorMap[priority] || '#ffa502';
    }

    showTimeSettings() {
        // 显示时间设置模态框
        const timeSettingsModal = document.createElement('div');
        timeSettingsModal.className = 'time-settings-modal';

        timeSettingsModal.append(
            this.createPomodoroOverlay(timeSettingsModal),
            this.createTimeSettingsContent(timeSettingsModal)
        );

        document.body.appendChild(timeSettingsModal);
    }

    createTimeSettingsContent(modal) {
        const content = this.createPomodoroModalContent('400px');
        const header = this.createPomodoroModalHeader('时间设置', modal);
        const body = document.createElement('div');
        body.className = 'modal-body pomodoro-modal-body';

        body.append(
            this.createTimeSettingGroup('工作时间 (分钟)', 'work-time-input', this.workTime / 60, 1, 60),
            this.createTimeSettingGroup('短休息时间 (分钟)', 'short-break-input', this.shortBreakTime / 60, 1, 30),
            this.createTimeSettingGroup('长休息时间 (分钟)', 'long-break-input', this.longBreakTime / 60, 1, 60),
            this.createTimeSettingsFooter(modal)
        );
        content.append(header, body);
        return content;
    }

    createPomodoroOverlay(modal) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.addEventListener('click', () => modal.remove());
        return overlay;
    }

    createPomodoroModalContent(maxWidth, maxHeight = '') {
        const content = document.createElement('div');
        content.className = 'modal-content pomodoro-modal-content';
        content.style.setProperty('--pomodoro-modal-max-width', maxWidth);
        if (maxHeight) {
            content.style.setProperty('--pomodoro-modal-max-height', maxHeight);
        }
        return content;
    }

    createPomodoroModalHeader(titleText, modal) {
        const header = document.createElement('div');
        header.className = 'modal-header pomodoro-modal-header';

        const title = document.createElement('h3');
        title.className = 'pomodoro-modal-title';
        title.textContent = titleText;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn pomodoro-modal-close';
        closeBtn.type = 'button';
        closeBtn.textContent = 'x';
        closeBtn.addEventListener('click', () => modal.remove());

        header.append(title, closeBtn);
        return header;
    }

    createTimeSettingGroup(labelText, inputId, value, min, max) {
        const group = document.createElement('div');
        group.className = 'setting-group pomodoro-setting-group';

        const label = document.createElement('label');
        label.htmlFor = inputId;
        label.className = 'pomodoro-setting-label';
        label.textContent = labelText;

        const input = document.createElement('input');
        input.type = 'number';
        input.id = inputId;
        input.value = String(value);
        input.min = String(min);
        input.max = String(max);
        input.className = 'pomodoro-setting-control';

        group.append(label, input);
        return group;
    }

    createTimeSettingsFooter(modal) {
        const footer = document.createElement('div');
        footer.className = 'modal-footer pomodoro-modal-footer';

        const cancelBtn = this.createPomodoroFooterButton('取消', 'pomodoro-modal-button');
        cancelBtn.addEventListener('click', () => modal.remove());

        const saveBtn = this.createPomodoroFooterButton('保存', 'pomodoro-modal-button pomodoro-modal-button-primary');
        saveBtn.addEventListener('click', () => this.saveTimeSettings());

        footer.append(cancelBtn, saveBtn);
        return footer;
    }

    createPomodoroFooterButton(text, className) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        return button;
    }

    saveTimeSettings() {
        const workTime = parseInt(document.getElementById('work-time-input').value) * 60;
        const shortBreakTime = parseInt(document.getElementById('short-break-input').value) * 60;
        const longBreakTime = parseInt(document.getElementById('long-break-input').value) * 60;

        this.workTime = workTime;
        this.shortBreakTime = shortBreakTime;
        this.longBreakTime = longBreakTime;

        // 如果当前是倒计时模式且没有在运行，更新显示时间
        if (this.isCountdownMode && !this.isRunning) {
            this.currentTime = this.workTime;
            this.updateDisplay();
        }

        // 保存到localStorage
        const settings = {
            workTime: this.workTime,
            shortBreakTime: this.shortBreakTime,
            longBreakTime: this.longBreakTime,
            isCountdownMode: this.isCountdownMode
        };
        window.DataSyncStorage.setRaw('pomodoroSettings', JSON.stringify(settings));

        // 关闭模态框
        document.querySelector('.time-settings-modal').remove();

        console.log('🍅 时间设置已保存');
        this.showNotification('时间设置已保存', 'success');
    }

    showSoundSettings() {
        // 显示音效设置模态框
        const soundSettingsModal = document.createElement('div');
        soundSettingsModal.className = 'sound-settings-modal';

        // 获取当前音效设置
        let soundSettings = {};
        try {
            soundSettings = JSON.parse(window.DataSyncStorage.getRaw('pomodoroSoundSettings') || '{}');
        } catch (error) {
            console.warn('加载番茄音效设置失败，已使用默认音效', error);
        }
        const enableSounds = soundSettings.enableSounds !== false; // 默认开启
        const workSound = this.normalizeSoundValue(soundSettings.workSound, 'meditation-bell');
        const breakSound = this.normalizeSoundValue(soundSettings.breakSound, 'wind-chimes');
        const volume = soundSettings.volume || 0.7;

        soundSettingsModal.append(
            this.createPomodoroOverlay(soundSettingsModal),
            this.createSoundSettingsContent(soundSettingsModal, {
                enableSounds,
                workSound,
                breakSound,
                volume
            })
        );

        document.body.appendChild(soundSettingsModal);
    }

    createSoundSettingsContent(modal, settings) {
        const content = this.createPomodoroModalContent('400px');
        const header = this.createPomodoroModalHeader('音效设置', modal);
        const body = document.createElement('div');
        body.className = 'modal-body pomodoro-modal-body';

        body.append(
            this.createEnableSoundGroup(settings.enableSounds),
            this.createVolumeGroup(settings.volume),
            this.createSoundSelectGroup('工作完成音效', 'work-sound-select', settings.workSound),
            this.createSoundSelectGroup('休息开始音效', 'break-sound-select', settings.breakSound),
            this.createTestSoundGroup(),
            this.createSoundSettingsFooter(modal)
        );

        content.append(header, body);
        return content;
    }

    createEnableSoundGroup(enableSounds) {
        const group = document.createElement('div');
        group.className = 'setting-group pomodoro-setting-group';

        const label = document.createElement('label');
        label.className = 'pomodoro-check-label';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'enable-sounds';
        checkbox.checked = enableSounds;
        checkbox.className = 'pomodoro-check-input';

        const text = document.createElement('span');
        text.className = 'pomodoro-check-text';
        text.textContent = '启用音效';

        label.append(checkbox, text);
        group.appendChild(label);
        return group;
    }

    createVolumeGroup(volume) {
        const group = document.createElement('div');
        group.className = 'setting-group pomodoro-setting-group';

        const label = document.createElement('label');
        label.htmlFor = 'volume-slider';
        label.className = 'pomodoro-setting-label';
        label.textContent = '音量';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'volume-slider';
        slider.min = '0';
        slider.max = '1';
        slider.step = '0.1';
        slider.value = String(volume);
        slider.className = 'pomodoro-volume-slider';

        const displayWrap = document.createElement('div');
        displayWrap.className = 'pomodoro-volume-display';
        const display = document.createElement('span');
        display.id = 'volume-display';
        display.textContent = `${Math.round(volume * 100)}%`;
        displayWrap.append(document.createTextNode('音量: '), display);
        slider.addEventListener('input', () => {
            display.textContent = `${Math.round(Number(slider.value) * 100)}%`;
        });

        group.append(label, slider, displayWrap);
        return group;
    }

    createSoundSelectGroup(labelText, selectId, selectedValue) {
        const group = document.createElement('div');
        group.className = 'setting-group pomodoro-setting-group';

        const label = document.createElement('label');
        label.htmlFor = selectId;
        label.className = 'pomodoro-setting-label';
        label.textContent = labelText;

        const select = document.createElement('select');
        select.id = selectId;
        select.className = 'pomodoro-setting-control';
        this.getSoundOptions().forEach(sound => {
            const option = document.createElement('option');
            option.value = sound.value;
            option.selected = selectedValue === sound.value;
            option.textContent = `${sound.file ? '🎵' : '🔇'} ${sound.label}`;
            select.appendChild(option);
        });

        group.append(label, select);
        return group;
    }

    createTestSoundGroup() {
        const wrapper = document.createElement('div');
        wrapper.className = 'test-sound pomodoro-test-sound';

        const button = this.createPomodoroFooterButton('🔊 测试音效', 'pomodoro-modal-button pomodoro-modal-button-outline');
        button.addEventListener('click', () => this.testSound());
        wrapper.appendChild(button);
        return wrapper;
    }

    createSoundSettingsFooter(modal) {
        const footer = document.createElement('div');
        footer.className = 'modal-footer pomodoro-modal-footer';

        const cancelBtn = this.createPomodoroFooterButton('取消', 'pomodoro-modal-button');
        cancelBtn.addEventListener('click', () => modal.remove());

        const saveBtn = this.createPomodoroFooterButton('保存', 'pomodoro-modal-button pomodoro-modal-button-primary');
        saveBtn.addEventListener('click', () => this.saveSoundSettings());

        footer.append(cancelBtn, saveBtn);
        return footer;
    }

    saveSoundSettings() {
        const enableSounds = document.getElementById('enable-sounds').checked;
        const volume = parseFloat(document.getElementById('volume-slider').value);
        const workSound = document.getElementById('work-sound-select').value;
        const breakSound = document.getElementById('break-sound-select').value;

        const settings = {
            enableSounds,
            volume,
            workSound,
            breakSound
        };

        window.DataSyncStorage.setRaw('pomodoroSoundSettings', JSON.stringify(settings));

        // 关闭模态框
        document.querySelector('.sound-settings-modal').remove();

        console.log('🍅 音效设置已保存');
        this.showNotification('音效设置已保存', 'success');
    }

    testSound() {
        const volume = parseFloat(document.getElementById('volume-slider').value);
        const workSound = document.getElementById('work-sound-select').value;

        if (workSound !== 'none') {
            this.playSound(workSound, volume);
        }
    }

    getSoundOptions() {
        return [
            {
                value: 'meditation-bell',
                label: '冥想钟声',
                file: 'assets/audio/pomodoro/meditation-bell.mp3'
            },
            {
                value: 'wind-chimes',
                label: '夜间风铃',
                file: 'assets/audio/pomodoro/wind-chimes-at-night.mp3'
            },
            {
                value: 'soft-prompt',
                label: '轻提示音',
                file: 'assets/audio/pomodoro/beep-master-9000.mp3'
            },
            {
                value: 'none',
                label: '无音效',
                file: null
            }
        ];
    }

    normalizeSoundValue(value, fallback) {
        const legacyMap = {
            bell: 'meditation-bell',
            chime: 'wind-chimes',
            beep: 'soft-prompt'
        };
        const normalized = legacyMap[value] || value || fallback;
        return this.getSoundOptions().some(sound => sound.value === normalized) ? normalized : fallback;
    }

    playConfiguredCompletionSound(completedMode) {
        let soundSettings = {};
        try {
            soundSettings = JSON.parse(window.DataSyncStorage.getRaw('pomodoroSoundSettings') || '{}');
        } catch (error) {
            console.warn('读取番茄音效设置失败，跳过播放', error);
        }

        if (soundSettings.enableSounds === false) return;

        const volume = Number(soundSettings.volume ?? 0.7);
        const soundValue = completedMode === 'work'
            ? this.normalizeSoundValue(soundSettings.workSound, 'meditation-bell')
            : this.normalizeSoundValue(soundSettings.breakSound, 'wind-chimes');

        this.playSound(soundValue, volume);
    }

    playSound(soundType, volume = 0.7) {
        const sound = this.getSoundOptions().find(item => item.value === soundType);
        if (sound?.file) {
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            }

            const audio = new Audio(sound.file);
            audio.volume = Math.max(0, Math.min(1, volume));
            this.currentAudio = audio;
            audio.play().catch(error => {
                console.warn('真实音效播放失败，使用合成音兜底', error);
                this.playSyntheticSound(soundType, volume);
            });
            return;
        }

        if (soundType === 'none') return;

        this.playSyntheticSound(soundType, volume);
    }

    playSyntheticSound(soundType, volume = 0.7) {
        // 创建音效
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 设置音效类型
        switch (soundType) {
            case 'bell':
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
                break;
            case 'chime':
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
                break;
            case 'beep':
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                break;
        }

        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    saveSession(duration = this.workTime, metadata = {}) {
        const normalizedDuration = Math.max(0, Math.round(Number(duration) || 0));
        if (normalizedDuration <= 0) return;
        // 保存专注会话数据
        const sessionData = {
            id: `pomodoro-${Date.now()}`,
            date: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: normalizedDuration,
            task: this.selectedTask ? this.selectedTask.title : '未选择任务',
            taskTitle: this.selectedTask ? this.selectedTask.title : '未选择任务',
            mode: this.currentMode,
            completed: metadata.completed !== false,
            source: metadata.source || 'completed'
        };

        // 保存到localStorage
        const storage = window.PomodoroStorage;
        if (storage) {
            storage.addSession(sessionData);
        } else {
            const sessions = JSON.parse(window.DataSyncStorage.getRaw('pomodoroSessions') || '[]');
            sessions.push(sessionData);
            window.DataSyncStorage.setRaw('pomodoroSessions', JSON.stringify(sessions));
        }

        // 更新统计
        this.updateStats();
    }

    updateStats() {
        const sessions = window.PomodoroStorage
            ? window.PomodoroStorage.getSessions()
            : JSON.parse(window.DataSyncStorage.getRaw('pomodoroSessions') || '[]');
        const today = new Date().toDateString();
        const todaySessions = sessions.filter(s => new Date(s.date).toDateString() === today);

        // 更新今日番茄数
        const todayPomodoros = document.getElementById('today-pomodoros');
        if (todayPomodoros) {
            todayPomodoros.textContent = todaySessions.length;
        }

        // 更新今日专注时长
        const todayFocusTime = document.getElementById('today-focus-time');
        if (todayFocusTime) {
            const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
            todayFocusTime.textContent = `${Math.round(totalMinutes)} m`;
        }

        // 更新总番茄数
        const totalPomodoros = document.getElementById('total-pomodoros');
        if (totalPomodoros) {
            totalPomodoros.textContent = sessions.length;
        }

        // 更新总专注时长
        const totalFocusTime = document.getElementById('total-focus-time');
        if (totalFocusTime) {
            const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;
            totalFocusTime.textContent = `${Math.round(totalMinutes)} m`;
        }

        this.updateTrendChart(this.currentTrendPeriod);
        this.updateRecordsList(sessions);
    }

    updateRecordsList(sessions) {
        const recordsList = document.getElementById('focus-records-list');
        if (!recordsList) return;

        const recentSessions = [...sessions]
            .sort((a, b) => new Date(b.date || b.endTime) - new Date(a.date || a.endTime))
            .slice(0, 5);

        recordsList.replaceChildren();

        if (recentSessions.length === 0) {
            recordsList.appendChild(this.createEmptyRecordsState());
            return;
        }

        recentSessions.forEach(session => {
            recordsList.appendChild(this.createFocusRecordItem(session));
        });
    }

    createEmptyRecordsState() {
        const empty = document.createElement('div');
        empty.className = 'empty-records';
        const icon = document.createElement('div');
        icon.className = 'empty-icon';
        icon.textContent = '🍅';
        const text = document.createElement('p');
        text.className = 'empty-text';
        text.textContent = '还没有专注记录';
        empty.append(icon, text);
        return empty;
    }

    createFocusRecordItem(session) {
        const item = document.createElement('div');
        item.className = 'focus-record-item';

        const main = document.createElement('div');
        main.className = 'record-main';

        const title = document.createElement('span');
        title.className = 'record-title';
        title.textContent = session.taskTitle || session.task || '未选择任务';

        const time = document.createElement('span');
        time.className = 'record-time';
        const sessionDate = new Date(session.date || session.endTime);
        time.textContent = Number.isNaN(sessionDate.getTime())
            ? '-'
            : sessionDate.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

        const duration = document.createElement('span');
        duration.className = 'record-duration';
        duration.textContent = `${Math.round((Number(session.duration) || 0) / 60)}m`;

        main.append(title, time);
        item.append(main, duration);
        return item;
    }

    escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    updateTrendChart(days) {
        const chartContainer = document.getElementById('focus-trend-chart');
        if (!chartContainer) return;

        // 保留 chart-placeholder 的样式结构，在内部渲染柱状图
        let placeholder = chartContainer.querySelector('.chart-placeholder');
        if (!placeholder) {
            placeholder = document.createElement('div');
            placeholder.className = 'chart-placeholder';
            chartContainer.appendChild(placeholder);
        }

        const sessions = window.PomodoroStorage
            ? window.PomodoroStorage.getSessions()
            : JSON.parse(window.DataSyncStorage.getRaw('pomodoroSessions') || '[]');
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        // 按天统计
        const dailyData = {};
        for (let i = 0; i < days; i++) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const key = d.toDateString();
            dailyData[key] = 0;
        }

        sessions.forEach(s => {
            const sDate = new Date(s.date || s.endTime);
            if (sDate >= startDate) {
                const key = sDate.toDateString();
                if (dailyData[key] !== undefined) dailyData[key]++;
            }
        });

        // 渲染柱状图
        const entries = Object.entries(dailyData).reverse();
        const maxVal = Math.max(...Object.values(dailyData), 1);

        const labelStep = days > 14 ? 5 : 1;

        placeholder.replaceChildren(this.createPomodoroTrendBars(entries, maxVal, days, labelStep));
    }

    createPomodoroTrendBars(entries, maxVal, days, labelStep) {
        const bars = document.createElement('div');
        bars.className = 'pomodoro-trend-bars';
        bars.style.setProperty('--trend-days', days);

        entries.forEach(([date, count], index) => {
            const day = document.createElement('div');
            day.className = 'pomodoro-trend-day';

            const countEl = document.createElement('span');
            countEl.className = 'pomodoro-trend-count';
            countEl.textContent = String(count);

            const bar = document.createElement('div');
            bar.className = 'pomodoro-trend-bar';
            bar.style.height = `${(count / maxVal) * 100}%`;

            const label = document.createElement('span');
            label.className = 'pomodoro-trend-label';
            label.textContent = index === 0 || index === entries.length - 1 || index % labelStep === 0
                ? date.slice(4, 10)
                : '';

            day.append(countEl, bar, label);
            bars.appendChild(day);
        });

        return bars;
    }

    showAddRecordModal() {
        const modal = document.createElement('div');
        modal.className = 'add-record-modal';
        modal.append(
            this.createPomodoroOverlay(modal),
            this.createAddRecordContent(modal)
        );
        document.body.appendChild(modal);
    }

    createAddRecordContent(modal) {
        const content = document.createElement('div');
        content.className = 'modal-content pomodoro-add-record-content';

        const title = document.createElement('h3');
        title.className = 'pomodoro-add-record-title';
        title.textContent = '添加专注记录';

        const minutesGroup = this.createManualRecordField('专注时长（分钟）', 'record-minutes', 'number', '25');
        const minutesInput = minutesGroup.querySelector('input');
        minutesInput.min = '1';
        minutesInput.max = '120';
        minutesInput.classList.add('pomodoro-record-input-lg');

        const noteGroup = this.createManualRecordField('备注（可选）', 'record-note', 'text', '');
        const noteInput = noteGroup.querySelector('input');
        noteInput.placeholder = '如：编码、阅读...';
        noteInput.classList.add('pomodoro-record-input-sm');

        const actions = document.createElement('div');
        actions.className = 'pomodoro-record-actions';
        const cancelBtn = this.createPomodoroFooterButton('取消', 'pomodoro-record-button');
        cancelBtn.addEventListener('click', () => modal.remove());
        const saveBtn = this.createPomodoroFooterButton('保存', 'pomodoro-record-button pomodoro-record-button-primary');
        saveBtn.addEventListener('click', () => this.saveManualRecord());
        actions.append(cancelBtn, saveBtn);

        content.append(title, minutesGroup, noteGroup, actions);
        return content;
    }

    createManualRecordField(labelText, inputId, type, value) {
        const group = document.createElement('div');
        group.className = inputId === 'record-note' ? 'pomodoro-record-field pomodoro-record-field-note' : 'pomodoro-record-field';

        const label = document.createElement('label');
        label.htmlFor = inputId;
        label.className = 'pomodoro-record-label';
        label.textContent = labelText;

        const input = document.createElement('input');
        input.type = type;
        input.id = inputId;
        input.value = value;
        input.className = 'pomodoro-record-input';

        group.append(label, input);
        return group;
    }

    saveManualRecord() {
        const minutes = parseInt(document.getElementById('record-minutes').value) || 25;
        const note = document.getElementById('record-note').value.trim() || '手动记录';

        const session = {
            id: `manual-${Date.now()}`,
            date: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: minutes * 60,
            mode: 'work',
            taskTitle: note,
            manual: true
        };

        if (window.PomodoroStorage) {
            window.PomodoroStorage.addSession(session);
        } else {
            const sessions = JSON.parse(window.DataSyncStorage.getRaw('pomodoroSessions') || '[]');
            sessions.push(session);
            window.DataSyncStorage.setRaw('pomodoroSessions', JSON.stringify(sessions));
        }

        document.querySelector('.add-record-modal')?.remove();
        this.updateStats();
        this.showNotification('专注记录已添加', 'success');
    }

    showCompletionNotification() {
        // 显示完成通知
        const notification = document.createElement('div');
        notification.className = 'pomodoro-notification';
        const content = document.createElement('div');
        content.className = 'notification-content';
        const icon = document.createElement('div');
        icon.className = 'notification-icon';
        icon.textContent = '🍅';
        const text = document.createElement('div');
        text.className = 'notification-text';
        const title = document.createElement('h3');
        title.textContent = '专注完成！';
        const desc = document.createElement('p');
        desc.textContent = '恭喜您完成了一个番茄钟';
        text.append(title, desc);
        content.append(icon, text);
        notification.appendChild(content);

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    loadData() {
        let savedSettings = {};
        try {
            savedSettings = JSON.parse(window.DataSyncStorage.getRaw('pomodoroSettings') || '{}');
        } catch (error) {
            console.warn('加载番茄钟设置失败，已回退默认值', error);
        }

        if (savedSettings.workTime) this.workTime = Number(savedSettings.workTime);
        if (savedSettings.shortBreakTime) this.shortBreakTime = Number(savedSettings.shortBreakTime);
        if (savedSettings.longBreakTime) this.longBreakTime = Number(savedSettings.longBreakTime);
        this.isCountdownMode = savedSettings.isCountdownMode !== false;
        this.currentTime = this.isCountdownMode ? this.getCurrentModeDuration() : 0;
        this.updateDisplay();
        this.updateStats();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `pomodoro-notification pomodoro-notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.classList.add('is-exiting');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 全局番茄专注计时器实例
let pomodoroTimer = null;

// 初始化番茄专注功能
function initPomodoroTimer() {
    if (!pomodoroTimer) {
        pomodoroTimer = new PomodoroTimer();
    }
    console.log('🍅 番茄专注功能已初始化');
}

let habitTrackerSystem = null;

// 初始化习惯打卡功能
function initHabitTracker() {
    if (!habitTrackerSystem) {
        habitTrackerSystem = new HabitTracker();
    }
    console.log('📅 习惯打卡功能已初始化');
}

// 习惯打卡系统类
class HabitTracker {
    constructor() {
        this.habits = [];
        this.checkIns = [];
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.init();
    }

    init() {
        console.log('🚀 习惯打卡系统初始化');
        this.loadData();
        this.bindEvents();
        this.render();
    }

    // 加载数据
    loadData() {
        const savedHabits = window.DataSyncStorage.getRaw('habitTracker_habits');
        const savedCheckIns = window.DataSyncStorage.getRaw('habitTracker_checkIns');

        if (savedHabits) {
            this.habits = JSON.parse(savedHabits);
        }

        if (savedCheckIns) {
            this.checkIns = JSON.parse(savedCheckIns);
        }

        console.log('📊 加载习惯数据:', this.habits.length, '个习惯');
        console.log('📊 加载打卡数据:', this.checkIns.length, '条记录');
    }

    // 保存数据
    saveData() {
        window.DataSyncStorage.setRaw('habitTracker_habits', JSON.stringify(this.habits));
        window.DataSyncStorage.setRaw('habitTracker_checkIns', JSON.stringify(this.checkIns));
    }

    // 绑定事件
    bindEvents() {
        // 添加习惯按钮
        const addBtn = document.querySelector('.habit-add-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddModal());
        }

        // 模态框相关事件
        const modal = document.getElementById('habitModal');
        const closeBtn = document.getElementById('habitCloseModal');
        const cancelBtn = document.getElementById('habitCancelBtn');
        const saveBtn = document.getElementById('habitSaveBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideModal());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveHabit());
        }

        // 图标选择事件
        const iconItems = document.querySelectorAll('.habit-icon-item');
        iconItems.forEach(item => {
            item.addEventListener('click', () => this.selectIcon(item));
        });

        // 日期导航事件
        const prevBtn = document.querySelector('.habit-prev-btn');
        const nextBtn = document.querySelector('.habit-next-btn');
        const todayBtn = document.querySelector('.habit-today-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.changeDate(-1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.changeDate(1));
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', () => this.goToToday());
        }

        // 日历按钮事件
        const calendarBtn = document.querySelector('.habit-calendar-btn');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', () => this.showCalendar());
        }

        // 统计按钮事件
        const statsBtn = document.querySelector('.habit-stats-btn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => this.showStats());
        }

        // 设置按钮事件
        const settingsBtn = document.querySelector('.habit-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }

        // 日期导航事件
        const habitPrevBtn = document.querySelector('.habit-prev-btn');
        const habitNextBtn = document.querySelector('.habit-next-btn');

        if (habitPrevBtn) {
            habitPrevBtn.addEventListener('click', () => this.changeDate(-1));
        }

        if (habitNextBtn) {
            habitNextBtn.addEventListener('click', () => this.changeDate(1));
        }

        // 日期选择事件
        document.addEventListener('click', (e) => {
            const closeModalBtn = e.target.closest('[data-habit-modal-close]');
            if (closeModalBtn) {
                closeModalBtn.closest('.habit-modal-overlay')?.remove();
                return;
            }

            const monthNavBtn = e.target.closest('[data-habit-month-delta]');
            if (monthNavBtn) {
                this.changeCalendarMonth(Number(monthNavBtn.dataset.habitMonthDelta));
                return;
            }

            const calendarDate = e.target.closest('[data-habit-calendar-date]');
            if (calendarDate) {
                this.selectCalendarDate(calendarDate.dataset.habitCalendarDate);
                return;
            }

            const exportBtn = e.target.closest('[data-habit-export]');
            if (exportBtn) {
                this.exportData(exportBtn.dataset.habitExport);
                return;
            }

            const importTrigger = e.target.closest('[data-habit-trigger-import]');
            if (importTrigger) {
                document.getElementById('importFile')?.click();
                return;
            }

            const statsBtn = e.target.closest('[data-habit-show-stats]');
            if (statsBtn) {
                this.showDataStats();
                return;
            }

            const clearBtn = e.target.closest('[data-habit-clear-data]');
            if (clearBtn) {
                this.clearAllData();
                return;
            }

            if (e.target.classList.contains('habit-date-item')) {
                const dateText = e.target.textContent.trim();
                this.selectDate(dateText);
            }
        });

        document.addEventListener('change', (e) => {
            const calendarFilter = e.target.closest('[data-habit-calendar-filter]');
            if (calendarFilter) {
                this.filterCalendarHabits(calendarFilter.value);
                return;
            }

            const importInput = e.target.closest('[data-habit-import-file]');
            if (importInput) {
                this.importData(importInput);
            }
        });

        // 分类筛选事件
        const categoryFilter = document.querySelector('.habit-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.filterHabits(e.target.value));
        }
    }

    // 渲染界面
    render() {
        this.renderHeader();
        this.renderProgress();
        this.renderDatePicker();
        this.renderHabits();
    }

    // 渲染头部
    renderHeader() {
        const dateText = document.querySelector('.habit-date-text');
        if (dateText) {
            const dateStr = this.selectedDate.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                weekday: 'short'
            });
            dateText.textContent = `📅 ${dateStr}`;
        }
    }

    // 渲染进度
    renderProgress() {
        const today = this.formatDate(this.selectedDate);
        const todayCheckIns = this.checkIns.filter(ci => ci.date === today);
        const totalHabits = this.habits.length;
        const completedHabits = todayCheckIns.length;
        const percentage = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

        const progressText = document.querySelector('.habit-progress-text');
        const progressFill = document.querySelector('.habit-progress-fill');
        const progressPercentage = document.querySelector('.habit-progress-percentage');

        if (progressText) {
            progressText.textContent = `已完成 ${completedHabits}/${totalHabits} 个习惯`;
        }

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        if (progressPercentage) {
            progressPercentage.textContent = `${percentage}%`;
        }
    }

    // 渲染日期选择器
    renderDatePicker() {
        const dateList = document.querySelector('.habit-date-list');
        if (!dateList) return;

        dateList.replaceChildren();

        // 生成7天日期
        for (let i = -3; i <= 3; i++) {
            const date = new Date(this.selectedDate);
            date.setDate(date.getDate() + i);

            const dateItem = document.createElement('div');
            dateItem.className = 'habit-date-item';
            if (i === 0) {
                dateItem.classList.add('habit-active');
            }

            const month = date.getMonth() + 1;
            const day = date.getDate();
            const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];

            dateItem.append(
                document.createTextNode(`${month}/${day}`),
                document.createElement('br'),
                document.createTextNode(weekday)
            );
            dateItem.addEventListener('click', () => this.selectDate(date));

            dateList.appendChild(dateItem);
        }
    }

    // 渲染习惯列表
    renderHabits() {
        const habitsList = document.querySelector('.habit-habits-list');
        if (!habitsList) return;

        // 更新习惯标题
        const habitsTitle = document.querySelector('.habit-habits-title');
        if (habitsTitle) {
            habitsTitle.textContent = `我的习惯 (${this.habits.length})`;
        }

        habitsList.replaceChildren();

        if (this.habits.length === 0) {
            habitsList.appendChild(this.createEmptyHabitsState());
            return;
        }

        this.habits.forEach(habit => {
            const habitCard = this.createHabitCard(habit);
            habitsList.appendChild(habitCard);
        });
    }

    createEmptyHabitsState() {
        const empty = document.createElement('div');
        empty.className = 'habit-empty-state-inline';
        const icon = document.createElement('div');
        icon.className = 'habit-empty-icon-inline';
        icon.textContent = '📅';
        const title = document.createElement('h3');
        title.textContent = '还没有习惯';
        const desc = document.createElement('p');
        desc.textContent = '点击下方"添加"按钮创建你的第一个习惯吧！';
        empty.append(icon, title, desc);
        return empty;
    }

    // 创建习惯卡片
    createHabitCard(habit) {
        const today = this.formatDate(this.selectedDate);
        const isChecked = this.checkIns.some(ci => ci.habitId === habit.id && ci.date === today);
        const streak = this.calculateStreak(habit.id);
        const totalDays = this.checkIns.filter(ci => ci.habitId === habit.id).length;
        const completionRate = this.calculateCompletionRate(habit.id);

        const card = document.createElement('div');
        card.className = `habit-card ${isChecked ? 'completed' : ''}`;
        card.dataset.habitId = habit.id;
        card.dataset.category = habit.category;

        card.append(
            this.createHabitCardHeader(habit, streak),
            this.createHabitCardStats(habit, isChecked, totalDays, completionRate),
            this.createHabitProgressMini(completionRate)
        );
        if (habit.description) {
            card.appendChild(this.createHabitNotes(habit.description));
        }
        card.appendChild(this.createHabitActions(habit.id));

        // 事件委托：只在按钮上监听点击
        card.addEventListener('click', (e) => {
            // 处理打卡按钮
            const checkBtn = e.target.closest('.habit-check-btn');
            if (checkBtn) {
                this.toggleCheckIn(habit.id);
                return;
            }

            // 处理编辑和删除按钮
            const actionBtn = e.target.closest('.action-btn');
            if (actionBtn) {
                const action = actionBtn.getAttribute('data-action');
                if (action === 'edit') {
                    this.editHabit(habit.id);
                } else if (action === 'delete') {
                    this.deleteHabit(habit.id);
                }
                return;
            }
        });

        return card;
    }

    createHabitCardHeader(habit, streak) {
        const header = document.createElement('div');
        header.className = 'habit-header';
        const icon = document.createElement('div');
        icon.className = 'habit-icon';
        icon.textContent = habit.icon || '📌';
        const info = document.createElement('div');
        info.className = 'habit-info';
        const name = document.createElement('h3');
        name.className = 'habit-name';
        name.textContent = habit.name || '未命名习惯';
        const category = document.createElement('span');
        category.className = `habit-category ${habit.category}`;
        category.textContent = this.getCategoryName(habit.category);
        info.append(name, category);
        const streakInfo = document.createElement('div');
        streakInfo.className = 'streak-info';
        const streakIcon = document.createElement('span');
        streakIcon.className = 'streak-icon';
        streakIcon.textContent = '🔥';
        const streakDays = document.createElement('span');
        streakDays.className = 'streak-days';
        streakDays.textContent = `连续 ${streak} 天`;
        streakInfo.append(streakIcon, streakDays);
        header.append(icon, info, streakInfo);
        return header;
    }

    createHabitCardStats(habit, isChecked, totalDays, completionRate) {
        const stats = document.createElement('div');
        stats.className = 'habit-stats';
        stats.append(
            this.createHabitStatItem('总打卡:', `${totalDays}天`),
            this.createHabitStatItem('完成率:', `${completionRate}%`)
        );
        const check = document.createElement('button');
        check.type = 'button';
        check.className = isChecked ? 'habit-check-btn checked' : 'habit-check-btn';
        check.dataset.habitId = habit.id;
        const icon = document.createElement('span');
        icon.className = 'check-icon';
        icon.textContent = isChecked ? '✓' : '○';
        const text = document.createElement('span');
        text.className = 'check-text';
        text.textContent = isChecked ? '已打卡' : '打卡';
        check.append(icon, text);
        stats.appendChild(check);
        return stats;
    }

    createHabitStatItem(labelText, valueText) {
        const item = document.createElement('div');
        item.className = 'stat-item';
        const label = document.createElement('span');
        label.className = 'stat-label';
        label.textContent = labelText;
        const value = document.createElement('span');
        value.className = 'stat-value';
        value.textContent = valueText;
        item.append(label, value);
        return item;
    }

    createHabitProgressMini(completionRate) {
        const progress = document.createElement('div');
        progress.className = 'progress-bar-mini';
        const fill = document.createElement('div');
        fill.className = 'progress-fill-mini';
        fill.style.width = `${completionRate}%`;
        progress.appendChild(fill);
        return progress;
    }

    createHabitNotes(description) {
        const notes = document.createElement('div');
        notes.className = 'habit-notes';
        const icon = document.createElement('span');
        icon.className = 'notes-icon';
        icon.textContent = '📝';
        const text = document.createElement('span');
        text.className = 'notes-text';
        text.textContent = `备注: ${description}`;
        notes.append(icon, text);
        return notes;
    }

    createHabitActions(habitId) {
        const actions = document.createElement('div');
        actions.className = 'habit-actions';
        actions.append(
            this.createHabitActionButton(habitId, 'edit', '编辑', 'edit-btn'),
            this.createHabitActionButton(habitId, 'delete', '删除', 'delete-btn')
        );
        return actions;
    }

    createHabitActionButton(habitId, action, text, extraClass) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `action-btn ${extraClass}`;
        button.dataset.habitId = habitId;
        button.dataset.action = action;
        button.textContent = text;
        return button;
    }

    // 切换打卡状态
    toggleCheckIn(habitId) {
        const today = this.formatDate(this.selectedDate);
        const existingCheckIn = this.checkIns.find(ci => ci.habitId === habitId && ci.date === today);

        if (existingCheckIn) {
            // 取消打卡
            this.checkIns = this.checkIns.filter(ci => ci !== existingCheckIn);
            this.showNotification('已取消打卡', 'info');
        } else {
            // 添加打卡
            const checkIn = {
                id: Date.now().toString(),
                habitId: habitId,
                date: today,
                timestamp: new Date().toISOString()
            };
            this.checkIns.push(checkIn);
            this.showNotification('打卡成功！', 'success');
        }

        this.saveData();
        this.render();
    }

    // 显示添加模态框
    showAddModal() {
        const modal = document.getElementById('habitModal');
        if (modal) {
            modal.classList.add('show');
            // 重置表单
            document.getElementById('habitName').value = '';
            document.getElementById('habitCategory').value = 'health';
            document.getElementById('habitDescription').value = '';
            document.getElementById('habitWeeklyGoal').value = '7';
            document.getElementById('habitStreakGoal').value = '30';
        }
    }

    // 隐藏模态框
    hideModal() {
        const modal = document.getElementById('habitModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // 选择图标
    selectIcon(item) {
        document.querySelectorAll('.habit-icon-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
    }

    // 保存习惯
    saveHabit() {
        const name = document.getElementById('habitName').value.trim();
        const category = document.getElementById('habitCategory').value;
        const description = document.getElementById('habitDescription').value.trim();
        const weeklyGoal = parseInt(document.getElementById('habitWeeklyGoal').value) || 7;
        const streakGoal = parseInt(document.getElementById('habitStreakGoal').value) || 30;

        const selectedIcon = document.querySelector('.habit-icon-item.selected');
        const icon = selectedIcon ? selectedIcon.dataset.icon : '📅';

        if (!name) {
            this.showNotification('请输入习惯名称', 'error');
            return;
        }

        const habit = {
            id: Date.now().toString(),
            name: name,
            icon: icon,
            category: category,
            description: description,
            weeklyGoal: weeklyGoal,
            streakGoal: streakGoal,
            createdAt: new Date().toISOString()
        };

        this.habits.push(habit);
        this.saveData();
        this.render();
        this.hideModal();
        this.showNotification('习惯添加成功！', 'success');
    }

    // 编辑习惯
    editHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        // 填充表单
        document.getElementById('habitName').value = habit.name;
        document.getElementById('habitCategory').value = habit.category;
        document.getElementById('habitDescription').value = habit.description;
        document.getElementById('habitWeeklyGoal').value = habit.weeklyGoal;
        document.getElementById('habitStreakGoal').value = habit.streakGoal;

        // 选择图标
        document.querySelectorAll('.habit-icon-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.icon === habit.icon) {
                item.classList.add('selected');
            }
        });

        this.showAddModal();
    }

    // 删除习惯
    deleteHabit(habitId) {
        if (confirm('确定要删除这个习惯吗？')) {
            this.habits = this.habits.filter(h => h.id !== habitId);
            this.checkIns = this.checkIns.filter(ci => ci.habitId !== habitId);
            this.saveData();
            this.render();
            this.showNotification('习惯已删除', 'info');
        }
    }

    // 改变日期
    changeDate(direction) {
        this.selectedDate.setDate(this.selectedDate.getDate() + direction);
        this.render();
    }

    // 选择日期
    selectDate(date) {
        this.selectedDate = new Date(date);
        this.render();
    }

    // 回到今天
    goToToday() {
        this.selectedDate = new Date();
        this.render();
    }

    // 计算连续天数
    calculateStreak(habitId) {
        const habitCheckIns = this.checkIns
            .filter(ci => ci.habitId === habitId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (habitCheckIns.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();

        // 从今天开始往前计算连续天数
        for (let i = 0; i < 365; i++) { // 最多检查一年
            const checkDate = new Date(currentDate);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = this.formatDate(checkDate);

            // 检查这一天是否有打卡记录
            const hasCheckIn = habitCheckIns.some(ci => ci.date === dateStr);

            if (hasCheckIn) {
                streak++;
            } else {
                // 如果今天没有打卡，但昨天有，不算断连
                if (i === 0) {
                    // 今天没有打卡，继续检查昨天
                    continue;
                } else {
                    // 连续中断
                    break;
                }
            }
        }

        return streak;
    }

    // 格式化日期
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // 判断是否为同一天
    isSameDate(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    // 获取分类名称
    getCategoryName(category) {
        const categories = {
            health: '健康',
            study: '学习',
            work: '工作',
            life: '生活'
        };
        return categories[category] || '其他';
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `habit-notification habit-notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('is-exiting');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 显示日历视图
    showCalendar() {
        console.log('📅 显示日历视图');
        this.showCalendarModal();
    }

    // 显示统计视图
    showStats() {
        console.log('📊 显示统计视图');
        this.showStatsModal();
    }

    // 显示设置视图
    showSettings() {
        console.log('⚙️ 显示设置视图');
        this.showSettingsModal();
    }

    // 显示日历模态框
    showCalendarModal() {
        // 创建日历模态框
        const modal = document.createElement('div');
        modal.className = 'habit-modal-overlay show';

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        renderSanitizedMarkup(modal, `
            <div class="habit-modal-container habit-modal-container-compact">
                <div class="habit-modal-header">
                    <h2 class="habit-modal-title">📅 习惯日历</h2>
                    <button class="habit-modal-close" data-habit-modal-close>✕</button>
                </div>
                <div class="habit-modal-content">
                    <div class="calendar-header" class="habit-calendar-header">
                        <button class="habit-date-nav-btn" data-habit-month-delta="-1">◀</button>
                        <h3 id="calendarMonthTitle">${currentYear}年${currentMonth + 1}月</h3>
                        <button class="habit-date-nav-btn" data-habit-month-delta="1">▶</button>
                    </div>

                    <div class="calendar-grid" class="habit-calendar-grid">
                        <div class="calendar-weekday" class="habit-calendar-weekday">日</div>
                        <div class="calendar-weekday" class="habit-calendar-weekday">一</div>
                        <div class="calendar-weekday" class="habit-calendar-weekday">二</div>
                        <div class="calendar-weekday" class="habit-calendar-weekday">三</div>
                        <div class="calendar-weekday" class="habit-calendar-weekday">四</div>
                        <div class="calendar-weekday" class="habit-calendar-weekday">五</div>
                        <div class="calendar-weekday" class="habit-calendar-weekday">六</div>
                        <div id="calendarDays" class="habit-calendar-days">
                            ${this.generateCalendarDays(currentYear, currentMonth)}
                        </div>
                    </div>

                    <div class="calendar-stats" class="habit-panel">
                        <h4 class="habit-panel-title">📊 本月统计</h4>
                        <div class="habit-calendar-stats-grid">
                            <div class="habit-stat-mini">
                                <div class="habit-stat-number">${this.getMonthCheckIns(currentYear, currentMonth)}</div>
                                <div class="habit-stat-label">总打卡</div>
                            </div>
                            <div class="habit-stat-mini">
                                <div class="habit-stat-number">${this.getMonthCompletionRate(currentYear, currentMonth)}%</div>
                                <div class="habit-stat-label">完成率</div>
                            </div>
                            <div class="habit-stat-mini">
                                <div class="habit-stat-number">${this.getMonthLongestStreak(currentYear, currentMonth)}</div>
                                <div class="habit-stat-label">最长连续</div>
                            </div>
                        </div>
                    </div>

                    <div class="calendar-filters" class="habit-panel">
                        <h4 class="habit-panel-title">🔍 习惯筛选</h4>
                        <select data-habit-calendar-filter class="habit-filter-select">
                            <option value="all">全部习惯</option>
                            <option value="health">🏃 健康</option>
                            <option value="study">📚 学习</option>
                            <option value="work">💼 工作</option>
                            <option value="life">🍳 生活</option>
                        </select>
                    </div>

                    <div class="calendar-legend" class="habit-panel">
                        <h4 class="habit-panel-title">图例说明</h4>
                        <div class="habit-legend-list">
                            <div class="habit-legend-item">
                                <span class="habit-legend-dot habit-legend-dot-success">●</span>
                                <span class="habit-stat-label">已打卡</span>
                            </div>
                            <div class="habit-legend-item">
                                <span class="habit-legend-dot habit-legend-dot-primary">●</span>
                                <span class="habit-stat-label">今天</span>
                            </div>
                            <div class="habit-legend-item">
                                <span class="habit-legend-dot habit-legend-dot-danger">●</span>
                                <span class="habit-stat-label">未打卡</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="habit-modal-footer">
                    <button class="habit-btn-save" data-habit-modal-close>关闭</button>
                </div>
            </div>
        `);

        document.body.appendChild(modal);

        // 存储当前日历状态
        this.calendarModal = modal;
        this.calendarYear = currentYear;
        this.calendarMonth = currentMonth;
    }

    // 显示统计模态框
    showStatsModal() {
        // 创建统计模态框
        const modal = document.createElement('div');
        modal.className = 'habit-modal-overlay show';

        const totalHabits = this.habits.length;
        const totalCheckIns = this.checkIns.length;
        const todayCheckIns = this.checkIns.filter(ci => ci.date === this.formatDate(new Date())).length;
        const completionRate = totalHabits > 0 ? Math.round((todayCheckIns / totalHabits) * 100) : 0;
        const longestStreak = this.getLongestStreak();

        renderSanitizedMarkup(modal, `
            <div class="habit-modal-container habit-modal-container-wide">
                <div class="habit-modal-header">
                    <h2 class="habit-modal-title">📊 习惯统计报告</h2>
                    <button class="habit-modal-close" data-habit-modal-close>✕</button>
                </div>
                <div class="habit-modal-content">
                    <!-- 总体统计 -->
                    <div class="stats-section" class="habit-stats-section">
                        <h3 class="habit-section-title">📈 总体统计</h3>
                        <div class="habit-summary-grid">
                            <div class="habit-summary-card">
                                <div class="habit-summary-value">${totalHabits}</div>
                                <div class="habit-stat-label">总习惯数</div>
                            </div>
                            <div class="habit-summary-card">
                                <div class="habit-summary-value">${totalCheckIns}</div>
                                <div class="habit-stat-label">总打卡数</div>
                            </div>
                            <div class="habit-summary-card">
                                <div class="habit-summary-value">${longestStreak}</div>
                                <div class="habit-stat-label">最长连续</div>
                            </div>
                            <div class="habit-summary-card">
                                <div class="habit-summary-value">${completionRate}%</div>
                                <div class="habit-stat-label">今日完成率</div>
                            </div>
                        </div>
                    </div>

                    <!-- 习惯详细统计 -->
                    <div class="stats-section" class="habit-stats-section">
                        <h3 class="habit-section-title">📋 习惯详细统计</h3>
                        <div class="habit-detail-list">
                            ${this.habits.map(habit => {
            const habitCheckIns = this.checkIns.filter(ci => ci.habitId === habit.id);
            const streak = this.calculateStreak(habit.id);
            const completionRate = habitCheckIns.length > 0 ? Math.round((streak / Math.max(streak, 1)) * 100) : 0;

            return `
                                    <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid var(--primary-color);">
                                        <div class="habit-stat-card-head">
                                            <div class="habit-legend-item">
                                                <span class="habit-stat-icon">${habit.icon}</span>
                                                <span class="habit-stat-name">${habit.name}</span>
                                            </div>
                                            <span class="habit-stat-label">${this.getCategoryName(habit.category)}</span>
                                        </div>
                                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; font-size: 0.9rem;">
                                            <div>
                                                <span class="habit-stat-text">连续天数:</span>
                                                <span class="habit-stat-highlight">${streak}天</span>
                                            </div>
                                            <div>
                                                <span class="habit-stat-text">总天数:</span>
                                                <span class="habit-stat-highlight">${habitCheckIns.length}天</span>
                                            </div>
                                            <div>
                                                <span class="habit-stat-text">完成率:</span>
                                                <span class="habit-stat-highlight">${completionRate}%</span>
                                            </div>
                                        </div>
                                        <div class="habit-progress-wrap">
                                            <div class="habit-progress-track">
                                                <div class="habit-progress-fill" style="--habit-progress: ${completionRate}%;"></div>
                                            </div>
                                        </div>
                                    </div>
                                `;
        }).join('')}
                        </div>
                    </div>

                    <!-- 成就徽章 -->
                    <div class="stats-section">
                        <h3 class="habit-section-title">🎯 成就徽章</h3>
                        <div class="habit-achievement-grid">
                            <div class="habit-achievement-card" style="--achievement-opacity: ${totalHabits > 0 ? '1' : '0.3'};">
                                <div class="habit-achievement-icon">🏆</div>
                                <div class="habit-achievement-label">初来乍到</div>
                            </div>
                            <div class="habit-achievement-card" style="--achievement-opacity: ${longestStreak >= 7 ? '1' : '0.3'};">
                                <div class="habit-achievement-icon">🥇</div>
                                <div class="habit-achievement-label">坚持7天</div>
                            </div>
                            <div class="habit-achievement-card" style="--achievement-opacity: ${longestStreak >= 30 ? '1' : '0.3'};">
                                <div class="habit-achievement-icon">🥈</div>
                                <div class="habit-achievement-label">坚持30天</div>
                            </div>
                            <div class="habit-achievement-card" style="--achievement-opacity: ${longestStreak >= 100 ? '1' : '0.3'};">
                                <div class="habit-achievement-icon">🥉</div>
                                <div class="habit-achievement-label">坚持100天</div>
                            </div>
                            <div class="habit-achievement-card" style="--achievement-opacity: ${completionRate >= 80 ? '1' : '0.3'};">
                                <div class="habit-achievement-icon">🔥</div>
                                <div class="habit-achievement-label">连续王者</div>
                            </div>
                            <div class="habit-achievement-card" style="--achievement-opacity: ${completionRate >= 90 ? '1' : '0.3'};">
                                <div class="habit-achievement-icon">⭐</div>
                                <div class="habit-achievement-label">全勤达人</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="habit-modal-footer">
                    <button class="habit-btn-save" data-habit-modal-close>关闭</button>
                </div>
            </div>
        `);

        document.body.appendChild(modal);
    }

    // 获取最长连续天数
    getLongestStreak() {
        if (this.habits.length === 0) return 0;

        let maxStreak = 0;
        this.habits.forEach(habit => {
            const streak = this.calculateStreak(habit.id);
            maxStreak = Math.max(maxStreak, streak);
        });

        return maxStreak;
    }

    // 显示设置模态框
    showSettingsModal() {
        // 创建设置模态框
        const modal = document.createElement('div');
        modal.className = 'habit-modal-overlay show';

        renderSanitizedMarkup(modal, `
            <div class="habit-modal-container habit-modal-container-compact">
                <div class="habit-modal-header">
                    <h2 class="habit-modal-title">⚙️ 习惯设置</h2>
                    <button class="habit-modal-close" data-habit-modal-close>✕</button>
                </div>
                <div class="habit-modal-content">
                    <!-- 界面设置 -->
                    <div class="settings-section" class="habit-stats-section">
                        <h3 class="habit-section-title">📱 界面设置</h3>
                        <div class="habit-detail-list">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div>
                                    <div class="habit-stat-name">主题模式</div>
                                    <div class="habit-stat-label">选择界面主题</div>
                                </div>
                                <select style="padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--card-bg-color); color: var(--text-primary);">
                                    <option value="light">浅色主题</option>
                                    <option value="dark">深色主题</option>
                                    <option value="auto">跟随系统</option>
                                </select>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div>
                                    <div class="habit-stat-name">默认视图</div>
                                    <div class="habit-stat-label">选择默认显示方式</div>
                                </div>
                                <select style="padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--card-bg-color); color: var(--text-primary);">
                                    <option value="list">列表视图</option>
                                    <option value="grid">网格视图</option>
                                    <option value="compact">紧凑视图</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 提醒设置 -->
                    <div class="settings-section" class="habit-stats-section">
                        <h3 class="habit-section-title">🔔 提醒设置</h3>
                        <div class="habit-detail-list">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div>
                                    <div class="habit-stat-name">每日提醒</div>
                                    <div class="habit-stat-label">开启每日打卡提醒</div>
                                </div>
                                <label style="position: relative; display: inline-block; width: 50px; height: 24px;">
                                    <input type="checkbox" checked style="opacity: 0; width: 0; height: 0;">
                                    <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--primary-color); transition: 0.3s; border-radius: 24px;">
                                        <span style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%;"></span>
                                    </span>
                                </label>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div>
                                    <div class="habit-stat-name">提醒时间</div>
                                    <div class="habit-stat-label">设置每日提醒时间</div>
                                </div>
                                <input type="time" value="20:00" style="padding: 0.5rem; border-radius: 4px; border: 1px solid var(--border-color); background: var(--card-bg-color); color: var(--text-primary);">
                            </div>
                        </div>
                    </div>

                    <!-- 数据管理 -->
                    <div class="settings-section" class="habit-stats-section">
                        <h3 class="habit-section-title">💾 数据管理</h3>
                        <div class="habit-detail-list">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div>
                                    <div class="habit-stat-name">导出数据</div>
                                    <div class="habit-stat-label">备份您的习惯数据</div>
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button data-habit-export="json" style="padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">JSON</button>
                                    <button data-habit-export="excel" style="padding: 0.5rem 1rem; background: var(--accent-green); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Excel</button>
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div>
                                    <div class="habit-stat-name">导入数据</div>
                                    <div class="habit-stat-label">从备份文件恢复数据</div>
                                </div>
                                <input type="file" accept=".json,.xlsx" style="display: none;" id="importFile" data-habit-import-file>
                                <button data-habit-trigger-import style="padding: 0.5rem 1rem; background: var(--accent-orange); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">选择文件</button>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div>
                                    <div class="habit-stat-name">数据统计</div>
                                    <div class="habit-stat-label">查看数据使用情况</div>
                                </div>
                                <button data-habit-show-stats style="padding: 0.5rem 1rem; background: var(--accent-blue); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">查看</button>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div>
                                    <div class="habit-stat-name">清空数据</div>
                                    <div class="habit-stat-label">删除所有习惯和打卡记录</div>
                                </div>
                                <button data-habit-clear-data style="padding: 0.5rem 1rem; background: var(--accent-red); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">清空</button>
                            </div>
                        </div>
                    </div>

                    <!-- 关于信息 -->
                    <div class="settings-section">
                        <h3 class="habit-section-title">ℹ️ 关于</h3>
                        <div class="habit-detail-list">
                            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                                <div class="habit-stat-card-head">
                                    <span class="habit-stat-name">版本信息</span>
                                    <span class="habit-stat-text">v1.0.0</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span class="habit-stat-name">总习惯数</span>
                                    <span class="habit-stat-text">${this.habits.length}个</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="habit-modal-footer">
                    <button class="habit-btn-save" data-habit-modal-close>关闭</button>
                </div>
            </div>
        `);

        document.body.appendChild(modal);
    }

    // 导出数据
    exportData(format) {
        const data = {
            habits: this.habits,
            checkIns: this.checkIns,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        };

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `habit-tracker-backup-${this.formatDate(new Date())}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification('数据已导出为JSON文件', 'success');
        } else if (format === 'excel') {
            this.showNotification('Excel导出功能开发中...', 'info');
        }
    }

    // 导入数据
    importData(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.habits && data.checkIns) {
                    this.habits = data.habits;
                    this.checkIns = data.checkIns;
                    this.saveData();
                    this.render();
                    this.showNotification('数据导入成功', 'success');
                } else {
                    this.showNotification('文件格式不正确', 'error');
                }
            } catch (error) {
                this.showNotification('文件解析失败', 'error');
            }
        };
        reader.readAsText(file);
    }

    // 清空所有数据
    clearAllData() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            this.habits = [];
            this.checkIns = [];
            this.saveData();
            this.render();
            this.showNotification('所有数据已清空', 'success');
        }
    }

    // 生成日历日期
    generateCalendarDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let html = '';
        const today = new Date();

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.toDateString() === today.toDateString();
            const isFuture = currentDate > today; // 检查是否是未来日期
            const dateStr = this.formatDate(currentDate);
            const checkIns = this.checkIns.filter(ci => ci.date === dateStr);
            // 未来日期不应该显示打卡状态
            const hasCheckIns = !isFuture && checkIns.length > 0;

            let dayClass = 'calendar-day';
            let dayStyle = `
                background: var(--card-bg-color);
                padding: 0.5rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid var(--border-color);
                min-height: 40px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            `;

            if (!isCurrentMonth) {
                dayStyle += 'opacity: 0.3;';
            }

            if (isToday) {
                dayStyle += 'background: var(--primary-color); color: white; font-weight: 700;';
            } else if (hasCheckIns) {
                dayStyle += 'background: var(--accent-green); color: white;';
            }

            html += `
                <div class="${dayClass}" style="${dayStyle}" data-habit-calendar-date="${dateStr}">
                    <div style="font-size: 0.9rem; font-weight: 600;">${currentDate.getDate()}</div>
                    ${hasCheckIns ? `<div style="font-size: 0.7rem; margin-top: 0.25rem;">${checkIns.length}</div>` : ''}
                </div>
            `;
        }

        return html;
    }

    // 改变日历月份
    changeCalendarMonth(direction) {
        this.calendarMonth += direction;
        if (this.calendarMonth < 0) {
            this.calendarMonth = 11;
            this.calendarYear--;
        } else if (this.calendarMonth > 11) {
            this.calendarMonth = 0;
            this.calendarYear++;
        }

        // 更新日历显示
        const monthTitle = document.getElementById('calendarMonthTitle');
        if (monthTitle) {
            monthTitle.textContent = `${this.calendarYear}年${this.calendarMonth + 1}月`;
        }

        const calendarDays = document.getElementById('calendarDays');
        if (calendarDays) {
            this.renderHabitCalendarDays(calendarDays, this.calendarYear, this.calendarMonth);
        }

        // 更新统计
        this.updateCalendarStats();
    }

    // 选择日历日期
    selectCalendarDate(dateStr) {
        const date = new Date(dateStr);
        this.selectedDate = date;
        this.render();
        this.showNotification(`已切换到 ${dateStr}`, 'info');
    }

    // 更新日历统计
    updateCalendarStats() {
        const totalCheckIns = this.getMonthCheckIns(this.calendarYear, this.calendarMonth);
        const completionRate = this.getMonthCompletionRate(this.calendarYear, this.calendarMonth);
        const longestStreak = this.getMonthLongestStreak(this.calendarYear, this.calendarMonth);

        // 这里可以更新统计显示，但由于是动态生成的，暂时跳过
    }

    // 获取月份打卡数
    getMonthCheckIns(year, month) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        const monthCheckIns = this.checkIns.filter(ci => {
            const checkInDate = new Date(ci.date);
            return checkInDate >= monthStart && checkInDate <= monthEnd;
        });
        return monthCheckIns.length;
    }

    // 获取月份完成率
    getMonthCompletionRate(year, month) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        const totalDays = monthEnd.getDate();
        const monthCheckIns = this.getMonthCheckIns(year, month);
        return totalDays > 0 ? Math.round((monthCheckIns / totalDays) * 100) : 0;
    }

    // 获取月份最长连续
    getMonthLongestStreak(year, month) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);
        const monthCheckIns = this.checkIns.filter(ci => {
            const checkInDate = new Date(ci.date);
            return checkInDate >= monthStart && checkInDate <= monthEnd;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (monthCheckIns.length === 0) return 0;

        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < monthCheckIns.length; i++) {
            const prevDate = new Date(monthCheckIns[i - 1].date);
            const currDate = new Date(monthCheckIns[i].date);
            const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak++;
            } else {
                maxStreak = Math.max(maxStreak, currentStreak);
                currentStreak = 1;
            }
        }

        return Math.max(maxStreak, currentStreak);
    }

    // 编辑习惯
    editHabit(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return;

        // 填充表单数据
        document.getElementById('habitName').value = habit.name;
        document.getElementById('habitCategory').value = habit.category;
        document.getElementById('habitDescription').value = habit.description || '';

        // 选择图标
        const iconItems = document.querySelectorAll('.habit-icon-item');
        iconItems.forEach(item => {
            if (item.dataset.icon === habit.icon) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });

        // 设置编辑模式
        this.editingHabitId = habitId;
        document.querySelector('.habit-modal-title').textContent = '✏️ 编辑习惯';

        // 显示模态框
        this.showModal();
    }

    // 删除习惯
    deleteHabit(habitId) {
        if (!confirm('确定要删除这个习惯吗？此操作不可恢复！')) {
            return;
        }

        // 删除习惯
        this.habits = this.habits.filter(h => h.id !== habitId);

        // 删除相关的打卡记录
        this.checkIns = this.checkIns.filter(ci => ci.habitId !== habitId);

        // 保存数据
        this.saveData();

        // 重新渲染
        this.render();

        this.showNotification('习惯已删除', 'success');
    }

    // 显示模态框
    showModal() {
        const modal = document.getElementById('habitModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    // 隐藏模态框
    hideModal() {
        const modal = document.getElementById('habitModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        // 清除编辑状态
        this.editingHabitId = null;
        this.clearForm();
    }

    // 清除表单
    clearForm() {
        document.getElementById('habitName').value = '';
        document.getElementById('habitCategory').value = 'health';
        document.getElementById('habitDescription').value = '';

        // 清除图标选择
        const iconItems = document.querySelectorAll('.habit-icon-item');
        iconItems.forEach(item => item.classList.remove('selected'));

        // 重置标题
        document.querySelector('.habit-modal-title').textContent = '✏️ 添加新习惯';
    }

    // 计算完成率
    calculateCompletionRate(habitId) {
        const habitCheckIns = this.checkIns.filter(ci => ci.habitId === habitId);
        if (habitCheckIns.length === 0) return 0;

        // 计算最近30天的完成率
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentCheckIns = habitCheckIns.filter(ci => {
            const checkInDate = new Date(ci.date);
            return checkInDate >= thirtyDaysAgo;
        });

        return Math.round((recentCheckIns.length / 30) * 100);
    }

    // 绑定习惯卡片事件
    bindHabitEvents() {
        // 编辑按钮事件
        document.querySelectorAll('.habit-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const habitId = btn.dataset.habitId;
                this.editHabit(habitId);
            });
        });

        // 删除按钮事件
        document.querySelectorAll('.habit-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const habitId = btn.dataset.habitId;
                this.deleteHabit(habitId);
            });
        });

        // 习惯卡片点击事件（打卡）
        document.querySelectorAll('.habit-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // 如果点击的是按钮，不触发打卡
                if (e.target.closest('.habit-action-btn')) return;

                const habitId = card.dataset.habitId;
                this.toggleCheckIn(habitId);
            });
        });
    }

    // 改变日期
    changeDate(direction) {
        const newDate = new Date(this.selectedDate);
        newDate.setDate(newDate.getDate() + direction);
        this.selectedDate = newDate;
        this.render();
    }

    // 选择日期
    selectDate(dateText) {
        // 解析日期文本，例如 "1/15" 或 "1/15\n五"
        const parts = dateText.split('\n')[0].split('/');
        if (parts.length === 2) {
            const month = parseInt(parts[0]);
            const day = parseInt(parts[1]);
            const year = this.selectedDate.getFullYear();

            const newDate = new Date(year, month - 1, day);
            this.selectedDate = newDate;
            this.render();
        }
    }

    // 筛选习惯
    filterHabits(category) {
        const habitCards = document.querySelectorAll('.habit-card');

        habitCards.forEach(card => {
            const habitCategory = card.dataset.category;
            const show = category === 'all' || habitCategory === category;
            card.style.display = show ? 'block' : 'none';
        });
    }

    // 渲染日期选择器
    renderDatePicker() {
        const dateList = document.querySelector('.habit-date-list');
        if (!dateList) return;

        const dates = [];
        const today = new Date(this.selectedDate);

        // 生成前后3天的日期
        for (let i = -3; i <= 3; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            dates.push(date);
        }

        const dateItems = dates.map(date => {
            const isToday = date.toDateString() === this.selectedDate.toDateString();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const weekday = date.toLocaleDateString('zh-CN', { weekday: 'short' });

            const item = document.createElement('div');
            item.className = `habit-date-item ${isToday ? 'habit-active' : ''}`;
            item.dataset.date = this.formatDate(date);
            item.appendChild(document.createTextNode(`${month}/${day}`));
            item.appendChild(document.createElement('br'));
            item.appendChild(document.createTextNode(weekday));
            return item;
        });

        dateList.replaceChildren(...dateItems);
    }

    // 筛选日历习惯
    filterCalendarHabits(category) {
        // 重新生成日历，只显示指定分类的习惯
        const calendarDays = document.getElementById('calendarDays');
        if (calendarDays) {
            this.renderHabitCalendarDays(calendarDays, this.calendarYear, this.calendarMonth, category);
        }
    }

    renderHabitCalendarDays(container, year, month, filterCategory = 'all') {
        container.replaceChildren(...this.createHabitCalendarDayElements(year, month, filterCategory));
    }

    createHabitCalendarDayElements(year, month, filterCategory = 'all') {
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        const today = new Date();
        const days = [];

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.toDateString() === today.toDateString();
            const isFuture = currentDate > today;
            const dateStr = this.formatDate(currentDate);

            let checkIns = this.checkIns.filter(ci => ci.date === dateStr);
            if (filterCategory !== 'all') {
                checkIns = checkIns.filter(ci => {
                    const habit = this.habits.find(h => h.id === ci.habitId);
                    return habit && habit.category === filterCategory;
                });
            }

            const hasCheckIns = !isFuture && checkIns.length > 0;
            days.push(this.createHabitCalendarDayElement(currentDate, dateStr, {
                isCurrentMonth,
                isToday,
                hasCheckIns,
                checkInsCount: checkIns.length
            }));
        }

        return days;
    }

    createHabitCalendarDayElement(currentDate, dateStr, state) {
        const day = document.createElement('div');
        day.className = 'calendar-day habit-calendar-day';
        day.dataset.habitCalendarDate = dateStr;

        if (!state.isCurrentMonth) {
            day.classList.add('is-muted');
        }

        if (state.isToday) {
            day.classList.add('is-today');
        } else if (state.hasCheckIns) {
            day.classList.add('has-check-ins');
        }

        const number = document.createElement('div');
        number.className = 'habit-calendar-day-number';
        number.textContent = String(currentDate.getDate());
        day.appendChild(number);

        if (state.hasCheckIns) {
            const count = document.createElement('div');
            count.className = 'habit-calendar-day-count';
            count.textContent = String(state.checkInsCount);
            day.appendChild(count);
        }

        return day;
    }

    // 生成日历日期（支持分类筛选）
    generateCalendarDays(year, month, filterCategory = 'all') {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let html = '';
        const today = new Date();

        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);

            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.toDateString() === today.toDateString();
            const isFuture = currentDate > today; // 检查是否是未来日期
            const dateStr = this.formatDate(currentDate);

            // 根据分类筛选打卡记录
            let checkIns = this.checkIns.filter(ci => ci.date === dateStr);
            if (filterCategory !== 'all') {
                checkIns = checkIns.filter(ci => {
                    const habit = this.habits.find(h => h.id === ci.habitId);
                    return habit && habit.category === filterCategory;
                });
            }

            // 未来日期不应该显示打卡状态
            const hasCheckIns = !isFuture && checkIns.length > 0;

            let dayClass = 'calendar-day';
            let dayStyle = `
                background: var(--card-bg-color);
                padding: 0.5rem;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 1px solid var(--border-color);
                min-height: 40px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            `;

            if (!isCurrentMonth) {
                dayStyle += 'opacity: 0.3;';
            }

            if (isToday) {
                dayStyle += 'background: var(--primary-color); color: white; font-weight: 700;';
            } else if (hasCheckIns) {
                dayStyle += 'background: var(--accent-green); color: white;';
            }

            html += `
                <div class="${dayClass}" style="${dayStyle}" data-habit-calendar-date="${dateStr}">
                    <div style="font-size: 0.9rem; font-weight: 600;">${currentDate.getDate()}</div>
                    ${hasCheckIns ? `<div style="font-size: 0.7rem; margin-top: 0.25rem;">${checkIns.length}</div>` : ''}
                </div>
            `;
        }

        return html;
    }

    // 显示数据统计
    showDataStats() {
        const totalHabits = this.habits.length;
        const totalCheckIns = this.checkIns.length;
        const totalCategories = [...new Set(this.habits.map(h => h.category))].length;
        const avgCompletionRate = this.calculateAverageCompletionRate();

        const modal = document.createElement('div');
        modal.className = 'habit-modal-overlay show';

        renderSanitizedMarkup(modal, `
            <div class="habit-modal-container" style="max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <div class="habit-modal-header">
                    <h2 class="habit-modal-title">📊 数据统计</h2>
                    <button class="habit-modal-close" data-habit-modal-close>✕</button>
                </div>
                <div class="habit-modal-content">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 2rem;">
                        <div class="habit-summary-card">
                            <div class="habit-summary-value">${totalHabits}</div>
                            <div class="habit-stat-label">总习惯数</div>
                        </div>
                        <div class="habit-summary-card">
                            <div class="habit-summary-value">${totalCheckIns}</div>
                            <div class="habit-stat-label">总打卡数</div>
                        </div>
                        <div class="habit-summary-card">
                            <div class="habit-summary-value">${totalCategories}</div>
                            <div class="habit-stat-label">分类数量</div>
                        </div>
                        <div class="habit-summary-card">
                            <div class="habit-summary-value">${avgCompletionRate}%</div>
                            <div class="habit-stat-label">平均完成率</div>
                        </div>
                    </div>

                    <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
                        <h4 style="margin: 0 0 1rem 0; color: var(--text-primary);">📈 分类统计</h4>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${this.getCategoryStats().map(stat => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--card-bg-color); border-radius: 4px;">
                                    <span style="color: var(--text-primary);">${stat.name}</span>
                                    <span style="color: var(--primary-color); font-weight: 600;">${stat.count}个</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="habit-modal-footer">
                    <button class="habit-btn-save" data-habit-modal-close>关闭</button>
                </div>
            </div>
        `);

        document.body.appendChild(modal);
    }

    // 计算平均完成率
    calculateAverageCompletionRate() {
        if (this.habits.length === 0) return 0;

        const totalRate = this.habits.reduce((sum, habit) => {
            return sum + this.calculateCompletionRate(habit.id);
        }, 0);

        return Math.round(totalRate / this.habits.length);
    }

    // 获取分类统计
    getCategoryStats() {
        const categories = ['health', 'study', 'work', 'life'];
        const categoryNames = {
            health: '健康',
            study: '学习',
            work: '工作',
            life: '生活'
        };

        return categories.map(category => ({
            name: categoryNames[category],
            count: this.habits.filter(h => h.category === category).length
        }));
    }
}
