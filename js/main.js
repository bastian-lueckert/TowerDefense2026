/* =========================================================
   main.js – Startpunkt
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD;

  function boot() {
    var canvas = document.getElementById('game');

    TD.ui.init();
    TD.game.init(canvas);

    // Erste Nutzergeste entsperrt die Tonausgabe (Autoplay-Richtlinien)
    var unlock = function () {
      TD.audio.unlock();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);

    // Beim Wegwechseln automatisch pausieren
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && TD.game.state === 'playing' && !TD.game.paused) {
        TD.game.togglePause();
      }
    });

    // Doppeltipp-Zoom auf Mobilgeräten unterbinden
    var lastTouch = 0;
    document.addEventListener('touchend', function (ev) {
      var now = Date.now();
      if (now - lastTouch <= 320) ev.preventDefault();
      lastTouch = now;
    }, { passive: false });

    // Wischgesten / Überscrollen auf dem Spielfeld verhindern
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

    registerServiceWorker();
  }

  /**
   * Service Worker für den Offline-Betrieb.
   * Nur über http(s) möglich – beim Öffnen per file:// wird er
   * übersprungen; das Spiel läuft dann trotzdem vollständig,
   * weil alle Dateien lokal liegen.
   */
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
    // Mit ?nosw in der Adresse bleibt der Cache aus (praktisch beim Weiterentwickeln)
    if (/[?&]nosw\b/.test(location.search)) return;
    try {
      navigator.serviceWorker.register('sw.js').catch(function () { /* still ignorieren */ });
    } catch (e) { /* nicht kritisch */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
