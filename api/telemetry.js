/**
 * 匿名遥测数据接收端点
 *
 * POST /api/telemetry
 * Body: { id, day, features, taskCount, firstVisitDay, t }
 *
 * 存储结构（/tmp/stats.json）:
 * {
 *   "2026-06-20": {
 *     "users": 42,           // 当日去重用户数（基于 id）
 *     "returning": 30,       // 回访用户数
 *     "features": {          // 功能使用计数
 *       "quadrant": 35,
 *       "pomodoro": 12
 *     },
 *     "totalTaskCount": 560, // 任务总数
 *     "taskCountSamples": [] // 任务数采样（最多 100 条/天）
 *   }
 * }
 *
 * 数据仅存储在服务器 /tmp 目录，重启后丢失。
 * 如需持久存储，请配置 Vercel KV 并修改此文件。
 */

const fs = require('node:fs');
const path = require('node:path');

const STATS_FILE = '/tmp/stats.json';

function readStats() {
    try {
        if (fs.existsSync(STATS_FILE)) {
            return JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
        }
    } catch (e) {
        // 文件损坏时重置
    }
    return {};
}

function writeStats(stats) {
    try {
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats));
    } catch (e) {
        // 写入失败静默处理
    }
}

module.exports = function handler(req, res) {
    // 仅接受 POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 跨域支持
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const body = req.body || {};
        const { id, day, features, taskCount, firstVisitDay } = body;

        if (!day) {
            return res.status(400).json({ error: 'missing day' });
        }

        const stats = readStats();

        // 初始化日数据
        if (!stats[day]) {
            stats[day] = {
                users: 0,
                returning: 0,
                features: {},
                totalTaskCount: 0,
                taskCountSamples: []
            };
        }

        const dayStats = stats[day];

        // 用户去重：使用 id 的简单 hash 判断是否新用户
        if (id) {
            // 存储已见过的用户 id（限制数量避免文件过大）
            if (!dayStats._seenIds) dayStats._seenIds = [];
            if (!dayStats._seenIds.includes(id)) {
                dayStats._seenIds.push(id);
                if (dayStats._seenIds.length > 500) {
                    dayStats._seenIds = dayStats._seenIds.slice(-250);
                }
                dayStats.users = dayStats._seenIds.length;
            }
        }

        // 回访判断
        if (firstVisitDay && firstVisitDay < day) {
            dayStats.returning = (dayStats.returning || 0) + 1;
        }

        // 功能使用计数
        if (Array.isArray(features)) {
            features.forEach(function (f) {
                if (!dayStats.features[f]) dayStats.features[f] = 0;
                dayStats.features[f]++;
            });
        }

        // 任务总数
        if (typeof taskCount === 'number' && taskCount >= 0) {
            dayStats.totalTaskCount += taskCount;
            // 采样：最多保存 100 个样本
            if (dayStats.taskCountSamples.length < 100) {
                dayStats.taskCountSamples.push(taskCount);
            }
        }

        writeStats(stats);

        return res.status(200).json({ ok: true });
    } catch (e) {
        return res.status(500).json({ error: 'internal error' });
    }
};
