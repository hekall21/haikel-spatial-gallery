/* ==========================================================================
   HAIKEL SPATIAL ARCHIVE — PINNACLE CINEMA & SOUNDSCAPE ENGINE
   Dolby Atmos & THX Deep Sub Acoustics • Dynamic Limiter Compressor
   ========================================================================== */

class PinnacleAudioEngine {
  constructor() {
    this.ctx = null;
    this.compressor = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.filterNode = null;
    this.isPlayingAmbient = false;
    this.oscillators = [];
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    // Master Dynamic Compressor for Punchy Cinema Theater Sound
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.95, this.ctx.currentTime);

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.8, this.ctx.currentTime);
    this.filterNode.connect(this.compressor);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.ambientGain.connect(this.filterNode);
  }

  getDestination() {
    this.init();
    return this.compressor || this.ctx?.destination;
  }

  toggleGlobalAudio() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

    if (this.isPlayingAmbient) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  // 1. Dolby / IMAX Style Iconic Cinema Opening Boom ("BWWOOOMMM")
  playCinemaBoom() {
    try {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const dest = this.getDestination();

      // Deep Sub Drop (32Hz -> 75Hz -> 38Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(32, now);
      subOsc.frequency.exponentialRampToValueAtTime(75, now + 0.6);
      subOsc.frequency.exponentialRampToValueAtTime(38, now + 2.8);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.75, now + 0.4);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      subOsc.connect(subGain);
      subGain.connect(dest);
      subOsc.start(now);
      subOsc.stop(now + 3.3);

      // Low-Mid Harmonic Swell
      const midOsc = this.ctx.createOscillator();
      const midGain = this.ctx.createGain();
      const midFilter = this.ctx.createBiquadFilter();

      midOsc.type = 'triangle';
      midOsc.frequency.setValueAtTime(65, now);
      midOsc.frequency.exponentialRampToValueAtTime(130, now + 0.8);
      midOsc.frequency.exponentialRampToValueAtTime(82, now + 2.6);

      midFilter.type = 'lowpass';
      midFilter.frequency.setValueAtTime(180, now);
      midFilter.frequency.exponentialRampToValueAtTime(600, now + 0.7);
      midFilter.frequency.exponentialRampToValueAtTime(120, now + 2.8);

      midGain.gain.setValueAtTime(0.001, now);
      midGain.gain.linearRampToValueAtTime(0.5, now + 0.5);
      midGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);

      midOsc.connect(midFilter);
      midFilter.connect(midGain);
      midGain.connect(dest);
      midOsc.start(now);
      midOsc.stop(now + 3.0);

      // Shimmering High Harmonic Chime
      [440, 659.25, 880, 1318.5].forEach((freq, i) => {
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, now + 0.2 + i * 0.08);

        chimeGain.gain.setValueAtTime(0.0001, now + 0.2 + i * 0.08);
        chimeGain.gain.linearRampToValueAtTime(0.16, now + 0.35 + i * 0.08);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4 + i * 0.08);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(dest);
        chimeOsc.start(now + 0.2 + i * 0.08);
        chimeOsc.stop(now + 2.5 + i * 0.08);
      });
    } catch (e) {
      console.warn('[Audio] playCinemaBoom error', e);
    }
  }

  // 2. Continuous Cinema Ambience Drone
  startAmbient() {
    if (this.isPlayingAmbient) return;
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlayingAmbient = true;

    // Powerful, Rich D-Minor Triad & Sub (Hans Zimmer Style)
    const frequencies = [36.71, 73.42, 110.00, 146.83, 174.61, 220.00];
    const now = this.ctx.currentTime;

    this.oscillators = frequencies.map((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 0 ? 'sine' : (i % 2 === 0 ? 'sine' : 'triangle');
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 12, now);

      const level = i === 0 ? 0.45 : (0.35 / (i * 0.7 + 0.8));
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(level, now + 1.5);

      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start(now);
      return { osc, gain };
    });

    this.ambientGain.gain.setValueAtTime(0.0, now);
    this.ambientGain.gain.linearRampToValueAtTime(0.9, now + 1.5);

    const toggle = document.getElementById('audio-hud-toggle');
    if (toggle) toggle.classList.add('playing');
  }

  stopAmbient() {
    if (!this.isPlayingAmbient) return;
    const now = this.ctx.currentTime;
    this.ambientGain.gain.linearRampToValueAtTime(0.0, now + 1.2);

    setTimeout(() => {
      this.oscillators.forEach(({ osc }) => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      this.oscillators = [];
      this.isPlayingAmbient = false;
    }, 1200);
  }

  modulateFilter(normY) {
    if (!this.ctx || !this.filterNode) return;
    const targetFreq = 400 + (1.0 - normY) * 1600;
    this.filterNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  // SFX 1: UI Crisp Glass Click
  playUiClick() {
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  // SFX 2: Sci-Fi Warp / Shuffle Whoosh
  playWarp() {
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.55);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {}
  }

  // SFX 3: Cinematic Camera Shutter (Photo Launch)
  playShutter() {
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  // SFX 4: Deep Cinematic Sub Drop (Video Launch)
  playSubDrop() {
    try {
      this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.6);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {}
  }
}

window.CinematicAudio = new PinnacleAudioEngine();
