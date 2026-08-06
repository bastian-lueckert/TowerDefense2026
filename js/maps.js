/* =========================================================
   maps.js – Kartendefinitionen und Wegaufbau
   Der Weg wird als Polylinie aus Wegpunkten (Zellkoordinaten)
   beschrieben; Zellen nahe der Linie gelten als unbebaubar.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;
  var CELL = TD.GRID.CELL, COLS = TD.GRID.COLS, ROWS = TD.GRID.ROWS;

  /** Wegbreite in Pixeln. */
  var PATH_W = Math.round(CELL * 0.86);
  TD.PATH_W = PATH_W;

  var DEFS = [
    {
      id: 'meadow', name: 'Grüne Ebene', diffHint: 'Einsteiger',
      theme: { grass:'#20402c', grass2:'#295237', path:'#7a6244', pathEdge:'#5b4830', rock:'#3d4a55', deco:'#2c6b42' },
      decoSeed: 1337, blocks: 10,
      waypoints: [[-1,6],[4,6],[4,2],[9,2],[9,9],[14,9],[14,4],[20,4]]
    },
    {
      id: 'canyon', name: 'Wüstenschlucht', diffHint: 'Mittel',
      theme: { grass:'#4a3a24', grass2:'#57452b', path:'#9c7d4f', pathEdge:'#755c38', rock:'#6b533a', deco:'#7a6440' },
      decoSeed: 2718, blocks: 14,
      waypoints: [[-1,1],[3,1],[3,6],[7,6],[7,1],[11,1],[11,10],[16,10],[16,5],[20,5]]
    },
    {
      id: 'frost', name: 'Frostpass', diffHint: 'Fortgeschritten',
      theme: { grass:'#1e3350', grass2:'#26405f', path:'#b9cfe0', pathEdge:'#8aa6bd', rock:'#435c74', deco:'#5b83a8' },
      decoSeed: 4242, blocks: 12,
      waypoints: [[-1,10],[2,10],[2,2],[17,2],[17,7],[6,7],[6,10],[20,10]]
    },
    {
      id: 'ruins', name: 'Alte Ruinen', diffHint: 'Experte',
      theme: { grass:'#2c2a3d', grass2:'#363450', path:'#8d8296', pathEdge:'#645c6e', rock:'#4a4560', deco:'#5a5273' },
      decoSeed: 9001, blocks: 16,
      waypoints: [[-1,3],[5,3],[5,8],[2,8],[2,11],[9,11],[9,5],[13,5],[13,9],[16,9],[16,1],[20,1]]
    }
  ];

  /** Abstand Punkt -> Strecke. */
  function distToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var len2 = dx * dx + dy * dy;
    var t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
    t = U.clamp(t, 0, 1);
    return U.dist(px, py, ax + dx * t, ay + dy * t);
  }

  /**
   * Baut aus einer Definition die spielfertige Karte:
   * Pixel-Wegpunkte, kumulierte Längen, Zellraster.
   */
  function build(def) {
    var pts = def.waypoints.map(function (w) {
      return { x: (w[0] + 0.5) * CELL, y: (w[1] + 0.5) * CELL };
    });

    // Kumulierte Streckenlängen für Fortschritts-/Zielberechnung
    var cum = [0], total = 0;
    for (var i = 1; i < pts.length; i++) {
      total += U.dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
      cum.push(total);
    }

    // Zellraster: 1 = Weg, 2 = blockiert, 0 = bebaubar
    var cells = new Uint8Array(COLS * ROWS);
    var pathClearance = CELL * 0.82;

    for (var cy = 0; cy < ROWS; cy++) {
      for (var cx = 0; cx < COLS; cx++) {
        var px = (cx + 0.5) * CELL, py = (cy + 0.5) * CELL;
        var best = Infinity;
        for (var s = 1; s < pts.length; s++) {
          var d = distToSegment(px, py, pts[s-1].x, pts[s-1].y, pts[s].x, pts[s].y);
          if (d < best) best = d;
        }
        if (best < pathClearance) cells[cy * COLS + cx] = 1;
      }
    }

    // Deterministische Deko-Hindernisse auf freien Feldern
    var rnd = U.rng(def.decoSeed);
    var free = [];
    for (var k = 0; k < cells.length; k++) if (cells[k] === 0) free.push(k);
    var want = Math.min(def.blocks, Math.max(0, free.length - 40));
    for (var b = 0; b < want; b++) {
      var idx = free.splice(Math.floor(rnd() * free.length), 1)[0];
      cells[idx] = 2;
    }

    // Dekovarianten für die Zeichenroutine merken (Fels/Busch/Größe)
    var decor = [];
    for (var c2 = 0; c2 < cells.length; c2++) {
      if (cells[c2] === 2) {
        decor.push({
          cx: c2 % COLS, cy: Math.floor(c2 / COLS),
          kind: rnd() < 0.55 ? 'rock' : 'tree',
          rot: rnd() * U.TAU,
          scale: 0.8 + rnd() * 0.4
        });
      }
    }

    return {
      id: def.id, name: def.name, diffHint: def.diffHint, theme: def.theme,
      points: pts, cum: cum, length: total,
      cells: cells, decor: decor,
      spawn: pts[0], base: pts[pts.length - 1],
      /** Startpunkt, aber am Rand sichtbar (für Basis-Grafik). */
      basePx: clampToField(pts[pts.length - 1]),
      spawnPx: clampToField(pts[0])
    };
  }

  function clampToField(p) {
    return {
      x: U.clamp(p.x, CELL * 0.5, COLS * CELL - CELL * 0.5),
      y: U.clamp(p.y, CELL * 0.5, ROWS * CELL - CELL * 0.5)
    };
  }

  var API = TD.maps = {
    defs: DEFS,
    build: build,

    byId: function (id) {
      for (var i = 0; i < DEFS.length; i++) if (DEFS[i].id === id) return DEFS[i];
      return DEFS[0];
    },

    /** Position auf dem Weg bei Distanz d (Pixel ab Start). */
    pointAt: function (map, d) {
      var cum = map.cum, pts = map.points;
      if (d <= 0) return { x: pts[0].x, y: pts[0].y, angle: angleOf(pts[0], pts[1]) };
      if (d >= map.length) {
        var n = pts.length - 1;
        return { x: pts[n].x, y: pts[n].y, angle: angleOf(pts[n-1], pts[n]) };
      }
      var i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      var a = pts[i - 1], b = pts[i];
      var segLen = cum[i] - cum[i - 1];
      var t = segLen === 0 ? 0 : (d - cum[i - 1]) / segLen;
      return {
        x: U.lerp(a.x, b.x, t),
        y: U.lerp(a.y, b.y, t),
        angle: angleOf(a, b)
      };
    },

    /** Ist die Zelle bebaubar? */
    canBuild: function (map, cx, cy) {
      if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
      return map.cells[cy * COLS + cx] === 0;
    },

    /** Kleine Kartenvorschau fürs Menü. */
    drawPreview: function (canvas, def) {
      var map = build(def);
      var w = canvas.width = 240, h = canvas.height = Math.round(240 * ROWS / COLS);
      var sc = w / (COLS * CELL);
      var ctx = canvas.getContext('2d');
      var th = def.theme;

      ctx.fillStyle = th.grass;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.scale(sc, sc);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(map.points[0].x, map.points[0].y);
      for (var i = 1; i < map.points.length; i++) ctx.lineTo(map.points[i].x, map.points[i].y);
      ctx.strokeStyle = th.pathEdge; ctx.lineWidth = PATH_W + 8; ctx.stroke();
      ctx.strokeStyle = th.path;     ctx.lineWidth = PATH_W;     ctx.stroke();
      ctx.restore();

      // Start (grün) und Ziel (rot)
      dot(ctx, map.spawnPx.x * sc, map.spawnPx.y * sc, '#45e08a');
      dot(ctx, map.basePx.x  * sc, map.basePx.y  * sc, '#ff5d73');
    }
  };

  function dot(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, U.TAU); ctx.fill();
  }

  function angleOf(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
  API.angleOf = angleOf;
})(window);
