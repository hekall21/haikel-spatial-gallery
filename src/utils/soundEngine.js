// Luxury Cinematic Audio & Soundscape Engine
// Inspired by Michael Gatt film scores & tactile acoustic sound design

let audioCtx = null;
let ambientNodes = [];
let isAmbientPlaying = false;
let isSfxMuted = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generate organic noise buffer for realistic mechanical shutter
function createNoiseBuffer(ctx, duration = 0.05) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export const soundEngine = {
  getIsAmbientPlaying() {
    return isAmbientPlaying;
  },

  getIsSfxMuted() {
    return isSfxMuted;
  },

  setSfxMuted(muted) {
    isSfxMuted = muted;
  },

  // 1. Leica / Hasselblad Film Camera Mechanical Shutter (Warm & Realistic)
  playShutter() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Mechanical noise burst (Mirror up / Curtain slide)
      const noiseBuffer = createNoiseBuffer(ctx, 0.04);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1800, now);
      noiseFilter.Q.setValueAtTime(2.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.09, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now);

      // Low acoustic body resonance (Camera chassis click)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.05);

      subGain.gain.setValueAtTime(0.12, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.07);

      // Second curtain snap after 45ms
      setTimeout(() => {
        try {
          const t = ctx.currentTime;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(220, t);
          osc2.frequency.exponentialRampToValueAtTime(60, t + 0.04);

          gain2.gain.setValueAtTime(0.08, t);
          gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(t);
          osc2.stop(t + 0.05);
        } catch (e) {}
      }, 45);
    } catch (e) {
      console.warn('Audio play error', e);
    }
  },

  // 2. Apple Haptic Micro-Tick (Soft, muffled glass tap)
  playClick() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.02);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  },

  // 3. Ultra-subtle Hover Tick (Tactile Magnetic Feel)
  playHover() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.012);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.015);
    } catch (e) {}
  },

  // 4. Download Success: Warm Acoustic Chime
  playDownloadSuccess() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Soft harmonic chime notes (D major / F# major chord)
      const chord = [293.66, 369.99, 440.0, 587.33]; // D4, F#4, A4, D5
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.06, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.65);
      });
    } catch (e) {}
  },

  // 5. Cinematic Ambient Whoosh
  playWhoosh() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.25);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + 0.1);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.22);
      filter.Q.setValueAtTime(1.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
    } catch (e) {}
  },

  // 6. Ethereal Cinematic Soundscape (Hans Zimmer / Michael Gatt Atmospheric Drone)
  toggleAmbient(onStateChange) {
    const ctx = getAudioContext();
    if (!ctx) return false;

    if (isAmbientPlaying) {
      // Smooth 1.2s Fade out
      ambientNodes.forEach(node => {
        if (node.gain) {
          node.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        }
        setTimeout(() => {
          try {
            if (node.osc) node.osc.stop();
          } catch (e) {}
        }, 1300);
      });
      ambientNodes = [];
      isAmbientPlaying = false;
      if (onStateChange) onStateChange(false);
      return false;
    } else {
      // Luxurious Harmonic Drone (D Minor / A Ethereal Swell)
      const now = ctx.currentTime;
      ambientNodes = [];

      // Master warm lowpass filter
      const masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(280, now);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(0.045, now + 2.5); // Very gentle fade in

      masterFilter.connect(masterGain);
      masterGain.connect(ctx.destination);

      // 4 Warm Harmonic Sine Oscillators (No harsh sawtooth!)
      const frequencies = [
        55.0,    // A1 Deep Sub
        110.0,   // A2 Root Warmth
        164.81,  // E3 Perfect Fifth
        220.0    // A3 Octave Air
      ];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const nodeGain = ctx.createGain();

        osc.type = 'sine';
        // Subtle natural chorusing detune
        const detune = (idx === 1 ? 0.3 : idx === 2 ? -0.4 : 0);
        osc.frequency.setValueAtTime(freq + detune, now);

        nodeGain.gain.setValueAtTime(idx === 0 ? 0.06 : 0.035, now);

        osc.connect(nodeGain);
        nodeGain.connect(masterFilter);
        osc.start(now);

        ambientNodes.push({ osc, gain: nodeGain });
      });

      ambientNodes.push({ gain: masterGain });
      isAmbientPlaying = true;
      if (onStateChange) onStateChange(true);
      return true;
    }
  }
};
