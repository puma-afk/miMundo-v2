import { forestPlots } from '../content/islands.ts';
import { canVisitForest } from '../domain/achievements.ts';
import { freshSave, plantSeed, waterPlant, stage, parseSave } from '../domain/gardening.ts';
const allPlots = [...plots, ...forestPlots];
import type { Save } from '../domain/gardening.ts';
import { plots } from '../content/garden.ts';
import { findStory } from '../content/stories.ts';
import { giftStops } from '../domain/privateGift.ts';

export interface SavePort { read(): Promise<Save>; write(save: Save): Promise<void> }
export class GardenGame {
  save = freshSave();
  busy = false;
  private repository: SavePort;
  private now: () => number;
  constructor(repository: SavePort, now = () => Date.now()) { this.repository = repository; this.now = now; }
  async load(): Promise<void> { this.save = await this.repository.read(); }
  async setAvatar(avatar: 'woman' | 'man'): Promise<void> { await this.commit({ ...this.save, avatar }); }
  async saveGiftResponse(id: string, response: string): Promise<void> {
    const progress = this.save.giftProgress;
    if (!progress || progress.id !== id || progress.completed < 3) throw new Error('Encuentra primero las pistas.');
    if (progress.response?.trim()) throw new Error('Esta respuesta ya está cerrada.');
    if (!response.trim()) throw new Error('Escribe tu respuesta antes de guardarla.');
    if (response.length > 500) throw new Error('Escribe hasta 500 caracteres.');
    await this.commit({ ...this.save, giftProgress: { ...progress, completed: 4, response: response.trim() }, memoriesRead: [...new Set([...this.save.memoriesRead, giftStops[3]])] });
  }
  async completeGiftStep(id: string, step: number): Promise<void> {
    const completed = this.save.giftProgress?.id === id ? this.save.giftProgress.completed : 0;
    if (!/^[a-z0-9-]{1,80}$/.test(id) || !Number.isInteger(step) || step < 0 || step >= giftStops.length || step > completed) throw new Error('Encuentra primero la pista anterior.');
    if (step < completed) return;
    await this.commit({ ...this.save, giftProgress: { id, completed: step + 1 }, memoriesRead: [...new Set([...this.save.memoriesRead, giftStops[step]])] });
  }
  getStage(id: string): number { return this.save.plants[id] ? stage(this.save.plants[id], this.now()) : -1; }
  async act(id: string): Promise<string> {
    if (this.busy) throw new Error('Espera un momento…');
    if (!allPlots.some(p => p.id === id)) throw new Error('Este lugar no se puede plantar.');
    if (id.startsWith('bosque-') && !canVisitForest(this.save,this.now())) throw new Error('Completa los logros del jardín para visitar el bosque.');
    const existing = this.save.plants[id];
    const next = existing ? waterPlant(this.save, id, this.now()) : plantSeed(this.save, id, this.now());
    await this.commit(next);
    if (id.startsWith('bosque-')) return existing ? 'Tu helecho estelar recibió agua.' : 'Has plantado un helecho estelar.';
    return existing ? 'Un poco de agua, un poco de magia. Tu flor está creciendo.' : 'Has plantado una flor de luna. Acércate para regarla.';
  }
  async readMemory(id: string): Promise<void> {
    if (!findStory(id)) throw new Error('Este recuerdo todavía no forma parte del jardín.');
    if (!this.save.memoriesRead.includes(id)) await this.commit({ ...this.save, memoriesRead: [...this.save.memoriesRead, id] });
  }
  async import(data: unknown): Promise<void> { await this.commit(parseSave(data, allPlots.map(p => p.id))); }
  async setMessage(id: string, text: string): Promise<void> {
    if (!findStory(id) && !(allPlots.some(p => p.id === id) && this.save.plants[id])) throw new Error('Elige un objeto o una flor plantada.');
    if (text.length > 500) throw new Error('Escribe hasta 500 caracteres.');
    const messages = { ...this.save.messages };
    if (text.trim()) messages[id] = text.trim(); else delete messages[id];
    await this.commit({ ...this.save, messages });
  }
  async travel(island: 'garden' | 'forest'): Promise<void> {
    if (island === 'forest' && !canVisitForest(this.save,this.now())) throw new Error('Todavía faltan logros para abrir el arco.');
    await this.commit({...this.save,currentIsland:island,forestUnlocked:this.save.forestUnlocked || island === 'forest'});
  }
  async forestAction(kind: 'refuge' | 'story'): Promise<void> {
    if (this.save.currentIsland !== 'forest' || !this.save.forestUnlocked) throw new Error('Visita primero el Bosque Lunar.');
    if (kind === 'refuge' && forestPlots.filter(p=>this.save.plants[p.id]).length<2) throw new Error('Planta dos helechos para devolver vida al refugio.');
    await this.commit({...this.save,...(kind === 'refuge' ? {forestRefuge:true} : {forestStory:true})});
  }
  private async commit(next: Save): Promise<void> {
    const sealed = this.save.giftProgress;
    if (sealed?.response?.trim() && (next.giftProgress?.id !== sealed.id || next.giftProgress?.response !== sealed.response)) throw new Error('Esta respuesta ya está cerrada.');
    if (this.busy) throw new Error('Espera a que termine el guardado.');
    this.busy = true;
    try { await this.repository.write(next); this.save = next; }
    finally { this.busy = false; }
  }
}
