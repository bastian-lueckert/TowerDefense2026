/* =========================================================
   render.js – Alle Zeichenroutinen im Comicstil.

   Grundregeln des Stils:
   · jede Form bekommt eine kräftige dunkle Kontur
   · Flächen werden mit harten Kanten schattiert (Cel-Shading)
   · runde, leicht übertriebene Formen, satte Farben
   Sämtliche Grafik ist prozedural – keine Bilddateien nötig.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;
  var CELL = TD.GRID.CELL, COLS = TD.GRID.COLS, ROWS = TD.GRID.ROWS;
  var PAD = TD.GRID.PAD_TOP;
  var W = COLS * CELL, H = ROWS * CELL;      // Spielfeld
  var CH = H + PAD;                          // gesamte Canvashöhe

  var INK = '#231a2b';          // Konturfarbe – warmes Dunkelviolett statt Schwarz
  var bgCanvas = null, bgMapId = null;

  /* =======================================================
     Zeichenhilfen für den Comiclook
     ======================================================= */

  /** Fläche füllen und mit Kontur umranden. */
  function ink(ctx, fill, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = INK;
    ctx.lineWidth = lw == null ? 2.4 : lw;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); }

  function rrect(ctx, x, y, w, h, r) { U.roundRect(ctx, x, y, w, h, r); }

  /** Kugel mit Glanzlicht und Schattenkante. */
  function blob(ctx, x, y, r, color, lw) {
    circle(ctx, x, y, r);
    ink(ctx, color, lw);
    // Schattenseite
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 0.15, Math.PI * 0.85); ctx.closePath();
    ctx.clip();
    circle(ctx, x, y, r);
    ctx.fillStyle = U.alpha('#000000', 0.16); ctx.fill();
    ctx.restore();
    // Glanzlicht
    circle(ctx, x - r * 0.32, y - r * 0.34, r * 0.28);
    ctx.fillStyle = U.alpha('#ffffff', 0.45); ctx.fill();
  }

  /** Comic-Augen – geben Gegnern sofort Charakter. */
  function eyes(ctx, x, y, r, look, angry) {
    var sp = r * 0.42;
    [-1, 1].forEach(function (s) {
      circle(ctx, x + s * sp, y, r * 0.34);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
      circle(ctx, x + s * sp + (look || 0) * r * 0.12, y + r * 0.04, r * 0.16);
      ctx.fillStyle = INK; ctx.fill();
    });
    if (angry) {
      ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      [-1, 1].forEach(function (s) {
        ctx.beginPath();
        ctx.moveTo(x + s * sp - s * r * 0.3, y - r * 0.55);
        ctx.lineTo(x + s * sp + s * r * 0.22, y - r * 0.34);
        ctx.stroke();
      });
    }
  }

  /* =======================================================
     HINTERGRUND (einmal je Karte gerendert)
     ======================================================= */
  function buildBackground(map) {
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var ctx = c.getContext('2d');
    var th = map.theme;
    var rnd = U.rng(9182 + map.id.length * 77);

    // Grundfläche
    var grd = ctx.createLinearGradient(0, 0, W * 0.5, H);
    grd.addColorStop(0, th.grass2);
    grd.addColorStop(1, th.grass);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Weiche Farbflecken für Tiefe
    for (var i = 0; i < 90; i++) {
      var x = rnd() * W, y = rnd() * H, r = 26 + rnd() * 70;
      ctx.fillStyle = U.alpha(rnd() < 0.5 ? '#000000' : '#ffffff', 0.03 + rnd() * 0.03);
      ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.5 + rnd() * 0.4), rnd() * Math.PI, 0, U.TAU); ctx.fill();
    }

    // Grasbüschel bzw. Bodenkringel – der typische Comic-Bodenschmuck
    for (var g2 = 0; g2 < 190; g2++) {
      var gx = rnd() * W, gy = rnd() * H;
      var onPath = false;
      for (var pi = 0; pi < map.paths.length && !onPath; pi++) {
        var ppts = map.paths[pi].points;
        for (var s2 = 1; s2 < ppts.length; s2++) {
          if (segDist(gx, gy, ppts[s2-1], ppts[s2]) < TD.PATH_W * 0.75) { onPath = true; break; }
        }
      }
      if (onPath) continue;
      tuft(ctx, gx, gy, 4 + rnd() * 5, th.deco, rnd);
    }

    /* Wege: erst alle Konturen, dann alle Flächen – sonst würden
       sich kreuzende Wege gegenseitig durchschneiden. */
    drawAllPaths(ctx, map, INK, TD.PATH_W + 9);
    drawAllPaths(ctx, map, th.pathEdge, TD.PATH_W + 4);
    drawAllPaths(ctx, map, th.path, TD.PATH_W - 2);

    // Kieselsteine auf den Wegen
    map.paths.forEach(function (pth, pi) {
      var n = Math.round(120 / map.paths.length);
      for (var k = 0; k < n; k++) {
        var d = rnd() * pth.length;
        var p = TD.maps.pointAt(map, pi, d);
        var off = (rnd() - 0.5) * (TD.PATH_W - 14);
        var px = p.x + Math.cos(p.angle + Math.PI / 2) * off;
        var py = p.y + Math.sin(p.angle + Math.PI / 2) * off;
        circle(ctx, px, py, 1.6 + rnd() * 2.6);
        ctx.fillStyle = U.alpha(rnd() < 0.5 ? '#ffffff' : '#000000', 0.14);
        ctx.fill();
      }
    });

    // Deko mit Kontur
    map.decor.forEach(function (dc) {
      var x2 = (dc.cx + 0.5) * CELL, y2 = (dc.cy + 0.5) * CELL;
      if (dc.kind === 'rock') drawRock(ctx, x2, y2, CELL * 0.32 * dc.scale, th.rock);
      else                    drawTree(ctx, x2, y2, CELL * 0.34 * dc.scale, th.deco);
    });

    // Vignette
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.98);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.34)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    return c;
  }

  function segDist(px, py, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
    var t = l2 ? U.clamp(((px - a.x) * dx + (py - a.y) * dy) / l2, 0, 1) : 0;
    return U.dist(px, py, a.x + dx * t, a.y + dy * t);
  }

  function tuft(ctx, x, y, h, color, rnd) {
    ctx.strokeStyle = U.alpha(color, 0.55);
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (var i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 3, y);
      ctx.quadraticCurveTo(x + i * 4, y - h * 0.7, x + i * 5 + (rnd() - 0.5) * 3, y - h);
      ctx.stroke();
    }
  }

  /** Zeichnet alle Wege der Karte in einem Zug. */
  function drawAllPaths(ctx, map, color, width) {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = color; ctx.lineWidth = width;
    map.paths.forEach(function (p) {
      ctx.beginPath();
      ctx.moveTo(p.points[0].x, p.points[0].y);
      for (var i = 1; i < p.points.length; i++) ctx.lineTo(p.points[i].x, p.points[i].y);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawRock(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath(); ctx.ellipse(2, r * 0.55, r * 1.0, r * 0.32, 0, 0, U.TAU);
    ctx.fillStyle = U.alpha('#000000', 0.25); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.4);
    ctx.lineTo(-r * 0.72, -r * 0.45);
    ctx.lineTo(-r * 0.1, -r * 0.85);
    ctx.lineTo(r * 0.65, -r * 0.4);
    ctx.lineTo(r, r * 0.4);
    ctx.closePath();
    ink(ctx, color, 2.6);
    ctx.beginPath();
    ctx.moveTo(-r * 0.72, -r * 0.45);
    ctx.lineTo(-r * 0.1, -r * 0.85);
    ctx.lineTo(r * 0.1, -r * 0.2);
    ctx.closePath();
    ctx.fillStyle = U.alpha('#ffffff', 0.22); ctx.fill();
    ctx.restore();
  }

  function drawTree(ctx, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath(); ctx.ellipse(2, r * 0.7, r * 0.95, r * 0.3, 0, 0, U.TAU);
    ctx.fillStyle = U.alpha('#000000', 0.25); ctx.fill();
    rrect(ctx, -r * 0.15, -r * 0.1, r * 0.3, r * 0.8, r * 0.1);
    ink(ctx, '#5b3d24', 2.2);
    // Krone aus drei überlappenden Kugeln
    blob(ctx, -r * 0.42, -r * 0.35, r * 0.5, color, 2.6);
    blob(ctx,  r * 0.42, -r * 0.35, r * 0.5, color, 2.6);
    blob(ctx, 0, -r * 0.75, r * 0.6, U.shade(color, 0.1), 2.6);
    ctx.restore();
  }

  /* =======================================================
     BESONDERE FELDER
     ======================================================= */
  function drawSpecialTiles(ctx, g) {
    g.map.specialList.forEach(function (sp) {
      var def = TD.SPECIAL_TILES[sp.type];
      var x = (sp.cx + 0.5) * CELL, y = (sp.cy + 0.5) * CELL;
      var occupied = g.towerAt(sp.cx, sp.cy);
      var pulse = 0.5 + Math.sin(g.time * 2 + sp.rot) * 0.5;

      ctx.save();
      ctx.globalAlpha = occupied ? 0.35 : 1;

      // Kachel
      rrect(ctx, x - CELL * 0.42, y - CELL * 0.42, CELL * 0.84, CELL * 0.84, 9);
      ctx.fillStyle = U.alpha(def.color, 0.5);
      ctx.fill();
      ctx.strokeStyle = def.glow;
      ctx.lineWidth = 2.4;
      ctx.setLineDash([6, 4]);
      ctx.lineDashOffset = -g.time * 12;
      ctx.stroke();
      ctx.setLineDash([]);

      if (!occupied) {
        // Symbol mit sanftem Pulsieren
        ctx.globalAlpha = 0.75 + pulse * 0.25;
        ctx.fillStyle = def.glow;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 3;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 22px Segoe UI, Roboto, sans-serif';
        ctx.strokeText(def.icon, x, y - 1);
        ctx.fillText(def.icon, x, y - 1);
      }
      ctx.restore();
    });
  }

  /* =======================================================
     LOOTBOX
     ======================================================= */
  function drawLootbox(ctx, box, time) {
    var s = 1 + box.spawnAnim * 0.8;
    var bob = Math.sin(box.bob) * 3;
    var fade = box.life < 5 ? (0.35 + 0.65 * Math.abs(Math.sin(time * 6))) : 1;

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(box.x, box.y + bob);
    ctx.scale(s, s);

    // Schatten
    ctx.beginPath(); ctx.ellipse(2, 20 - bob * 0.5, 17, 5.5, 0, 0, U.TAU);
    ctx.fillStyle = U.alpha('#000000', 0.3); ctx.fill();

    // Lichtschein
    var glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
    glow.addColorStop(0, U.alpha('#ffd166', 0.4));
    glow.addColorStop(1, U.alpha('#ffd166', 0));
    ctx.fillStyle = glow;
    circle(ctx, 0, 0, 34); ctx.fill();

    // Truhenkörper
    rrect(ctx, -16, -2, 32, 18, 3);
    ink(ctx, '#a0653a', 2.6);
    // Deckel
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.quadraticCurveTo(0, -20, 16, -2);
    ctx.closePath();
    ink(ctx, '#c07f4a', 2.6);
    // Beschläge
    ctx.fillStyle = '#ffd166';
    rrect(ctx, -18, -4, 36, 5, 2); ink(ctx, '#ffd166', 2);
    rrect(ctx, -4, -6, 8, 12, 2);  ink(ctx, '#ffd166', 2);
    circle(ctx, 0, 3, 2.1); ctx.fillStyle = INK; ctx.fill();

    // Fragezeichen darüber
    ctx.globalAlpha = fade * (0.75 + 0.25 * Math.sin(time * 4));
    ctx.font = 'bold 20px Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.strokeText('?', 0, -30);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText('?', 0, -30);

    ctx.restore();
  }

  /* =======================================================
     BASIS UND PORTAL
     ======================================================= */
  function drawBase(ctx, g) {
    var b = g.map.basePx, t = g.time;
    var health = g.lives / g.maxLives;
    var col = health > 0.5 ? '#45e08a' : (health > 0.25 ? '#ffc945' : '#ff5d73');
    var fc = g.faction ? g.faction.colors : { primary: '#4a7fc1', trim: '#e8d9a0' };

    ctx.save();
    ctx.translate(b.x, b.y);

    var pulse = 0.5 + Math.sin(t * 2) * 0.5;
    ctx.strokeStyle = U.alpha(col, 0.2 + pulse * 0.25);
    ctx.lineWidth = 3;
    circle(ctx, 0, 0, CELL * (0.68 + pulse * 0.08)); ctx.stroke();

    ctx.beginPath(); ctx.ellipse(2, CELL * 0.34, CELL * 0.46, CELL * 0.16, 0, 0, U.TAU);
    ctx.fillStyle = U.alpha('#000000', 0.32); ctx.fill();

    // Festungsstumpf mit Zinnen
    ctx.beginPath();
    ctx.moveTo(-CELL * 0.4, CELL * 0.3);
    ctx.lineTo(-CELL * 0.32, -CELL * 0.16);
    ctx.lineTo(CELL * 0.32, -CELL * 0.16);
    ctx.lineTo(CELL * 0.4, CELL * 0.3);
    ctx.closePath();
    ink(ctx, fc.stone || '#8d93a6', 2.8);

    for (var i = -1; i <= 1; i++) {
      rrect(ctx, i * CELL * 0.22 - CELL * 0.08, -CELL * 0.3, CELL * 0.16, CELL * 0.16, 2);
      ink(ctx, fc.stone || '#8d93a6', 2.2);
    }

    // Kristall
    ctx.save();
    ctx.rotate(t * 0.7);
    ctx.beginPath();
    ctx.moveTo(0, -CELL * 0.2); ctx.lineTo(CELL * 0.13, 0);
    ctx.lineTo(0, CELL * 0.2);  ctx.lineTo(-CELL * 0.13, 0);
    ctx.closePath();
    ctx.shadowColor = col; ctx.shadowBlur = 14;
    ink(ctx, col, 2.4);
    ctx.restore();

    ctx.restore();
  }

  /** Ein Portal je Weg – so ist sofort klar, wo Gegner auftauchen. */
  function drawSpawns(ctx, g) {
    var t = g.time;
    g.map.spawns.forEach(function (s, idx) {
      ctx.save();
      ctx.translate(s.x, s.y);
      for (var i = 0; i < 3; i++) {
        var p = ((t * 0.5 + i / 3 + idx * 0.17) % 1);
        ctx.strokeStyle = U.alpha('#ff6a6a', (1 - p) * 0.45);
        ctx.lineWidth = 3;
        circle(ctx, 0, 0, CELL * (0.18 + p * 0.5)); ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(0, 0, CELL * 0.2, CELL * 0.3, 0, 0, U.TAU);
      ink(ctx, '#3a1424', 2.6);
      // Nummer, wenn es mehrere Portale gibt
      if (g.map.spawns.length > 1) {
        ctx.fillStyle = '#ffc3cc';
        ctx.font = 'bold 12px Segoe UI, Roboto, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), 0, 1);
      }
      ctx.restore();
    });
  }

  /* =======================================================
     TÜRME – Sockel je Spielerklasse, Waffe je Rolle
     ======================================================= */

  function drawTower(ctx, tw) {
    var d = tw.def;
    var fc = d.factionColors || TD.factions.get(d.faction || 'medieval').colors;
    var build = tw.buildAnim || 0;

    if (d.hero) { drawHero(ctx, tw, fc); return; }

    ctx.save();
    ctx.translate(tw.x, tw.y);
    if (build > 0) {
      var s = 1 + build * 0.4;
      ctx.scale(s, s);
      ctx.globalAlpha = 1 - build * 0.45;
    }

    // Schatten
    ctx.beginPath(); ctx.ellipse(2, CELL * 0.34, CELL * 0.4, CELL * 0.15, 0, 0, U.TAU);
    ctx.fillStyle = U.alpha('#000000', 0.34); ctx.fill();

    // Standplatte – hebt den Turm klar vom Untergrund ab
    circle(ctx, 0, CELL * 0.08, CELL * 0.44);
    ink(ctx, '#5f5540', 2.8);
    circle(ctx, 0, CELL * 0.05, CELL * 0.37);
    ctx.fillStyle = '#7b6e52'; ctx.fill();
    circle(ctx, 0, CELL * 0.02, CELL * 0.3);
    ctx.fillStyle = U.alpha('#ffffff', 0.09); ctx.fill();

    // Der eigentliche Turm etwas größer, damit die Bauart erkennbar bleibt
    ctx.save();
    ctx.scale(1.16, 1.16);
    drawPlinth(ctx, d.faction, fc, tw.level);

    // Die Waffe sitzt oberhalb des Sockels – erst dadurch wird die
    // Silhouette lesbar und der Turm sieht nicht platt gedrückt aus.
    ctx.save();
    ctx.translate(0, -CELL * 0.2);
    ctx.rotate(tw.angle);
    ctx.translate(-(tw.recoil || 0) * 3.5, 0);
    drawWeapon(ctx, d.role, d.faction, d, tw);
    ctx.restore();
    ctx.restore();

    drawLevelPips(ctx, tw.level, fc);
    ctx.restore();
  }

  /* -------------------------------------------------------
     HELD – eine Figur statt eines Turms
     ------------------------------------------------------- */
  function drawHero(ctx, tw, fc) {
    var d = tw.def;
    var t = tw.game.time;
    var build = tw.buildAnim || 0;
    var ready = tw.power && tw.powerTimer <= 0;
    var flash = tw.powerFlash || 0;

    ctx.save();
    ctx.translate(tw.x, tw.y);
    if (build > 0) {
      var s = 1 + build * 0.5;
      ctx.scale(s, s);
      ctx.globalAlpha = 1 - build * 0.4;
    }

    // Schatten
    ctx.beginPath(); ctx.ellipse(2, CELL * 0.34, CELL * 0.38, CELL * 0.14, 0, 0, U.TAU);
    ctx.fillStyle = U.alpha('#000000', 0.36); ctx.fill();

    // Wirkungskreis der Aura, wenn die Klasse eine hat
    if (tw.game.heroAura) {
      var pulse = 0.5 + Math.sin(t * 1.6) * 0.5;
      ctx.strokeStyle = U.alpha(fc.trim || '#ffd166', 0.10 + pulse * 0.10);
      ctx.lineWidth = 2;
      circle(ctx, 0, 0, TD.HERO_AURA_R); ctx.stroke();
    }

    // Podest mit Wappenring
    circle(ctx, 0, CELL * 0.1, CELL * 0.42);
    ink(ctx, '#5f5540', 2.8);
    circle(ctx, 0, CELL * 0.07, CELL * 0.34);
    ctx.fillStyle = fc.secondary || '#2b4b78'; ctx.fill();
    circle(ctx, 0, CELL * 0.05, CELL * 0.26);
    ctx.fillStyle = U.alpha('#ffffff', 0.1); ctx.fill();

    // Goldener Ring, der bei bereiter Fähigkeit aufleuchtet
    ctx.strokeStyle = ready ? '#ffe9a8' : U.alpha('#ffd166', 0.45);
    ctx.lineWidth = ready ? 3 : 2;
    if (ready) { ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 10 + Math.sin(t * 5) * 6; }
    circle(ctx, 0, CELL * 0.08, CELL * 0.4); ctx.stroke();
    ctx.shadowBlur = 0;

    // Leichtes Wippen, damit die Figur lebendig wirkt
    var bob = Math.sin(t * 2.2) * 1.3;
    ctx.translate(0, -CELL * 0.2 + bob);

    // Waffe zuerst – sie liegt hinter der Figur und zeigt zum Ziel
    ctx.save();
    ctx.rotate(tw.angle);
    ctx.translate(2, 3);
    drawHeroWeapon(ctx, TD.factions.get(d.faction).hero.weapon, fc, tw, flash);
    ctx.restore();

    // Umhang, der hinter den Schultern hervorschaut
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.quadraticCurveTo(-12, 12, -5, 16);
    ctx.lineTo(5, 16);
    ctx.quadraticCurveTo(12, 12, 10, 0);
    ctx.closePath();
    ink(ctx, fc.primary, 2.4);

    // Schultern: breit und flach, das liest sich von oben am besten
    ctx.beginPath();
    ctx.ellipse(0, 3, 10, 7.5, 0, 0, U.TAU);
    ink(ctx, fc.stone || '#9aa5bd', 2.6);
    ctx.beginPath();
    ctx.ellipse(0, 2, 7, 5, 0, 0, U.TAU);
    ctx.fillStyle = U.alpha('#ffffff', 0.14); ctx.fill();

    // Kopf – groß genug, um als solcher erkannt zu werden
    circle(ctx, 0, -6, 7);
    ink(ctx, '#e8b487', 2.6);
    // Gesichtszüge
    ctx.fillStyle = INK;
    circle(ctx, -2.6, -6.5, 1.2); ctx.fill();
    circle(ctx, 2.6, -6.5, 1.2); ctx.fill();

    // Kopfbedeckung je nach Volk
    drawHeroHead(ctx, d.faction, fc, t);

    ctx.restore();

    // Stufensterne
    ctx.save();
    ctx.translate(tw.x, tw.y);
    drawLevelPips(ctx, tw.level, fc);
    ctx.restore();

    // Aufblitzen beim Einsatz der Fähigkeit
    if (flash > 0) {
      ctx.save();
      ctx.globalAlpha = flash * 0.6;
      ctx.strokeStyle = (tw.power && tw.power.color) || '#ffd166';
      ctx.lineWidth = 4 * flash;
      circle(ctx, tw.x, tw.y, CELL * (0.6 + (1 - flash) * 1.4));
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Kopfbedeckung – das auffälligste Erkennungszeichen von oben. */
  function drawHeroHead(ctx, faction, fc, t) {
    switch (faction) {

      case 'viking':                                   // Rundhelm ohne Hörner, rote Zöpfe
        [-1, 1].forEach(function (s) {
          ctx.beginPath();
          ctx.ellipse(s * 7.5, -1, 2.6, 5, s * 0.3, 0, U.TAU);
          ink(ctx, '#b0552a', 2);
        });
        ctx.beginPath();
        ctx.arc(0, -6, 7.4, Math.PI * 0.92, Math.PI * 0.08);
        ctx.closePath();
        ink(ctx, '#9fa8b8', 2.4);
        rrect(ctx, -1.4, -12, 2.8, 7, 1.2);            // Nasensteg
        ink(ctx, '#c98a3a', 1.8);
        break;

      case 'roman':                                    // Bronzehelm mit rotem Querkamm
        ctx.beginPath();
        ctx.arc(0, -6, 7.4, Math.PI * 0.92, Math.PI * 0.08);
        ctx.closePath();
        ink(ctx, '#c9a24a', 2.4);
        [-1, 1].forEach(function (s) {                 // Wangenklappen
          ctx.beginPath();
          ctx.ellipse(s * 6.2, -4, 2.2, 4, 0, 0, U.TAU);
          ink(ctx, '#b3902f', 1.8);
        });
        ctx.beginPath();                               // Querkamm
        ctx.moveTo(-8.5, -9);
        ctx.quadraticCurveTo(0, -16, 8.5, -9);
        ctx.quadraticCurveTo(0, -12, -8.5, -9);
        ctx.closePath();
        ink(ctx, '#a83232', 2.2);
        break;

      case 'japan':                                    // Hochgebundenes Haar mit Stirnband
        [-1, 1].forEach(function (s) {                 // Schmale Strähnen neben dem Gesicht
          ctx.beginPath();
          ctx.ellipse(s * 8.2, -4, 1.9, 4.6, s * 0.25, 0, U.TAU);
          ink(ctx, '#241a2b', 1.8);
        });
        ctx.beginPath();                               // Haaransatz, hoch genug fürs Gesicht
        ctx.arc(0, -8.5, 7.2, Math.PI * 0.95, Math.PI * 0.05);
        ctx.closePath();
        ink(ctx, '#241a2b', 2.2);
        circle(ctx, 0, -14.5, 3.2);                    // Haarknoten
        ink(ctx, '#241a2b', 2.2);
        rrect(ctx, -7.6, -10.5, 15.2, 2.6, 1.2);       // Stirnband
        ctx.fillStyle = fc.primary || '#b03a4a'; ctx.fill();
        circle(ctx, 0, -9.2, 1.4);                     // Wappenscheibe
        ctx.fillStyle = '#e0b24a'; ctx.fill();
        break;

      case 'egyptian':                                 // Nemes-Kopftuch
        [-1, 1].forEach(function (s) {                 // Seitenlappen
          ctx.beginPath();
          ctx.moveTo(s * 5, -10);
          ctx.lineTo(s * 10, -6);
          ctx.lineTo(s * 9, 4);
          ctx.lineTo(s * 4, 0);
          ctx.closePath();
          ink(ctx, fc.secondary || '#2f6f8a', 2.2);
        });
        ctx.beginPath();
        ctx.arc(0, -6, 7.6, Math.PI * 0.95, Math.PI * 0.05);
        ctx.closePath();
        ink(ctx, fc.secondary || '#2f6f8a', 2.4);
        rrect(ctx, -7.6, -8.5, 15.2, 2.6, 1.2);        // Goldband
        ctx.fillStyle = '#e0b24a'; ctx.fill();
        circle(ctx, 0, -11, 2);                        // Uräus
        ink(ctx, '#e0b24a', 1.6);
        break;

      default:                                         // Ritterhelm mit Federbusch
        ctx.beginPath();
        ctx.arc(0, -6, 7.4, Math.PI * 0.92, Math.PI * 0.08);
        ctx.closePath();
        ink(ctx, '#9aa5bd', 2.4);
        rrect(ctx, -1.5, -12, 3, 8, 1.2);              // Nasenschutz
        ink(ctx, '#6a7590', 1.8);
        ctx.beginPath();                               // Federbusch
        ctx.ellipse(0, -14, 3.4, 5, Math.sin(t * 2) * 0.18, 0, U.TAU);
        ink(ctx, '#c1402f', 2.2);
        break;
    }
  }

  function drawHeroWeapon(ctx, weapon, fc, tw, flash) {
    var lvl = tw.level;
    switch (weapon) {

      case 'axe':                                      // Streitaxt
        rrect(ctx, 3, -1.4, 15 + lvl, 2.8, 1.4);
        ink(ctx, '#8a6134', 2);
        ctx.beginPath();
        ctx.moveTo(15 + lvl, -7);
        ctx.quadraticCurveTo(23 + lvl, -3, 22 + lvl, 4);
        ctx.lineTo(15 + lvl, 3);
        ctx.closePath();
        ink(ctx, '#c3ccda', 2.2);
        break;

      case 'gladius':                                  // Kurzschwert und Adler
        rrect(ctx, 3, -1.6, 16 + lvl, 3.2, 1.2);
        ink(ctx, '#dfe6f0', 2);
        rrect(ctx, 1, -4, 2.5, 8, 1);
        ink(ctx, '#c9a24a', 1.8);
        break;

      case 'naginata':                                 // Stangenklinge
        rrect(ctx, -6, -1.4, 20 + lvl, 2.8, 1.4);
        ink(ctx, '#6d4a2a', 2);
        ctx.beginPath();                               // geschwungene Klinge
        ctx.moveTo(13 + lvl, -1.6);
        ctx.quadraticCurveTo(22 + lvl, -6, 26 + lvl, -2);
        ctx.quadraticCurveTo(21 + lvl, 0, 13 + lvl, 2);
        ctx.closePath();
        ink(ctx, '#e6ecf5', 2.2);
        rrect(ctx, 11 + lvl, -2.6, 2.4, 5.2, 1);       // Zwinge
        ink(ctx, '#c9a24a', 1.6);
        break;

      case 'staff':                                    // Stab mit Sonnenscheibe
        rrect(ctx, 2, -1.2, 16 + lvl, 2.4, 1.2);
        ink(ctx, '#b8925a', 2);
        var glow = 0.5 + Math.sin(tw.game.time * 3) * 0.3 + flash * 0.6;
        ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 8 + glow * 12;
        circle(ctx, 20 + lvl, 0, 4.6);
        ink(ctx, '#ffe9a8', 2.2);
        ctx.shadowBlur = 0;
        for (var r = 0; r < 6; r++) {
          var a = r / 6 * U.TAU + tw.game.time * 0.6;
          ctx.beginPath();
          ctx.moveTo(20 + lvl + Math.cos(a) * 6, Math.sin(a) * 6);
          ctx.lineTo(20 + lvl + Math.cos(a) * 8.5, Math.sin(a) * 8.5);
          ctx.strokeStyle = U.alpha('#ffd166', 0.9); ctx.lineWidth = 1.8;
          ctx.lineCap = 'round'; ctx.stroke();
        }
        break;

      default:                                         // Langbogen
        ctx.beginPath();
        ctx.moveTo(6, -11 - lvl);
        ctx.quadraticCurveTo(16 + lvl, 0, 6, 11 + lvl);
        ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
        ctx.strokeStyle = '#6d4a2a'; ctx.lineWidth = 2.2; ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(6, -11 - lvl); ctx.lineTo(6, 11 + lvl);
        ctx.strokeStyle = U.alpha('#ffffff', 0.7); ctx.lineWidth = 1.2; ctx.stroke();
        rrect(ctx, 2, -1, 16 + lvl, 2, 1);
        ink(ctx, '#fff2c8', 1.6);
        break;
    }
  }

  /** Unterbau – trägt die Handschrift der Spielerklasse. */
  function drawPlinth(ctx, faction, fc, level) {
    var r = CELL * 0.34;
    ctx.save();

    switch (faction) {

      case 'viking': {
        // Rundschild auf Holzbohlen
        rrect(ctx, -r, -r * 0.35, r * 2, r * 0.95, 4);
        ink(ctx, '#8a6134', 2.6);
        for (var b = -1; b <= 1; b++) {
          ctx.beginPath();
          ctx.moveTo(b * r * 0.55, -r * 0.35);
          ctx.lineTo(b * r * 0.55, r * 0.6);
          ctx.strokeStyle = U.alpha(INK, 0.5); ctx.lineWidth = 1.6; ctx.stroke();
        }
        circle(ctx, 0, -r * 0.1, r * 0.7);
        ink(ctx, fc.primary, 2.8);
        circle(ctx, 0, -r * 0.1, r * 0.44);
        ctx.fillStyle = U.alpha('#ffffff', 0.18); ctx.fill();
        circle(ctx, 0, -r * 0.1, r * 0.2);
        ink(ctx, fc.trim, 2);
        break;
      }

      case 'roman': {
        // Marmorstufen mit rotem Band
        rrect(ctx, -r, r * 0.05, r * 2, r * 0.55, 3);
        ink(ctx, U.shade(fc.stone, -0.1), 2.6);
        rrect(ctx, -r * 0.8, -r * 0.45, r * 1.6, r * 0.6, 3);
        ink(ctx, fc.stone, 2.6);
        // Säulchen
        [-1, 1].forEach(function (s) {
          rrect(ctx, s * r * 0.55 - r * 0.11, -r * 0.85, r * 0.22, r * 0.5, 2);
          ink(ctx, '#f2ecdc', 2);
        });
        rrect(ctx, -r * 0.8, -r * 0.2, r * 1.6, r * 0.14, 2);
        ctx.fillStyle = fc.trim; ctx.fill();
        break;
      }

      case 'japan': {
        // Steinsockel mit geschwungenem Ziegeldach
        ctx.beginPath();
        ctx.moveTo(-r, r * 0.6);
        ctx.lineTo(-r * 0.7, -r * 0.1);
        ctx.lineTo(r * 0.7, -r * 0.1);
        ctx.lineTo(r, r * 0.6);
        ctx.closePath();
        ink(ctx, fc.stone, 2.8);
        // Dach mit hochgezogenen Ecken
        ctx.beginPath();
        ctx.moveTo(-r * 1.15, -r * 0.15);
        ctx.quadraticCurveTo(-r * 0.5, -r * 0.62, 0, -r * 0.62);
        ctx.quadraticCurveTo(r * 0.5, -r * 0.62, r * 1.15, -r * 0.15);
        ctx.quadraticCurveTo(r * 0.5, -r * 0.34, 0, -r * 0.34);
        ctx.quadraticCurveTo(-r * 0.5, -r * 0.34, -r * 1.15, -r * 0.15);
        ctx.closePath();
        ink(ctx, fc.secondary, 2.6);
        // Firstbalken
        rrect(ctx, -r * 0.66, -r * 0.56, r * 1.32, r * 0.14, 2);
        ctx.fillStyle = fc.primary; ctx.fill();
        break;
      }

      case 'egyptian': {
        // Trapezförmiger Sandsteinblock mit Farbband
        ctx.beginPath();
        ctx.moveTo(-r, r * 0.55);
        ctx.lineTo(-r * 0.66, -r * 0.5);
        ctx.lineTo(r * 0.66, -r * 0.5);
        ctx.lineTo(r, r * 0.55);
        ctx.closePath();
        ink(ctx, fc.stone, 2.8);
        rrect(ctx, -r * 0.72, -r * 0.28, r * 1.44, r * 0.16, 2);
        ctx.fillStyle = fc.secondary; ctx.fill();
        rrect(ctx, -r * 0.72, r * 0.05, r * 1.44, r * 0.12, 2);
        ctx.fillStyle = fc.trim; ctx.fill();
        break;
      }

      default: {   // medieval – Steinturm mit Zinnen
        rrect(ctx, -r * 0.86, -r * 0.5, r * 1.72, r * 1.1, 4);
        ink(ctx, fc.stone, 2.8);
        for (var i = -1; i <= 1; i++) {
          rrect(ctx, i * r * 0.56 - r * 0.2, -r * 0.72, r * 0.4, r * 0.28, 2);
          ink(ctx, fc.stone, 2.2);
        }
        // Mauerfugen
        ctx.strokeStyle = U.alpha(INK, 0.35); ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.86, r * 0.05); ctx.lineTo(r * 0.86, r * 0.05);
        ctx.moveTo(-r * 0.2, r * 0.05);  ctx.lineTo(-r * 0.2, r * 0.6);
        ctx.moveTo(r * 0.38, -r * 0.5);  ctx.lineTo(r * 0.38, r * 0.05);
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }

  /** Sterne auf der Standplatte zeigen die Ausbaustufe. */
  function drawLevelPips(ctx, level, fc) {
    if (level <= 1) return;
    var n = level - 1;
    for (var i = 0; i < n; i++) {
      var x = (i - (n - 1) / 2) * 9;
      var y = CELL * 0.36;
      star(ctx, x, y, 4.4);
      ink(ctx, '#ffd166', 1.8);
    }
  }

  function star(ctx, x, y, r) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var rad = i % 2 ? r * 0.45 : r;
      var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  /**
   * Waffenaufsatz. Die Rolle bestimmt die Bauart, die Spielerklasse
   * die Ausführung – so bleibt die Funktion erkennbar und jedes Volk
   * hat trotzdem sein eigenes Gesicht.
   */
  function drawWeapon(ctx, role, faction, d, tw) {
    var lvl = tw.level;
    var c = d.color, dark = U.shade(d.color, -0.4);
    var fc = d.factionColors;
    var wood = faction === 'viking' ? '#8a6134' : (faction === 'egyptian' ? '#b8925a' : '#6d4a2a');
    var metal = faction === 'roman' ? '#d9cfa8' : '#b9c2d0';

    switch (role) {

      /* ---------- Schnellfeuer ---------- */
      case 'rapid': {
        if (faction === 'viking') {                 // Speerbündel
          for (var s = -1; s <= 1; s++) {
            ctx.save(); ctx.rotate(s * 0.16);
            rrect(ctx, 2, -1.5, 20 + lvl * 2, 3, 1.5);
            ink(ctx, wood, 1.8);
            ctx.beginPath();
            ctx.moveTo(22 + lvl * 2, -4); ctx.lineTo(29 + lvl * 2, 0); ctx.lineTo(22 + lvl * 2, 4);
            ctx.closePath(); ink(ctx, metal, 1.8);
            ctx.restore();
          }
          circle(ctx, -2, 0, 8); ink(ctx, fc.primary, 2.4);
        } else if (faction === 'roman') {           // Ballista
          rrect(ctx, -8, -7, 15, 14, 3); ink(ctx, wood, 2.4);
          [-1, 1].forEach(function (s2) {           // Torsionsbündel
            circle(ctx, 4, s2 * 7, 4); ink(ctx, metal, 2);
          });
          ctx.beginPath();
          ctx.moveTo(4, -10); ctx.quadraticCurveTo(16 + lvl, 0, 4, 10);
          ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
          rrect(ctx, 2, -1.6, 20 + lvl * 2, 3.2, 1.5); ink(ctx, metal, 2);
        } else if (faction === 'japan') {           // Yumi – asymmetrischer Langbogen
          rrect(ctx, -7, -6, 13, 12, 3); ink(ctx, fc.secondary, 2.4);
          ctx.beginPath();
          ctx.moveTo(8, -14 - lvl);
          ctx.quadraticCurveTo(17 + lvl, -4, 8, 8 + lvl);   // Griff im unteren Drittel
          ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
          ctx.strokeStyle = '#6d4a2a'; ctx.lineWidth = 2.2; ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(8, -14 - lvl); ctx.lineTo(8, 8 + lvl);
          ctx.strokeStyle = U.alpha('#ffffff', 0.7); ctx.lineWidth = 1.2; ctx.stroke();
          rrect(ctx, 3, -1.2, 16 + lvl, 2.4, 1.2); ink(ctx, '#fff2c8', 1.6);
        } else if (faction === 'egyptian') {        // Bogenschütze auf Pfeiler
          rrect(ctx, -7, -8, 13, 16, 3); ink(ctx, fc.stone, 2.4);
          rrect(ctx, -5, -5, 9, 10, 2); ink(ctx, fc.secondary, 1.8);
          ctx.beginPath();
          ctx.moveTo(6, -9); ctx.quadraticCurveTo(18 + lvl, 0, 6, 9);
          ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.stroke();
          ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
          rrect(ctx, 4, -1.2, 16 + lvl, 2.4, 1.2); ink(ctx, '#fff2c8', 1.6);
        } else {                                    // Mittelalter: Armbrust
          rrect(ctx, -8, -6, 16, 12, 4); ink(ctx, fc.primary, 2.4);
          rrect(ctx, 2, -1.8, 18 + lvl * 2, 3.6, 1.8); ink(ctx, wood, 2);
          ctx.beginPath();
          ctx.moveTo(10, -9 - lvl); ctx.quadraticCurveTo(15, 0, 10, 9 + lvl);
          ctx.strokeStyle = metal; ctx.lineWidth = 3.4; ctx.stroke();
          ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
        }
        break;
      }

      /* ---------- Verlangsamung ---------- */
      case 'slow': {
        if (faction === 'viking') {                 // Runenstein
          ctx.beginPath();
          ctx.moveTo(-8, 9); ctx.lineTo(-6, -10); ctx.lineTo(7, -11); ctx.lineTo(9, 9);
          ctx.closePath(); ink(ctx, '#9aa7b8', 2.6);
          ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-2, -7); ctx.lineTo(-2, 5); ctx.moveTo(-2, -3); ctx.lineTo(4, -7);
          ctx.moveTo(-2, 1); ctx.lineTo(4, -3);
          ctx.stroke();
        } else if (faction === 'roman') {           // Wasserbecken
          rrect(ctx, -9, -6, 19, 12, 3); ink(ctx, fc.stone, 2.4);
          rrect(ctx, -6, -3.5, 13, 7, 2); ink(ctx, c, 2);
          for (var w = 0; w < 3; w++) {             // Wellen
            ctx.beginPath();
            var wy = -2 + w * 2.4 + Math.sin(tw.game.time * 3 + w) * 0.6;
            ctx.moveTo(-5, wy); ctx.quadraticCurveTo(0, wy - 1.4, 6, wy);
            ctx.strokeStyle = U.alpha('#ffffff', 0.5); ctx.lineWidth = 1.2; ctx.stroke();
          }
        } else if (faction === 'japan') {           // Tempelglocke
          ctx.beginPath();                          // Glockenkörper
          ctx.moveTo(-8, 6);
          ctx.quadraticCurveTo(-8, -8, 0, -9);
          ctx.quadraticCurveTo(8, -8, 8, 6);
          ctx.closePath();
          ink(ctx, '#8a7a4a', 2.6);
          rrect(ctx, -9, 5, 18, 3, 1.5); ink(ctx, '#a8945a', 2);
          for (var bl = 0; bl < 2; bl++) {          // Zierrillen
            ctx.beginPath();
            ctx.moveTo(-7 + bl, -2 + bl * 4); ctx.lineTo(7 - bl, -2 + bl * 4);
            ctx.strokeStyle = U.alpha(INK, 0.4); ctx.lineWidth = 1.4; ctx.stroke();
          }
          // Schwingender Klöppelbalken
          ctx.save();
          ctx.rotate(-tw.angle);
          var sw = Math.sin(tw.game.time * 2.4) * 3;
          rrect(ctx, 10 + sw, -2, 9, 3.4, 1.6); ink(ctx, '#6d4a2a', 2);
          ctx.restore();
        } else if (faction === 'egyptian') {        // Sandsturm-Säule
          rrect(ctx, -6, -10, 12, 20, 3); ink(ctx, fc.stone, 2.4);
          ctx.save();
          ctx.rotate(-tw.angle + tw.game.time * 2.2);
          for (var sa = 0; sa < 3; sa++) {
            ctx.beginPath();
            ctx.arc(0, 0, 7 + sa * 3, sa * 2, sa * 2 + 2.2);
            ctx.strokeStyle = U.alpha(c, 0.85 - sa * 0.2);
            ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.stroke();
          }
          ctx.restore();
        } else {                                    // Teerkessel
          rrect(ctx, -9, -5, 18, 12, 4); ink(ctx, '#4a4a52', 2.6);
          ctx.beginPath(); ctx.ellipse(0, -5, 9, 3.6, 0, 0, U.TAU);
          ink(ctx, c, 2.2);
          for (var bb = 0; bb < 3; bb++) {          // Blasen
            var ph = (tw.game.time * 0.9 + bb * 0.33) % 1;
            circle(ctx, -4 + bb * 4, -6 - ph * 5, 1.6 * (1 - ph * 0.5));
            ctx.fillStyle = U.alpha('#ffffff', 0.5 * (1 - ph)); ctx.fill();
          }
        }
        // Frostkristall als gemeinsames Erkennungszeichen
        ctx.save();
        ctx.rotate(-tw.angle + tw.game.time * 1.1);
        ctx.strokeStyle = '#eaffff'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        for (var k2 = 0; k2 < 3; k2++) {
          ctx.save(); ctx.rotate(k2 / 3 * Math.PI);
          ctx.beginPath(); ctx.moveTo(-6 - lvl, 0); ctx.lineTo(6 + lvl, 0); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
        break;
      }

      /* ---------- Flächenschaden ---------- */
      case 'splash': {
        if (faction === 'viking') {                 // Felsenkatapult
          rrect(ctx, -9, -3, 18, 9, 3); ink(ctx, wood, 2.6);
          ctx.save(); ctx.rotate(-0.5);
          rrect(ctx, -2, -2.4, 17 + lvl, 4.8, 2); ink(ctx, wood, 2.2);
          circle(ctx, 16 + lvl, 0, 5.5); ink(ctx, '#8d93a6', 2.4);
          ctx.restore();
        } else if (faction === 'roman') {           // Onager
          rrect(ctx, -10, -2, 20, 9, 3); ink(ctx, wood, 2.6);
          [-1, 1].forEach(function (s3) { circle(ctx, -4, s3 * 5, 3.4); ink(ctx, metal, 1.8); });
          ctx.save(); ctx.rotate(-0.7);
          rrect(ctx, -1, -2, 16 + lvl, 4, 2); ink(ctx, wood, 2.2);
          circle(ctx, 15 + lvl, 0, 4.6); ink(ctx, c, 2.2);
          ctx.restore();
        } else if (faction === 'japan') {           // Ōzutsu – schweres Standrohr
          rrect(ctx, -9, -4, 17, 10, 3); ink(ctx, '#6d4a2a', 2.6);
          ctx.save(); ctx.rotate(-0.32);
          rrect(ctx, -2, -4.2, 20 + lvl, 8.4, 3); ink(ctx, '#4a4a52', 2.6);
          rrect(ctx, 16 + lvl, -5, 4.5, 10, 2);   ink(ctx, '#5e5e6c', 2.2);
          for (var rg = 0; rg < 3; rg++) {          // Verstärkungsringe
            rrect(ctx, 1 + rg * 6, -4.6, 1.8, 9.2, 0.8);
            ctx.fillStyle = '#7a7a88'; ctx.fill();
          }
          ctx.restore();
        } else if (faction === 'egyptian') {        // Skarabäus-Schleuder
          rrect(ctx, -9, -7, 18, 14, 4); ink(ctx, fc.stone, 2.6);
          blob(ctx, 5, 0, 6.5, c, 2.4);             // Käfer
          ctx.beginPath();
          ctx.moveTo(5, -6.5); ctx.lineTo(5, 6.5);
          ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
          [-1, 1].forEach(function (s4) {
            ctx.beginPath();
            ctx.moveTo(1, s4 * 5); ctx.lineTo(-3, s4 * 8);
            ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.stroke();
          });
        } else {                                    // Tribock mit Gegengewicht
          ctx.save(); ctx.rotate(-0.45);
          rrect(ctx, -12, -2, 30 + lvl, 4, 2); ink(ctx, wood, 2.4);
          circle(ctx, -12, 0, 5.5); ink(ctx, '#5a5f6e', 2.4);   // Gegengewicht
          ctx.restore();
          ctx.beginPath();
          ctx.moveTo(-7, 9); ctx.lineTo(0, -6); ctx.lineTo(7, 9);
          ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
          ctx.strokeStyle = wood; ctx.lineWidth = 1.6; ctx.stroke();
        }
        break;
      }

      /* ---------- Gift / Brand ---------- */
      case 'dot': {
        if (faction === 'viking') {                 // Schlangengrube
          ctx.beginPath(); ctx.ellipse(0, 2, 10, 7, 0, 0, U.TAU);
          ink(ctx, '#4a3a28', 2.6);
          ctx.beginPath();
          var t2 = tw.game.time * 2;
          ctx.moveTo(-5, 2);
          ctx.quadraticCurveTo(0, -4 + Math.sin(t2) * 2, 5, 0);
          ctx.quadraticCurveTo(9, 2, 8, -4);
          ctx.strokeStyle = INK; ctx.lineWidth = 4.4; ctx.lineCap = 'round'; ctx.stroke();
          ctx.strokeStyle = c; ctx.lineWidth = 2.8; ctx.stroke();
        } else if (faction === 'roman') {           // Brandpech-Werfer
          rrect(ctx, -9, -6, 17, 13, 4); ink(ctx, metal, 2.4);
          rrect(ctx, 5, -3, 13 + lvl, 6, 3); ink(ctx, U.shade(c, -0.3), 2.2);
          for (var fl = 0; fl < 3; fl++) {          // Flämmchen
            var fy = Math.sin(tw.game.time * 6 + fl) * 1.6;
            ctx.beginPath();
            ctx.moveTo(18 + lvl, fy - 2 + fl * 2);
            ctx.quadraticCurveTo(24 + lvl, fy + fl - 1, 19 + lvl, fy + 2 + fl * 2);
            ctx.fillStyle = U.alpha('#ffb14a', 0.8); ctx.fill();
          }
        } else if (faction === 'japan') {           // Shinobi mit Wurfstern
          rrect(ctx, -8, -7, 15, 14, 4); ink(ctx, fc.secondary, 2.4);
          rrect(ctx, -5, -4, 9, 4, 1.5);            // Sehschlitz
          ctx.fillStyle = '#1b1524'; ctx.fill();
          ctx.save();                                // rotierender Shuriken
          ctx.translate(11, 0);
          ctx.rotate(tw.game.time * 7);
          ctx.beginPath();
          for (var sp2 = 0; sp2 < 4; sp2++) {
            var a2 = sp2 / 4 * U.TAU;
            ctx.lineTo(Math.cos(a2) * 5.5, Math.sin(a2) * 5.5);
            ctx.lineTo(Math.cos(a2 + 0.39) * 1.8, Math.sin(a2 + 0.39) * 1.8);
          }
          ctx.closePath();
          ink(ctx, c, 1.8);
          ctx.restore();
        } else if (faction === 'egyptian') {        // Skorpionschrein
          rrect(ctx, -8, -7, 16, 14, 3); ink(ctx, fc.stone, 2.4);
          blob(ctx, 0, 1, 5, c, 2.2);
          ctx.beginPath();                          // Stachelschwanz
          ctx.moveTo(2, -2);
          ctx.quadraticCurveTo(11, -6, 8, -12);
          ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
          ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.stroke();
        } else {                                    // Pestkatapult
          rrect(ctx, -9, -4, 18, 10, 3); ink(ctx, wood, 2.6);
          blob(ctx, 6, -4, 6, c, 2.4);
          ctx.fillStyle = INK;                      // Totenkopf-Andeutung
          circle(ctx, 4.4, -5, 1.1); ctx.fill();
          circle(ctx, 7.8, -5, 1.1); ctx.fill();
        }
        // Aufsteigende Schwaden
        ctx.save();
        ctx.rotate(-tw.angle);
        for (var g3 = 0; g3 < 2; g3++) {
          var ph2 = (tw.game.time * 0.6 + g3 * 0.5) % 1;
          circle(ctx, (g3 - 0.5) * 6, -12 - ph2 * 9, 2.6 * (1 - ph2 * 0.6));
          ctx.fillStyle = U.alpha(c, 0.35 * (1 - ph2)); ctx.fill();
        }
        ctx.restore();
        break;
      }

      /* ---------- Kettenblitz ---------- */
      case 'chain': {
        var glowP = 0.4 + (tw.chargeGlow || 0) * 0.6;
        if (faction === 'viking') {                 // Thors Amboss
          rrect(ctx, -9, 0, 18, 7, 2); ink(ctx, '#6b7280', 2.6);
          rrect(ctx, -5, -3, 10, 4, 1.5); ink(ctx, '#8d93a6', 2.2);
          ctx.save(); ctx.rotate(Math.sin(tw.game.time * 3) * 0.25);
          rrect(ctx, -2, -18, 4, 13, 1.5); ink(ctx, wood, 2);   // Stiel
          rrect(ctx, -7, -22, 14, 7, 2); ink(ctx, metal, 2.4);  // Hammerkopf
          ctx.restore();
        } else if (faction === 'roman') {           // Jupiters Zorn
          rrect(ctx, -7, -8, 14, 16, 3); ink(ctx, fc.stone, 2.4);
          ctx.beginPath();                          // Blitzbündel
          ctx.moveTo(2, -14); ctx.lineTo(-3, -3); ctx.lineTo(1, -3);
          ctx.lineTo(-2, 8); ctx.lineTo(7, -5); ctx.lineTo(3, -5);
          ctx.lineTo(7, -14); ctx.closePath();
          ctx.shadowColor = c; ctx.shadowBlur = 10 * glowP;
          ink(ctx, '#ffe066', 2.2);
        } else if (faction === 'japan') {           // Raijin-Trommel
          rrect(ctx, -7, -8, 14, 16, 3); ink(ctx, '#6d4a2a', 2.4);
          ctx.beginPath();                          // Trommelfell
          ctx.ellipse(3, 0, 5, 8, 0, 0, U.TAU);
          ink(ctx, '#d9c9a0', 2.4);
          ctx.beginPath();
          ctx.ellipse(3, 0, 3, 5.4, 0, 0, U.TAU);
          ctx.strokeStyle = U.alpha(INK, 0.35); ctx.lineWidth = 1.4; ctx.stroke();
          // Schlägel, der im Takt zuschlägt
          var beat = Math.max(0, Math.sin(tw.game.time * 5)) * 4;
          rrect(ctx, 8 - beat, -6, 8, 2.4, 1.2); ink(ctx, '#8a6134', 1.8);
          ctx.shadowColor = c; ctx.shadowBlur = 8 + glowP * 14;
          circle(ctx, 3, 0, 2.4 + glowP * 1.5);
          ctx.fillStyle = '#ffffff'; ctx.fill();
          ctx.shadowBlur = 0;
        } else if (faction === 'egyptian') {        // Sonnenspiegel
          rrect(ctx, -6, -6, 12, 14, 3); ink(ctx, fc.stone, 2.4);
          circle(ctx, 3, -2, 8);
          ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 12 * glowP;
          ink(ctx, '#ffe9a8', 2.6);
          ctx.shadowBlur = 0;
          for (var ray = 0; ray < 8; ray++) {       // Strahlenkranz
            var ra = ray / 8 * U.TAU + tw.game.time * 0.5;
            ctx.beginPath();
            ctx.moveTo(3 + Math.cos(ra) * 9, -2 + Math.sin(ra) * 9);
            ctx.lineTo(3 + Math.cos(ra) * 12.5, -2 + Math.sin(ra) * 12.5);
            ctx.strokeStyle = U.alpha('#ffd166', 0.9); ctx.lineWidth = 2; ctx.lineCap = 'round';
            ctx.stroke();
          }
        } else {                                    // Alchemistenturm
          rrect(ctx, -8, -7, 16, 15, 4); ink(ctx, fc.primary, 2.4);
          ctx.beginPath();                          // Kolben
          ctx.moveTo(1, -8); ctx.lineTo(5, -8); ctx.lineTo(9, 2);
          ctx.quadraticCurveTo(5, 8, 1, 2); ctx.closePath();
          ink(ctx, U.alpha(c, 0.85), 2.2);
          ctx.shadowColor = c; ctx.shadowBlur = 9 * glowP;
          circle(ctx, 5, 1, 2.6); ctx.fillStyle = '#ffffff'; ctx.fill();
        }
        // Funkenkugel an der Spitze
        ctx.shadowColor = c; ctx.shadowBlur = 8 + glowP * 12;
        circle(ctx, 12 + lvl * 0.6, 0, 2.6 + lvl * 0.3);
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }

      /* ---------- Scharfschütze ---------- */
      case 'sniper': {
        var len = 20 + lvl * 3;
        if (faction === 'viking') {                 // Adler-Ballista
          rrect(ctx, -8, -6, 15, 12, 3); ink(ctx, wood, 2.4);
          rrect(ctx, 2, -2, len, 4, 2); ink(ctx, metal, 2.2);
          ctx.beginPath();
          ctx.moveTo(4, -11); ctx.quadraticCurveTo(14, 0, 4, 11);
          ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke();
          ctx.beginPath();                          // Adlerkopf
          ctx.moveTo(-8, -6); ctx.lineTo(-13, -9); ctx.lineTo(-9, -2);
          ctx.closePath(); ink(ctx, fc.trim, 1.8);
        } else if (faction === 'roman') {           // Scorpio
          rrect(ctx, -9, -5, 16, 11, 3); ink(ctx, wood, 2.4);
          rrect(ctx, 2, -1.8, len, 3.6, 1.8); ink(ctx, metal, 2.2);
          [-1, 1].forEach(function (s5) { circle(ctx, 2, s5 * 6, 3.4); ink(ctx, metal, 1.8); });
          ctx.beginPath();
          ctx.moveTo(2, -9); ctx.lineTo(2, 9);
          ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke();
        } else if (faction === 'japan') {           // Teppō – Luntenmuskete
          rrect(ctx, -9, -5, 16, 11, 3); ink(ctx, fc.secondary, 2.4);
          rrect(ctx, 2, -2, len, 4, 1.6); ink(ctx, '#3f3a34', 2.2);   // Lauf
          rrect(ctx, -4, -3.4, 10, 6.8, 2); ink(ctx, '#6d4a2a', 2);    // Schaft
          ctx.beginPath();                          // Zweibein
          ctx.moveTo(len * 0.55, 1); ctx.lineTo(len * 0.55 + 3, 7);
          ctx.moveTo(len * 0.55, 1); ctx.lineTo(len * 0.55 + 3, -5);
          ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.stroke();
          // Glimmende Lunte
          circle(ctx, -2, -5, 1.6);
          ctx.fillStyle = '#ff8a3d'; ctx.fill();
        } else if (faction === 'egyptian') {        // Auge des Horus
          rrect(ctx, -7, -7, 13, 14, 3); ink(ctx, fc.stone, 2.4);
          ctx.beginPath();                          // stilisiertes Auge
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(10, -9, 20, 0);
          ctx.quadraticCurveTo(10, 8, 0, 0);
          ctx.closePath(); ink(ctx, '#ffffff', 2.4);
          circle(ctx, 11, 0, 3.6); ink(ctx, fc.secondary, 2);
          circle(ctx, 11, 0, 1.6); ctx.fillStyle = INK; ctx.fill();
          ctx.beginPath();
          ctx.moveTo(4, 5); ctx.lineTo(1, 11);
          ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.stroke();
        } else {                                    // Langbogen-Erker
          rrect(ctx, -8, -6, 15, 12, 3); ink(ctx, fc.stone, 2.4);
          ctx.beginPath();                          // großer Bogen
          ctx.moveTo(5, -13 - lvl); ctx.quadraticCurveTo(16 + lvl, 0, 5, 13 + lvl);
          ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.stroke();
          ctx.strokeStyle = wood; ctx.lineWidth = 2.2; ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(5, -13 - lvl); ctx.lineTo(5, 13 + lvl);
          ctx.strokeStyle = U.alpha('#ffffff', 0.7); ctx.lineWidth = 1.2; ctx.stroke();
          rrect(ctx, 0, -1.2, len * 0.8, 2.4, 1.2); ink(ctx, '#fff2c8', 1.6);
        }
        break;
      }
    }
  }

  /* =======================================================
     GEGNER
     ======================================================= */
  function drawEnemy(ctx, e, time) {
    var d = e.def, r = e.r;
    var col = d.color;

    ctx.save();
    ctx.translate(e.x, e.y);

    ctx.beginPath();
    ctx.ellipse(2, e.flying ? r * 1.5 : r * 0.8, r * 0.85, r * 0.3, 0, 0, U.TAU);
    ctx.fillStyle = U.alpha('#000000', 0.3); ctx.fill();

    if (e.flying) ctx.translate(0, -9 + Math.sin(time * 5 + e.wobble) * 2.5);

    // Kleiner Hüpfer beim Laufen macht die Bewegung lebendig
    var hop = d.boss ? 0 : Math.abs(Math.sin(time * 7 + e.wobble)) * r * 0.12;
    ctx.translate(0, -hop);

    var flash = Math.max(0, e.hitFlash);
    var body = flash > 0 ? U.shade(col, flash * 0.7) : col;
    if (e.slowAmt > 0) body = mix(body, '#9fe8ff', Math.min(0.55, e.slowAmt));

    ctx.save();
    ctx.rotate(e.angle);

    switch (d.shape) {

      case 'tri':
        ctx.beginPath();
        ctx.moveTo(r * 1.25, 0);
        ctx.lineTo(-r * 0.8, -r * 0.9);
        ctx.lineTo(-r * 0.45, 0);
        ctx.lineTo(-r * 0.8, r * 0.9);
        ctx.closePath();
        ink(ctx, body, 2.4);
        break;

      case 'square':
        rrect(ctx, -r * 0.9, -r * 0.85, r * 1.8, r * 1.7, 5);
        ink(ctx, body, 2.6);
        rrect(ctx, -r * 0.45, -r * 0.5, r * 0.9, r * 1.0, 3);
        ctx.fillStyle = U.alpha('#000000', 0.16); ctx.fill();
        [-1, 1].forEach(function (s) {              // Nieten
          [-1, 1].forEach(function (t2) {
            circle(ctx, s * r * 0.62, t2 * r * 0.58, 1.6);
            ctx.fillStyle = U.shade(col, -0.4); ctx.fill();
          });
        });
        break;

      case 'hex':
        U.polygon(ctx, 0, 0, r, 6, 0);
        ink(ctx, body, 2.6);
        ctx.strokeStyle = U.alpha('#e0c8ff', 0.5 + Math.sin(time * 4 + e.wobble) * 0.3);
        ctx.lineWidth = 2.4;
        U.polygon(ctx, 0, 0, r * 1.3, 6, 0); ctx.stroke();
        break;

      case 'cross':
        ctx.beginPath();
        ctx.rect(-r * 0.34, -r, r * 0.68, r * 2);
        ctx.rect(-r, -r * 0.34, r * 2, r * 0.68);
        ink(ctx, body, 2.4);
        break;

      case 'wing':
        var flap = Math.sin(time * 13 + e.wobble) * 0.5;
        ctx.save(); ctx.scale(1, 1 + flap * 0.35);
        [-1, 1].forEach(function (s) {
          ctx.beginPath();
          ctx.ellipse(-r * 0.1, s * r * 0.95, r * 0.8, r * 0.4, s * 0.3, 0, U.TAU);
          ink(ctx, U.shade(col, 0.22), 2.2);
        });
        ctx.restore();
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.05, r * 0.6, 0, 0, U.TAU);
        ink(ctx, body, 2.4);
        break;

      case 'boss':
        ctx.save();
        ctx.rotate(time * 1.0);
        U.polygon(ctx, 0, 0, r * 1.34, 3, 0);
        ctx.strokeStyle = U.alpha('#ffb36a', 0.7); ctx.lineWidth = 3.4; ctx.stroke();
        ctx.restore();
        U.polygon(ctx, 0, 0, r, 8, Math.PI / 8);
        ink(ctx, body, 3);
        U.polygon(ctx, 0, 0, r * 0.62, 8, Math.PI / 8);
        ctx.fillStyle = U.alpha('#000000', 0.18); ctx.fill();
        // Hörner
        [-1, 1].forEach(function (s) {
          ctx.beginPath();
          ctx.moveTo(s * r * 0.5, -r * 0.6);
          ctx.quadraticCurveTo(s * r * 1.0, -r * 1.15, s * r * 0.45, -r * 1.2);
          ctx.closePath();
          ink(ctx, '#f2e2c0', 2.2);
        });
        break;

      default:
        blob(ctx, 0, 0, r, body, 2.6);
        break;
    }
    ctx.restore();

    // Mythologisches Erkennungszeichen, aufrecht über der Grundform
    if (d.motif) drawMotif(ctx, d.motif, r, time, body, e);

    // Gesicht – immer aufrecht, damit es lesbar bleibt
    if (d.shape !== 'cross') {
      eyes(ctx, 0, -r * 0.12, r, 0.4, d.boss || d.shape === 'square');
    } else {
      eyes(ctx, 0, -r * 0.1, r * 0.8, 0, false);
    }

    if (e.poisonT > 0) {
      ctx.strokeStyle = U.alpha('#7ee081', 0.4 + Math.sin(time * 9 + e.wobble) * 0.25);
      ctx.lineWidth = 2.4;
      circle(ctx, 0, 0, r + 5); ctx.stroke();
    }
    if (e.healPulse > 0) {
      ctx.strokeStyle = U.alpha('#7ee081', e.healPulse * 0.55);
      ctx.lineWidth = 2.4;
      circle(ctx, 0, 0, r + 6 + (1 - e.healPulse) * 9); ctx.stroke();
    }

    // Lebensbalken (bei Vorschaubildern unerwünscht)
    var hpFrac = e.hp / e.maxHp;
    if (!e.hideBar && (hpFrac < 0.999 || d.boss)) {
      var bw = Math.max(r * 2.1, 22), bh = d.boss ? 6 : 4.5;
      var by = -r - (e.flying ? 13 : 11);
      rrect(ctx, -bw / 2, by, bw, bh, bh / 2);
      ink(ctx, '#2a2135', 2);
      if (hpFrac > 0.02) {
        rrect(ctx, -bw / 2 + 1.2, by + 1.2, (bw - 2.4) * hpFrac, bh - 2.4, (bh - 2.4) / 2);
        ctx.fillStyle = hpFrac > 0.5 ? '#5ce89a' : (hpFrac > 0.22 ? '#ffc945' : '#ff5d73');
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Kennzeichen der jeweiligen Sagenwelt – Hörner, Ohren, Binden …
   * Wird aufrecht gezeichnet, damit es unabhängig von der Laufrichtung
   * erkennbar bleibt.
   */
  function drawMotif(ctx, motif, r, time, body, e) {
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    switch (motif) {

      case 'horns':                       // Kobold, Riese, Minotaurus, Satyr
        [-1, 1].forEach(function (s) {
          ctx.beginPath();
          ctx.moveTo(s * r * 0.55, -r * 0.6);
          ctx.quadraticCurveTo(s * r * 1.0, -r * 1.1, s * r * 0.6, -r * 1.25);
          ctx.quadraticCurveTo(s * r * 0.72, -r * 0.9, s * r * 0.35, -r * 0.72);
          ctx.closePath();
          ink(ctx, '#f0e2c4', 2);
        });
        break;

      case 'ears':                        // Warg, Schakal, Ratte
        [-1, 1].forEach(function (s) {
          ctx.beginPath();
          ctx.moveTo(s * r * 0.3, -r * 0.7);
          ctx.lineTo(s * r * 0.72, -r * 1.35);
          ctx.lineTo(s * r * 0.85, -r * 0.6);
          ctx.closePath();
          ink(ctx, body, 2);
          ctx.beginPath();
          ctx.moveTo(s * r * 0.45, -r * 0.72);
          ctx.lineTo(s * r * 0.68, -r * 1.1);
          ctx.lineTo(s * r * 0.72, -r * 0.7);
          ctx.closePath();
          ctx.fillStyle = U.alpha('#ff9fb5', 0.6); ctx.fill();
        });
        break;

      case 'wisp': {                      // Irrlicht, Schattenbrut
        var fl = 0.75 + Math.sin(time * 8 + e.wobble) * 0.25;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.9 * fl);
        ctx.quadraticCurveTo(r * 0.55, -r * 0.8, 0, -r * 0.5);
        ctx.quadraticCurveTo(-r * 0.55, -r * 0.8, 0, -r * 1.9 * fl);
        ctx.closePath();
        ctx.shadowColor = '#dfffa0'; ctx.shadowBlur = 12;
        ink(ctx, '#eaffb0', 1.8);
        break;
      }

      case 'skull':                       // Draugr, Lemur
        ctx.beginPath();
        ctx.moveTo(-r * 0.42, r * 0.34);
        ctx.lineTo(r * 0.42, r * 0.34);
        ctx.lineTo(r * 0.3, r * 0.62);
        ctx.lineTo(-r * 0.3, r * 0.62);
        ctx.closePath();
        ink(ctx, '#f0ead8', 1.8);
        ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
        for (var t2 = -1; t2 <= 1; t2++) {
          ctx.beginPath();
          ctx.moveTo(t2 * r * 0.2, r * 0.34);
          ctx.lineTo(t2 * r * 0.2, r * 0.6);
          ctx.stroke();
        }
        break;

      case 'beak':                        // Rabe, Harpyie, Ba-Vogel
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, r * 0.15);
        ctx.lineTo(r * 0.95, r * 0.32);
        ctx.lineTo(-r * 0.2, r * 0.55);
        ctx.closePath();
        ink(ctx, '#ffc24a', 1.8);
        break;

      case 'bandage': {                   // Mumie
        ctx.strokeStyle = U.alpha('#f5ecd4', 0.9);
        ctx.lineWidth = r * 0.22;
        for (var b2 = -1; b2 <= 1; b2++) {
          ctx.beginPath();
          ctx.moveTo(-r * 0.95, b2 * r * 0.42 + r * 0.15);
          ctx.lineTo(r * 0.95, b2 * r * 0.42 - r * 0.05);
          ctx.stroke();
        }
        // loses Ende, das im Wind flattert
        ctx.strokeStyle = '#f5ecd4'; ctx.lineWidth = r * 0.16;
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, r * 0.3);
        ctx.quadraticCurveTo(-r * 1.5, r * 0.5 + Math.sin(time * 5 + e.wobble) * r * 0.3, -r * 1.7, r * 0.1);
        ctx.stroke();
        break;
      }

      case 'runes': {                     // Steingolem, Schabti
        ctx.strokeStyle = U.alpha('#8fe6ff', 0.5 + Math.sin(time * 3 + e.wobble) * 0.3);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.35, -r * 0.35); ctx.lineTo(-r * 0.35, r * 0.35);
        ctx.moveTo(-r * 0.35, 0);         ctx.lineTo(r * 0.05, -r * 0.3);
        ctx.moveTo(r * 0.35, -r * 0.35);  ctx.lineTo(r * 0.35, r * 0.35);
        ctx.stroke();
        break;
      }

      case 'halo': {                      // Bannritter, Bronzewächter, Löwenwächter
        var pulse = 0.55 + Math.sin(time * 3 + e.wobble) * 0.35;
        ctx.strokeStyle = U.alpha('#ffe9a8', pulse);
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, -r * 1.15, r * 0.6, r * 0.22, 0, 0, U.TAU);
        ctx.stroke();
        break;
      }

      case 'hood':                        // Hexe, Völva, Nymphe, Priester
        ctx.beginPath();
        ctx.moveTo(-r * 0.85, -r * 0.15);
        ctx.quadraticCurveTo(0, -r * 1.75, r * 0.85, -r * 0.15);
        ctx.quadraticCurveTo(0, -r * 0.55, -r * 0.85, -r * 0.15);
        ctx.closePath();
        ink(ctx, U.shade(body, -0.45), 2);
        break;

      case 'frost': {                     // Hrimthurse
        ctx.strokeStyle = '#dff4ff'; ctx.lineWidth = 2.2;
        for (var i = 0; i < 5; i++) {
          var a = -Math.PI * 0.9 + i * Math.PI * 0.2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
          ctx.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35);
          ctx.stroke();
        }
        break;
      }

      case 'scarab':                      // Skarabäenschwarm
        ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.9); ctx.lineTo(0, r * 0.9);
        ctx.stroke();
        [-1, 1].forEach(function (s) {
          ctx.beginPath();
          ctx.moveTo(s * r * 0.3, -r * 0.5);
          ctx.lineTo(s * r * 1.15, -r * 0.85);
          ctx.moveTo(s * r * 0.3, r * 0.2);
          ctx.lineTo(s * r * 1.15, r * 0.6);
          ctx.stroke();
        });
        break;

      case 'wings': {                     // Wyvern, Sturmadler
        var flap2 = Math.sin(time * 11 + e.wobble) * 0.35;
        [-1, 1].forEach(function (s) {
          ctx.save();
          ctx.translate(s * r * 0.7, -r * 0.3);
          ctx.rotate(s * (0.5 + flap2));
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(s * r * 0.9, -r * 0.5, s * r * 1.5, r * 0.15);
          ctx.quadraticCurveTo(s * r * 0.8, r * 0.25, 0, 0);
          ctx.closePath();
          ink(ctx, U.shade(body, -0.25), 2);
          ctx.restore();
        });
        break;
      }

      /* ---- Endgegner ---- */

      case 'dragon': {
        var flapD = Math.sin(time * 3.5) * 0.3;
        [-1, 1].forEach(function (s) {
          ctx.save();
          ctx.translate(s * r * 0.6, -r * 0.2);
          ctx.rotate(s * (0.7 + flapD));
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(s * r * 1.3, -r * 1.0, s * r * 2.1, -r * 0.1);
          ctx.lineTo(s * r * 1.5, r * 0.15);
          ctx.lineTo(s * r * 1.7, r * 0.5);
          ctx.quadraticCurveTo(s * r * 0.8, r * 0.35, 0, 0);
          ctx.closePath();
          ink(ctx, '#a83a1a', 2.6);
          ctx.restore();
        });
        [-1, 1].forEach(function (s) {   // Hörner
          ctx.beginPath();
          ctx.moveTo(s * r * 0.4, -r * 0.75);
          ctx.quadraticCurveTo(s * r * 0.95, -r * 1.35, s * r * 0.5, -r * 1.5);
          ctx.quadraticCurveTo(s * r * 0.6, -r * 1.05, s * r * 0.25, -r * 0.85);
          ctx.closePath();
          ink(ctx, '#f0e2c4', 2.2);
        });
        break;
      }

      case 'wolf': {
        [-1, 1].forEach(function (s) {   // Ohren
          ctx.beginPath();
          ctx.moveTo(s * r * 0.35, -r * 0.7);
          ctx.lineTo(s * r * 0.75, -r * 1.4);
          ctx.lineTo(s * r * 0.9, -r * 0.55);
          ctx.closePath();
          ink(ctx, U.shade(body, -0.2), 2.4);
        });
        // Schnauze mit Zähnen
        ctx.beginPath();
        ctx.ellipse(r * 0.75, r * 0.15, r * 0.5, r * 0.35, 0, 0, U.TAU);
        ink(ctx, U.shade(body, -0.15), 2.4);
        ctx.fillStyle = '#ffffff';
        for (var z = 0; z < 3; z++) {
          ctx.beginPath();
          ctx.moveTo(r * (0.5 + z * 0.25), r * 0.28);
          ctx.lineTo(r * (0.62 + z * 0.25), r * 0.55);
          ctx.lineTo(r * (0.72 + z * 0.25), r * 0.28);
          ctx.closePath(); ctx.fill();
        }
        break;
      }

      case 'serpent': {
        // Kapuze wie bei einer Kobra
        ctx.beginPath();
        ctx.moveTo(-r * 0.3, -r * 0.2);
        ctx.quadraticCurveTo(-r * 1.6, -r * 1.1, 0, -r * 1.5);
        ctx.quadraticCurveTo(r * 1.6, -r * 1.1, r * 0.3, -r * 0.2);
        ctx.closePath();
        ink(ctx, U.shade(body, -0.3), 2.6);
        // gespaltene Zunge
        ctx.strokeStyle = '#ff5d73'; ctx.lineWidth = 2.4;
        var tl = 0.7 + Math.sin(time * 6) * 0.3;
        ctx.beginPath();
        ctx.moveTo(r * 0.6, r * 0.35);
        ctx.lineTo(r * (0.6 + tl), r * 0.5);
        ctx.moveTo(r * (0.6 + tl * 0.7), r * 0.44);
        ctx.lineTo(r * (0.6 + tl), r * 0.25);
        ctx.stroke();
        break;
      }

      case 'hydra': {
        // Drei Nebenköpfe an langen Hälsen
        [-1, 0, 1].forEach(function (s, i) {
          var sway = Math.sin(time * 2.5 + i * 1.7) * r * 0.22;
          var hx = s * r * 0.95 + sway, hy = -r * 1.35;
          ctx.strokeStyle = U.shade(body, -0.2);
          ctx.lineWidth = r * 0.3;
          ctx.beginPath();
          ctx.moveTo(s * r * 0.35, -r * 0.3);
          ctx.quadraticCurveTo(s * r * 0.8, -r * 0.9, hx, hy);
          ctx.stroke();
          circle(ctx, hx, hy, r * 0.3);
          ink(ctx, U.shade(body, 0.12), 2);
          circle(ctx, hx - r * 0.09, hy - r * 0.04, r * 0.07);
          ctx.fillStyle = INK; ctx.fill();
        });
        break;
      }
    }
    ctx.restore();
  }

  function mix(a, b, t) {
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

  /* =======================================================
     GESCHOSSE
     ======================================================= */
  function drawProjectile(ctx, p, time) {
    ctx.save();

    if (p.arc) {
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 4.5, 2, 0, 0, U.TAU);
      ctx.fillStyle = U.alpha('#000000', 0.28); ctx.fill();
      ctx.translate(p.x, p.y - (p.height || 0));
      ctx.rotate(p.spin);
      if (p.kind === 'shell') blob(ctx, 0, 0, 5.5, '#6b7280', 2.2);
      else                    blob(ctx, 0, 0, 5.5, p.color, 2.2);
    } else {
      for (var i = 0; i < p.trail.length; i++) {
        var t = (i + 1) / p.trail.length;
        circle(ctx, p.trail[i].x, p.trail[i].y, 1.4 + t * 2.2);
        ctx.fillStyle = U.alpha(p.color, t * 0.3); ctx.fill();
      }
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      if (p.kind === 'frost') {
        U.polygon(ctx, 0, 0, 5, 6, time * 6);
        ink(ctx, p.color, 1.8);
      } else {
        // Pfeil/Bolzen statt Kugel – passt zum Comicstil
        ctx.beginPath();
        ctx.moveTo(6, 0); ctx.lineTo(-4, -2.6); ctx.lineTo(-2, 0); ctx.lineTo(-4, 2.6);
        ctx.closePath();
        ink(ctx, p.color, 1.8);
      }
    }
    ctx.restore();
  }

  /* =======================================================
     EFFEKTE
     ======================================================= */
  function drawEffect(ctx, fx, time) {
    var t = fx.life / fx.maxLife;

    switch (fx.kind) {

      case 'lightning': {
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.shadowColor = fx.color; ctx.shadowBlur = 14;
        for (var pass = 0; pass < 2; pass++) {
          ctx.strokeStyle = pass === 0 ? U.alpha(fx.color, t * 0.9) : U.alpha('#ffffff', t);
          ctx.lineWidth = pass === 0 ? 7 : 2.4;
          ctx.beginPath();
          for (var s = 1; s < fx.points.length; s++) {
            var a = fx.points[s - 1], b = fx.points[s];
            ctx.moveTo(a.x, a.y);
            for (var k = 1; k <= 4; k++) {
              var f = k / 4;
              var jx = k === 4 ? 0 : (fx.seed[(s * 4 + k) % fx.seed.length] - 0.5) * 15;
              var jy = k === 4 ? 0 : (fx.seed[(s * 4 + k + 3) % fx.seed.length] - 0.5) * 15;
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
        ctx.strokeStyle = U.alpha(fx.color, t * 0.85);
        ctx.lineWidth = (fx.crit ? 6 : 3.5) * t;
        ctx.beginPath(); ctx.moveTo(fx.x1, fx.y1); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
        ctx.strokeStyle = U.alpha('#ffffff', t);
        ctx.lineWidth = (fx.crit ? 2.4 : 1.4) * t;
        ctx.beginPath(); ctx.moveTo(fx.x1, fx.y1); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
        ctx.restore();
        break;
      }

      case 'explosion': {
        var grow = 1 - t;
        var r = fx.r * (0.45 + grow * 0.75);
        ctx.save();
        // Comic-Explosion: gezackter Stern statt weichem Verlauf
        ctx.beginPath();
        var spikes = 11;
        for (var i2 = 0; i2 < spikes * 2; i2++) {
          var ang = (i2 / (spikes * 2)) * U.TAU + fx.seedAngle;
          var rad = (i2 % 2 ? r * 0.62 : r);
          var px = fx.x + Math.cos(ang) * rad, py = fx.y + Math.sin(ang) * rad;
          if (i2 === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.globalAlpha = t;
        ctx.fillStyle = U.alpha(fx.color, 0.75);
        ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 2.6; ctx.stroke();
        // heller Kern
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r * 0.42, 0, U.TAU);
        ctx.fillStyle = U.alpha('#fff3c4', 0.9); ctx.fill();
        ctx.restore();
        break;
      }

      case 'muzzle': {
        ctx.save();
        ctx.translate(fx.x, fx.y);
        ctx.rotate(fx.angle);
        ctx.globalAlpha = t;
        var L = 9 * fx.scale * (0.4 + t * 0.6);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(L * 1.9, -L * 0.5);
        ctx.lineTo(L * 1.3, 0);
        ctx.lineTo(L * 2.6, 0);
        ctx.lineTo(L * 1.3, 0);
        ctx.lineTo(L * 1.9, L * 0.5);
        ctx.closePath();
        ctx.fillStyle = '#fff6d0';
        ctx.shadowColor = fx.color; ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
        break;
      }

      case 'ring': {
        ctx.save();
        ctx.strokeStyle = U.alpha(fx.color, t * 0.7);
        ctx.lineWidth = 3.4 * t;
        circle(ctx, fx.x, fx.y, fx.r * (1 - t) + 4); ctx.stroke();
        ctx.restore();
        break;
      }

      /* ---- Heldenfähigkeiten ---- */

      case 'arrowstorm': {
        var prog = 1 - t;
        ctx.save();
        ctx.strokeStyle = U.alpha(fx.color, t * 0.7);
        ctx.lineWidth = 2.6;
        ctx.setLineDash([7, 5]);
        ctx.lineDashOffset = -time * 30;
        circle(ctx, fx.x, fx.y, fx.r); ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineCap = 'round';
        for (var a = 0; a < 22; a++) {
          var ph = (prog * 2.2 + a * 0.137) % 1;
          if (ph > 0.92) continue;
          var ax = fx.x + Math.sin(a * 12.9898) * fx.r * 0.85;
          var ay = fx.y + Math.cos(a * 78.233) * fx.r * 0.6;
          var fall = (1 - ph) * fx.r * 2.4;
          ctx.strokeStyle = U.alpha('#fff2c8', Math.min(1, ph * 3) * t);
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(ax, ay - fall);
          ctx.lineTo(ax + 2, ay - fall + 11);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }

      case 'spincut': {
        var g2 = 1 - t;
        ctx.save();
        ctx.lineCap = 'round';
        // Sichelförmiger Schnitt, der herumfährt
        var start = fx.seedA || (fx.seedA = Math.random() * U.TAU);
        ctx.strokeStyle = U.alpha('#ffffff', t);
        ctx.lineWidth = 5 * t;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.r * (0.55 + g2 * 0.5), start, start + Math.PI * 1.4);
        ctx.stroke();
        ctx.strokeStyle = U.alpha(fx.color, t * 0.8);
        ctx.lineWidth = 11 * t;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.r * (0.55 + g2 * 0.5), start, start + Math.PI * 1.4);
        ctx.stroke();
        ctx.restore();
        break;
      }

      case 'shockwave': {
        var grow2 = 1 - t;
        ctx.save();
        ctx.strokeStyle = U.alpha(fx.color, t * 0.9);
        ctx.lineWidth = 9 * t;
        circle(ctx, fx.x, fx.y, fx.r * grow2); ctx.stroke();
        ctx.strokeStyle = U.alpha('#ffffff', t * 0.8);
        ctx.lineWidth = 3 * t;
        circle(ctx, fx.x, fx.y, fx.r * grow2); ctx.stroke();
        ctx.strokeStyle = U.alpha(fx.color, t * 0.4);
        ctx.lineWidth = 5 * t;
        circle(ctx, fx.x, fx.y, fx.r * grow2 * 0.62); ctx.stroke();
        ctx.restore();
        break;
      }

      case 'sunbeam': {
        ctx.save();
        ctx.lineCap = 'round';
        var w = fx.width * (0.5 + t * 0.9);
        ctx.shadowColor = fx.color; ctx.shadowBlur = 26;
        ctx.strokeStyle = U.alpha(fx.color, t * 0.55);
        ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(fx.x1, fx.y1); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
        ctx.strokeStyle = U.alpha('#fff6d0', t * 0.95);
        ctx.lineWidth = w * 0.42;
        ctx.beginPath(); ctx.moveTo(fx.x1, fx.y1); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
        ctx.strokeStyle = U.alpha('#ffffff', t);
        ctx.lineWidth = w * 0.14;
        ctx.beginPath(); ctx.moveTo(fx.x1, fx.y1); ctx.lineTo(fx.x2, fx.y2); ctx.stroke();
        ctx.shadowBlur = 30;
        circle(ctx, fx.x1, fx.y1, 13 * t);
        ctx.fillStyle = U.alpha('#fff6d0', t); ctx.fill();
        ctx.restore();
        break;
      }
    }
  }

  /* =======================================================
     BAU-OVERLAY
     ======================================================= */
  function drawBuildOverlay(ctx, g) {
    var role = g.buildKey;
    if (!role) return;
    var def = TD.towerDef(g.factionKey, role);
    var cell = g.hoverCell;

    ctx.save();
    ctx.globalAlpha = 0.26;
    for (var cy = 0; cy < ROWS; cy++) {
      for (var cx = 0; cx < COLS; cx++) {
        if (!TD.maps.canBuild(g.map, cx, cy) || g.towerAt(cx, cy)) continue;
        rrect(ctx, cx * CELL + 5, cy * CELL + 5, CELL - 10, CELL - 10, 6);
        ctx.fillStyle = '#7fffcf';
        ctx.fill();
      }
    }
    ctx.restore();

    if (!cell) return;
    var ok = g.canPlaceAt(cell.cx, cell.cy) && g.gold >= def.cost;
    var px = (cell.cx + 0.5) * CELL, py = (cell.cy + 0.5) * CELL;

    drawRangeCircle(ctx, px, py, rangeWithTile(g, role, cell), ok ? def.color : '#ff5d73');

    ctx.save();
    rrect(ctx, cell.cx * CELL + 3, cell.cy * CELL + 3, CELL - 6, CELL - 6, 7);
    ctx.fillStyle = ok ? 'rgba(120,255,190,.26)' : 'rgba(255,93,115,.3)';
    ctx.fill();
    ctx.strokeStyle = ok ? '#7fffcf' : '#ff5d73';
    ctx.lineWidth = 2.6; ctx.stroke();
    ctx.restore();

    if (ok) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      drawTower(ctx, {
        x: px, y: py, def: def, level: 1, angle: -Math.PI / 2,
        recoil: 0, buildAnim: 0, chargeGlow: 0, game: g
      });
      ctx.restore();

      // Hinweis, wenn das Feld den Turm verändert
      var sp = TD.maps.specialAt(g.map, cell.cx, cell.cy);
      if (sp) {
        var mods = sp.mods[role] || sp.mods.all;
        var good = isGoodFor(mods);
        banner(ctx, px, py - CELL * 0.75, sp.name, good ? '#5ce89a' : '#ff8f6b');
      }
    } else {
      ctx.save();
      ctx.strokeStyle = '#ff5d73'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      var m = CELL * 0.24;
      ctx.beginPath();
      ctx.moveTo(px - m, py - m); ctx.lineTo(px + m, py + m);
      ctx.moveTo(px + m, py - m); ctx.lineTo(px - m, py + m);
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Reichweite inklusive Feldbonus – für die Vorschau. */
  function rangeWithTile(g, role, cell) {
    var def = TD.towerDef(g.factionKey, role);
    var sp = TD.maps.specialAt(g.map, cell.cx, cell.cy);
    var r = def.range;
    if (sp) {
      var mods = sp.mods[role] || sp.mods.all;
      if (mods && mods.range) r *= mods.range;
    }
    return r * CELL;
  }

  function isGoodFor(mods) {
    if (!mods) return false;
    var sum = 0;
    Object.keys(mods).forEach(function (k) {
      sum += k === 'chain' ? mods[k] : (mods[k] - 1);
    });
    return sum >= 0;
  }

  function banner(ctx, x, y, text, color) {
    ctx.save();
    ctx.font = 'bold 12px Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var w = ctx.measureText(text).width + 16;
    rrect(ctx, x - w / 2, y - 10, w, 20, 10);
    ink(ctx, '#1b1524', 2.2);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawRangeCircle(ctx, x, y, r, color) {
    ctx.save();
    circle(ctx, x, y, r);
    ctx.fillStyle = U.alpha(color, 0.10);
    ctx.fill();
    ctx.strokeStyle = U.alpha(color, 0.8);
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.restore();
  }

  /** Luftlinie je Weg – Flieger nehmen die Abkürzung. */
  function drawAirRoute(ctx, g) {
    ctx.save();
    ctx.strokeStyle = U.alpha('#7fd4ff', 0.3);
    ctx.lineWidth = 2.4;
    ctx.setLineDash([12, 10]);
    ctx.lineDashOffset = -g.time * 26;
    g.map.paths.forEach(function (p) {
      var a = p.points[0], b = p.points[p.points.length - 1];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  /* =======================================================
     Öffentliche Schnittstelle
     ======================================================= */
  var R = TD.render = {

    invalidateBackground: function () { bgCanvas = null; bgMapId = null; },

    /**
     * Zeichnet einen Turm an der aktuellen Position des Kontexts.
     * Für Vorschauen und Symbole – im Spiel läuft alles über draw().
     */
    drawTowerAt: function (ctx, factionKey, role, level, time) {
      drawTower(ctx, {
        x: 0, y: 0, def: TD.towerDef(factionKey, role), level: level || 1,
        angle: -Math.PI / 2, recoil: 0, buildAnim: 0, chargeGlow: 0.5,
        game: { time: time || 0 }
      });
    },

    /**
     * Hauptfigur an der aktuellen Position zeichnen (für Vorschauen).
     * @param {object} opts { faction, level, ready, time, aura }
     */
    drawHeroAt: function (ctx, factionKey, opts) {
      opts = opts || {};
      var f = TD.factions.get(factionKey);
      drawHero(ctx, {
        x: 0, y: 0,
        def: TD.towerDef(factionKey, 'hero'),
        level: opts.level || 1,
        angle: opts.angle == null ? -Math.PI / 2 : opts.angle,
        recoil: 0, buildAnim: 0, chargeGlow: 0,
        isHero: true, power: f.hero.power,
        powerTimer: opts.ready ? 0 : 5,
        powerFlash: opts.flash || 0,
        game: { time: opts.time || 0, heroAura: opts.aura ? f.hero.aura : null }
      }, f.colors);
    },

    /** Einen Gegner an der aktuellen Position zeichnen (für Vorschauen). */
    drawEnemyAt: function (ctx, enemy, time) {
      drawEnemy(ctx, enemy, time || 0);
    },

    /**
     * Gegnersymbol für die Wellenvorschau – dieselbe Figur wie im Spiel,
     * damit man sie auf dem Feld wiedererkennt.
     * @param {HTMLCanvasElement} canvas
     * @param {string} factionKey
     * @param {string} role Gegnerrolle (grunt, flyer, boss …)
     * @param {number} size Kantenlänge in CSS-Pixeln
     */
    drawEnemyIcon: function (canvas, factionKey, role, size) {
      size = size || 26;
      var def = TD.enemyDef(factionKey, role);
      var dpr = Math.min(global.devicePixelRatio || 1, 2);

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';

      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.translate(size / 2, size / 2 + size * 0.04);

      /* Größenunterschiede andeuten, ohne dass kleine Gegner
         unkenntlich werden. */
      var target = U.lerp(8.5, 11, U.clamp((def.r - 7) / 16, 0, 1));

      /* Hörner, Flügel und der Ring der Endgegner ragen über den
         Körperradius hinaus – ohne diesen Zuschlag würden sie am
         Rand des Symbols abgeschnitten. */
      var pad = def.boss ? 1.62
              : (def.shape === 'wing' ? 1.48
              : (def.motif ? 1.34 : 1.2));

      var fits = ((size / 2) - 1) / pad;
      var scale = Math.min(target, fits) / def.r;
      ctx.scale(scale, scale);

      drawEnemy(ctx, {
        x: 0, y: 0, def: def, r: def.r,
        hp: 1, maxHp: 1, angle: 0, wobble: role.length,
        flying: false,                 // kein Höhenversatz im Symbol
        slowAmt: 0, poisonT: 0, healPulse: 0, hitFlash: 0,
        hideBar: true
      }, 0.6);
    },

    /** Turmsymbol für die Shopliste. */
    drawTowerIcon: function (canvas, factionKey, role, size) {
      size = size || 40;
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      canvas.width = size * dpr; canvas.height = size * dpr;
      canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.translate(size / 2, size / 2 + size * 0.05);
      var s = size / (CELL * 1.25);
      ctx.scale(s, s);
      drawTower(ctx, {
        x: 0, y: 0, def: TD.towerDef(factionKey, role), level: 1,
        angle: -Math.PI / 2, recoil: 0, buildAnim: 0, chargeGlow: 0.5,
        game: { time: 0 }
      });
    },

    draw: function (ctx, g) {
      if (!bgCanvas || bgMapId !== g.map.id) {
        bgCanvas = buildBackground(g.map);
        bgMapId = g.map.id;
      }

      // Randstreifen oben, in den Türme hineinragen dürfen
      var edge = ctx.createLinearGradient(0, 0, 0, PAD);
      edge.addColorStop(0, U.shade(g.map.theme.grass, -0.55));
      edge.addColorStop(1, U.shade(g.map.theme.grass, -0.25));
      ctx.fillStyle = edge;
      ctx.fillRect(0, 0, W, PAD);

      ctx.save();
      ctx.translate(0, PAD);          // ab hier gilt das Spielfeldraster
      if (g.shake > 0) ctx.translate(U.rand(-g.shake, g.shake), U.rand(-g.shake, g.shake));

      ctx.drawImage(bgCanvas, 0, 0);

      drawSpecialTiles(ctx, g);
      if (g.airWarning) drawAirRoute(ctx, g);
      drawSpawns(ctx, g);
      drawBase(ctx, g);
      drawBuildOverlay(ctx, g);

      if (g.selected) {
        drawRangeCircle(ctx, g.selected.x, g.selected.y, g.selected.rangePx(), g.selected.def.color);
      }

      var towers = g.towers.slice().sort(function (a, b) { return a.y - b.y; });
      for (var i = 0; i < towers.length; i++) {
        drawTower(ctx, towers[i]);
        if (towers[i] === g.selected) {
          ctx.save();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4;
          ctx.setLineDash([5, 4]);
          rrect(ctx, towers[i].cx * CELL + 2, towers[i].cy * CELL + 2, CELL - 4, CELL - 4, 7);
          ctx.stroke();
          ctx.restore();
        }
      }

      var ground = [], air = [];
      for (var e = 0; e < g.enemies.length; e++) {
        (g.enemies[e].flying ? air : ground).push(g.enemies[e]);
      }
      ground.sort(function (a, b) { return a.y - b.y; });
      for (var a1 = 0; a1 < ground.length; a1++) drawEnemy(ctx, ground[a1], g.time);
      for (var a2 = 0; a2 < air.length; a2++)    drawEnemy(ctx, air[a2], g.time);

      for (var p = 0; p < g.projectiles.length; p++) drawProjectile(ctx, g.projectiles[p], g.time);
      for (var f = 0; f < g.effects.length; f++)     drawEffect(ctx, g.effects[f], g.time);
      for (var lb = 0; lb < g.lootboxes.length; lb++) drawLootbox(ctx, g.lootboxes[lb], g.time);

      for (var pa = 0; pa < g.particles.length; pa++) {
        var q = g.particles[pa];
        var al = U.clamp(q.life / q.maxLife, 0, 1);
        ctx.save();
        if (q.glow) { ctx.shadowColor = q.color; ctx.shadowBlur = 8; }
        ctx.globalAlpha = al;
        ctx.fillStyle = q.color;
        circle(ctx, q.x, q.y, q.size * (0.35 + al * 0.65));
        ctx.fill();
        ctx.restore();
      }

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var ft = 0; ft < g.texts.length; ft++) {
        var t2 = g.texts[ft];
        var al2 = U.clamp(t2.life / t2.maxLife, 0, 1);
        ctx.save();
        ctx.globalAlpha = al2;
        ctx.font = (t2.big ? 'bold 20px ' : 'bold 15px ') + 'Segoe UI, Roboto, sans-serif';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = INK;
        ctx.strokeText(t2.text, t2.x, t2.y);
        ctx.fillStyle = t2.color;
        ctx.fillText(t2.text, t2.x, t2.y);
        ctx.restore();
      }

      ctx.restore();

      if (g.hurtFlash > 0) {
        ctx.save();
        ctx.globalAlpha = g.hurtFlash * 0.5;
        var vg = ctx.createRadialGradient(W / 2, CH / 2, CH * 0.25, W / 2, CH / 2, CH * 0.8);
        vg.addColorStop(0, 'rgba(255,0,40,0)');
        vg.addColorStop(1, 'rgba(255,0,40,.9)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, CH);
        ctx.restore();
      }

      if (g.paused && g.state === 'playing' && !g.pendingQuiz) {
        ctx.save();
        ctx.fillStyle = 'rgba(4,8,18,.55)';
        ctx.fillRect(0, 0, W, CH);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.lineJoin = 'round';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = 'bold 46px Segoe UI, Roboto, sans-serif';
        ctx.strokeText('PAUSE', W / 2, CH / 2 - 10);
        ctx.fillText('PAUSE', W / 2, CH / 2 - 10);
        ctx.font = '16px Segoe UI, Roboto, sans-serif';
        ctx.lineWidth = 4;
        ctx.strokeText('Zum Fortsetzen antippen', W / 2, CH / 2 + 28);
        ctx.fillStyle = '#c9d6f0';
        ctx.fillText('Zum Fortsetzen antippen', W / 2, CH / 2 + 28);
        ctx.restore();
      }
    }
  };
})(window);
