import { createClient } from '@supabase/supabase-js';
import { cloudConfig } from '../../content/cloud';
import type { CloudWorldPort, Operation, RemoteWorld } from '../../application/cloudSync.ts';
import { validateGarden } from '../persistence/accountStore';

// Bound every network request so offline play and closing a dialog never hang indefinitely.
const boundedFetch: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init?.signal?.aborted) abort();
  init?.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 10000);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timer); init?.signal?.removeEventListener('abort', abort);
  });
};
export const supabase = createClient(cloudConfig.url, cloudConfig.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
  global: { fetch: boundedFetch },
});
function remoteWorld(row: Record<string, unknown>): RemoteWorld {
  if (!Number.isSafeInteger(row.revision) || Number(row.revision) < 1 || typeof row.last_operation_id !== 'string' || typeof row.updated_at !== 'string') throw new Error('La copia de la cuenta no tiene un formato compatible.');
  return { save: validateGarden(row.save), revision: Number(row.revision), operationId: row.last_operation_id, updatedAt: row.updated_at };
}
export class SupabaseWorld implements CloudWorldPort {
  constructor(private owner: string) {}
  private async checkIdentity(): Promise<void> {
    const { data, error } = await supabase.auth.getSession();
    if (error || data.session?.user.id !== this.owner) throw new Error('Tu sesión cambió. Vuelve a entrar para sincronizar este jardín.');
  }
  async read(): Promise<RemoteWorld | null> {
    await this.checkIdentity();
    const { data, error } = await supabase.from('world_saves').select('save,revision,last_operation_id,updated_at').eq('owner_id', this.owner).maybeSingle();
    if (error) throw this.explain(error);
    return data ? remoteWorld(data) : null;
  }
  async commit(operation: Operation): Promise<RemoteWorld> {
    await this.checkIdentity();
    const { data, error } = await supabase.rpc('save_my_world', { p_owner_id: this.owner, p_save: operation.save, p_expected_revision: operation.base, p_operation_id: operation.id });
    if (error) throw this.explain(error);
    if (!data) throw new Error('La cuenta no confirmó el guardado. Se reintentará con la misma operación.');
    return remoteWorld(data);
  }
  private explain(error: { code?: string; message: string }): Error & { code?: string } {
    const message = ['PGRST205', 'PGRST202', '42P01', '42883'].includes(error.code ?? '')
      ? 'Falta activar las tablas del jardín en Supabase. Tu progreso sigue guardado aquí.'
      : error.code === '40001' ? 'Otro dispositivo guardó una versión nueva.'
      : 'No se pudo sincronizar con tu cuenta. Tu progreso permanece en este dispositivo; puedes reintentar.';
    return Object.assign(new Error(message), { code: error.code });
  }
}
