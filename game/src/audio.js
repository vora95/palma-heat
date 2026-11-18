// Palma Heat — WebAudio synth: engine hum, sirens, gunshots, pickups.
// No audio files, everything synthesized, fully offline.
export function createAudio() {
  let ctx = null;
  let engineOsc = null, engineGain = null;
  let radioTimer = 0;
  let radioOn = true;
  const notes = [220, 277, 330, 415, 494, 554, 659];

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function startEngine() {
    if (!ensure() || engineOsc) return;
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 420;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0.0;
    engineOsc.connect(filt); filt.connect(engineGain); engineGain.connect(ctx.destination);
    engineOsc.start();
  }

  function setEngine(speed01, on) {
    if (!engineOsc || !engineGain) return;
    engineGain.gain.setTargetAtTime(on ? 0.03 + speed01 * 0.05 : 0, ctx.currentTime, 0.1);
    engineOsc.frequency.setTargetAtTime(55 + speed01 * 130, ctx.currentTime, 0.1);
  }

  function blip(freq, dur, type, vol) {
    if (!ensure()) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  }

  function shot() {
    if (!ensure()) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(900, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0.16, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.15);
  }

  function siren(dt, wanted) {
    if (!ensure() || wanted < 1) return;
    radioTimer -= dt;
    if (radioTimer > 0) return;
    radioTimer = 0.55;
    blip(660, 0.24, 'sine', 0.035);
    setTimeout(() => blip(520, 0.24, 'sine', 0.035), 260);
  }

  function radioTick(dt, station) {
    if (!ensure() || !radioOn) return;
    radioTimer -= dt;
    if (radioTimer > 0) return;
    radioTimer = 0.42;
    const n = notes[Math.floor(Math.random() * notes.length)] * (station === 1 ? 1.5 : station === 2 ? 0.75 : 1);
    blip(n, 0.36, 'triangle', 0.02);
  }

  function pickup() { blip(880, 0.12, 'sine', 0.09); setTimeout(() => blip(1320, 0.16, 'sine', 0.09), 90); }
  function punch() { blip(140, 0.1, 'square', 0.1); }

  return {
    ensure, startEngine, setEngine, shot, siren, radioTick, pickup, punch,
    toggleRadio() { radioOn = !radioOn; return radioOn; },
  };
}
