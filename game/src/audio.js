// Festival Lampion — WebAudio synthesised sounds only (no audio files).
// Chime on a find, buzz on a wrong click, a jingle on level complete, a
// fanfare on the full win, and a soft background pad that can be muted.
var FL = window.FL || (window.FL = {});

FL.Audio = (function () {
  let ctx = null;
  let padNodes = null;
  let muted = false;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, startAt, duration, type, gain) {
    const c = ensureCtx();
    if (!c || muted) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + startAt);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, c.currentTime + startAt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startAt + duration);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(c.currentTime + startAt);
    osc.stop(c.currentTime + startAt + duration + 0.05);
  }

  function chime() {
    tone(880, 0, 0.25, 'sine', 0.14);
    tone(1318.5, 0.08, 0.35, 'sine', 0.12);
  }

  function buzz() {
    tone(140, 0, 0.22, 'sawtooth', 0.08);
    tone(110, 0.05, 0.2, 'sawtooth', 0.06);
  }

  function jingle() {
    [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
      tone(f, i * 0.11, 0.3, 'triangle', 0.13);
    });
  }

  function fanfare() {
    [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
      tone(f, i * 0.13, 0.35, 'triangle', 0.13);
    });
  }

  function startPad() {
    const c = ensureCtx();
    if (!c || muted || padNodes) return;
    const gain = c.createGain();
    gain.gain.value = 0.035;
    gain.connect(c.destination);
    const osc1 = c.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 220;
    const osc2 = c.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 277.18;
    const osc3 = c.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 329.63;
    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    osc1.start();
    osc2.start();
    osc3.start();
    padNodes = { gain: gain, oscs: [osc1, osc2, osc3] };
  }

  function stopPad() {
    if (!padNodes) return;
    try {
      padNodes.oscs.forEach(function (o) { o.stop(); });
      padNodes.gain.disconnect();
    } catch (e) { /* already stopped */ }
    padNodes = null;
  }

  function setMuted(value) {
    muted = !!value;
    if (muted) stopPad();
    return muted;
  }

  function isMuted() {
    return muted;
  }

  return {
    chime: chime,
    buzz: buzz,
    jingle: jingle,
    fanfare: fanfare,
    startPad: startPad,
    stopPad: stopPad,
    setMuted: setMuted,
    isMuted: isMuted,
    ensure: ensureCtx
  };
})();
