# 部署指南

XXSG 开源版是一个静态优先的 PWA，可以部署到 GitHub Pages、Vercel、Netlify、Cloudflare Pages 或任意静态文件服务器。

## 部署前检查

```bash
npm run check
```

确认没有真实 API Key、个人数据备份或调试文件被提交。

## Vercel

最简单的方式是使用 README 中的 Vercel 一键部署按钮。

如果手动部署：

1. 在 Vercel 导入 GitHub 仓库。
2. Framework Preset 选择 `Other`。
3. Build Command 留空或使用默认。
4. Output Directory 留空。
5. 部署。

可选环境变量：

```text
STATS_ADMIN_KEY=replace-with-a-long-random-secret
```

该变量只用于保护 `/api/stats` 示例接口。未配置时，该接口默认不可访问。

## Netlify

1. 在 Netlify 导入 GitHub 仓库。
2. Build command 留空。
3. Publish directory 设置为仓库根目录。
4. 部署。

如果需要更细的缓存策略，可以后续补 `netlify.toml`。

## GitHub Pages

1. 进入仓库 Settings。
2. 打开 Pages。
3. Source 选择 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/root`。
5. 保存。

GitHub Pages 不支持仓库中的 `api/` Serverless 示例；这不影响静态应用主体功能。

## 任意静态服务器

```bash
python -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 生产使用注意事项

- 不要提交真实 API Key。
- 不要提交浏览器导出的个人备份。
- 不要把当前版本描述为完整 SaaS。
- 如果开放给公网用户，请在页面或 README 中说明本地存储和 BYOK 边界。
- 每日一签 AI 和 AI 任务分析不会在部署后自动可用，需要部署者/使用者登录管理员后台 → AI 配置中配置 API Key。两者共用 AI 服务配置，支持 DeepSeek、OpenAI、Claude、Kimi、通义千问、GLM/Z.ai 和 MiniMax。
- 如果要统一托管 AI Key，请先实现服务端 AI Proxy。
