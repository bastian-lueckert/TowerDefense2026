/* =========================================================
   waves.js – Prozedurale Wellengenerierung
   Deterministisch pro Wellennummer (gleiche Welle = gleicher
   Aufbau), skaliert unbegrenzt weiter (Endlosmodus).
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;

  /* Ab welcher Welle ein Typ auftauchen darf + Budgetkosten + Spawnabstand.
     ramp/rampRate begrenzen, wie viele davon in den ersten Wellen nach
     ihrer Einführung höchstens vorkommen – ein neuer Gegnertyp soll sich
     ankündigen und nicht sofort in Massen auftreten. */
  var POOL = [
    { type:'grunt',  from:1,  cost:4,   gap:0.62, weight:3.0 },
    { type:'runner', from:2,  cost:5,   gap:0.48, weight:2.2 },
    { type:'swarm',  from:4,  cost:1.6, gap:0.22, weight:1.8, ramp:6, rampRate:3 },
    { type:'flyer',  from:7,  cost:9.5, gap:0.55, weight:2.0, ramp:2, rampRate:0.9 },
    { type:'tank',   from:9,  cost:15,  gap:0.95, weight:1.8, ramp:2, rampRate:0.7 },
    { type:'shield', from:12, cost:13,  gap:0.85, weight:1.5, ramp:2, rampRate:0.6 },
    { type:'healer', from:15, cost:17,  gap:1.05, weight:1.1, ramp:1, rampRate:0.4 }
  ];

  /** Höchstzahl eines Typs in Welle n (Infinity = unbegrenzt). */
  function limitFor(p, n) {
    if (!p.ramp) return Infinity;
    return Math.max(1, Math.round(p.ramp + (n - p.from) * p.rampRate));
  }

  var BOSS_EVERY = 10;

  /** Lebenspunkte-Faktor der Welle. */
  function hpScale(n) {
    return 1 + 0.145 * (n - 1) + 0.0075 * (n - 1) * (n - 1);
  }

  /** Belohnungsfaktor – wächst deutlich langsamer als die HP. */
  function goldScale(n) {
    return 1 + 0.022 * (n - 1);
  }

  var API = TD.waves = {

    hpScale: hpScale,
    goldScale: goldScale,
    BOSS_EVERY: BOSS_EVERY,

    isBossWave: function (n) { return n % BOSS_EVERY === 0; },

    /**
     * Erzeugt die Wellenbeschreibung.
     * @param {number} n bestimmt, welche Gegnerarten auftreten
     * @param {string} diffKey
     * @param {number} [sizeWave] bestimmt den Umfang der Welle. Im Feldzug
     *        ist das die Welle innerhalb des Levels – so bleiben die Wellen
     *        kurz genug, auch wenn schon schwere Arten dabei sind.
     * @returns {{n:number, groups:Array, boss:boolean, totalEnemies:number}}
     */
    generate: function (n, diffKey, sizeWave) {
      var rnd = U.rng(n * 7919 + hashStr(diffKey || 'normal'));
      var boss = API.isBossWave(n);
      var groups = [];
      var sw = sizeWave == null ? n : sizeWave;

      // Verfügbare Typen dieser Welle
      var avail = POOL.filter(function (p) { return n >= p.from; });

      // Budget bestimmt den Umfang der Welle
      var budget = 12 + sw * 7.5 + Math.pow(sw, 1.55);
      if (boss) budget *= 0.55;   // Boss frisst einen Teil des Kontingents

      // Ganz frühe Wellen bewusst klein und ruhig halten
      if (sw <= 2) budget = 10 + sw * 5;

      var counts = {};
      var guard = 0;
      while (budget > 1 && guard++ < 400) {
        // Nur Typen, die ihr Kontingent noch nicht ausgeschöpft haben
        var open = avail.filter(function (q) {
          return (counts[q.type] || 0) < limitFor(q, n);
        });
        if (!open.length) break;

        var p = weightedPick(open, rnd, n);
        if (!p || (p.cost > budget && p.cost > 3)) {
          var cheap = open.filter(function (q) { return q.cost <= budget; });
          if (!cheap.length) break;
          p = weightedPick(cheap, rnd, n);
        }
        if (!p) break;
        counts[p.type] = (counts[p.type] || 0) + 1;
        budget -= p.cost;
      }

      // Gruppen bilden, Reihenfolge: schnelle zuerst, schwere hinten
      var order = ['swarm', 'runner', 'grunt', 'flyer', 'shield', 'tank', 'healer'];
      var delay = 0;
      order.forEach(function (type) {
        var c = counts[type];
        if (!c) return;
        var def = POOL.filter(function (q) { return q.type === type; })[0];
        // Sehr große Gruppen aufteilen, damit Wellen nicht ewig dauern
        var gap = def.gap;
        if (c > 24) gap *= 0.6;
        else if (c > 14) gap *= 0.8;

        groups.push({ type: type, count: c, gap: gap, delay: delay });
        delay += Math.min(c * gap * 0.55, 6);
      });

      if (boss) {
        var bossCount = 1 + Math.floor((n - BOSS_EVERY) / (BOSS_EVERY * 3));
        groups.push({ type: 'boss', count: bossCount, gap: 2.4, delay: delay + 1.5 });
      }

      var total = groups.reduce(function (s, g) { return s + g.count; }, 0);
      return { n: n, groups: groups, boss: boss, totalEnemies: total };
    },

    /** Aggregierte Vorschau für die Oberfläche. */
    preview: function (wave) {
      var map = {};
      wave.groups.forEach(function (g) { map[g.type] = (map[g.type] || 0) + g.count; });
      return Object.keys(map).map(function (t) { return { type: t, count: map[t] }; });
    },

    /** Werte eines Gegners in einer bestimmten Welle. */
    statsFor: function (type, n, diff) {
      var base = TD.ENEMIES[type];
      var s = hpScale(n) * diff.hpMul;
      // Bosse skalieren etwas flacher, sonst werden sie unschlagbar
      if (base.boss) s = (1 + 0.11 * (n - 1) + 0.004 * (n - 1) * (n - 1)) * diff.hpMul;
      return {
        hp: Math.round(base.hp * s),
        gold: Math.max(1, Math.round(base.gold * goldScale(n) * diff.goldMul)),
        score: Math.round(base.score * (1 + 0.05 * (n - 1)) * diff.scoreMul),
        armor: base.armor + Math.floor((n - 1) / 10)
      };
    }
  };

  /** Gewichtete Auswahl; schwere Typen werden mit steigender Welle wahrscheinlicher. */
  function weightedPick(list, rnd, n) {
    if (!list.length) return null;
    var total = 0, i;
    var weights = list.map(function (p) {
      // Je länger ein Typ verfügbar ist, desto häufiger kommt er
      var age = Math.max(0, n - p.from);
      var w = p.weight * (1 + Math.min(age, 20) * 0.05);
      total += w;
      return w;
    });
    var r = rnd() * total;
    for (i = 0; i < list.length; i++) {
      r -= weights[i];
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
})(window);
