/* =========================================================
   config.js – Spielbalance: Türme, Gegner, Schwierigkeiten
   Reichweiten/Tempo in Zellen bzw. Zellen pro Sekunde.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD = global.TD || {};

  /* Logische Spielfeldmaße – Canvas ist immer 960×576. */
  TD.GRID = { COLS: 20, ROWS: 12, CELL: 48 };

  /* ---------------------------------------------------------
     TÜRME
     upg: Werte, die pro Stufe addiert werden (level 1..4).
     --------------------------------------------------------- */
  TD.TOWERS = {

    gun: {
      key: 'gun', name: 'MG-Turm', hotkey: '1',
      desc: 'Günstig, schnell, zuverlässig.',
      color: '#5ad1ff', accent: '#0e3a55',
      cost: 50, damage: 7, range: 2.7, rate: 2.0,   // Schuss/s
      projectile: 'bullet', speed: 17, air: true,
      upgradeCost: [45, 90, 180],
      upg: { damage: 5, range: 0.28, rate: 0.5 }
    },

    frost: {
      key: 'frost', name: 'Frostturm', hotkey: '2',
      desc: 'Verlangsamt Gegner im Umkreis.',
      color: '#8ee6ff', accent: '#123b5c',
      cost: 75, damage: 4, range: 2.5, rate: 1.3,
      projectile: 'frost', speed: 12, air: true,
      slow: 0.42, slowDur: 1.6, splash: 0.85,
      upgradeCost: [70, 140, 260],
      upg: { damage: 3, range: 0.25, rate: 0.22, slow: 0.07, slowDur: 0.35, splash: 0.12 }
    },

    cannon: {
      key: 'cannon', name: 'Kanone', hotkey: '3',
      desc: 'Flächenschaden. Trifft keine Flieger.',
      color: '#ffa14a', accent: '#4a2410',
      cost: 110, damage: 24, range: 2.9, rate: 0.6,
      projectile: 'shell', speed: 8.5, air: false,
      splash: 1.15,
      upgradeCost: [100, 200, 380],
      upg: { damage: 18, range: 0.25, rate: 0.12, splash: 0.18 }
    },

    tesla: {
      key: 'tesla', name: 'Teslaspule', hotkey: '4',
      desc: 'Blitz springt auf mehrere Ziele über.',
      color: '#c88bff', accent: '#3a1a5c',
      cost: 145, damage: 13, range: 2.6, rate: 1.0,
      projectile: 'beam', speed: 0, air: true,
      chain: 3, chainFalloff: 0.7, chainRange: 2.2,
      upgradeCost: [130, 260, 480],
      upg: { damage: 10, range: 0.22, rate: 0.2, chain: 1, chainRange: 0.2 }
    },

    sniper: {
      key: 'sniper', name: 'Scharfschütze', hotkey: '5',
      desc: 'Enorme Reichweite, ignoriert Panzerung.',
      color: '#ffd166', accent: '#5c4212',
      cost: 170, damage: 62, range: 6.2, rate: 0.5,
      projectile: 'rail', speed: 40, air: true,
      pierceArmor: true, crit: 0.2, critMul: 2.5,
      upgradeCost: [155, 300, 560],
      upg: { damage: 48, range: 0.7, rate: 0.1, crit: 0.08 }
    },

    poison: {
      key: 'poison', name: 'Giftwerfer', hotkey: '6',
      desc: 'Gift wirkt über Zeit – stark gegen Panzer.',
      color: '#7ee081', accent: '#164a20',
      cost: 130, damage: 6, range: 2.6, rate: 0.9,
      projectile: 'blob', speed: 9, air: true,
      splash: 1.0, poison: 9, poisonDur: 4,
      upgradeCost: [120, 240, 440],
      upg: { damage: 4, range: 0.22, rate: 0.15, poison: 7, poisonDur: 0.6, splash: 0.12 }
    }
  };

  TD.TOWER_ORDER = ['gun', 'frost', 'cannon', 'tesla', 'sniper', 'poison'];

  /* Beim Verkauf zurückerstatteter Anteil der Gesamtinvestition. */
  TD.SELL_RATIO = 0.7;

  /* ---------------------------------------------------------
     GEGNER
     speed in Zellen/s, armor = flache Schadensreduktion.
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
    hard:   { key:'hard',   name:'Schwer',  desc:'35 Wellen · zäh · 15 Leben',       lives:15, gold:220, hpMul:1.35, waves:35, goldMul:0.88, scoreMul:1.5 },
    endless:{ key:'endless',name:'Endlos',  desc:'Unendlich viele Wellen · 20 Leben',lives:20, gold:260, hpMul:1.00, waves:Infinity, goldMul:1.00, scoreMul:1.3 }
  };

  TD.DIFFICULTY_ORDER = ['easy', 'normal', 'hard', 'endless'];

  /* Bonusgold beim frühzeitigen Starten einer Welle (pro verbleibender Sekunde). */
  TD.EARLY_BONUS_PER_SEC = 2;
  /* Pause zwischen den Wellen in Sekunden. */
  TD.WAVE_BREAK = 14;
  /* Verfügbare Spielgeschwindigkeiten. */
  TD.SPEEDS = [1, 2, 3];

  /* Zielprioritäten der Türme. */
  TD.TARGETING = [
    { key:'first',  label:'Erster'  },
    { key:'last',   label:'Letzter' },
    { key:'strong', label:'Stärkst' },
    { key:'close',  label:'Nächst'  }
  ];
})(window);
