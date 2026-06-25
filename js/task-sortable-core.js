// Drag-and-drop task sorting for list and quadrant views.
// Extracted from script.js; task state is accessed through window.XXSGAppRuntime.

function getSortableTasks() {
    return window.XXSGAppRuntime?.tasks || [];
}

function saveSortableTasks() {
    if (typeof window.XXSGAppRuntime?.saveTasks === 'function') {
        window.XXSGAppRuntime.saveTasks();
    }
}

function renderSortableTasks() {
    if (typeof window.XXSGAppRuntime?.render === 'function') {
        window.XXSGAppRuntime.render();
    }
}

function initSortable() {
    const tasks = getSortableTasks();
    const taskListEl = document.getElementById('task-list');
    console.log('🔄 初始化拖拽功能...');

    // 检查SortableJS是否可用
    if (typeof Sortable === 'undefined') {
        console.warn('⚠️ SortableJS库未加载，跳过拖拽功能初始化');
        console.warn('💡 提示：请检查网络连接或使用本地SortableJS库');
        return;
    }

    console.log('✅ SortableJS库已加载，版本:', Sortable.version || '未知');

    // 初始化任务列表拖拽（如果存在）
    if (taskListEl) {
        // 销毁旧实例（如果存在）
        if (taskListEl.sortable) {
            taskListEl.sortable.destroy();
        }

        new Sortable(taskListEl, {
            animation: 150,
            handle: '.task-content', // 限制拖拽句柄，避免冲突
            onEnd: function (evt) {
                if (evt.oldIndex !== evt.newIndex) {
                    const moved = tasks.splice(evt.oldIndex, 1)[0];
                    tasks.splice(evt.newIndex, 0, moved);
                    saveSortableTasks();
                    renderSortableTasks();
                }
            }
        });
    }

    // 确保四象限元素已获取
    const q1TasksEl = document.getElementById('q1-tasks');
    const q2TasksEl = document.getElementById('q2-tasks');
    const q3TasksEl = document.getElementById('q3-tasks');
    const q4TasksEl = document.getElementById('q4-tasks');

    const quadrantMap = {
        'q1-tasks': 1,
        'q2-tasks': 2,
        'q3-tasks': 3,
        'q4-tasks': 4
    };

    // 为四象限添加拖拽排序功能
    const quadrantElements = [
        { el: q1TasksEl, id: 'q1-tasks', name: 'Q1-重要且紧急' },
        { el: q2TasksEl, id: 'q2-tasks', name: 'Q2-重要不紧急' },
        { el: q3TasksEl, id: 'q3-tasks', name: 'Q3-不重要但紧急' },
        { el: q4TasksEl, id: 'q4-tasks', name: 'Q4-不重要不紧急' }
    ];

    let successCount = 0;
    let failCount = 0;

    quadrantElements.forEach((item, idx) => {
        const { el, id, name } = item;

        if (!el) {
            console.warn(`⚠️ 象限元素未找到: ${name} (${id})`);
            failCount++;
            return;
        }

        try {
            // 销毁旧的Sortable实例（如果存在）
            if (el.sortable) {
                // console.log(`🔄 销毁旧的Sortable实例: ${name}`);
                el.sortable.destroy();
            }

            // 创建新的Sortable实例
            const sortableInstance = new Sortable(el, {
                group: 'quadrants',  // 允许跨象限拖拽
                animation: 150,
                forceFallback: false,  // 使用原生HTML5拖拽
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                swapThreshold: 0.65,  // 交换阈值
                invertSwap: false,
                // 移除固定的direction参数，让SortableJS自动检测方向
                // direction: 'vertical',

                // 拖拽开始
                onStart: function (evt) {
                    console.log('📌 开始拖拽', {
                        taskId: evt.item.dataset.id,
                        from: evt.from.id,
                        to: evt.to.id,
                        oldIndex: evt.oldIndex,
                        hasDraggable: evt.item.getAttribute('draggable'),
                        itemClass: evt.item.className,
                        fromElement: evt.from.id,
                        toElement: evt.to?.id
                    });
                },

                // 添加到新象限（跨象限拖拽时触发）
                onAdd: function (evt) {
                    const taskId = evt.item.dataset.id;
                    const task = tasks.find(t => t && t.id === taskId);

                    if (!task) {
                        console.error(`❌ 未找到任务: ${taskId}`);
                        return;
                    }

                    const quadrantId = evt.to.id;
                    const newPriority = quadrantMap[quadrantId];

                    console.log(`➕ 任务移动到新象限: ${task.title} → ${quadrantId} (优先级: ${task.priority} → ${newPriority})`);

                    // 注意：这里暂不更新task.priority，由onEnd统一处理
                    // onEnd会从DOM读取所有任务的最终位置和优先级
                },

                // 拖拽结束
                onEnd: function (evt) {
                    console.log('🏁 拖拽结束', {
                        from: evt.from.id,
                        to: evt.to.id,
                        oldIndex: evt.oldIndex,
                        newIndex: evt.newIndex
                    });

                    // 【修复】从DOM读取任务顺序，更新tasks数组
                    // 这样可以避免索引计算错误，并确保数据与DOM一致
                    try {
                        const quadrantIds = ['q1-tasks', 'q2-tasks', 'q3-tasks', 'q4-tasks'];
                        const newTasks = [];

                        quadrantIds.forEach(quadrantId => {
                            const quadrantEl = document.getElementById(quadrantId);
                            if (!quadrantEl) return;

                            const priority = quadrantMap[quadrantId];
                            const taskItems = quadrantEl.querySelectorAll('.task-item');

                            taskItems.forEach(taskItem => {
                                const taskId = taskItem.getAttribute('data-id');
                                if (!taskId) return;

                                const task = tasks.find(t => t && t.id === taskId);
                                if (task) {
                                    const oldPriority = task.priority;
                                    task.priority = priority; // 更新优先级

                                    // 【新增】如果优先级改变了，更新任务元素的颜色标记
                                    if (oldPriority !== priority) {
                                        updateTaskElementPriority(taskItem, task.priority);
                                    }

                                    newTasks.push(task);
                                }
                            });
                        });

                        // 添加未在四象限中显示的任务（如已完成任务）
                        tasks.forEach(task => {
                            if (task && !newTasks.includes(task)) {
                                newTasks.push(task);
                            }
                        });

                        // 更新tasks数组
                        tasks.length = 0;
                        tasks.push(...newTasks);

                        console.log('✅ 任务顺序已更新，任务数量:', tasks.length);

                        // 【新增】更新象限计数显示
                        updateQuadrantCounts();

                        // 【新增】处理空象限的提示词
                        updateEmptyStateMessages();

                        // 只保存数据，不调用render()
                        // 因为DOM已经是正确的状态（由SortableJS维护）
                        saveSortableTasks();

                        console.log('✅ 拖拽完成，数据已保存');

                    } catch (error) {
                        console.error('❌ 更新任务顺序失败:', error);
                    }
                },

                // 拖拽移动判断
                onMove: function (evt) {
                    // 【简化】既然所有象限都在同一个group中，直接允许所有移动
                    // SortableJS会自动处理跨象限拖拽
                    return true;
                }
            });

            // 保存实例引用
            el.sortable = sortableInstance;

            console.log(`✅ ${name} 拖拽功能已初始化`);
            successCount++;

        } catch (error) {
            console.error(`❌ 初始化 ${name} 拖拽功能失败:`, error);
            failCount++;
        }
    });

    console.log(`✅ 拖拽功能初始化完成 (成功: ${successCount}, 失败: ${failCount})`);

    if (failCount > 0) {
        console.warn('⚠️ 部分象限拖拽功能初始化失败，请检查控制台错误信息');
    }

    // 确保所有任务元素都设置了draggable属性
    quadrantElements.forEach((item, idx) => {
        const { el, name } = item;
        if (!el) return;

        const tasks = el.querySelectorAll('.task-item');
        tasks.forEach(task => {
            // 为所有任务项设置draggable属性
            task.setAttribute('draggable', 'true');
        });

        console.log(`📝 ${name}: 已为 ${tasks.length} 个任务设置draggable属性`);
    });

    // 添加全局调试函数
    window.debugDragDrop = function () {
        console.log('=== 拖拽功能调试信息 ===');
        console.log('SortableJS版本:', Sortable.version || '未知');

        // 重新获取四象限元素
        const q1El = document.getElementById('q1-tasks');
        const q2El = document.getElementById('q2-tasks');
        const q3El = document.getElementById('q3-tasks');
        const q4El = document.getElementById('q4-tasks');

        const quadrantElements = [
            { el: q1El, id: 'q1-tasks', name: 'Q1-重要且紧急' },
            { el: q2El, id: 'q2-tasks', name: 'Q2-重要不紧急' },
            { el: q3El, id: 'q3-tasks', name: 'Q3-不重要但紧急' },
            { el: q4El, id: 'q4-tasks', name: 'Q4-不重要不紧急' }
        ];

        quadrantElements.forEach(item => {
            const { el, id, name } = item;
            if (!el) {
                console.log(`${name}: 元素不存在`);
                return;
            }

            const tasks = el.querySelectorAll('.task-item');
            const draggableCount = Array.from(tasks).filter(t => t.getAttribute('draggable') === 'true').length;

            console.log(`${name}:`, {
                '元素存在': true,
                'Sortable实例': !!el.sortable,
                '子元素数量': el.children.length,
                '任务元素数量': tasks.length,
                '可拖拽任务数': draggableCount,
                '所有任务可拖拽': draggableCount === tasks.length
            });

            // 列出没有draggable属性的任务
            if (draggableCount < tasks.length) {
                const nonDraggable = Array.from(tasks).filter(t => t.getAttribute('draggable') !== 'true');
                console.warn(`  ⚠️ ${nonDraggable.length} 个任务缺少draggable属性:`, nonDraggable);
            }
        });
        console.log('========================');
    };

    // 添加全局重新初始化拖拽函数
    window.reinitDrag = function () {
        console.log('🔄 重新初始化拖拽功能...');
        initSortable();
    };

    // 添加检查任务元素属性的函数
    window.checkTaskDraggable = function () {
        console.log('=== 检查任务元素拖拽属性 ===');
        const quadrants = ['q1-tasks', 'q2-tasks', 'q3-tasks', 'q4-tasks'];
        quadrants.forEach(qid => {
            const el = document.getElementById(qid);
            if (!el) {
                console.log(`${qid}: 元素不存在`);
                return;
            }
            const tasks = el.querySelectorAll('.task-item');
            console.log(`${qid}: 找到 ${tasks.length} 个任务`);
            tasks.forEach((task, idx) => {
                console.log(`  任务${idx + 1}:`, {
                    id: task.getAttribute('data-id'),
                    draggable: task.getAttribute('draggable'),
                    class: task.className,
                    cursor: window.getComputedStyle(task).cursor,
                    pointerEvents: window.getComputedStyle(task).pointerEvents,
                    userSelect: window.getComputedStyle(task).userSelect
                });
            });
        });
        console.log('================================');
    };

    console.log('💡 提示：在控制台输入 debugDragDrop() 可查看拖拽功能状态');
    console.log('💡 提示：在控制台输入 reinitDrag() 可重新初始化拖拽功能');
    console.log('💡 提示：在控制台输入 checkTaskDraggable() 检查任务元素属性');
}



window.initSortable = initSortable;
