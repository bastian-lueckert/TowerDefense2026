/* =========================================================
   render.js – Sämtliche Canvas-Zeichenroutinen.
   Alle Grafiken sind prozedural => keine Bilddateien nötig.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;
  var CELL = TD.GRID.CELL, COLS = TD.GRID.COLS, ROWS = TD.GRID.ROWS;
  var W = COLS * CELL, H = ROWS * CELL;

  var bgCanvas = null, bgMapId = null;

  /* -------------------------------------------------------
     Statischer Hintergrund (einmal pro Karte gerendert)
     ------------------------------------------------------- */
  function buildBackground(map) {
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    var th = map.theme;
    var rnd = U.rng(9182 + map.id.length * 77);

    // Grundfläche mit weichem Verlauf
    var grd = ctx.createLinearGradient(0, 0, W * 0.6, H);
    grd.addColorStop(0, th.grass2);
    grd.addColorStop(1, th.grass);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Unregelmäßige Flecken für Textur
    for (var i = 0; i < 240; i++) {
      var x = rnd() * W, y = rnd() * H, r = 8 + rnd() * 34;
      ctx.fillStyle = U.alpha(rnd() < 0.5 ? '#000000' : '#ffffff', 0.02 + rnd() * 0.035);
      ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.5 + rnd() * 0.5), rnd() * Math.PI, 0, U.TAU); ctx.fill();
    }

    // Dezentes Baraster
    ctx.strokeStyle = 'rgba(255,255,255,.035)';
    ctx.lineWidth = 1;
    for (var gx = 1; gx < COLS; gx++) {
      ctx.beginPath(); ctx.moveTo(gx * CELL + .5, 0); ctx.lineTo(gx * CELL + .5, H); ctx.stroke();
    }
    for (var gy = 1; gy < ROWS; gy++) {
      ctx.beginPath(); ctx.moveTo(0, gy * CELL + .5); ctx.lineTo(W, gy * CELL + .5); ctx.stroke();
    }

    // Weg
    drawPathStroke(ctx, map, th.pathEdge, TD.PATH_W + 12, 0.55);
    drawPathStroke(ctx, map, th.path, TD.PATH_W, 1);

    // Wegtextur: helle Kieselspuren
    ctx.save();
    ctx.globalAlpha = 0.16;
    for (var s = 0; s < 300; s++) {
      var d = rnd() * map.length;
      var p = TD.maps.pointAt(map, d);
      var off = (rnd() - 0.5) * TD.PATH_W * 0.8;
      var nx = Math.cos(p.angle + Math.PI / 2) * off, ny = Math.sin(p.angle + Math.PI / 2) * off;
      ctx.fillStyle = rnd() < 0.5 ? '#ffffff' : '#000000';
      ctx.beginPath();
      ctx.arc(p.x + nx, p.y + ny, 1 + rnd() * 2.4, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();

    // Wegränder abdunkeln
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.restore();

    // Deko-Hindernisse
    map.decor.forEach(function (dc) {
      var x = (dc.cx + 0.5) * CELL, y = (dc.cy + 0.5) * CELL;
      if (dc.kind === 'rock') drawRock(ctx, x, y, CELL * 0.34 * dc.scale, th.rock, dc.rot);
      else                    drawTree(ctx, x, y, CELL * 0.36 * dc.scale, th.deco, dc.rot);
    });

    // Vignette
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.42)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    return c;
  }

  function drawPathStroke(ctx, map, color, width, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(map.points[0].x, map.points[0].y);
    for (var i = 1; i < map.points.length; i++) ctx.lineTo(map.points[i].x, map.points[i].y);
    ctx.stroke();
    ctx.restore();
  }

  function drawRock(ctx, x, y, r, color, rot) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(2, r * 0.45, r * 1.05, r * 0.4, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = color;
    U.polygon(ctx, 0, 0, r, 6, 0.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    U.polygon(ctx, -r * 0.16, -r * 0.2, r * 0.55, 6, 0.3); ctx.fill();
    ctx.restore();
  }

  function drawTree(ctx, x, y, r, color, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.32)';
    ctx.beginPath(); ctx.ellipse(3, r * 0.55, r * 0.9, r * 0.35, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(-r * 0.12, -r * 0.1, r * 0.24, r * 0.7);
    ctx.rotate(rot * 0.2);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, -r * 0.35, r * 0.72, 0, U.TAU); ctx.fill();
    ctx.fillStyle = U.alpha('#ffffff', 0.12);
    ctx.beginPath(); ctx.arc(-r * 0.22, -r * 0.55, r * 0.38, 0, U.TAU); ctx.fill();
    ctx.restore();
  }

  /* -------------------------------------------------------
     Basis (das zu verteidigende Ziel)
     ------------------------------------------------------- */
  function drawBase(ctx, g) {
    var b = g.map.basePx, t = g.time;
    var health = g.lives / g.maxLives;
    ctx.save();
    ctx.translate(b.x, b.y);

    // Pulsierender Schutzschild
    var pulse = 0.5 + Math.sin(t * 2) * 0.5;
    var col = health > 0.5 ? '#45e08a' : (health > 0.25 ? '#ffc945' : '#ff5d73');
    ctx.strokeStyle = U.alpha(col, 0.18 + pulse * 0.22);
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, CELL * (0.66 + pulse * 0.09), 0, U.TAU); ctx.stroke();

    // Sockel
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.ellipse(2, CELL * 0.3, CELL * 0.46, CELL * 0.18, 0, 0, U.TAU); ctx.fill();

    ctx.fillStyle = '#2b3a5e';
    U.polygon(ctx, 0, 0, CELL * 0.44, 6, Math.PI / 6); ctx.fill();
    ctx.fillStyle = '#3d5285';
    U.polygon(ctx, 0, -3, CELL * 0.34, 6, Math.PI / 6); ctx.fill();

    // Kristall in der Mitte
    ctx.save();
    ctx.rotate(t * 0.6);
    ctx.fillStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = 16;
    U.polygon(ctx, 0, -2, CELL * 0.19, 4, 0); ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  /* -------------------------------------------------------
     Spawn-Portal
     ------------------------------------------------------- */
  function drawSpawn(ctx, g) {
    var s = g.map.spawnPx, t = g.time;
    ctx.save();
    ctx.translate(s.x, s.y);
    for (var i = 0; i < 3; i++) {
      var p = ((t * 0.5 + i / 3) % 1);
      ctx.strokeStyle = U.alpha('#ff6a6a', (1 - p) * 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, CELL * (0.2 + p * 0.5), 0, U.TAU); ctx.stroke();
    }
    ctx.restore();
  }

  /* -------------------------------------------------------
     Luftlinie der Flieger – nur sichtbar, wenn welche kommen
     ------------------------------------------------------- */
  function drawAirRoute(ctx, g) {
    var a = g.map.points[0], b = g.map.points[g.map.points.length - 1];
    ctx.save();
    ctx.strokeStyle = U.alpha('#7fd4ff', 0.28);
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.lineDashOffset = -g.time * 26;      // Bewegung zeigt die Flugrichtung
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  /* -------------------------------------------------------
     TÜRME
     ------------------------------------------------------- */
  function drawTower(ctx, tw, opts) {
    opts = opts || {};
    var d = tw.def;
    var scale = opts.scale || 1;
    var build = tw.buildAnim || 0;

    ctx.save();
    ctx.translate(tw.x, tw.y);
    if (build > 0) {
      var s = 1 + build * 0.35;
      ctx.scale(s, s);
      ctx.globalAlpha = 1 - build * 0.5;
    }
    ctx.scale(scale, scale);

    // Schatten
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(2, CELL * 0.26, CELL * 0.36, CELL * 0.15, 0, 0, U.TAU); ctx.fill();

    // Sockel
    var baseR = CELL * 0.36;
    ctx.fillStyle = '#2a3350';
    U.polygon(ctx, 0, 0, baseR, 8, Math.PI / 8); ctx.fill();
    ctx.fillStyle = '#374372';
    U.polygon(ctx, 0, -2, baseR * 0.82, 8, Math.PI / 8); ctx.fill();
    ctx.strokeStyle = U.alpha(d.color, 0.45);
    ctx.lineWidth = 1.5;
    U.polygon(ctx, 0, -2, baseR * 0.82, 8, Math.PI / 8); ctx.stroke();

    // Stufenmarkierung
    for (var i = 0; i < tw.level - 1; i++) {
      var a = -Math.PI / 2 + (i - (tw.level - 2) / 2) * 0.5;
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * baseR * 0.98, Math.sin(a) * baseR * 0.98 + CELL * 0.2, 2.2, 0, U.TAU);
      ctx.fill();
    }

    // Geschütz
    ctx.save();
    ctx.rotate(tw.angle);
    ctx.translate(-tw.recoil * 3.5, 0);
    drawTurretHead(ctx, tw, d);
    ctx.restore();

    ctx.restore();
  }

  function drawTurretHead(ctx, tw, d) {
    var lvl = tw.level;
    var c = d.color, dark = d.accent;

    switch (d.key) {

      case 'gun': {
        ctx.fillStyle = dark;
        U.roundRect(ctx, -8, -7, 16, 14, 4); ctx.fill();
        ctx.fillStyle = c;
        U.roundRect(ctx, -6, -5.5, 12, 11, 3); ctx.fill();
        ctx.fillStyle = U.shade(c, -0.45);
        var bl = 14 + lvl * 2;
        U.roundRect(ctx, 4, -2.6, bl, 5.2, 2); ctx.fill();
        if (lvl >= 3) { U.roundRect(ctx, 4, -7, bl * 0.8, 3.4, 1.6); ctx.fill(); U.roundRect(ctx, 4, 3.6, bl * 0.8, 3.4, 1.6); ctx.fill(); }
        break;
      }

      case 'frost': {
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, U.TAU); ctx.fill();
        ctx.save();
        ctx.rotate(-tw.angle + tw.game.time * 1.2);
        for (var k = 0; k < 6; k++) {
          ctx.save(); ctx.rotate(k / 6 * U.TAU);
          ctx.strokeStyle = c; ctx.lineWidth = 2 + lvl * 0.35; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(9 + lvl, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(9, -3); ctx.moveTo(6, 0); ctx.lineTo(9, 3); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
        ctx.fillStyle = '#eaffff';
        ctx.shadowColor = c; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, U.TAU); ctx.fill();
        break;
      }

      case 'cannon': {
        ctx.fillStyle = dark;
        U.roundRect(ctx, -10, -9, 19, 18, 5); ctx.fill();
        ctx.fillStyle = c;
        U.roundRect(ctx, -8, -7, 15, 14, 4); ctx.fill();
        ctx.fillStyle = U.shade(c, -0.5);
        var cl = 15 + lvl * 2.5;
        U.roundRect(ctx, 5, -4.6, cl, 9.2, 3); ctx.fill();
        ctx.fillStyle = U.shade(c, -0.7);
        U.roundRect(ctx, 5 + cl - 4, -5.4, 4.5, 10.8, 2); ctx.fill();
        break;
      }

      case 'tesla': {
        ctx.fillStyle = dark;
        U.roundRect(ctx, -9, -8, 18, 16, 5); ctx.fill();
        // Spulenringe
        for (var r = 0; r < 3; r++) {
          ctx.strokeStyle = U.alpha(c, 0.5 + r * 0.16);
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(2, 0, 5 + r * 2.4, 7 - r * 1.4, 0, 0, U.TAU); ctx.stroke();
        }
        var glow = 0.35 + tw.chargeGlow * 0.65;
        ctx.fillStyle = c;
        ctx.shadowColor = c; ctx.shadowBlur = 6 + glow * 16;
        ctx.beginPath(); ctx.arc(11 + lvl * 0.8, 0, 3.4 + lvl * 0.4, 0, U.TAU); ctx.fill();
        break;
      }

      case 'sniper': {
        ctx.fillStyle = dark;
        U.roundRect(ctx, -9, -6, 17, 12, 4); ctx.fill();
        ctx.fillStyle = c;
        U.roundRect(ctx, -7, -4.5, 13, 9, 3); ctx.fill();
        ctx.fillStyle = U.shade(c, -0.5);
        var sl = 22 + lvl * 3;
        U.roundRect(ctx, 5, -1.9, sl, 3.8, 1.8); ctx.fill();
        // Zweibein
        ctx.strokeStyle = U.shade(c, -0.6); ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(sl * 0.6, 0); ctx.lineTo(sl * 0.6 + 3, 6);
        ctx.moveTo(sl * 0.6, 0); ctx.lineTo(sl * 0.6 + 3, -6); ctx.stroke();
        // Zielfernrohr
        ctx.fillStyle = '#1a1f30';
        U.roundRect(ctx, -2, -8.5, 11, 4, 2); ctx.fill();
        break;
      }

      case 'poison': {
        ctx.fillStyle = dark;
        U.roundRect(ctx, -9, -8, 17, 16, 5); ctx.fill();
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(-2, 0, 7, 0, U.TAU); ctx.fill();
        // Blubberblasen im Tank
        ctx.fillStyle = U.alpha('#ffffff', 0.35);
        for (var bqq = 0; bqq < 3; bqq++) {
          var ph = (tw.game.time * 0.8 + bqq * 0.33) % 1;
          ctx.beginPath();
          ctx.arc(-4 + bqq * 2.4, 4 - ph * 8, 1.4, 0, U.TAU);
          ctx.fill();
        }
        ctx.fillStyle = U.shade(c, -0.45);
        var pl = 13 + lvl * 2;
        U.roundRect(ctx, 4, -3.4, pl, 6.8, 3); ctx.fill();
        ctx.fillStyle = U.shade(c, 0.2);
        ctx.beginPath(); ctx.arc(4 + pl, 0, 3.2, 0, U.TAU); ctx.fill();
        break;
      }
    }
  }

  /* -------------------------------------------------------
     GEGNER
     ------------------------------------------------------- */
  function drawEnemy(ctx, e, time) {
    var d = e.def, r = e.r;
    var col = d.color;

    ctx.save();
    ctx.translate(e.x, e.y);

    // Schatten (Flieger werfen einen versetzten Schatten)
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    var sy = e.flying ? r * 1.5 : r * 0.75;
    ctx.beginPath(); ctx.ellipse(2, sy, r * 0.85, r * 0.32, 0, 0, U.TAU); ctx.fill();

    if (e.flying) ctx.translate(0, -8 + Math.sin(time * 5 + e.wobble) * 2.5);

    ctx.save();
    ctx.rotate(e.angle);

    // Trefferblitz
    var flash = Math.max(0, e.hitFlash);
    var body = flash > 0 ? U.shade(col, flash * 0.75) : col;

    // Frost-Tönung
    if (e.slowAmt > 0) body = mix(body, '#9fe8ff', Math.min(0.55, e.slowAmt));

    ctx.fillStyle = body;
    ctx.strokeStyle = U.shade(col, -0.5);
    ctx.lineWidth = 2;

    switch (d.shape) {
      case 'tri':
        ctx.beginPath();
        ctx.moveTo(r * 1.2, 0); ctx.lineTo(-r * 0.8, -r * 0.85); ctx.lineTo(-r * 0.8, r * 0.85);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        break;

      case 'square':
        U.roundRect(ctx, -r * 0.9, -r * 0.85, r * 1.8, r * 1.7, 4); ctx.fill(); ctx.stroke();
        // Panzerplatten
        ctx.fillStyle = U.shade(col, -0.25);
        U.roundRect(ctx, -r * 0.5, -r * 0.55, r * 1.0, r * 1.1, 3); ctx.fill();
        break;

      case 'hex':
        U.polygon(ctx, 0, 0, r, 6, 0); ctx.fill(); ctx.stroke();
        // Schildschimmer
        ctx.strokeStyle = U.alpha('#e0c8ff', 0.5 + Math.sin(time * 4 + e.wobble) * 0.25);
        ctx.lineWidth = 2;
        U.polygon(ctx, 0, 0, r * 1.28, 6, 0); ctx.stroke();
        break;

      case 'cross':
        ctx.beginPath();
        ctx.rect(-r * 0.35, -r, r * 0.7, r * 2);
        ctx.rect(-r, -r * 0.35, r * 2, r * 0.7);
        ctx.fill(); ctx.stroke();
        break;

      case 'wing':
        // Rumpf
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.55, 0, 0, U.TAU); ctx.fill(); ctx.stroke();
        // Schlagende Flügel
        var flap = Math.sin(time * 14 + e.wobble) * 0.5;
        ctx.fillStyle = U.alpha(col, 0.75);
        ctx.save(); ctx.scale(1, 1 + flap * 0.4);
        ctx.beginPath(); ctx.ellipse(-r * 0.1, -r * 0.95, r * 0.75, r * 0.42, -0.3, 0, U.TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-r * 0.1, r * 0.95, r * 0.75, r * 0.42, 0.3, 0, U.TAU); ctx.fill();
        ctx.restore();
        break;

      case 'boss':
        // Rotierender Ring
        ctx.save();
        ctx.rotate(time * 1.1);
        ctx.strokeStyle = U.alpha('#ffb36a', 0.65);
        ctx.lineWidth = 3;
        U.polygon(ctx, 0, 0, r * 1.32, 3, 0); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = body;
        U.polygon(ctx, 0, 0, r, 8, Math.PI / 8); ctx.fill(); ctx.stroke();
        ctx.fillStyle = U.shade(col, -0.3);
        U.polygon(ctx, 0, 0, r * 0.6, 8, Math.PI / 8); ctx.fill();
        // Auge
        ctx.fillStyle = '#fff3c4';
        ctx.shadowColor = '#ffca6a'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(r * 0.15, 0, r * 0.26, 0, U.TAU); ctx.fill();
        break;

      default: // circle
        ctx.beginPath(); ctx.arc(0, 0, r, 0, U.TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = U.shade(col, 0.3);
        ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.25, r * 0.35, 0, U.TAU); ctx.fill();
        break;
    }
    ctx.restore();   // Rotation zurück

    // Gift-Aura
    if (e.poisonT > 0) {
      ctx.strokeStyle = U.alpha('#7ee081', 0.35 + Math.sin(time * 9 + e.wobble) * 0.2);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, U.TAU); ctx.stroke();
    }
    // Heilimpuls
    if (e.healPulse > 0) {
      ctx.strokeStyle = U.alpha('#7ee081', e.healPulse * 0.5);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, r + 6 + (1 - e.healPulse) * 8, 0, U.TAU); ctx.stroke();
    }

    // Lebensbalken (nur wenn verletzt oder Boss)
    var hpFrac = e.hp / e.maxHp;
    if (hpFrac < 0.999 || d.boss) {
      var bw = Math.max(r * 2.1, 20), bh = d.boss ? 5 : 3.5;
      var by = -r - (e.flying ? 12 : 9);
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      U.roundRect(ctx, -bw / 2 - 1, by - 1, bw + 2, bh + 2, 2); ctx.fill();
      ctx.fillStyle = hpFrac > 0.5 ? '#45e08a' : (hpFrac > 0.22 ? '#ffc945' : '#ff5d73');
      U.roundRect(ctx, -bw / 2, by, bw * hpFrac, bh, 1.5); ctx.fill();
    }

    ctx.restore();
  }

  function mix(a, b, t) {
    // Beide Farben können "rgb(...)" oder "#hex" sein
    var ca = parseColor(a), cb = parseColor(b);
    return 'rgb(' + Math.round(U.lerp(ca[0], cb[0], t)) + ',' +
                    Math.round(U.lerp(ca[1], cb[1], t)) + ',' +
                    Math.round(U.lerp(ca[2], cb[2], t)) + ')';
  }
  function parseColor(c) {
    if (c[0] === '#') {
      var h = c.slice(1);
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      var n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var m = c.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : [255, 255, 255];
  }

  /* -------------------------------------------------------
     GESCHOSSE
     ------------------------------------------------------- */
  function drawProjectile(ctx, p, time) {
    ctx.save();

    if (p.arc) {
      // Schatten am Boden
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 4, 2, 0, 0, U.TAU); ctx.fill();
      ctx.translate(p.x, p.y - (p.height || 0));
      ctx.rotate(p.spin);
      if (p.kind === 'shell') {
        ctx.fillStyle = '#3a3f52';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, U.TAU); ctx.fill();
        ctx.fillStyle = U.shade(p.color, -0.2);
        ctx.beginPath(); ctx.arc(-1, -1, 3, 0, U.TAU); ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, U.TAU); ctx.fill();
        ctx.fillStyle = U.alpha('#ffffff', 0.4);
        ctx.beginPath(); ctx.arc(-1.5, -1.5, 2, 0, U.TAU); ctx.fill();
      }
    } else {
      // Schweif
      for (var i = 0; i < p.trail.length; i++) {
        var t = (i + 1) / p.trail.length;
        ctx.fillStyle = U.alpha(p.color, t * 0.35);
        ctx.beginPath(); ctx.arc(p.trail[i].x, p.trail[i].y, 1.4 + t * 2, 0, U.TAU); ctx.fill();
      }
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      if (p.kind === 'frost') {
        U.polygon(ctx, 0, 0, 4.5, 6, time * 6); ctx.fill();
      } else {
        U.roundRect(ctx, -4, -1.6, 9, 3.2, 1.6); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* -------------------------------------------------------
     EFFEKTE (Blitze, Strahlen, Explosionen, Mündungsfeuer)
     ------------------------------------------------------- */
  function drawEffect(ctx, fx, time) {
    var t = fx.life / fx.maxLife;   // 1 -> 0

    switch (fx.kind) {

      case 'lightning': {
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = fx.color; ctx.shadowBlur = 14;
        for (var pass = 0; pass < 2; pass++) {
          ctx.strokeStyle = pass === 0 ? U.alpha(fx.color, t * 0.85) : U.alpha('#ffffff', t * 0.9);
          ctx.lineWidth = pass === 0 ? 6 : 2;
          ctx.beginPath();
          for (var s = 1; s < fx.points.length; s++) {
            var a = fx.points[s - 1], b = fx.points[s];
            ctx.moveTo(a.x, a.y);
            // Gezackte Zwischenpunkte
            var segs = 4;
            for (var k = 1; k <= segs; k++) {
              var f = k / segs;
              var jx = k === segs ? 0 : (fx.seed[(s * segs + k) % fx.seed.length] - 0.5) * 14;
              var jy = k === segs ? 0 : (fx.seed[(s * segs + k + 3) % fx.seed.length] - 0.5) * 14;
              ctx.lineTo(U.lerp(a.x, b.x, f) + jx, U.lerp(a.y, b.y, f) + jy);
            }
          }
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case 'beam': {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowColor = fx.color; ctx.shadowBlur = 12;
        ctx.strokeStyle = U.alpha(fx.color, t * 0.8);
        ctx.lineWidth = (fx.crit ? 5 : 3) * t;
        ctx.beginPath(); ctx.moveTo(fx.x1, fx.y1); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
        ctx.strokeStyle = U.alpha('#ffffff', t * 0.9);
        ctx.lineWidth = (fx.crit ? 2 : 1.2) * t;
        ctx.beginPath(); ctx.moveTo(fx.x1, fx.y1); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
        ctx.restore();
        break;
      }

      case 'explosion': {
        var grow = 1 - t;
        var r = fx.r * (0.45 + grow * 0.75);
        ctx.save();
        var g2 = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, r);
        g2.addColorStop(0, U.alpha('#ffffff', t * 0.85));
        g2.addColorStop(0.35, U.alpha(fx.color, t * 0.7));
        g2.addColorStop(1, U.alpha(fx.color, 0));
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, r, 0, U.TAU); ctx.fill();
        ctx.strokeStyle = U.alpha(fx.color, t * 0.5);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, r * 0.95, 0, U.TAU); ctx.stroke();
        ctx.restore();
        break;
      }

      case 'muzzle': {
        ctx.save();
        ctx.translate(fx.x, fx.y);
        ctx.rotate(fx.angle);
        ctx.globalAlpha = t;
        ctx.fillStyle = U.alpha('#fff6d0', 0.9);
        ctx.shadowColor = fx.color; ctx.shadowBlur = 10;
        var L = 9 * fx.scale * (0.4 + t * 0.6);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(L * 1.9, -L * 0.42);
        ctx.lineTo(L * 2.5, 0);
        ctx.lineTo(L * 1.9, L * 0.42);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        break;
      }

      case 'ring': {
        ctx.save();
        ctx.strokeStyle = U.alpha(fx.color, t * 0.6);
        ctx.lineWidth = 3 * t;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r * (1 - t) + 4, 0, U.TAU); ctx.stroke();
        ctx.restore();
        break;
      }
    }
  }

  /* -------------------------------------------------------
     Bau-Overlay: Reichweite, gültige/ungültige Felder
     ------------------------------------------------------- */
  function drawBuildOverlay(ctx, g) {
    var key = g.buildKey;
    if (!key) return;
    var def = TD.TOWERS[key];
    var cell = g.hoverCell;

    // Freie Felder dezent markieren
    ctx.save();
    ctx.globalAlpha = 0.30;
    for (var cy = 0; cy < ROWS; cy++) {
      for (var cx = 0; cx < COLS; cx++) {
        if (!TD.maps.canBuild(g.map, cx, cy) || g.towerAt(cx, cy)) continue;
        ctx.fillStyle = '#7fffcf';
        U.roundRect(ctx, cx * CELL + 5, cy * CELL + 5, CELL - 10, CELL - 10, 5);
        ctx.fill();
      }
    }
    ctx.restore();

    if (!cell) return;
    var ok = g.canPlaceAt(cell.cx, cell.cy) && g.gold >= def.cost;
    var px = (cell.cx + 0.5) * CELL, py = (cell.cy + 0.5) * CELL;

    // Reichweitenkreis
    drawRangeCircle(ctx, px, py, def.range * CELL, ok ? def.color : '#ff5d73');

    // Feldmarkierung
    ctx.save();
    ctx.fillStyle = ok ? 'rgba(120,255,190,.28)' : 'rgba(255,93,115,.32)';
    ctx.strokeStyle = ok ? '#7fffcf' : '#ff5d73';
    ctx.lineWidth = 2;
    U.roundRect(ctx, cell.cx * CELL + 3, cell.cy * CELL + 3, CELL - 6, CELL - 6, 6);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Turmvorschau
    if (ok) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      drawTower(ctx, { x: px, y: py, def: def, level: 1, angle: -Math.PI / 2, recoil: 0, buildAnim: 0, chargeGlow: 0, game: g }, {});
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#ff5d73'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      var m = CELL * 0.26;
      ctx.beginPath();
      ctx.moveTo(px - m, py - m); ctx.lineTo(px + m, py + m);
      ctx.moveTo(px + m, py - m); ctx.lineTo(px - m, py + m);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawRangeCircle(ctx, x, y, r, color) {
    ctx.save();
    var g2 = ctx.createRadialGradient(x, y, r * 0.55, x, y, r);
    g2.addColorStop(0, U.alpha(color, 0.02));
    g2.addColorStop(1, U.alpha(color, 0.16));
    ctx.fillStyle = g2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = U.alpha(color, 0.65);
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.stroke();
    ctx.restore();
  }

  /* -------------------------------------------------------
     Hauptzeichenfunktion
     ------------------------------------------------------- */
  var R = TD.render = {

    invalidateBackground: function () { bgCanvas = null; bgMapId = null; },

    drawTowerIcon: function (canvas, key, size) {
      size = size || 40;
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      canvas.width = size * dpr; canvas.height = size * dpr;
      canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.translate(size / 2, size / 2);
      var s = size / (CELL * 1.15);
      ctx.scale(s, s);
      var fake = {
        x: 0, y: 0, def: TD.TOWERS[key], level: 1, angle: -Math.PI / 2,
        recoil: 0, buildAnim: 0, chargeGlow: 0.4, game: { time: 0 }
      };
      // drawTower übersetzt selbst nach tw.x/tw.y (0/0)
      drawTower(ctx, fake, {});
    },

    draw: function (ctx, g) {
      // Hintergrund bei Kartenwechsel neu aufbauen
      if (!bgCanvas || bgMapId !== g.map.id) {
        bgCanvas = buildBackground(g.map);
        bgMapId = g.map.id;
      }

      ctx.save();

      // Bildschirmerschütterung
      if (g.shake > 0) {
        ctx.translate(U.rand(-g.shake, g.shake), U.rand(-g.shake, g.shake));
      }

      ctx.drawImage(bgCanvas, 0, 0);

      if (g.airWarning) drawAirRoute(ctx, g);
      drawSpawn(ctx, g);
      drawBase(ctx, g);

      // Bau-Overlay unter den Einheiten
      drawBuildOverlay(ctx, g);

      // Reichweite des ausgewählten Turms
      if (g.selected) {
        drawRangeCircle(ctx, g.selected.x, g.selected.y, g.selected.rangePx(), g.selected.def.color);
      }

      // Türme (hintere zuerst)
      var towers = g.towers.slice().sort(function (a, b) { return a.y - b.y; });
      for (var i = 0; i < towers.length; i++) {
        drawTower(ctx, towers[i]);
        if (towers[i] === g.selected) {
          ctx.save();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          U.roundRect(ctx, towers[i].cx * CELL + 2, towers[i].cy * CELL + 2, CELL - 4, CELL - 4, 6);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Gegner (Flieger zuletzt, damit sie oben liegen)
      var ground = [], air = [];
      for (var e = 0; e < g.enemies.length; e++) {
        (g.enemies[e].flying ? air : ground).push(g.enemies[e]);
      }
      ground.sort(function (a, b) { return a.y - b.y; });
      for (var a1 = 0; a1 < ground.length; a1++) drawEnemy(ctx, ground[a1], g.time);
      for (var a2 = 0; a2 < air.length; a2++)    drawEnemy(ctx, air[a2], g.time);

      // Geschosse
      for (var p = 0; p < g.projectiles.length; p++) drawProjectile(ctx, g.projectiles[p], g.time);

      // Effekte
      for (var f = 0; f < g.effects.length; f++) drawEffect(ctx, g.effects[f], g.time);

      // Partikel
      for (var pa = 0; pa < g.particles.length; pa++) {
        var q = g.particles[pa];
        var al = U.clamp(q.life / q.maxLife, 0, 1);
        ctx.save();
        if (q.glow) { ctx.shadowColor = q.color; ctx.shadowBlur = 8; }
        ctx.fillStyle = U.alpha(q.color[0] === '#' ? q.color : '#ffffff', al);
        if (q.color[0] !== '#') ctx.fillStyle = q.color;
        ctx.globalAlpha = al;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (0.35 + al * 0.65), 0, U.TAU); ctx.fill();
        ctx.restore();
      }

      // Schadenszahlen
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var ft = 0; ft < g.texts.length; ft++) {
        var t2 = g.texts[ft];
        var al2 = U.clamp(t2.life / t2.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = al2;
        ctx.font = (t2.big ? 'bold 20px ' : 'bold 14px ') + 'Segoe UI, Roboto, sans-serif';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0,0,0,.75)';
        ctx.strokeText(t2.text, t2.x, t2.y);
        ctx.fillStyle = t2.color;
        ctx.fillText(t2.text, t2.x, t2.y);
        ctx.restore();
      }

      ctx.restore();

      // Rote Warnblende bei Lebensverlust
      if (g.hurtFlash > 0) {
        ctx.save();
        ctx.globalAlpha = g.hurtFlash * 0.5;
        var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.8);
        vg.addColorStop(0, 'rgba(255,0,40,0)');
        vg.addColorStop(1, 'rgba(255,0,40,.9)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // "Pause"-Hinweis
      if (g.paused && g.state === 'playing') {
        ctx.save();
        ctx.fillStyle = 'rgba(4,8,18,.55)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#e8edfb';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 42px Segoe UI, Roboto, sans-serif';
        ctx.fillText('PAUSE', W / 2, H / 2 - 10);
        ctx.font = '16px Segoe UI, Roboto, sans-serif';
        ctx.fillStyle = '#8ba0cc';
        ctx.fillText('Zum Fortsetzen antippen', W / 2, H / 2 + 26);
        ctx.restore();
      }
    }
  };
})(window);
