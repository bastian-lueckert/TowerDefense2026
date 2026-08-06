/* =========================================================
   game.js – Spielzustand, Schleife, Regeln, Eingabe
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;
  var CELL = TD.GRID.CELL, COLS = TD.GRID.COLS, ROWS = TD.GRID.ROWS;
  var W = COLS * CELL, H = ROWS * CELL;

  var G = TD.game = {

    /* ---------------- Zustand ---------------- */
    state: 'menu',          // menu | playing | gameover | victory
    paused: false,
    speedIndex: 0,
    time: 0,

    canvas: null, ctx: null, dpr: 1,

    map: null, mapDef: null, diff: null,
    lives: 20, maxLives: 20, gold: 0, score: 0,

    towers: [], enemies: [], projectiles: [], particles: [], effects: [], texts: [],

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
      if (dpr === this.dpr && this.canvas.width === W * dpr) return;
      this.dpr = dpr;
      this.canvas.width = Math.round(W * dpr);
      this.canvas.height = Math.round(H * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = true;
    },

    /* =====================================================
       Spielstart
       ===================================================== */
    start: function (mapId, diffKey) {
      this.mapDef = TD.maps.byId(mapId);
      this.map = TD.maps.build(this.mapDef);
      this.diff = TD.DIFFICULTIES[diffKey] || TD.DIFFICULTIES.normal;

      this.lives = this.maxLives = this.diff.lives;
      this.gold = this.diff.gold;
      this.score = 0;
      this.time = 0;

      this.towers = []; this.enemies = []; this.projectiles = [];
      this.particles = []; this.effects = []; this.texts = [];

      this.waveNumber = 0;
      this.nextWave = 1;
      this.breakTimer = 6;          // kurze Vorbereitungszeit
      this.activeSpawns = [];
      this.waveRunning = false;

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
      TD.audio.startMusic();
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
          this.enemies.push(new TD.Enemy(this, s.type, s.waveN));
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
      var wave = TD.waves.generate(n, this.diff.key);

      wave.groups.forEach(function (grp) {
        this.activeSpawns.push({
          type: grp.type, remaining: grp.count,
          gap: grp.gap, timer: grp.delay, waveN: n
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
        return TD.waves.generate(n, this.diff.key).groups.some(function (g) { return g.type === 'flyer'; });
      }.bind(this);
      this.airWarning = hasFlyer(this.waveNumber) || hasFlyer(this.nextWave);
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

    placeTower: function (key, cx, cy) {
      var def = TD.TOWERS[key];
      if (!def) return false;
      if (!this.canPlaceAt(cx, cy)) { TD.audio.error(); TD.ui.toast('Hier kann nicht gebaut werden', 'bad'); return false; }
      if (this.gold < def.cost)     { TD.audio.error(); TD.ui.toast('Nicht genug Gold', 'bad'); return false; }

      this.spendGold(def.cost);
      var t = new TD.Tower(this, key, cx, cy);
      this.towers.push(t);
      this.stats.built++;

      TD.audio.place();
      this.addRing(t.x, t.y, CELL * 0.9, def.color);
      this.addSparks(t.x, t.y, def.color, 10);
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
      this.effects.push({ kind: 'explosion', x: x, y: y, r: r, color: color, life: 0.4, maxLife: 0.4 });
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

    quitToMenu: function () {
      this.state = 'menu';
      TD.audio.stopMusic();
      TD.ui.showMenu();
    },

    /* =====================================================
       Eingabe (Maus, Touch, Stift – über Pointer Events)
       ===================================================== */
    toLogical: function (clientX, clientY) {
      var r = this.canvas.getBoundingClientRect();
      return {
        x: (clientX - r.left) / r.width * W,
        y: (clientY - r.top) / r.height * H
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
        if (!dragging) return;
        dragging = false;

        var pt = self.toLogical(ev.clientX, ev.clientY);
        var cell = self.cellFrom(pt);
        if (!cell) { self.hoverCell = null; return; }

        // Pause per Tippen aufs Feld beenden
        if (self.paused) { self.togglePause(); return; }

        if (self.buildKey) {
          var placed = self.placeTower(self.buildKey, cell.cx, cell.cy);
          // Bei gedrückter Umschalttaste weiterbauen, sonst Modus beenden
          if (placed && !ev.shiftKey) {
            // Weiterbauen erlauben, solange Gold reicht – bequemer auf dem Handy
            if (self.gold < TD.TOWERS[self.buildKey].cost) {
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

      // Kontextmenü auf dem Spielfeld unterdrücken (Rechtsklick bricht Bau ab)
      c.addEventListener('contextmenu', function (ev) {
        ev.preventDefault();
        if (self.buildKey) { self.setBuildKey(null); }
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

        for (var i = 0; i < TD.TOWER_ORDER.length; i++) {
          if (k === TD.TOWERS[TD.TOWER_ORDER[i]].hotkey) {
            self.setBuildKey(TD.TOWER_ORDER[i]);
            TD.audio.click();
            return;
          }
        }
      });
    }
  };
})(window);
