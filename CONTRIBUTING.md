# 贡献指南

感谢你愿意参与 XXSG。

## 开始之前

请先确认你理解当前项目定位：

- 本地优先；
- 自托管友好；
- AI 功能采用 BYOK；
- 当前版本不是完整 SaaS。

## 本地开发

```bash
git clone https://github.com/wangyuanhao666/XXSG-OpenSource.git
cd XXSG-OpenSource
npm install
npm run serve
```

## 提交前检查

```bash
npm run check
npm run audit:project
```

请不要提交：

- 真实 API Key；
- 个人账号、手机号、邮箱等隐私数据；
- 浏览器导出的个人数据备份；
- 临时调试脚本；
- 大体积无关素材。

## PR 建议

推荐 PR 聚焦单一主题，例如：

- 修复一个 UI 问题；
- 改进一个功能；
- 补充一份文档；
- 增加一项检查；
- 拆分一个历史大文件。

如果是较大的功能设计，请先开 issue 讨论。

## 代码风格

当前项目以原生 HTML/CSS/JavaScript 为主，仍在逐步模块化。请优先保持现有结构稳定，避免一次性大规模重写。

## 安全相关

如果你发现可能导致密钥泄露、账号绕过、XSS、数据损坏等问题，请不要直接公开细节，先阅读 `SECURITY.md`。
