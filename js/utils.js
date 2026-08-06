/* =========================================================
   utils.js – Mathe-, Farb- und Zeichenhilfen
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD = global.TD || {};

  var U = TD.utils = {

    clamp: function (v, a, b) { return v < a ? a : (v > b ? b : v); },
    lerp:  function (a, b, t) { return a + (b - a) * t; },

    dist: function (ax, ay, bx, by) {
      var dx = bx - ax, dy = by - ay;
      return Math.sqrt(dx * dx + dy * dy);
    },
    dist2: function (ax, ay, bx, by) {
      var dx = bx - ax, dy = by - ay;
      return dx * dx + dy * dy;
    },

    rand:    function (a, b) { return a + Math.random() * (b - a); },
    randInt: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    pick:    function (arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    chance:  function (p) { return Math.random() < p; },

    /** Deterministischer PRNG – für reproduzierbare Deko/Wellen. */
    rng: function (seed) {
      var s = seed >>> 0;
      return function () {
        s |= 0; s = (s + 0x6D2B79F5) | 0;
        var t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    /** Kürzester Weg zwischen zwei Winkeln, interpoliert. */
    angleLerp: function (a, b, t) {
      var d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (d < -Math.PI) d += Math.PI * 2;
      return a + d * t;
    },

    /** Dreht `a` maximal um `max` Richtung `b`. */
    angleApproach: function (a, b, max) {
      var d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (d < -Math.PI) d += Math.PI * 2;
      if (d > max) d = max;
      if (d < -max) d = -max;
      return a + d;
    },

    roundRect: function (ctx, x, y, w, h, r) {
      r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y,     x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x,     y + h, r);
      ctx.arcTo(x,     y + h, x,     y,     r);
      ctx.arcTo(x,     y,     x + w, y,     r);
      ctx.closePath();
    },

    /** Regelmäßiges Polygon (n Ecken) als Pfad. */
    polygon: function (ctx, x, y, r, n, rot) {
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        var a = (rot || 0) + (i / n) * Math.PI * 2;
        var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    },

    /** "#rrggbb" + Alpha -> "rgba(...)" */
    alpha: function (hex, a) {
      var h = hex.replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
    },

    /** Hellt (t>0) oder dunkelt (t<0) eine Hex-Farbe ab. */
    shade: function (hex, t) {
      var h = hex.replace('#', '');
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      var n = parseInt(h, 16);
      var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      var to = t < 0 ? 0 : 255, p = Math.abs(t);
      r = Math.round(r + (to - r) * p);
      g = Math.round(g + (to - g) * p);
      b = Math.round(b + (to - b) * p);
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    },

    /** Zahl kompakt: 12500 -> "12,5k" */
    fmt: function (n) {
      n = Math.round(n);
      if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.', ',') + 'M';
      if (n >= 10000)   return Math.round(n / 1000) + 'k';
      return String(n);
    },

    /** Sichere localStorage-Wrapper (Privatmodus / file:// tolerant). */
    store: {
      get: function (key, fallback) {
        try {
          var v = global.localStorage.getItem('td2026.' + key);
          return v === null ? fallback : JSON.parse(v);
        } catch (e) { return fallback; }
      },
      set: function (key, value) {
        try { global.localStorage.setItem('td2026.' + key, JSON.stringify(value)); return true; }
        catch (e) { return false; }
      }
    }
  };

  U.TAU = Math.PI * 2;
})(window);
