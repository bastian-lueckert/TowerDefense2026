/* =========================================================
   game.js – Spielzustand, Schleife, Regeln, Eingabe
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;
  var CELL = TD.GRID.CELL, COLS = TD.GRID.COLS, ROWS = TD.GRID.ROWS;
  var PAD = TD.GRID.PAD_TOP;
  var W = COLS * CELL, H = ROWS * CELL;
  var CH = H + PAD;                    // Canvas ist oben etwas höher als das Raster

  var G = TD.game = {

    /* ---------------- Zustand ---------------- */
    state: 'menu',          // menu | playing | gameover | victory
    paused: false,
    speedIndex: 0,
    time: 0,

    canvas: null, ctx: null, dpr: 1,

    map: null, mapDef: null, diff: null,
    factionKey: 'medieval', faction: null,
    lives: 20, maxLives: 20, gold: 0, score: 0,

    towers: [], enemies: [], projectiles: [], particles: [], effects: [], texts: [],
    strikes: [],                 // verzögerte Flächentreffer (Pfeilhagel)

    /* Freischaltung & Lootboxen */
    unlocked: [], availableRoles: [], lootboxes: [], lootTimer: 0,
    askedQuestions: [], upgradeTokens: 0, pendingQuiz: null,

    /* Kampagne (null = freies Spiel) */
    campaign: null,

    waveNumber: 0,          // zuletzt gestartete Welle
    nextWave: 1,
    breakTimer: 0,
    activeSpawns: [],
    waveRunning: false,

    buildKey: null,
    hoverCell: null,
    selected: null,

    shake: 0, hurtFlash: 0,
    stats: null,

    /* =====================================================
       Initialisierung
       ===================================================== */
    init: function (canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resize();
      this.bindInput();

      var self = this;
      global.addEventListener('resize', function () { self.resize(); });
      global.addEventListener('orientationchange', function () {
        setTimeout(function () { self.resize(); }, 250);
      });

      this.lastFrame = performance.now();
      requestAnimationFrame(function loop(now) {
        self.frame(now);
        requestAnimationFrame(loop);
      });
    },

    /** Canvas an Bildschirmdichte anpassen (scharfe Darstellung). */
    resize: function () {
      var dpr = Math.min(global.devicePixelRatio || 1, 2);
      if (dpr === this.dpr && this.canvas.width === Math.round(W * dpr)) return;
      this.dpr = dpr;
      this.canvas.width = Math.round(W * dpr);
      this.canvas.height = Math.round(CH * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = true;
    },

    /* =====================================================
       Spielstart
       ===================================================== */
    /** Ein Level des Feldzugs starten. */
    startCampaignLevel: function (factionKey, n) {
      var level = TD.campaign.levelFor(factionKey, n);
      this.start(level.mapDef, 'campaign', factionKey, level);
    },

    /**
     * @param {string|object} mapRef Karten-ID oder fertige Kartendefinition
     * @param {string} diffKey
     * @param {string} factionKey
     * @param {object} [level] Kampagnenlevel; fehlt es, ist es ein freies Spiel
     */
    start: function (mapRef, diffKey, factionKey, level) {
      this.campaign = level || null;
      this.mapDef = (typeof mapRef === 'string') ? TD.maps.byId(mapRef) : mapRef;
      this.map = TD.maps.build(this.mapDef);
      this.diff = level ? level.diff : (TD.DIFFICULTIES[diffKey] || TD.DIFFICULTIES.normal);

      /* Im freien Spiel gleicht die Karte selbst aus: Wer mehrere Wege
         gleichzeitig halten muss, bekommt mehr Gold und etwas zähere
         Gegner erspart. (Kopie anlegen – die Vorlage bleibt unberührt.) */
      if (!level && this.map.pathCount > 1) {
        var src = this.diff, copy = {};
        Object.keys(src).forEach(function (k) { copy[k] = src[k]; });
        var bal = TD.PATH_BALANCE_FREE[this.map.pathCount] ||
                  TD.PATH_BALANCE_FREE[3];
        copy.gold = Math.round(copy.gold * bal.gold);
        copy.hpMul = copy.hpMul * bal.hp;
        copy.goldMul = copy.goldMul * bal.goldMul;
        this.diff = copy;
      }
      this.factionKey = factionKey || this.factionKey || 'medieval';
      this.faction = TD.factions.get(this.factionKey);

      // Welche Türme in diesem Spiel überhaupt vorkommen
      this.availableRoles = level ? level.roles.slice() : TD.ROLE_ORDER.slice();

      // Davon stehen die ersten beiden sofort bereit, der Rest kommt über Truhen
      this.unlocked = this.availableRoles.slice(0, 2);
      this.lootboxes = [];
      this.lootTimer = TD.LOOT.firstDelay;
      // Gestellte Fragen bleiben über Level hinweg gespeichert
      this.askedQuestions = TD.progress.askedFor(this.factionKey);
      this.upgradeTokens = 0;
      this.pendingQuiz = null;
      this.lootStats = { opened: 0, correct: 0 };

      this.lives = this.maxLives = this.diff.lives;
      this.gold = this.diff.gold;
      this.score = 0;
      this.time = 0;

      this.towers = []; this.enemies = []; this.projectiles = [];
      this.particles = []; this.effects = []; this.texts = [];
      this.strikes = [];

      this.waveNumber = 0;
      this.nextWave = 1;
      this.breakTimer = 6;          // kurze Vorbereitungszeit
      this.activeSpawns = [];
      this.waveRunning = false;

      /* Held: einmal je Level einsetzbar. In den ersten Kapiteln
         führt die Hauptfigur noch aus dem Hintergrund. */
      this.hero = null;
      this.heroAura = null;
      this.heroAvailable = level ? (level.heroAvailable !== false) : true;

      this.buildKey = null;
      this.hoverCell = null;
      this.selected = null;
      this.shake = 0; this.hurtFlash = 0;
      this.paused = false;
      this.speedIndex = 0;

      this.stats = { kills: 0, leaked: 0, damage: 0, shots: 0, goldEarned: 0, built: 0, startedAt: Date.now() };

      this.state = 'playing';
      this.updateAirWarning();
      TD.render.invalidateBackground();
      TD.audio.startMusic(this.factionKey);
      TD.ui.onGameStart();
    },

    /* =====================================================
       Hauptschleife
       ===================================================== */
    frame: function (now) {
      var dt = (now - this.lastFrame) / 1000;
      this.lastFrame = now;
      if (dt > 0.1) dt = 0.1;              // Nach Tab-Wechsel nicht "aufholen"

      if (this.state === 'playing' && !this.paused) {
        var speed = TD.SPEEDS[this.speedIndex];
        var total = dt * speed;
        // In Teilschritten rechnen, damit schnelle Geschosse nichts überspringen
        var steps = Math.min(6, Math.ceil(total / (1 / 60)));
        var sub = total / steps;
        for (var i = 0; i < steps; i++) this.update(sub);
      } else if (this.state === 'playing' && this.paused) {
        // Nur Optik weiterlaufen lassen
        this.time += dt;
      }

      if (this.map) TD.render.draw(this.ctx, this);
      TD.ui.tick(dt);
    },

    update: function (dt) {
      this.time += dt;
      if (this.shake > 0)      this.shake = Math.max(0, this.shake - dt * 22);
      if (this.hurtFlash > 0)  this.hurtFlash = Math.max(0, this.hurtFlash - dt * 1.6);

      this.updateWaves(dt);
      this.updateLoot(dt);
      this.updateStrikes(dt);

      var i;
      for (i = 0; i < this.towers.length; i++) this.towers[i].update(dt);

      for (i = this.enemies.length - 1; i >= 0; i--) {
        var e = this.enemies[i];
        e.update(dt);
        if (!e.alive) {
          if (e.leaked) this.onEnemyLeaked(e);
          this.enemies.splice(i, 1);
        }
      }

      for (i = this.projectiles.length - 1; i >= 0; i--) {
        this.projectiles[i].update(dt);
        if (this.projectiles[i].dead) this.projectiles.splice(i, 1);
      }

      for (i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update(dt);
        if (this.particles[i].dead) this.particles.splice(i, 1);
      }

      for (i = this.texts.length - 1; i >= 0; i--) {
        this.texts[i].update(dt);
        if (this.texts[i].dead) this.texts.splice(i, 1);
      }

      for (i = this.effects.length - 1; i >= 0; i--) {
        this.effects[i].life -= dt;
        if (this.effects[i].life <= 0) this.effects.splice(i, 1);
      }
    },

    /* =====================================================
       Wellensteuerung
       ===================================================== */
    updateWaves: function (dt) {
      var i;

      // Laufende Spawn-Aufträge abarbeiten
      for (i = this.activeSpawns.length - 1; i >= 0; i--) {
        var s = this.activeSpawns[i];
        s.timer -= dt;
        while (s.timer <= 0 && s.remaining > 0) {
          // Reihum über alle Portale, damit alle Wege bespielt werden
          var pi = s.path == null
            ? (s.counter++ % this.map.paths.length)
            : s.path;
          this.enemies.push(new TD.Enemy(this, s.type, s.waveN, pi));
          s.remaining--;
          s.timer += s.gap;
        }
        if (s.remaining <= 0) this.activeSpawns.splice(i, 1);
      }

      var idle = this.activeSpawns.length === 0 && this.enemies.length === 0;

      // Welle abgeschlossen?
      if (this.waveRunning && idle) {
        this.waveRunning = false;
        this.onWaveCleared(this.waveNumber);

        if (this.waveNumber >= this.diff.waves) {
          this.win();
          return;
        }
        this.breakTimer = TD.WAVE_BREAK;
      }

      // Pause zwischen den Wellen herunterzählen
      if (!this.waveRunning && this.breakTimer > 0) {
        this.breakTimer -= dt;
        if (this.breakTimer <= 0) {
          this.breakTimer = 0;
          this.startWave();
        }
      }
    },

    /** Startet die nächste Welle (auch vorzeitig per Knopfdruck). */
    startWave: function (manual) {
      if (this.state !== 'playing') return;
      if (this.nextWave > this.diff.waves) return;

      if (manual) {
        // Bonusgold fürs Vorziehen
        var bonus = this.waveRunning
          ? Math.round(15 + this.nextWave * 2)
          : Math.round(this.breakTimer * TD.EARLY_BONUS_PER_SEC);
        if (bonus > 0) {
          this.addGold(bonus);
          this.addFloatText(this.map.basePx.x, this.map.basePx.y - CELL * 0.8, '+' + bonus + ' ◈', '#ffd166', true);
          TD.ui.toast('Frühstart-Bonus: +' + bonus + ' Gold', 'good');
        }
      }

      var n = this.nextWave;

      /* Im Feldzug bestimmt eine vorgezogene Wellennummer, welche
         Gegnerarten auftreten – die Lebenspunkte richten sich aber
         weiter nach der Welle innerhalb des Levels. */
      var wave = this.waveFor(n);

      /* Bei mehreren Wegen bekommen manche Gruppen ein festes Portal,
         andere verteilen sich abwechselnd – das macht die Wellen
         abwechslungsreicher als eine reine Rundverteilung. */
      var paths = this.map.paths.length;
      wave.groups.forEach(function (grp, gi) {
        var fixed = null;
        if (paths > 1 && grp.count <= 6 && gi % 2 === 0) fixed = gi % paths;
        this.activeSpawns.push({
          type: grp.type, remaining: grp.count,
          gap: grp.gap, timer: grp.delay, waveN: n,
          path: fixed, counter: gi
        });
      }, this);

      this.waveNumber = n;
      this.nextWave = n + 1;
      this.waveRunning = true;
      this.breakTimer = 0;

      this.updateAirWarning();
      TD.audio.waveStart();
      TD.ui.toast('Welle ' + n + (wave.boss ? ' – BOSS!' : ''), wave.boss ? 'bad' : '');
      TD.ui.refreshWavePreview();
      TD.ui.refreshHud();
    },

    /**
     * Merkt sich, ob in der laufenden oder nächsten Welle Flieger vorkommen.
     * Nur dann wird die Luftlinie eingeblendet – der Spieler muss sehen
     * können, wo Flugabwehr überhaupt etwas nützt.
     */
    updateAirWarning: function () {
      var hasFlyer = function (n) {
        if (n < 1 || n > this.diff.waves) return false;
        return this.waveFor(n).groups.some(function (g) { return g.type === 'flyer'; });
      }.bind(this);
      this.airWarning = hasFlyer(this.waveNumber) || hasFlyer(this.nextWave);
    },

    /** Wellennummer, die die Gegnerauswahl bestimmt. */
    typeWaveFor: function (n) {
      return n + (this.campaign ? this.campaign.typeOffset : 0);
    },

    /**
     * Aufbau einer Welle. Vorschau und Spawner nutzen dieselbe
     * Funktion, damit angezeigt wird, was auch wirklich kommt.
     */
    waveFor: function (n) {
      var typeWave = this.typeWaveFor(n);
      var wave = TD.waves.generate(typeWave, this.diff.key, this.campaign ? n : typeWave);
      if (!this.campaign) return wave;

      /* Im Feldzug bestimmt allein das Kapitel, ob ein Endgegner kommt –
         und zwar erst in der Schlusswelle. Ohne diese Bereinigung würde
         die vorgezogene Wellennummer zufällig Bosse einstreuen, gegen die
         man in frühen Kapiteln nichts ausrichten kann. */
      var finalWave = (n === this.diff.waves);
      if (this.campaign.boss && finalWave) {
        if (!wave.groups.some(function (g) { return g.type === 'boss'; })) {
          wave.groups.push({ type: 'boss', count: this.campaign.finale ? 2 : 1, gap: 2.6, delay: 4 });
        }
      } else {
        wave.groups = wave.groups.filter(function (g) { return g.type !== 'boss'; });
      }
      return wave;
    },

    onWaveCleared: function (n) {
      var reward = Math.round((28 + n * 6) * this.diff.goldMul);
      this.addGold(reward);
      this.score += Math.round(n * 25 * this.diff.scoreMul);
      this.addFloatText(this.map.basePx.x, this.map.basePx.y - CELL * 0.8, '+' + reward + ' ◈', '#ffd166', true);
      TD.ui.toast('Welle ' + n + ' geschafft · +' + reward + ' Gold', 'good');
      TD.audio.coin();
      TD.ui.refreshHud();
    },

    /* =====================================================
       Lootboxen & Freischaltung
       ===================================================== */

    isUnlocked: function (role) {
      return this.unlocked.indexOf(role) >= 0;
    },

    /** Nächster noch gesperrter Turm – nur aus den hier verfügbaren. */
    nextLockedRole: function () {
      for (var i = 0; i < TD.UNLOCK_ORDER.length; i++) {
        var r = TD.UNLOCK_ORDER[i];
        if (this.availableRoles.indexOf(r) >= 0 && !this.isUnlocked(r)) return r;
      }
      return null;
    },

    updateLoot: function (dt) {
      var i;
      for (i = this.lootboxes.length - 1; i >= 0; i--) {
        this.lootboxes[i].update(dt);
        if (this.lootboxes[i].dead) this.lootboxes.splice(i, 1);
      }

      // Solange ein Quiz offen ist, kommt nichts Neues dazu
      if (this.pendingQuiz) return;
      if (this.lootboxes.length >= TD.LOOT.maxOnField) return;

      this.lootTimer -= dt;
      if (this.lootTimer > 0) return;
      this.lootTimer = U.rand(TD.LOOT.minGap, TD.LOOT.maxGap);
      this.spawnLootbox();
    },

    /** Sucht ein freies Feld möglichst weit weg von schon liegenden Kisten. */
    spawnLootbox: function () {
      var options = [], cx, cy;
      for (cy = 0; cy < ROWS; cy++) {
        for (cx = 0; cx < COLS; cx++) {
          if (this.map.cells[cy * COLS + cx] === 2) continue;   // Fels/Baum
          if (this.towerAt(cx, cy)) continue;
          var busy = this.lootboxes.some(function (b) {
            return Math.abs(b.cx - cx) < 3 && Math.abs(b.cy - cy) < 3;
          });
          if (!busy) options.push({ cx: cx, cy: cy });
        }
      }
      if (!options.length) return;
      var p = options[U.randInt(0, options.length - 1)];
      this.lootboxes.push(new TD.Lootbox(this, p.cx, p.cy));
      TD.audio.lootAppear();
      TD.ui.toast('Eine Truhe ist aufgetaucht!', 'good');
    },

    /** Kiste antippen: Spiel anhalten und Wissensfrage stellen. */
    openLootbox: function (box) {
      if (this.pendingQuiz || box.opened) return;
      box.opened = true;
      box.dead = true;
      this.lootStats.opened++;

      this.addSparks(box.x, box.y, '#ffd166', 22, 1.4);
      this.addRing(box.x, box.y, CELL * 1.4, '#ffd166');
      TD.audio.lootOpen();

      var quiz = TD.factions.drawQuestion(this.factionKey, this.askedQuestions);
      this.askedQuestions = TD.progress.markAsked(this.factionKey, quiz.id);
      this.pendingQuiz = quiz;

      if (!this.paused) this.togglePause();
      TD.ui.showQuiz(quiz);
    },

    /**
     * Auswertung der Antwort.
     * Nur eine richtige Antwort bringt eine Verbesserung.
     */
    answerQuiz: function (wasRight) {
      var reward = null;

      if (wasRight) {
        this.lootStats.correct++;
        var role = this.nextLockedRole();
        if (role) {
          this.unlocked.push(role);
          reward = { type: 'unlock', role: role, name: TD.factions.towerName(this.factionKey, role) };
          TD.audio.unlock();
        } else {
          // Alles frei: stattdessen ein kostenloses Ausbau-Siegel
          this.upgradeTokens++;
          this.addGold(TD.LOOT.tokenGold);
          reward = { type: 'token', gold: TD.LOOT.tokenGold };
          TD.audio.correct();
        }
        this.score += 150;
      } else {
        this.addGold(TD.LOOT.wrongGold);
        reward = { type: 'wrong', gold: TD.LOOT.wrongGold };
        TD.audio.wrong();
      }

      this.pendingQuiz = null;
      TD.ui.refreshHud();
      TD.ui.refreshShop();
      TD.ui.refreshTowerPanel();
      return reward;
    },

    /** Ein Siegel einlösen: kostenloser Ausbau des gewählten Turms. */
    useToken: function () {
      var t = this.selected;
      if (!t || this.upgradeTokens <= 0) return false;
      if (!t.canUpgrade()) { TD.audio.error(); TD.ui.toast('Maximale Stufe erreicht', 'bad'); return false; }

      this.upgradeTokens--;
      t.level++;
      t.buildAnim = 1;
      TD.audio.upgrade();
      this.addRing(t.x, t.y, CELL, '#ffd166');
      this.addSparks(t.x, t.y, '#ffd166', 16);
      this.addFloatText(t.x, t.y - 14, 'Gratis-Ausbau!', '#ffd166', true);
      TD.ui.refreshHud();
      TD.ui.refreshTowerPanel();
      return true;
    },

    /* =====================================================
       Ereignisse
       ===================================================== */
    onEnemyKilled: function (e, opts) {
      this.stats.kills++;
      this.addGold(e.gold);
      this.score += e.score;

      if (opts && opts.tower) opts.tower.kills++;

      var boss = !!e.def.boss;
      TD.audio.enemyDie(boss);
      this.addSparks(e.x, e.y, e.def.color, boss ? 26 : 8, boss ? 2 : 1);

      if (boss) {
        this.shake = 9;
        this.addExplosion(e.x, e.y, CELL * 2.2, '#ff9a4a', 'shell');
      }
      if (e.gold >= 15 || boss) {
        this.addFloatText(e.x, e.y - e.r - 6, '+' + e.gold, '#ffd166');
      }
      TD.ui.refreshHud();
    },

    onEnemyLeaked: function (e) {
      var cost = e.def.leak;
      this.lives -= cost;
      this.stats.leaked++;
      this.hurtFlash = 1;
      this.shake = Math.min(12, 4 + cost);
      TD.audio.leak();
      this.addExplosion(this.map.basePx.x, this.map.basePx.y, CELL * 1.2, '#ff5d73', 'shell');
      this.addFloatText(this.map.basePx.x, this.map.basePx.y - CELL * 0.7, '-' + cost + ' ❤', '#ff5d73', true);
      TD.ui.refreshHud(true);

      if (this.lives <= 0) {
        this.lives = 0;
        this.lose();
      }
    },

    addGold: function (n) {
      this.gold += n;
      this.stats.goldEarned += n;
    },

    spendGold: function (n) {
      this.gold -= n;
    },

    /* =====================================================
       Türme bauen / verwalten
       ===================================================== */
    towerAt: function (cx, cy) {
      for (var i = 0; i < this.towers.length; i++) {
        if (this.towers[i].cx === cx && this.towers[i].cy === cy) return this.towers[i];
      }
      return null;
    },

    canPlaceAt: function (cx, cy) {
      return TD.maps.canBuild(this.map, cx, cy) && !this.towerAt(cx, cy);
    },

    placeTower: function (role, cx, cy) {
      var isHero = role === 'hero';
      if (!isHero && !TD.ROLE_BASE[role]) return false;
      var def = TD.towerDef(this.factionKey, role);

      if (isHero) {
        if (!this.heroAvailable) { TD.audio.error(); TD.ui.toast('Deine Anführerin ist hier noch nicht dabei', 'bad'); return false; }
        if (this.hero)           { TD.audio.error(); TD.ui.toast('Sie kann nur an einer Stelle stehen', 'bad'); return false; }
      } else if (!this.isUnlocked(role)) {
        TD.audio.error(); TD.ui.toast('Noch nicht freigeschaltet – öffne eine Truhe', 'bad'); return false;
      }
      if (!this.canPlaceAt(cx, cy)) { TD.audio.error(); TD.ui.toast('Hier kann nicht gebaut werden', 'bad'); return false; }
      if (this.gold < def.cost)     { TD.audio.error(); TD.ui.toast('Nicht genug Gold', 'bad'); return false; }

      this.spendGold(def.cost);
      var t = new TD.Tower(this, role, cx, cy);
      this.towers.push(t);
      this.stats.built++;

      if (isHero) {
        this.hero = t;
        this.heroAura = this.faction.hero.aura || null;
        this.addRing(t.x, t.y, CELL * 2.2, '#ffd166');
        this.addFloatText(t.x, t.y - CELL * 0.8, this.faction.hero.name.split(' ')[0], '#ffd166', true);
        TD.audio.heroArrive();
      }

      TD.audio.place();
      this.addRing(t.x, t.y, CELL * 0.9, def.color);
      this.addSparks(t.x, t.y, def.color, 10);

      // Rückmeldung, wenn das Feld den Turm spürbar verändert
      var fx = t.fieldEffect();
      if (fx) {
        this.addFloatText(t.x, t.y - CELL * 0.6, fx.tile.name, fx.tile.glow, true);
        TD.ui.toast(fx.tile.name + ': ' + fx.text, 'good');
      }
      TD.ui.refreshHud();
      return true;
    },

    selectTower: function (t) {
      this.selected = t;
      this.buildKey = null;
      TD.ui.refreshTowerPanel();
      TD.ui.refreshShop();
    },

    upgradeSelected: function () {
      var t = this.selected;
      if (!t) return;
      if (!t.canUpgrade()) { TD.audio.error(); TD.ui.toast('Maximale Stufe erreicht', 'bad'); return; }
      if (this.gold < t.upgradeCost()) { TD.audio.error(); TD.ui.toast('Nicht genug Gold', 'bad'); return; }

      t.upgrade();
      TD.audio.upgrade();
      this.addRing(t.x, t.y, CELL, '#ffd166');
      this.addSparks(t.x, t.y, '#ffd166', 14);
      TD.ui.refreshHud();
      TD.ui.refreshTowerPanel();
    },

    sellSelected: function () {
      var t = this.selected;
      if (!t) return;
      var value = t.sellValue();
      var idx = this.towers.indexOf(t);
      if (idx >= 0) this.towers.splice(idx, 1);

      if (t === this.hero) { this.hero = null; this.heroAura = null; }

      this.addGold(value);
      this.stats.goldEarned -= value;   // Rückerstattung zählt nicht als Verdienst
      TD.audio.sell();
      this.addSparks(t.x, t.y, '#ffb36a', 12);
      this.addFloatText(t.x, t.y - 12, '+' + value + ' ◈', '#ffd166');

      this.selected = null;
      TD.ui.refreshHud();
      TD.ui.refreshTowerPanel();
    },

    setBuildKey: function (key) {
      if (this.buildKey === key) { this.buildKey = null; }
      else { this.buildKey = key; this.selected = null; }
      this.hoverCell = null;
      TD.ui.refreshShop();
      TD.ui.refreshTowerPanel();
    },

    /* =====================================================
       Effekte
       ===================================================== */
    addSparks: function (x, y, color, count, sizeMul) {
      sizeMul = sizeMul || 1;
      for (var i = 0; i < count; i++) {
        var a = Math.random() * U.TAU;
        var sp = U.rand(30, 150) * sizeMul;
        this.particles.push(new TD.Particle(
          x, y, Math.cos(a) * sp, Math.sin(a) * sp,
          U.rand(0.25, 0.6), color, U.rand(1.5, 3.5) * sizeMul,
          { gravity: 90, glow: true }
        ));
      }
    },

    addExplosion: function (x, y, r, color, kind) {
      this.effects.push({
        kind: 'explosion', x: x, y: y, r: r, color: color,
        seedAngle: Math.random() * U.TAU, life: 0.4, maxLife: 0.4
      });
      var n = Math.round(r / 6);
      for (var i = 0; i < n; i++) {
        var a = Math.random() * U.TAU;
        var sp = U.rand(40, r * 3.2);
        this.particles.push(new TD.Particle(
          x, y, Math.cos(a) * sp, Math.sin(a) * sp,
          U.rand(0.3, 0.75),
          Math.random() < 0.4 ? '#ffe6a0' : color,
          U.rand(2, 5), { gravity: 60, glow: true }
        ));
      }
      if (kind === 'shell') this.shake = Math.max(this.shake, 3.5);
    },

    addMuzzle: function (x, y, angle, color, scale) {
      this.effects.push({ kind: 'muzzle', x: x, y: y, angle: angle, color: color, scale: scale || 1, life: 0.09, maxLife: 0.09 });
    },

    addBeam: function (x1, y1, x2, y2, color, crit) {
      this.effects.push({ kind: 'beam', x1: x1, y1: y1, x2: x2, y2: y2, color: color, crit: !!crit, life: 0.16, maxLife: 0.16 });
    },

    addLightning: function (points, color) {
      var seed = [];
      for (var i = 0; i < 24; i++) seed.push(Math.random());
      this.effects.push({ kind: 'lightning', points: points, color: color, seed: seed, life: 0.16, maxLife: 0.16 });
    },

    /* ---------------- Heldenfähigkeiten ---------------- */

    /**
     * Pfeilhagel: mehrere Einschlagswellen nacheinander.
     * Die Wellen hängen an der Spieluhr, nicht an setTimeout –
     * sonst würden sie Pause und Zeitraffer ignorieren.
     */
    addArrowStorm: function (x, y, r, color, damage, tower) {
      this.effects.push({
        kind: 'arrowstorm', x: x, y: y, r: r, color: color,
        life: 1.5, maxLife: 1.5
      });
      this.strikes.push({
        x: x, y: y, r: r, color: color,
        damage: damage / 3, tower: tower,
        left: 3, timer: 0.05, interval: 0.23
      });
      this.shake = Math.max(this.shake, 4);
    },

    /** Verzögerte Flächentreffer abarbeiten. */
    updateStrikes: function (dt) {
      for (var i = this.strikes.length - 1; i >= 0; i--) {
        var s = this.strikes[i];
        s.timer -= dt;
        while (s.timer <= 0 && s.left > 0) {
          for (var e = 0; e < this.enemies.length; e++) {
            var en = this.enemies[e];
            if (!en.alive) continue;
            if (U.dist(s.x, s.y, en.x, en.y) > s.r + en.r) continue;
            var dealt = en.applyDamage(s.damage, { pierceArmor: true, tower: s.tower });
            if (s.tower) s.tower.damageDealt += dealt;
            if (s.poison) en.applyPoison(s.poison, s.poisonDur);
          }
          if (s.spin) {
            // Schnitt: ein Ring, der vom Helden ausgeht
            this.effects.push({
              kind: 'spincut', x: s.x, y: s.y, r: s.r, color: s.color,
              life: 0.3, maxLife: 0.3
            });
            this.addSparks(s.x, s.y, s.color, 12, 1.2);
          } else {
            this.addSparks(s.x + U.rand(-s.r * 0.5, s.r * 0.5),
                           s.y + U.rand(-s.r * 0.5, s.r * 0.5), s.color, 10);
          }
          s.left--;
          s.timer += s.interval;
        }
        if (s.left <= 0) this.strikes.splice(i, 1);
      }
    },

    /** Drei Rundumschläge kurz nacheinander, mit Nachblutung. */
    addSpinCuts: function (x, y, r, color, damage, tower, cuts, poison, poisonDur) {
      this.strikes.push({
        x: x, y: y, r: r, color: color,
        damage: damage, tower: tower,
        left: cuts, timer: 0.02, interval: 0.19,
        poison: poison, poisonDur: poisonDur, spin: true
      });
      this.shake = Math.max(this.shake, 5);
    },

    addShockwave: function (x, y, r, color) {
      this.effects.push({ kind: 'shockwave', x: x, y: y, r: r, color: color, life: 0.55, maxLife: 0.55 });
      this.addSparks(x, y, color, 22, 1.4);
      this.shake = Math.max(this.shake, 7);
    },

    addSunbeam: function (x1, y1, x2, y2, width, color) {
      this.effects.push({
        kind: 'sunbeam', x1: x1, y1: y1, x2: x2, y2: y2,
        width: width, color: color, life: 0.7, maxLife: 0.7
      });
      this.shake = Math.max(this.shake, 5);
    },

    addRing: function (x, y, r, color) {
      this.effects.push({ kind: 'ring', x: x, y: y, r: r, color: color, life: 0.45, maxLife: 0.45 });
    },

    addFloatText: function (x, y, text, color, big) {
      // Zu viele Zahlen gleichzeitig überfrachten das Bild
      if (this.texts.length > 40) this.texts.shift();
      this.texts.push(new TD.FloatText(x, y, text, color, big));
    },

    /* =====================================================
       Steuerung
       ===================================================== */
    togglePause: function () {
      if (this.state !== 'playing') return;
      this.paused = !this.paused;
      TD.audio.duckMusic(this.paused);      // in der Pause nur leiser, nicht aus
      TD.ui.refreshControls();
      return this.paused;
    },

    cycleSpeed: function () {
      this.speedIndex = (this.speedIndex + 1) % TD.SPEEDS.length;
      TD.ui.refreshControls();
      return TD.SPEEDS[this.speedIndex];
    },

    lose: function () {
      if (this.state !== 'playing') return;
      this.state = 'gameover';
      TD.audio.stopMusic();
      TD.audio.gameOver();
      this.finish(false);
    },

    win: function () {
      if (this.state !== 'playing') return;
      this.state = 'victory';
      this.score += this.lives * 120;   // Bonus für übrige Leben
      TD.audio.stopMusic();
      TD.audio.victory();
      this.finish(true);
    },

    finish: function (won) {
      // Gesamtzahlen über alle Partien fortschreiben
      TD.progress.addStats({
        games: 1, wins: won ? 1 : 0,
        kills: this.stats.kills, waves: this.waveNumber,
        chests: this.lootStats.opened, correct: this.lootStats.correct,
        playSeconds: Math.round((Date.now() - this.stats.startedAt) / 1000)
      });

      /* Feldzug: Sterne vergeben und Fortschritt sichern */
      if (this.campaign) {
        var stars = won ? TD.campaign.starsFor(this.lives, this.maxLives) : 0;
        if (won) {
          // Bonus für unversehrte Basis und gute Truhenquote
          this.score += this.lives * 90;
          if (this.lootStats.opened) {
            this.score += Math.round(this.lootStats.correct / this.lootStats.opened * 400);
          }
        }
        var res = TD.campaign.saveResult(this.factionKey, this.campaign.n,
                                         this.score, stars, won);
        this.lastResult = { won: won, record: res.isRecord, stars: stars, prevBest: res.prev };
        TD.ui.showCampaignResult(won, stars, res);
        return;
      }

      var key = this.mapDef.id + '.' + this.diff.key;
      var best = U.store.get('best', {});
      var prev = best[key] || { wave: 0, score: 0 };
      var isRecord = this.score > prev.score;

      if (isRecord) {
        best[key] = { wave: this.waveNumber, score: this.score, at: Date.now() };
        U.store.set('best', best);
      }
      this.lastResult = { won: won, record: isRecord, prevBest: prev };
      TD.ui.showResult(won, isRecord, prev);
    },

    /** @param {function} [back] Ansicht, die statt des Hauptmenüs erscheinen soll */
    quitToMenu: function (back) {
      this.state = 'menu';
      this.campaign = null;
      // Spiel-Bedienelemente zurücksetzen, sonst bleiben sie hinter dem Menü stehen
      this.selected = null;
      this.buildKey = null;
      this.hoverCell = null;
      this.paused = false;
      this.lootboxes = [];
      this.pendingQuiz = null;
      TD.audio.stopMusic();
      TD.ui.refreshTowerPanel();
      TD.ui.refreshShop();
      if (back) back(); else TD.ui.showMenu();
    },

    /* =====================================================
       Eingabe (Maus, Touch, Stift – über Pointer Events)
       ===================================================== */
    /** Bildschirmkoordinaten in Spielfeldkoordinaten umrechnen. */
    toLogical: function (clientX, clientY) {
      var r = this.canvas.getBoundingClientRect();
      return {
        x: (clientX - r.left) / r.width * W,
        y: (clientY - r.top) / r.height * CH - PAD
      };
    },

    cellFrom: function (pt) {
      var cx = Math.floor(pt.x / CELL), cy = Math.floor(pt.y / CELL);
      if (cx < 0 || cy < 0 || cx >= COLS || cy >= ROWS) return null;
      return { cx: cx, cy: cy };
    },

    bindInput: function () {
      var self = this;
      var c = this.canvas;
      var dragging = false;
      var downCell = null;

      function onDown(ev) {
        if (self.state !== 'playing') return;
        // Nur die linke Taste baut – rechts ist zum Abbrechen da
        if (ev.button != null && ev.button !== 0) return;
        TD.audio.unlock();
        ev.preventDefault();
        dragging = true;
        var pt = self.toLogical(ev.clientX, ev.clientY);
        downCell = self.cellFrom(pt);
        self.hoverCell = downCell;
        if (c.setPointerCapture && ev.pointerId != null) {
          try { c.setPointerCapture(ev.pointerId); } catch (e) {}
        }
      }

      function onMove(ev) {
        if (self.state !== 'playing') return;
        var pt = self.toLogical(ev.clientX, ev.clientY);
        var cell = self.cellFrom(pt);
        // Maus: immer anzeigen. Touch: nur während der Berührung.
        if (ev.pointerType === 'mouse' || dragging) self.hoverCell = cell;
      }

      function onUp(ev) {
        if (self.state !== 'playing') { dragging = false; return; }
        if (ev.button != null && ev.button !== 0) return;
        if (!dragging) return;
        dragging = false;

        var pt = self.toLogical(ev.clientX, ev.clientY);
        var cell = self.cellFrom(pt);
        if (!cell) { self.hoverCell = null; return; }

        // Truhen haben Vorrang vor allem anderen
        for (var b = self.lootboxes.length - 1; b >= 0; b--) {
          if (self.lootboxes[b].hitTest(pt.x, pt.y)) {
            self.openLootbox(self.lootboxes[b]);
            return;
          }
        }

        // Pause per Tippen aufs Feld beenden
        if (self.paused) { self.togglePause(); return; }

        if (self.buildKey) {
          /* Steht dort schon ein Turm, ist der Klick als Auswahl gemeint –
             eine Fehlermeldung wäre hier nur im Weg. */
          var occupied = self.towerAt(cell.cx, cell.cy);
          if (occupied) {
            TD.audio.click();
            self.buildKey = null;
            self.selectTower(occupied);
            return;
          }

          var placed = self.placeTower(self.buildKey, cell.cx, cell.cy);
          // Bei gedrückter Umschalttaste weiterbauen, sonst Modus beenden
          if (placed) {
            // Die Hauptfigur gibt es nur einmal – danach Baumodus beenden
            if (self.buildKey === 'hero' ||
                self.gold < TD.towerDef(self.factionKey, self.buildKey).cost) {
              self.buildKey = null;
              TD.ui.refreshShop();
            }
          }
          if (ev.pointerType !== 'mouse') self.hoverCell = null;
          return;
        }

        var t = self.towerAt(cell.cx, cell.cy);
        if (t) {
          TD.audio.click();
          self.selectTower(t);
        } else if (self.selected) {
          self.selected = null;
          TD.ui.refreshTowerPanel();
        }
      }

      function onLeave() {
        if (!dragging) self.hoverCell = null;
      }

      if (global.PointerEvent) {
        c.addEventListener('pointerdown', onDown);
        c.addEventListener('pointermove', onMove);
        c.addEventListener('pointerup', onUp);
        c.addEventListener('pointercancel', function () { dragging = false; self.hoverCell = null; });
        c.addEventListener('pointerleave', onLeave);
      } else {
        // Rückfallebene für sehr alte Browser
        c.addEventListener('mousedown', function (e) { e.pointerType = 'mouse'; onDown(e); });
        c.addEventListener('mousemove', function (e) { e.pointerType = 'mouse'; onMove(e); });
        c.addEventListener('mouseup',   function (e) { e.pointerType = 'mouse'; onUp(e); });
        c.addEventListener('mouseleave', onLeave);
        c.addEventListener('touchstart', function (e) {
          var t0 = e.touches[0]; onDown({ clientX: t0.clientX, clientY: t0.clientY, preventDefault: function () { e.preventDefault(); }, pointerType: 'touch' });
        }, { passive: false });
        c.addEventListener('touchmove', function (e) {
          var t0 = e.touches[0]; onMove({ clientX: t0.clientX, clientY: t0.clientY, pointerType: 'touch' });
        }, { passive: false });
        c.addEventListener('touchend', function (e) {
          var t0 = e.changedTouches[0]; onUp({ clientX: t0.clientX, clientY: t0.clientY, pointerType: 'touch' });
        });
      }

      /* Rechtsklick führt immer zurück in den Übersichtsmodus:
         Baumodus verlassen und Turmauswahl aufheben. Das erspart den
         Umweg über den Turm oder ein leeres Feld. */
      c.addEventListener('contextmenu', function (ev) {
        ev.preventDefault();
        if (self.state !== 'playing') return;
        var changed = false;
        if (self.buildKey) { self.buildKey = null; changed = true; }
        if (self.selected) { self.selected = null; changed = true; }
        self.hoverCell = null;
        if (changed) {
          TD.audio.click();
          TD.ui.refreshShop();
          TD.ui.refreshTowerPanel();
        }
      });

      // Tastatur
      global.addEventListener('keydown', function (ev) {
        if (ev.target && /input|textarea/i.test(ev.target.tagName)) return;
        var k = ev.key;

        if (k === 'Escape') {
          if (self.buildKey) self.setBuildKey(null);
          else if (self.selected) { self.selected = null; TD.ui.refreshTowerPanel(); }
          else if (self.state === 'playing') TD.ui.showPauseMenu();
          return;
        }
        if (self.state !== 'playing') return;

        if (k === ' ') { ev.preventDefault(); self.togglePause(); return; }
        if (k === 'f' || k === 'F') { self.cycleSpeed(); return; }
        if (k === 'm' || k === 'M') { TD.ui.toggleSound(); return; }
        if (k === 'n' || k === 'N') { self.startWave(true); return; }
        if ((k === 'u' || k === 'U') && self.selected) { self.upgradeSelected(); return; }
        if ((k === 'v' || k === 'V') && self.selected) { self.sellSelected(); return; }

        if (k === 'h' || k === 'H') {
          if (!self.heroAvailable || self.hero) { TD.audio.error(); return; }
          self.setBuildKey('hero');
          TD.audio.click();
          return;
        }

        for (var i = 0; i < TD.ROLE_ORDER.length; i++) {
          var role = TD.ROLE_ORDER[i];
          if (k === TD.ROLE_BASE[role].hotkey) {
            if (!self.isUnlocked(role)) { TD.audio.error(); TD.ui.toast('Noch nicht freigeschaltet', 'bad'); return; }
            self.setBuildKey(role);
            TD.audio.click();
            return;
          }
        }
      });
    }
  };
})(window);
