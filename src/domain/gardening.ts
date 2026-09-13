import { validAvatarStyle } from './avatarStyle.ts';
import type { AvatarStyle } from './avatarStyle.ts';
export type Plant = {
  id: string;
  definitionId: 'moonflower' | 'starfern';
  plantedAt: number;
  wateredAt: number | null;
};

export type Save = {
  worldName?: string;
  avatarStyle?: AvatarStyle;
  createdAt?: number;
  schemaVersion: 1;
  avatar?: 'woman' | 'man';
  giftProgress?: { id: string; completed: number; response?: string };
  currentIsland?: 'garden' | 'forest';
  forestUnlocked?: boolean;
  forestRefuge?: boolean;
  forestStory?: boolean;
  plants: Record<string, Plant>;
  memoriesRead: string[];
  messages?: Record<string, string>;
};

export const GROWTH_MS = 6 * 60 * 60 * 1000;
export const freshSave = (createdAt?: number): Save => ({ schemaVersion: 1, ...(createdAt === undefined ? {} : {createdAt}), plants: {}, memoriesRead: [] });

export function stage(plant: Plant, now: number): 0 | 1 | 2 {
  const elapsed = Math.max(0, now - plant.plantedAt);
  const care = plant.wateredAt === null ? 0 : GROWTH_MS / 2;
  return elapsed + care >= GROWTH_MS ? 2 : plant.wateredAt !== null || elapsed >= GROWTH_MS / 3 ? 1 : 0;
}

export function plantSeed(save: Save, plotId: string, now: number): Save {
  if (save.plants[plotId]) throw new Error('Aquí ya crece una flor.');
  return { ...save, plants: { ...save.plants, [plotId]: {
    id: plotId, definitionId: plotId.startsWith('bosque-') ? 'starfern' : 'moonflower', plantedAt: now, wateredAt: null,
  } } };
}

export function waterPlant(save: Save, plotId: string, now: number): Save {
  const plant = save.plants[plotId];
  if (!plant) throw new Error('Primero planta una semilla.');
  if (plant.wateredAt !== null) throw new Error('Ya tiene agua. Déjala crecer con calma.');
  return { ...save, plants: { ...save.plants, [plotId]: { ...plant, wateredAt: Math.max(now, plant.plantedAt) } } };
}

export function parseSave(input: unknown, plotIds: readonly string[]): Save {
  if (!input || typeof input !== 'object') throw new Error('El archivo no contiene un jardín válido.');
  const s = input as Partial<Save>;
  if(s.worldName !== undefined && (typeof s.worldName !== 'string' || !s.worldName.trim() || s.worldName.length>24)) throw new Error('El nombre admite de 1 a 24 caracteres.');
  if(s.avatarStyle !== undefined && !validAvatarStyle(s.avatarStyle)) throw new Error('Aspecto de avatar no válido.');
  if (s.createdAt !== undefined && (!Number.isFinite(s.createdAt) || s.createdAt < 0)) throw new Error('Fecha del jardín no válida.');
  if (s.schemaVersion !== 1) throw new Error('Esta versión de la partida no es compatible. Conserva tu copia.');
  if (s.avatar !== undefined && s.avatar !== 'woman' && s.avatar !== 'man') throw new Error('Avatar no válido.');
  if (s.giftProgress !== undefined && (!s.giftProgress || typeof s.giftProgress.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(s.giftProgress.id) || !Number.isInteger(s.giftProgress.completed) || s.giftProgress.completed < 0 || s.giftProgress.completed > 4)) throw new Error('Progreso de regalo no válido.');
  if (s.giftProgress?.response !== undefined && (typeof s.giftProgress.response !== 'string' || s.giftProgress.response.length > 500)) throw new Error('La respuesta admite hasta 500 caracteres.');
  if (!s.plants || typeof s.plants !== 'object' || Array.isArray(s.plants) || !Array.isArray(s.memoriesRead)) throw new Error('Partida incompleta.');
  for (const [id, p] of Object.entries(s.plants)) {
    if (!plotIds.includes(id) || !p || p.id !== id || p.definitionId !== (id.startsWith('bosque-') ? 'starfern' : 'moonflower')
      || !Number.isFinite(p.plantedAt) || p.plantedAt < 0
      || (p.wateredAt !== null && (!Number.isFinite(p.wateredAt) || p.wateredAt < p.plantedAt))) {
      throw new Error('La partida contiene una planta no válida.');
    }
  }
  if (!s.memoriesRead.every(x => typeof x === 'string')) throw new Error('Recuerdos no válidos.');
  if (s.messages !== undefined && (!s.messages || typeof s.messages !== 'object' || Array.isArray(s.messages)
    || Object.keys(s.messages).length > 100
    || Object.entries(s.messages).some(([id, text]) => !/^[a-z0-9-]{1,80}$/.test(id) || typeof text !== 'string' || text.length > 500))) {
    throw new Error('Los mensajes del jardín no son válidos (máximo 500 caracteres).');
  }
  if (s.currentIsland !== undefined && s.currentIsland !== 'garden' && s.currentIsland !== 'forest') throw new Error('Isla no válida.');
  for (const key of ['forestUnlocked','forestRefuge','forestStory'] as const) if (s[key] !== undefined && typeof s[key] !== 'boolean') throw new Error('Logros no válidos.');
  if (s.currentIsland === 'forest' && !s.forestUnlocked) throw new Error('El bosque no está desbloqueado en esta copia.');
  return structuredClone(s as Save);
}
