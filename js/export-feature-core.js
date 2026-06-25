(function () {
    'use strict';

    function getPriorityText(priority) {
        const priorityMap = {
            1: '重要且紧急',
            2: '重要不紧急',
            3: '不重要但紧急',
            4: '不重要不紧急'
        };
        return priorityMap[priority] || '未知';
    }

    function initExportFeature() {
        // 绑定导出按钮事件
        const exportBtn = document.getElementById('export-tasks-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                // 跳转到独立的导出页面，添加版本参数强制刷新缓存
                window.location.href = 'export.html?v=' + Date.now();
            });
        } else {
            console.error('导出按钮未找到！');
        }

        // 绑定导出模态框事件
        const exportModal = document.getElementById('export-modal');
        if (exportModal) {
            // 关闭按钮
            const closeBtn = exportModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', hideExportModal);
            }

            // 取消按钮
            const cancelBtn = document.getElementById('export-cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', hideExportModal);
            }

            // 确认导出按钮
            const confirmBtn = document.getElementById('export-confirm-btn');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', handleExport);
            }

            // 格式选择变化时更新预览
            const formatInputs = exportModal.querySelectorAll('input[name="export-format"]');
            formatInputs.forEach(input => {
                input.addEventListener('change', updateExportPreview);
            });

            // 设置变化时更新预览
            const settingInputs = exportModal.querySelectorAll('.export-settings input[type="checkbox"]');
            settingInputs.forEach(input => {
                input.addEventListener('change', updateExportPreview);
            });
        }
    }

    function showExportModal() {
        const modal = document.getElementById('export-modal');
        if (modal) {
            modal.style.display = 'flex';
            updateExportPreview();
            // 将焦点移到第一个格式选项
            const firstFormat = modal.querySelector('input[name="export-format"]');
            if (firstFormat) {
                firstFormat.focus();
            }
        } else {
            console.error('导出模态框未找到！');
        }
    }

    function hideExportModal() {
        const modal = document.getElementById('export-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function updateExportPreview() {
        const previewContent = document.getElementById('preview-content');
        if (!previewContent) return;

        const selectedFormat = document.querySelector('input[name="export-format"]:checked')?.value || 'excel';
        const includeCompleted = document.getElementById('include-completed')?.checked || false;
        const includeNotes = document.getElementById('include-notes')?.checked || false;
        const includeDates = document.getElementById('include-dates')?.checked || false;

        // 获取任务数据
        const tasks = getTasksForExport(includeCompleted);

        // 根据格式生成预览
        let preview = '';
        switch (selectedFormat) {
            case 'excel':
                preview = generateExcelPreview(tasks, includeNotes, includeDates);
                break;
            case 'pdf':
                preview = generatePDFPreview(tasks, includeNotes, includeDates);
                break;
            case 'word':
                preview = generateWordPreview(tasks, includeNotes, includeDates);
                break;
            case 'markdown':
                preview = generateMarkdownPreview(tasks, includeNotes, includeDates);
                break;
        }

        previewContent.textContent = preview;
    }

    function getTasksForExport(includeCompleted = true) {
        const tasks = JSON.parse(window.DataSyncStorage.getRaw('tasks') || '[]');
        if (includeCompleted) {
            return tasks;
        }
        return tasks.filter(task => !task.completed);
    }

    function generateExcelPreview(tasks, includeNotes, includeDates) {
        let preview = 'Excel格式预览:\n\n';
        preview += '任务标题\t优先级\t状态\t象限';
        if (includeNotes) preview += '\t备注';
        if (includeDates) preview += '\t创建时间\t完成时间';
        preview += '\n';

        preview += '─'.repeat(50) + '\n';

        tasks.slice(0, 5).forEach(task => {
            preview += `${task.title}\t${getPriorityText(task.priority)}\t${task.completed ? '已完成' : '进行中'}\t${getQuadrantText(task.priority)}`;
            if (includeNotes) preview += `\t${task.notes || ''}`;
            if (includeDates) {
                preview += `\t${task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ''}\t${task.completedAt ? new Date(task.completedAt).toLocaleDateString() : ''}`;
            }
            preview += '\n';
        });

        if (tasks.length > 5) {
            preview += `\n... 还有 ${tasks.length - 5} 个任务`;
        }

        return preview;
    }

    function generatePDFPreview(tasks, includeNotes, includeDates) {
        let preview = 'PDF格式预览:\n\n';
        preview += '象限时光 - 任务管理报告\n';
        preview += '='.repeat(30) + '\n\n';
        preview += `导出时间: ${new Date().toLocaleString()}\n`;
        preview += `任务总数: ${tasks.length}\n\n`;

        const quadrants = ['重要且紧急', '重要但不紧急', '不重要但紧急', '不重要且不紧急'];
        quadrants.forEach((quadrant, index) => {
            const quadrantTasks = tasks.filter(task => task.priority === index + 1);
            preview += `${quadrant} (${quadrantTasks.length}个任务):\n`;
            preview += '-'.repeat(20) + '\n';

            quadrantTasks.slice(0, 3).forEach(task => {
                preview += `• ${task.title}`;
                if (includeNotes && task.notes) preview += ` - ${task.notes}`;
                if (includeDates && task.createdAt) preview += ` (${new Date(task.createdAt).toLocaleDateString()})`;
                preview += '\n';
            });

            if (quadrantTasks.length > 3) {
                preview += `  ... 还有 ${quadrantTasks.length - 3} 个任务\n`;
            }
            preview += '\n';
        });

        return preview;
    }

    function generateWordPreview(tasks, includeNotes, includeDates) {
        let preview = 'Word格式预览:\n\n';
        preview += '象限时光任务管理文档\n';
        preview += '='.repeat(25) + '\n\n';

        preview += '目录\n';
        preview += '1. 任务概览\n';
        preview += '2. 详细任务列表\n';
        preview += '3. 统计信息\n\n';

        preview += '1. 任务概览\n';
        preview += '-'.repeat(15) + '\n';
        preview += `总任务数: ${tasks.length}\n`;
        preview += `已完成: ${tasks.filter(t => t.completed).length}\n`;
        preview += `进行中: ${tasks.filter(t => !t.completed).length}\n\n`;

        preview += '2. 详细任务列表\n';
        preview += '-'.repeat(15) + '\n';

        tasks.slice(0, 5).forEach((task, index) => {
            preview += `${index + 1}. ${task.title}\n`;
            preview += `   优先级: ${getPriorityText(task.priority)}\n`;
            preview += `   状态: ${task.completed ? '已完成' : '进行中'}\n`;
            if (includeNotes && task.notes) preview += `   备注: ${task.notes}\n`;
            if (includeDates && task.createdAt) preview += `   创建时间: ${new Date(task.createdAt).toLocaleString()}\n`;
            preview += '\n';
        });

        return preview;
    }

    function generateMarkdownPreview(tasks, includeNotes, includeDates) {
        let preview = 'Markdown格式预览:\n\n';
        preview += '# 象限时光任务管理\n\n';
        preview += `**导出时间:** ${new Date().toLocaleString()}\n`;
        preview += `**任务总数:** ${tasks.length}\n\n`;

        const quadrants = [
            { name: '重要且紧急', emoji: '🔥', priority: 1 },
            { name: '重要但不紧急', emoji: '⭐', priority: 2 },
            { name: '不重要但紧急', emoji: '⚡', priority: 3 },
            { name: '不重要且不紧急', emoji: '📋', priority: 4 }
        ];

        quadrants.forEach(quadrant => {
            const quadrantTasks = tasks.filter(task => task.priority === quadrant.priority);
            preview += `## ${quadrant.emoji} ${quadrant.name}\n\n`;

            if (quadrantTasks.length === 0) {
                preview += '*暂无任务*\n\n';
            } else {
                quadrantTasks.forEach(task => {
                    preview += `- [${task.completed ? 'x' : ' '}] **${task.title}**`;
                    if (includeNotes && task.notes) preview += ` - ${task.notes}`;
                    if (includeDates && task.createdAt) preview += ` *(${new Date(task.createdAt).toLocaleDateString()})*`;
                    preview += '\n';
                });
                preview += '\n';
            }
        });

        return preview;
    }

    function handleExport() {
        const selectedFormat = document.querySelector('input[name="export-format"]:checked')?.value || 'excel';
        const includeCompleted = document.getElementById('include-completed')?.checked || false;
        const includeNotes = document.getElementById('include-notes')?.checked || false;
        const includeDates = document.getElementById('include-dates')?.checked || false;

        const tasks = getTasksForExport(includeCompleted);

        if (tasks.length === 0) {
            showPageNotification('没有可导出的任务', 'warning');
            return;
        }

        try {
            switch (selectedFormat) {
                case 'excel':
                    exportToExcel(tasks, includeNotes, includeDates);
                    break;
                case 'pdf':
                    exportToPDF(tasks, includeNotes, includeDates);
                    break;
                case 'word':
                    exportToWord(tasks, includeNotes, includeDates);
                    break;
                case 'markdown':
                    exportToMarkdown(tasks, includeNotes, includeDates);
                    break;
            }

            hideExportModal();
            showPageNotification(`任务数据已导出为${getFormatName(selectedFormat)}格式`, 'success');
        } catch (error) {
            console.error('导出失败:', error);
            showPageNotification('导出失败，请重试', 'error');
        }
    }

    function exportToExcel(tasks, includeNotes, includeDates) {
        // 创建CSV格式数据
        let csvContent = '\uFEFF'; // BOM for UTF-8
        csvContent += '任务标题,优先级,状态,象限';
        if (includeNotes) csvContent += ',备注';
        if (includeDates) csvContent += ',创建时间,完成时间';
        csvContent += '\n';

        tasks.forEach(task => {
            const row = [
                `"${task.title.replace(/"/g, '""')}"`,
                getPriorityText(task.priority),
                task.completed ? '已完成' : '进行中',
                getQuadrantText(task.priority)
            ];

            if (includeNotes) {
                row.push(`"${(task.notes || '').replace(/"/g, '""')}"`);
            }

            if (includeDates) {
                row.push(task.createdAt ? new Date(task.createdAt).toLocaleString() : '');
                row.push(task.completedAt ? new Date(task.completedAt).toLocaleString() : '');
            }

            csvContent += row.join(',') + '\n';
        });

        downloadFile(csvContent, '象限时光任务列表.csv', 'text/csv');
    }

    function exportToPDF(tasks, includeNotes, includeDates) {
        // 使用jsPDF库生成PDF
        if (!getJsPDFConstructor()) {
            // 动态加载jsPDF
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', () => {
                generatePDF(tasks, includeNotes, includeDates);
            });
        } else {
            generatePDF(tasks, includeNotes, includeDates);
        }
    }

    function getJsPDFConstructor() {
        return window.jspdf?.jsPDF || window.jsPDF?.jsPDF || window.jsPDF;
    }

    function generatePDF(tasks, includeNotes, includeDates) {
        const JsPDF = getJsPDFConstructor();
        if (!JsPDF) {
            showPageNotification('PDF导出库加载失败，请稍后重试');
            return;
        }
        const doc = new JsPDF();

        // 标题
        doc.setFontSize(20);
        doc.text('象限时光 - 任务管理报告', 20, 30);

        // 基本信息
        doc.setFontSize(12);
        doc.text(`导出时间: ${new Date().toLocaleString()}`, 20, 50);
        doc.text(`任务总数: ${tasks.length}`, 20, 60);
        doc.text(`已完成: ${tasks.filter(t => t.completed).length}`, 20, 70);
        doc.text(`进行中: ${tasks.filter(t => !t.completed).length}`, 20, 80);

        // 任务列表
        let y = 100;
        const quadrants = ['重要且紧急', '重要但不紧急', '不重要但紧急', '不重要且不紧急'];

        quadrants.forEach((quadrant, index) => {
            const quadrantTasks = tasks.filter(task => task.priority === index + 1);

            if (quadrantTasks.length > 0) {
                doc.setFontSize(14);
                doc.text(quadrant, 20, y);
                y += 10;

                doc.setFontSize(10);
                quadrantTasks.forEach(task => {
                    if (y > 280) {
                        doc.addPage();
                        y = 20;
                    }

                    const status = task.completed ? '✓' : '○';
                    doc.text(`${status} ${task.title}`, 30, y);
                    y += 6;

                    if (includeNotes && task.notes) {
                        doc.text(`   备注: ${task.notes}`, 35, y);
                        y += 6;
                    }

                    if (includeDates && task.createdAt) {
                        doc.text(`   创建: ${new Date(task.createdAt).toLocaleDateString()}`, 35, y);
                        y += 6;
                    }

                    y += 3;
                });
                y += 10;
            }
        });

        doc.save('象限时光任务列表.pdf');
    }

    function exportToWord(tasks, includeNotes, includeDates) {
        // 生成HTML格式的Word文档
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>象限时光任务管理</title>
            <style>
                body { font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 40px; }
                h1 { color: #6366f1; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
                h2 { color: #374151; margin-top: 30px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f3f4f6; font-weight: bold; }
                .completed { text-decoration: line-through; color: #6b7280; }
                .priority-1 { background-color: #fef2f2; }
                .priority-2 { background-color: #fffbeb; }
                .priority-3 { background-color: #f0f9ff; }
                .priority-4 { background-color: #f9fafb; }
            </style>
        </head>
        <body>
            <h1>象限时光任务管理报告</h1>
            <p><strong>导出时间:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>任务总数:</strong> ${tasks.length}</p>
            <p><strong>已完成:</strong> ${tasks.filter(t => t.completed).length}</p>
            <p><strong>进行中:</strong> ${tasks.filter(t => !t.completed).length}</p>

            <h2>任务列表</h2>
            <table>
                <tr>
                    <th>任务标题</th>
                    <th>优先级</th>
                    <th>状态</th>
                    <th>象限</th>
                    ${includeNotes ? '<th>备注</th>' : ''}
                    ${includeDates ? '<th>创建时间</th><th>完成时间</th>' : ''}
                </tr>
        `;

        tasks.forEach(task => {
            const status = task.completed ? '已完成' : '进行中';
            const statusClass = task.completed ? 'completed' : '';
            const priorityClass = `priority-${task.priority}`;

            htmlContent += `
                <tr class="${statusClass} ${priorityClass}">
                    <td>${task.title}</td>
                    <td>${getPriorityText(task.priority)}</td>
                    <td>${status}</td>
                    <td>${getQuadrantText(task.priority)}</td>
                    ${includeNotes ? `<td>${task.notes || ''}</td>` : ''}
                    ${includeDates ? `<td>${task.createdAt ? new Date(task.createdAt).toLocaleString() : ''}</td><td>${task.completedAt ? new Date(task.completedAt).toLocaleString() : ''}</td>` : ''}
                </tr>
            `;
        });

        htmlContent += `
            </table>
        </body>
        </html>
        `;

        downloadFile(htmlContent, '象限时光任务列表.doc', 'application/msword');
    }

    function exportToMarkdown(tasks, includeNotes, includeDates) {
        let markdown = `# 象限时光任务管理\n\n`;
        markdown += `**导出时间:** ${new Date().toLocaleString()}\n`;
        markdown += `**任务总数:** ${tasks.length}\n`;
        markdown += `**已完成:** ${tasks.filter(t => t.completed).length}\n`;
        markdown += `**进行中:** ${tasks.filter(t => !t.completed).length}\n\n`;

        const quadrants = [
            { name: '重要且紧急', emoji: '🔥', priority: 1 },
            { name: '重要但不紧急', emoji: '⭐', priority: 2 },
            { name: '不重要但紧急', emoji: '⚡', priority: 3 },
            { name: '不重要且不紧急', emoji: '📋', priority: 4 }
        ];

        quadrants.forEach(quadrant => {
            const quadrantTasks = tasks.filter(task => task.priority === quadrant.priority);
            markdown += `## ${quadrant.emoji} ${quadrant.name}\n\n`;

            if (quadrantTasks.length === 0) {
                markdown += `*暂无任务*\n\n`;
            } else {
                quadrantTasks.forEach(task => {
                    markdown += `- [${task.completed ? 'x' : ' '}] **${task.title}**`;
                    if (includeNotes && task.notes) markdown += ` - ${task.notes}`;
                    if (includeDates && task.createdAt) markdown += ` *(${new Date(task.createdAt).toLocaleDateString()})*`;
                    markdown += `\n`;
                });
                markdown += `\n`;
            }
        });

        downloadFile(markdown, '象限时光任务列表.md', 'text/markdown');
    }

    function getQuadrantText(priority) {
        const quadrants = ['', '重要且紧急', '重要但不紧急', '不重要但紧急', '不重要且不紧急'];
        return quadrants[priority] || '未知';
    }

    function getFormatName(format) {
        const names = {
            excel: 'Excel',
            pdf: 'PDF',
            word: 'Word',
            markdown: 'Markdown'
        };
        return names[format] || format;
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
    }

    window.initExportFeature = initExportFeature;
    window.showExportModal = showExportModal;
    window.hideExportModal = hideExportModal;
    window.updateExportPreview = updateExportPreview;
    window.handleExport = handleExport;
    window.exportToExcel = exportToExcel;
    window.exportToPDF = exportToPDF;
    window.exportToWord = exportToWord;
    window.exportToMarkdown = exportToMarkdown;
})();
