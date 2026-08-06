/* =========================================================
   ui.js – DOM-Oberfläche: HUD, Shop, Turmpanel, Menüs
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;
  var doc = global.document;

  function $(id) { return doc.getElementById(id); }
  function el(tag, cls, html) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  var D = {};                 // DOM-Referenzen
  var toastTimer = null;
  var lastGold = -1, lastLives = -1;
  var menuSel = { map: U.store.get('lastMap', 'meadow'), diff: U.store.get('lastDiff', 'normal') };

  var UI = TD.ui = {

    init: function () {
      D.lives    = $('stat-lives');
      D.gold     = $('stat-gold');
      D.wave     = $('stat-wave');
      D.score    = $('stat-score');
      D.lifebar  = $('lifebar-fill');
      D.shopList = $('shop-list');
      D.shopHint = $('shop-hint');
      D.towerPanel = $('towerpanel');
      D.wavePrev = $('wave-preview');
      D.waveTimer = $('wave-timer');
      D.btnWave  = $('btn-wave');
      D.btnWaveLabel = $('btn-wave-label');
      D.btnWaveBonus = $('btn-wave-bonus');
      D.btnPause = $('btn-pause');
      D.btnSpeed = $('btn-speed');
      D.btnSound = $('btn-sound');
      D.btnMenu  = $('btn-menu');
      D.toast    = $('toast');
      D.overlay  = $('overlay');
      D.card     = $('overlay-card');

      this.buildShop();
      this.bindControls();
      this.refreshControls();
      this.showMenu();
    },

    /* =====================================================
       Turmshop
       ===================================================== */
    buildShop: function () {
      D.shopList.innerHTML = '';
      D.shopCards = {};

      TD.TOWER_ORDER.forEach(function (key) {
        var def = TD.TOWERS[key];
        var card = el('button', 'tower-card');
        card.type = 'button';

        var icon = el('canvas', 'tc-icon');
        var mid = el('div');
        mid.appendChild(el('div', 'tc-name', def.name + '<span class="key">' + def.hotkey + '</span>'));
        mid.appendChild(el('div', 'tc-desc', def.desc));
        var cost = el('div', 'tc-cost', def.cost + ' ◈');

        card.appendChild(icon);
        card.appendChild(mid);
        card.appendChild(cost);
        D.shopList.appendChild(card);

        TD.render.drawTowerIcon(icon, key, 38);

        card.addEventListener('click', function () {
          if (TD.game.state !== 'playing') return;
          TD.audio.unlock();
          TD.audio.click();
          TD.game.setBuildKey(key);
        });

        D.shopCards[key] = { card: card, cost: cost };
      });
    },

    refreshShop: function () {
      var g = TD.game;
      TD.TOWER_ORDER.forEach(function (key) {
        var c = D.shopCards[key];
        if (!c) return;
        var def = TD.TOWERS[key];
        var affordable = g.gold >= def.cost;
        c.card.classList.toggle('selected', g.buildKey === key);
        c.card.classList.toggle('locked', !affordable);
      });
      D.shopHint.textContent = g.buildKey
        ? 'Feld wählen · Esc bricht ab'
        : 'Bauen: antippen';
    },

    /* =====================================================
       HUD
       ===================================================== */
    refreshHud: function (hurt) {
      var g = TD.game;
      if (!g.diff) return;

      if (g.lives !== lastLives) {
        D.lives.textContent = g.lives;
        if (hurt) pulse(D.lives.parentNode, 'hurt');
        lastLives = g.lives;
      }
      if (g.gold !== lastGold) {
        D.gold.textContent = U.fmt(g.gold);
        if (g.gold > lastGold && lastGold >= 0) pulse(D.gold.parentNode, 'flash');
        lastGold = g.gold;
        this.refreshShop();
        this.refreshTowerPanel();
      }
      D.wave.textContent = g.waveNumber + (isFinite(g.diff.waves) ? '/' + g.diff.waves : '');
      D.score.textContent = U.fmt(g.score);
      D.lifebar.style.width = Math.max(0, (g.lives / g.maxLives) * 100) + '%';
    },

    /* =====================================================
       Turmpanel
       ===================================================== */
    refreshTowerPanel: function () {
      var g = TD.game, t = g.selected;
      if (!t) { D.towerPanel.classList.add('hidden'); return; }
      D.towerPanel.classList.remove('hidden');

      var next = t.canUpgrade();
      $('tp-name').textContent = t.def.name + ' · Stufe ' + t.level;

      function withNext(cur, statName, digits) {
        var txt = round(cur, digits);
        if (next) {
          var inc = (t.def.upg && t.def.upg[statName]) || 0;
          if (inc) txt += '<span class="up">+' + round(inc, digits) + '</span>';
        }
        return txt;
      }

      $('tp-dmg').innerHTML   = withNext(t.stat('damage'), 'damage', 0);
      $('tp-range').innerHTML = withNext(t.stat('range'), 'range', 1);
      $('tp-rate').innerHTML  = withNext(t.stat('rate'), 'rate', 1) + '/s';
      $('tp-level').textContent = t.level + ' / 4';

      // Besonderheiten des Turms
      var sp = [];
      if (t.def.splash)  sp.push('Fläche ' + round(t.stat('splash'), 1));
      if (t.def.slow)    sp.push('Verlangsamt ' + Math.round(t.stat('slow') * 100) + '% für ' + round(t.stat('slowDur'), 1) + 's');
      if (t.def.poison)  sp.push('Gift ' + Math.round(t.stat('poison')) + '/s für ' + round(t.stat('poisonDur'), 1) + 's');
      if (t.def.chain)   sp.push('Kette auf ' + Math.round(t.stat('chain')) + ' Ziele');
      if (t.def.crit)    sp.push(Math.round(t.stat('crit') * 100) + '% Kritisch (×' + t.def.critMul + ')');
      if (t.def.pierceArmor) sp.push('Ignoriert Panzerung');
      if (!t.def.air)    sp.push('Kann keine Flieger treffen');
      sp.push('Abschüsse: ' + t.kills + ' · Schaden: ' + U.fmt(t.damageDealt));
      $('tp-special').innerHTML = sp.join('<br>');

      // Zielpriorität
      var seg = $('tp-targeting');
      if (!seg.childNodes.length) {
        TD.TARGETING.forEach(function (m) {
          var b = el('button', '', m.label);
          b.type = 'button';
          b.dataset.mode = m.key;
          b.addEventListener('click', function () {
            if (TD.game.selected) {
              TD.game.selected.targetMode = m.key;
              TD.game.selected.target = null;
              TD.audio.click();
              UI.refreshTowerPanel();
            }
          });
          seg.appendChild(b);
        });
      }
      Array.prototype.forEach.call(seg.children, function (b) {
        b.classList.toggle('on', b.dataset.mode === t.targetMode);
      });

      // Aktionen
      var up = $('tp-upgrade');
      if (next) {
        var cost = t.upgradeCost();
        up.innerHTML = 'Upgrade<br><small>' + cost + ' ◈</small>';
        up.disabled = g.gold < cost;
      } else {
        up.innerHTML = 'Maximale<br><small>Stufe</small>';
        up.disabled = true;
      }
      $('tp-sell').innerHTML = 'Verkaufen<br><small>+' + t.sellValue() + ' ◈</small>';
    },

    /* =====================================================
       Wellenvorschau
       ===================================================== */
    refreshWavePreview: function () {
      var g = TD.game;
      D.wavePrev.innerHTML = '';
      if (!g.diff || g.nextWave > g.diff.waves) {
        D.wavePrev.appendChild(el('div', 'wp-item', 'Letzte Welle – halte durch!'));
        return;
      }
      var wave = TD.waves.generate(g.nextWave, g.diff.key);
      var items = TD.waves.preview(wave);

      items.forEach(function (it) {
        var def = TD.ENEMIES[it.type];
        var node = el('div', 'wp-item' + (def.boss ? ' wp-boss' : ''));
        var dot = el('span', 'wp-dot');
        dot.style.background = def.color;
        dot.style.color = def.color;
        node.appendChild(dot);
        node.appendChild(doc.createTextNode(def.name + ' ×' + it.count));
        node.title = def.name +
          (def.flying ? ' · fliegt' : '') +
          (def.armor ? ' · Panzerung ' + def.armor : '') +
          (def.heal ? ' · heilt Verbündete' : '') +
          (def.shield ? ' · Schadensschild' : '');
        D.wavePrev.appendChild(node);
      });
    },

    /* =====================================================
       Steuerleiste
       ===================================================== */
    bindControls: function () {
      D.btnWave.addEventListener('click', function () {
        TD.audio.unlock();
        if (TD.game.state !== 'playing') return;
        TD.game.startWave(true);
      });
      D.btnPause.addEventListener('click', function () {
        TD.audio.click();
        TD.game.togglePause();
      });
      D.btnSpeed.addEventListener('click', function () {
        TD.audio.click();
        TD.game.cycleSpeed();
      });
      D.btnSound.addEventListener('click', function () { UI.toggleSound(); });
      D.btnMenu.addEventListener('click', function () {
        TD.audio.click();
        UI.showPauseMenu();
      });
      $('tp-close').addEventListener('click', function () {
        TD.game.selected = null;
        UI.refreshTowerPanel();
      });
      $('tp-upgrade').addEventListener('click', function () { TD.game.upgradeSelected(); });
      $('tp-sell').addEventListener('click', function () { TD.game.sellSelected(); });
    },

    toggleSound: function () {
      var on = TD.audio.toggle();
      if (on) { TD.audio.unlock(); if (TD.game.state === 'playing') TD.audio.startMusic(); }
      else TD.audio.stopMusic();
      UI.refreshControls();
      UI.toast(on ? 'Ton an' : 'Ton aus');
    },

    refreshControls: function () {
      D.btnSpeed.textContent = TD.SPEEDS[TD.game.speedIndex] + '×';
      D.btnPause.textContent = TD.game.paused ? '▶' : '❚❚';
      D.btnSound.textContent = TD.audio.isOn() ? '🔊' : '🔇';
    },

    /** Wird jeden Frame aufgerufen – aktualisiert die Uhr am Wellenknopf. */
    tick: function () {
      var g = TD.game;
      if (g.state !== 'playing') return;

      if (g.nextWave > g.diff.waves) {
        D.btnWave.disabled = true;
        D.btnWave.classList.remove('ready');
        D.btnWaveLabel.textContent = 'Alle Wellen gestartet';
        D.btnWaveBonus.textContent = '';
        D.waveTimer.textContent = '';
        return;
      }

      D.btnWave.disabled = false;

      if (!g.waveRunning && g.breakTimer > 0) {
        var secs = Math.ceil(g.breakTimer);
        D.btnWaveLabel.textContent = 'Welle ' + g.nextWave + ' starten';
        D.btnWaveBonus.textContent = '+' + Math.round(g.breakTimer * TD.EARLY_BONUS_PER_SEC) + ' ◈';
        D.waveTimer.textContent = 'in ' + secs + 's';
        D.btnWave.classList.toggle('ready', secs <= 5);
      } else {
        D.btnWaveLabel.textContent = 'Welle ' + g.nextWave + ' vorziehen';
        D.btnWaveBonus.textContent = '+' + Math.round(15 + g.nextWave * 2) + ' ◈';
        D.waveTimer.textContent = g.waveRunning ? 'Welle ' + g.waveNumber + ' läuft' : '';
        D.btnWave.classList.remove('ready');
      }
    },

    /* =====================================================
       Toast
       ===================================================== */
    toast: function (msg, kind) {
      D.toast.textContent = msg;
      D.toast.className = 'toast show' + (kind ? ' ' + kind : '');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        D.toast.className = 'toast' + (kind ? ' ' + kind : '');
      }, 1900);
    },

    /* =====================================================
       Overlays
       ===================================================== */
    closeOverlay: function () {
      D.overlay.classList.remove('show');
    },

    onGameStart: function () {
      UI.closeOverlay();
      lastGold = -1; lastLives = -1;
      UI.refreshHud();
      UI.refreshShop();
      UI.refreshTowerPanel();
      UI.refreshWavePreview();
      UI.refreshControls();
    },

    /* ---------------- Hauptmenü ---------------- */
    showMenu: function () {
      var best = U.store.get('best', {});

      D.card.innerHTML =
        '<h1>Tower <span class="accent">Defense</span> 2026</h1>' +
        '<p class="sub">Verteidige deine Basis. Läuft offline auf PC, Tablet und Handy.</p>' +
        '<div class="section-title">Karte</div>' +
        '<div class="choice-grid" id="map-grid"></div>' +
        '<div class="section-title">Schwierigkeit</div>' +
        '<div class="choice-grid" id="diff-grid"></div>' +
        '<button class="btn btn-primary" id="btn-play">Spiel starten</button>' +
        '<div class="btn-row"><button class="btn" id="btn-help">Anleitung</button>' +
        '<button class="btn" id="btn-reset">Bestwerte löschen</button></div>';

      var mapGrid = $('map-grid');
      TD.maps.defs.forEach(function (def) {
        var b = el('button', 'choice' + (menuSel.map === def.id ? ' on' : ''));
        b.type = 'button';
        var cv = el('canvas');
        b.appendChild(cv);
        var bk = best[def.id + '.' + menuSel.diff];
        b.appendChild(el('div', 'c-title', def.name));
        b.appendChild(el('div', 'c-desc', def.diffHint + (bk ? ' · Best: ' + U.fmt(bk.score) : '')));
        mapGrid.appendChild(b);
        TD.maps.drawPreview(cv, def);

        b.addEventListener('click', function () {
          menuSel.map = def.id;
          TD.audio.unlock(); TD.audio.click();
          UI.showMenu();
        });
      });

      var diffGrid = $('diff-grid');
      TD.DIFFICULTY_ORDER.forEach(function (key) {
        var d = TD.DIFFICULTIES[key];
        var b = el('button', 'choice' + (menuSel.diff === key ? ' on' : ''));
        b.type = 'button';
        b.appendChild(el('div', 'c-title', d.name));
        b.appendChild(el('div', 'c-desc', d.desc));
        diffGrid.appendChild(b);
        b.addEventListener('click', function () {
          menuSel.diff = key;
          TD.audio.unlock(); TD.audio.click();
          UI.showMenu();
        });
      });

      $('btn-play').addEventListener('click', function () {
        TD.audio.unlock();
        U.store.set('lastMap', menuSel.map);
        U.store.set('lastDiff', menuSel.diff);
        TD.game.start(menuSel.map, menuSel.diff);
      });
      $('btn-help').addEventListener('click', function () { TD.audio.click(); UI.showHelp(); });
      $('btn-reset').addEventListener('click', function () {
        U.store.set('best', {});
        TD.audio.click();
        UI.showMenu();
        UI.toast('Bestwerte gelöscht');
      });

      D.overlay.classList.add('show');
    },

    /* ---------------- Anleitung ---------------- */
    showHelp: function () {
      D.card.innerHTML =
        '<h2>So wird gespielt</h2>' +
        '<p class="sub">Gegner laufen vom roten Portal zu deiner Basis. Lass keinen durch.</p>' +
        '<ul class="help-list">' +
          '<li><b>Bauen:</b> Turm in der Liste wählen, dann auf ein freies Feld tippen. Auf dem Weg kann nicht gebaut werden.</li>' +
          '<li><b>Verbessern:</b> Turm antippen, dann „Upgrade“. Jeder Turm hat vier Stufen.</li>' +
          '<li><b>Gold:</b> Gibt es für Abschüsse, für geschaffte Wellen und fürs Vorziehen der nächsten Welle.</li>' +
          '<li><b>Flieger</b> nehmen die Luftlinie – die Kanone trifft sie nicht.</li>' +
          '<li><b>Panzerung</b> senkt jeden Treffer. Scharfschütze und Gift ignorieren sie.</li>' +
        '</ul>' +
        '<div class="section-title">Tastatur (PC)</div>' +
        '<ul class="help-list">' +
          '<li><kbd>1</kbd>–<kbd>6</kbd><span>Turm auswählen</span></li>' +
          '<li><kbd>Space</kbd><span>Pause</span></li>' +
          '<li><kbd>F</kbd><span>Geschwindigkeit 1× / 2× / 3×</span></li>' +
          '<li><kbd>N</kbd><span>Nächste Welle vorziehen</span></li>' +
          '<li><kbd>U</kbd> / <kbd>V</kbd><span>Ausgewählten Turm verbessern / verkaufen</span></li>' +
          '<li><kbd>M</kbd><span>Ton an/aus</span></li>' +
          '<li><kbd>Esc</kbd><span>Abbrechen / Menü</span></li>' +
        '</ul>' +
        '<button class="btn btn-primary" id="btn-back">Zurück</button>';

      $('btn-back').addEventListener('click', function () {
        TD.audio.click();
        if (TD.game.state === 'playing') UI.showPauseMenu();
        else UI.showMenu();
      });
      D.overlay.classList.add('show');
    },

    /* ---------------- Pausemenü ---------------- */
    showPauseMenu: function () {
      if (TD.game.state !== 'playing') return;
      if (!TD.game.paused) TD.game.togglePause();

      D.card.innerHTML =
        '<h2>Pause</h2>' +
        '<p class="sub">Welle ' + TD.game.waveNumber + ' · ' + TD.game.lives + ' Leben · ' + U.fmt(TD.game.score) + ' Punkte</p>' +
        '<button class="btn btn-primary" id="btn-resume">Weiterspielen</button>' +
        '<div class="btn-row">' +
          '<button class="btn" id="btn-help2">Anleitung</button>' +
          '<button class="btn" id="btn-restart">Neu starten</button>' +
        '</div>' +
        '<div class="btn-row"><button class="btn btn-sell" id="btn-quit" style="grid-column:1/-1">Zum Hauptmenü</button></div>';

      $('btn-resume').addEventListener('click', function () {
        TD.audio.click();
        UI.closeOverlay();
        if (TD.game.paused) TD.game.togglePause();
      });
      $('btn-help2').addEventListener('click', function () { TD.audio.click(); UI.showHelp(); });
      $('btn-restart').addEventListener('click', function () {
        TD.audio.click();
        TD.game.start(TD.game.mapDef.id, TD.game.diff.key);
      });
      $('btn-quit').addEventListener('click', function () {
        TD.audio.click();
        TD.game.quitToMenu();
      });

      D.overlay.classList.add('show');
    },

    /* ---------------- Ergebnis ---------------- */
    showResult: function (won, isRecord, prevBest) {
      var g = TD.game;
      var dur = Math.round((Date.now() - g.stats.startedAt) / 1000);
      var mm = Math.floor(dur / 60), ss = dur % 60;

      D.card.innerHTML =
        '<h2>' + (won ? '🏆 Geschafft!' : '💀 Basis gefallen') + (isRecord ? '<span class="badge-new">Rekord</span>' : '') + '</h2>' +
        '<p class="sub">' + (won
          ? 'Du hast alle ' + g.waveNumber + ' Wellen auf „' + g.mapDef.name + '“ überstanden.'
          : 'Die Gegner haben in Welle ' + g.waveNumber + ' durchgebrochen.') + '</p>' +
        '<div class="result-stats">' +
          '<div><span>Punkte</span><b>' + U.fmt(g.score) + '</b></div>' +
          '<div><span>Wellen</span><b>' + g.waveNumber + '</b></div>' +
          '<div><span>Abschüsse</span><b>' + U.fmt(g.stats.kills) + '</b></div>' +
          '<div><span>Schaden</span><b>' + U.fmt(g.stats.damage) + '</b></div>' +
          '<div><span>Türme gebaut</span><b>' + g.stats.built + '</b></div>' +
          '<div><span>Spielzeit</span><b>' + mm + ':' + (ss < 10 ? '0' : '') + ss + '</b></div>' +
        '</div>' +
        (prevBest && prevBest.score ? '<p class="sub">Bisherige Bestleistung: ' + U.fmt(prevBest.score) + ' Punkte</p>' : '') +
        '<button class="btn btn-primary" id="btn-again">Nochmal spielen</button>' +
        '<div class="btn-row"><button class="btn" id="btn-menu2" style="grid-column:1/-1">Hauptmenü</button></div>';

      $('btn-again').addEventListener('click', function () {
        TD.audio.click();
        TD.game.start(g.mapDef.id, g.diff.key);
      });
      $('btn-menu2').addEventListener('click', function () {
        TD.audio.click();
        TD.game.quitToMenu();
      });

      D.overlay.classList.add('show');
    }
  };

  function pulse(node, cls) {
    if (!node) return;
    node.classList.remove(cls);
    void node.offsetWidth;      // Reflow erzwingen, damit die Animation neu startet
    node.classList.add(cls);
  }

  function round(v, digits) {
    if (v == null) return '–';
    var f = Math.pow(10, digits || 0);
    var r = Math.round(v * f) / f;
    return String(r).replace('.', ',');
  }
})(window);
