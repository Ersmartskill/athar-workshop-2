 'use strict';
const VERSION = '__ATHAR_BUILD__';
const ROOT = new URL('./', self.location.href);
const PREFIX = `athar:${ROOT.pathname}:`;
const CACHE = PREFIX + VERSION;
const FILES = ['./','./index.html','./about.html','./offline.html','./styles.css','./data.js','./app.js','./pwa.js','./manifest.webmanifest','./assets/favicon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/icon-maskable.png','./assets/apple-touch-icon.png'];
const SHELL = new Set(FILES.map(file => new URL(file, ROOT).href));
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(new URL(file, ROOT), {cache:'reload'}))))); });
self.addEventListener('activate', event => { event.waitUntil((async () => {
 for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
 await self.clients.claim();
})()); });
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
 const request = event.request, url = new URL(request.url);
 if (request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
 const clean = new URL(url); clean.search = ''; clean.hash = '';
 if (request.mode === 'navigate') {
  event.respondWith((async () => {
   const cache = await caches.open(CACHE);
   try { const response = await fetch(request); if (response.ok && SHELL.has(clean.href)) await cache.put(clean.href, response.clone()); return response; }
   catch { return await cache.match(clean.href) || await cache.match(new URL('./offline.html', ROOT).href); }
  })());
 } else if (SHELL.has(clean.href)) {
  event.respondWith((async () => {
   const cache = await caches.open(CACHE), saved = await cache.match(clean.href);
   if (saved) return saved;
   const response = await fetch(request); if (response.ok) await cache.put(clean.href, response.clone()); return response;
  })());
 }
});
