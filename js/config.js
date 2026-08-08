/* =========================================================
   config.js – Spielbalance

   Türme sind in sechs Rollen aufgeteilt. Die Grundwerte stehen
   hier, Namen/Aussehen/Boni liefert die gewählte Spielerklasse
   (factions.js). TD.towerDef() führt beides zusammen.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD = global.TD || {};

  /* ---------------------------------------------------------
     Logische Spielfeldmaße

     PAD_TOP schafft Platz für Türme, die aus der obersten Zeile
     nach oben herausragen – sonst würden sie am Bildrand
     abgeschnitten.

     Auf dem Handy ist der Bildschirm zu klein für 20 × 12 Felder:
     eine Kachel geriete schmaler als eine Fingerkuppe. Dort wird
     deshalb ein gröberes Raster gespielt (16 × 10). Die Kacheln
     werden dadurch rund 40 % größer und das ganze Schlachtfeld
     bleibt ohne Schieben sichtbar.

     Die Wahl fällt einmal beim Laden – alle übrigen Bausteine
     lesen TD.GRID beim Start aus und richten sich danach.
     Mit ?raster=gross bzw. ?raster=klein lässt sie sich erzwingen.
     --------------------------------------------------------- */
  function pickGrid() {
    var forced = (global.location.search.match(/[?&]raster=(klein|gross)/) || [])[1];
    if (!forced) {
      try { forced = global.localStorage.getItem('td2026.raster') || ''; } catch (e) {}
    }

    var coarse = !!(global.matchMedia &&
                    global.matchMedia('(pointer: coarse)').matches);
    var kurzeSeite = Math.min(global.innerWidth || 0, global.innerHeight || 0);
    var handy = (forced === 'klein') ||
                (!forced && coarse && kurzeSeite > 0 && kurzeSeite <= 540);

    return handy ? { COLS: 16, ROWS: 10, CELL: 48, PAD_TOP: 28 }
                 : { COLS: 20, ROWS: 12, CELL: 48, PAD_TOP: 28 };
  }

  TD.GRID = pickGrid();

  /* Ein kleineres Feld bedeutet kürzere Wege. Damit die Gegner
     trotzdem gleich lange unterwegs sind – und die Türme somit
     gleich oft zum Schuss kommen – wird ihr Tempo mitskaliert.
     Bei 20 Spalten ist der Faktor 1, die Balance bleibt dort exakt. */
  TD.GRID.SPEED_SCALE = TD.GRID.COLS / 20;
  TD.GRID.COMPACT = TD.GRID.COLS < 20;

  /* ---------------------------------------------------------
     GRUNDWERTE DER SECHS ROLLEN
     Reichweite in Feldern, Tempo in Schuss pro Sekunde.
     upg = Zuwachs je Ausbaustufe (Stufe 1..4).
     --------------------------------------------------------- */
  TD.ROLE_BASE = {

    rapid: {
      role: 'rapid', hotkey: '1', tier: 0,
      color: '#5ad1ff', accent: '#0e3a55',
      cost: 50, damage: 7, range: 2.7, rate: 2.0,
      projectile: 'bullet', speed: 17, air: true,
      upgradeCost: [45, 90, 180],
      upg: { damage: 5, range: 0.28, rate: 0.5 }
    },

    slow: {
      role: 'slow', hotkey: '2', tier: 0,
      color: '#8ee6ff', accent: '#123b5c',
      cost: 75, damage: 4, range: 2.5, rate: 1.3,
      projectile: 'frost', speed: 12, air: true,
      slow: 0.42, slowDur: 1.6, splash: 0.85,
      upgradeCost: [70, 140, 260],
      upg: { damage: 3, range: 0.25, rate: 0.22, slow: 0.07, slowDur: 0.35, splash: 0.12 }
    },

    splash: {
      role: 'splash', hotkey: '3', tier: 1,
      color: '#ffa14a', accent: '#4a2410',
      cost: 110, damage: 24, range: 2.9, rate: 0.6,
      projectile: 'shell', speed: 8.5, air: false,
      splash: 1.15,
      upgradeCost: [100, 200, 380],
      upg: { damage: 18, range: 0.25, rate: 0.12, splash: 0.18 }
    },

    dot: {
      role: 'dot', hotkey: '4', tier: 2,
      color: '#7ee081', accent: '#164a20',
      cost: 130, damage: 6, range: 2.6, rate: 0.9,
      projectile: 'blob', speed: 9, air: true,
      splash: 1.0, poison: 9, poisonDur: 4,
      upgradeCost: [120, 240, 440],
      upg: { damage: 4, range: 0.22, rate: 0.15, poison: 7, poisonDur: 0.6, splash: 0.12 }
    },

    chain: {
      role: 'chain', hotkey: '5', tier: 3,
      color: '#c88bff', accent: '#3a1a5c',
      cost: 145, damage: 13, range: 2.6, rate: 1.0,
      projectile: 'beam', speed: 0, air: true,
      chain: 3, chainFalloff: 0.7, chainRange: 2.2,
      upgradeCost: [130, 260, 480],
      upg: { damage: 10, range: 0.22, rate: 0.2, chain: 1, chainRange: 0.2 }
    },

    sniper: {
      role: 'sniper', hotkey: '6', tier: 4,
      color: '#ffd166', accent: '#5c4212',
      cost: 170, damage: 62, range: 6.2, rate: 0.5,
      projectile: 'rail', speed: 40, air: true,
      pierceArmor: true, crit: 0.2, critMul: 2.5,
      upgradeCost: [155, 300, 560],
      upg: { damage: 48, range: 0.7, rate: 0.1, crit: 0.08 }
    }
  };

  /* ---------------------------------------------------------
     HELD – die Hauptfigur des Volkes, einmal je Level einsetzbar.
     Deutlich stärker als jeder Turm und mit einer Fähigkeit, die
     sich auflädt und von allein losgeht, sobald sie sich lohnt.
     --------------------------------------------------------- */
  TD.HERO_BASE = {
    role: 'hero', hotkey: 'H', tier: 0, hero: true,
    color: '#ffd166', accent: '#5c4212',
    cost: 240, damage: 34, range: 3.4, rate: 1.15,
    projectile: 'heroshot', speed: 22, air: true,
    pierceArmor: true,                       // Helden ficht Panzerung nicht an
    upgradeCost: [190, 360, 620],
    upg: { damage: 26, range: 0.3, rate: 0.22 }
  };

  /* Reihenfolge im Shop */
  TD.ROLE_ORDER = ['rapid', 'slow', 'splash', 'dot', 'chain', 'sniper'];

  /* Von Beginn an verfügbar */
  TD.STARTER_ROLES = ['rapid', 'slow'];

  /* Reihenfolge, in der Lootboxen die übrigen Türme freischalten */
  TD.UNLOCK_ORDER = ['splash', 'dot', 'chain', 'sniper'];

  /* Werte, auf die sich Klassenboni und Feldeffekte auswirken */
  TD.STATUS_STATS = ['slow', 'slowDur', 'poison', 'poisonDur'];

  /* Beim Verkauf zurückerstatteter Anteil der Gesamtinvestition. */
  TD.SELL_RATIO = 0.7;

  /* ---------------------------------------------------------
     BESONDERE FELDER
     mods[rolle] gilt für diese Rolle, sonst greift mods.all.
     --------------------------------------------------------- */
  TD.SPECIAL_TILES = {

    hill: {
      key: 'hill', name: 'Anhöhe', icon: '▲',
      color: '#7fae5a', glow: '#b7e07a',
      desc: 'Erhöhte Stellung – deutlich mehr Reichweite, ideal für Fernkämpfer.',
      mods: {
        all:    { range: 1.18 },
        sniper: { range: 1.45, damage: 1.10 },
        rapid:  { range: 1.32 },
        splash: { range: 1.15 }
      }
    },

    spring: {
      key: 'spring', name: 'Quelle', icon: '≈', color: '#4aa8d8', glow: '#8fd9ff',
      desc: 'Frisches Wasser verstärkt Verlangsamung und Gift. Wurfmaschinen stehen hier wackelig.',
      mods: {
        all:    { status: 1.35 },
        slow:   { status: 1.60, range: 1.10 },
        dot:    { status: 1.50 },
        chain:  { damage: 1.25 },
        splash: { rate: 0.85 }
      }
    },

    ember: {
      key: 'ember', name: 'Glutspalte', icon: '✦', color: '#d9612e', glow: '#ffa15a',
      desc: 'Heiße Erde befeuert Sprengsätze und Gifte – Frostwirkung schmilzt dahin.',
      mods: {
        all:    { damage: 1.15 },
        splash: { damage: 1.40 },
        dot:    { damage: 1.30, status: 1.25 },
        slow:   { status: 0.60 }
      }
    },

    leyline: {
      key: 'leyline', name: 'Kraftader', icon: '◈', color: '#9a6ad9', glow: '#d0a8ff',
      desc: 'Uralte Energie beschleunigt jeden Turm und lässt Blitze weiter springen.',
      mods: {
        all:    { rate: 1.15 },
        chain:  { rate: 1.30, chain: 2 },
        sniper: { rate: 1.25 },
        slow:   { status: 1.20 }
      }
    }
  };

  TD.SPECIAL_ORDER = ['hill', 'spring', 'ember', 'leyline'];

  /* Ausgleich im freien Spiel, wenn eine Karte mehrere Wege hat:
     Die Verteidigung lässt sich dann nicht bündeln. */
  TD.PATH_BALANCE_FREE = {
    2: { gold: 1.42, hp: 0.78, goldMul: 1.14 },
    3: { gold: 1.62, hp: 0.70, goldMul: 1.24 }
  };

  /* ---------------------------------------------------------
     LOOTBOXEN
     --------------------------------------------------------- */
  TD.LOOT = {
    firstDelay: 22,        // Sekunden bis zur ersten Kiste
    minGap: 26,            // kürzester Abstand zwischen zwei Kisten
    maxGap: 42,            // längster Abstand
    maxOnField: 2,         // gleichzeitig sichtbare Kisten
    lifetime: 34,          // Sekunden, bis eine Kiste wieder verschwindet
    wrongGold: 25,         // Trostgold bei falscher Antwort
    tokenGold: 90          // Zusatzgold, wenn alle Türme bereits frei sind
  };

  /* ---------------------------------------------------------
     GEGNER – mechanische Grundwerte je Rolle.
     Namen, Farben und Aussehen liefert die Mythologie des
     jeweiligen Volkes (factions.js), zusammengeführt in
     TD.enemyDef().
     --------------------------------------------------------- */
  TD.ENEMIES = {
    grunt:  { key:'grunt',  name:'Läufer',    hp: 42,   speed:1.55, gold: 6,   score: 10,  armor:0, leak:1, r:11, color:'#ff7a6b', shape:'circle' },
    runner: { key:'runner', name:'Sprinter',  hp: 30,   speed:3.10, gold: 7,   score: 14,  armor:0, leak:1, r:9,  color:'#ffd166', shape:'tri'    },
    tank:   { key:'tank',   name:'Panzer',    hp: 210,  speed:0.90, gold: 20,  score: 40,  armor:4, leak:2, r:15, color:'#8f9bb3', shape:'square' },
    flyer:  { key:'flyer',  name:'Flieger',   hp: 52,   speed:2.30, gold: 12,  score: 22,  armor:0, leak:1, r:11, color:'#7fd4ff', flying:true, shape:'wing' },
    healer: { key:'healer', name:'Heiler',    hp: 130,  speed:1.25, gold: 26,  score: 55,  armor:1, leak:1, r:13, color:'#7ee081', heal:14, healRange:2.2, shape:'cross' },
    shield: { key:'shield', name:'Schildling',hp: 150,  speed:1.15, gold: 24,  score: 50,  armor:2, leak:2, r:14, color:'#b48bff', shield:0.45, shape:'hex' },
    swarm:  { key:'swarm',  name:'Schwarm',   hp: 18,   speed:2.05, gold: 3,   score: 5,   armor:0, leak:1, r:7,  color:'#ff9fd6', shape:'circle' },
    boss:   { key:'boss',   name:'Koloss',    hp: 2600, speed:0.78, gold: 220, score: 600, armor:6, leak:8, r:23, color:'#ff6a2b', boss:true, shape:'boss' }
  };

  /* ---------------------------------------------------------
     SCHWIERIGKEITSGRADE
     --------------------------------------------------------- */
  TD.DIFFICULTIES = {
    easy:   { key:'easy',   name:'Leicht',  desc:'25 Wellen · viel Gold · 25 Leben', lives:25, gold:320, hpMul:0.80, waves:25, goldMul:1.25, scoreMul:0.7 },
    normal: { key:'normal', name:'Normal',  desc:'30 Wellen · ausgewogen · 20 Leben', lives:20, gold:260, hpMul:1.00, waves:30, goldMul:1.00, scoreMul:1.0 },
    hard:   { key:'hard',   name:'Schwer',  desc:'35 Wellen · zäh · 15 Leben',       lives:15, gold:255, hpMul:1.35, waves:35, goldMul:0.88, scoreMul:1.5 },
    endless:{ key:'endless',name:'Endlos',  desc:'Unendlich viele Wellen · 20 Leben',lives:20, gold:260, hpMul:1.00, waves:Infinity, goldMul:1.00, scoreMul:1.3 }
  };

  TD.DIFFICULTY_ORDER = ['easy', 'normal', 'hard', 'endless'];

  TD.EARLY_BONUS_PER_SEC = 2;
  TD.WAVE_BREAK = 14;
  TD.SPEEDS = [1, 2, 3];

  TD.TARGETING = [
    { key:'first',  label:'Erster'  },
    { key:'last',   label:'Letzter' },
    { key:'strong', label:'Stärkst' },
    { key:'close',  label:'Nächst'  }
  ];

  /* =========================================================
     Gegnerrolle + Volk zu einer Gegnervorlage zusammenführen.
     Die Werte bleiben gleich – nur Name, Farbe und Aussehen
     wechseln mit der Mythologie.
     ========================================================= */
  var enemyCache = {};

  TD.enemyDef = function (factionKey, role) {
    var ck = factionKey + '.' + role;
    if (enemyCache[ck]) return enemyCache[ck];

    var base = TD.ENEMIES[role];
    var f = TD.factions.get(factionKey);
    var skin = (f.enemies && f.enemies[role]) || {};

    var def = {};
    Object.keys(base).forEach(function (k) { def[k] = base[k]; });
    def.role = role;
    def.name = skin.name || base.name;
    def.color = skin.color || base.color;
    def.shape = skin.shape || base.shape;
    def.motif = skin.motif || null;          // mythologisches Erkennungsmerkmal
    def.lore = skin.lore || '';

    enemyCache[ck] = def;
    return def;
  };

  /* =========================================================
     Rolle + Spielerklasse zu einer fertigen Turmvorlage
     zusammenführen (Ergebnis wird zwischengespeichert).
     ========================================================= */
  var defCache = {};

  TD.towerDef = function (factionKey, role) {
    var ck = factionKey + '.' + role;
    if (defCache[ck]) return defCache[ck];

    var isHero = role === 'hero';
    var base = isHero ? TD.HERO_BASE : TD.ROLE_BASE[role];
    var f = TD.factions.get(factionKey);
    var info = isHero
      ? { name: f.hero.name.split(' ')[0], desc: f.hero.title }
      : f.towers[role];
    var b = f.bonus;

    var def = {
      key: role, role: role, faction: factionKey,
      name: info.name, desc: info.desc,
      hotkey: base.hotkey, tier: base.tier,
      color: base.color, accent: base.accent,
      factionColors: f.colors,

      projectile: base.projectile, speed: base.speed, air: base.air,
      chainFalloff: base.chainFalloff, critMul: base.critMul,
      pierceArmor: base.pierceArmor,

      hero: !!base.hero,
      power: isHero ? f.hero.power : null,
      firstStrike: b.firstStrike || 1,     // Bonus gegen unverletzte Gegner
      cost: Math.round(base.cost * b.cost),
      damage: base.damage * b.damage,
      range: base.range * b.range,
      rate: base.rate * b.rate,

      upgradeCost: base.upgradeCost.map(function (c) {
        return Math.round(c * b.upgradeCost);
      }),
      upg: {}
    };

    // Sonderwerte übernehmen, Statuswerte mit dem Klassenbonus verrechnen
    ['splash', 'slow', 'slowDur', 'poison', 'poisonDur', 'chain', 'chainRange', 'crit'].forEach(function (k) {
      if (base[k] == null) return;
      var isStatus = TD.STATUS_STATS.indexOf(k) >= 0;
      def[k] = isStatus ? base[k] * b.status : base[k];
    });

    // Zuwachs je Stufe im gleichen Verhältnis anpassen
    Object.keys(base.upg).forEach(function (k) {
      var v = base.upg[k];
      if (k === 'damage')      v *= b.damage;
      else if (k === 'range')  v *= b.range;
      else if (k === 'rate')   v *= b.rate;
      else if (TD.STATUS_STATS.indexOf(k) >= 0) v *= b.status;
      def.upg[k] = v;
    });

    defCache[ck] = def;
    return def;
  };
})(window);
