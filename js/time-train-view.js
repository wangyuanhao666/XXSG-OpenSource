// Keep the illustrated journey isolated from the application's global styles.
function initTimeTrainView() {
    const frame = document.getElementById('time-train-frame');
    if (!frame) return;

    function fitFrame() {
        try {
            const content = frame.contentDocument;
            const windowEl = content?.getElementById('journey-window');
            if (windowEl) {
                // Use the app viewport for vh-based scenes. The iframe's own height
                // depends on its content, so vh inside it creates a feedback loop.
                if (frame.clientWidth <= 570) {
                    windowEl.style.height = `${Math.max(430, Math.round(window.innerHeight * 0.7))}px`;
                } else if (frame.clientWidth > 900) {
                    windowEl.style.height = `${Math.min(510, Math.max(330, Math.round(window.innerHeight * 0.52)))}px`;
                } else {
                    windowEl.style.removeProperty('height');
                }
            }
            const documentHeight = content?.documentElement?.scrollHeight || 0;
            if (documentHeight && frame.style.height !== `${documentHeight}px`) {
                frame.style.height = `${documentHeight}px`;
            }
        } catch (error) {
            // The view stays usable with its minimum height if a browser blocks measurement.
        }
    }

    if (!frame.dataset.initialized) {
        frame.dataset.initialized = 'true';
        // Observing the iframe document while changing its viewport height
        // creates a resize feedback loop in Chromium.
        frame.addEventListener('load', () => {
            fitFrame();
            requestAnimationFrame(fitFrame);
            frame.contentDocument?.fonts?.ready.then(() => requestAnimationFrame(fitFrame));
        });
        window.addEventListener('resize', fitFrame);
    }

    if (!frame.getAttribute('src')) frame.src = frame.dataset.src;
    requestAnimationFrame(fitFrame);
}
