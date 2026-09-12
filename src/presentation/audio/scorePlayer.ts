import type { Instrument, Score } from '../../content/music';

/** A small look-ahead sequencer; audio is never generated on the rendering loop. */
export class ScorePlayer {
  private timer = 0;
  private step = 0;
  private nextTime = 0;
  private endTime = Infinity;
  private active = new Set<OscillatorNode>();
  private gain: GainNode;
  private dry: GainNode;
  private delay: DelayNode;
  private echo: GainNode;
  private feedback: GainNode;
  constructor(private context: AudioContext, volume: number) {
    this.gain = context.createGain(); this.gain.gain.value = volume;
    this.dry = context.createGain(); this.dry.gain.value = 0.72;
    this.delay = context.createDelay(2); this.delay.delayTime.value = 0.31;
    this.echo = context.createGain(); this.echo.gain.value = 0.18;
    this.feedback = context.createGain(); this.feedback.gain.value = 0.2;
    this.dry.connect(this.gain); this.dry.connect(this.delay); this.delay.connect(this.echo); this.echo.connect(this.gain);
    this.delay.connect(this.feedback); this.feedback.connect(this.delay); this.gain.connect(context.destination);
  }
  setVolume(volume: number): void { this.gain.gain.setTargetAtTime(volume, this.context.currentTime, 0.04); }
  start(score: Score, onEnd: () => void): void {
    this.stop(); this.step = 0; this.nextTime = this.context.currentTime + 0.06; this.endTime = Infinity;
    const stepDuration = 30 / score.bpm;
    const totalSteps = score.phrases.length * 8 * 2;
    const schedule = () => {
      while (this.step < totalSteps && this.nextTime < this.context.currentTime + 0.22) {
        const bar = Math.floor(this.step / 8), slot = this.step % 8;
        const chord = score.chords[bar % score.chords.length];
        const melody = score.phrases[bar % score.phrases.length][slot];
        const secondPass = bar >= score.phrases.length;
        if (melody !== null) this.note(melody, this.nextTime, score.instrument, 0.11, stepDuration * 3);
        const note = chord[[0, 2, 1, 3, 0, 2, 1, 3][slot]];
        this.note(note, this.nextTime + 0.025, 'harp', 0.033, stepDuration * 4);
        if (slot === 0) {
          this.pad(chord, this.nextTime, stepDuration * 7.5);
          if (secondPass && melody !== null) this.note(melody + 12, this.nextTime + 0.07, 'celesta', 0.024, stepDuration * 3);
        }
        this.step++; this.nextTime += stepDuration;
        if (this.step === totalSteps) this.endTime = this.nextTime + 3;
      }
      if (this.context.currentTime >= this.endTime) { this.stop(); onEnd(); }
    };
    this.timer = window.setInterval(schedule, 80); schedule();
  }
  private tone(frequency: number, when: number, duration: number, amplitude: number, attack: number, type: OscillatorType = 'sine'): void {
    const osc = this.context.createOscillator(), env = this.context.createGain();
    osc.type = type; osc.frequency.value = frequency;
    env.gain.setValueAtTime(0, when); env.gain.linearRampToValueAtTime(amplitude, when + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(attack + 0.01, duration));
    osc.connect(env); env.connect(this.dry); this.active.add(osc);
    osc.onended = () => { this.active.delete(osc); osc.disconnect(); env.disconnect(); };
    osc.start(when); osc.stop(when + duration + 0.05);
  }
  private note(midi: number, when: number, instrument: Instrument, amplitude: number, duration: number): void {
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const attack = instrument === 'piano' ? 0.012 : 0.006;
    this.tone(frequency, when, duration, amplitude, attack);
    this.tone(frequency * 2, when, duration * 0.55, amplitude * (instrument === 'celesta' ? 0.32 : 0.16), attack);
    this.tone(frequency * (instrument === 'celesta' ? 2.756 : 3), when, duration * 0.25, amplitude * 0.065, attack);
  }
  private pad(chord: readonly number[], when: number, duration: number): void {
    chord.forEach(midi => this.tone(440 * 2 ** ((midi - 69) / 12), when, duration, 0.024, 0.65));
  }
  stop(): void {
    clearInterval(this.timer); this.timer = 0;
    for (const osc of this.active) { try { osc.stop(); } catch { /* already ended */ } }
    this.active.clear();
  }
  dispose(): void { this.stop(); this.dry.disconnect(); this.delay.disconnect(); this.echo.disconnect(); this.feedback.disconnect(); this.gain.disconnect(); }
}
