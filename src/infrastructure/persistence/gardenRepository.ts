import { forestPlots } from '../../content/islands';
import { freshSave, parseSave } from '../../domain/gardening';
import type { Save } from '../../domain/gardening';
import { plots } from '../../content/garden';

export class GardenRepository {
  private db: IDBDatabase | null = null;
  private loadedSnapshot: string | undefined;
  constructor(private key = 'garden') {}
  async open(): Promise<void> {
    this.db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('mi-mundo-v2', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('saves');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('No se pudo abrir el guardado local.'));
      request.onblocked = () => reject(new Error('Cierra otras pestañas del jardín para actualizar el guardado.'));
    });
    this.db!.onversionchange = () => this.close();
  }
  async read(): Promise<Save> {
    if (!this.db) throw new Error('El guardado local no está disponible.');
    const data = await new Promise<unknown>((resolve, reject) => {
      const req = this.db!.transaction('saves').objectStore('saves').get(this.key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const save = data === undefined ? freshSave() : parseSave(data, [...plots,...forestPlots].map(p => p.id));
    this.loadedSnapshot = data === undefined ? undefined : JSON.stringify(data);
    return save;
  }
  async write(save: Save): Promise<void> {
    if (!this.db) throw new Error('El guardado local no está disponible. Exporta una copia antes de salir.');
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction('saves', 'readwrite');
      const store = tx.objectStore('saves');
      const check = store.get(this.key);
      let conflict = false;
      check.onsuccess = () => {
        if (JSON.stringify(check.result) !== this.loadedSnapshot) { conflict = true; tx.abort(); return; }
        store.put(save, this.key);
      };
      tx.oncomplete = () => { this.loadedSnapshot = JSON.stringify(save); resolve(); };
      tx.onerror = () => reject(new Error('No se pudo guardar. Inténtalo de nuevo o exporta una copia.'));
      tx.onabort = () => reject(new Error(conflict ? 'El jardín cambió en otra pestaña. Recarga para recuperar sus cambios.' : 'El guardado fue interrumpido.'));
    });
  }
  close(): void { this.db?.close(); this.db = null; }
}
