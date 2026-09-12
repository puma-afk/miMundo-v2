import { supabase } from '../../infrastructure/cloud/supabase';

export function mountVisitSharing(pause: (value: boolean) => void): void {
  const trigger = document.createElement('button'); trigger.className = 'icon-button'; trigger.textContent = '↗'; trigger.setAttribute('aria-label', 'Compartir mi jardín');
  document.querySelector('.toolbar')!.append(trigger);
  const dialog = document.createElement('dialog'); dialog.className = 'settings-dialog'; dialog.setAttribute('aria-labelledby', 'visit-title');
  dialog.innerHTML = '<button class="dialog-close icon-button" aria-label="Cerrar visitas">×</button><h2 id="visit-title">Abre las puertas de tu isla</h2><p>Comparte una copia del jardín que ya guardaste en tu cuenta. Cualquiera con el enlace podrá explorar sin registrarse.</p><p>Tu carta, respuesta y mensajes personales permanecen privados. Las visitas no pueden cambiar tu mundo.</p><button class="primary" id="visit-publish">Crear / actualizar enlace</button><label for="visit-url">Tu enlace de visita</label><input id="visit-url" readonly placeholder="Aquí aparecerá el enlace"><button class="secondary" id="visit-revoke">Desactivar enlace</button><p id="visit-status" role="status"></p>';
  document.getElementById('app')!.append(dialog);
  trigger.onclick = () => { document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(d => d.close()); pause(true); dialog.showModal(); };
  dialog.querySelector<HTMLButtonElement>('.dialog-close')!.onclick = () => dialog.close(); dialog.onclose = () => pause(false);
  const status = dialog.querySelector<HTMLElement>('#visit-status')!;
  const field = dialog.querySelector<HTMLInputElement>('#visit-url')!;
  const run = async (publish: boolean) => {
    const buttons = dialog.querySelectorAll<HTMLButtonElement>('#visit-publish,#visit-revoke'); buttons.forEach(b => b.disabled = true);
    try {
      const { data, error } = await supabase.rpc(publish ? 'publish_my_visit' : 'revoke_my_visit');
      if (error) throw new Error('No se pudo completar. Guarda primero en tu cuenta y comprueba que la migración de visitas esté instalada.');
      field.value = publish ? `${location.origin}/?visit=${data}` : '';
      status.textContent = publish ? 'Enlace listo. Copia la dirección y compártela. Para mostrar nuevos cambios, guarda en tu cuenta y actualiza este enlace.' : 'Enlace desactivado. Ya no permitirá nuevas visitas.';
      if (publish) { field.focus(); field.select(); }
    } catch (e) { status.textContent = e instanceof Error ? e.message : 'No se pudo completar.'; }
    finally { buttons.forEach(b => b.disabled = false); }
  };
  dialog.querySelector<HTMLButtonElement>('#visit-publish')!.onclick = () => void run(true);
  dialog.querySelector<HTMLButtonElement>('#visit-revoke')!.onclick = () => void run(false);
}
