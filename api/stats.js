/**
 * 遥测数据查看端点
 *
 * GET /api/stats?key=<STATS_ADMIN_KEY>
 * 返回聚合后的使用统计数据
 *
 * key 参数为简单保护，避免公开访问。
 * 查看方式：部署后访问 https://your-domain.example/api/stats?key=<STATS_ADMIN_KEY>
 */
const fs = require('node:fs');

const STATS_FILE = '/tmp/stats.json';

module.exports = function handler(req, res) {
    const adminKey = process.env.STATS_ADMIN_KEY;
    if (!adminKey || req.query?.key !== adminKey) {
        return res.status(403).json({ error: 'unauthorized' });
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        let stats = {};
        if (fs.existsSync(STATS_FILE)) {
            stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf-8'));
        }

        // 聚合计算
        const days = Object.keys(stats).filter(k => k.match(/^\d{4}-\d{2}-\d{2}$/)).sort();
        const totalUsers = new Set();
        let totalFeatures = {};
        let totalHeartbeats = 0;
        let dailyActiveUsers = [];

        days.forEach(function (day) {
            const d = stats[day];
            totalHeartbeats += d.users || 0;

            // 收集所有出现过用户 id 的去重总数（有限精度）
            if (d._seenIds) {
                d._seenIds.forEach(function (uid) { totalUsers.add(uid); });
            }

            // 功能聚合
            if (d.features) {
                Object.keys(d.features).forEach(function (f) {
                    if (!totalFeatures[f]) totalFeatures[f] = 0;
                    totalFeatures[f] += d.features[f];
                });
            }

            dailyActiveUsers.push({
                date: day,
                dau: d.users || 0,
                returning: d.returning || 0,
                features: d.features || {},
                avgTasks: d.taskCountSamples.length > 0
                    ? Math.round(d.totalTaskCount / d.taskCountSamples.length)
                    : 0
            });
        });

        // 最新日期的数据
        const lastDay = days.length > 0 ? days[days.length - 1] : null;
        const today = lastDay ? stats[lastDay] : null;

        return res.status(200).json({
            summary: {
                totalDays: days.length,
                estimatedTotalUsers: totalUsers.size,
                totalHeartbeats: totalHeartbeats,
                lastActiveDate: lastDay,
                todayDAU: today ? (today.users || 0) : 0,
                todayReturning: today ? (today.returning || 0) : 0,
                todayFeatures: today ? today.features : {},
                todayAvgTasks: today && today.taskCountSamples.length > 0
                    ? Math.round(today.totalTaskCount / today.taskCountSamples.length)
                    : 0
            },
            daily: dailyActiveUsers.slice(-30), // 最近 30 天
            allDays: dailyActiveUsers,
            topFeatures: Object.entries(totalFeatures)
                .sort(function (a, b) { return b[1] - a[1]; })
                .map(function (entry) { return { feature: entry[0], count: entry[1] }; })
        });
    } catch (e) {
        return res.status(500).json({ error: 'read error', message: e.message });
    }
};
