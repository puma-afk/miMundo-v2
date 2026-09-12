import type { LocalWorld, LocalWorldPort } from '../../application/cloudSync.ts';
import { parseSave } from '../../domain/gardening.ts';
import { plots } from '../../content/garden.ts';
import { forestPlots } from '../../content/islands.ts';

export const validateGarden = (value: unknown) => parseSave(value, [...plots, ...forestPlots].map(p => p.id));
export class AccountStore implements LocalWorldPort {
  private db: IDBDatabase | null = null;
  private key: string;
  constructor(userId: string) { this.key = `account:${userId}`; }
  async open(): Promise<void> {
    this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('mi-mundo-accounts', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('worlds');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error('No se pudo abrir el guardado local de tu cuenta.'));
      req.onblocked = () => reject(new Error('Cierra otras pestañas para abrir tu cuenta.'));
    });
    this.db!.onversionchange = () => this.close();
  }
  async read(): Promise<LocalWorld | undefined> {
    if (!this.db) throw new Error('El guardado local no está disponible.');
    const data = await new Promise<LocalWorld | undefined>((resolve, reject) => {
      const req = this.db!.transaction('worlds').objectStore('worlds').get(this.key);
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    });
    if (data) {
      if (data.format !== 1 || (data.revision !== null && (!Number.isSafeInteger(data.revision) || data.revision < 0))
        || typeof data.dirty !== 'boolean' || !Array.isArray(data.backups)) throw new Error('La copia local de la cuenta no es compatible. Conserva los datos de este navegador.');
      validateGarden(data.save);
      if (data.operation) validateGarden(data.operation.save);
      for (const backup of data.backups) validateGarden(backup.save);
    }
    return data;
  }
  async put(expected: LocalWorld | undefined, next: LocalWorld): Promise<void> {
    if (!this.db) throw new Error('No se puede guardar en este navegador.');
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction('worlds', 'readwrite'), store = tx.objectStore('worlds');
      let conflict = false;
      const req = store.get(this.key);
      req.onsuccess = () => {
        if (JSON.stringify(req.result) !== JSON.stringify(expected)) { conflict = true; tx.abort(); return; }
        store.put(next, this.key);
      };
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(new Error(conflict ? 'La cuenta cambió en otra pestaña. Recarga antes de seguir; no se sobrescribió su progreso.' : 'No se pudo guardar. Exporta una copia antes de salir.'));
    });
  }
  close(): void { this.db?.close(); this.db = null; }
}
