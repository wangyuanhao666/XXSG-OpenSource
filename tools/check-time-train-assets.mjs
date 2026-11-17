import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8');
const requireFile = (relativePath) => {
    const directory = dirname(join(root, relativePath));
    const filename = relativePath.split('/').at(-1);
    assert.ok(existsSync(directory) && readdirSync(directory).includes(filename), `Missing release asset: ${relativePath}`);
};

const featureViews = read('partials/app-feature-views.html');
const iframePath = featureViews.match(/id="time-train-frame"[^>]*data-src="([^"?]+)/)?.[1];
assert.ok(iframePath, 'Time train iframe source is missing');
requireFile(iframePath);

const frameHtml = read(iframePath);
const frameDirectory = dirname(iframePath);
for (const [, asset] of frameHtml.matchAll(/(?:href|src)="\.\/([^"?]+)"/g)) {
    requireFile(join(frameDirectory, asset).replaceAll('\\', '/'));
}

const journeyScript = read(join(frameDirectory, 'journey-prototype.js'));
const stationImages = [...journeyScript.matchAll(/image:\s*'([^']+)'/g)].map(match => match[1]);
assert.ok(stationImages.length > 0, 'Time train station images are missing');
stationImages.forEach(image => requireFile(`${frameDirectory}/scenes/${image}`));

const appScript = read('script.js');
const chartPath = appScript.match(/script\.src = '(visualization-charts\.js)(?:\?[^']*)?'/)?.[1];
assert.ok(chartPath, 'Visualization charts module source is missing');
requireFile(chartPath);

const cacheManifest = read('sw.js');
for (const asset of [iframePath, `${frameDirectory}/journey-prototype.js`, `${frameDirectory}/journey-prototype.css`, chartPath]) {
    assert.ok(cacheManifest.includes(`'./${asset}'`), `Missing service worker cache entry: ${asset}`);
}

console.log(`Feature assets available: time train page, ${stationImages.length} station images, and visualization charts.`);
