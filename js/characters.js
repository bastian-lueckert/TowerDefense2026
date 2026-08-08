/* =========================================================
   characters.js – Hauptfiguren der Kampagne als Pixelgrafik

   Die Portraits werden auf einem 32×32-Raster gezeichnet und
   beim Anzeigen hochskaliert (harte Pixelkanten). Gezeichnet
   wird nur die linke Hälfte, die dann gespiegelt wird – das
   hält die Gesichter symmetrisch und den Code kurz.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD = global.TD || {};

  var SIZE = 32;

  /* -------------------------------------------------------
     Kleines Pixelraster mit Zeichenbefehlen
     ------------------------------------------------------- */
  function Grid(n) {
    this.n = n;
    this.px = [];
    for (var i = 0; i < n * n; i++) this.px.push(null);
  }

  Grid.prototype.set = function (x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.n || y >= this.n) return;
    this.px[y * this.n + x] = c;
  };

  Grid.prototype.get = function (x, y) {
    if (x < 0 || y < 0 || x >= this.n || y >= this.n) return null;
    return this.px[y * this.n + x];
  };

  Grid.prototype.rect = function (x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  };

  /** Gefüllte Ellipse – die Grundform für Köpfe und Schultern. */
  Grid.prototype.ellipse = function (cx, cy, rx, ry, c) {
    for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        var dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1.02) this.set(x, y, c);
      }
    }
    return this;
  };

  /** Trapez, z. B. für Helme und Kopftücher. */
  Grid.prototype.trapez = function (y, h, wTop, wBot, cx, c) {
    for (var j = 0; j < h; j++) {
      var t = h === 1 ? 0 : j / (h - 1);
      var w = wTop + (wBot - wTop) * t;
      for (var i = Math.round(cx - w / 2); i <= Math.round(cx + w / 2); i++) {
        this.set(i, y + j, c);
      }
    }
    return this;
  };

  /** Alles rechts der Mitte aus der linken Hälfte spiegeln. */
  Grid.prototype.mirror = function () {
    var half = this.n / 2;
    for (var y = 0; y < this.n; y++) {
      for (var x = 0; x < half; x++) {
        this.set(this.n - 1 - x, y, this.get(x, y));
      }
    }
    return this;
  };

  /** Dunkle Kontur um alle gefüllten Bereiche legen. */
  Grid.prototype.outline = function (c) {
    var copy = this.px.slice();
    var self = this;
    function filled(x, y) {
      if (x < 0 || y < 0 || x >= self.n || y >= self.n) return false;
      return copy[y * self.n + x] != null;
    }
    for (var y = 0; y < this.n; y++) {
      for (var x = 0; x < this.n; x++) {
        if (filled(x, y)) continue;
        if (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) {
          this.set(x, y, c);
        }
      }
    }
    return this;
  };

  /* Auch von scenes.js für die Missionsbilder genutzt */
  TD.PixelGrid = Grid;

  /* -------------------------------------------------------
     Gemeinsame Bausteine
     ------------------------------------------------------- */

  /** Gesicht mit Augen und Mund; alles links der Mitte. */
  function face(g, p, opts) {
    opts = opts || {};
    var cy = opts.cy || 15;
    g.ellipse(16, cy, 6.5, 7, p.skin);
    // Schattenseite
    for (var y = cy - 7; y <= cy + 7; y++) {
      for (var x = 9; x <= 12; x++) {
        if (g.get(x, y) === p.skin) g.set(x, y, p.skinDark);
      }
    }
    // Augen (nur links, wird gespiegelt)
    g.rect(12, cy - 1, 2, 2, '#ffffff');
    g.set(13, cy - 1, p.eye);
    g.set(13, cy, p.eye);
    // Braue
    g.rect(12, cy - 3, 3, 1, opts.brow || p.hair);
    // Mund
    g.rect(14, cy + 4, 2, 1, p.mouth || '#8a4a4a');
  }

  /** Schultern und Brustpartie. */
  function shoulders(g, p, cloth, trim) {
    g.ellipse(16, 33, 12, 8, cloth);
    g.rect(4, 26, 24, 6, cloth);
    // Kragen
    g.rect(11, 24, 10, 2, trim);
    // Schulterstück links
    g.ellipse(7, 27, 4, 3, trim);
  }

  /* -------------------------------------------------------
     Die vier Hauptfiguren
     ------------------------------------------------------- */
  var BUILDERS = {

    /* Ritterin mit Federbusch – Visier offen */
    medieval: function () {
      var p = {
        skin: '#e0a878', skinDark: '#c08a5c', eye: '#2b3a5e',
        hair: '#4a3520', mouth: '#8a4a4a'
      };
      var g = new Grid(SIZE);
      var steel = '#9aa5bd', steelDark = '#6a7590', blue = '#3a5f9e', gold = '#e8c46a';

      shoulders(g, p, blue, steel);
      face(g, p, { cy: 15 });

      // Kettenhaube seitlich
      g.rect(8, 12, 3, 9, steelDark);
      // Helmglocke
      g.trapez(4, 8, 11, 15, 16, steel);
      g.trapez(4, 3, 11, 13, 16, '#b6c0d6');
      // Nasenschutz
      g.rect(15, 11, 2, 6, steelDark);
      // Stirnband
      g.rect(8, 11, 16, 1, gold);
      // Federbusch
      g.rect(15, 0, 2, 4, '#c1402f');
      g.ellipse(16, 1, 3, 2, '#d9503d');

      g.mirror();
      g.outline('#1b1524');
      return g;
    },

    /* Schildmaid – Helm ohne Hörner, Zöpfe, Fellkragen */
    viking: function () {
      var p = {
        skin: '#e8b487', skinDark: '#c6926a', eye: '#3a6a4a',
        hair: '#b0552a', mouth: '#8a4a4a'
      };
      var g = new Grid(SIZE);
      var steel = '#9fa8b8', fur = '#8a6a45', leather = '#7a4a28', copper = '#c98a3a';

      shoulders(g, p, leather, fur);
      // Zöpfe über den Schultern
      g.ellipse(7, 22, 2.5, 6, p.hair);
      g.rect(6, 26, 3, 3, '#8f4321');

      face(g, p, { cy: 16 });
      // Haar unter dem Helm
      g.rect(8, 13, 3, 8, p.hair);
      // Rundhelm – bewusst ohne Hörner
      g.trapez(6, 7, 12, 15, 16, steel);
      g.ellipse(16, 8, 7.5, 4, '#b3bccb');
      // Helmspange und Nasensteg
      g.rect(15, 8, 2, 8, copper);
      g.rect(8, 12, 16, 1, copper);
      // Kriegsbemalung
      g.rect(11, 18, 1, 3, '#2b4d8a');
      g.rect(13, 19, 1, 2, '#2b4d8a');

      g.mirror();
      g.outline('#1b1524');
      return g;
    },

    /* Legat mit Querkamm und rotem Umhang */
    roman: function () {
      var p = {
        skin: '#dda071', skinDark: '#b8804f', eye: '#4a3520',
        hair: '#3a2a1a', mouth: '#8a4a4a'
      };
      var g = new Grid(SIZE);
      var bronze = '#c9a24a', bronzeDark = '#96762f', red = '#a83232', linen = '#e8e0cc';

      shoulders(g, p, red, bronze);
      // Schuppenpanzer angedeutet
      g.rect(10, 27, 12, 1, bronzeDark);
      g.rect(10, 29, 12, 1, bronzeDark);

      face(g, p, { cy: 16 });
      // Kurzes Haar
      g.rect(9, 10, 8, 3, p.hair);
      // Helmglocke
      g.trapez(7, 7, 12, 15, 16, bronze);
      g.ellipse(16, 9, 7.5, 4, '#dcb75e');
      // Wangenklappen
      g.rect(8, 14, 3, 6, bronze);
      // Querkamm
      g.rect(6, 4, 20, 2, red);
      g.ellipse(16, 4, 10, 2, '#c14545');
      g.rect(15, 5, 2, 3, bronzeDark);
      // Stirnband
      g.rect(8, 13, 16, 1, linen);

      g.mirror();
      g.outline('#1b1524');
      return g;
    },

    /* Onna-musha: hochgebundenes Haar, Stirnband, Schulterplatten */
    japan: function () {
      var p = {
        skin: '#e8c19c', skinDark: '#c9a077', eye: '#241a2b',
        hair: '#1e1a24', mouth: '#a05a5a'
      };
      var g = new Grid(SIZE);
      var lacquer = '#8f2f3a', steel = '#8a93a3', gold = '#e0b24a', silk = '#2f3b52';

      shoulders(g, p, lacquer, steel);
      // Geschnürte Schulterplatten
      g.rect(5, 26, 22, 1, gold);
      g.rect(5, 29, 22, 1, gold);
      g.ellipse(7, 27, 4, 3, steel);

      // Haarsträhnen fallen über die Schultern
      g.ellipse(7, 21, 2.6, 6, p.hair);

      face(g, p, { cy: 16 });

      // Haaransatz und Seitenhaar
      g.ellipse(16, 11, 8, 6, p.hair);
      g.rect(8, 11, 3, 9, p.hair);
      // Hochgebundener Knoten
      g.ellipse(16, 5, 4, 3.5, p.hair);
      g.rect(14, 3, 5, 2, lacquer);
      // Stirnband mit Wappenscheibe
      g.rect(8, 12, 16, 2, lacquer);
      g.ellipse(16, 13, 2, 1.5, gold);
      // Kragen des Untergewands
      g.rect(12, 24, 8, 2, silk);

      g.mirror();
      g.outline('#1b1524');
      return g;
    },

    /* Priesterin mit Nemes-Kopftuch und breitem Halskragen */
    egyptian: function () {
      var p = {
        skin: '#c98a52', skinDark: '#a66c3a', eye: '#1b1524',
        hair: '#1b1524', mouth: '#8a4a4a'
      };
      var g = new Grid(SIZE);
      var blue = '#2f6f8a', gold = '#e0b24a', linen = '#e8dcc0', turq = '#3aa89a';

      shoulders(g, p, linen, gold);
      // Breiter Halskragen in Ringen
      g.ellipse(16, 27, 10, 4, gold);
      g.ellipse(16, 27, 8, 3, turq);
      g.ellipse(16, 27, 6, 2, blue);

      face(g, p, { cy: 16 });
      // Nemes-Kopftuch: fällt seitlich über die Schultern
      g.rect(7, 12, 4, 12, blue);
      g.rect(7, 12, 2, 12, gold);
      // Kopfteil
      g.trapez(7, 7, 13, 17, 16, blue);
      g.rect(8, 12, 16, 2, gold);
      // Streifenmuster
      g.rect(9, 8, 14, 1, gold);
      g.rect(9, 10, 14, 1, gold);
      // Uräus-Schlange an der Stirn
      g.rect(15, 6, 2, 3, gold);
      g.set(15, 5, turq); g.set(16, 5, turq);
      // Kajal-Strich am Auge
      g.rect(10, 15, 3, 1, '#1b1524');

      g.mirror();
      g.outline('#1b1524');
      return g;
    }
  };

  /* -------------------------------------------------------
     Öffentliche Schnittstelle
     ------------------------------------------------------- */
  var cache = {};

  TD.characters = {

    /** Steckbrief der Hauptfigur eines Volkes. */
    info: function (factionKey) {
      var f = TD.factions.get(factionKey);
      return f.hero;
    },

    /** Fertiges Pixelraster (wird zwischengespeichert). */
    grid: function (factionKey) {
      if (!cache[factionKey]) {
        var build = BUILDERS[factionKey] || BUILDERS.medieval;
        cache[factionKey] = build();
      }
      return cache[factionKey];
    },

    /**
     * Portrait in ein Canvas zeichnen.
     * @param {HTMLCanvasElement} canvas
     * @param {string} factionKey
     * @param {number} scale Pixelgröße (z. B. 6 => 192×192)
     */
    draw: function (canvas, factionKey, scale) {
      scale = scale || 6;
      var g = TD.characters.grid(factionKey);
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      var size = SIZE * scale;

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';

      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.imageSmoothingEnabled = false;   // harte Pixelkanten
      ctx.clearRect(0, 0, size, size);

      for (var y = 0; y < SIZE; y++) {
        for (var x = 0; x < SIZE; x++) {
          var c = g.get(x, y);
          if (!c) continue;
          ctx.fillStyle = c;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  };
})(window);
