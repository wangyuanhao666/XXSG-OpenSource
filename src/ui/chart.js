// 图表组件模块
// 简化的图表组件，用于数据可视化

/**
 * 图表基类
 */
class Chart {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            width: options.width || 600,
            height: options.height || 400,
            title: options.title || '',
            colors: options.colors || ['#667eea', '#4CAF50', '#ff9800', '#f44336', '#2196F3'],
            ...options
        };
    }

    /**
     * 清空容器
     */
    clear() {
        if (this.container) {
            this.container.replaceChildren();
        }
    }

    /**
     * 创建SVG元素
     * @returns {SVGElement} SVG元素
     */
    createSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', this.options.width);
        svg.setAttribute('height', this.options.height);
        return svg;
    }
}

/**
 * 柱状图类
 */
export class BarChart extends Chart {
    /**
     * 渲染柱状图
     * @param {Array} data - 数据数组 [{label, value}]
     */
    render(data) {
        this.clear();

        const svg = this.createSVG();
        const { width, height, colors } = this.options;

        const margin = { top: 40, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // 计算最大值
        const maxValue = Math.max(...data.map(d => d.value));

        // 计算柱子宽度
        const barWidth = chartWidth / data.length * 0.8;
        const barGap = chartWidth / data.length * 0.2;

        // 绘制柱子
        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = margin.left + index * (barWidth + barGap);
            const y = margin.top + (chartHeight - barHeight);

            // 柱子
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('fill', colors[index % colors.length]);
            rect.setAttribute('rx', '4');
            svg.appendChild(rect);

            // 标签
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + barWidth / 2);
            text.setAttribute('y', height - margin.bottom + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '12');
            text.textContent = item.label;
            svg.appendChild(text);

            // 数值
            const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            valueText.setAttribute('x', x + barWidth / 2);
            valueText.setAttribute('y', y - 5);
            valueText.setAttribute('text-anchor', 'middle');
            valueText.setAttribute('font-size', '12');
            valueText.setAttribute('font-weight', 'bold');
            valueText.textContent = item.value;
            svg.appendChild(valueText);
        });

        // 标题
        if (this.options.title) {
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            title.setAttribute('x', width / 2);
            title.setAttribute('y', 20);
            title.setAttribute('text-anchor', 'middle');
            title.setAttribute('font-size', '16');
            title.setAttribute('font-weight', 'bold');
            title.textContent = this.options.title;
            svg.appendChild(title);
        }

        this.container.appendChild(svg);
    }
}

/**
 * 饼图类
 */
export class PieChart extends Chart {
    /**
     * 渲染饼图
     * @param {Array} data - 数据数组 [{label, value}]
     */
    render(data) {
        this.clear();

        const svg = this.createSVG();
        const { width, height, colors } = this.options;

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 60;

        // 计算总值
        const total = data.reduce((sum, item) => sum + item.value, 0);

        // 绘制扇形
        let currentAngle = -Math.PI / 2; // 从顶部开始

        data.forEach((item, index) => {
            const angle = (item.value / total) * 2 * Math.PI;
            const endAngle = currentAngle + angle;

            // 计算路径
            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const largeArcFlag = angle > Math.PI ? 1 : 0;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `
                M ${centerX} ${centerY}
                L ${x1} ${y1}
                A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                Z
            `);
            path.setAttribute('fill', colors[index % colors.length]);
            path.setAttribute('stroke', 'white');
            path.setAttribute('stroke-width', '2');
            svg.appendChild(path);

            // 标签
            const labelAngle = currentAngle + angle / 2;
            const labelRadius = radius + 30;
            const labelX = centerX + labelRadius * Math.cos(labelAngle);
            const labelY = centerY + labelRadius * Math.sin(labelAngle);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', labelX);
            text.setAttribute('y', labelY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '12');
            text.textContent = `${item.label} (${((item.value / total) * 100).toFixed(1)}%)`;
            svg.appendChild(text);

            currentAngle = endAngle;
        });

        // 标题
        if (this.options.title) {
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            title.setAttribute('x', width / 2);
            title.setAttribute('y', 20);
            title.setAttribute('text-anchor', 'middle');
            title.setAttribute('font-size', '16');
            title.setAttribute('font-weight', 'bold');
            title.textContent = this.options.title;
            svg.appendChild(title);
        }

        this.container.appendChild(svg);
    }
}

/**
 * 折线图类
 */
export class LineChart extends Chart {
    /**
     * 渲染折线图
     * @param {Array} data - 数据数组 [{label, value}]
     */
    render(data) {
        this.clear();

        const svg = this.createSVG();
        const { width, height, colors } = this.options;

        const margin = { top: 40, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // 计算最大值和最小值
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const valueRange = maxValue - minValue;

        // 计算点的位置
        const points = data.map((item, index) => {
            const x = margin.left + (index / (data.length - 1)) * chartWidth;
            const y = margin.top + chartHeight - ((item.value - minValue) / valueRange) * chartHeight;
            return { x, y, ...item };
        });

        // 绘制折线
        const pathData = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
        ).join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', colors[0]);
        path.setAttribute('stroke-width', '2');
        svg.appendChild(path);

        // 绘制点
        points.forEach(point => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', colors[0]);
            svg.appendChild(circle);

            // 标签
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', point.x);
            text.setAttribute('y', height - margin.bottom + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('font-size', '12');
            text.textContent = point.label;
            svg.appendChild(text);
        });

        // 标题
        if (this.options.title) {
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            title.setAttribute('x', width / 2);
            title.setAttribute('y', 20);
            title.setAttribute('text-anchor', 'middle');
            title.setAttribute('font-size', '16');
            title.setAttribute('font-weight', 'bold');
            title.textContent = this.options.title;
            svg.appendChild(title);
        }

        this.container.appendChild(svg);
    }
}

/**
 * 创建柱状图
 * @param {string} containerId - 容器ID
 * @param {Array} data - 数据
 * @param {Object} options - 选项
 */
export function createBarChart(containerId, data, options) {
    const chart = new BarChart(containerId, options);
    chart.render(data);
    return chart;
}

/**
 * 创建饼图
 * @param {string} containerId - 容器ID
 * @param {Array} data - 数据
 * @param {Object} options - 选项
 */
export function createPieChart(containerId, data, options) {
    const chart = new PieChart(containerId, options);
    chart.render(data);
    return chart;
}

/**
 * 创建折线图
 * @param {string} containerId - 容器ID
 * @param {Array} data - 数据
 * @param {Object} options - 选项
 */
export function createLineChart(containerId, data, options) {
    const chart = new LineChart(containerId, options);
    chart.render(data);
    return chart;
}
