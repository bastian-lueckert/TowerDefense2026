/* =========================================================
   entities.js – Gegner, Türme, Geschosse, Effekte
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;
  var CELL = TD.GRID.CELL;
  var SPEED_SCALE = TD.GRID.SPEED_SCALE || 1;

  /* =======================================================
     GEGNER
     ======================================================= */
  /**
   * @param {number} [pathIndex] Weg, auf dem der Gegner anrückt
   */
  function Enemy(game, type, waveN, pathIndex) {
    var def = TD.enemyDef(game.factionKey, type);   // Aussehen je nach Mythologie
    var st = TD.waves.statsFor(type, waveN, game.diff);
    this.pathIndex = pathIndex || 0;
    if (this.pathIndex >= game.map.paths.length) this.pathIndex = 0;

    this.game = game;
    this.def = def;
    this.type = type;
    this.maxHp = st.hp;
    this.hp = st.hp;
    this.gold = st.gold;
    this.score = st.score;
    this.armor = def.boss || def.armor > 0 ? st.armor : 0;
    // Pixel/s – auf kleinerem Raster entsprechend langsamer, damit die
    // Laufzeit über den kürzeren Weg dieselbe bleibt (siehe config.js).
    this.baseSpeed = def.speed * CELL * SPEED_SCALE;
    this.r = def.r;
    this.flying = !!def.flying;

    this.dist = 0;
    this.alive = true;
    this.leaked = false;

    // Effekte
    this.slowAmt = 0; this.slowT = 0;
    this.poisonDps = 0; this.poisonT = 0; this.poisonAcc = 0;
    this.hitFlash = 0;
    this.healPulse = 0;

    // Fliegende Gegner nehmen die Luftlinie. Damit sie nicht je nach
    // Wegführung unfair schnell am Ziel sind, wird ihr Tempo im gleichen
    // Verhältnis gekürzt, in dem ihre Strecke kürzer ist als der Weg.
    var myPath = game.map.paths[this.pathIndex];
    if (this.flying) {
      var pp = myPath.points;
      var a = pp[0], b = pp[pp.length - 1];
      this.airFrom = a; this.airTo = b;
      this.pathLen = U.dist(a.x, a.y, b.x, b.y);
      this.baseSpeed *= this.pathLen / myPath.length;
    } else {
      this.pathLen = myPath.length;
    }

    // Leichte Streuung, damit Gegner nicht exakt übereinander laufen
    this.offset = U.rand(-CELL * 0.16, CELL * 0.16);
    this.wobble = U.rand(0, U.TAU);

    var p = this.posAt(0);
    this.x = p.x; this.y = p.y; this.angle = p.angle;
  }

  Enemy.prototype.posAt = function (d) {
    if (this.flying) {
      var t = this.pathLen === 0 ? 1 : U.clamp(d / this.pathLen, 0, 1);
      var ang = Math.atan2(this.airTo.y - this.airFrom.y, this.airTo.x - this.airFrom.x);
      return {
        x: U.lerp(this.airFrom.x, this.airTo.x, t),
        y: U.lerp(this.airFrom.y, this.airTo.y, t),
        angle: ang
      };
    }
    return TD.maps.pointAt(this.game.map, this.pathIndex, d);
  };

  Enemy.prototype.progress = function () {
    return this.pathLen === 0 ? 1 : this.dist / this.pathLen;
  };

  Enemy.prototype.speed = function () {
    return this.baseSpeed * (1 - this.slowAmt);
  };

  Enemy.prototype.update = function (dt) {
    if (!this.alive) return;

    if (this.hitFlash > 0) this.hitFlash -= dt * 4;
    if (this.healPulse > 0) this.healPulse -= dt * 2;

    // Verlangsamung abklingen lassen
    if (this.slowT > 0) {
      this.slowT -= dt;
      if (this.slowT <= 0) { this.slowT = 0; this.slowAmt = 0; }
    }

    // Gift wirkt über Zeit
    if (this.poisonT > 0) {
      this.poisonT -= dt;
      this.poisonAcc += this.poisonDps * dt;
      if (this.poisonAcc >= 1) {
        var tick = Math.floor(this.poisonAcc);
        this.poisonAcc -= tick;
        this.applyDamage(tick, { source: 'poison', pierceArmor: true });
      }
      if (this.poisonT <= 0) { this.poisonT = 0; this.poisonDps = 0; }
      if (!this.alive) return;
    }

    // Heiler unterstützen ihre Umgebung
    if (this.def.heal) {
      var list = this.game.enemies, rr = this.def.healRange * CELL;
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        if (e === this || !e.alive || e.hp >= e.maxHp) continue;
        if (U.dist2(this.x, this.y, e.x, e.y) <= rr * rr) {
          e.hp = Math.min(e.maxHp, e.hp + this.def.heal * dt);
          e.healPulse = 1;
        }
      }
    }

    // Bewegung
    this.dist += this.speed() * dt;
    this.wobble += dt * 6;

    if (this.dist >= this.pathLen) {
      this.alive = false;
      this.leaked = true;
      return;
    }

    var p = this.posAt(this.dist);
    // Seitlicher Versatz senkrecht zur Laufrichtung
    var nx = Math.cos(p.angle + Math.PI / 2), ny = Math.sin(p.angle + Math.PI / 2);
    this.x = p.x + nx * this.offset;
    this.y = p.y + ny * this.offset;
    this.angle = p.angle;
  };

  /**
   * Schaden zufügen.
   * @param {number} amount
   * @param {{pierceArmor?:boolean, crit?:boolean, source?:string}} opts
   */
  Enemy.prototype.applyDamage = function (amount, opts) {
    if (!this.alive) return 0;
    opts = opts || {};

    var dmg = amount;

    /* Erster Schlag: Manche Völker treffen am härtesten, solange der
       Gegner noch unverletzt ist. */
    if (opts.tower && opts.tower.def.firstStrike > 1 && this.hp >= this.maxHp) {
      dmg *= opts.tower.def.firstStrike;
    }

    // Panzerung zieht flach ab, lässt aber immer ein Viertel durch –
    // sonst wären schnellfeuernde Türme gegen Panzer völlig wirkungslos.
    if (!opts.pierceArmor && this.armor) dmg = Math.max(amount * 0.25, amount - this.armor);
    if (this.def.shield) dmg *= (1 - this.def.shield);
    dmg = Math.max(1, dmg);

    this.hp -= dmg;
    this.hitFlash = 1;

    if (opts.source !== 'poison') {
      this.game.stats.damage += dmg;
    }

    if (this.hp <= 0) {
      this.alive = false;
      this.game.onEnemyKilled(this, opts);
    }
    return dmg;
  };

  Enemy.prototype.applySlow = function (amount, dur) {
    // Stapelt nicht – der stärkere Effekt gewinnt
    if (amount >= this.slowAmt) { this.slowAmt = Math.min(0.85, amount); this.slowT = Math.max(this.slowT, dur); }
    else this.slowT = Math.max(this.slowT, dur * 0.5);
  };

  Enemy.prototype.applyPoison = function (dps, dur) {
    if (dps >= this.poisonDps) { this.poisonDps = dps; this.poisonT = Math.max(this.poisonT, dur); }
    else this.poisonT = Math.max(this.poisonT, dur * 0.5);
  };

  /* =======================================================
     TURM
     ======================================================= */
  function Tower(game, role, cx, cy) {
    this.game = game;
    this.key = role;
    this.role = role;
    this.def = TD.towerDef(game.factionKey, role);
    this.cx = cx; this.cy = cy;
    this.x = (cx + 0.5) * CELL;
    this.y = (cy + 0.5) * CELL;

    // Besonderes Feld unter dem Turm: Werte werden in stat() verrechnet
    this.special = TD.maps.specialAt(game.map, cx, cy);
    this.mods = this.special ? (this.special.mods[role] || this.special.mods.all) : null;

    this.level = 1;
    this.invested = this.def.cost;
    this.cooldown = 0;
    this.angle = -Math.PI / 2;
    this.targetMode = 'first';
    this.target = null;
    this.recoil = 0;
    this.buildAnim = 1;
    this.kills = 0;
    this.damageDealt = 0;
    this.chargeGlow = 0;

    /* Held: Fähigkeit lädt sich auf und geht von allein los,
       sobald sich der Einsatz lohnt. */
    this.isHero = !!this.def.hero;
    if (this.isHero) {
      this.power = this.def.power;
      /* Nach der Wende ihrer Geschichte kämpft die Hauptfigur
         entschlossener: härtere Schläge, kürzere Verschnaufpausen. */
      this.awakened = !!(game.campaign && game.campaign.heroAwakened);
      this.powerTimer = this.power
        ? this.power.cooldown * (this.awakened ? 0.4 : 0.55) : 0;
      this.powerFlash = 0;
      this.powerUses = 0;
    }
  }

  /** Aktueller Wert inkl. Ausbaustufe und Feldeffekt. */
  Tower.prototype.stat = function (name) {
    var d = this.def;
    var base = d[name];
    if (base == null) return null;
    var inc = (d.upg && d.upg[name]) || 0;
    var v = base + inc * (this.level - 1);

    var m = this.mods;
    if (m) {
      if (name === 'chain') {
        if (m.chain) v += m.chain;              // Kettenziele kommen hinzu
      } else if (m[name] != null) {
        v *= m[name];
      } else if (m.status && TD.STATUS_STATS.indexOf(name) >= 0) {
        v *= m.status;                          // Sammelbonus auf Statuseffekte
      }
    }

    // Gewandelte Hauptfigur schlägt härter und schneller
    if (this.isHero && this.awakened && (name === 'damage' || name === 'rate')) {
      v *= (name === 'damage' ? 1.3 : 1.15);
    }

    // Steht ein Held in der Nähe, führt er die umliegenden Türme an
    if (!this.isHero && (name === 'damage' || name === 'rate')) {
      var aura = this.game.heroAura;
      if (aura && aura[name]) {
        var h = this.game.hero;
        if (h && U.dist2(this.x, this.y, h.x, h.y) <= HERO_AURA_R * HERO_AURA_R) {
          v *= aura[name];
        }
      }
    }
    return v;
  };

  /** Wirkungskreis der Heldenaura. */
  var HERO_AURA_R = CELL * 3.2;
  TD.HERO_AURA_R = HERO_AURA_R;

  /** Wirkt das Feld auf diesen Turm – und wie? (für die Anzeige) */
  Tower.prototype.fieldEffect = function () {
    if (!this.special || !this.mods) return null;
    var parts = [], m = this.mods;
    var LABEL = { range: 'Reichweite', damage: 'Schaden', rate: 'Tempo', status: 'Wirkung' };
    Object.keys(m).forEach(function (k) {
      if (k === 'chain') { parts.push('+' + m.chain + ' Kettenziele'); return; }
      var pct = Math.round((m[k] - 1) * 100);
      if (pct !== 0) parts.push((pct > 0 ? '+' : '') + pct + ' % ' + (LABEL[k] || k));
    });
    return { tile: this.special, text: parts.join(' · '), good: parts.length > 0 };
  };

  Tower.prototype.rangePx = function () { return this.stat('range') * CELL; };

  Tower.prototype.canUpgrade = function () {
    return this.level < 4;
  };

  Tower.prototype.upgradeCost = function () {
    return this.canUpgrade() ? this.def.upgradeCost[this.level - 1] : 0;
  };

  Tower.prototype.sellValue = function () {
    return Math.floor(this.invested * TD.SELL_RATIO);
  };

  Tower.prototype.upgrade = function () {
    if (!this.canUpgrade()) return false;
    var cost = this.upgradeCost();
    if (this.game.gold < cost) return false;
    this.game.spendGold(cost);
    this.invested += cost;
    this.level++;
    this.buildAnim = 1;
    return true;
  };

  Tower.prototype.update = function (dt) {
    if (this.buildAnim > 0) this.buildAnim = Math.max(0, this.buildAnim - dt * 2.5);
    if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 6);
    if (this.chargeGlow > 0) this.chargeGlow = Math.max(0, this.chargeGlow - dt * 3);

    if (this.isHero) {
      if (this.powerFlash > 0) this.powerFlash = Math.max(0, this.powerFlash - dt * 2);
      if (this.power) {
        this.powerTimer -= dt;
        if (this.powerTimer <= 0 && this.shouldUsePower()) this.usePower();
      }
    }

    this.cooldown -= dt;

    // Ziel prüfen / neu suchen
    if (this.target && (!this.target.alive || !this.inRange(this.target))) this.target = null;
    if (!this.target) this.target = this.findTarget();

    if (this.target) {
      var want = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      this.angle = U.angleApproach(this.angle, want, dt * 9);

      if (this.cooldown <= 0) {
        // Erst schießen, wenn der Turm halbwegs ausgerichtet ist
        var diff = Math.abs(((want - this.angle + Math.PI) % U.TAU) - Math.PI);
        if (diff < 0.35) {
          this.fire(this.target);
          this.cooldown = 1 / this.stat('rate');
        }
      }
    }
  };

  Tower.prototype.inRange = function (e) {
    var r = this.rangePx() + e.r;
    return U.dist2(this.x, this.y, e.x, e.y) <= r * r;
  };

  Tower.prototype.canHit = function (e) {
    return !(e.flying && !this.def.air);
  };

  Tower.prototype.findTarget = function () {
    var list = this.game.enemies, best = null, bestVal = -Infinity;
    var rr = this.rangePx();

    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e.alive || !this.canHit(e)) continue;
      var d2 = U.dist2(this.x, this.y, e.x, e.y);
      var reach = rr + e.r;
      if (d2 > reach * reach) continue;

      var val;
      switch (this.targetMode) {
        case 'last':   val = -e.progress(); break;
        case 'strong': val = e.hp; break;
        case 'close':  val = -d2; break;
        default:       val = e.progress(); break;   // 'first'
      }
      if (val > bestVal) { bestVal = val; best = e; }
    }
    return best;
  };

  Tower.prototype.fire = function (target) {
    var g = this.game;
    var dmg = this.stat('damage');
    var d = this.def;

    this.recoil = 1;
    this.chargeGlow = 1;
    g.stats.shots++;
    TD.audio.shoot(this.key);

    // Mündungsfeuer
    var mx = this.x + Math.cos(this.angle) * CELL * 0.32;
    var my = this.y + Math.sin(this.angle) * CELL * 0.32;
    g.addMuzzle(mx, my, this.angle, d.color, this.key === 'cannon' ? 1.6 : 1);

    switch (d.projectile) {

      case 'beam': {   // Tesla: sofortiger Kettenblitz
        var chain = Math.round(this.stat('chain'));
        var falloff = d.chainFalloff;
        var chainR = this.stat('chainRange') * CELL;
        var hit = [], cur = target, from = { x: this.x, y: this.y };
        var pts = [from];

        for (var c = 0; c < chain && cur; c++) {
          pts.push({ x: cur.x, y: cur.y });
          var dealt = cur.applyDamage(dmg * Math.pow(falloff, c), { tower: this });
          this.damageDealt += dealt;
          hit.push(cur);
          cur = this.nextChainTarget(cur, hit, chainR);
        }
        g.addLightning(pts, d.color);
        break;
      }

      case 'rail': {   // Scharfschütze: sofortiger Treffer
        var isCrit = Math.random() < this.stat('crit');
        var total = dmg * (isCrit ? d.critMul : 1);
        var dealt2 = target.applyDamage(total, { pierceArmor: true, crit: isCrit, tower: this });
        this.damageDealt += dealt2;
        g.addBeam(this.x, this.y, target.x, target.y, d.color, isCrit);
        g.addFloatText(target.x, target.y - target.r, Math.round(dealt2), isCrit ? '#ffe066' : '#ffffff', isCrit);
        break;
      }

      default:         // Fliegende Geschosse
        g.projectiles.push(new Projectile(g, this, target));
        break;
    }
  };

  /* =======================================================
     Heldenfähigkeiten
     ======================================================= */

  /** Lohnt sich der Einsatz gerade? */
  Tower.prototype.shouldUsePower = function () {
    var p = this.power;
    if (!p) return false;
    var r = (p.radius ? p.radius * CELL : this.rangePx());
    var list = this.game.enemies, n = 0;

    /* Je länger die Fähigkeit schon bereitsteht, desto weniger Ziele
       muss sie abwarten – sonst bliebe sie in dünnen Wellen ungenutzt. */
    var need = p.minTargets || 3;
    var overdue = -this.powerTimer;
    if (overdue > 4) need = Math.max(2, need - 1);
    if (overdue > 9) need = 1;

    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e.alive) continue;
      if (U.dist2(this.x, this.y, e.x, e.y) <= r * r) n++;
      if (n >= need) return true;
    }
    // Ein Endgegner allein rechtfertigt den Einsatz ebenfalls
    for (var b = 0; b < list.length; b++) {
      if (list[b].alive && list[b].def.boss &&
          U.dist2(this.x, this.y, list[b].x, list[b].y) <= r * r) return true;
    }
    return false;
  };

  Tower.prototype.usePower = function () {
    var p = this.power, g = this.game;
    if (!p) return;

    this.powerTimer = p.cooldown * (this.awakened ? 0.75 : 1);
    this.powerFlash = 1;
    this.powerUses++;
    var dmg = this.stat('damage') * p.damage;

    switch (p.key) {

      /* Pfeilhagel: Bombardement dort, wo es am dichtesten steht */
      case 'arrowStorm': {
        var spot = this.densestSpot(p.radius * CELL);
        if (!spot) return;
        g.addArrowStorm(spot.x, spot.y, p.radius * CELL, p.color, dmg, this);
        TD.audio.heroPower('arrowStorm');
        break;
      }

      /* Kriegsruf: Druckwelle, die zurückwirft und lähmt */
      case 'warCry': {
        var rr = p.radius * CELL;
        var hit = 0;
        g.enemies.forEach(function (e) {
          if (!e.alive) return;
          var d = U.dist(this.x, this.y, e.x, e.y);
          if (d > rr) return;
          hit++;
          var dealt = e.applyDamage(dmg, { pierceArmor: true, tower: this });
          this.damageDealt += dealt;
          e.applySlow(p.slow, p.slowDur);
          // Zurückwerfen: ein Stück den Weg zurück
          e.dist = Math.max(0, e.dist - p.knockback);
        }, this);
        g.addShockwave(this.x, this.y, rr, p.color);
        if (hit) g.addFloatText(this.x, this.y - CELL * 0.7, p.name + '!', p.color, true);
        TD.audio.heroPower('warCry');
        break;
      }

      /* Salve: ein Bolzen auf jedes Ziel in Reichweite */
      case 'volley': {
        var rv = p.radius * CELL, shots = 0;
        var self = this;
        g.enemies.forEach(function (e) {
          if (!e.alive || shots >= (p.maxTargets || 8)) return;
          if (U.dist2(self.x, self.y, e.x, e.y) > rv * rv) return;
          shots++;
          var dealt = e.applyDamage(dmg, { pierceArmor: true, tower: self });
          self.damageDealt += dealt;
          g.addBeam(self.x, self.y, e.x, e.y, p.color, false);
          g.addSparks(e.x, e.y, p.color, 5);
        });
        if (shots) g.addFloatText(this.x, this.y - CELL * 0.7, p.name + ' ×' + shots, p.color, true);
        TD.audio.heroPower('volley');
        break;
      }

      /* Sanren-giri: drei Rundumschläge, jede Wunde blutet nach */
      case 'threeCuts': {
        g.addSpinCuts(this.x, this.y, p.radius * CELL, p.color,
                      dmg, this, p.cuts || 3, p.poison, p.poisonDur);
        TD.audio.heroPower('threeCuts');
        break;
      }

      /* Sonnenstrahl: trifft alles auf einer Linie */
      case 'sunbeam': {
        var len = this.rangePx() * 1.5;
        var ex = this.x + Math.cos(this.angle) * len;
        var ey = this.y + Math.sin(this.angle) * len;
        var half = (p.width || 30) / 2, count = 0;

        g.enemies.forEach(function (e) {
          if (!e.alive) return;
          if (pointToSegment(e.x, e.y, this.x, this.y, ex, ey) > half + e.r) return;
          count++;
          var dealt = e.applyDamage(dmg, { pierceArmor: true, tower: this });
          this.damageDealt += dealt;
          if (p.poison) e.applyPoison(p.poison, p.poisonDur);
        }, this);

        g.addSunbeam(this.x, this.y, ex, ey, p.width || 30, p.color);
        if (count) g.addFloatText(this.x, this.y - CELL * 0.7, p.name + '!', p.color, true);
        TD.audio.heroPower('sunbeam');
        break;
      }
    }
  };

  /** Punkt mit den meisten Gegnern im Umkreis – Ziel für Flächenangriffe. */
  Tower.prototype.densestSpot = function (radius) {
    var list = this.game.enemies, reach = this.rangePx();
    var best = null, bestN = 0;

    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c.alive) continue;
      if (U.dist2(this.x, this.y, c.x, c.y) > reach * reach) continue;
      var n = 0;
      for (var j = 0; j < list.length; j++) {
        if (list[j].alive && U.dist2(c.x, c.y, list[j].x, list[j].y) <= radius * radius) n++;
      }
      if (n > bestN) { bestN = n; best = c; }
    }
    return best ? { x: best.x, y: best.y } : null;
  };

  function pointToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var l2 = dx * dx + dy * dy;
    var t = l2 ? U.clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
    return U.dist(px, py, ax + dx * t, ay + dy * t);
  }

  Tower.prototype.nextChainTarget = function (from, exclude, range) {
    var list = this.game.enemies, best = null, bestD = Infinity;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e.alive || exclude.indexOf(e) >= 0 || !this.canHit(e)) continue;
      var d2 = U.dist2(from.x, from.y, e.x, e.y);
      if (d2 <= range * range && d2 < bestD) { bestD = d2; best = e; }
    }
    return best;
  };

  /* =======================================================
     GESCHOSS
     ======================================================= */
  function Projectile(game, tower, target) {
    this.game = game;
    this.tower = tower;
    this.def = tower.def;
    this.kind = tower.def.projectile;
    this.color = tower.def.color;

    this.x = tower.x + Math.cos(tower.angle) * CELL * 0.3;
    this.y = tower.y + Math.sin(tower.angle) * CELL * 0.3;
    this.speed = tower.def.speed * CELL;
    this.damage = tower.stat('damage');
    this.splash = tower.stat('splash');
    this.dead = false;
    this.life = 3;
    this.trail = [];

    this.target = target;
    // Vorhalten: dorthin zielen, wo das Ziel voraussichtlich sein wird
    var d = U.dist(this.x, this.y, target.x, target.y);
    var t = d / this.speed;
    var lead = target.posAt(Math.min(target.dist + target.speed() * t, target.pathLen));
    this.tx = lead.x; this.ty = lead.y;

    // Granaten fliegen im Bogen
    this.arc = (this.kind === 'shell' || this.kind === 'blob');
    this.startX = this.x; this.startY = this.y;
    this.travel = 0;
    this.totalDist = Math.max(1, U.dist(this.x, this.y, this.tx, this.ty));
    this.angle = Math.atan2(this.ty - this.y, this.tx - this.x);
    this.spin = 0;
  }

  Projectile.prototype.update = function (dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.spin += dt * 12;

    if (this.arc) {
      // Fester Zielpunkt, parabolische Flughöhe
      this.travel += this.speed * dt;
      var t = U.clamp(this.travel / this.totalDist, 0, 1);
      this.x = U.lerp(this.startX, this.tx, t);
      this.y = U.lerp(this.startY, this.ty, t);
      this.height = Math.sin(t * Math.PI) * this.totalDist * 0.16;
      if (t >= 1) { this.explode(); return; }
    } else {
      // Verfolgt das Ziel, solange es lebt
      if (this.target && this.target.alive) { this.tx = this.target.x; this.ty = this.target.y; }
      var dx = this.tx - this.x, dy = this.ty - this.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      this.angle = Math.atan2(dy, dx);
      var step = this.speed * dt;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 5) this.trail.shift();

      if (step >= dist) {
        this.x = this.tx; this.y = this.ty;
        this.explode();
        return;
      }
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  };

  Projectile.prototype.explode = function () {
    if (this.dead) return;
    this.dead = true;
    var g = this.game, d = this.def, self = this;

    if (this.splash) {
      var r = this.splash * CELL;
      var list = g.enemies, anyHit = false;

      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        if (!e.alive || (e.flying && !d.air)) continue;
        var dd = U.dist(this.x, this.y, e.x, e.y);
        if (dd > r + e.r) continue;
        anyHit = true;

        // Am Rand der Explosion weniger Schaden
        var falloff = U.clamp(1 - (dd / (r + e.r)) * 0.55, 0.45, 1);
        var dealt = e.applyDamage(this.damage * falloff, { tower: this.tower });
        if (this.tower) this.tower.damageDealt += dealt;

        if (d.slow)   e.applySlow(self.tower.stat('slow'), self.tower.stat('slowDur'));
        if (d.poison) e.applyPoison(self.tower.stat('poison'), self.tower.stat('poisonDur'));
      }

      g.addExplosion(this.x, this.y, r, this.color, this.kind);
      if (this.kind === 'shell') TD.audio.explode(false);
      if (anyHit && this.kind !== 'shell') TD.audio.hit();

    } else {
      // Einzeltreffer
      if (this.target && this.target.alive &&
          U.dist(this.x, this.y, this.target.x, this.target.y) < this.target.r + CELL * 0.4) {
        var dealt2 = this.target.applyDamage(this.damage, { tower: this.tower });
        if (this.tower) this.tower.damageDealt += dealt2;
        TD.audio.hit();
      }
      g.addSparks(this.x, this.y, this.color, 4);
    }
  };

  /* =======================================================
     PARTIKEL & TEXTE
     ======================================================= */
  function Particle(x, y, vx, vy, life, color, size, opts) {
    opts = opts || {};
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.color = color; this.size = size;
    this.gravity = opts.gravity || 0;
    this.drag = opts.drag == null ? 0.94 : opts.drag;
    this.glow = !!opts.glow;
    this.dead = false;
  }
  Particle.prototype.update = function (dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.vy += this.gravity * dt;
    var d = Math.pow(this.drag, dt * 60);
    this.vx *= d; this.vy *= d;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  };

  function FloatText(x, y, text, color, big) {
    this.x = x; this.y = y;
    this.text = String(text);
    this.color = color || '#fff';
    this.big = !!big;
    this.life = big ? 1.1 : 0.8;
    this.maxLife = this.life;
    this.vy = -34;
    this.vx = U.rand(-8, 8);
    this.dead = false;
  }
  FloatText.prototype.update = function (dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.y += this.vy * dt;
    this.x += this.vx * dt;
    this.vy *= Math.pow(0.94, dt * 60);
  };

  /* =======================================================
     LOOTBOX – taucht zufällig auf und stellt eine Wissensfrage
     ======================================================= */
  function Lootbox(game, cx, cy) {
    this.game = game;
    this.cx = cx; this.cy = cy;
    this.x = (cx + 0.5) * CELL;
    this.y = (cy + 0.5) * CELL;
    this.life = TD.LOOT.lifetime;
    this.maxLife = TD.LOOT.lifetime;
    this.spawnAnim = 1;
    this.bob = Math.random() * U.TAU;
    this.opened = false;
    this.dead = false;
  }

  Lootbox.prototype.update = function (dt) {
    if (this.spawnAnim > 0) this.spawnAnim = Math.max(0, this.spawnAnim - dt * 2);
    this.bob += dt * 2.4;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  };

  /** Liegt der Punkt auf der Kiste? Großzügig für Fingertipper. */
  Lootbox.prototype.hitTest = function (px, py) {
    return U.dist(px, py, this.x, this.y) < CELL * 0.75;
  };

  TD.Lootbox = Lootbox;

  TD.Enemy = Enemy;
  TD.Tower = Tower;
  TD.Projectile = Projectile;
  TD.Particle = Particle;
  TD.FloatText = FloatText;
})(window);
