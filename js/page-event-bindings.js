(function () {
    'use strict';

    function resolveGlobalFunction(path) {
        if (!path) return null;

        if (path.startsWith('habitTrackerApp.')) {
            const method = path.slice('habitTrackerApp.'.length);
            const app = typeof initHabitTrackerApp === 'function'
                ? initHabitTrackerApp()
                : null;
            return app && typeof app[method] === 'function'
                ? app[method].bind(app)
                : null;
        }

        if (path === 'showAddHabitModal') {
            return typeof initHabitTrackerApp === 'function'
                ? () => initHabitTrackerApp()?.openModal?.()
                : null;
        }

        if (path === 'reviewSystem.cancelMoodSelection') {
            return typeof reviewSystem !== 'undefined' && reviewSystem
                && typeof reviewSystem.cancelMoodSelection === 'function'
                ? reviewSystem.cancelMoodSelection.bind(reviewSystem)
                : null;
        }

        return path.split('.').reduce((target, key) => {
            if (!target) return null;
            return target[key];
        }, window);
    }

    function buildArgs(element, event) {
        if (element.dataset.pageValue === 'this.value') {
            return [element.value];
        }

        if (Object.prototype.hasOwnProperty.call(element.dataset, 'pageArg')) {
            return [element.dataset.pageArg];
        }

        return [];
    }

    function runPageAction(element, event, actionName) {
        const handler = resolveGlobalFunction(actionName);
        if (typeof handler !== 'function') {
            if (typeof ensureVisualizationChartsLoaded === 'function'
                && ['refreshAllCharts', 'exportAllCharts', 'toggleTaskCompletion', 'updateEfficiencyChart', 'updateDistributionChart'].includes(actionName)) {
                ensureVisualizationChartsLoaded(() => {
                    const loadedHandler = resolveGlobalFunction(actionName);
                    if (typeof loadedHandler === 'function') {
                        loadedHandler(...buildArgs(element, event));
                    }
                });
                return;
            }

            console.warn('[page-event-bindings] Missing handler:', actionName);
            return;
        }

        if (element.dataset.pageStop === 'true') {
            event.stopPropagation();
        }

        handler(...buildArgs(element, event));
    }

    document.addEventListener('click', event => {
        const actionElement = event.target.closest('[data-page-click]');
        if (!actionElement) return;

        runPageAction(actionElement, event, actionElement.dataset.pageClick);
    });

    document.addEventListener('change', event => {
        const actionElement = event.target.closest('[data-page-change]');
        if (!actionElement) return;

        runPageAction(actionElement, event, actionElement.dataset.pageChange);
    });
})();
