// Web Audio API Sound Synthesizer for a loud, bold, industrial-grade
// emergency collision klaxon — modeled after heavy-mining-equipment
// reversing alarms and safety horns, not a soft chime.
class SoundEffectsManager {
  private audioCtx: AudioContext | null = null;
  private alarmInterval: ReturnType<typeof setInterval> | null = null;
  private masterGain: GainNode | null = null;

  private initCtx() {
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private makeDistortionCurve(amount: number) {
    const k = amount;
    const n = 44100;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Loud, bold, industrial emergency collision klaxon — two-tone blast pattern
  public startCollisionBuzzer() {
    this.initCtx();
    if (!this.audioCtx || !this.masterGain) return;
    if (this.alarmInterval) return;

    let high = true;
    const playIndustrialBlast = () => {
      if (!this.audioCtx || !this.masterGain) return;
      const now = this.audioCtx.currentTime;

      const osc1 = this.audioCtx.createOscillator();
      const osc2 = this.audioCtx.createOscillator();
      const subOsc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const shaper = this.audioCtx.createWaveShaper();
      shaper.curve = this.makeDistortionCurve(55);
      shaper.oversample = '4x';

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      subOsc.type = 'square';

      const freq = high ? 1000 : 760;
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.01, now);
      subOsc.frequency.setValueAtTime(freq * 0.5, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(1.0, now + 0.015);
      gain.gain.setValueAtTime(1.0, now + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc1.connect(shaper);
      osc2.connect(shaper);
      subOsc.connect(gain);
      shaper.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      subOsc.start(now);
      osc1.stop(now + 0.29);
      osc2.stop(now + 0.29);
      subOsc.stop(now + 0.29);

      high = !high;
    };

    playIndustrialBlast();
    this.alarmInterval = setInterval(playIndustrialBlast, 280);
  }

  public stopCollisionBuzzer() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
  }

  public playWatchdogAlertBeep() {
    this.initCtx();
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const sub = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sawtooth';
    sub.type = 'square';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.45);
    sub.frequency.setValueAtTime(550, now);
    sub.frequency.exponentialRampToValueAtTime(150, now + 0.45);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.9, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.46);
    sub.stop(now + 0.46);
  }
}

export const soundEffects = new SoundEffectsManager();
