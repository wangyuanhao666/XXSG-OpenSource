// Loads non-first-screen feature views before the main SPA script initializes.
(function loadDeferredFeatureViews() {
    const anchor = document.getElementById('deferred-feature-views-anchor');
    if (!anchor) return;

    const request = new XMLHttpRequest();
    request.open('GET', 'partials/app-feature-views.html?v=1.0.0', false);

    try {
        request.send();
    } catch (error) {
        console.error('Failed to load deferred feature views:', error);
        return;
    }

    if (request.status < 200 || request.status >= 300) {
        console.error('Deferred feature views request failed:', request.status);
        return;
    }

    const doc = new DOMParser().parseFromString(request.responseText, 'text/html');
    const fragment = document.createDocumentFragment();
    Array.from(doc.body.children).forEach(node => {
        fragment.appendChild(document.importNode(node, true));
    });
    anchor.replaceWith(fragment);
})();
