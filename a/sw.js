const CACHE_NAME = 'math-practice-v2';
const ASSETS = [
  './',
  './index.html',
  './icon-192.png',
  './manifest.json'
];

// 安装：预缓存核心资源
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 激活：清理旧版本缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 请求拦截：网络优先，缓存回退
self.addEventListener('fetch', e => {
  e.respondWith(
    // HTML 文件始终走网络，确保拿到最新版
    if (e.request.mode === 'navigate' || e.request.url.endsWith('.html')) {
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    }

    // 其他资源：网络优先，离线回退缓存
    return fetch(e.request).then(response => {
      if (response.ok && e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return response;
    }).catch(() => caches.match(e.request));
  );
});
