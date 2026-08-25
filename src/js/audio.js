// ==========================================================================
// HAIKEL SPATIAL NOIR GALLERY — AUDIO & WAVEFORM ENGINE
// Procedural Web Audio API Synthesizer & Real-Time Waveform Visualizer
// ==========================================================================

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ambientGain = null;
    this.masterGain = null;
    this.analyser = null;
    this.ambientNodes = [];
    this.isPlaying = false;
    this.isMuted = false;
    this.visualizerAnimationId = null;
  }

  // 1. AudioContext Initialization & Resumption
  getContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

        // Connect Analyser for Live Waveform Rendering
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // 2. Procedural Noise Buffer Generator (for realistic acoustic friction)
  createNoiseBuffer(duration = 0.05) {
    const ctx = this.getContext();
    if (!ctx) return null;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // 3. Leica / Hasselblad Mechanical Camera Shutter SFX
  playShutter() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    try {
      // Noise burst (curtain glide)
      const noiseBuffer = this.createNoiseBuffer(0.04);
      if (noiseBuffer) {
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(1800, now);
        bandpass.Q.setValueAtTime(2.0, now);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.09, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        noiseSrc.connect(bandpass);
        bandpass.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noiseSrc.start(now);
      }

      // Chassis body resonance
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.05);

      subGain.gain.setValueAtTime(0.12, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 0.07);

      // Second curtain snap
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
          gain2.connect(this.masterGain);
          osc2.start(t);
          osc2.stop(t + 0.05);
        } catch (e) {}
      }, 45);
    } catch (e) {
      console.warn('Audio SFX Error', e);
    }
  }

  // 4. Soft Apple Haptic UI Tap
  playClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    try {
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
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  }

  // 5. Download Success Harmonic Chime
  playDownloadSuccess() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord = [293.66, 369.99, 440.0, 587.33]; // D Major Triad
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
      gain.connect(this.masterGain);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.65);
    });
  }

  // 6. Ethereal Cinematic Soundscape (Hans Zimmer / Michael Gatt Tone)
  toggleAmbient(callback) {
    const ctx = this.getContext();
    if (!ctx) return false;

    if (this.isPlaying) {
      // Smooth 1.2s Fade out
      this.ambientNodes.forEach(node => {
        if (node.gain) {
          node.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
        }
        setTimeout(() => {
          try {
            if (node.osc) node.osc.stop();
          } catch (e) {}
        }, 1300);
      });
      this.ambientNodes = [];
      this.isPlaying = false;
      if (callback) callback(false);
      return false;
    } else {
      // Harmonic Sine Drone (A1 55Hz, A2 110Hz, E3 164Hz, A3 220Hz)
      const now = ctx.currentTime;
      this.ambientNodes = [];

      const masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(280, now);

      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.0001, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.045, now + 2.5);

      masterFilter.connect(this.ambientGain);
      this.ambientGain.connect(this.masterGain);

      const freqs = [55.0, 110.0, 164.81, 220.0];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const nodeGain = ctx.createGain();
        osc.type = 'sine';
        const detune = idx === 1 ? 0.3 : idx === 2 ? -0.4 : 0;
        osc.frequency.setValueAtTime(freq + detune, now);
        nodeGain.gain.setValueAtTime(idx === 0 ? 0.06 : 0.035, now);

        osc.connect(nodeGain);
        nodeGain.connect(masterFilter);
        osc.start(now);

        this.ambientNodes.push({ osc, gain: nodeGain });
      });

      this.ambientNodes.push({ gain: this.ambientGain });
      this.isPlaying = true;
      if (callback) callback(true);
      return true;
    }
  }

  // 7. Real-Time Live Waveform Visualizer to Canvas
  attachWaveform(canvasElement) {
    if (!canvasElement) return;
    const canvasCtx = canvasElement.getContext('2d');
    const analyser = this.analyser;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.visualizerAnimationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      const barWidth = (canvasElement.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvasElement.height;

        // Sky-blue to Emerald gradient
        const gradient = canvasCtx.createLinearGradient(0, canvasElement.height, 0, 0);
        gradient.addColorStop(0, '#38bdf8');
        gradient.addColorStop(1, '#10b981');

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvasElement.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  }

  stopWaveform() {
    if (this.visualizerAnimationId) {
      cancelAnimationFrame(this.visualizerAnimationId);
      this.visualizerAnimationId = null;
    }
  }
}

export const audio = new AudioEngine();
