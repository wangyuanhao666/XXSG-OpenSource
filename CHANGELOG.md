# Changelog

All notable changes to XXSG OpenSource will be documented in this file.

The project follows pragmatic release notes rather than strict semantic versioning while it is still being prepared as a local-first open-source application.

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
