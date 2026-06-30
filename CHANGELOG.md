# Changelog

All notable changes to XXSG OpenSource will be documented in this file.

The project follows pragmatic release notes rather than strict semantic versioning while it is still being prepared as a local-first open-source application.

## [Unreleased]

### Documentation

- Clarified that Daily Fortune AI and AI task analysis share the same admin AI configuration.
- Documented the currently supported API keys for both AI features: DeepSeek / OpenAI / Claude / Kimi / Qwen / GLM/Z.ai / MiniMax.
- Aligned help page wording with the current admin API Key configuration flow.

### Added

- Expanded AI task analysis providers to DeepSeek, OpenAI, Claude, Kimi, Qwen, GLM/Z.ai, and MiniMax.
- Expanded Daily Fortune AI to use the shared multi-provider AI service configuration.
- Added Anthropic Messages protocol support for Claude alongside OpenAI-compatible chat completions providers.

### Changed

- Renamed the admin "AI 签语配置" entry to "AI 配置" because the page now manages both Daily Fortune AI and AI service capabilities.
- Reordered the admin AI configuration page to show service configuration before status, actions, and Daily Fortune AI switches.
- Consolidated the AI configuration page into one visible save action that saves the selected service API Key and Daily Fortune AI switches together.

## [v1.0.2] - 2026-06-28

### Added

- Credential write regression check to block direct plaintext password writes in CI.
- README quick-start visual for local registration, admin initialization, BYOK AI configuration, and SaaS boundaries.

### Fixed

- Password reset, profile password change, admin user editing, and admin password change now write hashed credentials when the security module is available.
- Admin password change now verifies hashed local admin credentials instead of comparing the stored hash as plaintext.
- Removed the remaining `index.html` HTML-string insertion and inline click handler from the local backup notice.

## [v1.0.1] - 2026-06-26

### Added

- Quick-start entry table in README for demo, login, admin initialization, and BYOK AI configuration.
- GitHub Pages demo link in README.
- Local self-registration flow for the open-source build.
- Dedicated `register.html` page for local account creation.
- Open-source first-use guidance on the login page.
- SEO/social metadata for the main entry and login page.
- Local admin initialization status notice and reset action on the admin login form.
- Password visibility toggles on login, admin login, and local registration password fields.

### Changed

- Replaced “contact administrator” onboarding with local-first account creation guidance.
- Separated login and registration views so account login, admin login, and registration no longer appear together.
- Clarified that ordinary users can create a browser-local account without contacting the project maintainer.
- Aligned admin-created users and self-registered users to password-hash storage.
- Clarified initialized vs uninitialized local admin behavior.

### Fixed

- Removed stale references to missing security helper scripts from HTML entry points.
- Fixed a malformed nested script tag in `index.html`.
- Fixed hashed local user login fallback when `secureUserLogin` is not provided.
- Fixed local admin login so hashed-password verification still requires username `admin`.

## [v1.0.0-local-first] - 2026-06-26

### Added

- First formal open-source baseline release.
- Local-first positioning and BYOK AI boundary.
- MIT license.
- GitHub Actions CI.
- First-use guide, deployment guide, contribution guide, and security policy.
- GitHub issue templates and pull request template.
- Admin dashboard preview image in README.

### Changed

- Removed public default admin password behavior.
- First admin login initializes the local admin password.
- Disabled automatic demo/test user creation for open-source builds.
- Replaced fixed verification-code behavior with session-scoped random codes.
- Protected `/api/stats` behind `STATS_ADMIN_KEY`.

### Verified

- `npm run check`
- `npm run audit:project`
- Local first-use admin initialization smoke test.
- Sensitive string scan for known default credentials and API-key-like values.

### Known limits

- Data is stored in browser local storage by default.
- AI provider keys are browser-side in the local-first BYOK release.
- This release is not a complete public multi-tenant SaaS.

[v1.0.0-local-first]: https://github.com/wangyuanhao666/XXSG-OpenSource/releases/tag/v1.0.0-local-first
[v1.0.1]: https://github.com/wangyuanhao666/XXSG-OpenSource/releases/tag/v1.0.1
[v1.0.2]: https://github.com/wangyuanhao666/XXSG-OpenSource/releases/tag/v1.0.2
