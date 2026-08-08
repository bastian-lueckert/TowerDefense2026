/* =========================================================
   progress.js – Alles, was dauerhaft im Browser bleibt

   Gespeichert wird im localStorage unter „td2026.*“:
     campaign  Feldzüge: freigeschaltete Kapitel, Sterne, Punkte
     best      Bestwerte im freien Spiel
     asked     bereits gestellte Truhenfragen je Volk
     stats     Gesamtzahlen über alle Partien
     lastMap / lastDiff / lastFaction / sound

   Zusätzlich lässt sich der komplette Stand als Text sichern
   und wieder einspielen – praktisch für ein Backup oder den
   Wechsel auf ein anderes Gerät.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD;
  var U = TD.utils;

  var KEYS = ['campaign', 'best', 'asked', 'stats',
              'lastMap', 'lastDiff', 'lastFaction', 'sound'];

  var P = TD.progress = {

    /* ---------------- Gestellte Fragen ---------------- */

    /**
     * Bereits gestellte Fragen eines Volkes. Dadurch wiederholt sich
     * über mehrere Level hinweg möglichst wenig.
     */
    askedFor: function (factionKey) {
      var all = U.store.get('asked', {});
      return all[factionKey] || [];
    },

    markAsked: function (factionKey, id) {
      var all = U.store.get('asked', {});
      var list = all[factionKey] || [];
      if (list.indexOf(id) < 0) list.push(id);

      // Sind alle durch, beginnt die Runde von vorn
      var total = TD.factions.get(factionKey).questions.length;
      if (list.length >= total) list = [];

      all[factionKey] = list;
      U.store.set('asked', all);
      return list;
    },

    /** Wie viele Fragen des Volkes schon dran waren. */
    questionProgress: function (factionKey) {
      var total = TD.factions.get(factionKey).questions.length;
      return { seen: P.askedFor(factionKey).length, total: total };
    },

    /* ---------------- Gesamtstatistik ---------------- */

    stats: function () {
      return U.store.get('stats', {
        games: 0, wins: 0, kills: 0, waves: 0,
        chests: 0, correct: 0, playSeconds: 0
      });
    },

    addStats: function (delta) {
      var s = P.stats();
      Object.keys(delta).forEach(function (k) {
        s[k] = (s[k] || 0) + delta[k];
      });
      U.store.set('stats', s);
      return s;
    },

    /* ---------------- Gesamtübersicht ---------------- */

    /** Kurzfassung für die Anzeige im Menü. */
    overview: function () {
      var stars = 0, maxStars = 0, done = 0, levels = 0;
      TD.availableFactions().forEach(function (f) {
        var s = TD.campaign.summary(f);
        stars += s.stars; maxStars += s.maxStars;
        done += s.done; levels += s.count;
      });
      var st = P.stats();
      return {
        stars: stars, maxStars: maxStars,
        levelsDone: done, levelsTotal: levels,
        games: st.games, wins: st.wins, kills: st.kills,
        chests: st.chests, correct: st.correct,
        minutes: Math.round(st.playSeconds / 60),
        available: P.storageWorks()
      };
    },

    /** Prüft, ob der Browser überhaupt dauerhaft speichern kann. */
    storageWorks: function () {
      try {
        global.localStorage.setItem('td2026.__test', '1');
        global.localStorage.removeItem('td2026.__test');
        return true;
      } catch (e) { return false; }
    },

    /* ---------------- Sichern und Einspielen ---------------- */

    /** Kompletten Stand als Text ausgeben. */
    exportText: function () {
      var data = { v: 1, at: Date.now() };
      KEYS.forEach(function (k) {
        var v = U.store.get(k, null);
        if (v !== null) data[k] = v;
      });
      return JSON.stringify(data);
    },

    /**
     * Stand aus Text wiederherstellen.
     * @returns {{ok:boolean, error?:string}}
     */
    importText: function (text) {
      var data;
      try { data = JSON.parse(String(text).trim()); }
      catch (e) { return { ok: false, error: 'Das ist kein gültiger Sicherungstext.' }; }

      if (!data || typeof data !== 'object' || !data.v) {
        return { ok: false, error: 'Der Sicherungstext gehört nicht zu diesem Spiel.' };
      }
      KEYS.forEach(function (k) {
        if (data[k] !== undefined) U.store.set(k, data[k]);
      });
      return { ok: true };
    },

    /** Alles zurücksetzen. */
    reset: function () {
      KEYS.forEach(function (k) { U.store.set(k, null); });
      try {
        KEYS.forEach(function (k) { global.localStorage.removeItem('td2026.' + k); });
      } catch (e) { /* nicht kritisch */ }
    },

    /** Nur den Feldzug eines Volkes zurücksetzen. */
    resetFaction: function (factionKey) {
      var all = U.store.get('campaign', {});
      delete all[factionKey];
      U.store.set('campaign', all);
      var asked = U.store.get('asked', {});
      delete asked[factionKey];
      U.store.set('asked', asked);
    }
  };
})(window);
