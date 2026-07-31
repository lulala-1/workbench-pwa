// Service Worker - 个人全能工作台 PWA
const CACHE_NAME = 'workbench-v21';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192-v2.png',
  './icon-512-v2.png',
  './news.json'
];

// 安装：预缓存核心资源
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS).catch(function(){});
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 拦截请求：缓存优先，网络回退（新闻接口走网络）
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // 新闻API、外部资源走网络优先
  if (url.indexOf('/api/') >= 0 || url.indexOf('tenapi.cn') >= 0 || url.indexOf('vvhan.com') >= 0 || url.indexOf('zhihu.com') >= 0 || url.indexOf('tophub') >= 0) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  // news.json 走网络优先（确保获取最新新闻）
  if (url.indexOf('news.json') >= 0) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }
  // 本地资源：缓存优先
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(resp) {
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          var respClone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, respClone).catch(function(){});
          });
        }
        return resp;
      }).catch(function() {
        return cached;
      });
    })
  );
});
