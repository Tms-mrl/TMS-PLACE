// Service worker mínimo: no cachea nada (el panel vive de la API, cachear
// rompería datos). Solo existe para que Chrome/Android consideren la app
// "instalable" y disparen beforeinstallprompt.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
