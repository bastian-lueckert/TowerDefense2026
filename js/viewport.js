/* =========================================================
   viewport.js – Bildausschnitt des Spielfelds

   Auf dem Schreibtisch ist das Feld immer ganz zu sehen. Auf dem
   Handy ist es dafür zu breit: 20 Spalten auf 400 Bildpunkten
   ergeben Felder von 20 Punkten – kleiner als eine Fingerkuppe.
   Darum wird das Feld hier vergrößert und lässt sich mit zwei
   Fingern schieben und zoomen. Ein Finger bleibt fürs Spiel frei.

   Umgesetzt wird das über eine CSS-Transformation auf dem Canvas.
   Das kostet nichts (die GPU erledigt es) und – wichtig – die
   Umrechnung in game.toLogical() stimmt weiterhin, weil
   getBoundingClientRect() die Transformation bereits einrechnet.
   ========================================================= */
(function (global) {
  'use strict';

  var TD = global.TD = global.TD || {};

  var stage = null, canvas = null;
  var scale = 1, tx = 0, ty = 0;
  var MIN = 1, MAX = 3.4;

  /* Beim Zoomen mit zwei Fingern gemerkter Ausgangszustand */
  var g0 = null;

  function coarse() {
    return !!(global.matchMedia && global.matchMedia('(pointer: coarse)').matches);
  }

  /** Mittelpunkt des Canvas ohne Transformation, in Bildschirmkoordinaten. */
  function centerOf() {
    var r = stage.getBoundingClientRect();
    return {
      x: r.left + canvas.offsetLeft + canvas.offsetWidth / 2,
      y: r.top + canvas.offsetTop + canvas.offsetHeight / 2
    };
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  /** Verschiebung so begrenzen, dass am Rand kein Leerraum entsteht. */
  function clampPan() {
    var r = stage.getBoundingClientRect();
    var w = canvas.offsetWidth * scale, h = canvas.offsetHeight * scale;
    var mx = Math.max(0, (w - r.width) / 2);
    var my = Math.max(0, (h - r.height) / 2);
    tx = clamp(tx, -mx, mx);
    ty = clamp(ty, -my, my);
  }

  function apply() {
    clampPan();
    canvas.style.transform = (scale === 1 && !tx && !ty)
      ? ''
      : 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + scale.toFixed(4) + ')';
  }

  var API = {

    /** True, solange zwei Finger den Ausschnitt bewegen. */
    gesturing: false,

    init: function (stageEl, canvasEl) {
      stage = stageEl;
      canvas = canvasEl;
      canvas.style.transformOrigin = 'center center';
      this.bind();

      var self = this;
      global.addEventListener('resize', function () { self.autoFit(); });
      global.addEventListener('orientationchange', function () {
        setTimeout(function () { self.autoFit(); }, 300);
      });
    },

    /**
     * Sinnvolle Startvergrößerung wählen.
     * Im Hochformat bleibt unter dem Feld Platz ungenutzt, weil die
     * Breite das Maß vorgibt. Diesen Platz füllen wir – dadurch werden
     * die Felder groß genug zum Treffen, und man schiebt seitwärts.
     */
    autoFit: function () {
      if (!canvas) return;
      if (!coarse()) { scale = 1; tx = ty = 0; apply(); return; }

      var r = stage.getBoundingClientRect();
      var h0 = canvas.offsetHeight;
      if (!h0 || !r.height) return;

      /* So weit vergrößern, dass eine Kachel rund 42 Punkte misst –
         bequem zu treffen –, aber höchstens so weit, wie die Höhe
         hergibt. Passt das Feld ohnehin schon (Querformat), bleibt
         es bei 1 und es muss nichts geschoben werden. */
      var kachel = canvas.offsetWidth / (TD.GRID ? TD.GRID.COLS : 20);
      var wanted = 42 / kachel;
      var byHeight = r.height / h0;
      scale = clamp(Math.min(wanted, byHeight), MIN, 2.8);
      tx = ty = 0;
      apply();
    },

    reset: function () { scale = 1; tx = ty = 0; apply(); },

    /** Für die Anzeige: liegt eine Vergrößerung an? */
    zoomed: function () { return scale > 1.02; },

    /** Laufenden Ausschnitt um einen Punkt herum verschieben. */
    nudge: function (dx, dy) { tx += dx; ty += dy; apply(); },

    bind: function () {
      var self = this;

      function dist(a, b) {
        var dx = a.clientX - b.clientX, dy = a.clientY - b.clientY;
        return Math.sqrt(dx * dx + dy * dy) || 1;
      }
      function mid(a, b) {
        return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
      }

      canvas.addEventListener('touchstart', function (ev) {
        if (ev.touches.length < 2) return;
        ev.preventDefault();
        self.gesturing = true;
        if (TD.game && TD.game.cancelDrag) TD.game.cancelDrag();
        g0 = {
          d: dist(ev.touches[0], ev.touches[1]),
          m: mid(ev.touches[0], ev.touches[1]),
          s: scale, tx: tx, ty: ty, c: centerOf()
        };
      }, { passive: false, capture: true });

      canvas.addEventListener('touchmove', function (ev) {
        if (!self.gesturing || !g0 || ev.touches.length < 2) return;
        ev.preventDefault();

        var d = dist(ev.touches[0], ev.touches[1]);
        var m = mid(ev.touches[0], ev.touches[1]);
        scale = clamp(g0.s * (d / g0.d), MIN, MAX);

        /* Der Bildpunkt zwischen den Fingern soll dort bleiben, wo er ist. */
        var k = scale / g0.s;
        tx = m.x - g0.c.x - (g0.m.x - g0.c.x - g0.tx) * k;
        ty = m.y - g0.c.y - (g0.m.y - g0.c.y - g0.ty) * k;
        apply();
      }, { passive: false, capture: true });

      function end(ev) {
        if (!self.gesturing) return;
        if (ev.touches && ev.touches.length >= 2) return;
        g0 = null;
        /* Kurz gesperrt lassen, damit der abgehobene zweite Finger
           nicht als Bauklick durchrutscht. */
        setTimeout(function () { self.gesturing = false; }, 90);
      }
      canvas.addEventListener('touchend', end, { capture: true });
      canvas.addEventListener('touchcancel', end, { capture: true });
    }
  };

  TD.viewport = API;

})(window);
