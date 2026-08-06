/* =========================================================
   sw.js – Service Worker: legt alle Dateien lokal ab,
   damit das Spiel ohne Internetverbindung startet.
   ========================================================= */
var CACHE = 'td2026-v1';

var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/style.css',
  './js/utils.js',
  './js/audio.js',
  './js/config.js',
  './js/maps.js',
  './js/waves.js',
  './js/entities.js',
  './js/render.js',
  './js/ui.js',
  './js/game.js',
  './js/main.js'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Cache-first: offline sofort verfügbar, Netz nur als Rückfallebene. */
self.addEventListener('fetch', function (ev) {
  if (ev.request.method !== 'GET') return;

  ev.respondWith(
    caches.match(ev.request).then(function (hit) {
      if (hit) return hit;
      return fetch(ev.request).then(function (res) {
        // Erfolgreiche Antworten gleicher Herkunft nachträglich ablegen
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(ev.request, copy); });
        }
        return res;
      }).catch(function () {
        // Bei Navigationsanfragen die Startseite ausliefern
        if (ev.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
