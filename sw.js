const CACHE_VERSION = 'xxsg-v3.0.28';
const APP_SHELL = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './help.html',
  './data-sync.html',
  './restore-page.html',
  './forgot-password.html',
  './privacy.html',
  './terms.html',
  './style-blue.css',
  './world-class-design-system.css',
  './css/app-feature-sections.css',
  './css/app-dashboard-sections.css',
  './css/app-productivity-sections.css',
  './css/quadrant-view-modes.css',
  './css/time-tracker.css',
  './css/countdown-page.css',
  './css/review-modern.css',
  './css/review-textarea-resize.css',
  './css/calm-feature-pages.css',
  './css/fortune-pomodoro-pages.css',
  './css/account-center.css',
  './css/notification-settings.css',
  './css/dashboard-modern.css',
  './css/login-page.css',
  './feature-views-styles.css',
  './more-features-styles.css',
  './habit-tracker-integrated.css',
  './calendar-sync-tasks.css',
  './decomposition-settings.css',
  './task-decomposition-modal.css',
  './template-styles.css',
  './avatar-change-modal.css',
  './js/session-sanitize-boot.js',
  './js/indexeddb-storage.js',
  './js/task-title-cleaner.js',
  './js/login-page.js',
  './js/telemetry-service.js',
  './js/monthly-local-backup.js',
  './js/time-train-view.js',
  './src/core/security.js',
  './src/core/secure-storage.js',
  './src/core/logger.js',
  './script.js',
  './api-client.js',
  './manifest.json',
  './partials/app-feature-views.html',
  './js/user-storage.js',
  './js/register-page.js',
  './js/session-storage.js',
  './js/admin-storage.js',
  './js/data-sync-storage.js',
  './js/task-storage.js',
  './js/calendar-event-storage.js',
  './js/settings-storage.js',
  './js/productivity-storage.js',
  './js/pomodoro-storage.js',
  './js/time-tracker-storage.js',
  './js/ai-assistant-storage.js',
  './js/safe-logger.js',
  './js/ai-core.js',
  './js/settings-avatar-core.js',
  './js/fortune-core.js',
  './js/pomodoro-habit-core.js',
  './js/pwa-update-core.js',
  './js/i18n-dictionary-core.js',
  './js/review-system-core.js',
  './js/app-resilience-core.js',
  './js/static-translation-core.js',
  './js/language-update-core.js',
  './js/task-sortable-core.js',
  './js/api-sync-ui-core.js',
  './js/dashboard-card-core.js',
  './js/view-switch-core.js',
  './js/app-feature-view-loader.js',
  './js/restore-preview-core.js',
  './js/search-dialog-core.js',
  './js/backup-recovery-core.js',
  './js/export-feature-core.js',
  './js/notification-system.js',
  './js/task-template-system.js',
  './js/countdown-system.js',
  './js/habit-tracker-app.js',
  './js/time-tracker-system.js',
  './js/calendar-module.js',
  './js/permission-manager.js',
  './js/smart-reminder-system.js',
  './js/smart-schedule-system.js',
  './js/task-decomposition-system.js',
  './js/smart-health-system.js',
  './js/reward-support.js',
  './i18n-auto.js',
  './calendar-sync-tasks.js',
  './js/page-event-bindings.js',
  './quadrant-calendar-sync.js',
  './js/api-sync-bootstrap.js',
  './assets/images/reward-wechat.png',
  './logo.svg',
  './logo-icon.svg',
  './logo-text.svg',
  './logo-text-dark.svg',
  './favicon.svg',
  './assets/codex-floral-a.mp4'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('xxsg-') && key !== CACHE_VERSION)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/\/(?:api|backups)\//.test(url.pathname) || request.headers.has('Authorization')) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_VERSION)
            .then(cache => cache.put(request, copy))
            .catch(() => {}));
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_VERSION);
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return (await cache.match('./index.html')) || Response.error();
        }
        return Response.error();
      })
  );
});
