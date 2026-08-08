/* =========================================================
   maps.js – Karten, Wege und Wegerzeugung

   Eine Karte kann mehrere Wege haben. Gegner starten dann an
   verschiedenen Portalen; die Wege können getrennt verlaufen
   oder sich unterwegs zu einem gemeinsamen Abschnitt
   vereinigen. Für die Kampagne wird pro Kapitel ein eigener
   Wegverlauf erzeugt, damit sich kein Level wiederholt.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;
  var CELL = TD.GRID.CELL, COLS = TD.GRID.COLS, ROWS = TD.GRID.ROWS;

  /* Die Wegmuster unten sind für 20 × 12 Felder entworfen. Auf dem
     gröberen Handyraster werden die festen Spalten- und Zeilenwerte
     im selben Verhältnis mitgezogen, damit dieselben Formen
     entstehen. Bei 20 × 12 ergibt sich der Ausgangswert exakt
     wieder – die gewohnten Karten bleiben also unverändert. */
  function sx(v) { return U.clamp(Math.round(v * COLS / 20), 1, COLS - 2); }
  function sy(v) { return U.clamp(Math.round(v * ROWS / 12), 1, ROWS - 2); }

  var PATH_W = Math.round(CELL * 0.86);
  TD.PATH_W = PATH_W;

  /* -------------------------------------------------------
     Grafische Themen
     ------------------------------------------------------- */
  var THEMES = {
    meadow: { id:'meadow', name:'Grüne Ebene',
      grass:'#20402c', grass2:'#295237', path:'#7a6244', pathEdge:'#5b4830', rock:'#3d4a55', deco:'#2c6b42' },
    canyon: { id:'canyon', name:'Wüstenschlucht',
      grass:'#4a3a24', grass2:'#57452b', path:'#9c7d4f', pathEdge:'#755c38', rock:'#6b533a', deco:'#7a6440' },
    frost:  { id:'frost', name:'Frostpass',
      grass:'#1e3350', grass2:'#26405f', path:'#b9cfe0', pathEdge:'#8aa6bd', rock:'#435c74', deco:'#5b83a8' },
    ruins:  { id:'ruins', name:'Alte Ruinen',
      grass:'#2c2a3d', grass2:'#363450', path:'#8d8296', pathEdge:'#645c6e', rock:'#4a4560', deco:'#5a5273' },
    bamboo: { id:'bamboo', name:'Bambuswald',
      grass:'#1c3a2c', grass2:'#254a37', path:'#a89468', pathEdge:'#7d6c4a', rock:'#4a5560', deco:'#3f7a52' }
  };

  TD.MAP_THEMES = THEMES;

  /* -------------------------------------------------------
     Feste Karten für das freie Spiel
     routes: Liste von Wegen, jeder als Folge von Rasterpunkten
     ------------------------------------------------------- */
  var DEFS = [
    {
      id: 'meadow', theme: 'meadow', name: 'Grüne Ebene', diffHint: 'Ein Weg · Einsteiger',
      decoSeed: 1337, blocks: 10, specials: 7,
      routes: [ [[-1,6],[4,6],[4,2],[9,2],[9,9],[14,9],[14,4],[20,4]] ]
    },
    {
      id: 'canyon', theme: 'canyon', name: 'Wüstenschlucht', diffHint: 'Zwei Wege · Mittel',
      decoSeed: 2718, blocks: 12, specials: 7,
      routes: [
        [[-1,2],[5,2],[5,6],[11,6],[11,10],[16,10],[16,6],[20,6]],
        [[-1,10],[3,10],[3,7],[8,7],[8,3],[13,3],[13,6],[16,6]]
      ]
    },
    {
      id: 'frost', theme: 'frost', name: 'Frostpass', diffHint: 'Ein Weg · Fortgeschritten',
      decoSeed: 4242, blocks: 12, specials: 7,
      routes: [ [[-1,10],[2,10],[2,2],[17,2],[17,7],[6,7],[6,10],[20,10]] ]
    },
    {
      id: 'ruins', theme: 'ruins', name: 'Alte Ruinen', diffHint: 'Drei Wege · Experte',
      decoSeed: 9001, blocks: 14, specials: 8,
      routes: [
        [[-1,1],[6,1],[6,5],[12,5],[12,8],[20,8]],
        [[-1,11],[4,11],[4,8],[12,8]],
        [[9,-1],[9,3],[12,3],[12,8]]
      ]
    }
  ];

  /* Die festen Karten oben sind von Hand für 20 × 12 gezeichnet. Auf
     dem Handyraster werden ihre Stützpunkte verhältnisgleich
     umgerechnet; Werte außerhalb des Feldes (-1 als Startportal,
     20 bzw. 12 als Ziel am Rand) bleiben Randmarken. Fallen zwei
     Punkte durch das Runden zusammen, entfällt der Knick – der Weg
     bleibt zusammenhängend und rechtwinklig. */
  if (TD.GRID.COMPACT) {
    DEFS.forEach(function (def) {
      def.routes = def.routes.map(function (route) {
        var out = [];
        route.forEach(function (p) {
          var x = p[0] < 0 ? -1 : (p[0] >= 20 ? COLS : U.clamp(Math.round(p[0] * COLS / 20), 1, COLS - 1));
          var y = p[1] < 0 ? -1 : (p[1] >= 12 ? ROWS : U.clamp(Math.round(p[1] * ROWS / 12), 1, ROWS - 1));
          var last = out[out.length - 1];
          if (last && last[0] === x && last[1] === y) return;   // Knick entfällt
          out.push([x, y]);
        });
        return out;
      });
    });
  }

  /* =======================================================
     Wegerzeugung für die Kampagne
     ======================================================= */

  /** Zufällige, aber spielbare Serpentine von einem Rand zum Ziel. */
  function snake(rnd, start, target, turns, band) {
    var pts = [start.slice()];
    var x = start[0], y = start[1];
    var minY = band ? band[0] : 1, maxY = band ? band[1] : ROWS - 2;

    // Spalten, an denen der Weg die Richtung wechselt
    var cols = [];
    var from = Math.max(2, Math.min(x + 3, COLS - 3));
    var span = (target[0] - from) / (turns + 1);
    for (var i = 1; i <= turns; i++) {
      cols.push(Math.round(from + span * i + (rnd() - 0.5) * span * 0.5));
    }

    var high = rnd() < 0.5;
    cols.forEach(function (cx) {
      cx = U.clamp(cx, 2, COLS - 2);
      if (cx === x) return;
      pts.push([cx, y]);                       // waagerecht
      var ny = high ? U.randIntR(rnd, minY, minY + 2)
                    : U.randIntR(rnd, maxY - 2, maxY);
      if (Math.abs(ny - y) < 2) ny = high ? minY : maxY;
      pts.push([cx, ny]);                      // senkrecht
      y = ny; x = cx;
      high = !high;
    });

    // Zum Ziel einschwenken
    if (y !== target[1]) {
      var lastX = U.clamp(Math.round((x + target[0]) / 2), x + 1, COLS - 2);
      pts.push([lastX, y]);
      pts.push([lastX, target[1]]);
    }
    pts.push(target.slice());
    return pts;
  }

  /** Ganzzahliger Zufall mit übergebenem Generator. */
  U.randIntR = function (rnd, a, b) {
    return Math.floor(a + rnd() * (b - a + 1));
  };

  /**
   * Erzeugt eine Kartendefinition.
   * @param {string} themeId
   * @param {number} seed
   * @param {string} pattern single | twin | fork | triple | cross
   */
  function generate(themeId, seed, pattern) {
    var rnd = U.rng(seed);
    var baseY = U.randIntR(rnd, 3, ROWS - 4);
    var target = [COLS, baseY];
    var routes = [];

    switch (pattern) {

      case 'twin':            // zwei getrennte Wege zum selben Ziel
        routes.push(snake(rnd, [-1, U.randIntR(rnd, 1, sy(3))], target, U.randIntR(rnd, 2, 3), [1, sy(5)]));
        routes.push(snake(rnd, [-1, U.randIntR(rnd, ROWS - 4, ROWS - 2)], target, U.randIntR(rnd, 2, 3), [sy(6), ROWS - 2]));
        break;

      case 'fork': {          // zwei Starts, die sich vereinigen
        var joinX = U.randIntR(rnd, sx(9), sx(13));
        var joinY = baseY;
        var join = [joinX, joinY];
        routes.push(snake(rnd, [-1, U.randIntR(rnd, 1, sy(3))], join, 2, [1, sy(5)])
                    .concat([[COLS, baseY]]));
        routes.push(snake(rnd, [-1, U.randIntR(rnd, ROWS - 4, ROWS - 2)], join, 2, [sy(6), ROWS - 2])
                    .concat([[COLS, baseY]]));
        break;
      }

      case 'triple': {        // drei Zuläufe, gemeinsames Endstück
        var jx = U.randIntR(rnd, sx(11), sx(14));
        var j = [jx, baseY];
        var topX = U.randIntR(rnd, sx(4), sx(7));   // einmal ziehen, mehrfach nutzen
        routes.push(snake(rnd, [-1, U.randIntR(rnd, 1, sy(2))], j, 2, [1, sy(4)]).concat([[COLS, baseY]]));
        routes.push(snake(rnd, [-1, U.randIntR(rnd, ROWS - 3, ROWS - 2)], j, 2, [sy(7), ROWS - 2]).concat([[COLS, baseY]]));
        routes.push([[topX, -1], [topX, baseY], j, [COLS, baseY]]);
        break;
      }

      case 'cross': {         // einer von links, einer von oben
        var cx1 = U.randIntR(rnd, sx(5), sx(9));
        var cy1 = U.randIntR(rnd, sy(5), sy(8));
        var cx2 = U.randIntR(rnd, sx(14), sx(17));
        routes.push(snake(rnd, [-1, U.randIntR(rnd, 2, ROWS - 3)], target, U.randIntR(rnd, 2, 4)));
        routes.push([[cx1, -1], [cx1, cy1], [cx2, cy1], [cx2, baseY], [COLS, baseY]]);
        break;
      }

      default:                // ein einzelner, verschlungener Weg
        routes.push(snake(rnd, [-1, U.randIntR(rnd, 2, ROWS - 3)], target, U.randIntR(rnd, 3, 5)));
        break;
    }

    var th = THEMES[themeId] || THEMES.meadow;
    return {
      id: themeId + '.' + seed + '.' + pattern,
      theme: themeId,
      name: th.name,
      diffHint: '',
      decoSeed: seed * 31 + 7,
      blocks: U.randIntR(rnd, 8, 14),
      specials: 7,
      routes: routes
    };
  }

  /* =======================================================
     Kartendefinition zur spielfertigen Karte ausbauen
     ======================================================= */

  function distToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var len2 = dx * dx + dy * dy;
    var t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
    t = U.clamp(t, 0, 1);
    return U.dist(px, py, ax + dx * t, ay + dy * t);
  }

  /** Doppelte Punkte hintereinander entfernen. */
  function clean(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (out.length && out[out.length - 1].x === p.x && out[out.length - 1].y === p.y) continue;
      out.push(p);
    }
    return out;
  }

  function buildPath(route) {
    var pts = clean(route.map(function (w) {
      return { x: (w[0] + 0.5) * CELL, y: (w[1] + 0.5) * CELL };
    }));
    var cum = [0], total = 0;
    for (var i = 1; i < pts.length; i++) {
      total += U.dist(pts[i-1].x, pts[i-1].y, pts[i].x, pts[i].y);
      cum.push(total);
    }
    return { points: pts, cum: cum, length: total };
  }

  function clampToField(p) {
    return {
      x: U.clamp(p.x, CELL * 0.5, COLS * CELL - CELL * 0.5),
      y: U.clamp(p.y, CELL * 0.5, ROWS * CELL - CELL * 0.5)
    };
  }

  function build(def) {
    var paths = def.routes.map(buildPath);

    /* Zellraster: 1 = Weg, 2 = blockiert, 0 = bebaubar */
    var cells = new Uint8Array(COLS * ROWS);
    var clearance = CELL * 0.82;

    for (var cy = 0; cy < ROWS; cy++) {
      for (var cx = 0; cx < COLS; cx++) {
        var px = (cx + 0.5) * CELL, py = (cy + 0.5) * CELL;
        var best = Infinity;
        for (var p = 0; p < paths.length; p++) {
          var pts = paths[p].points;
          for (var s = 1; s < pts.length; s++) {
            var d = distToSegment(px, py, pts[s-1].x, pts[s-1].y, pts[s].x, pts[s].y);
            if (d < best) best = d;
          }
        }
        if (best < clearance) cells[cy * COLS + cx] = 1;
      }
    }

    /* Deko auf freien Feldern */
    var rnd = U.rng(def.decoSeed);
    var free = [];
    for (var k = 0; k < cells.length; k++) if (cells[k] === 0) free.push(k);
    var want = Math.min(def.blocks, Math.max(0, free.length - 40));
    for (var b = 0; b < want; b++) {
      cells[free.splice(Math.floor(rnd() * free.length), 1)[0]] = 2;
    }

    var decor = [];
    for (var c2 = 0; c2 < cells.length; c2++) {
      if (cells[c2] === 2) {
        decor.push({
          cx: c2 % COLS, cy: Math.floor(c2 / COLS),
          kind: rnd() < 0.55 ? 'rock' : 'tree',
          rot: rnd() * U.TAU, scale: 0.8 + rnd() * 0.4
        });
      }
    }

    /* Besondere Felder in Wegnähe */
    var specials = {}, specialList = [], candidates = [];
    for (var sy = 0; sy < ROWS; sy++) {
      for (var sx = 0; sx < COLS; sx++) {
        if (cells[sy * COLS + sx] !== 0) continue;
        var qx = (sx + 0.5) * CELL, qy = (sy + 0.5) * CELL;
        var near = Infinity;
        for (var p2 = 0; p2 < paths.length; p2++) {
          var pp = paths[p2].points;
          for (var s2 = 1; s2 < pp.length; s2++) {
            var dd = distToSegment(qx, qy, pp[s2-1].x, pp[s2-1].y, pp[s2].x, pp[s2].y);
            if (dd < near) near = dd;
          }
        }
        if (near < CELL * 2.3) candidates.push({ cx: sx, cy: sy });
      }
    }
    var types = TD.SPECIAL_ORDER;
    var wanted = Math.min(def.specials || 7, candidates.length);
    for (var si = 0; si < wanted; si++) {
      var pick = candidates.splice(Math.floor(rnd() * candidates.length), 1)[0];
      candidates = candidates.filter(function (c) {
        return Math.abs(c.cx - pick.cx) > 1 || Math.abs(c.cy - pick.cy) > 1;
      });
      var type = types[si % types.length];
      specials[pick.cx + ',' + pick.cy] = type;
      specialList.push({ cx: pick.cx, cy: pick.cy, type: type, rot: rnd() * U.TAU });
    }

    var last = paths[0].points[paths[0].points.length - 1];

    return {
      id: def.id, name: def.name, diffHint: def.diffHint,
      theme: THEMES[def.theme] || THEMES.meadow,
      paths: paths,
      pathCount: paths.length,
      /* Bequemer Zugriff für alles, was nur einen Weg braucht */
      points: paths[0].points,
      length: paths[0].length,
      cum: paths[0].cum,
      cells: cells, decor: decor,
      specials: specials, specialList: specialList,
      base: last,
      basePx: clampToField(last),
      spawns: paths.map(function (p) { return clampToField(p.points[0]); }),
      spawnPx: clampToField(paths[0].points[0])
    };
  }

  /* =======================================================
     Öffentliche Schnittstelle
     ======================================================= */
  var API = TD.maps = {
    defs: DEFS,
    themes: THEMES,
    build: build,
    generate: generate,

    byId: function (id) {
      for (var i = 0; i < DEFS.length; i++) if (DEFS[i].id === id) return DEFS[i];
      return DEFS[0];
    },

    /** Position auf einem bestimmten Weg bei Distanz d. */
    pointAt: function (map, pathIndex, d) {
      var path = map.paths[pathIndex] || map.paths[0];
      var cum = path.cum, pts = path.points;
      if (d <= 0) return { x: pts[0].x, y: pts[0].y, angle: angleOf(pts[0], pts[1]) };
      if (d >= path.length) {
        var n = pts.length - 1;
        return { x: pts[n].x, y: pts[n].y, angle: angleOf(pts[n-1], pts[n]) };
      }
      var i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      var a = pts[i-1], b = pts[i];
      var segLen = cum[i] - cum[i-1];
      var t = segLen === 0 ? 0 : (d - cum[i-1]) / segLen;
      return { x: U.lerp(a.x, b.x, t), y: U.lerp(a.y, b.y, t), angle: angleOf(a, b) };
    },

    canBuild: function (map, cx, cy) {
      if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return false;
      return map.cells[cy * COLS + cx] === 0;
    },

    specialAt: function (map, cx, cy) {
      var k = map.specials[cx + ',' + cy];
      return k ? TD.SPECIAL_TILES[k] : null;
    },

    /** Vorschau für Menü und Levelauswahl. */
    drawPreview: function (canvas, def, width) {
      var map = build(def);
      var w = canvas.width = width || 240;
      var h = canvas.height = Math.round(w * ROWS / COLS);
      var sc = w / (COLS * CELL);
      var ctx = canvas.getContext('2d');
      var th = map.theme;

      ctx.fillStyle = th.grass;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.scale(sc, sc);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      map.paths.forEach(function (p) {
        ctx.beginPath();
        ctx.moveTo(p.points[0].x, p.points[0].y);
        for (var i = 1; i < p.points.length; i++) ctx.lineTo(p.points[i].x, p.points[i].y);
        ctx.strokeStyle = th.pathEdge; ctx.lineWidth = PATH_W + 8; ctx.stroke();
        ctx.strokeStyle = th.path;     ctx.lineWidth = PATH_W;     ctx.stroke();
      });
      ctx.restore();

      map.spawns.forEach(function (s) { dot(ctx, s.x * sc, s.y * sc, '#45e08a', 5); });
      dot(ctx, map.basePx.x * sc, map.basePx.y * sc, '#ff5d73', 5.5);
    }
  };

  function dot(ctx, x, y, color, r) {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r || 5, 0, U.TAU); ctx.fill();
  }

  function angleOf(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
  API.angleOf = angleOf;
})(window);
