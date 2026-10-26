// 이전 PWA 등록을 해제하기 위해 기존 서비스 워커 URL에 잠시 유지한다.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const scope = self.registration.scope;
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('workbox-') && key.endsWith(scope))
      .map(key => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map(client => client.navigate(client.url)));
  })());
});
