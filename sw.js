/* =========================================================
   sw.js – Service Worker: legt alle Dateien lokal ab,
   damit das Spiel ohne Internetverbindung startet.
   ========================================================= */
var CACHE = 'td2026-v14';

var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/style.css',
  './js/utils.js',
  './js/music.js',
  './js/audio.js',
  './js/factions.js',
  './js/lore.js',
  './js/lore-medieval.js',
  './js/lore-viking.js',
  './js/lore-roman.js',
  './js/lore-egyptian.js',
  './js/lore-japan.js',
  './js/characters.js',
  './js/scenes.js',
  './js/titlescreen.js',
  './js/celebrate.js',
  './js/config.js',
  './js/campaign.js',
  './js/progress.js',
  './js/maps.js',
  './js/waves.js',
  './js/entities.js',
  './js/render.js',
  './js/viewport.js',
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

/* Aus dem Cache ausliefern (sofort und offline verfügbar) und die Datei
   parallel im Hintergrund erneuern. So startet das Spiel ohne Netz und
   holt sich Änderungen trotzdem von allein – spätestens beim nächsten
   Start läuft die neue Fassung. */
self.addEventListener('fetch', function (ev) {
  if (ev.request.method !== 'GET') return;
  if (new URL(ev.request.url).origin !== self.location.origin) return;

  ev.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(ev.request).then(function (hit) {

        var fromNet = fetch(ev.request).then(function (res) {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(ev.request, res.clone());
          }
          return res;
        }).catch(function () { return null; });

        if (hit) {
          ev.waitUntil(fromNet);      // Aktualisierung darf den Worker überleben
          return hit;
        }

        return fromNet.then(function (res) {
          if (res) return res;
          if (ev.request.mode === 'navigate') return cache.match('./index.html');
          return new Response('', { status: 504, statusText: 'Offline' });
        });
      });
    })
  );
});
