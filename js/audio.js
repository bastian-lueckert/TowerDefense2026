/* =========================================================
   audio.js – Komplett synthetischer Sound (WebAudio).
   Keine Audiodateien => funktioniert garantiert offline.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD = global.TD || {};
  var U = TD.utils;

  var ctx = null;
  var master = null, sfxBus = null, musicBus = null;
  var enabled = U.store.get('sound', true);
  var started = false;
  var musicTimer = null;
  var noiseBuffer = null;

  /** AudioContext erst nach erster Nutzergeste erzeugen (Autoplay-Policy). */
  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }

    master = ctx.createGain();
    master.gain.value = enabled ? 0.9 : 0;
    master.connect(ctx.destination);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.7;
    sfxBus.connect(master);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0.16;
    musicBus.connect(master);

    // Rauschpuffer einmalig erzeugen (für Explosionen/Treffer)
    var len = Math.floor(ctx.sampleRate * 1.2);
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuffer.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    started = true;
    return true;
  }

  /** Ein Ton mit Hüllkurve. */
  function tone(opt) {
    if (!enabled || !ensure()) return;
    var t0 = ctx.currentTime + (opt.delay || 0);
    var dur = opt.dur || 0.12;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = opt.type || 'square';
    osc.frequency.setValueAtTime(opt.freq, t0);
    if (opt.to && opt.to !== opt.freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opt.to), t0 + dur);
    }

    var vol = (opt.vol == null ? 0.3 : opt.vol);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + (opt.attack || 0.005));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    var node = osc;
    if (opt.filter) {
      var f = ctx.createBiquadFilter();
      f.type = opt.filter;
      f.frequency.value = opt.cutoff || 1200;
      node.connect(f); node = f;
    }
    node.connect(gain);
    gain.connect(opt.bus || sfxBus);

    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Gefiltertes Rauschen – Explosionen, Treffer, Wind. */
  function noise(opt) {
    if (!enabled || !ensure()) return;
    var t0 = ctx.currentTime + (opt.delay || 0);
    var dur = opt.dur || 0.2;

    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.playbackRate.value = opt.rate || 1;

    var f = ctx.createBiquadFilter();
    f.type = opt.filter || 'lowpass';
    f.frequency.setValueAtTime(opt.cutoff || 900, t0);
    if (opt.cutoffTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, opt.cutoffTo), t0 + dur);
    f.Q.value = opt.q || 1;

    var gain = ctx.createGain();
    var vol = (opt.vol == null ? 0.3 : opt.vol);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + (opt.attack || 0.006));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(f); f.connect(gain); gain.connect(sfxBus);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /* ---------------- Hintergrundmusik ----------------
     Langsame Akkordfolge in a-Moll, dazu sparsame Arpeggios.
     Rein prozedural, ca. 8 s pro Akkord.                */
  var CHORDS = [
    [220.00, 261.63, 329.63],  // Am
    [174.61, 220.00, 261.63],  // F
    [196.00, 246.94, 293.66],  // G
    [164.81, 207.65, 246.94]   // Em
  ];
  var chordIndex = 0;

  function musicStep() {
    if (!enabled || !ctx) return;
    var chord = CHORDS[chordIndex % CHORDS.length];
    chordIndex++;

    // Fläche
    for (var i = 0; i < chord.length; i++) {
      tone({
        freq: chord[i] / 2, type: 'sine', dur: 4.4, vol: 0.16,
        attack: 1.2, bus: musicBus, filter: 'lowpass', cutoff: 700
      });
    }
    // Arpeggio
    for (var s = 0; s < 4; s++) {
      tone({
        freq: chord[s % chord.length] * 2, type: 'triangle',
        dur: 0.5, vol: 0.05, delay: 0.55 + s * 0.55,
        bus: musicBus, filter: 'lowpass', cutoff: 2200
      });
    }
  }

  var A = TD.audio = {

    /** Nach der ersten Nutzergeste aufrufen. */
    unlock: function () {
      if (!ensure()) return;
      // Stiller Klick entsperrt iOS/Safari zuverlässig.
      var g = ctx.createGain();
      g.gain.value = 0.0001;
      g.connect(master);
      var o = ctx.createOscillator();
      o.connect(g);
      o.start(); o.stop(ctx.currentTime + 0.01);
    },

    isOn: function () { return enabled; },

    toggle: function () {
      enabled = !enabled;
      U.store.set('sound', enabled);
      if (enabled) {
        ensure();
        if (master) master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.05);
      } else if (master) {
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      }
      return enabled;
    },

    startMusic: function () {
      if (musicTimer) return;
      ensure();
      musicStep();
      musicTimer = setInterval(musicStep, 8800);
    },
    stopMusic: function () {
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    },

    /* ---------------- Effekte ---------------- */

    shoot: function (kind) {
      switch (kind) {
        case 'cannon':
          noise({ dur: 0.3, cutoff: 900, cutoffTo: 90, vol: 0.34, rate: 0.7 });
          tone({ freq: 150, to: 46, type: 'square', dur: 0.24, vol: 0.3 });
          break;
        case 'frost':
          tone({ freq: 1250, to: 720, type: 'sine', dur: 0.16, vol: 0.16 });
          tone({ freq: 1900, to: 1150, type: 'sine', dur: 0.12, vol: 0.09, delay: 0.03 });
          break;
        case 'tesla':
          noise({ dur: 0.16, filter: 'bandpass', cutoff: 2600, q: 7, vol: 0.22, rate: 1.6 });
          tone({ freq: 900, to: 2400, type: 'sawtooth', dur: 0.1, vol: 0.1 });
          break;
        case 'sniper':
          tone({ freq: 620, to: 120, type: 'sawtooth', dur: 0.2, vol: 0.26 });
          noise({ dur: 0.26, cutoff: 2400, cutoffTo: 300, vol: 0.2, rate: 1.2 });
          break;
        case 'poison':
          tone({ freq: 300, to: 170, type: 'triangle', dur: 0.16, vol: 0.16, filter: 'lowpass', cutoff: 800 });
          break;
        default: // gun
          tone({ freq: 720, to: 330, type: 'square', dur: 0.07, vol: 0.14 });
          break;
      }
    },

    explode: function (big) {
      noise({
        dur: big ? 0.62 : 0.34,
        cutoff: big ? 1500 : 1100, cutoffTo: 60,
        vol: big ? 0.45 : 0.3, rate: big ? 0.55 : 0.85
      });
      tone({ freq: big ? 110 : 170, to: 32, type: 'sine', dur: big ? 0.5 : 0.28, vol: 0.3 });
    },

    hit:  function () { noise({ dur: 0.05, filter: 'highpass', cutoff: 1800, vol: 0.07, rate: 1.5 }); },

    enemyDie: function (boss) {
      if (boss) {
        A.explode(true);
        tone({ freq: 300, to: 60, type: 'sawtooth', dur: 0.8, vol: 0.3, delay: 0.05 });
      } else {
        tone({ freq: 420, to: 130, type: 'triangle', dur: 0.14, vol: 0.14 });
        noise({ dur: 0.12, cutoff: 1400, cutoffTo: 200, vol: 0.12 });
      }
    },

    place:   function () { tone({ freq: 330, type: 'square', dur: 0.08, vol: 0.2 }); tone({ freq: 660, type: 'square', dur: 0.1, vol: 0.16, delay: 0.06 }); },
    upgrade: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone({ freq: f, type: 'triangle', dur: 0.16, vol: 0.18, delay: i * 0.06 }); }); },
    sell:    function () { tone({ freq: 500, to: 200, type: 'triangle', dur: 0.18, vol: 0.18 }); },
    coin:    function () { tone({ freq: 1150, type: 'square', dur: 0.05, vol: 0.08 }); tone({ freq: 1600, type: 'square', dur: 0.07, vol: 0.06, delay: 0.04 }); },
    click:   function () { tone({ freq: 480, type: 'square', dur: 0.035, vol: 0.1 }); },
    error:   function () { tone({ freq: 190, to: 120, type: 'square', dur: 0.16, vol: 0.16 }); },

    leak: function () {
      tone({ freq: 260, to: 90, type: 'sawtooth', dur: 0.42, vol: 0.3, filter: 'lowpass', cutoff: 900 });
      noise({ dur: 0.4, cutoff: 500, cutoffTo: 90, vol: 0.22 });
    },

    waveStart: function () {
      [392, 523, 659].forEach(function (f, i) {
        tone({ freq: f, type: 'triangle', dur: 0.24, vol: 0.16, delay: i * 0.09 });
      });
    },

    gameOver: function () {
      [440, 349, 294, 220].forEach(function (f, i) {
        tone({ freq: f, type: 'sawtooth', dur: 0.55, vol: 0.22, delay: i * 0.22, filter: 'lowpass', cutoff: 1400 });
      });
    },

    victory: function () {
      [523, 659, 784, 1047, 1319].forEach(function (f, i) {
        tone({ freq: f, type: 'triangle', dur: 0.4, vol: 0.22, delay: i * 0.13 });
        tone({ freq: f / 2, type: 'sine', dur: 0.5, vol: 0.14, delay: i * 0.13 });
      });
    }
  };
})(window);
