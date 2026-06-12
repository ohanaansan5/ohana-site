// OHANA Service Worker — кэширует сайт для быстрой загрузки
const CACHE = 'ohana-v1';
const OFFLINE_URL = '/';

// При установке — кэшируем основные файлы
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => 
      cache.addAll(['/', '/ohana_kitchen.html'])
        .catch(() => cache.add('/'))
    )
  );
  self.skipWaiting();
});

// При активации — удаляем старый кэш
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// При запросах — сначала сеть, потом кэш
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  if(e.request.url.includes('supabase') || e.request.url.includes('railway')) return;
  
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/')))
  );
});

// Push уведомления
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || '🌺 OHANA', {
      body: data.body || 'Новое уведомление',
      icon: '/manifest.json',
      badge: '/manifest.json',
      data: data.url || '/'
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data || '/'));
});
