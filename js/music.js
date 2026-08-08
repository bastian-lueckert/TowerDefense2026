/* =========================================================
   music.js – Hintergrundmusik im MIDI-Stil

   Ein kleiner Schrittsequencer auf Basis der WebAudio-API:
   Die Stücke stehen als Notenlisten im Code, die Instrumente
   werden synthetisiert. Damit bleibt alles offline – ohne
   eine einzige Audiodatei.

   Notation: [Schritt, MIDI-Note, Länge in Schritten, Lautstärke]
   Ein Schritt ist eine Sechzehntel.
   ========================================================= */
(function (global) {
  'use strict';
  var TD = global.TD, U = TD.utils;

  /* MIDI-Note zu Frequenz (69 = A4 = 440 Hz) */
  function hz(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  /* -------------------------------------------------------
     Instrumente
     Jedes bekommt Ziel-Bus, Startzeit, Frequenz, Dauer, Stärke
     ------------------------------------------------------- */
  var INSTRUMENTS = {

    /* Gezupfte Laute – kurzer Anschlag, schnelles Abklingen */
    lute: function (ctx, out, t, f, dur, v) {
      var o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      fl.type = 'lowpass';
      fl.frequency.setValueAtTime(f * 6, t);
      fl.frequency.exponentialRampToValueAtTime(Math.max(200, f * 1.6), t + dur * 0.7);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(out);
      o.start(t); o.stop(t + dur + 0.02);
    },

    /* Holzflöte – weich, mit leichtem Vibrato */
    flute: function (ctx, out, t, f, dur, v) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      lfo.frequency.setValueAtTime(5.2, t);
      lg.gain.setValueAtTime(f * 0.011, t);
      lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.09, dur * 0.35));
      g.gain.setValueAtTime(v, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(out);
      o.start(t); lfo.start(t);
      o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
    },

    /* Blech – kräftiger Ansatz, offener Klang */
    brass: function (ctx, out, t, f, dur, v) {
      var o = ctx.createOscillator(), o2 = ctx.createOscillator();
      var g = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o2.type = 'square';
      o.frequency.setValueAtTime(f, t);
      o2.frequency.setValueAtTime(f * 1.005, t);
      fl.type = 'lowpass';
      fl.frequency.setValueAtTime(f * 2, t);
      fl.frequency.linearRampToValueAtTime(f * 7, t + 0.07);
      fl.frequency.linearRampToValueAtTime(f * 3, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.035);
      g.gain.setValueAtTime(v * 0.85, t + dur * 0.75);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(out);
      o.start(t); o2.start(t);
      o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
    },

    /* Rohrflöte mit Doppelrohrblatt-Charakter (Ägypten, Naj) */
    reed: function (ctx, out, t, f, dur, v) {
      var o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(f, t);
      lfo.frequency.setValueAtTime(6.4, t);
      lg.gain.setValueAtTime(f * 0.016, t);
      lfo.connect(lg); lg.connect(o.frequency);
      fl.type = 'bandpass';
      fl.frequency.setValueAtTime(f * 2.4, t);
      fl.Q.value = 3.2;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.05);
      g.gain.setValueAtTime(v * 0.8, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); fl.connect(g); g.connect(out);
      o.start(t); lfo.start(t);
      o.stop(t + dur + 0.02); lfo.stop(t + dur + 0.02);
    },

    /* Tiefe Streicher-/Chorfläche */
    pad: function (ctx, out, t, f, dur, v) {
      var o = ctx.createOscillator(), o2 = ctx.createOscillator();
      var g = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = 'triangle'; o2.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t);
      o2.frequency.setValueAtTime(f * 0.5, t);
      fl.type = 'lowpass'; fl.frequency.value = Math.max(400, f * 2.5);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.5, dur * 0.4));
      g.gain.setValueAtTime(v, t + dur * 0.75);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(out);
      o.start(t); o2.start(t);
      o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    },

    /* Gezupfter Bass */
    bass: function (ctx, out, t, f, dur, v) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + dur + 0.02);
    },

    /* Rahmentrommel / Kesselpauke */
    drum: function (ctx, out, t, f, dur, v) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f * 2.2, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, f * 0.7), t + 0.09);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.16, dur));
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + dur + 0.05);
    }
  };

  /* Rauschbasierte Perkussion braucht einen eigenen Weg */
  function noiseHit(ctx, out, t, dur, v, cutoff, buffer) {
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var fl = ctx.createBiquadFilter();
    fl.type = 'highpass'; fl.frequency.value = cutoff;
    var g = ctx.createGain();
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(out);
    src.start(t); src.stop(t + dur + 0.02);
  }

  /* =======================================================
     Die vier Stücke
     ======================================================= */

  /* Mittelalter: Estampie-artiger Tanz, dorisch auf D */
  var MEDIEVAL = {
    name: 'Tanz auf dem Burghof', bpm: 112, steps: 64,
    tracks: [
      { inst: 'lute', vol: 0.20, notes: [
        [0,74,2],[2,72,2],[4,70,2],[6,69,2],[8,67,4],[12,69,2],[14,70,2],
        [16,72,2],[18,74,2],[20,72,4],[24,70,2],[26,69,2],[28,67,4],
        [32,69,2],[34,70,2],[36,72,2],[38,74,2],[40,76,4],[44,74,2],[46,72,2],
        [48,70,2],[50,69,2],[52,67,2],[54,65,2],[56,67,8]
      ]},
      { inst: 'flute', vol: 0.13, notes: [
        [8,62,4],[16,65,4],[24,62,4],[32,67,4],[40,69,4],[48,65,4],[56,62,8]
      ]},
      { inst: 'bass', vol: 0.19, notes: [
        [0,38,3],[6,38,2],[8,45,3],[14,45,2],[16,43,3],[22,43,2],[24,38,3],[30,38,2],
        [32,38,3],[38,38,2],[40,45,3],[46,45,2],[48,43,3],[54,43,2],[56,38,6]
      ]},
      { inst: 'drum', vol: 0.16, notes: [
        [0,45,2],[6,45,1],[8,45,2],[14,45,1],[16,45,2],[22,45,1],[24,45,2],[30,45,1],
        [32,45,2],[38,45,1],[40,45,2],[46,45,1],[48,45,2],[54,45,1],[56,45,2],[62,45,1]
      ]},
      { perc: 'tamb', vol: 0.05, notes: [
        [3,0,1],[7,0,1],[11,0,1],[15,0,1],[19,0,1],[23,0,1],[27,0,1],[31,0,1],
        [35,0,1],[39,0,1],[43,0,1],[47,0,1],[51,0,1],[55,0,1],[59,0,1],[63,0,1]
      ]}
    ]
  };

  /* Wikinger: schwer und schreitend, äolisch auf A */
  var VIKING = {
    name: 'Lied vom Fjord', bpm: 84, steps: 64,
    tracks: [
      { inst: 'flute', vol: 0.17, notes: [
        [0,69,4],[4,72,4],[8,71,2],[10,69,2],[12,67,4],
        [16,69,4],[20,64,4],[24,67,6],[30,69,2],
        [32,72,4],[36,74,4],[40,72,2],[38,71,2],[44,69,4],
        [48,67,4],[52,64,4],[56,69,8]
      ]},
      { inst: 'pad', vol: 0.10, notes: [
        [0,45,16],[16,41,16],[32,48,16],[48,45,16]
      ]},
      { inst: 'bass', vol: 0.22, notes: [
        [0,33,4],[8,33,4],[16,29,4],[24,29,4],
        [32,36,4],[40,36,4],[48,33,4],[56,33,4]
      ]},
      { inst: 'drum', vol: 0.24, notes: [
        [0,38,3],[8,38,3],[12,45,2],[16,38,3],[24,38,3],[28,45,2],
        [32,38,3],[40,38,3],[44,45,2],[48,38,3],[56,38,3],[60,45,2],[62,45,2]
      ]},
      { perc: 'clap', vol: 0.07, notes: [
        [8,0,1],[24,0,1],[40,0,1],[56,0,1]
      ]}
    ]
  };

  /* Römer: Marsch, mixolydisch auf C, mit Blech */
  var ROMAN = {
    name: 'Marsch der Neunten', bpm: 120, steps: 64,
    tracks: [
      { inst: 'brass', vol: 0.16, notes: [
        [0,72,3],[4,72,1],[6,74,2],[8,76,4],[12,74,2],[14,72,2],
        [16,71,3],[20,71,1],[22,72,2],[24,74,6],[30,72,2],
        [32,76,3],[36,76,1],[38,77,2],[40,79,4],[44,77,2],[46,76,2],
        [48,74,4],[52,72,4],[56,71,4],[60,72,4]
      ]},
      { inst: 'brass', vol: 0.08, notes: [
        [0,60,4],[8,64,4],[16,59,4],[24,62,4],
        [32,64,4],[40,67,4],[48,62,4],[56,60,4]
      ]},
      { inst: 'bass', vol: 0.21, notes: [
        [0,36,2],[4,36,2],[8,43,2],[12,43,2],[16,35,2],[20,35,2],[24,38,2],[28,38,2],
        [32,40,2],[36,40,2],[40,43,2],[44,43,2],[48,38,2],[52,38,2],[56,36,4]
      ]},
      { inst: 'drum', vol: 0.20, notes: [
        [0,41,2],[4,41,2],[8,41,2],[12,41,2],[16,41,2],[20,41,2],[24,41,2],[28,41,2],
        [32,41,2],[36,41,2],[40,41,2],[44,41,2],[48,41,2],[52,41,2],[56,41,2],[60,41,2]
      ]},
      { perc: 'snare', vol: 0.07, notes: [
        [2,0,1],[3,0,1],[6,0,1],[10,0,1],[14,0,1],[18,0,1],[19,0,1],[22,0,1],
        [26,0,1],[30,0,1],[34,0,1],[35,0,1],[38,0,1],[42,0,1],[46,0,1],
        [50,0,1],[54,0,1],[58,0,1],[62,0,1],[63,0,1]
      ]}
    ]
  };

  /* Ägypter: Hijaz auf D (mit übermäßiger Sekunde), Rohrflöte */
  var EGYPTIAN = {
    name: 'Barke des Ra', bpm: 96, steps: 64,
    tracks: [
      { inst: 'reed', vol: 0.15, notes: [
        [0,74,3],[3,75,1],[4,78,4],[8,77,2],[10,75,2],[12,74,4],
        [16,72,3],[19,74,1],[20,75,4],[24,74,2],[26,72,2],[28,70,4],
        [32,74,2],[34,75,2],[36,78,2],[38,79,2],[40,81,4],[44,79,4],
        [48,78,3],[51,75,1],[52,74,4],[56,70,4],[60,74,4]
      ]},
      { inst: 'lute', vol: 0.10, notes: [
        [0,62,2],[4,66,2],[8,67,2],[12,62,2],[16,60,2],[20,63,2],[24,62,2],[28,58,2],
        [32,62,2],[36,66,2],[40,69,2],[44,66,2],[48,67,2],[52,63,2],[56,62,4]
      ]},
      { inst: 'bass', vol: 0.20, notes: [
        [0,38,6],[8,38,4],[16,36,6],[24,36,4],
        [32,38,6],[40,43,4],[48,41,6],[56,38,6]
      ]},
      { inst: 'drum', vol: 0.21, notes: [
        [0,43,2],[6,43,1],[8,43,2],[11,43,1],[16,43,2],[22,43,1],[24,43,2],[27,43,1],
        [32,43,2],[38,43,1],[40,43,2],[43,43,1],[48,43,2],[54,43,1],[56,43,2],[59,43,1]
      ]},
      { perc: 'tamb', vol: 0.06, notes: [
        [2,0,1],[4,0,1],[10,0,1],[12,0,1],[14,0,1],[18,0,1],[20,0,1],[26,0,1],
        [28,0,1],[30,0,1],[34,0,1],[36,0,1],[42,0,1],[44,0,1],[46,0,1],
        [50,0,1],[52,0,1],[58,0,1],[60,0,1],[62,0,1]
      ]}
    ]
  };

  /* Japan: In-Skala auf D (D, Eb, G, A, Bb) – Koto, Shakuhachi, Taiko */
  var JAPAN = {
    name: 'Kirschblüten und Stahl', bpm: 88, steps: 64,
    tracks: [
      { inst: 'flute', vol: 0.16, notes: [
        [0,74,6],[6,75,2],[8,79,4],[12,77,4],
        [16,74,4],[20,70,4],[24,74,6],[30,75,2],
        [32,79,4],[36,81,4],[40,79,2],[42,77,2],[44,74,4],
        [48,75,4],[52,74,4],[56,70,8]
      ]},
      { inst: 'lute', vol: 0.15, notes: [
        [0,62,2],[2,67,2],[4,69,2],[6,70,2],[8,74,2],[10,70,2],[12,69,2],[14,67,2],
        [16,62,2],[18,67,2],[20,69,2],[22,67,2],[24,62,4],[28,63,4],
        [32,62,2],[34,67,2],[36,69,2],[38,74,2],[40,75,2],[42,74,2],[44,69,2],[46,67,2],
        [48,63,2],[50,67,2],[52,62,4],[56,62,8]
      ]},
      { inst: 'pad', vol: 0.08, notes: [
        [0,50,16],[16,45,16],[32,50,16],[48,43,16]
      ]},
      { inst: 'bass', vol: 0.20, notes: [
        [0,38,6],[8,38,4],[16,33,6],[24,33,4],
        [32,38,6],[40,38,4],[48,43,6],[56,38,6]
      ]},
      { inst: 'drum', vol: 0.26, notes: [
        [0,36,4],[12,43,2],[16,36,4],[28,43,2],
        [32,36,4],[38,36,2],[44,43,2],[48,36,4],[56,36,2],[60,43,2],[62,43,2]
      ]},
      { perc: 'clap', vol: 0.05, notes: [
        [14,0,1],[30,0,1],[46,0,1],[62,0,1]
      ]}
    ]
  };

  var SONGS = {
    medieval: MEDIEVAL, viking: VIKING, roman: ROMAN,
    egyptian: EGYPTIAN, japan: JAPAN
  };

  /* =======================================================
     Sequencer
     ======================================================= */
  var ctx = null, bus = null, noiseBuf = null;
  var song = null, step = 0, nextTime = 0, timer = 0;
  var playing = false, currentKey = null;
  var LOOKAHEAD = 0.12;          // Sekunden im Voraus einplanen

  function stepDuration() {
    return 60 / song.bpm / 4;    // Sechzehntel
  }

  function scheduleStep(s, t) {
    song.tracks.forEach(function (tr) {
      for (var i = 0; i < tr.notes.length; i++) {
        var n = tr.notes[i];
        if (n[0] !== s) continue;
        var dur = n[2] * stepDuration();
        var vol = (n[3] || 1) * (tr.vol || 0.15);

        if (tr.perc) {
          if (tr.perc === 'snare') noiseHit(ctx, bus, t, 0.09, vol, 1400, noiseBuf);
          else if (tr.perc === 'clap') noiseHit(ctx, bus, t, 0.14, vol, 900, noiseBuf);
          else noiseHit(ctx, bus, t, 0.05, vol, 4200, noiseBuf);   // Tamburin
        } else {
          var fn = INSTRUMENTS[tr.inst] || INSTRUMENTS.lute;
          fn(ctx, bus, t, hz(n[1]), dur, vol);
        }
      }
    });
  }

  function tick() {
    if (!playing || !song) return;
    var sd = stepDuration();
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      scheduleStep(step, nextTime);
      nextTime += sd;
      step = (step + 1) % song.steps;
    }
  }

  var M = TD.music = {

    /** Wird von audio.js gesetzt, sobald der AudioContext steht. */
    attach: function (audioCtx, target, noiseBuffer) {
      ctx = audioCtx;
      noiseBuf = noiseBuffer;
      bus = ctx.createGain();
      bus.gain.value = 0.55;
      bus.connect(target);
    },

    isPlaying: function () { return playing; },

    titleFor: function (factionKey) {
      return (SONGS[factionKey] || MEDIEVAL).name;
    },

    /** Stück des Volkes starten (läuft in Schleife). */
    play: function (factionKey) {
      if (!ctx || !bus) return false;
      if (playing && currentKey === factionKey) return true;
      M.stop();

      song = SONGS[factionKey] || MEDIEVAL;
      currentKey = factionKey;
      step = 0;
      nextTime = ctx.currentTime + 0.08;
      playing = true;
      timer = global.setInterval(tick, 30);
      tick();
      return true;
    },

    stop: function () {
      playing = false;
      if (timer) { global.clearInterval(timer); timer = 0; }
      song = null;
      currentKey = null;
    },

    /** Lautstärke sanft ändern – etwa beim Pausieren. */
    setVolume: function (v, seconds) {
      if (!bus || !ctx) return;
      bus.gain.setTargetAtTime(v, ctx.currentTime, (seconds || 0.3) / 3);
    }
  };
})(window);
