import { freshSave } from '../domain/gardening.ts';
import type { Save } from '../domain/gardening.ts';
import type { SavePort } from './gardenGame.ts';

export type Operation = { id: string; base: number; save: Save };
export type LocalWorld = {
  localSavedAt?: string;
  format: 1; save: Save; revision: number | null; dirty: boolean;
  operation: Operation | null; syncedAt: string | null;
  backups: { at: string; save: Save }[];
};
export type RemoteWorld = { save: Save; revision: number; operationId: string; updatedAt: string };
export interface LocalWorldPort {
  read(): Promise<LocalWorld | undefined>;
  put(expected: LocalWorld | undefined, next: LocalWorld): Promise<void>;
}
export interface CloudWorldPort {
  read(): Promise<RemoteWorld | null>;
  commit(operation: Operation): Promise<RemoteWorld>;
}
export type SyncStatus = 'checking' | 'saved' | 'pending' | 'offline' | 'conflict' | 'incoming' | 'error';
export const emptyWorld = (createdAt?: number): LocalWorld => ({ format: 1, save: freshSave(createdAt), revision: null, dirty: false, operation: null, syncedAt: null, backups: [] });
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Local commits are serialized; network requests never hold the local write queue. */
export class CloudSync implements SavePort {
  private local: LocalWorld | undefined;
  private queue: Promise<unknown> = Promise.resolve();
  private running: Promise<void> | null = null;
  status: SyncStatus = 'checking';
  message = 'Comprobando tu cuenta…';
  remote: RemoteWorld | null = null;
  onChange: () => void = () => {};
  private store: LocalWorldPort;
  private cloud: CloudWorldPort;
  private uuid: () => string;
  constructor(store: LocalWorldPort, cloud: CloudWorldPort, uuid = () => crypto.randomUUID()) { this.store = store; this.cloud = cloud; this.uuid = uuid; }
  get pending(): boolean { return !!this.local?.dirty; }
  get canAdoptGuest(): boolean { return this.status === 'saved' && this.local?.revision === 0 && !this.pending; }
  get syncedAt(): string | null { return this.local?.syncedAt ?? null; }
  get localSavedAt(): string | null { return this.local?.localSavedAt ?? null; }
  get backups(): LocalWorld['backups'] { return structuredClone(this.local?.backups ?? []); }
  private exclusive<T>(action: () => Promise<T>): Promise<T> {
    const next = this.queue.then(action); this.queue = next.catch(() => {}); return next;
  }
  private report(status: SyncStatus, message: string): void { this.status = status; this.message = message; this.onChange(); }
  private async persist(next: LocalWorld): Promise<void> {
    await this.store.put(this.local, next); this.local = structuredClone(next);
  }
  async read(): Promise<Save> {
    return this.exclusive(async () => {
      this.local = await this.store.read();
      if (!this.local) await this.persist({ ...emptyWorld(Date.now()), localSavedAt: new Date().toISOString() });
      this.report(this.pending ? 'pending' : 'checking', this.pending ? 'Cambios guardados aquí, pendientes de enviar.' : 'Comprobando tu cuenta…');
      return structuredClone(this.local!.save);
    });
  }
  async write(save: Save): Promise<void> {
    await this.exclusive(async () => {
      if (!this.local) throw new Error('Abre primero tu jardín.');
      if (this.status === 'incoming') throw new Error('Tu cuenta tiene otro jardín. Abre «Mi cuenta» para recuperarlo primero.');
      await this.persist({ ...this.local, save: structuredClone(save), dirty: true, localSavedAt: new Date().toISOString() });
      if (this.status !== 'conflict') this.report('pending', 'Guardado en este dispositivo. Preparando la copia en tu cuenta…');
      else this.onChange();
    });
  }
  sync(): Promise<void> {
    if (this.running) return this.running;
    if (this.status === 'conflict' || this.status === 'incoming') return Promise.resolve();
    this.running = this.performSync().finally(() => { this.running = null; });
    return this.running;
  }
  private async acknowledge(remote: RemoteWorld, operation: Operation): Promise<void> {
    const current = this.local!;
    if (current.operation?.id !== operation.id) return;
    await this.persist({ ...current, revision: remote.revision, operation: null,
      dirty: !same(current.save, operation.save), syncedAt: remote.updatedAt });
  }
  private async performSync(): Promise<void> {
    try {
      const remote = await this.cloud.read();
      const operation = await this.exclusive(async () => {
        if (!this.local) return null;
        this.remote = remote;
        if (remote && this.local.operation?.id === remote.operationId) await this.acknowledge(remote, this.local.operation);
        const revision = remote?.revision ?? 0;
        if (revision !== (this.local!.revision ?? 0)) {
          this.report(this.pending ? 'conflict' : 'incoming', this.pending
            ? 'Hay cambios aquí y en otro dispositivo. Elige qué jardín conservar.'
            : 'Tu cuenta tiene una versión más reciente. Abre tu cuenta para recuperarla.');
          return null;
        }
        if (this.local!.revision === null) await this.persist({ ...this.local!, revision });
        if (!this.pending) {
          this.report('saved', remote ? 'Tu jardín está guardado en tu cuenta.' : 'Cuenta lista. Tu próximo cambio se guardará aquí y en la nube.');
          return null;
        }
        if (!this.local!.operation) await this.persist({ ...this.local!, operation: { id: this.uuid(), base: revision, save: structuredClone(this.local!.save) } });
        return structuredClone(this.local!.operation);
      });
      if (!operation) return;
      const saved = await this.cloud.commit(operation);
      await this.exclusive(async () => {
        await this.acknowledge(saved, operation);
        this.remote = saved;
        this.report(this.pending ? 'pending' : 'saved', this.pending ? 'Quedan cambios locales por enviar.' : 'Tu jardín está guardado en tu cuenta.');
      });
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === '40001') this.report('conflict', 'Otro dispositivo guardó cambios. Elige una versión desde tu cuenta.');
      else this.report('error', error instanceof Error ? error.message : 'No se pudo conectar. Tu progreso local permanece en este dispositivo.');
    }
  }
  /** Explicit resolution only. Both versions remain exportable as local recovery copies. */
  async resolve(choice: 'cloud' | 'local'): Promise<Save> {
    if (this.running) await this.running;
    const remote = await this.cloud.read();
    return this.exclusive(async () => {
      if (!this.local) throw new Error('El guardado local no está disponible.');
      if (choice === 'cloud' && !remote) throw new Error('No se encontró una copia en tu cuenta.');
      const discarded = choice === 'cloud' ? this.local.save : remote?.save;
      const backups = discarded ? [...this.local.backups, { at: new Date().toISOString(), save: structuredClone(discarded) }].slice(-5) : this.local.backups;
      const save = choice === 'cloud' ? remote!.save : this.local.save;
      await this.persist({ ...this.local, save: structuredClone(save), localSavedAt: new Date().toISOString(), revision: remote?.revision ?? 0,
        operation: null, dirty: choice === 'local', syncedAt: choice === 'cloud' ? remote!.updatedAt : this.local.syncedAt, backups });
      this.remote = remote;
      this.report(choice === 'cloud' ? 'saved' : 'pending', choice === 'cloud' ? 'Jardín recuperado de tu cuenta.' : 'Tu elección está guardada aquí; falta enviarla a tu cuenta.');
      return structuredClone(save);
    });
  }
}
