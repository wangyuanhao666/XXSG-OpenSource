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
  const grandStations = [
    { id: 'hangzhou-east', name: '杭州东', region: '浙江 · 杭州东', scene: '回到杭州，沿着熟悉的水岸开启中国漫游。今天，新的旅程从这里出发。' },
    { id: 'china-fuzhou', name: '福州', region: '福建 · 福州', scene: '闽江从榕树下流过，福州的屋顶与青山在水边展开。' },
    { id: 'china-taipei', name: '台北', region: '台湾 · 台北', scene: '在台北的山城之间，看城市与远山一同沐浴晨光。', virtual: true },
    { id: 'china-guangzhou', name: '广州', region: '广东 · 广州', scene: '珠江缓缓穿过广州，亚热带树影与城市天际线相映。' },
    { id: 'china-hong-kong-west-kowloon', name: '香港西九龙', region: '香港 · 香港西九龙', scene: '维多利亚港的水光映着高楼与山坡，香港的节奏尽在这一眼。' },
    { id: 'china-macau', name: '澳门', region: '澳门 · 澳门', scene: '走进澳门的老城街巷，彩色骑楼与海风留住午后。', virtual: true },
    { id: 'china-haikou', name: '海口', region: '海南 · 海口', scene: '海口的椰林沿着海岸舒展，南海的光把今天照得明亮。' },
    { id: 'china-nanning', name: '南宁', region: '广西 · 南宁', scene: '邕江弯过绿意葱茏的山丘，南宁的风景慢慢铺开。' },
    { id: 'china-guiyang', name: '贵阳', region: '贵州 · 贵阳', scene: '黔中山地环抱贵阳，云雾间的楼阁与河水交错。' },
    { id: 'china-kunming', name: '昆明', region: '云南 · 昆明', scene: '滇池的宽阔水面映着远山，昆明的花树点亮岸边。' },
    { id: 'china-chengdu', name: '成都', region: '四川 · 成都', scene: '竹林、水岸与悠闲的成都平原相伴，适合慢下来。' },
    { id: 'china-chongqing', name: '重庆', region: '重庆 · 重庆', scene: '两江在山城脚下相遇，层叠的街巷一直延伸到天际。' },
    { id: 'china-lhasa', name: '拉萨', region: '西藏 · 拉萨', scene: '拉萨的高原天空下，山谷与布达拉宫的轮廓相望。' },
    { id: 'china-xining', name: '西宁', region: '青海 · 西宁', scene: '西宁周围的高原河谷开阔明朗，远处雪山静静相伴。' },
    { id: 'china-urumqi', name: '乌鲁木齐', region: '新疆 · 乌鲁木齐', scene: '天山雪峰守望乌鲁木齐，白杨树与长空陪伴这一站。' },
    { id: 'china-lanzhou', name: '兰州', region: '甘肃 · 兰州', scene: '黄河穿过兰州狭长的城市，山色与桥影相连。' },
    { id: 'china-yinchuan', name: '银川', region: '宁夏 · 银川', scene: '贺兰山下的银川平原，水渠、白杨和田野铺向远方。' },
    { id: 'china-xian', name: '西安', region: '陕西 · 西安', scene: '西安城墙与古老城门迎着夕光，把时间留在街巷之间。' },
    { id: 'china-hohhot', name: '呼和浩特', region: '内蒙古 · 呼和浩特', scene: '呼和浩特城外草原辽阔，低山和云影在远处起伏。' },
    { id: 'china-taiyuan', name: '太原', region: '山西 · 太原', scene: '汾河沿岸树影轻摇，太原的城景与山地在水边相遇。' },
    { id: 'china-shijiazhuang', name: '石家庄', region: '河北 · 石家庄', scene: '正定古城与太行山麓相望，石家庄周边也有悠长的历史。' },
    { id: 'china-beijing', name: '北京', region: '北京 · 北京', scene: '北京的古老屋顶与林荫街道，在层层城景中静静延伸。' },
    { id: 'china-tianjin', name: '天津', region: '天津 · 天津', scene: '海河上的桥与两岸建筑相映，天津的河风轻轻吹来。' },
    { id: 'china-shenyang', name: '沈阳', region: '辽宁 · 沈阳', scene: '浑河流经沈阳，北方的林荫大道与城景一路展开。' },
    { id: 'china-changchun', name: '长春', region: '吉林 · 长春', scene: '长春的树荫与开阔平原相接，街道尽头有柔和的天光。' },
    { id: 'china-harbin', name: '哈尔滨', region: '黑龙江 · 哈尔滨', scene: '松花江边落满了雪，哈尔滨的冬日建筑显得格外温暖。' },
    { id: 'china-jinan', name: '济南', region: '山东 · 济南', scene: '济南的泉水在柳树下流淌，城中一隅也像一幅清凉的画。' },
    { id: 'china-zhengzhou', name: '郑州', region: '河南 · 郑州', scene: '黄河经过中原大地，郑州的平原在河岸外延展开。' },
    { id: 'china-wuhan', name: '武汉', region: '湖北 · 武汉', scene: '长江大桥横跨水面，武汉的江岸与楼阁在春光里相会。' },
    { id: 'china-changsha', name: '长沙', region: '湖南 · 长沙', scene: '湘江绕过橘子洲，长沙的树影与城市一起映在水面。' },
    { id: 'china-nanchang', name: '南昌', region: '江西 · 南昌', scene: '赣江沿着南昌的城市流过，绿岸与远处楼阁相互呼应。' },
    { id: 'china-hefei', name: '合肥', region: '安徽 · 合肥', scene: '巢湖水面开阔，合肥的绿岸与城市在远处相接。' },
    { id: 'china-nanjing', name: '南京', region: '江苏 · 南京', scene: '秦淮河上的石桥和黛瓦老屋，把南京的故事留在水边。' },
    { id: 'china-shanghai-hongqiao', name: '上海虹桥', region: '上海 · 上海虹桥', scene: '黄浦江映着外滩与城市天际线，上海的傍晚亮起柔和光芒。' }
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
  const onGrandTour = journeyDay >= stations.length;
  const grandDay = journeyDay - stations.length;
  const route = onGrandTour ? grandStations : stations;
  const journeyRound = onGrandTour ? Math.floor(grandDay / grandStations.length) + 1 : 0;
  const stationIndex = onGrandTour ? grandDay % grandStations.length : journeyDay;
  const station = route[stationIndex];
  const localImage = onGrandTour ? 'china-generic.webp' : station.image;
  const sceneId = onGrandTour ? station.id : station.image.replace('.webp', '');
  const noteKey = `time-train.${scope}.note.${todayKey}`;

  function timeOfDay(hour) {
    if (hour < 6 || hour >= 20) return { className: 'time-night', label: '夜色' };
    if (hour < 10) return { className: 'time-morning', label: '晨光' };
    if (hour < 17) return { className: 'time-day', label: '日光' };
    return { className: 'time-evening', label: '暮色' };
  }

  const journeyWindow = $('journey-window');
  journeyWindow.style.backgroundImage = `url("./scenes/${localImage}")`;
  journeyWindow.dataset.sceneSource = 'local';
  const manifestUrl = 'https://wangyuanhao666.github.io/XXSG-TimeTrain-Images/manifest.json';
  async function loadHostedScene() {
    try {
      const response = await fetch(manifestUrl, { cache: 'no-cache' });
      if (!response.ok) return;
      const manifest = await response.json();
      const scenes = manifest.schemaVersion === 1 && manifest.stations?.[sceneId];
      if (!Array.isArray(scenes) || scenes.length === 0) return;
      const choice = scenes[onGrandTour ? (journeyRound - 1) % scenes.length : 0];
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
  $('ticket-desc').textContent = station.virtual ? `${station.region} · 主题漫游` : station.region;
  $('ticket-date').textContent = `${today.getMonth() + 1}月${today.getDate()}日 · 出发`;
  $('today-ticket').setAttribute('aria-label', `今日车票，${station.name}站`);
  $('route-origin').textContent = stationIndex === 0 ? (onGrandTour ? '新一程 · 今日始发' : '今日始发') : '杭州东';
  $('route-today').textContent = `${station.name} · 今天${station.virtual ? '（主题漫游）' : ''}`;
  $('route-future').textContent = stationIndex === route.length - 1 ? '下一程 · 明日从杭州东出发' : (onGrandTour ? `下一站 · ${route[stationIndex + 1].name}` : '下一站 · 明日揭晓');
  $('journal-date').textContent = `${todayKey.replaceAll('-', '.')} · ${onGrandTour ? '中国漫游' : '杭黄线'}`;
  $('journal-title').textContent = `今日抵达 · ${station.name}`;
  $('journal-narration').textContent = station.scene;
  $('journal-note').value = localStorage.getItem(noteKey) || '';

  function refreshLight() {
    const { className, label } = timeOfDay(new Date().getHours());
    $('journey-window').classList.remove('time-night', 'time-morning', 'time-day', 'time-evening');
    $('journey-window').classList.add(className);
    $('window-label').textContent = `${onGrandTour ? '中国漫游' : '杭黄线'} · 今日窗外`;
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
