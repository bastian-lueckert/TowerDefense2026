/* =========================================================
   celebrate.js – Belohnungsanimation nach einem Level

   Legt ein Canvas über den gesamten Bildschirm und spielt eine
   kurze Feier ab: Lichtblitz, Strahlenkranz, Konfettiregen,
   aufsteigende Funken und ein Siegesbanner in Frakturschrift.
   Reagiert auf „weniger Bewegung“ in den Systemeinstellungen.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;
  var doc = global.document;

  var canvas = null, ctx = null, raf = 0;
  var running = false, t0 = 0, duration = 3.4;
  var confetti = [], sparks = [], rays = [];
  var opts = {};

  function ensureCanvas() {
    if (canvas) return;
    canvas = doc.createElement('canvas');
    canvas.id = 'celebrate';
    canvas.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
  }

  function resize() {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = Math.round(global.innerWidth * dpr);
    canvas.height = Math.round(global.innerHeight * dpr);
    canvas.style.width = global.innerWidth + 'px';
    canvas.style.height = global.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Konfetti in den Farben des jeweiligen Volkes. */
  function spawnConfetti(colors) {
    confetti = [];
    var w = global.innerWidth;
    var n = w < 600 ? 90 : 160;
    for (var i = 0; i < n; i++) {
      confetti.push({
        x: Math.random() * w,
        y: -Math.random() * global.innerHeight * 0.6 - 20,
        vx: U.rand(-26, 26),
        vy: U.rand(70, 190),
        size: U.rand(5, 11),
        rot: Math.random() * U.TAU,
        vr: U.rand(-7, 7),
        color: colors[Math.floor(Math.random() * colors.length)],
        sway: U.rand(0.6, 2.2),
        phase: Math.random() * U.TAU
      });
    }
  }

  function spawnSparks(cx, cy) {
    sparks = [];
    for (var i = 0; i < 46; i++) {
      var a = Math.random() * U.TAU;
      var sp = U.rand(120, 420);
      sparks.push({
        x: cx, y: cy,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        life: U.rand(0.7, 1.5), maxLife: 1.5,
        size: U.rand(2.5, 5.5),
        color: Math.random() < 0.5 ? '#ffd166' : '#fff3c4'
      });
    }
  }

  function spawnRays(n) {
    rays = [];
    for (var i = 0; i < n; i++) {
      rays.push({ a: (i / n) * U.TAU, w: U.rand(0.05, 0.12) });
    }
  }

  /* -------------------------------------------------------
     Zeichnen
     ------------------------------------------------------- */

  function drawRays(cx, cy, t, alpha) {
    var R = Math.max(global.innerWidth, global.innerHeight);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.35);
    ctx.globalCompositeOperation = 'lighter';
    rays.forEach(function (r) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, r.a - r.w, r.a + r.w);
      ctx.closePath();
      ctx.fillStyle = U.alpha('#ffd166', 0.055 * alpha);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawConfetti(dt) {
    var h = global.innerHeight;
    for (var i = 0; i < confetti.length; i++) {
      var c = confetti[i];
      c.phase += dt * c.sway * 3;
      c.x += (c.vx + Math.sin(c.phase) * 34) * dt;
      c.y += c.vy * dt;
      c.rot += c.vr * dt;
      if (c.y > h + 20) { c.y = -20; c.x = Math.random() * global.innerWidth; }

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      // Flatternde Schnipsel: Breite schwankt mit der Drehung
      var wobble = Math.abs(Math.cos(c.phase));
      ctx.fillRect(-c.size / 2, -c.size * 0.35, c.size * (0.35 + wobble * 0.65), c.size * 0.7);
      ctx.restore();
    }
  }

  function drawSparks(dt) {
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.life -= dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      s.vy += 420 * dt;
      s.vx *= Math.pow(0.9, dt * 60);
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      var a = U.clamp(s.life / s.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * a, 0, U.TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  /** „GESCHAFFT“ in Frakturschrift, kurz eingeblendet. */
  function drawBanner(cx, cy, t) {
    if (!TD.titlescreen) return;
    var appear = U.clamp((t - 0.25) / 0.4, 0, 1);
    var fade = U.clamp((duration - 0.7 - t) / 0.5, 0, 1);
    var alpha = Math.min(appear, fade);
    if (alpha <= 0) return;

    var text = opts.banner || 'GESCHAFFT';
    var pwRaw = TD.titlescreen.textWidth(text);
    // So groß wie möglich, aber immer mit Rand zum Bildschirmrand
    var scale = U.clamp((global.innerWidth * 0.82) / pwRaw, 1.8, 5);
    var pw = TD.titlescreen.textWidth(text);
    var pop = 1 + (1 - appear) * 0.5;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.scale(pop, pop);
    ctx.translate(-pw * scale / 2, -7 * scale);

    // Buchstaben als Rechtecke – dieselbe Schrift wie im Titelbild
    var grid = { set: function (x, y, c) {
      ctx.fillStyle = c;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    } };
    TD.titlescreen.writeText(grid, text, 0, 0, '#ffe9a8', '#5a3a10');
    ctx.restore();
  }

  /* -------------------------------------------------------
     Ablauf
     ------------------------------------------------------- */

  function frame(now) {
    if (!running) return;
    var t = (now - t0) / 1000;
    var dt = Math.min(0.05, t - (frame.last || 0));
    frame.last = t;

    ctx.clearRect(0, 0, global.innerWidth, global.innerHeight);

    var cx = global.innerWidth / 2;
    var cy = global.innerHeight * 0.36;

    // Anfangsblitz
    if (t < 0.28) {
      ctx.fillStyle = U.alpha('#ffffff', (1 - t / 0.28) * 0.55);
      ctx.fillRect(0, 0, global.innerWidth, global.innerHeight);
    }

    var rayFade = U.clamp((duration - t) / 1.2, 0, 1) * U.clamp(t / 0.3, 0, 1);
    drawRays(cx, cy, t, rayFade);
    drawSparks(dt);
    drawConfetti(dt);
    // Das Banner sitzt weit oben, damit es den Ergebnisdialog nicht verdeckt
    drawBanner(cx, global.innerHeight * 0.17, t);

    if (t >= duration) { stop(); return; }
    raf = global.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) global.cancelAnimationFrame(raf);
    raf = 0;
    if (ctx) ctx.clearRect(0, 0, global.innerWidth, global.innerHeight);
    if (canvas) canvas.classList.remove('on');
  }

  var C = TD.celebrate = {

    /**
     * Feier starten.
     * @param {{colors?:string[], banner?:string, stars?:number}} [o]
     */
    play: function (o) {
      opts = o || {};

      // Wer weniger Bewegung möchte, bekommt nur einen kurzen Schimmer
      var reduced = global.matchMedia &&
                    global.matchMedia('(prefers-reduced-motion: reduce)').matches;

      ensureCanvas();
      resize();
      canvas.classList.add('on');

      duration = reduced ? 1.1 : 3.4;
      var colors = opts.colors && opts.colors.length ? opts.colors
                 : ['#ffd166', '#5ad1ff', '#7ee081', '#ff8a6b', '#c88bff', '#ffffff'];

      spawnConfetti(reduced ? [] : colors);
      spawnRays(reduced ? 0 : 14);
      if (!reduced) spawnSparks(global.innerWidth / 2, global.innerHeight * 0.36);

      running = true;
      t0 = performance.now();
      frame.last = 0;
      raf = global.requestAnimationFrame(frame);
    },

    stop: stop,

    /** Wird beim Schließen des Ergebnisfensters aufgerufen. */
    isRunning: function () { return running; }
  };

  global.addEventListener('resize', function () {
    if (running) resize();
  });
})(window);
