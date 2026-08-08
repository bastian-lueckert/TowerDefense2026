/* =========================================================
   scenes.js – Missionsbilder in Pixelgrafik

   Jedes Kapitel bekommt ein Auftaktbild. Statt 56 Bilder von
   Hand zu zeichnen, werden sie aus Bausteinen zusammengesetzt:
   Himmel, Ferne, Bauwerk, Boden, Gestalt und Wetter. Die
   Kombination steht in campaign.js bei jedem Level.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;

  var W = 128, H = 72;          // Pixelraster des Bildes
  var HORIZON = 47;             // Höhe der Horizontlinie

  /* -------------------------------------------------------
     Farbwelten des Himmels
     ------------------------------------------------------- */
  var SKIES = {
    day:    { top:'#4a86c4', mid:'#7db6e0', low:'#bcdcf0', sun:'#fff3c0', haze:'#d8ecf8' },
    dusk:   { top:'#3a3a72', mid:'#a05a7a', low:'#e0925a', sun:'#ffd98a', haze:'#f0b07a' },
    night:  { top:'#0e1330', mid:'#1b2350', low:'#33406e', sun:'#e8eeff', haze:'#4a5788' },
    storm:  { top:'#2a2f3e', mid:'#454b5e', low:'#6b7183', sun:'#9aa3b8', haze:'#7d8496' },
    blood:  { top:'#3a1020', mid:'#7a2028', low:'#c04a30', sun:'#ffb060', haze:'#d46a44' },
    sand:   { top:'#8a6a3a', mid:'#c49a58', low:'#e8c68a', sun:'#fff0b8', haze:'#dcbe90' },
    aurora: { top:'#0a1030', mid:'#12244a', low:'#1e3a5c', sun:'#dff4ff', haze:'#3a6a7a' }
  };

  /* -------------------------------------------------------
     Bodenfarben
     ------------------------------------------------------- */
  var GROUNDS = {
    grass: { a:'#2f5a34', b:'#3d7042', c:'#25482a' },
    snow:  { a:'#c8d8e8', b:'#e4eef8', c:'#9fb4c8' },
    sand:  { a:'#c9a05a', b:'#e0bc7a', c:'#a87f42' },
    stone: { a:'#4a4a56', b:'#5e5e6c', c:'#38383f' },
    ash:   { a:'#3a3038', b:'#4c4048', c:'#2a2228' },
    marsh: { a:'#3a4a34', b:'#4a5c3e', c:'#2a3626' }
  };

  /* =======================================================
     Zeichenbausteine
     ======================================================= */

  function sky(g, kind, rnd) {
    var p = SKIES[kind] || SKIES.day;
    for (var y = 0; y < HORIZON; y++) {
      var t = y / HORIZON;
      var c = t < 0.45 ? p.top : (t < 0.78 ? p.mid : p.low);
      // Weiche Übergänge durch versetzte Punkte (Dithering)
      for (var x = 0; x < W; x++) {
        var edge = (t > 0.4 && t < 0.5) || (t > 0.73 && t < 0.83);
        var c2 = c;
        if (edge && ((x + y) % 2 === 0)) c2 = t < 0.5 ? p.mid : p.low;
        g.set(x, y, c2);
      }
    }
  }

  function sun(g, kind, x, y, r, rnd) {
    var p = SKIES[kind] || SKIES.day;
    g.ellipse(x, y, r, r, p.sun);
    if (kind === 'night') {                 // Mondsichel
      g.ellipse(x + r * 0.45, y - r * 0.2, r * 0.85, r * 0.85, p.top);
    }
  }

  function stars(g, rnd, n) {
    for (var i = 0; i < n; i++) {
      var x = Math.floor(rnd() * W), y = Math.floor(rnd() * (HORIZON - 6));
      g.set(x, y, rnd() < 0.25 ? '#ffffff' : '#c8d4f0');
    }
  }

  function aurora(g, rnd) {
    for (var b = 0; b < 3; b++) {
      var base = 8 + b * 7;
      var col = b % 2 ? '#4fd9a0' : '#7ae0c0';
      for (var x = 0; x < W; x++) {
        var y = base + Math.round(Math.sin(x / 13 + b * 1.6) * 4);
        for (var k = 0; k < 3 + (b % 2); k++) g.set(x, y + k, col);
      }
    }
  }

  /** Gebirgszug; Schneekappen nur, wenn die Szene danach verlangt. */
  function mountains(g, color, baseY, height, seedX, rnd, step, snowCaps) {
    step = step || 17;
    for (var x = 0; x < W; x++) {
      var t = (x + seedX) / step;
      var h = Math.abs(Math.sin(t)) * height + Math.abs(Math.sin(t * 0.37)) * height * 0.4;
      var top = Math.round(baseY - h);
      for (var y = top; y <= baseY; y++) g.set(x, y, color);
      if (snowCaps && h > height * 0.82) {
        for (var s = 0; s < 3; s++) g.set(x, top + s, '#e8f0fa');
      }
    }
  }

  /**
   * Zeichnet auf ein eigenes Raster, umrandet das Ergebnis und legt es
   * dann erst auf das Bild. Ohne diesen hellen Saum verschwinden dunkle
   * Silhouetten vor dunklem Hintergrund.
   */
  function withRim(g, rimColor, drawFn) {
    var tmp = new TD.PixelGrid(W);
    drawFn(tmp);
    tmp.outline(rimColor);
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var c = tmp.get(x, y);
        if (c) g.set(x, y, c);
      }
    }
  }

  /** Farbe des Saums – hell genug, um sich vom Himmel abzuheben. */
  var RIMS = {
    day:'#f0f8ff', dusk:'#ffcf8a', night:'#7d8fc4', storm:'#8f97ab',
    blood:'#ff9a5a', sand:'#fff0b8', aurora:'#6fd8b8'
  };

  function dunes(g, color, baseY, rnd) {
    for (var x = 0; x < W; x++) {
      var h = Math.sin(x / 21) * 5 + Math.sin(x / 9 + 2) * 2.5;
      var top = Math.round(baseY - 5 - h);
      for (var y = top; y <= baseY; y++) g.set(x, y, color);
      g.set(x, top, '#e8c68a');
    }
  }

  function water(g, colTop, colLow, y0, y1, rnd) {
    for (var y = y0; y <= y1; y++) {
      for (var x = 0; x < W; x++) {
        g.set(x, y, (y + x) % 7 === 0 ? colTop : colLow);
      }
    }
  }

  function ground(g, kind, rnd) {
    var p = GROUNDS[kind] || GROUNDS.grass;
    for (var y = HORIZON; y < H; y++) {
      var t = (y - HORIZON) / (H - HORIZON);
      for (var x = 0; x < W; x++) {
        var c = t < 0.3 ? p.a : (t < 0.7 ? p.b : p.c);
        if ((x * 7 + y * 3) % 23 === 0) c = p.c;
        g.set(x, y, c);
      }
    }
    // Horizontkante
    for (var x2 = 0; x2 < W; x2++) g.set(x2, HORIZON, p.c);
  }

  function forest(g, color, baseY, from, to, rnd) {
    for (var x = from; x < to; x += 3) {
      var h = 4 + Math.floor(rnd() * 4);
      for (var y = baseY - h; y <= baseY; y++) {
        var w = Math.round((y - (baseY - h)) / h * 2);
        for (var i = -w; i <= w; i++) g.set(x + i, y, color);
      }
    }
  }

  /* ---------------- Bauwerke ---------------- */

  function castle(g, x, baseY, s, dark, light, flag) {
    var w = Math.round(14 * s), h = Math.round(16 * s);
    g.rect(x - w / 2, baseY - h, w, h, dark);
    g.rect(x - w / 2 + 1, baseY - h + 1, w - 2, h - 2, light);
    // Zinnen
    for (var i = 0; i < 4; i++) {
      var zx = Math.round(x - w / 2 + i * (w / 4));
      g.rect(zx, baseY - h - 3, Math.max(2, Math.round(w / 8)), 3, light);
    }
    // Türme links und rechts
    [-1, 1].forEach(function (sd) {
      var tx = Math.round(x + sd * (w / 2 + 2));
      g.rect(tx - 2, baseY - h - 6, 5, h + 6, dark);
      g.rect(tx - 1, baseY - h - 5, 3, h + 5, light);
      // Spitzdach
      for (var k = 0; k < 4; k++) g.rect(tx - 2 + k, baseY - h - 6 - (4 - k), 1, 4 - k, '#8a3a3a');
      for (var k2 = 0; k2 < 3; k2++) g.rect(tx + 2 - k2, baseY - h - 6 - (3 - k2), 1, 3 - k2, '#8a3a3a');
    });
    // Tor und Fenster
    g.rect(x - 2, baseY - 6, 4, 6, '#241a2b');
    g.rect(x - 4, baseY - h + 4, 2, 3, '#ffd98a');
    g.rect(x + 3, baseY - h + 4, 2, 3, '#ffd98a');
    if (flag) {
      g.rect(x, baseY - h - 9, 1, 5, '#5a4a3a');
      g.rect(x + 1, baseY - h - 9, 4, 3, flag);
    }
  }

  function longhouse(g, x, baseY, s, wood, roof) {
    var w = Math.round(26 * s), h = Math.round(9 * s);
    g.rect(x - w / 2, baseY - h, w, h, wood);
    // Gebogenes Dach
    for (var i = 0; i < w + 6; i++) {
      var px = Math.round(x - (w + 6) / 2 + i);
      var t = i / (w + 6);
      var lift = Math.round(Math.sin(t * Math.PI) * 5);
      for (var k = 0; k < 3; k++) g.set(px, baseY - h - lift + k, roof);
    }
    g.rect(x - 2, baseY - 5, 4, 5, '#241a2b');
    // Drachenkopf am First
    g.rect(x - (w + 6) / 2, baseY - h - 4, 3, 2, '#8a6134');
    g.rect(x - (w + 6) / 2 - 1, baseY - h - 5, 2, 2, '#8a6134');
  }

  function temple(g, x, baseY, s, stone, roof) {
    var w = Math.round(24 * s), h = Math.round(12 * s);
    // Stufen
    g.rect(x - w / 2 - 3, baseY - 2, w + 6, 2, stone);
    g.rect(x - w / 2 - 1, baseY - 4, w + 2, 2, stone);
    // Säulen
    for (var i = 0; i < 6; i++) {
      var cx = Math.round(x - w / 2 + 2 + i * ((w - 4) / 5));
      g.rect(cx, baseY - 4 - h, 2, h, '#f0ead8');
      g.set(cx, baseY - 4 - h, stone);
    }
    // Gebälk und Giebel
    g.rect(x - w / 2 - 2, baseY - 6 - h, w + 4, 3, stone);
    for (var j = 0; j < 7; j++) {
      var ww = Math.round((w + 4) * (1 - j / 7));
      g.rect(x - ww / 2, baseY - 9 - h + (6 - j), ww, 1, roof);
    }
  }

  function pyramid(g, x, baseY, s, light, dark) {
    var w = Math.round(34 * s);
    for (var i = 0; i <= w / 2; i++) {
      var y = baseY - i;
      var half = Math.round(w / 2 - i);
      for (var px = x - half; px <= x + half; px++) {
        g.set(px, y, px < x ? light : dark);
      }
    }
    // Deckstein
    g.set(x, baseY - Math.round(w / 2), '#ffe9a8');
  }

  function obelisk(g, x, baseY, s, stone) {
    var h = Math.round(22 * s);
    g.rect(x - 2, baseY - h, 4, h, stone);
    g.rect(x - 1, baseY - h, 2, h, '#e8d3a0');
    for (var k = 0; k < 3; k++) g.rect(x - 2 + k, baseY - h - (3 - k), 1, 3 - k, '#ffd166');
    for (var k2 = 0; k2 < 2; k2++) g.rect(x + 1 - k2, baseY - h - (2 - k2), 1, 2 - k2, '#ffd166');
    // Hieroglyphenandeutung
    for (var y = baseY - h + 3; y < baseY - 2; y += 3) g.set(x, y, '#a8873a');
  }

  function ruin(g, x, baseY, s, stone) {
    var w = Math.round(20 * s);
    [0, 1, 2].forEach(function (i) {
      var cx = Math.round(x - w / 2 + i * (w / 2));
      var h = 6 + ((i * 5) % 9);
      g.rect(cx, baseY - h, 3, h, stone);
      g.rect(cx, baseY - h, 3, 1, '#8a8a96');
    });
    g.rect(x - w / 2, baseY - 2, w, 2, stone);
    g.rect(x - w / 2 - 2, baseY - 14, 3, 4, stone);
  }

  function gate(g, x, baseY, s, stone, glow) {
    var h = Math.round(26 * s);
    g.rect(x - 9, baseY - h, 4, h, stone);
    g.rect(x + 6, baseY - h, 4, h, stone);
    g.rect(x - 10, baseY - h - 3, 21, 3, stone);
    // Torfüllung
    for (var y = baseY - h + 2; y < baseY; y++) {
      for (var px = x - 5; px <= x + 5; px++) {
        if ((px + y) % 3 !== 0) g.set(px, y, glow);
      }
    }
  }

  function camp(g, x, baseY, s, cloth) {
    [-1, 0, 1].forEach(function (i) {
      var cx = x + i * 13;
      for (var k = 0; k < 7; k++) {
        for (var px = cx - k; px <= cx + k; px++) g.set(px, baseY - 7 + k, cloth);
      }
      g.set(cx, baseY - 9, '#c94a3a');
    });
  }

  /* ---------------- Gestalten ---------------- */

  function dragonSil(g, x, y, s, col) {
    // Körper
    g.ellipse(x, y, 7 * s, 3.4 * s, col);
    // Hals und Kopf
    g.ellipse(x + 8 * s, y - 4 * s, 3 * s, 2 * s, col);
    g.rect(x + 10 * s, y - 5 * s, 4 * s, 2 * s, col);
    // Flügel
    for (var i = 0; i < 14 * s; i++) {
      var h = Math.round(Math.sin(i / (14 * s) * Math.PI) * 9 * s);
      for (var k = 0; k < h; k++) g.set(Math.round(x - 4 * s + i), Math.round(y - 3 * s - k), col);
    }
    // Schwanz
    for (var t = 0; t < 12 * s; t++) {
      g.set(Math.round(x - 7 * s - t), Math.round(y + Math.sin(t / 4) * 2), col);
    }
    // Auge
    g.set(Math.round(x + 12 * s), Math.round(y - 4.5 * s), '#ffd166');
  }

  function wolfSil(g, x, baseY, s, col) {
    var legY = Math.round(baseY - 5 * s);
    // Beine zuerst, damit der Rumpf sie überdeckt
    [-7, -3.5, 3.5, 7].forEach(function (dx) {
      g.rect(Math.round(x + dx * s), legY, Math.max(2, Math.round(2 * s)), Math.round(6 * s), col);
    });
    // Rumpf: vorn höher als hinten
    g.ellipse(x, baseY - 9 * s, 9.5 * s, 4.6 * s, col);
    g.ellipse(x + 5 * s, baseY - 11 * s, 5.5 * s, 4.4 * s, col);
    // Hals und Kopf
    g.ellipse(x + 9.5 * s, baseY - 14 * s, 3.4 * s, 3 * s, col);
    // Schnauze, leicht nach unten
    g.rect(Math.round(x + 11 * s), Math.round(baseY - 14.5 * s), Math.round(5 * s), Math.round(2.4 * s), col);
    // Spitze Ohren
    [0, 1].forEach(function (i) {
      var ex = Math.round(x + (7.6 + i * 2.6) * s);
      for (var k = 0; k < Math.round(3.5 * s); k++) {
        g.rect(ex, Math.round(baseY - 17 * s) + k, Math.max(1, Math.round(2 * s) - k), 1, col);
      }
    });
    // Buschiger Schwanz
    for (var t = 0; t < 11 * s; t++) {
      var tx = Math.round(x - 9 * s - t), ty = Math.round(baseY - 10 * s - t * 0.55);
      var th = Math.max(1, Math.round((2.4 - t / (7 * s)) * s));
      g.rect(tx, ty, 1, th, col);
    }
    // Auge
    g.set(Math.round(x + 10.5 * s), Math.round(baseY - 14.5 * s), '#ffd166');
  }

  function serpentSil(g, x, baseY, s, col) {
    var len = Math.round(58 * s);
    for (var i = 0; i < len; i++) {
      var px = x - len / 2 + i;
      var py = baseY - 8 - Math.round(Math.sin(i / 7) * 6);
      for (var k = 0; k < 4; k++) g.set(px, py + k, col);
    }
    // Kopf mit Kapuze
    var hx = x + len / 2, hy = baseY - 8 - Math.round(Math.sin(len / 7) * 6);
    g.ellipse(hx, hy - 4, 6, 7, col);
    g.ellipse(hx + 2, hy - 2, 4, 3, col);
    g.set(hx + 4, hy - 3, '#ffd166');
    g.rect(hx + 6, hy - 1, 4, 1, '#c94a3a');
  }

  function giantSil(g, x, baseY, s, col) {
    g.rect(x - 5 * s, baseY - 22 * s, 10 * s, 14 * s, col);   // Rumpf
    g.ellipse(x, baseY - 25 * s, 4 * s, 4 * s, col);          // Kopf
    g.rect(x - 9 * s, baseY - 20 * s, 4 * s, 11 * s, col);    // Arme
    g.rect(x + 5 * s, baseY - 20 * s, 4 * s, 11 * s, col);
    g.rect(x - 4 * s, baseY - 8 * s, 3 * s, 8 * s, col);      // Beine
    g.rect(x + 1 * s, baseY - 8 * s, 3 * s, 8 * s, col);
    // Hörner
    g.rect(x - 4 * s, baseY - 28 * s, 2, 3, '#e8dcc0');
    g.rect(x + 3 * s, baseY - 28 * s, 2, 3, '#e8dcc0');
  }

  /**
   * Die anrückende Übermacht. Die Gestalten stehen gestaffelt: weiter
   * hinten kleiner, damit Tiefe entsteht.
   */
  function horde(g, baseY, col, rnd, n, rim) {
    var rows = [
      { y: baseY - 8, s: 0.7 },
      { y: baseY - 3, s: 0.9 },
      { y: baseY + 3, s: 1.15 }
    ];
    for (var i = 0; i < n; i++) {
      var row = rows[i % rows.length];
      var x = Math.round(5 + rnd() * (W - 10));
      var s = row.s * (0.85 + rnd() * 0.3);
      var y = row.y;
      g.ellipse(x, y - 5 * s, 1.9 * s, 2.1 * s, col);              // Kopf
      g.rect(Math.round(x - 1.6 * s), Math.round(y - 3 * s),
             Math.max(2, Math.round(3.2 * s)), Math.round(4 * s), col);   // Rumpf
      g.rect(Math.round(x - 1.4 * s), Math.round(y + s), 1, Math.round(2 * s), col);
      g.rect(Math.round(x + 0.8 * s), Math.round(y + s), 1, Math.round(2 * s), col);
      if (rnd() < 0.45) {                                          // Speer
        g.rect(Math.round(x + 2.4 * s), Math.round(y - 9 * s), 1, Math.round(9 * s), col);
      }
    }
  }

  function wisps(g, rnd, n, col) {
    for (var i = 0; i < n; i++) {
      var x = Math.round(rnd() * W), y = Math.round(28 + rnd() * 26);
      g.ellipse(x, y, 1.6, 2.2, col);
      g.set(x, y - 3, '#ffffff');
    }
  }

  function birds(g, rnd, n, col) {
    for (var i = 0; i < n; i++) {
      var x = Math.round(rnd() * W), y = Math.round(6 + rnd() * 26);
      g.set(x, y, col); g.set(x - 1, y - 1, col); g.set(x + 1, y - 1, col);
      g.set(x - 2, y - 1, col); g.set(x + 2, y - 1, col);
    }
  }

  /* ---------------- Wetter ---------------- */

  function weather(g, kind, rnd) {
    var i, x, y;
    if (kind === 'snow') {
      for (i = 0; i < 130; i++) {
        x = Math.floor(rnd() * W); y = Math.floor(rnd() * H);
        g.set(x, y, '#ffffff');
      }
    } else if (kind === 'rain') {
      for (i = 0; i < 90; i++) {
        x = Math.floor(rnd() * W); y = Math.floor(rnd() * HORIZON);
        g.set(x, y, '#9fc4e0'); g.set(x, y + 1, '#9fc4e0');
      }
    } else if (kind === 'ash') {
      for (i = 0; i < 100; i++) {
        x = Math.floor(rnd() * W); y = Math.floor(rnd() * H);
        g.set(x, y, rnd() < 0.5 ? '#b0a0a8' : '#6a5a62');
      }
    } else if (kind === 'sparks') {
      for (i = 0; i < 70; i++) {
        x = Math.floor(rnd() * W); y = Math.floor(20 + rnd() * (H - 24));
        g.set(x, y, rnd() < 0.5 ? '#ffd166' : '#ff8a3d');
      }
    } else if (kind === 'sand') {
      for (i = 0; i < 110; i++) {
        x = Math.floor(rnd() * W); y = Math.floor(rnd() * H);
        g.set(x, y, '#e8c68a');
      }
    }
  }

  /* =======================================================
     Bild zusammensetzen
     ======================================================= */
  function build(scene, seed) {
    var g = new TD.PixelGrid(W);   // quadratisch angelegt, genutzt wird 128×72
    var rnd = U.rng(seed || 1);

    sky(g, scene.sky, rnd);

    if (scene.sky === 'night' || scene.sky === 'aurora') stars(g, rnd, 60);
    if (scene.sky === 'aurora') aurora(g, rnd);
    if (scene.sun !== false) {
      var sx = scene.sunX == null ? 96 : scene.sunX;
      var sy = scene.sunY == null ? 14 : scene.sunY;
      sun(g, scene.sky, sx, sy, scene.sky === 'night' ? 5 : 6, rnd);
    }

    /* Ferne */
    var snowy = scene.ground === 'snow';
    switch (scene.far) {
      case 'mountains':
        mountains(g, shade(scene.sky, 0.55), HORIZON, 22, 0, rnd, 19, snowy);
        mountains(g, shade(scene.sky, 0.35), HORIZON, 15, 40, rnd, 13, false);
        break;
      case 'peaks':
        mountains(g, shade(scene.sky, 0.5), HORIZON, 28, 10, rnd, 15, snowy);
        break;
      case 'hills':
        mountains(g, shade(scene.sky, 0.4), HORIZON, 9, 30, rnd, 23, false);
        break;
      case 'dunes':
        dunes(g, '#c9a05a', HORIZON, rnd);
        break;
      case 'fjord':
        mountains(g, shade(scene.sky, 0.5), HORIZON - 6, 20, 5, rnd, 17, snowy);
        water(g, '#3a6a8a', '#2a4a66', HORIZON - 6, HORIZON, rnd);
        break;
      case 'pyramids':
        pyramid(g, 26, HORIZON, 0.55, '#c9a05a', '#a87f42');
        pyramid(g, 48, HORIZON, 0.4, '#c9a05a', '#a87f42');
        break;
      case 'volcano':
        mountains(g, '#3a2a30', HORIZON, 24, 0, rnd, 21);
        for (var v = 0; v < 24; v++) g.set(64 + Math.round(Math.sin(v) * 3), 20 + v, '#ff6a2b');
        break;
      case 'forest':
        forest(g, scene.ground === 'snow' ? '#2a3a3e' : '#1e3a24', HORIZON, 0, W, rnd);
        break;
    }

    ground(g, scene.ground, rnd);

    /* Bauwerk */
    var bx = scene.structX == null ? 40 : scene.structX;
    switch (scene.structure) {
      case 'castle':    castle(g, bx, HORIZON + 12, 1, '#5a6072', '#7b8296', scene.flag || '#3a5f9e'); break;
      case 'longhouse': longhouse(g, bx, HORIZON + 12, 1, '#7a5a34', '#8a4a2a'); break;
      case 'temple':    temple(g, bx, HORIZON + 12, 1, '#c9b78a', '#a83232'); break;
      case 'pyramid':   pyramid(g, bx, HORIZON + 14, 1, '#e0bc7a', '#c49a58'); break;
      case 'obelisk':   obelisk(g, bx, HORIZON + 13, 1, '#c9b06a'); break;
      case 'ruin':      ruin(g, bx, HORIZON + 12, 1, '#6a6a76'); break;
      case 'gate':      gate(g, bx, HORIZON + 13, 1, '#3a3442', scene.gateGlow || '#7a4ad9'); break;
      case 'camp':      camp(g, bx, HORIZON + 11, 1, '#b04a3a'); break;
    }

    /* Gestalt – mit hellem Saum, damit sie sich immer abhebt */
    var dark = '#161020';
    var rim = RIMS[scene.sky] || '#e0e8f8';
    switch (scene.actor) {
      case 'dragon':
        withRim(g, rim, function (t) {
          dragonSil(t, scene.actorX || 86, scene.actorY || 20, scene.actorS || 1.2, dark);
        });
        break;
      case 'wolf':
        withRim(g, rim, function (t) {
          wolfSil(t, scene.actorX || 92, HORIZON + 18, scene.actorS || 1.1, dark);
        });
        break;
      case 'serpent':
        withRim(g, rim, function (t) {
          serpentSil(t, scene.actorX || 70, HORIZON + 16, scene.actorS || 1, dark);
        });
        break;
      case 'giant':
        withRim(g, rim, function (t) {
          giantSil(t, scene.actorX || 96, HORIZON + 16, scene.actorS || 1, dark);
        });
        break;
      case 'horde':
        // Auf dunklem Untergrund etwas aufhellen, sonst verschwimmen sie
        var hc = (scene.ground === 'ash' || scene.ground === 'stone') ? '#584a5c' : dark;
        horde(g, HORIZON + 16, hc, rnd, scene.actorN || 14);
        break;
      case 'wisps':   wisps(g, rnd, 10, '#dfffa0'); break;
      case 'birds':   birds(g, rnd, 14, dark); break;
    }

    weather(g, scene.weather, rnd);

    // Rahmen: unten abdunkeln, damit Text darauf lesbar bleibt
    for (var y = H - 5; y < H; y++) {
      for (var x = 0; x < W; x++) {
        if ((x + y) % 2 === 0) g.set(x, y, '#141020');
      }
    }
    return g;
  }

  /** Etwas dunklere Variante der Himmelsfarbe – für gestaffelte Tiefe. */
  function shade(skyKind, amount) {
    var p = SKIES[skyKind] || SKIES.day;
    var c = p.mid.replace('#', '');
    var n = parseInt(c, 16);
    var r = Math.round(((n >> 16) & 255) * amount);
    var gg = Math.round(((n >> 8) & 255) * amount);
    var b = Math.round((n & 255) * amount);
    return 'rgb(' + r + ',' + gg + ',' + b + ')';
  }

  /* =======================================================
     Öffentliche Schnittstelle
     ======================================================= */
  var cache = {};

  TD.scenes = {
    WIDTH: W, HEIGHT: H,

    /**
     * Missionsbild in ein Canvas zeichnen.
     * @param {HTMLCanvasElement} canvas
     * @param {object} scene Bausteine aus campaign.js
     * @param {number} seed  für die zufälligen Anteile
     * @param {number} scale Pixelgröße
     */
    draw: function (canvas, scene, seed, scale) {
      scale = scale || 4;
      var key = JSON.stringify(scene) + '|' + seed;
      if (!cache[key]) cache[key] = build(scene, seed);
      var g = cache[key];

      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      canvas.width = W * scale * dpr;
      canvas.height = H * scale * dpr;
      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, W * scale, H * scale);

      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          var c = g.get(x, y);
          if (!c) continue;
          ctx.fillStyle = c;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  };
})(window);
