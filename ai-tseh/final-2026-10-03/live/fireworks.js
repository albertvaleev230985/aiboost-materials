/* Фейерверк при выдаче сертификата: салют canvas-confetti (лежит у нас в vendor/) и звук
   ракет через Web Audio (тот же, что на финале очного потока 5). Звук включится, только если
   человек уже нажимал что-то на странице: браузеры не дают играть звук без жеста. */
(function () {
  'use strict';

  var audioCtx = null;
  var COLORS = ['#e0aa6f', '#c77a3a', '#f0ece2', '#8fb89b', '#ffd27a', '#b86931'];

  function unlockAudio() {
    try {
      if (!audioCtx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (error) { /* звук не обязателен */ }
  }

  ['pointerdown', 'touchstart', 'keydown'].forEach(function (type) {
    window.addEventListener(type, unlockAudio, { passive: true });
  });

  function noise(ctx, seconds) {
    var length = Math.floor(ctx.sampleRate * seconds);
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  function rocket(options) {
    var opts = options || {};
    setTimeout(function () {
      try {
        if (!audioCtx || audioCtx.state !== 'running') return;
        var ctx = audioCtx;
        var t0 = ctx.currentTime;
        var volume = opts.volume || 0.3;

        var whistle = ctx.createOscillator();
        var whistleGain = ctx.createGain();
        whistle.type = 'sine';
        whistle.frequency.setValueAtTime(220, t0);
        whistle.frequency.exponentialRampToValueAtTime(opts.pitch || 2000, t0 + 0.45);
        whistleGain.gain.setValueAtTime(0.001, t0);
        whistleGain.gain.exponentialRampToValueAtTime(0.15 * volume, t0 + 0.05);
        whistleGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
        whistle.connect(whistleGain).connect(ctx.destination);
        whistle.start(t0);
        whistle.stop(t0 + 0.46);

        var bang = t0 + 0.45;
        var bass = ctx.createOscillator();
        var bassGain = ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(opts.burst || 80, bang);
        bass.frequency.exponentialRampToValueAtTime((opts.burst || 80) * 0.4, bang + 0.18);
        bassGain.gain.setValueAtTime(volume * 1.1, bang);
        bassGain.gain.exponentialRampToValueAtTime(0.001, bang + 0.25);
        bass.connect(bassGain).connect(ctx.destination);
        bass.start(bang);
        bass.stop(bang + 0.26);

        var burst = ctx.createBufferSource();
        burst.buffer = noise(ctx, 0.7);
        var burstFilter = ctx.createBiquadFilter();
        burstFilter.type = 'highpass';
        burstFilter.frequency.value = 1500;
        var burstGain = ctx.createGain();
        burstGain.gain.setValueAtTime(volume * 0.55, bang);
        burstGain.gain.exponentialRampToValueAtTime(0.001, bang + 0.7);
        burst.connect(burstFilter).connect(burstGain).connect(ctx.destination);
        burst.start(bang);
        burst.stop(bang + 0.71);

        for (var i = 0; i < 7; i += 1) {
          var at = bang + 0.2 + Math.random() * 0.5;
          var crackle = ctx.createBufferSource();
          crackle.buffer = noise(ctx, 0.04);
          var crackleFilter = ctx.createBiquadFilter();
          crackleFilter.type = 'highpass';
          crackleFilter.frequency.value = 3000 + Math.random() * 4000;
          var crackleGain = ctx.createGain();
          crackleGain.gain.setValueAtTime(volume * 0.22, at);
          crackleGain.gain.exponentialRampToValueAtTime(0.001, at + 0.04);
          crackle.connect(crackleFilter).connect(crackleGain).connect(ctx.destination);
          crackle.start(at);
          crackle.stop(at + 0.05);
        }

        if (opts.chord) {
          [523.25, 659.25, 783.99, 1046.5].forEach(function (frequency, index) {
            var chordAt = bang + 0.25;
            var note = ctx.createOscillator();
            var gain = ctx.createGain();
            note.type = 'triangle';
            note.frequency.value = frequency;
            gain.gain.setValueAtTime(0.001, chordAt);
            gain.gain.exponentialRampToValueAtTime(volume * 0.16, chordAt + 0.05 + index * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, chordAt + 1.6);
            note.connect(gain).connect(ctx.destination);
            note.start(chordAt);
            note.stop(chordAt + 1.7);
          });
        }
      } catch (error) { /* звук не обязателен */ }
    }, opts.delay || 0);
  }

  function burst(options) {
    if (typeof window.confetti !== 'function') return;
    try {
      window.confetti(Object.assign({ zIndex: 9999, colors: COLORS, disableForReducedMotion: true }, options));
    } catch (error) { /* салют не обязателен */ }
  }

  function play() {
    unlockAudio();
    var duration = 5200;
    var end = Date.now() + duration;
    burst({ particleCount: 150, spread: 110, startVelocity: 48, origin: { x: 0.5, y: 0.55 }, ticks: 240, gravity: 0.9 });
    var timer = setInterval(function () {
      var left = end - Date.now();
      if (left <= 0) {
        clearInterval(timer);
        return;
      }
      var count = Math.max(8, Math.round(46 * (left / duration)));
      burst({ particleCount: count, spread: 360, startVelocity: 30, ticks: 70, origin: { x: 0.1 + Math.random() * 0.25, y: Math.random() * 0.45 } });
      burst({ particleCount: count, spread: 360, startVelocity: 30, ticks: 70, origin: { x: 0.65 + Math.random() * 0.25, y: Math.random() * 0.45 } });
    }, 260);
    rocket({ delay: 0, pitch: 1800, burst: 70, chord: true, volume: 0.32 });
    rocket({ delay: 700, pitch: 2400, burst: 90, volume: 0.28 });
    rocket({ delay: 1500, pitch: 1600, burst: 60, volume: 0.3 });
    rocket({ delay: 2400, pitch: 2800, burst: 100, chord: true, volume: 0.34 });
    return duration;
  }

  window.NVFireworks = { play: play, unlockAudio: unlockAudio };
}());
