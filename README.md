# XXSG（象限时光）

[![CI](https://github.com/wangyuanhao666/XXSG-OpenSource/actions/workflows/ci.yml/badge.svg)](https://github.com/wangyuanhao666/XXSG-OpenSource/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Local First](https://img.shields.io/badge/Local--First-PWA-22c55e.svg)](#重要安全说明)
[![BYOK](https://img.shields.io/badge/AI-BYOK-orange.svg)](#ai-功能采用-byok-模式)

XXSG 是一个本地优先的个人生产力 PWA，围绕四象限任务管理，提供任务、日历、习惯打卡、番茄钟、时间统计、每日一签和 AI 辅助能力。

> 当前开源版本定位为“本地优先 / 自托管 / BYOK（Bring Your Own Key）”。  
> 它不是完整的公网多人 SaaS：用户、任务、设置和 AI 配置默认保存在浏览器本地存储中。

## 功能亮点

- 四象限任务管理：任务分类、子任务、置顶、拖拽排序、列表/象限视图切换。
- 日历日程：日历事件管理，并支持从任务同步到日历。
- 习惯打卡：日历式打卡、连续天数和趋势统计。
- 番茄钟：自定义专注/休息时长、音效和历史记录。
- 数据看板：任务数量、完成率、象限分布等统计。
- 每日一签：传统签文与可选 AI 签文。
- AI 辅助：任务分析、智能建议等能力，需要使用者自行配置 API Key。
- 数据导入/导出：用于本地备份和迁移。

## 预览

![XXSG 管理后台预览](docs/assets/admin-dashboard.png)

## 在线部署

你可以直接 fork 或 clone 后部署到静态托管平台：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/wangyuanhao666/XXSG-OpenSource)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/wangyuanhao666/XXSG-OpenSource)

GitHub Pages 也可以部署，详见 [部署指南](docs/DEPLOYMENT.md)。

## 本地运行

```bash
git clone https://github.com/wangyuanhao666/XXSG-OpenSource.git
cd XXSG-OpenSource
npm install
npm run serve
```

然后访问：

```text
http://localhost:8080
```

首次使用请看：[首次使用指南](docs/FIRST_USE.md)。

## 重要安全说明

### 本项目默认不提供云端账号系统

当前版本主要依赖浏览器本地存储。换浏览器、清理缓存或更换设备前，请先导出备份。

如果你需要公网多人注册、统一登录、跨设备同步、管理员服务端鉴权，请参考 [SaaS 后端路线图](docs/saas-backend-roadmap.md)，先接入后端认证和数据库。

### AI 功能采用 BYOK 模式

每日一签 AI 和 AI 服务需要配置第三方模型 API Key。当前本地优先版本中，API Key 会保存在部署者/使用者自己的浏览器侧存储中。

请不要把你自己的 API Key 写进源码，也不要把配置后的浏览器数据导出给他人。

如果你要给公网用户统一提供 AI 能力，请先实现服务端 AI Proxy，把模型供应商 Key 放在服务器环境变量里，并增加鉴权、限流和额度控制。

### 管理员密码由部署者初始化

开源版本不内置公开默认管理员密码。首次自托管使用时，请使用管理员账号 `admin` 登录，并输入至少 8 位密码完成本地初始化。

这个管理员机制仍然属于本地前端管理，适合个人/自托管使用，不等同于服务端安全管理员系统。

## 项目结构

```text
.
├── index.html                 # 主应用入口
├── login.html                 # 登录/本地管理员初始化入口
├── admin.html                 # 本地管理员后台
├── js/                        # 主要前端逻辑
├── css/                       # 页面样式
├── partials/                  # 功能视图片段
├── api/                       # 可选 Vercel Serverless 示例
├── docs/                      # 使用、部署和路线图文档
├── tools/                     # 检查脚本
├── sw.js                      # PWA Service Worker
└── manifest.json              # PWA Manifest
```

## 开发检查

```bash
npm run check
npm run audit:project
```

CI 会在 GitHub Actions 中运行同样的检查。

## 路线图

- 第一阶段：安全开源本地版，明确本地优先和 BYOK 边界。
- 第二阶段：增加可选后端同步适配器。
- 第三阶段：服务端认证、数据库、多租户权限和 AI Proxy。
- 第四阶段：面向公网用户的 SaaS 化部署。

## 参与贡献

欢迎 issue、文档改进、UI 优化和功能 PR。开始前请阅读：

- [贡献指南](CONTRIBUTING.md)
- [安全策略](SECURITY.md)

## License

MIT License. See [LICENSE](LICENSE).
