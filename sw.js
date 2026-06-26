const CACHE_VERSION = 'xxsg-v3.0.21';
const APP_SHELL = [
  './',
  './index.html',
  './login.html',
  './register.html',
  './style-blue.css',
  './world-class-design-system.css',
  './feature-views-styles.css',
  './more-features-styles.css',
  './template-styles.css',
  './avatar-change-modal.css',
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
  './i18n-auto.js',
  './calendar-sync-tasks.js',
  './js/page-event-bindings.js',
  './quadrant-calendar-sync.js',
  './js/api-sync-bootstrap.js',
  './logo.svg',
  './logo-icon.svg',
  './logo-text.svg',
  './logo-text-dark.svg'
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
        .filter(key => key !== CACHE_VERSION)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
  );
});
