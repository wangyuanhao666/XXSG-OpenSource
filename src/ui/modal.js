// 模态框组件模块
// 从 script.js 中提取的模态框相关功能

/**
 * 模态框管理类
 */

function renderModalMarkup(container, markup) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${markup}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    root.querySelectorAll('script, iframe, object, embed, link, meta').forEach(node => node.remove());
    root.querySelectorAll('*').forEach(node => {
        [...node.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            const value = attr.value.trim().toLowerCase();
            if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) {
                node.removeAttribute(attr.name);
            }
        });
    });
    container.replaceChildren(...[...root.childNodes].map(node => document.importNode(node, true)));
}

export class ModalManager {
    constructor() {
        this.activeModals = new Set();
    }

    /**
     * 显示模态框
     * @param {string} modalId - 模态框ID
     * @param {Object} options - 选项
     */
    show(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn('⚠️ 模态框不存在:', modalId);
            return false;
        }

        modal.style.display = 'flex';
        this.activeModals.add(modalId);

        // 添加关闭事件
        if (options.closeOnClickOutside !== false) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hide(modalId);
                }
            });
        }

        // 添加ESC键关闭
        if (options.closeOnEsc !== false) {
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.hide(modalId);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }

        console.log('✅ 模态框已显示:', modalId);
        return true;
    }

    /**
     * 隐藏模态框
     * @param {string} modalId - 模态框ID
     */
    hide(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn('⚠️ 模态框不存在:', modalId);
            return false;
        }

        modal.style.display = 'none';
        this.activeModals.delete(modalId);

        console.log('✅ 模态框已隐藏:', modalId);
        return true;
    }

    /**
     * 切换模态框显示状态
     * @param {string} modalId - 模态框ID
     */
    toggle(modalId) {
        if (this.activeModals.has(modalId)) {
            this.hide(modalId);
        } else {
            this.show(modalId);
        }
    }

    /**
     * 隐藏所有模态框
     */
    hideAll() {
        this.activeModals.forEach(modalId => {
            this.hide(modalId);
        });
    }

    /**
     * 显示确认对话框
     * @param {Object} options - 选项
     * @returns {Promise<boolean>} 用户是否确认
     */
    async showConfirm(options = {}) {
        const {
            title = '确认',
            message = '确定要执行此操作吗？',
            confirmText = '确定',
            cancelText = '取消',
            type = 'warning' // success, error, warning, info
        } = options;

        return new Promise((resolve) => {
            // 创建确认对话框
            const modal = document.createElement('div');
            modal.className = 'modal confirm-modal';
            renderModalMarkup(modal, `
                <div class="modal-content confirm-content">
                    <div class="confirm-header ${type}">
                        <h3>${title}</h3>
                    </div>
                    <div class="confirm-body">
                        <p>${message}</p>
                    </div>
                    <div class="confirm-footer">
                        <button class="btn btn-cancel">${cancelText}</button>
                        <button class="btn btn-confirm ${type}">${confirmText}</button>
                    </div>
                </div>
            `);

            document.body.appendChild(modal);
            modal.style.display = 'flex';

            // 绑定事件
            const confirmBtn = modal.querySelector('.btn-confirm');
            const cancelBtn = modal.querySelector('.btn-cancel');

            const cleanup = () => {
                modal.style.display = 'none';
                document.body.removeChild(modal);
            };

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            // 点击外部关闭
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }

    /**
     * 显示提示对话框
     * @param {Object} options - 选项
     * @returns {Promise<void>}
     */
    async showAlert(options = {}) {
        const {
            title = '提示',
            message = '',
            okText = '确定',
            type = 'info'
        } = options;

        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal alert-modal';
            renderModalMarkup(modal, `
                <div class="modal-content alert-content">
                    <div class="alert-header ${type}">
                        <h3>${title}</h3>
                    </div>
                    <div class="alert-body">
                        <p>${message}</p>
                    </div>
                    <div class="alert-footer">
                        <button class="btn btn-ok ${type}">${okText}</button>
                    </div>
                </div>
            `);

            document.body.appendChild(modal);
            modal.style.display = 'flex';

            const okBtn = modal.querySelector('.btn-ok');

            const cleanup = () => {
                modal.style.display = 'none';
                document.body.removeChild(modal);
                resolve();
            };

            okBtn.addEventListener('click', cleanup);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                }
            });
        });
    }

    /**
     * 显示输入对话框
     * @param {Object} options - 选项
     * @returns {Promise<string|null>} 用户输入的值
     */
    async showPrompt(options = {}) {
        const {
            title = '输入',
            message = '',
            placeholder = '',
            defaultValue = '',
            confirmText = '确定',
            cancelText = '取消'
        } = options;

        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal prompt-modal';
            renderModalMarkup(modal, `
                <div class="modal-content prompt-content">
                    <div class="prompt-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="prompt-body">
                        <p>${message}</p>
                        <input type="text" class="prompt-input" placeholder="${placeholder}" value="${defaultValue}">
                    </div>
                    <div class="prompt-footer">
                        <button class="btn btn-cancel">${cancelText}</button>
                        <button class="btn btn-confirm">${confirmText}</button>
                    </div>
                </div>
            `);

            document.body.appendChild(modal);
            modal.style.display = 'flex';

            const input = modal.querySelector('.prompt-input');
            const confirmBtn = modal.querySelector('.btn-confirm');
            const cancelBtn = modal.querySelector('.btn-cancel');

            input.focus();
            input.select();

            const cleanup = () => {
                modal.style.display = 'none';
                document.body.removeChild(modal);
            };

            confirmBtn.addEventListener('click', () => {
                const value = input.value.trim();
                cleanup();
                resolve(value || null);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(null);
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const value = input.value.trim();
                    cleanup();
                    resolve(value || null);
                }
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cleanup();
                    resolve(null);
                }
            });
        });
    }
}

// 导出单例实例
export const modalManager = new ModalManager();

// 导出便捷函数
export const showModal = (modalId, options) => modalManager.show(modalId, options);
export const hideModal = (modalId) => modalManager.hide(modalId);
export const toggleModal = (modalId) => modalManager.toggle(modalId);
export const showConfirm = (options) => modalManager.showConfirm(options);
export const showAlert = (options) => modalManager.showAlert(options);
export const showPrompt = (options) => modalManager.showPrompt(options);
