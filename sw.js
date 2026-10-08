/* DailyWords PWA 离线缓存
   策略: HTML 网络优先(在线总能拿到最新版, 断网回退缓存); 其余资源缓存优先 */
const CACHE = 'dailywords-v3';
const ASSETS = ['./DailyWords.html', './manifest.json', './icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  const url = new URL(e.request.url);
  const isDoc = e.request.mode === 'navigate' || url.pathname.endsWith('DailyWords.html');

  if (isDoc) {                                       // 页面: 网络优先, 离线用缓存
    e.respondWith(
      fetch(e.request).then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return res;
      }).catch(() =>
        caches.match(e.request, { ignoreSearch: true })
          .then(h => h || caches.match('./DailyWords.html')))
    );
    return;
  }

  e.respondWith(                                     // 图标等: 缓存优先
    caches.match(e.request, { ignoreSearch: true }).then(hit =>
      hit ||
      fetch(e.request).then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, cp));
        return res;
      })
    )
  );
});
