/* ==========================================================================
   HAIKEL SPATIAL ARCHIVE — PINNACLE SOUND & SYNTHESIS ENGINE
   ========================================================================== */

class PinnacleAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.filterNode = null;
    this.isPlayingAmbient = false;
    this.oscillators = [];
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(800, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(2.0, this.ctx.currentTime);
    this.filterNode.connect(this.masterGain);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.ambientGain.connect(this.filterNode);
  }

  toggleGlobalAudio() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

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
    this.isPlayingAmbient = true;

    // Rich cinematic chord (D minor 9: D2, A2, F3, C4, E4)
    const frequencies = [73.42, 110.00, 174.61, 261.63, 329.63];
    const now = this.ctx.currentTime;

    this.oscillators = frequencies.map((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle detune for lush chorus warmth
      osc.detune.setValueAtTime((Math.random() - 0.5) * 12, now);

      const level = 0.18 / (i + 1);
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(level, now + 3.0);

      osc.connect(gain);
      gain.connect(this.ambientGain);
      osc.start(now);
      return { osc, gain };
    });

    this.ambientGain.gain.setValueAtTime(0.0, now);
    this.ambientGain.gain.linearRampToValueAtTime(0.45, now + 2.5);
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
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);
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
      gain.gain.linearRampToValueAtTime(0.2, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain);
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

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);
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
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {}
  }
}

window.CinematicAudio = new PinnacleAudioEngine();
