/* ==========================================================================
   HAIKEL SPATIAL ARCHIVE — PINNACLE SOUND & SYNTHESIS ENGINE
   Dolby Atmos Grade Cinema Acoustics & Dynamic Bass Compressor
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

    // Master Compressor to boost loudness and prevent distortion
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
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

  startAmbient() {
    if (this.isPlayingAmbient) return;
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlayingAmbient = true;

    // Powerful, Rich Cinematic Drone (Hans Zimmer D-Minor Chord with Warm Analog Detune)
    const frequencies = [36.71, 73.42, 110.00, 146.83, 174.61, 261.63, 329.63];
    const now = this.ctx.currentTime;

    this.oscillators = frequencies.map((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 0 ? 'sine' : (i % 2 === 0 ? 'sine' : 'triangle');
      osc.frequency.setValueAtTime(freq, now);

      // Warm analog chorus detune
      osc.detune.setValueAtTime((Math.random() - 0.5) * 14, now);

      const level = i === 0 ? 0.45 : (0.35 / (i * 0.7 + 0.8));
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(level, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start(now);
      return { osc, gain };
    });

    this.ambientGain.gain.setValueAtTime(0.0, now);
    this.ambientGain.gain.linearRampToValueAtTime(0.95, now + 1.2);

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

    const toggle = document.getElementById('audio-hud-toggle');
    if (toggle) toggle.classList.remove('playing');
  }

  // Modulate filter cutoff on mouse/touch motion
  modulateFilter(normY) {
    if (!this.ctx || !this.filterNode) return;
    const targetFreq = 400 + (1.0 - normY) * 1600;
    this.filterNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  // SFX 1: UI Crisp Glass Click
  playUiClick() {
    try {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

      gain.gain.setValueAtTime(0.18, now);
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
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

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
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.25, now);
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
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.getDestination());
      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {}
  }
}

window.CinematicAudio = new PinnacleAudioEngine();
