import { readFileSync } from 'node:fs';

const html = readFileSync('login.html', 'utf8');
const css = readFileSync('css/login-page.css', 'utf8');
const js = readFileSync('js/login-page.js', 'utf8');
const serviceWorker = readFileSync('sw.js', 'utf8');

const checks = [
  {
    ok: html.includes('id="login-codex-background"') && html.includes('assets/codex-floral-a.mp4'),
    message: 'login.html should include the local Codex-style background video and canvas'
  },
  {
    ok: !html.includes('https://cdn.openai.com/ctf-cdn/floral_a.mp4'),
    message: 'login.html should not depend on the OpenAI CDN video at runtime'
  },
  {
    ok: serviceWorker.includes('./assets/codex-floral-a.mp4'),
    message: 'sw.js should cache the local Codex background video for offline use'
  },
  {
    ok: css.includes('.login-codex-video') && css.includes('.login-codex-background') && css.includes('codexGradientDrift'),
    message: 'css/login-page.css should layer the Codex video, fallback gradient, and canvas'
  },
  {
    ok: js.includes('initializeCodexLoginBackground') && js.includes('drawCodexBackgroundFrame'),
    message: 'js/login-page.js should initialize the interactive canvas trail'
  },
  {
    ok: js.includes('prefers-reduced-motion'),
    message: 'interactive background should respect reduced-motion preferences'
  },
  {
    ok: js.includes("['-', '>', 'f']") && js.includes('drawCodexGlyph'),
    message: 'interactive trail should use Codex-like glyphs, not only line segments'
  },
  {
    ok: js.includes('pointerrawupdate') && js.includes('drawCodexImmediateTrail'),
    message: 'pointer trail should use low-latency pointer events and immediate drawing'
  }
];

const failures = checks.filter(check => !check.ok);

if (failures.length > 0) {
  console.error('Codex login background check failed:');
  failures.forEach(failure => console.error(`- ${failure.message}`));
  process.exit(1);
}

console.log('Codex login background check passed.');
