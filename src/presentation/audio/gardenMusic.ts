import { musicTracks, nextTrackIndex, readMusicPreferences } from '../../content/music';
import { ScorePlayer } from './scorePlayer';

export class GardenMusic {
  index = 0;
  volume = 0.35;
  playing = false;
  loading = false;
  onChange: () => void = () => {};
  onError: (message: string) => void = () => {};
  private audio: HTMLAudioElement;
  private context: AudioContext | null = null;
  private score: ScorePlayer | null = null;
  private version = 0;
  private disposed = false;
  constructor() {
    let raw: string | null = null;
    try { raw = localStorage.getItem('mi-mundo-music'); } catch { /* preference storage is optional */ }
    const prefs = readMusicPreferences(raw);
    this.index = musicTracks.findIndex(t => t.id === prefs.trackId); this.volume = prefs.volume;
    this.audio = new Audio(); this.audio.preload = 'none'; this.audio.volume = this.volume;
    this.audio.onended = () => { if (this.playing) void this.next(1); };
    this.audio.onerror = () => {
      if (this.playing && this.track.kind === 'file') { this.playing = false; this.loading = false; this.onChange(); this.onError('No se pudo cargar esta canción. Prueba una de las melodías del jardín.'); }
    };
    document.addEventListener('visibilitychange', this.visibility);
  }
  get track() { return musicTracks[this.index]; }
  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value)); this.audio.volume = this.volume; this.score?.setVolume(this.volume); this.persist(); this.onChange();
  }
  async select(id: string): Promise<void> {
    const index = musicTracks.findIndex(t => t.id === id); if (index < 0 || index === this.index) return;
    const resume = this.playing;
    this.stopSource(); this.index = index; this.playing = false; this.persist(); this.onChange();
    if (resume) await this.play();
  }
  async next(direction: number): Promise<void> { await this.select(musicTracks[nextTrackIndex(this.index, musicTracks.length, direction)].id); }
  async toggle(): Promise<void> {
    if (this.playing) {
      ++this.version; this.playing = false; this.loading = false; this.audio.pause(); await this.context?.suspend(); this.onChange();
    } else await this.play();
  }
  private async play(): Promise<void> {
    const version = ++this.version; this.playing = true; this.loading = true; this.onChange();
    try {
      if (this.track.kind === 'file') {
        this.score?.dispose(); this.score = null; await this.context?.suspend();
        if (version !== this.version || this.disposed) return;
        const url = new URL(`${import.meta.env.BASE_URL}${this.track.path}`, location.href).href;
        if (this.audio.src !== url) this.audio.src = url;
        await this.audio.play();
      } else {
        this.audio.pause();
        this.context ??= new AudioContext();
        await this.context.resume();
        if (version !== this.version || this.disposed) return;
        if (!this.score) {
          this.score = new ScorePlayer(this.context, this.volume);
          this.score.start(this.track.score, () => { if (this.playing) void this.next(1); });
        }
      }
      if (version !== this.version || this.disposed) return;
      this.loading = false; this.onChange();
      if (document.hidden) { this.audio.pause(); await this.context?.suspend(); }
    } catch {
      if (version !== this.version || this.disposed) return;
      this.playing = false; this.loading = false; this.onChange(); this.onError('No se pudo iniciar la música. Toca Reproducir para intentarlo de nuevo.');
    }
  }
  private stopSource(): void {
    ++this.version; this.loading = false; this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); this.score?.dispose(); this.score = null;
  }
  private persist(): void { try { localStorage.setItem('mi-mundo-music', JSON.stringify({ trackId: this.track.id, volume: this.volume })); } catch { /* playing never depends on preference storage */ } }
  private visibility = (): void => {
    if (document.hidden) { this.audio.pause(); void this.context?.suspend(); }
    else if (this.playing) void this.play();
  };
  dispose(): void {
    this.disposed = true; this.playing = false; this.stopSource(); this.audio.onended = null; this.audio.onerror = null;
    document.removeEventListener('visibilitychange', this.visibility); void this.context?.close();
  }
}
