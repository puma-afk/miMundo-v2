export type Instrument = 'harp' | 'celesta' | 'piano';
export type Score = {
  bpm: number;
  instrument: Instrument;
  // MIDI notes. Eight half-beat steps per bar; null is a rest.
  phrases: readonly (readonly (number | null)[])[];
  chords: readonly (readonly number[])[];
};
export type MusicTrack = {
  id: string;
  title: string;
  description: string;
  mood: 'dawn' | 'night' | 'clouds' | 'personal';
} & ({ kind: 'score'; score: Score } | { kind: 'file'; path: string });

export const musicTracks: readonly MusicTrack[] = [
  {
    id: 'leaves', title: 'Luz entre hojas', description: 'Arpa suave · un paseo bajo el árbol', mood: 'dawn', kind: 'score',
    score: {
      bpm: 72, instrument: 'harp',
      chords: [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]],
      phrases: [[72, null, 76, 79, 76, null, 74, 72], [69, null, 72, 76, 74, 72, 69, null], [65, 69, 72, null, 77, 76, 72, 69], [67, null, 71, 74, 79, 74, 71, null], [76, 79, 84, null, 79, 76, 74, 72], [76, null, 72, 69, 72, 76, 81, null], [77, 76, 72, 69, 65, null, 69, 72], [74, 71, 67, null, 72, null, null, null]],
    },
  },
  {
    id: 'fireflies', title: 'Danza de luciérnagas', description: 'Celesta y acordes largos · para mirar las estrellas', mood: 'night', kind: 'score',
    score: {
      bpm: 60, instrument: 'celesta',
      chords: [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 62]],
      phrases: [[81, null, 76, null, 72, 74, 76, null], [77, null, 72, 69, 72, null, 76, null], [79, 76, null, 72, 76, null, 84, null], [79, null, 74, null, 71, 74, 76, null], [81, 84, 88, null, 84, null, 81, 76], [77, 81, null, 84, 81, null, 77, null], [79, 76, 72, null, 76, 79, 84, null], [83, 79, 74, null, 81, null, null, null]],
    },
  },
  {
    id: 'clouds', title: 'Camino de nubes', description: 'Piano delicado · curiosidad y nuevos comienzos', mood: 'clouds', kind: 'score',
    score: {
      bpm: 84, instrument: 'piano',
      chords: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]],
      phrases: [[74, 78, 81, null, 78, 76, 74, null], [71, 74, 78, 81, 83, null, 81, 78], [79, null, 78, 74, 71, 74, 79, null], [76, 73, 69, null, 73, 76, 81, null], [86, null, 81, 78, 81, 78, 76, 74], [83, 81, 78, null, 74, 78, 81, null], [79, 83, 86, null, 83, 79, 78, 74], [76, 73, 69, null, 74, null, null, null]],
    },
  },
  { id: 'personal', title: 'Tu canción del jardín', description: 'La pista de audio de tu proyecto original', mood: 'personal', kind: 'file', path: 'assets/audio/pista1.mp3' },
];

export function nextTrackIndex(index: number, length: number, direction: number): number {
  return ((index + direction) % length + length) % length;
}

export function readMusicPreferences(raw: string | null): { trackId: string; volume: number } {
  const defaults = { trackId: musicTracks[0].id, volume: 0.35 };
  try {
    const data = raw ? JSON.parse(raw) : null;
    if (!data || typeof data !== 'object') return defaults;
    return {
      trackId: musicTracks.some(t => t.id === data.trackId) ? data.trackId : defaults.trackId,
      volume: typeof data.volume === 'number' && Number.isFinite(data.volume) ? Math.max(0, Math.min(1, data.volume)) : defaults.volume,
    };
  } catch { return defaults; }
}
