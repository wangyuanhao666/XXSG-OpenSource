// Enables optional API synchronization after the app shell is ready.
(function () {
    window.addEventListener('load', function () {
        const storage = window.DataSyncStorage;
        const enableAPISync = storage ? storage.getRaw('enableAPISync') : null;

        if (enableAPISync === 'true' && typeof window.TaskAPIClient !== 'undefined') {
            const apiClient = new window.TaskAPIClient();

            setTimeout(function () {
                apiClient.testConnection().then(function (connected) {
                    if (connected) {
                        const rawInterval = storage ? storage.getRaw('apiSyncInterval') : null;
                        const syncInterval = parseInt(rawInterval || '60000', 10);
                        apiClient.startAutoSync(syncInterval);
                    }
                });
            }, 2000);
        }
    });
})();
