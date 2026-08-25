// Luxury Cinematic Audio & Theater Soundscape Engine
// Inspired by Dolby Atmos, THX Deep Note, and tactile analog acoustics

let audioCtx = null;
let ambientNodes = [];
let isAmbientPlaying = false;
let isSfxMuted = false;
let masterVolume = 0.85; // 0.0 to 1.0
let compressorNode = null;
let masterGainNode = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      
      // Master Compressor to make cinema audio punchy, loud, and free of distortion
      compressorNode = audioCtx.createDynamicsCompressor();
      compressorNode.threshold.setValueAtTime(-18, audioCtx.currentTime);
      compressorNode.knee.setValueAtTime(12, audioCtx.currentTime);
      compressorNode.ratio.setValueAtTime(4, audioCtx.currentTime);
      compressorNode.attack.setValueAtTime(0.003, audioCtx.currentTime);
      compressorNode.release.setValueAtTime(0.25, audioCtx.currentTime);

      masterGainNode = audioCtx.createGain();
      masterGainNode.gain.setValueAtTime(masterVolume, audioCtx.currentTime);

      compressorNode.connect(masterGainNode);
      masterGainNode.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getDestination() {
  const ctx = getAudioContext();
  if (!ctx) return null;
  return compressorNode || ctx.destination;
}

// Generate organic noise buffer for realistic mechanical shutter & atmospheric air
function createNoiseBuffer(ctx, duration = 0.1) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
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

  getMasterVolume() {
    return masterVolume;
  },

  setMasterVolume(vol) {
    masterVolume = Math.max(0, Math.min(1, vol));
    if (masterGainNode && audioCtx) {
      masterGainNode.gain.linearRampToValueAtTime(masterVolume, audioCtx.currentTime + 0.1);
    }
  },

  // 1. Dolby / IMAX Style Iconic Cinema Opening Boom ("BWWOOOMMM")
  playCinemaBoom() {
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;
      const now = ctx.currentTime;

      // Deep Sub Drop (35Hz -> 55Hz -> 28Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(32, now);
      subOsc.frequency.exponentialRampToValueAtTime(75, now + 0.6);
      subOsc.frequency.exponentialRampToValueAtTime(38, now + 2.8);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.7, now + 0.4);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      subOsc.connect(subGain);
      subGain.connect(dest);
      subOsc.start(now);
      subOsc.stop(now + 3.3);

      // Low-Mid Harmonic Swell (Octave & 5th: 110Hz -> 165Hz)
      const midOsc = ctx.createOscillator();
      const midGain = ctx.createGain();
      const midFilter = ctx.createBiquadFilter();

      midOsc.type = 'triangle';
      midOsc.frequency.setValueAtTime(65, now);
      midOsc.frequency.exponentialRampToValueAtTime(130, now + 0.8);
      midOsc.frequency.exponentialRampToValueAtTime(82, now + 2.6);

      midFilter.type = 'lowpass';
      midFilter.frequency.setValueAtTime(180, now);
      midFilter.frequency.exponentialRampToValueAtTime(600, now + 0.7);
      midFilter.frequency.exponentialRampToValueAtTime(120, now + 2.8);

      midGain.gain.setValueAtTime(0.001, now);
      midGain.gain.linearRampToValueAtTime(0.45, now + 0.5);
      midGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);

      midOsc.connect(midFilter);
      midFilter.connect(midGain);
      midGain.connect(dest);
      midOsc.start(now);
      midOsc.stop(now + 3.0);

      // Shimmering High Harmonic Chime (Dolby sparkle effect)
      [440, 659.25, 880, 1318.5].forEach((freq, i) => {
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, now + 0.2 + i * 0.08);

        chimeGain.gain.setValueAtTime(0.0001, now + 0.2 + i * 0.08);
        chimeGain.gain.linearRampToValueAtTime(0.12, now + 0.35 + i * 0.08);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4 + i * 0.08);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(dest);
        chimeOsc.start(now + 0.2 + i * 0.08);
        chimeOsc.stop(now + 2.5 + i * 0.08);
      });

      // Air rush / projector wind
      const airNoise = ctx.createBufferSource();
      airNoise.buffer = createNoiseBuffer(ctx, 1.8);
      const airFilter = ctx.createBiquadFilter();
      airFilter.type = 'bandpass';
      airFilter.frequency.setValueAtTime(300, now);
      airFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.5);
      airFilter.frequency.exponentialRampToValueAtTime(200, now + 1.8);
      airFilter.Q.setValueAtTime(1.5, now);

      const airGain = ctx.createGain();
      airGain.gain.setValueAtTime(0.001, now);
      airGain.gain.linearRampToValueAtTime(0.18, now + 0.4);
      airGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      airNoise.connect(airFilter);
      airFilter.connect(airGain);
      airGain.connect(dest);
      airNoise.start(now);

    } catch (e) {
      console.warn('[SoundEngine] playCinemaBoom error', e);
    }
  },

  // 2. Camera Mechanical Shutter (Crisp & Tactile)
  playShutter() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;
      const now = ctx.currentTime;

      // Mechanical noise burst
      const noiseBuffer = createNoiseBuffer(ctx, 0.05);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2200, now);
      noiseFilter.Q.setValueAtTime(2.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(dest);
      noiseSource.start(now);

      // Body resonance
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160, now);
      subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      subOsc.connect(subGain);
      subGain.connect(dest);
      subOsc.start(now);
      subOsc.stop(now + 0.07);

      // Second curtain snap
      setTimeout(() => {
        try {
          const t = ctx.currentTime;
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(260, t);
          osc2.frequency.exponentialRampToValueAtTime(70, t + 0.04);

          gain2.gain.setValueAtTime(0.22, t);
          gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

          osc2.connect(gain2);
          gain2.connect(dest);
          osc2.start(t);
          osc2.stop(t + 0.05);
        } catch (e) {}
      }, 40);
    } catch (e) {
      console.warn('[SoundEngine] playShutter error', e);
    }
  },

  // 3. Apple Haptic Micro-Tap
  playClick() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.025);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {}
  },

  // 4. Subtle Hover Tick
  playHover() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.015);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch (e) {}
  },

  // 5. Cinematic Navigation Whoosh
  playWhoosh() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;
      const now = ctx.currentTime;

      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer(ctx, 0.3);

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(280, now);
      filter.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(220, now + 0.28);
      filter.Q.setValueAtTime(1.4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      noise.start(now);
    } catch (e) {}
  },

  // 6. Download Success: Warm Acoustic Chime
  playDownloadSuccess() {
    if (isSfxMuted) return;
    try {
      const ctx = getAudioContext();
      const dest = getDestination();
      if (!ctx || !dest) return;
      const now = ctx.currentTime;

      const chord = [293.66, 369.99, 440.0, 587.33, 880.0];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.75);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.8);
      });
    } catch (e) {}
  },

  // 7. Full Theater Ambience (Warm Analog Cinema Drone - Hans Zimmer Inspired)
  toggleAmbient(onStateChange) {
    const ctx = getAudioContext();
    const dest = getDestination();
    if (!ctx || !dest) return false;

    if (isAmbientPlaying) {
      // Smooth Fade Out
      ambientNodes.forEach((node) => {
        if (node.gain) {
          try {
            node.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
          } catch (e) {}
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
      // Warm, Punchy, Audible Cinema Drone (Gain boosted to 0.35 with sub-bass)
      const now = ctx.currentTime;
      ambientNodes = [];

      const masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(360, now);

      const droneMasterGain = ctx.createGain();
      droneMasterGain.gain.setValueAtTime(0.0001, now);
      droneMasterGain.gain.linearRampToValueAtTime(0.38, now + 2.0); // Audible and warm!

      masterFilter.connect(droneMasterGain);
      droneMasterGain.connect(dest);

      // Harmonic Stack: D Minor Cinematic Triad (D2, A2, D3, F3, A3)
      const chords = [
        { freq: 73.42, gain: 0.35, detune: 0 },    // D2 Deep Sub Warmth
        { freq: 110.0,  gain: 0.28, detune: 0.4 },  // A2 Fifth Anchor
        { freq: 146.83, gain: 0.22, detune: -0.5 }, // D3 Octave Body
        { freq: 174.61, gain: 0.16, detune: 0.3 },  // F3 Minor Third Emotion
        { freq: 220.0,  gain: 0.12, detune: -0.2 }  // A3 High Air
      ];

      chords.forEach((c) => {
        const osc = ctx.createOscillator();
        const nodeGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(c.freq + c.detune, now);
        nodeGain.gain.setValueAtTime(c.gain, now);

        osc.connect(nodeGain);
        nodeGain.connect(masterFilter);
        osc.start(now);

        ambientNodes.push({ osc, gain: nodeGain });
      });

      ambientNodes.push({ gain: droneMasterGain });
      isAmbientPlaying = true;
      if (onStateChange) onStateChange(true);
      return true;
    }
  }
};
