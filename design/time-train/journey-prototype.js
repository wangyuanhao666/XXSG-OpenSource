(() => {
  'use strict';
  if (new URLSearchParams(location.search).has('embedded')) document.documentElement.classList.add('embedded');

  const stations = [
    { name: '杭州东', region: '杭州 · 浙江', image: 'hangzhou-east.webp', scene: '从杭州出发，城市的屋顶和水岸在窗外缓缓退后。今天的旅程，先从这一眼开始。' },
    { name: '富阳', region: '富春江沿岸 · 浙江', image: 'fuyang.webp', scene: '来到富阳，富春江的水色铺开了视线。车窗边的时间慢下来，适合把这一站的细节记住。' },
    { name: '桐庐', region: '富春江山水 · 浙江', image: 'tonglu.webp', scene: '桐庐的山水逐渐清晰，河流在层层青山之间转弯。今天可以把目光留给一段安静的水面。' },
    { name: '建德', region: '新安江沿岸 · 浙江', image: 'jiande.webp', scene: '建德这一站，新安江与山谷相伴。窗外的雾气轻轻散开，一天也有了自己的开场。' },
    { name: '千岛湖', region: '湖山之间 · 浙江', image: 'qiandaohu.webp', scene: '来到千岛湖，远处的岛屿一层层浮在水上。今天的风景不着急讲完，慢慢看就好。' },
    { name: '三阳', region: '皖南山谷 · 安徽', image: 'sanyang.webp', scene: '列车进入皖南山谷。三阳这一站，山坡、溪流和村落让旅程换了一种颜色。' },
    { name: '绩溪北', region: '徽州山地 · 安徽', image: 'jixi-north.webp', scene: '到绩溪北，山岭与田野交错。沿途经过的地方各有模样，今天也值得留下一行记录。' },
    { name: '歙县北', region: '徽州村落 · 安徽', image: 'sheixian-north.webp', scene: '歙县北的周边有徽州村落与山水。把窗外当作一页画，今天想记住什么，由你来写。' },
    { name: '黄山北', region: '黄山脚下 · 安徽', image: 'huangshan-north.webp', scene: '来到黄山北，这段旅程走到了终点。山还在远处，手账里的每一站已经连成了路。' }
  ];
  // In the app, keep each signed-in person's journey and notes separate.
  const appUser = window.parent !== window ? window.parent.SessionStorage?.getCurrentUser?.() : null;
  const scope = appUser ? `user.${encodeURIComponent(String(appUser.id || appUser.username))}` : 'preview';
  const anchorKey = `time-train.${scope}.start-day.v1`;
  const dayKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dayNumber = (key) => {
    const [year, month, day] = key.split('-').map(Number);
    return Date.UTC(year, month - 1, day) / 86400000;
  };
  const $ = (id) => document.getElementById(id);
  const today = new Date();
  const todayKey = dayKey(today);
  let anchor = localStorage.getItem(anchorKey);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor || '') || dayNumber(anchor) > dayNumber(todayKey)) {
    anchor = todayKey;
    localStorage.setItem(anchorKey, anchor);
  }
  const journeyDay = Math.max(0, dayNumber(todayKey) - dayNumber(anchor));
  const journeyRound = Math.floor(journeyDay / stations.length);
  const stationIndex = journeyDay % stations.length;
  const station = stations[stationIndex];
  const noteKey = `time-train.${scope}.note.${todayKey}`;

  function timeOfDay(hour) {
    if (hour < 6 || hour >= 20) return { className: 'time-night', label: '夜色' };
    if (hour < 10) return { className: 'time-morning', label: '晨光' };
    if (hour < 17) return { className: 'time-day', label: '日光' };
    return { className: 'time-evening', label: '暮色' };
  }

  const journeyWindow = $('journey-window');
  journeyWindow.style.backgroundImage = `url("./scenes/${station.image}")`;
  journeyWindow.dataset.sceneSource = 'local';
  const manifestUrl = 'https://wangyuanhao666.github.io/XXSG-TimeTrain-Images/manifest.json';
  async function loadHostedScene() {
    try {
      const response = await fetch(manifestUrl, { cache: 'no-cache' });
      if (!response.ok) return;
      const manifest = await response.json();
      const scenes = manifest.schemaVersion === 1 && manifest.stations?.[station.image.replace('.webp', '')];
      if (!Array.isArray(scenes) || scenes.length === 0) return;
      const choice = scenes[journeyRound % (scenes.length + 1)];
      if (!choice || typeof choice.file !== 'string' || !/^scenes\/[a-z0-9-]+\.webp$/.test(choice.file)) return;
      const imageUrl = new URL(choice.file, manifestUrl);
      if (imageUrl.origin !== new URL(manifestUrl).origin) return;
      const image = new Image();
      image.onload = () => {
        journeyWindow.style.backgroundImage = `url("${imageUrl.href}")`;
        journeyWindow.dataset.sceneSource = 'hosted';
        if (typeof choice.alt === 'string') journeyWindow.setAttribute('aria-label', choice.alt);
      };
      image.src = imageUrl.href;
    } catch { /* Offline or unavailable image library: keep the bundled illustration. */ }
  }
  if (!new URLSearchParams(location.search).has('preview-only')) loadHostedScene();
  $('ticket-kicker').textContent = `今日车票 · 第 ${String(stationIndex + 1).padStart(2, '0')} 站 · 第 ${journeyRound + 1} 程`;
  $('ticket-name').textContent = station.name;
  $('ticket-desc').textContent = station.region;
  $('ticket-date').textContent = `${today.getMonth() + 1}月${today.getDate()}日 · 出发`;
  $('today-ticket').setAttribute('aria-label', `今日车票，${station.name}站`);
  $('route-origin').textContent = stationIndex === 0 ? (journeyRound ? '新一程 · 今日始发' : '今日始发') : '杭州东';
  $('route-today').textContent = `${station.name} · 今天`;
  $('route-future').textContent = stationIndex === stations.length - 1 ? '下一程 · 明日从杭州东出发' : '下一站 · 明日揭晓';
  $('journal-date').textContent = `${todayKey.replaceAll('-', '.')} · 杭黄线`;
  $('journal-title').textContent = `今日抵达 · ${station.name}`;
  $('journal-narration').textContent = station.scene;
  $('journal-note').value = localStorage.getItem(noteKey) || '';

  function refreshLight() {
    const { className, label } = timeOfDay(new Date().getHours());
    $('journey-window').classList.remove('time-night', 'time-morning', 'time-day', 'time-evening');
    $('journey-window').classList.add(className);
    $('window-label').textContent = `杭黄线 · 今日窗外`;
    $('light-caption').textContent = `此刻 · ${label}`;
  }
  refreshLight();
  window.setInterval(refreshLight, 60000);

  const journal = $('journal-dialog');
  $('open-journal').addEventListener('click', () => journal.showModal());
  $('open-journal-below').addEventListener('click', () => journal.showModal());
  $('close-journal').addEventListener('click', () => journal.close());
  journal.addEventListener('click', (event) => { if (event.target === journal) journal.close(); });
  $('journal-note').addEventListener('input', (event) => {
    localStorage.setItem(noteKey, event.target.value);
    $('save-status').textContent = '已保存在本机';
  });
})();
