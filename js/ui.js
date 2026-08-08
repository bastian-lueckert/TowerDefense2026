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
  /* Bild für die Enthüllung: Bergtempel bei Nacht, Geister im Wald */
  var STORY_SCENE_REVEAL = {
    sky: 'night', far: 'forest', structure: 'temple',
    ground: 'grass', actor: 'wisps'
  };

  var menuSel = {
    map:     U.store.get('lastMap', 'meadow'),
    diff:    U.store.get('lastDiff', 'normal'),
    faction: U.store.get('lastFaction', 'medieval')
  };

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
    /** Shop neu aufbauen – nötig bei jedem Wechsel der Spielerklasse. */
    buildShop: function () {
      var factionKey = TD.game.factionKey || 'medieval';
      D.shopList.innerHTML = '';
      D.shopCards = {};

      /* Die Hauptfigur steht ganz oben und hebt sich ab –
         sie lässt sich nur ein einziges Mal einsetzen. */
      (function () {
        var f = TD.factions.get(factionKey);
        var def = TD.towerDef(factionKey, 'hero');
        var card = el('button', 'tower-card hero-card');
        card.type = 'button';

        var pic = el('canvas', 'tc-icon hero-pic');
        var mid = el('div');
        mid.appendChild(el('div', 'tc-name', f.hero.name.split(' ')[0] +
          '<span class="key">H</span><span class="hero-tag">einmalig</span>'));
        mid.appendChild(el('div', 'tc-desc', f.hero.power.name + ' · ' + f.hero.title));
        var cost = el('div', 'tc-cost', def.cost + ' ◈');

        card.appendChild(pic);
        card.appendChild(mid);
        card.appendChild(cost);
        D.shopList.appendChild(card);
        TD.characters.draw(pic, factionKey, 1);

        card.addEventListener('click', function () {
          if (TD.game.state !== 'playing') return;
          TD.audio.unlock();
          if (!TD.game.heroAvailable) {
            TD.audio.error();
            UI.toast('Sie ist in diesem Kapitel noch nicht dabei', 'bad');
            return;
          }
          if (TD.game.hero) {
            TD.audio.error();
            UI.toast('Sie steht bereits auf dem Feld', 'bad');
            return;
          }
          TD.audio.click();
          TD.game.setBuildKey('hero');
        });

        D.shopCards.hero = { card: card, cost: cost };
      })();

      TD.ROLE_ORDER.forEach(function (role) {
        var def = TD.towerDef(factionKey, role);
        var card = el('button', 'tower-card');
        card.type = 'button';

        var icon = el('canvas', 'tc-icon');
        var mid = el('div');
        mid.appendChild(el('div', 'tc-name',
          def.name + '<span class="key">' + def.hotkey + '</span>'));
        mid.appendChild(el('div', 'tc-desc', def.desc));
        var cost = el('div', 'tc-cost', def.cost + ' ◈');

        card.appendChild(icon);
        card.appendChild(mid);
        card.appendChild(cost);
        D.shopList.appendChild(card);

        TD.render.drawTowerIcon(icon, factionKey, role, 38);

        card.addEventListener('click', function () {
          if (TD.game.state !== 'playing') return;
          TD.audio.unlock();
          if (!TD.game.isUnlocked(role)) {
            TD.audio.error();
            UI.toast('Noch verschlossen – öffne eine Truhe auf dem Feld', 'bad');
            return;
          }
          TD.audio.click();
          TD.game.setBuildKey(role);
        });

        D.shopCards[role] = { card: card, cost: cost, name: mid.firstChild };
      });
    },

    refreshShop: function () {
      var g = TD.game;

      // Zustand der Hauptfigur
      var hc = D.shopCards.hero;
      if (hc) {
        var hdef = TD.towerDef(g.factionKey, 'hero');
        var placed = !!g.hero;
        var usable = g.heroAvailable && !placed;
        hc.card.classList.toggle('selected', g.buildKey === 'hero');
        hc.card.classList.toggle('sealed', !g.heroAvailable);
        hc.card.classList.toggle('used', placed);
        hc.card.classList.toggle('locked', usable && g.gold < hdef.cost);
        hc.cost.textContent = placed ? 'im Feld'
                            : (!g.heroAvailable ? '🔒' : hdef.cost + ' ◈');
      }

      TD.ROLE_ORDER.forEach(function (role) {
        var c = D.shopCards[role];
        if (!c) return;

        // Im Feldzug stehen je nach Kapitel nicht alle Turmarten zur Verfügung
        var inGame = !g.availableRoles.length || g.availableRoles.indexOf(role) >= 0;
        c.card.style.display = inGame ? '' : 'none';
        if (!inGame) return;

        var def = TD.towerDef(g.factionKey, role);
        var unlocked = g.isUnlocked(role);
        var affordable = g.gold >= def.cost;

        c.card.classList.toggle('selected', g.buildKey === role);
        c.card.classList.toggle('locked', unlocked && !affordable);
        c.card.classList.toggle('sealed', !unlocked);
        c.cost.textContent = unlocked ? def.cost + ' ◈' : '🔒';
      });

      var locked = (g.availableRoles.length ? g.availableRoles : TD.ROLE_ORDER)
        .filter(function (r) { return !g.isUnlocked(r); }).length;
      D.shopHint.textContent = g.buildKey
        ? 'Feld wählen · Esc bricht ab'
        : (locked ? locked + ' noch verschlossen' : 'Bauen: antippen');
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
      // Auf schmalen Geräten weicht der Shop dem Turmpanel (siehe CSS)
      doc.body.classList.toggle('has-selection', !!t);
      if (!t) { D.towerPanel.classList.add('hidden'); return; }
      D.towerPanel.classList.remove('hidden');

      var next = t.canUpgrade();
      $('tp-name').textContent = (t.isHero ? '★ ' : '') + t.def.name + ' · Stufe ' + t.level;

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

      // Fähigkeit und Aura der Hauptfigur
      if (t.isHero && t.power) {
        sp.unshift('<span class="hero-power">★ ' + t.power.name + ': ' + t.power.desc + '</span>');
        var aura = g.faction.hero.aura;
        if (aura) sp.push('<span style="color:#ffd166">Anführung: ' + aura.label + '</span>');
      }

      // Wirkung des Untergrunds sichtbar machen
      var fx = t.fieldEffect();
      if (fx) {
        sp.push('<span style="color:' + fx.tile.glow + '">' +
                fx.tile.icon + ' ' + fx.tile.name + ': ' + fx.text + '</span>');
      }
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

      // Gratis-Ausbau aus einer richtig beantworteten Frage
      var tok = $('tp-token');
      if (g.upgradeTokens > 0 && next) {
        tok.classList.remove('hidden');
        tok.innerHTML = '★ Gratis-Ausbau einsetzen <small>(' + g.upgradeTokens + ')</small>';
      } else {
        tok.classList.add('hidden');
      }
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
      var wave = g.waveFor(g.nextWave);
      var items = TD.waves.preview(wave);

      items.forEach(function (it) {
        var def = TD.enemyDef(g.factionKey, it.type);
        var node = el('div', 'wp-item' + (def.boss ? ' wp-boss' : ''));

        // Dieselbe Figur wie auf dem Spielfeld, damit man sie wiedererkennt
        var pic = el('canvas', 'wp-pic');
        node.appendChild(pic);
        TD.render.drawEnemyIcon(pic, g.factionKey, it.type, def.boss ? 30 : 26);

        node.appendChild(el('span', 'wp-name', def.name));
        node.appendChild(el('span', 'wp-count', '×' + it.count));
        node.title = def.name + ' ×' + it.count +
          (def.flying ? ' · fliegt' : '') +
          (def.armor ? ' · Panzerung ' + def.armor : '') +
          (def.heal ? ' · heilt Verbündete' : '') +
          (def.shield ? ' · Schadensschild' : '') +
          (def.lore ? '\n' + def.lore : '');
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
      $('tp-token').addEventListener('click', function () { TD.game.useToken(); });
    },

    toggleSound: function () {
      var on = TD.audio.toggle();
      if (on) { TD.audio.unlock(); if (TD.game.state === 'playing') TD.audio.startMusic(TD.game.factionKey); }
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

    /* ---------------- Startseite ---------------- */
    showMenu: function () {
      D.card.innerHTML =
        '<div class="title-art"><canvas id="title-pic"></canvas></div>' +
        '<p class="sub title-sub">Verteidige deine Basis. Läuft offline auf PC, Tablet und Handy.</p>' +
        '<div class="mode-grid">' +
          '<button class="mode-card" id="mode-campaign">' +
            '<span class="mode-ico">⚔</span>' +
            '<span class="mode-title">Feldzug</span>' +
            '<span class="mode-desc">14 Level pro Volk, durchgehende Geschichte aus der jeweiligen Sagenwelt.</span>' +
            '<span class="mode-foot" id="mode-camp-foot"></span>' +
          '</button>' +
          '<button class="mode-card" id="mode-free">' +
            '<span class="mode-ico">∞</span>' +
            '<span class="mode-title">Freies Spiel</span>' +
            '<span class="mode-desc">Karte, Volk und Schwierigkeit frei wählen – auch endlos.</span>' +
          '</button>' +
        '</div>' +
        '<div class="btn-row"><button class="btn" id="btn-help0">Anleitung</button>' +
        '<button class="btn" id="btn-save0">Spielstand</button></div>';

      TD.titlescreen.draw($('title-pic'), 5);

      // Kurzer Überblick über alle Feldzüge
      var tot = 0, max = 0;
      TD.availableFactions().forEach(function (f) {
        var s = TD.campaign.summary(f);
        tot += s.stars; max += s.maxStars;
      });
      $('mode-camp-foot').textContent = '★ ' + tot + ' / ' + max;

      $('mode-campaign').addEventListener('click', function () {
        TD.audio.unlock(); TD.audio.click(); UI.showCampaignFactions();
      });
      $('mode-free').addEventListener('click', function () {
        TD.audio.unlock(); TD.audio.click(); UI.showFreePlay();
      });
      $('btn-help0').addEventListener('click', function () { TD.audio.click(); UI.showHelp(); });
      $('btn-save0').addEventListener('click', function () { TD.audio.click(); UI.showSaveManager(); });

      D.overlay.classList.add('show');
    },

    /* ---------------- Freies Spiel ---------------- */
    showFreePlay: function () {
      var best = U.store.get('best', {});

      var fac = TD.factions.get(menuSel.faction);

      D.card.innerHTML =
        '<h1>Freies <span class="accent">Spiel</span></h1>' +
        '<p class="sub">Volk, Karte und Schwierigkeit frei zusammenstellen.</p>' +
        '<div class="section-title">Volk</div>' +
        '<div class="choice-grid faction-grid" id="fac-grid"></div>' +
        '<div class="faction-info" id="fac-info"></div>' +
        '<div class="section-title">Karte</div>' +
        '<div class="choice-grid" id="map-grid"></div>' +
        '<div class="section-title">Schwierigkeit</div>' +
        '<div class="choice-grid" id="diff-grid"></div>' +
        '<button class="btn btn-primary" id="btn-play">Spiel starten</button>' +
        '<div class="btn-row"><button class="btn" id="btn-help">Anleitung</button>' +
        '<button class="btn" id="btn-lore">Wissenswertes</button></div>' +
        '<div class="btn-row"><button class="btn" id="btn-reset" style="grid-column:1/-1">‹ Zurück</button></div>';

      // --- Völker ---
      var facGrid = $('fac-grid');
      TD.availableFactions().forEach(function (key) {
        var f = TD.factions.get(key);
        var b = el('button', 'choice fac' + (menuSel.faction === key ? ' on' : ''));
        b.type = 'button';
        var cv = el('canvas', 'fac-preview');
        b.appendChild(cv);
        b.appendChild(el('div', 'c-title', f.name));
        b.appendChild(el('div', 'c-desc', f.era));
        facGrid.appendChild(b);
        drawFactionPreview(cv, key);
        b.addEventListener('click', function () {
          menuSel.faction = key;
          TD.audio.unlock(); TD.audio.click();
          UI.showFreePlay();
        });
      });

      $('fac-info').innerHTML =
        '<b>' + fac.tagline + '</b><br>' + fac.desc +
        '<div class="fac-bonus">' + fac.bonusText + '</div>' +
        '<div class="fac-towers">' + TD.ROLE_ORDER.map(function (r) {
          var locked = TD.STARTER_ROLES.indexOf(r) < 0;
          return '<span' + (locked ? ' class="lk"' : '') + '>' +
                 (locked ? '🔒 ' : '') + fac.towers[r].name + '</span>';
        }).join('') + '</div>';

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
          UI.showFreePlay();
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
          UI.showFreePlay();
        });
      });

      $('btn-play').addEventListener('click', function () {
        TD.audio.unlock();
        U.store.set('lastMap', menuSel.map);
        U.store.set('lastDiff', menuSel.diff);
        U.store.set('lastFaction', menuSel.faction);
        TD.game.factionKey = menuSel.faction;
        UI.buildShop();                     // Türme des gewählten Volkes
        TD.game.start(menuSel.map, menuSel.diff, menuSel.faction);
      });
      $('btn-help').addEventListener('click', function () { TD.audio.click(); UI.showHelp(); });
      $('btn-lore').addEventListener('click', function () { TD.audio.click(); UI.showLore(menuSel.faction); });
      $('btn-reset').addEventListener('click', function () {
        TD.audio.click();
        UI.showMenu();
      });

      D.overlay.classList.add('show');
    },

    /* ---------------- Spielstand ---------------- */
    showSaveManager: function () {
      var o = TD.progress.overview();

      D.card.innerHTML =
        '<h2>Spielstand</h2>' +
        '<p class="sub">Alles wird automatisch in diesem Browser gespeichert – ' +
        'Feldzüge, Sterne, Bestwerte und schon gestellte Fragen.</p>' +
        (o.available ? '' :
          '<div class="save-warn">Dieser Browser erlaubt kein dauerhaftes Speichern ' +
          '(etwa im privaten Modus). Der Fortschritt geht beim Schließen verloren.</div>') +
        '<div class="result-stats">' +
          '<div><span>Kapitel geschafft</span><b>' + o.levelsDone + ' / ' + o.levelsTotal + '</b></div>' +
          '<div><span>Sterne</span><b>' + o.stars + ' / ' + o.maxStars + '</b></div>' +
          '<div><span>Partien</span><b>' + o.games + '</b></div>' +
          '<div><span>Davon gewonnen</span><b>' + o.wins + '</b></div>' +
          '<div><span>Abschüsse</span><b>' + U.fmt(o.kills) + '</b></div>' +
          '<div><span>Spielzeit</span><b>' + o.minutes + ' min</b></div>' +
        '</div>' +
        '<div class="section-title">Fragen je Volk</div>' +
        '<div class="qprog">' + TD.availableFactions().map(function (f) {
          var q = TD.progress.questionProgress(f);
          return '<div><span>' + TD.factions.get(f).name + '</span>' +
                 '<b>' + q.seen + ' / ' + q.total + '</b></div>';
        }).join('') + '</div>' +
        '<div class="section-title">Sicherung</div>' +
        '<p class="sub">Kopiere den Text, um deinen Stand zu sichern – oder füge eine ' +
        'frühere Sicherung ein und stelle sie wieder her.</p>' +
        '<textarea id="save-text" class="save-box" spellcheck="false"></textarea>' +
        '<div class="btn-row">' +
          '<button class="btn" id="btn-copy">Kopieren</button>' +
          '<button class="btn btn-up" id="btn-restore">Wiederherstellen</button>' +
        '</div>' +
        '<div class="btn-row">' +
          '<button class="btn btn-sell" id="btn-wipe">Alles löschen</button>' +
          '<button class="btn" id="btn-save-back">‹ Zurück</button>' +
        '</div>';

      $('save-text').value = TD.progress.exportText();

      $('btn-copy').addEventListener('click', function () {
        var ta = $('save-text');
        ta.select();
        var ok = false;
        try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
        if (!ok && global.navigator.clipboard) {
          global.navigator.clipboard.writeText(ta.value).then(function () {
            UI.toast('In die Zwischenablage kopiert', 'good');
          });
          return;
        }
        TD.audio.click();
        UI.toast(ok ? 'In die Zwischenablage kopiert' : 'Bitte von Hand kopieren',
                 ok ? 'good' : 'bad');
      });

      $('btn-restore').addEventListener('click', function () {
        var res = TD.progress.importText($('save-text').value);
        if (res.ok) {
          TD.audio.upgrade();
          UI.toast('Spielstand wiederhergestellt', 'good');
          UI.showSaveManager();
        } else {
          TD.audio.error();
          UI.toast(res.error, 'bad');
        }
      });

      $('btn-wipe').addEventListener('click', function () {
        var b = $('btn-wipe');
        if (b.dataset.armed !== '1') {          // Zweistufig – aus Versehen wäre ärgerlich
          b.dataset.armed = '1';
          b.textContent = 'Wirklich alles löschen?';
          TD.audio.error();
          return;
        }
        TD.progress.reset();
        TD.audio.sell();
        UI.toast('Spielstand gelöscht');
        UI.showSaveManager();
      });

      $('btn-save-back').addEventListener('click', function () {
        TD.audio.click(); UI.showMenu();
      });

      D.overlay.classList.add('show');
    },

    /* =====================================================
       FELDZUG
       ===================================================== */

    /** Schritt 1: Volk und damit Erzählstrang wählen. */
    showCampaignFactions: function () {
      D.card.innerHTML =
        '<h2>Feldzug wählen</h2>' +
        '<p class="sub">Jedes Volk erzählt eine eigene Geschichte aus seiner Sagenwelt – ' +
        '14 Level, etwa zwei Stunden.</p>' +
        '<div class="camp-list" id="camp-list"></div>' +
        '<div class="btn-row"><button class="btn" id="btn-camp-back" style="grid-column:1/-1">‹ Zurück</button></div>';

      var list = $('camp-list');
      TD.availableFactions().forEach(function (key) {
        var f = TD.factions.get(key);
        var info = TD.campaign.info(key);
        var sum = TD.campaign.summary(key);

        var row = el('button', 'camp-row' + (f.secret ? ' camp-secret' : ''));
        row.type = 'button';

        var portrait = el('canvas', 'camp-portrait');
        row.appendChild(portrait);

        var mid = el('div', 'camp-mid');
        mid.appendChild(el('div', 'camp-title', info.title));
        mid.appendChild(el('div', 'camp-sub', f.name + ' · ' + f.hero.name));
        var bar = el('div', 'camp-bar');
        bar.appendChild(el('span', '', '')).style.width =
          Math.round(sum.done / sum.count * 100) + '%';
        mid.appendChild(bar);
        mid.appendChild(el('div', 'camp-prog',
          'Level ' + Math.min(sum.unlocked, sum.count) + ' / ' + sum.count +
          ' · ★ ' + sum.stars + '/' + sum.maxStars +
          (sum.finished ? ' · abgeschlossen' : '')));
        row.appendChild(mid);

        list.appendChild(row);
        TD.characters.draw(portrait, key, 2);

        row.addEventListener('click', function () {
          TD.audio.click();
          menuSel.faction = key;
          U.store.set('lastFaction', key);
          UI.showCampaignLevels(key);
        });
      });

      /* Ein dezenter Hinweis, dass da noch etwas kommt – aber ohne
         zu verraten, was. Die Überraschung soll erhalten bleiben. */
      if (!TD.campaign.secretUnlocked()) {
        var fehlen = TD.campaign.secretRemaining();
        var hint = el('div', 'camp-locked-hint',
          '🔒 Etwas Verborgenes wartet · noch ' + fehlen +
          (fehlen === 1 ? ' Feldzug' : ' Feldzüge') + ' zu vollenden');
        list.appendChild(hint);
      }

      $('btn-camp-back').addEventListener('click', function () {
        TD.audio.click(); UI.showMenu();
      });
      D.overlay.classList.add('show');
    },

    /* ---------------- Enthüllung des verborgenen Feldzugs ---------------- */
    showSecretReveal: function () {
      TD.campaign.markSecretSeen();
      var f = TD.factions.get('japan');
      var info = TD.campaign.info('japan');

      D.card.innerHTML =
        '<div class="reveal-art"><canvas id="reveal-pic"></canvas></div>' +
        '<div class="reveal-tag">Alle vier Feldzüge bestanden</div>' +
        '<h2>Doch da ist noch etwas</h2>' +
        '<p class="story-text">Weit im Osten, hinter Bergen, die auf keiner eurer Karten stehen, ' +
        'zieht in dieser Nacht etwas durch die Straßen eines Dorfes. Es geschieht alle hundert Jahre. ' +
        'Diesmal zieht es nicht vorbei.</p>' +
        '<div class="hero-quote">' +
          '<canvas class="hero-portrait sm" id="reveal-hero"></canvas>' +
          '<div><div class="hero-name">' + f.hero.name + ' · ' + f.hero.title + '</div>' +
          '<p>„' + f.hero.intro + '“</p></div>' +
        '</div>' +
        '<div class="reveal-title">' + info.title + '</div>' +
        '<p class="sub">Ein fünfter Feldzug mit eigenem Volk, eigenen Türmen und ' +
        'Gegnern aus der japanischen Geisterwelt.</p>' +
        '<button class="btn btn-primary" id="btn-reveal-go">Feldzug beginnen</button>' +
        '<div class="btn-row"><button class="btn" id="btn-reveal-later" style="grid-column:1/-1">Später</button></div>';

      TD.scenes.draw($('reveal-pic'), STORY_SCENE_REVEAL, 4242, 5);
      TD.characters.draw($('reveal-hero'), 'japan', 2);

      $('btn-reveal-go').addEventListener('click', function () {
        TD.audio.click();
        menuSel.faction = 'japan';
        UI.showCampaignLevels('japan');
      });
      $('btn-reveal-later').addEventListener('click', function () {
        TD.audio.click();
        UI.showCampaignFactions();
      });

      D.overlay.classList.add('show');
      TD.celebrate.play({
        colors: ['#b03a4a', '#e0b24a', '#2f3b52', '#ffffff', '#ff9a8a'],
        banner: 'ENTDECKT'
      });
    },

    /** Schritt 2: Levelübersicht mit Sternen und Bestwerten. */
    showCampaignLevels: function (factionKey) {
      var f = TD.factions.get(factionKey);
      var info = TD.campaign.info(factionKey);
      var p = TD.campaign.progress(factionKey);
      var sum = TD.campaign.summary(factionKey);

      D.card.innerHTML =
        '<div class="hero-head">' +
          '<canvas class="hero-portrait" id="hero-pic"></canvas>' +
          '<div><h2>' + info.title + '</h2>' +
          '<p class="sub">' + info.subtitle + '</p>' +
          '<div class="hero-name">' + f.hero.name + ' · ' + f.hero.title + '</div></div>' +
        '</div>' +
        '<p class="hero-intro">' + f.hero.intro + '</p>' +
        '<div class="camp-stats">★ ' + sum.stars + ' / ' + sum.maxStars +
          ' · Punkte ' + U.fmt(sum.score) + '</div>' +
        '<div class="level-grid" id="level-grid"></div>' +
        '<div class="btn-row">' +
          '<button class="btn" id="btn-lvl-lore">Wissenswertes</button>' +
          '<button class="btn" id="btn-lvl-back">‹ Zurück</button>' +
        '</div>';

      TD.characters.draw($('hero-pic'), factionKey, 3);

      var grid = $('level-grid');
      for (var n = 1; n <= TD.campaign.COUNT; n++) {
        (function (num) {
          var lvl = TD.campaign.levelFor(factionKey, num);
          var open = num <= p.unlocked;
          var done = p.levels[num];

          var b = el('button', 'level-tile' +
            (open ? '' : ' locked') +
            (lvl.finale ? ' finale' : (lvl.boss ? ' boss' : '')));
          b.type = 'button';

          b.appendChild(el('div', 'lvl-num', open ? String(num) : '🔒'));
          b.appendChild(el('div', 'lvl-name', lvl.title));
          b.appendChild(el('div', 'lvl-stars',
            done ? '★★★'.slice(0, done.stars) + '☆☆☆'.slice(0, 3 - done.stars)
                 : (lvl.boss ? 'Endgegner' : '')));
          if (done) b.appendChild(el('div', 'lvl-score', U.fmt(done.score)));

          grid.appendChild(b);

          if (open) {
            b.addEventListener('click', function () {
              TD.audio.click();
              UI.showStory(factionKey, num);
            });
          } else {
            b.addEventListener('click', function () {
              TD.audio.error();
              UI.toast('Erst das Level davor abschließen', 'bad');
            });
          }
        })(n);
      }

      $('btn-lvl-lore').addEventListener('click', function () {
        TD.audio.click(); UI.showLore(factionKey, 'campaign');
      });
      $('btn-lvl-back').addEventListener('click', function () {
        TD.audio.click(); UI.showCampaignFactions();
      });
      D.overlay.classList.add('show');
    },

    /** Schritt 3: Vorspann mit Bild der Hauptfigur. */
    showStory: function (factionKey, n) {
      var f = TD.factions.get(factionKey);
      var lvl = TD.campaign.levelFor(factionKey, n);
      var mapDef = lvl.mapDef;
      var wegText = lvl.pathCount === 1 ? 'ein Weg'
                  : lvl.pathCount + ' Wege';

      D.card.innerHTML =
        '<div class="mission-art"><canvas id="mission-pic"></canvas>' +
          '<div class="mission-cap">' + mapDef.name + '</div></div>' +
        '<div class="story-chapter">Kapitel ' + n + ' von ' + TD.campaign.COUNT + '</div>' +
        '<h2>' + lvl.title + '</h2>' +
        '<p class="story-text">' + lvl.story + '</p>' +
        (lvl.heroLine
          ? '<div class="hero-quote">' +
              '<canvas class="hero-portrait sm" id="story-pic"></canvas>' +
              '<div><div class="hero-name">' + f.hero.name + '</div>' +
              '<p>„' + lvl.heroLine + '“</p></div>' +
            '</div>'
          : '') +
        '<div class="mission-map"><canvas id="mission-map-pic"></canvas>' +
          '<span>' + mapDef.name + ' · ' + wegText + '</span></div>' +
        '<div class="level-brief">' +
          '<div><span>Wellen</span><b>' + lvl.waves + '</b></div>' +
          '<div><span>Leben</span><b>' + lvl.diff.lives + '</b></div>' +
          '<div><span>Türme</span><b>' + lvl.roles.length + '</b></div>' +
          '<div><span>Portale</span><b>' + lvl.pathCount + '</b></div>' +
        '</div>' +
        (lvl.heroNote ? '<div class="hero-note">' + lvl.heroNote + '</div>' : '') +
        (lvl.heroAvailable
          ? '<div class="hero-ready">★ ' + f.hero.name.split(' ')[0] + ' kämpft mit – ' +
            'einmal je Kapitel einsetzbar' +
            (lvl.heroAwakened ? ' · <b>gewandelt: stärker und schneller bereit</b>' : '') +
            '</div>'
          : '<div class="hero-ready wait">' + f.hero.name.split(' ')[0] +
            ' führt in diesem Kapitel noch aus dem Hintergrund</div>') +
        (lvl.boss ? '<div class="boss-warn">⚠ Endgegner in der letzten Welle</div>' : '') +
        '<button class="btn btn-primary" id="btn-story-go">Los geht’s</button>' +
        '<div class="btn-row"><button class="btn" id="btn-story-back" style="grid-column:1/-1">‹ Zurück</button></div>';

      TD.scenes.draw($('mission-pic'), lvl.scene, n * 977 + factionKey.length * 31, 5);
      TD.maps.drawPreview($('mission-map-pic'), mapDef, 420);
      if (lvl.heroLine) TD.characters.draw($('story-pic'), factionKey, 2);

      $('btn-story-go').addEventListener('click', function () {
        TD.audio.unlock();
        TD.game.factionKey = factionKey;
        UI.buildShop();
        TD.game.startCampaignLevel(factionKey, n);
      });
      $('btn-story-back').addEventListener('click', function () {
        TD.audio.click(); UI.showCampaignLevels(factionKey);
      });
      D.overlay.classList.add('show');
    },

    /** Schritt 4: Abschluss eines Levels. */
    showCampaignResult: function (won, stars, res) {
      var g = TD.game;
      var lvl = g.campaign;
      var f = TD.factions.get(g.factionKey);
      var dur = Math.round((Date.now() - g.stats.startedAt) / 1000);
      var mm = Math.floor(dur / 60), ss = dur % 60;
      var isLast = lvl.n >= TD.campaign.COUNT;

      var starRow = '';
      for (var i = 1; i <= 3; i++) {
        starRow += '<span class="star' + (i <= stars ? ' on' : '') + '">★</span>';
      }

      D.card.innerHTML =
        '<h2>' + (won ? 'Level geschafft!' : 'Gescheitert') +
          (res.isRecord ? '<span class="badge-new">Rekord</span>' : '') + '</h2>' +
        '<p class="sub">Kapitel ' + lvl.n + ': ' + lvl.title + '</p>' +
        (won ? '<div class="star-row">' + starRow + '</div>' : '') +
        '<div class="result-stats">' +
          '<div><span>Punkte</span><b>' + U.fmt(g.score) + '</b></div>' +
          '<div><span>Wellen</span><b>' + g.waveNumber + ' / ' + lvl.waves + '</b></div>' +
          '<div><span>Leben übrig</span><b>' + g.lives + ' / ' + g.maxLives + '</b></div>' +
          '<div><span>Abschüsse</span><b>' + U.fmt(g.stats.kills) + '</b></div>' +
          '<div><span>Truhen richtig</span><b>' + g.lootStats.correct + ' / ' + g.lootStats.opened + '</b></div>' +
          '<div><span>Spielzeit</span><b>' + mm + ':' + (ss < 10 ? '0' : '') + ss + '</b></div>' +
        '</div>' +
        (res.prev && res.prev.score ? '<p class="sub">Bisher: ' + U.fmt(res.prev.score) + ' Punkte</p>' : '') +
        (won && lvl.outro ? '<div class="outro">' + lvl.outro + '</div>' : '') +
        (won && isLast
          ? '<div class="finale-note">Du hast den Feldzug der ' + f.name + ' abgeschlossen. ' +
            'Die anderen Völker warten noch auf ihre Geschichte.</div>' : '') +
        (won && !isLast
          ? '<button class="btn btn-primary" id="btn-next">Weiter zu Kapitel ' + (lvl.n + 1) + '</button>'
          : '<button class="btn btn-primary" id="btn-retry">' + (won ? 'Nochmal spielen' : 'Erneut versuchen') + '</button>') +
        '<div class="btn-row">' +
          (won && !isLast ? '<button class="btn" id="btn-retry2">Wiederholen</button>' : '') +
          '<button class="btn" id="btn-levels"' +
            (won && !isLast ? '' : ' style="grid-column:1/-1"') + '>Levelübersicht</button>' +
        '</div>';

      function again() {
        TD.audio.click();
        TD.celebrate.stop();
        TD.game.startCampaignLevel(g.factionKey, lvl.n);
      }
      if ($('btn-next')) {
        $('btn-next').addEventListener('click', function () {
          TD.audio.click();
          TD.celebrate.stop();
          UI.showStory(g.factionKey, lvl.n + 1);
        });
      }
      if ($('btn-retry')) $('btn-retry').addEventListener('click', again);
      if ($('btn-retry2')) $('btn-retry2').addEventListener('click', again);
      $('btn-levels').addEventListener('click', function () {
        TD.audio.click();
        TD.celebrate.stop();
        TD.game.state = 'menu';
        TD.audio.stopMusic();
        UI.showCampaignLevels(g.factionKey);
      });

      D.overlay.classList.add('show');

      /* Belohnung: kurze Feier über dem Ergebnisfenster */
      if (won) {
        var fc = f.colors;
        TD.celebrate.play({
          colors: [fc.primary, fc.secondary, fc.trim, '#ffd166', '#ffffff'],
          banner: isLast ? 'VOLLBRACHT' : (stars === 3 ? 'MEISTERHAFT' : 'GESCHAFFT'),
          stars: stars
        });
      }

      /* War das der letzte fehlende Feldzug, öffnet sich der verborgene.
         Die Enthüllung kommt nach der Feier – erst genießen, dann staunen. */
      if (won && isLast && TD.campaign.secretUnlocked() && !TD.campaign.secretSeen()) {
        var goNext = $('btn-next') || $('btn-retry');
        if (goNext) {
          goNext.textContent = 'Weiter …';
          goNext.classList.add('btn-reveal-hint');
        }
        setTimeout(function () {
          if (TD.game.state === 'victory') {
            TD.celebrate.stop();
            TD.audio.unlock();
            UI.showSecretReveal();
          }
        }, 3600);
      }
    },

    /* ---------------- Wissenswertes ----------------
       Genau diese Texte sind die Grundlage der Truhenfragen. */
    showLore: function (factionKey, backTo) {
      var f = TD.factions.get(factionKey);

      D.card.innerHTML =
        '<h2>' + f.name + '</h2>' +
        '<p class="sub">' + f.era + ' · ' + f.tagline + '</p>' +
        '<p class="lore-hint">Die Truhen im Spiel fragen genau diese Dinge ab – wer aufpasst, ' +
        'schaltet schneller neue Türme frei.</p>' +
        '<div class="lore-list">' +
          f.facts.map(function (fa) {
            return '<div class="lore-item"><b>' + fa.title + '</b><p>' + fa.text + '</p></div>';
          }).join('') +
        '</div>' +
        '<button class="btn btn-primary" id="btn-lore-back">Zurück</button>';

      $('btn-lore-back').addEventListener('click', function () {
        TD.audio.click();
        if (backTo === 'pause') UI.showPauseMenu();
        else if (backTo === 'campaign') UI.showCampaignLevels(factionKey);
        else UI.showFreePlay();
      });
      D.overlay.classList.add('show');
    },

    /* ---------------- Truhen-Quiz ---------------- */
    showQuiz: function (quiz) {
      var g = TD.game;
      var f = TD.factions.get(g.factionKey);
      var nextRole = g.nextLockedRole();
      var prize = nextRole
        ? 'Freischaltung: <b>' + TD.factions.towerName(g.factionKey, nextRole) + '</b>'
        : 'Belohnung: <b>Gratis-Ausbau + ' + TD.LOOT.tokenGold + ' Gold</b>';

      D.card.innerHTML =
        '<div class="quiz-head"><span class="quiz-chest">🎁</span>' +
        '<div><h2>Truhe geöffnet!</h2>' +
        '<p class="sub">Beantworte die Frage richtig, um sie zu erhalten.</p></div></div>' +
        '<div class="quiz-prize">' + prize + '</div>' +
        '<div class="quiz-q">' + quiz.question + '</div>' +
        '<div class="quiz-answers" id="quiz-answers"></div>' +
        '<div class="quiz-result hidden" id="quiz-result"></div>';

      var box = $('quiz-answers');
      var answered = false;

      quiz.options.forEach(function (opt) {
        var b = el('button', 'quiz-answer', opt.text);
        b.type = 'button';
        box.appendChild(b);

        b.addEventListener('click', function () {
          if (answered) return;
          answered = true;
          TD.audio.unlock();

          // Alle Knöpfe auswerten: richtige grün, gewählte falsche rot
          Array.prototype.forEach.call(box.children, function (btn, i) {
            btn.disabled = true;
            if (quiz.options[i].right) btn.classList.add('right');
          });
          if (!opt.right) b.classList.add('wrong');

          var reward = g.answerQuiz(opt.right);
          UI.showQuizResult(quiz, opt.right, reward);
        });
      });

      D.overlay.classList.add('show');
    },

    showQuizResult: function (quiz, wasRight, reward) {
      var box = $('quiz-result');
      var msg;

      if (!wasRight) {
        msg = '<div class="qr-title bad">Leider falsch</div>' +
              '<p>Als Trost gibt es ' + reward.gold + ' Gold. Die nächste Truhe kommt bestimmt.</p>';
      } else if (reward.type === 'unlock') {
        msg = '<div class="qr-title good">Richtig!</div>' +
              '<p><b>' + reward.name + '</b> ist ab sofort im Turmmenü verfügbar.</p>';
      } else {
        msg = '<div class="qr-title good">Richtig!</div>' +
              '<p>Du erhältst einen <b>Gratis-Ausbau</b> und ' + reward.gold + ' Gold. ' +
              'Wähle einen Turm aus, um ihn einzusetzen.</p>';
      }

      if (quiz.fact) {
        msg += '<div class="qr-fact"><b>' + quiz.fact.title + '</b><br>' + quiz.fact.text + '</div>';
      }
      msg += '<button class="btn btn-primary" id="btn-quiz-close">Weiterspielen</button>';

      box.innerHTML = msg;
      box.classList.remove('hidden');

      $('btn-quiz-close').addEventListener('click', function () {
        TD.audio.click();
        UI.closeOverlay();
        if (TD.game.paused) TD.game.togglePause();
      });
    },

    /* ---------------- Anleitung ---------------- */
    showHelp: function () {
      D.card.innerHTML =
        '<h2>So wird gespielt</h2>' +
        '<p class="sub">Gegner laufen vom roten Portal zu deiner Basis. Lass keinen durch.</p>' +
        '<ul class="help-list">' +
          '<li><b>Bauen:</b> Turm in der Liste wählen, dann auf ein freies Feld tippen. Auf dem Weg kann nicht gebaut werden.</li>' +
          '<li><b>Verbessern:</b> Turm antippen, dann „Upgrade“. Jeder Turm hat vier Stufen.</li>' +
          '<li><b>Deine Anführerin ★:</b> Steht ganz oben im Turmmenü und lässt sich <b>nur einmal je Kapitel</b> setzen. Sie ist deutlich stärker als jeder Turm und hat eine Fähigkeit, die sich auflädt und von allein losgeht.</li>' +
          '<li><b>Truhen 🎁:</b> Tauchen während des Spiels auf dem Feld auf. Antippen stellt eine Wissensfrage zu deinem Volk – nur die richtige Antwort schaltet einen neuen Turm frei.</li>' +
          '<li><b>Besondere Felder:</b> Anhöhe ▲, Quelle ≈, Glutspalte ✦ und Kraftader ◈ verstärken manche Türme und schwächen andere. Beim Bauen wird angezeigt, ob das Feld passt.</li>' +
          '<li><b>Gold:</b> Gibt es für Abschüsse, für geschaffte Wellen und fürs Vorziehen der nächsten Welle.</li>' +
          '<li><b>Flieger</b> nehmen die Luftlinie – die Kanone trifft sie nicht.</li>' +
          '<li><b>Panzerung</b> senkt jeden Treffer. Scharfschütze und Gift ignorieren sie.</li>' +
        '</ul>' +
        '<div class="section-title">Tastatur (PC)</div>' +
        '<ul class="help-list">' +
          '<li><kbd>1</kbd>–<kbd>6</kbd><span>Turm auswählen</span></li>' +
          '<li><kbd>H</kbd><span>Anführerin auswählen</span></li>' +
          '<li><kbd>Space</kbd><span>Pause</span></li>' +
          '<li><kbd>F</kbd><span>Geschwindigkeit 1× / 2× / 3×</span></li>' +
          '<li><kbd>N</kbd><span>Nächste Welle vorziehen</span></li>' +
          '<li><kbd>U</kbd> / <kbd>V</kbd><span>Ausgewählten Turm verbessern / verkaufen</span></li>' +
          '<li><kbd>M</kbd><span>Ton an/aus</span></li>' +
          '<li><kbd>Esc</kbd><span>Abbrechen / Menü</span></li>' +
          '<li><kbd>Rechts&shy;klick</kbd><span>Zurück in den Übersichtsmodus</span></li>' +
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

      var camp = TD.game.campaign;
      D.card.innerHTML =
        '<h2>Pause</h2>' +
        '<p class="sub">' +
          (camp ? 'Kapitel ' + camp.n + ': ' + camp.title + ' · ' : '') +
          'Welle ' + TD.game.waveNumber +
          (camp ? '/' + camp.waves : '') +
          ' · ' + TD.game.lives + ' Leben · ' + U.fmt(TD.game.score) + ' Punkte</p>' +
        '<button class="btn btn-primary" id="btn-resume">Weiterspielen</button>' +
        '<div class="btn-row">' +
          '<button class="btn" id="btn-help2">Anleitung</button>' +
          '<button class="btn" id="btn-lore2">Wissenswertes</button>' +
        '</div>' +
        '<div class="btn-row">' +
          '<button class="btn" id="btn-restart" style="grid-column:1/-1">Neu starten</button>' +
        '</div>' +
        '<div class="btn-row"><button class="btn btn-sell" id="btn-quit" style="grid-column:1/-1">' +
        (camp ? 'Feldzug verlassen' : 'Zum Hauptmenü') + '</button></div>';

      $('btn-resume').addEventListener('click', function () {
        TD.audio.click();
        UI.closeOverlay();
        if (TD.game.paused) TD.game.togglePause();
      });
      $('btn-help2').addEventListener('click', function () { TD.audio.click(); UI.showHelp(); });
      $('btn-lore2').addEventListener('click', function () {
        TD.audio.click(); UI.showLore(TD.game.factionKey, 'pause');
      });
      $('btn-restart').addEventListener('click', function () {
        TD.audio.click();
        if (camp) TD.game.startCampaignLevel(TD.game.factionKey, camp.n);
        else TD.game.start(TD.game.mapDef, TD.game.diff.key, TD.game.factionKey);
      });
      $('btn-quit').addEventListener('click', function () {
        TD.audio.click();
        var fk = TD.game.factionKey;
        TD.game.quitToMenu(camp ? function () { UI.showCampaignLevels(fk); } : null);
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
        TD.celebrate.stop();
        TD.game.start(g.mapDef, g.diff.key, g.factionKey);
      });
      $('btn-menu2').addEventListener('click', function () {
        TD.audio.click();
        TD.celebrate.stop();
        TD.game.quitToMenu();
      });

      D.overlay.classList.add('show');

      if (won) {
        var fc2 = TD.factions.get(g.factionKey).colors;
        TD.celebrate.play({
          colors: [fc2.primary, fc2.secondary, fc2.trim, '#ffd166', '#ffffff'],
          banner: 'GESCHAFFT'
        });
      }
    }
  };

  /** Kleine Turmparade als Vorschau eines Volkes. */
  function drawFactionPreview(canvas, factionKey) {
    var w = 220, h = 74;
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = '100%'; canvas.style.height = 'auto';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var f = TD.factions.get(factionKey);
    var grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, U.shade(f.colors.primary, -0.55));
    grd.addColorStop(1, '#0a1020');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Drei kennzeichnende Türme des Volkes
    ['rapid', 'splash', 'sniper'].forEach(function (role, i) {
      ctx.save();
      ctx.translate(37 + i * 73, h * 0.66);
      ctx.scale(0.86, 0.86);
      TD.render.drawTowerAt(ctx, factionKey, role, 2);
      ctx.restore();
    });
  }

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
