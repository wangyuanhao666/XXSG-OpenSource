# XXSG Local-First Commercial Launch Checklist

## Positioning

XXSG v1 is a local-first commercial beta. User tasks, settings, calendar events, pomodoro records, and AI configuration are stored in the browser unless a future SaaS backend is connected. Do not describe v1 as a cloud account system or enterprise SaaS security model.

## Required Pre-Release Checks

- Run `npm.cmd run check`.
- Run `npm.cmd run audit:project`.
- Run `git diff --check`.
- Confirm `git status --short` is clean before release.
- Smoke test `login.html`, `index.html`, `admin.html`, and `data-sync.html` through `http://localhost:8080/`.
- Check browser console for `pageerror` and `console error`.
- Confirm `manifest.json` and `sw.js` checks pass through the normal check command.

## Production Boundary

- Deploy static app files only; exclude diagnostics, repair scripts, local API helpers, old backups, logs, screenshots, and temporary worktrees.
- Keep debug tools out of public navigation and public deployment bundles.
- Keep CSP in staged mode until the inline style audit shows the main production paths no longer depend on broad `unsafe-inline` styles.

## Local Data Notice

- Tell users that data is saved in their browser storage.
- Tell users to export a backup before clearing browser data, changing browsers, or reinstalling the app.
- Data sync/import/export must preserve existing local data formats.
- AI provider credentials remain browser-side in v1; recommend local/private use until the AI Proxy backend exists.

## SaaS Upgrade Gate

Before calling XXSG a true SaaS product, add server-owned authentication, durable database storage, server-side authorization, AI credential proxying, rate limits, audit logs, and recovery flows.
