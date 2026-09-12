export type PrivateGift = {
  id: string; firstName: string; fullName: string; dateLabel: string; age: number;
  dedication: string; message: string;
  songs: { title: string; artist: string; file?: string }[];
};
export const giftStops = ['letter-home', 'little-light', 'your-pace', 'tomorrow-door'] as const;
export function parseGift(input: unknown): PrivateGift {
  if (!input || typeof input !== 'object') throw new Error('Regalo no compatible.');
  const value = input as PrivateGift;
  for (const key of ['id', 'firstName', 'fullName', 'dateLabel', 'dedication', 'message'] as const) {
    if (typeof value[key] !== 'string' || !value[key].trim() || value[key].length > (key === 'message' ? 3000 : 240)) throw new Error('Regalo incompleto.');
  }
  if (!/^[a-z0-9-]{1,80}$/.test(value.id) || !Number.isInteger(value.age) || value.age < 1 || value.age > 120) throw new Error('Regalo no válido.');
  if (!Array.isArray(value.songs) || value.songs.length > 5 || value.songs.some(s => typeof s.title !== 'string' || typeof s.artist !== 'string' || s.title.length > 120 || s.artist.length > 120)) throw new Error('Canciones no válidas.');
  if (value.songs.some(s => s.file !== undefined && (typeof s.file !== 'string' || !/^[a-z0-9][a-z0-9.-]{0,120}\.(mp3|mpeg|m4a|ogg)$/i.test(s.file) || s.file.includes('..')))) throw new Error('Archivo de canción no válido.');
  return structuredClone(value);
}
