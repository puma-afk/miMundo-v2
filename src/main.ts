import './presentation/ui/styles.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/playfair-display/latin-400.css';
import '@fontsource/playfair-display/latin-400-italic.css';
import { GardenRepository } from './infrastructure/persistence/gardenRepository';
import { GardenGame } from './application/gardenGame';
import { GardenWorld } from './presentation/world/gardenWorld';
import { GameInterface } from './presentation/ui/interface';
import { supabase, SupabaseWorld } from './infrastructure/cloud/supabase';
import { AccountStore } from './infrastructure/persistence/accountStore';
import { CloudSync } from './application/cloudSync';
import { AccountPanel } from './presentation/ui/accountPanel';
import { loadPrivateGift } from './infrastructure/cloud/privateGift';
import { validateGarden } from './infrastructure/persistence/accountStore';
import { mountVisitSharing } from './presentation/ui/visitPanel';
const navIcon = (kind: 'home' | 'preview' | 'restart' | 'exit') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{
  home: '<path d="m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9"/>',
  preview: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  restart: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  exit: '<path d="M10 4H4v16h6m4-13 5 5-5 5M9 12h10"/>'
}[kind]}</svg>`;

async function start(): Promise<void> {
  const visit = new URLSearchParams(location.search).get('visit');
  if (visit) {
    if (!/^[0-9a-f-]{36}$/i.test(visit)) throw new Error('Enlace de visita no válido.');
    const { data, error } = await supabase.rpc('read_world_visit', { p_token: visit });
    if (error || !data) throw new Error('Este enlace de visita no está disponible.');
    const snapshot = validateGarden(data);
    const game = new GardenGame({ read: async () => snapshot, write: async () => { throw new Error('Estás de visita. Solo la propietaria puede modificar este jardín.'); } });
    await game.load();
    const world = new GardenWorld(document.getElementById('world') as HTMLCanvasElement, game);
    const ui = new GameInterface(world, game, null, true);
    document.getElementById('app')!.classList.add('visiting');
    document.getElementById('intro-title')!.textContent = 'Te han abierto las puertas del jardín';
    const intro = document.querySelector('.intro p'); if (intro) intro.textContent = 'Pasea entre las nubes. Esta visita no cambia el mundo de su propietaria.';
    const back = document.createElement('a'); back.className = 'visit-home'; back.href = location.origin + '/'; back.innerHTML = navIcon('exit') + '<span>Salir de la visita</span>'; document.querySelector('.toolbar')!.append(back);
    await world.scene.whenReadyAsync(); ui.ready(); return;
  }
  const { data } = await supabase.auth.getSession();
  const preview = import.meta.env.DEV && new URLSearchParams(location.search).get('gift-preview') === '1';
  const user = preview ? null : data.session?.user ?? null;
  const run = new URLSearchParams(location.search).get('preview-run') ?? '';
  const previewKey = /^[a-z0-9-]{1,80}$/i.test(run) ? `gift-preview-${run}` : 'gift-preview';
  const repository = user ? new AccountStore(user.id) : new GardenRepository(preview ? previewKey : 'garden');
  const sync = user ? new CloudSync(repository as AccountStore, new SupabaseWorld(user.id)) : null;
  const savePort = sync ?? repository as GardenRepository;
  let sessionChanged = false;
  const subscription = supabase.auth.onAuthStateChange((_event, session) => {
    if (!preview && (session?.user.id ?? null) !== (user?.id ?? null)) { sessionChanged = true; location.reload(); }
  });
  const game = new GardenGame({ read: () => savePort.read(), write: save => {
    if (sessionChanged) return Promise.reject(new Error('Tu sesión cambió. Recarga antes de seguir.'));
    return savePort.write(save);
  } });
  let storageError: string | null = null;
  try { await repository.open(); await game.load();
    // Migrate the old browser preference only for the guest world, never into another account.
    if (!user && !game.save.avatar) {
      const oldAvatar = localStorage.getItem('mi-mundo-avatar');
      if (oldAvatar === 'woman' || oldAvatar === 'man') await game.setAvatar(oldAvatar);
    }
  }
  catch (e) { storageError = e instanceof Error ? e.message : 'El guardado no está disponible.'; }
  const world = new GardenWorld(document.getElementById('world') as HTMLCanvasElement, game);
  const gift = await loadPrivateGift(user?.id ?? null).catch(() => null);
  if (gift) world.configureGift(gift.id);
  const ui = new GameInterface(world, game, gift);
  const account = preview ? null : new AccountPanel(user, sync, paused => { world.paused = paused; world.previewSky = false; world.input.clear(); });
  if (import.meta.env.DEV && preview) {
    const cloud = document.createElement('button'); cloud.className = 'icon-button'; cloud.id = 'preview-account'; cloud.textContent = '☁'; cloud.title = 'Mi cuenta y guardado en nube'; cloud.setAttribute('aria-label', 'Volver a mi cuenta y guardado en nube');
    cloud.onclick = () => location.assign(location.origin + '/?account=1'); document.querySelector('.toolbar')!.prepend(cloud);
    const previewBar = document.createElement('div'); previewBar.className = 'gift-preview-bar';
    const label = document.createElement('span'); label.textContent = gift ? 'Vista previa del evento' : 'No se pudo cargar el evento local';
    const restart = document.createElement('button'); restart.innerHTML = navIcon('restart') + '<span>Probar desde el inicio</span>';
    restart.onclick = () => { const url = new URL(location.href); url.searchParams.set('preview-run', crypto.randomUUID()); location.assign(url); };
    const leave = document.createElement('a'); leave.href = location.origin + '/'; leave.innerHTML = navIcon('home') + '<span>Volver a mi mundo</span>';
    previewBar.append(label, restart, leave); document.getElementById('app')!.append(previewBar);
  }
  if (import.meta.env.DEV && !preview) {
    const test = document.createElement('a'); test.className = 'preview-entry'; test.href = location.origin + '/?gift-preview=1'; test.innerHTML = navIcon('preview') + '<span>Probar evento</span>'; document.querySelector('.toolbar')!.append(test);
  }
  if (gift && user) mountVisitSharing(paused => { world.paused = paused; world.input.clear(); });
  // Development-only inspection for browser tests; excluded from production builds.
  if (import.meta.env.DEV) Object.assign(window, { __MI_MUNDO_DEV__: { world, game, sync } });
  if (storageError) ui.storageUnavailable(storageError);
  await world.scene.whenReadyAsync();
  ui.ready();
  if (!preview && new URLSearchParams(location.search).get('account') === '1') document.getElementById('account')?.click();
  if (sync && !storageError) void sync.sync();
  if (import.meta.hot) import.meta.hot.dispose(() => { account?.dispose(); subscription.data.subscription.unsubscribe(); ui.dispose(); world.dispose(); repository.close(); });
}

start().catch(error => {
  console.error(error);
  const root = document.getElementById('app')!;
  root.replaceChildren();
  const panel = document.createElement('section'); panel.className = 'fatal';
  const title = document.createElement('h1'); title.textContent = 'El jardín no pudo despertar';
  const text = document.createElement('p'); text.textContent = new URLSearchParams(location.search).has('visit') ? 'El enlace de visita no está disponible. Puede haberse desactivado o haber un problema de conexión.' : 'Prueba a recargar o abrirlo en un navegador con aceleración gráfica habilitada.';
  const button = document.createElement('button'); button.className = 'primary'; button.textContent = 'Volver a intentar'; button.onclick = () => location.reload();
  panel.append(title, text, button); root.append(panel);
});
