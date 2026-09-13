import type { GardenGame } from '../../application/gardenGame';
import type { User } from '@supabase/supabase-js';
import type { CloudSync } from '../../application/cloudSync';
import { supabase } from '../../infrastructure/cloud/supabase';
import { GardenRepository } from '../../infrastructure/persistence/gardenRepository';

export function downloadCopy(value: unknown, name: string): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `${name}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export class AccountPanel {
  private dialog: HTMLDialogElement;
  private button: HTMLButtonElement;
  private retry = 0;
  private debounce = 0;
  private email = '';
  private resendAt = 0;
  private abort = new AbortController();
  private busy = false;
  private localState: 'ready' | 'saving' | 'error' = 'ready';
  private localAt: string | null = null;
  private localError = '';
  private chosen: 'cloud' | 'local' | null = null;
  constructor(private user: User | null, private sync: CloudSync | null, pause: (paused: boolean) => void, private game?: GardenGame) {
    this.button = document.createElement('button');
    this.button.id = 'account'; this.button.className = 'icon-button account-button';
    this.button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 20 10a4 4 0 0 1-1 8Z"/><path d="m9 13 2 2 4-4"/></svg>'; this.button.title = 'Mi cuenta'; this.button.setAttribute('aria-label', 'Abrir mi cuenta');
    document.querySelector('.toolbar')!.prepend(this.button);
    this.dialog = document.createElement('dialog'); this.dialog.id = 'account-dialog'; this.dialog.className = 'settings-dialog account-dialog';
    this.dialog.setAttribute('aria-labelledby', 'account-title');
    this.dialog.innerHTML = `
      <button class="dialog-close icon-button" id="account-close" aria-label="Cerrar mi cuenta">×</button>
      <div class="account-sigil" aria-hidden="true">☁ ✧</div>
      <div class="eyebrow">UN HOGAR PARA TUS RECUERDOS</div><h2 id="account-title">Tu mundo, contigo</h2>
      <div class="save-overview" id="account-save-overview" role="status"></div>
      <section id="account-login">
        <button id="account-google" class="google-login" type="button"><span aria-hidden="true">G</span> Continuar con Google <span aria-hidden="true">↗</span></button>
        <p class="muted">Conecta tu cuenta para guardar en la nube e invitar a alguien.</p>
        <form id="account-email-form"><label for="account-email">Tu correo</label><input id="account-email" type="email" autocomplete="email" required maxlength="254" placeholder="tu@correo.com"><button class="primary" type="submit">Recibir código</button></form>
        <form id="account-code-form" hidden><p id="account-code-hint" class="muted">Revisa tu correo y escribe el código de acceso.</p><label for="account-code">Código de acceso</label><input id="account-code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" minlength="6" maxlength="10" required><button class="primary" type="submit">Entrar a mi mundo</button><button class="text-button" id="account-change-email" type="button">Cambiar correo o pedir otro código</button></form>
        <p class="account-note">Sin cuenta, tu jardín se guarda en este navegador.</p>
      </section>
      <section id="account-connected" hidden>
        <p id="account-identity" class="account-identity"></p><form id="world-name-form"><label for="world-name">Tu nombre en el jardín</label><input id="world-name" maxlength="24" required autocomplete="nickname"><button class="secondary">Guardar nombre</button></form><button id="account-signout" class="secondary">Cerrar sesión</button>
        <button id="account-sync" class="primary">Guardar en mi cuenta ahora</button>
        <div id="account-conflict" hidden><h3>Dos caminos del mismo jardín</h3><p class="muted">No mezclaremos ni reemplazaremos tus recuerdos sin tu elección. Puedes descargar ambas versiones primero.</p><div class="save-actions"><button id="account-export-remote" class="secondary">Descargar copia de la cuenta</button><button id="account-export-local" class="secondary">Descargar copia de aquí</button></div><div class="save-actions"><button id="account-use-cloud" class="secondary">Recuperar la cuenta</button><button id="account-use-local" class="secondary">Conservar este dispositivo</button></div></div>
        <div id="account-resolution" hidden><p id="account-resolution-copy"></p><button id="account-confirm" class="primary">Confirmar elección</button><button id="account-cancel" class="secondary">Cancelar</button></div>
        <div id="account-adopt" hidden><p class="muted">Esta cuenta aún no tiene un mundo guardado. ¿Quieres llevar el jardín que jugaste sin cuenta en este navegador?</p><button id="account-adopt-guest" class="secondary">Llevar mi jardín sin cuenta</button></div>
        <div class="settings-divider"></div><div id="account-recovery" hidden><label for="account-recovery-select">Copias de recuperación</label><select id="account-recovery-select"></select><button id="account-backups" class="secondary">Exportar copia de recuperación</button><p class="account-note">Puedes recuperar una versión anterior desde Ajustes.</p></div>

      </section><p id="account-feedback" role="status" aria-live="polite"></p>`;
    document.getElementById('app')!.append(this.dialog);
    const $ = <T extends HTMLElement = HTMLElement>(id: string) => this.dialog.querySelector<T>(`#${id}`)!;
    this.button.onclick = () => {
      document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(d => d.close());
      pause(true); this.render(); this.dialog.showModal();
    };
    const metadata = this.user?.user_metadata ?? {};
    const suggested = [metadata.given_name, metadata.full_name, metadata.name].find(value=>typeof value==='string' && value.trim());
    const name = this.game?.save.worldName ?? (typeof suggested==='string' ? suggested.trim().split(/\s+/)[0].slice(0,24) : 'Viajero');
    if(user) { document.getElementById('world-brand')!.textContent='Mundo de '+name; $<HTMLInputElement>('world-name').value=name; }
    $<HTMLFormElement>('world-name-form').onsubmit=event=>{event.preventDefault();void this.action(async()=>{await this.game?.setWorldName($<HTMLInputElement>('world-name').value);document.getElementById('world-brand')!.textContent='Mundo de '+this.game!.save.worldName;this.feedback('Nombre guardado.');});};
    if(!user) {
      let seen=false;try{seen=localStorage.getItem('mi-mundo-account-hint')==='seen';}catch{}
      if(!seen){
        const nudge=document.createElement('aside');nudge.className='account-nudge';nudge.setAttribute('aria-label','Conecta tu cuenta');
        nudge.innerHTML='<p>Conecta tu cuenta para llevar tu mundo contigo e invitar a alguien.</p><div><button class="secondary">Conectar</button><button class="text-button">Después</button></div>';
        const dismiss=()=>{try{localStorage.setItem('mi-mundo-account-hint','seen');}catch{}nudge.remove();};
        nudge.querySelector<HTMLButtonElement>('.secondary')!.onclick=()=>{dismiss();this.button.click();};nudge.querySelector<HTMLButtonElement>('.text-button')!.onclick=dismiss;
        this.button.addEventListener('click',dismiss,{signal:this.abort.signal});document.getElementById('app')!.append(nudge);
      }
    }
    $('account-close').onclick = () => this.dialog.close();
    this.dialog.addEventListener('close', () => pause(false));
    $('account-login').hidden = !!user; $('account-connected').hidden = !user;
    $('account-google').onclick = () => void this.action(async () => {
      this.feedback('Abriendo Google…');
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/' } });
      if (error) throw new Error('No se pudo abrir Google. Comprueba el proveedor y las URL autorizadas en Supabase.');
    });
    const settings = document.querySelector('#settings-dialog .save-actions')!;
    const accountLink = document.createElement('button'); accountLink.className = 'secondary'; accountLink.textContent = user ? 'Mi cuenta' : 'Conectar con Google'; accountLink.onclick = () => this.button.click(); settings.prepend(accountLink);
    const copy = document.querySelector('#settings-dialog .settings-divider + h3 + p');
    if (copy) copy.textContent = user ? 'Tu jardín se guarda aquí y se sincroniza con tu cuenta. Exporta una copia para conservar un respaldo independiente.' : 'Tu jardín se guarda en este navegador. Entra en Mi cuenta para activar el guardado entre dispositivos, o exporta una copia.';
    const overview = document.createElement('div'); overview.id = 'settings-save-overview'; overview.className = 'save-overview'; overview.setAttribute('role','status');
    settings.before(overview);
    if (copy) copy.textContent = 'El guardado es automático. Exportar crea una copia adicional para ti.';
    const saveState = document.getElementById('save-state')!;
    saveState.setAttribute('role', 'button'); saveState.tabIndex = 0;
    saveState.onclick = () => this.button.click(); saveState.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.button.click(); } };
    $<HTMLFormElement>('account-email-form').onsubmit = e => { e.preventDefault(); void this.action(async () => {
      if (Date.now() < this.resendAt) throw new Error('Espera un minuto antes de pedir otro código.');
      this.email = $<HTMLInputElement>('account-email').value.trim();
      const { error } = await supabase.auth.signInWithOtp({ email: this.email, options: { shouldCreateUser: true } });
      if (error) throw new Error(error.status === 429 ? 'Espera un momento antes de pedir otro correo.' : 'No se pudo enviar el código. Revisa la conexión e inténtalo de nuevo; si continúa, avisa a quien preparó el jardín.');
      this.resendAt = Date.now() + 60000; $('account-code-form').hidden = false; $('account-email-form').hidden = true;
      $('account-code-hint').textContent = `Escribe el código enviado a ${this.email}.`;
      this.feedback('Código solicitado. Revisa también la carpeta de correo no deseado.'); $('account-code').focus();
    }); };
    $('account-change-email').onclick = () => { $('account-email-form').hidden = false; $('account-code-form').hidden = true; this.feedback('Puedes cambiar el correo. Para otro envío, espera un minuto desde el anterior.'); };
    $<HTMLFormElement>('account-code-form').onsubmit = e => { e.preventDefault(); void this.action(async () => {
      const { error } = await supabase.auth.verifyOtp({ email: this.email, token: $<HTMLInputElement>('account-code').value.trim(), type: 'email' });
      if (error) throw new Error('El código no es válido o ya venció. Revisa el correo o solicita uno nuevo.');
      this.feedback('Tu cuenta está lista. Abriendo tu jardín…');
    }); };
    $('account-sync').onclick = () => void this.action(async () => { await sync?.sync(); });
    $('account-signout').onclick = () => void this.action(async () => {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw new Error('No se pudo cerrar la sesión. Revisa la conexión e inténtalo de nuevo.');
    });
    $('account-use-cloud').onclick = () => this.choose('cloud'); $('account-use-local').onclick = () => this.choose('local');
    $('account-cancel').onclick = () => { this.chosen = null; $('account-resolution').hidden = true; };
    $('account-confirm').onclick = () => void this.action(async () => {
      if (!sync || !this.chosen) return;
      const choice = this.chosen; await sync.resolve(choice);
      if (choice === 'local') await sync.sync();
      location.reload();
    });
    $('account-export-remote').onclick = () => { if (sync?.remote) downloadCopy(sync.remote.save, 'jardin-cuenta'); else this.feedback('No hay una copia descargada. Vuelve a comprobar la conexión.'); };
    $('account-export-local').onclick = () => document.getElementById('export')!.click();
    $('account-backups').onclick = () => {
      const backups = sync?.backups ?? [];
      if (!backups.length) { this.feedback('Todavía no hubo versiones reemplazadas en este dispositivo.'); return; }
      const index = Number($<HTMLSelectElement>('account-recovery-select').value);
      const backup = backups[index]; if (!backup) return;
      downloadCopy(backup.save, `jardin-recuperado-${index + 1}`);
      this.feedback('Copia preparada. Puedes importarla desde Ajustes.');
    };
    $('account-adopt-guest').onclick = () => void this.action(async () => {
      if (!sync?.canAdoptGuest) throw new Error('La cuenta ya tiene cambios. Usa Exportar e Importar para elegir otra copia.');
      const guest = new GardenRepository();
      try { await guest.open(); const save = await guest.read(); await sync.write(save); await sync.sync(); location.reload(); }
      finally { guest.close(); }
    });
    if (sync) {
      sync.onChange = () => {
        this.render();
        if (sync.status === 'pending' && !this.debounce) this.debounce = window.setTimeout(() => { this.debounce = 0; void sync.sync(); }, 5000);
      };
      this.retry = window.setInterval(() => { if (!document.hidden) void sync.sync(); }, 120000);
      window.addEventListener('online', () => void sync.sync(), { signal: this.abort.signal });
      document.addEventListener('visibilitychange', () => { if (sync.pending || !document.hidden) void sync.sync(); }, { signal: this.abort.signal });
    }
    window.addEventListener('offline', () => this.render(), { signal: this.abort.signal });
    window.addEventListener('online', () => this.render(), { signal: this.abort.signal });
    this.render();
  }
  private feedback(message: string): void { this.dialog.querySelector('#account-feedback')!.textContent = message; }
  private choose(choice: 'cloud' | 'local'): void {
    this.chosen = choice; this.dialog.querySelector<HTMLElement>('#account-resolution')!.hidden = false;
    this.dialog.querySelector('#account-resolution-copy')!.textContent = choice === 'cloud'
      ? 'Recuperarás la versión que tenga ahora tu cuenta. La partida de aquí quedará como copia local de recuperación.'
      : 'Se enviará el jardín de este dispositivo y reemplazará la versión actual de la cuenta. Esa versión quedará como copia local de recuperación.';
  }
  private async action(work: () => Promise<void>): Promise<void> {
    if (this.busy) return; this.busy = true;
    this.dialog.querySelectorAll<HTMLButtonElement>('button:not(#account-close)').forEach(b => b.disabled = true);
    this.feedback('Un momento…');
    try { await work(); if (this.dialog.querySelector('#account-feedback')!.textContent === 'Un momento…') this.feedback('Listo.'); }
    catch (e) { this.feedback(e instanceof Error ? e.message : 'No se pudo completar. Inténtalo de nuevo.'); }
    finally { this.busy = false; this.dialog.querySelectorAll<HTMLButtonElement>('button').forEach(b => b.disabled = false); this.render(); }
  }
  updateLocal(state: 'ready' | 'saving' | 'error', at: string | null, error = ''): void {
    this.localState = state; this.localAt = at; this.localError = error; this.render();
  }
  private render(): void {
    const syncState = this.sync;
    const labels = { checking: 'Comprobando cuenta', saved: 'Guardado en la nube', pending: 'Pendiente de subir', offline: 'Sin conexión · pendiente', error: 'Nube sin confirmar', conflict: 'Elegir versión', incoming: 'Recuperar mi jardín' };
    const state = this.localState === 'saving' ? 'Guardando en este dispositivo…' : this.localState === 'error' ? 'No se pudo guardar el último cambio' : !navigator.onLine && syncState?.pending ? 'Sin conexión · pendiente de subir' : syncState ? syncState.status === 'saved' && !syncState.syncedAt ? 'Cuenta lista · aún sin copia en la nube' : labels[syncState.status] : 'Guardado en este dispositivo';
    const format = (at: string | null) => at && Number.isFinite(Date.parse(at)) ? new Intl.DateTimeFormat('es', {dateStyle:'medium', timeStyle:'medium'}).format(new Date(at)) : 'Sin fecha registrada';
    const local = 'Último guardado aquí: ' + format(syncState?.localSavedAt ?? this.localAt);
    const cloud = this.user ? 'Última copia confirmada en la nube: ' + (syncState?.syncedAt ? format(syncState.syncedAt) : 'Todavía ninguna') : 'Sin cuenta · esta partida permanece en este navegador';
    for (const id of ['settings-save-overview', 'account-save-overview']) {
      const panel = document.getElementById(id); if (!panel) continue;
      const title = document.createElement('strong'); title.textContent = state;
      const date = document.createElement('span'); date.textContent = local;
      const detail = document.createElement('span'); detail.textContent = cloud;
      panel.replaceChildren(title,date,detail);
      if(this.localState === 'error') { const note = document.createElement('span'); note.textContent = this.localError; panel.append(note); }
    }
    document.getElementById('save-state')!.textContent = state;
    this.button.dataset.notice = String(this.localState === 'error' || !!syncState && syncState.status !== 'saved');
    this.button.title = state + ' · ' + local;

    if (!this.user || !this.sync) return;
    const sync = this.sync;
    this.dialog.querySelector('#account-identity')!.textContent = this.user.email ?? 'Tu cuenta';

    const needsChoice = sync.status === 'conflict' || sync.status === 'incoming';
    this.dialog.querySelector<HTMLElement>('#account-sync')!.hidden = needsChoice;
    this.dialog.querySelector<HTMLElement>('#account-conflict')!.hidden = !needsChoice;
    this.dialog.querySelector<HTMLElement>('#account-adopt')!.hidden = !sync.canAdoptGuest;
    this.dialog.querySelector<HTMLButtonElement>('#account-use-local')!.hidden = sync.status === 'incoming';
    const backups = sync.backups;
    this.dialog.querySelector<HTMLElement>('#account-recovery')!.hidden = !backups.length;
    const selector = this.dialog.querySelector<HTMLSelectElement>('#account-recovery-select')!;
    const previous = selector.value;
    selector.replaceChildren(...backups.map((copy, i) => new Option(new Date(copy.at).toLocaleString(), String(i))));
    selector.value = previous && Number(previous) < backups.length ? previous : String(backups.length - 1);

  }
  dispose(): void { clearInterval(this.retry); clearTimeout(this.debounce); this.abort.abort(); if (this.sync) this.sync.onChange = () => {}; document.querySelector('.account-nudge')?.remove(); this.dialog.remove(); this.button.remove(); }
}
