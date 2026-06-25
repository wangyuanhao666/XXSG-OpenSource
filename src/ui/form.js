// 表单组件模块
// 简化的表单组件，用于表单验证和处理

import { validateRequired } from '../core/validator.js';

/**
 * 表单管理类
 */
export class Form {
    constructor(formId, options = {}) {
        this.form = document.getElementById(formId);
        this.fields = options.fields || [];
        this.onSubmit = options.onSubmit || null;
        this.onValidate = options.onValidate || null;
        this.errors = {};

        if (this.form) {
            this.init();
        }
    }

    /**
     * 初始化表单
     */
    init() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // 为每个字段添加实时验证
        this.fields.forEach(field => {
            const input = this.form.querySelector(`[name="${field.name}"]`);
            if (input) {
                input.addEventListener('blur', () => {
                    this.validateField(field.name);
                });
            }
        });
    }

    /**
     * 验证单个字段
     * @param {string} fieldName - 字段名
     * @returns {boolean} 是否有效
     */
    validateField(fieldName) {
        const field = this.fields.find(f => f.name === fieldName);
        if (!field) return true;

        const input = this.form.querySelector(`[name="${fieldName}"]`);
        if (!input) return true;

        const value = input.value;

        // 必填验证
        if (field.required && (!value || value.trim().length === 0)) {
            this.setError(fieldName, '此字段为必填项');
            return false;
        }

        // 自定义验证
        if (field.validate) {
            const result = field.validate(value);
            if (!result.valid) {
                this.setError(fieldName, result.message);
                return false;
            }
        }

        this.clearError(fieldName);
        return true;
    }

    /**
     * 验证整个表单
     * @returns {boolean} 是否有效
     */
    validate() {
        this.errors = {};
        let isValid = true;

        this.fields.forEach(field => {
            if (!this.validateField(field.name)) {
                isValid = false;
            }
        });

        if (this.onValidate) {
            const customResult = this.onValidate(this.getValues());
            if (!customResult.valid) {
                isValid = false;
                Object.assign(this.errors, customResult.errors || {});
            }
        }

        return isValid;
    }

    /**
     * 设置字段错误
     * @param {string} fieldName - 字段名
     * @param {string} message - 错误消息
     */
    setError(fieldName, message) {
        this.errors[fieldName] = message;

        const input = this.form.querySelector(`[name="${fieldName}"]`);
        if (input) {
            input.classList.add('error');

            // 显示错误消息
            let errorEl = input.parentElement.querySelector('.error-message');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'error-message';
                input.parentElement.appendChild(errorEl);
            }
            errorEl.textContent = message;
        }
    }

    /**
     * 清除字段错误
     * @param {string} fieldName - 字段名
     */
    clearError(fieldName) {
        delete this.errors[fieldName];

        const input = this.form.querySelector(`[name="${fieldName}"]`);
        if (input) {
            input.classList.remove('error');

            const errorEl = input.parentElement.querySelector('.error-message');
            if (errorEl) {
                errorEl.remove();
            }
        }
    }

    /**
     * 获取表单值
     * @returns {Object} 表单数据
     */
    getValues() {
        const values = {};

        this.fields.forEach(field => {
            const input = this.form.querySelector(`[name="${field.name}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    values[field.name] = input.checked;
                } else if (input.type === 'radio') {
                    const checked = this.form.querySelector(`[name="${field.name}"]:checked`);
                    values[field.name] = checked ? checked.value : null;
                } else {
                    values[field.name] = input.value;
                }
            }
        });

        return values;
    }

    /**
     * 设置表单值
     * @param {Object} values - 表单数据
     */
    setValues(values) {
        Object.keys(values).forEach(key => {
            const input = this.form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = values[key];
                } else if (input.type === 'radio') {
                    const radio = this.form.querySelector(`[name="${key}"][value="${values[key]}"]`);
                    if (radio) radio.checked = true;
                } else {
                    input.value = values[key];
                }
            }
        });
    }

    /**
     * 重置表单
     */
    reset() {
        this.form.reset();
        this.errors = {};

        // 清除所有错误显示
        this.fields.forEach(field => {
            this.clearError(field.name);
        });
    }

    /**
     * 处理表单提交
     */
    async handleSubmit() {
        if (!this.validate()) {
            console.log('表单验证失败:', this.errors);
            return;
        }

        const values = this.getValues();

        if (this.onSubmit) {
            try {
                await this.onSubmit(values);
            } catch (error) {
                console.error('表单提交失败:', error);
            }
        }
    }
}

/**
 * 创建表单实例
 * @param {string} formId - 表单ID
 * @param {Object} options - 选项
 * @returns {Form} 表单实例
 */
export function createForm(formId, options) {
    return new Form(formId, options);
}
