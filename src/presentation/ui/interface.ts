import { defaultAvatarStyle } from '../../domain/avatarStyle';
import type { AvatarStyle } from '../../domain/avatarStyle';
import { worldTime, worldCalendar } from '../../domain/worldTime';
import { forestAchievements, canVisitForest } from '../../domain/achievements';
import { storySymbol } from '../memories/storyArt';
import { AvatarPreview } from '../player/avatarPreview';
import type { GardenGame } from '../../application/gardenGame';
import type { GardenWorld, Target } from '../world/gardenWorld';
import { findStory, savedStoryCount, stories } from '../../content/stories';
import { MemoryJournal } from '../memories/memoryJournal';
import { musicTracks } from '../../content/music';
import { GardenMusic } from '../audio/gardenMusic';
import type { PrivateGift } from '../../domain/privateGift';
import { giftStops } from '../../domain/privateGift';

const icons = {
  leaf: '<path d="M12 21V11m0 5C3 16 3 6 4 4c8 0 9 6 8 12Zm0-4C11 4 17 2 21 3c1 7-3 10-9 9Z"/>',
  moon: '<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  book: '<path d="M12 5v15M3 4c4-1 7 0 9 2 2-2 5-3 9-2v15c-4-1-7 0-9 2-2-2-5-3-9-2Z"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5Zm4 4c2 2 2 6 0 8m3-11c4 4 4 10 0 14"/>',
  settings: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  drop: '<path d="M12 2C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-13Z"/><path d="M8 15a4 4 0 0 0 4 4"/>',
  home: '<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  play: '<path d="m8 4 12 8-12 8Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  previous: '<path d="M5 5v14m14-14L7 12l12 7Z"/>',
  next: '<path d="M19 5v14M5 5l12 7-12 7Z"/>',
};
const icon = (name: keyof typeof icons) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;

export class GameInterface {
  private root: HTMLElement;
  private target: Target | null = null;
  private toastTimer = 0;
  private music = new GardenMusic();
  private journal: MemoryJournal;
  private available = true;
  private importData: unknown = null;
  private importPending = false;
  private avatarPreview: AvatarPreview | null = null;
  private readTimer = 0;
  private messageTarget: string | null = null;
  constructor(private world: GardenWorld, private game: GardenGame, private gift: PrivateGift | null = null, private visiting = false, comments?: {token?: string}) {
    this.root = document.getElementById('app')!;
    this.root.innerHTML = `
      <div class="vignette"></div><button id="target-bubble" class="target-bubble" hidden></button><div id="care-feedback" class="care-feedback" aria-hidden="true" hidden>♡</div>
      <header class="topbar">
        <a class="brand" href="#" aria-label="Mi Mundo, volver a la entrada"><span class="brand-symbol">${icon('leaf')}</span><span><span id="world-brand">mi mundo</span><span class="brand-sub">UN LUGAR PARA VOLVER</span></span></a>
        <details class="sky-status"><summary aria-label="Hora del mundo y fecha real"><span id="sky-symbol">${icon('sun')}</span><span id="clock">08:00</span></summary><div class="world-time-details"><small>EN TU MUNDO</small><strong id="sky-name"></strong><span id="world-day"></span><small>EN LA VIDA REAL</small><time id="real-date"></time><span id="garden-age"></span></div></details>
        <nav class="toolbar" aria-label="Herramientas del jardín">
          <button class="icon-button" id="album" title="Recuerdos" aria-label="Abrir recuerdos">${icon('book')}</button>
          <button class="icon-button" id="sound" title="Música del jardín" aria-label="Abrir música" data-playing="false">${icon('sound')}<span class="sound-dot"></span></button>
          <button class="icon-button" id="settings" title="Ajustes" aria-label="Abrir ajustes">${icon('settings')}</button>
        </nav>
      </header>
      <div class="location"><span class="location-line"></span> ISLA 01 <span class="location-dot">·</span> EL JARDÍN DE LOS ECOS</div>
      <section class="intro" aria-labelledby="intro-title">
        <div class="eyebrow"><span></span> TU PEQUEÑO REFUGIO</div>
        <h1 id="intro-title">Donde los recuerdos<br><em>florecen.</em></h1>
        <p>Un jardín entre las nubes. Un poco de magia.<br>Y todo el tiempo del mundo para hacerlo tuyo.</p>
        <button class="primary" id="enter">Entrar al jardín ${icon('arrow')}</button>
        <div class="intro-note">SIN PRISAS. A TU RITMO.</div>
      </section>
      <details id="garden-panel" class="quest glass" hidden aria-label="Tu jardín"><summary class="quest-toggle"><span>✧ Tu jardín <small id="compact-progress">0 / 6 flores</small></span><span class="quest-chevron" aria-hidden="true">⌄</span></summary><div class="quest-body">
        <div class="eyebrow">UN NUEVO COMIENZO</div><h2>Planta un pequeño futuro</h2>
        <p id="quest-copy">Acércate a un círculo de tierra<br>y planta tu primera flor de luna.</p>
        <p id="garden-notice" class="garden-notice" hidden></p><h3 class="collection-heading">Tus flores</h3><button id="island-goals" class="secondary island-goals">✧ Camino al Bosque Lunar</button><div id="garden-cards" class="garden-cards"></div><div class="quest-progress"><span id="progress-fill"></span></div>
        <div class="quest-count"><span id="plant-count">0 de 6 flores</span><span id="save-state">Guardado local</span></div>
        <h3 class="collection-heading">Recuerdos de la isla</h3><div id="memory-cards" class="memory-collection"></div><button id="journal-progress" class="memory-progress" aria-label="Ver álbum de recuerdos"><span id="memory-count">0 de 6 recuerdos guardados</span><span aria-hidden="true">↗</span></button>
      </div></details>
      <div class="world-caption"><span>EL ÁRBOL DE LOS ECOS</span><small>Cada historia echa raíces.</small></div>
      <nav class="game-dock" aria-label="Navegación del juego" hidden>
        <button id="nav-explore" aria-pressed="true">${icon('leaf')}<span>Explorar</span></button>
        <button id="nav-garden" aria-expanded="false" aria-controls="garden-panel">${icon('book')}<span>Mi jardín</span></button>
        <button id="nav-avatar" aria-haspopup="dialog">${icon('spark')}<span>Avatar</span></button>
      </nav>
      <footer class="bottom-bar">
        <button class="map-card glass" id="home" aria-label="Volver al inicio del camino" title="Volver al inicio">
          <svg class="mini-map" viewBox="0 0 96 80" aria-hidden="true"><path d="M12 41C4 20 28 10 46 12S85 14 86 35 72 67 51 69 18 62 12 41Z" fill="currentColor" opacity=".12"/><path d="M12 41C4 20 28 10 46 12S85 14 86 35 72 67 51 69 18 62 12 41Z" fill="none" stroke="currentColor" opacity=".4"/><path d="M46 60Q34 45 48 35T48 20" fill="none" stroke="currentColor" stroke-dasharray="2 3" opacity=".6"/><circle cx="46" cy="30" r="9" fill="currentColor" opacity=".2"/><circle id="map-player" cx="48" cy="57" r="3" fill="currentColor"/></svg>
          <span>Tu refugio<small>Jardín de los ecos</small></span><span class="north">N</span>
        </button>
        <div class="context" hidden><span id="context-label">Explora el jardín</span><button class="action-button" id="action" hidden>${icon('leaf')}<span id="action-text">Plantar</span><kbd>E</kbd></button><button id="object-message" class="secondary" hidden>Escribir mensaje ♡</button></div>

        <details class="control-hint"><summary>¿Cómo jugar?</summary><span class="desktop-hint"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> caminar <span class="hint-dot">·</span> arrastra para mirar</span><span class="touch-hint">Desliza para mirar · toca el suelo para caminar. Usa el círculo izquierdo para moverte y los botones derechos para interactuar.</span></details>
      </footer>
      <div class="joystick" id="joystick" aria-label="Control táctil de movimiento" hidden><span id="joystick-knob"></span></div>
      <div class="toast" id="toast" role="status" aria-live="polite"></div>
      <dialog id="message-dialog" class="settings-dialog" aria-labelledby="message-title">
        <button class="dialog-close icon-button" data-close aria-label="Cerrar mensaje">×</button>
        <div class="eyebrow">UN PEDACITO DE TI</div><h2 id="message-title">Tu mensaje</h2>
        <p id="message-object" class="muted"></p>
        <div id="message-view" hidden><div class="dedication-mark" aria-hidden="true">♡</div><blockquote id="message-dedication"></blockquote><p class="dedication-sign">Un recuerdo que vive aquí.</p><button id="edit-message" class="secondary">Editar dedicatoria</button></div>
        <div id="message-editor"><label for="message-text">¿Qué quieres recordar aquí?</label>
        <textarea id="message-text" maxlength="500" rows="5" placeholder="Un deseo, una dedicatoria, algo bonito de hoy…"></textarea>
        <p class="muted"><span id="message-length">0</span>/500 · Borra el texto y guarda para quitarlo.</p>
        <button id="save-message" class="primary">Guardar mensaje ♡</button>
        </div><p id="message-status" role="status"></p>
      </dialog>
      <dialog id="music-dialog" class="music-dialog">
        <button class="dialog-close icon-button" data-close aria-label="Cerrar música">${icon('close')}</button>
        <div class="eyebrow">SONIDOS DE TU REFUGIO</div><h2>Música para quedarse</h2>
        <div id="music-art" class="music-art" data-mood="dawn" aria-hidden="true"><span class="music-orbit"></span><span class="music-moon"></span><span class="music-hill hill-back"></span><span class="music-hill hill-front"></span><span class="music-flower">${icon('leaf')}</span><span class="music-art-caption">EL JARDÍN DE LOS ECOS</span></div>
        <label class="music-select-label" for="music-track">Elige tu canción</label><select id="music-track" class="music-select"></select>
        <p id="music-description" class="music-description"></p>
        <div class="music-controls"><button id="music-previous" class="icon-button" aria-label="Canción anterior">${icon('previous')}</button><button id="music-play" class="music-play" aria-label="Reproducir música">${icon('play')}<span>Reproducir</span></button><button id="music-next" class="icon-button" aria-label="Canción siguiente">${icon('next')}</button></div>
        <label class="setting-row" for="music-volume"><span>Volumen</span><output id="music-volume-value">35 %</output></label><input id="music-volume" type="range" min="0" max="100" step="1" value="35" aria-label="Volumen de la música" />
        <p id="music-status" class="music-status" role="status">El jardín también puede disfrutarse en silencio.</p>
        <p class="music-note">Al terminar, sonará la siguiente canción. Tu elección y volumen se recuerdan para la próxima visita.</p>
      </dialog>
      <dialog id="travel-dialog" class="settings-dialog" aria-labelledby="travel-title">
        <button class="dialog-close icon-button" data-close aria-label="Cerrar viaje">×</button>
        <div class="eyebrow">MÁS ALLÁ DE LAS NUBES</div><h2 id="travel-title">El Bosque Lunar</h2>
        <p id="travel-copy" class="muted"></p><div id="achievement-list"></div>
        <button id="travel-go" class="primary">Cruzar el arco</button><p id="travel-status" role="status"></p>
      </dialog>
      <dialog id="forest-story-dialog" class="settings-dialog" aria-labelledby="forest-story-title"><button class="dialog-close icon-button" data-close aria-label="Cerrar historia del bosque">×</button><div class="eyebrow">LA PIEDRA QUE RECUERDA</div><h2 id="forest-story-title">Una luz entre los árboles</h2><p>El bosque parecía dormido. Entonces una hoja brilló al sentir tus pasos.</p><p>«No necesitaba que llegaras antes. Solo que llegaras».</p><button id="forest-story-save" class="primary">Guardar este encuentro ♡</button><p id="forest-story-status" role="status"></p></dialog>
      <dialog id="avatar-dialog" class="settings-dialog" aria-labelledby="avatar-title">
        <button class="dialog-close icon-button" data-close aria-label="Cerrar avatar">${icon('close')}</button>
        <div class="eyebrow">QUIÉN RECORRE TU MUNDO</div><h2 id="avatar-title">Tu viajero</h2>
        <div class="avatar-stage"><canvas id="avatar-preview" aria-label="Vista previa 3D de tu avatar"></canvas><div class="avatar-turn"><button id="avatar-left" class="secondary" aria-label="Girar avatar a la izquierda">${icon('previous')}</button><button id="avatar-right" class="secondary" aria-label="Girar avatar a la derecha">${icon('next')}</button></div></div><p id="avatar-preview-status" class="muted">Elige con quién explorar la isla.</p>
        <label class="setting-row" for="avatar-choice">Tu avatar<select id="avatar-choice"><option value="woman">Mujer · viajera</option><option value="man">Hombre · viajero</option></select></label>
        <div class="avatar-customize"><label>Piel<select id="avatar-skin"><option value="light">Clara</option><option value="warm">Cálida</option><option value="deep">Morena</option></select></label><label>Ropa<select id="avatar-robe"><option value="teal">Lago</option><option value="lavender">Lavanda</option><option value="rose">Rosa</option></select></label><label>Cabello<select id="avatar-hair"><option value="auto">Original</option><option value="short">Corto</option><option value="long">Largo</option><option value="braid">Trenza</option></select></label></div><div class="save-actions"><button id="avatar-save" class="primary">Guardar apariencia</button><button id="avatar-wave" class="secondary">Saludar</button></div>

        <p class="muted">Tu elección forma parte del guardado de tu jardín.</p>
      </dialog>
      <dialog id="settings-dialog" class="settings-dialog">
        <button class="dialog-close icon-button" data-close aria-label="Cerrar ajustes">${icon('close')}</button>
        <div class="eyebrow">HAZLO A TU MANERA</div><h2>Tu momento de calma</h2>

        <label class="setting-row" for="quality">Calidad del paisaje<select id="quality"><option value="low">Ligera · celular</option><option value="balanced">Equilibrada</option><option value="high">Alta</option></select></label>
        <h3>Ambiente de tu mundo</h3>
        <div class="theme-options" role="group" aria-label="Ambiente de tu mundo">
          <button data-sky-theme="garden">${icon('leaf')}<span>Jardín de ensueño<small>Suave y cálido</small></span></button>
          <button data-sky-theme="forest">${icon('moon')}<span>Bosque encantado<small>Profundo y sereno</small></span></button>
          <button data-sky-theme="celestial">${icon('spark')}<span>Brisa celeste<small>Azules y lavandas</small></span></button>
        </div><p class="muted">Un día del cielo dura 30 minutos. Tus plantas crecen a su propio ritmo, con tiempo real.</p>
        <label class="setting-row">Movimiento suave reducido<input id="reduced" type="checkbox" /></label>
        <div class="settings-divider"></div><h3>Cuida tus recuerdos</h3><p class="muted">Tu jardín se guarda en este navegador. Exporta una copia para conservarlo o llevarlo a otro dispositivo.</p>
        <div class="save-actions"><button id="export" class="secondary">Exportar jardín</button><button id="import" class="secondary">Importar copia</button></div>
        <input id="import-file" type="file" accept="application/json,.json" hidden />
        <div id="import-confirm" hidden><p>Esta copia reemplazará el jardín de este navegador. Exporta el actual si quieres conservarlo.</p><button id="confirm-import" class="secondary">Reemplazar jardín</button><button id="cancel-import" class="text-button">Cancelar</button></div>
        <p class="settings-foot">Primera semilla · versión 0.1 <span id="fps"></span></p>
      </dialog>
      <div id="loading" class="loading"><div class="loading-symbol">${icon('leaf')}</div><p>Despertando el jardín…</p><span>Preparando un lugar para ti</span></div>
    `;
    const compactScreen = matchMedia('(max-width: 900px), (pointer: coarse)');
    const questPanel = this.root.querySelector<HTMLDetailsElement>('.quest')!;
    questPanel.open = !compactScreen.matches;
    const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id)! as T;
    if (!world.forest && gift) {
      $('intro-title').replaceChildren(document.createTextNode(`${gift.firstName},`), document.createElement('br'));
      const emphasis = document.createElement('em'); emphasis.textContent = 'este cielo es para ti.'; $('intro-title').append(emphasis);
      this.root.querySelector('.intro p')!.textContent = 'Un pequeño mundo para verte sonreír. Te espera una sorpresa en el buzón, al comienzo del camino.';
      this.root.querySelector('.intro-note')!.textContent = `${gift.dateLabel} · ${gift.age} vueltas al sol`;
      this.root.querySelector('.intro .eyebrow')!.textContent = 'UN REGALO HECHO CON CARIÑO';
    }
    this.journal = new MemoryJournal(this.root, game, {
      gift,
      pauseWorld: paused => { world.paused = paused; world.input.clear(); },
      reducedMotion: () => world.reducedMotion,
      visiting, comments,
      canSave: () => this.available && !this.visiting,
      onSaved: () => this.refresh(),
      pauseBackgroundMusic: () => { if (this.music.playing) void this.music.toggle(); },
    });
    $('enter').onclick = () => {
      world.enter(); this.root.classList.add('playing');
      this.root.querySelector<HTMLElement>('.game-dock')!.hidden = false;
      this.root.querySelector<HTMLElement>('.intro')!.hidden = true;
      this.root.querySelector<HTMLElement>('.quest')!.hidden = false;
      this.root.querySelector<HTMLElement>('.context')!.hidden = false;
      $('joystick').hidden = false;
      this.toast('Bienvenido. Camina o toca el suelo para explorar.');
    };
    this.root.querySelector<HTMLAnchorElement>('.brand')!.onclick = e => { e.preventDefault(); world.home(); };
    if(world.forest) {
      this.root.querySelector('.location')!.textContent = 'ISLA 02 · EL BOSQUE LUNAR';
      $('intro-title').textContent = 'Donde la noche florece.';
      this.root.querySelector('.intro p')!.textContent = 'Cultiva helechos estelares y devuelve la luz al refugio.';
      this.root.querySelector('.quest h2')!.textContent = 'Da vida al bosque';
      $('island-goals').textContent = '✧ Volver al jardín';
      this.root.querySelector('.world-caption')!.textContent = 'EL BOSQUE LUNAR';
    }
    $('island-goals').onclick = () => this.openTravel();
    $('travel-go').onclick = async () => {
      const button=$<HTMLButtonElement>('travel-go');button.disabled=true;
      try { if(this.target?.kind !== 'travel') throw new Error('Acércate al arco para viajar.'); await game.travel(world.forest ? 'garden' : 'forest'); location.reload(); }
      catch(e) { $('travel-status').textContent=this.error(e);button.disabled=false; }
    };
    $('forest-story-save').onclick = async () => {
      const button=$<HTMLButtonElement>('forest-story-save');button.disabled=true;
      try {await game.forestAction('story');$('forest-story-status').textContent='♡ Encuentro guardado.';this.refresh();}
      catch(e){$('forest-story-status').textContent=this.error(e);button.disabled=false;}
    };
    $('home').onclick = () => world.home();
    $('target-bubble').onclick = () => void this.act();
    world.onTargetScreen = point => { const bubble = $('target-bubble'); bubble.hidden = !point; if (point) { bubble.style.left = `${point.x}px`; bubble.style.top = `${point.y}px`; } };
    $('action').onclick = () => void this.act(); world.input.onInteract = () => void this.act();
    $('object-message').onclick = () => {
      if (!this.target || world.paused) return;
      if(this.visiting && !game.save.messages?.[this.target.id]) return;
      this.messageTarget = this.target.id;
      $('message-object').textContent = findStory(this.target.id)?.object || 'Tu flor de luna';
      const field = $<HTMLTextAreaElement>('message-text');
      field.value = game.save.messages?.[this.target.id] || '';
      $('message-length').textContent = String(field.value.length); $('message-status').textContent = '';
      $('message-dedication').textContent = field.value;
      $('message-view').hidden = !field.value; $('message-editor').hidden = this.visiting || !!field.value;
      $('edit-message').hidden = this.visiting;
      $('message-dialog').dataset.theme = findStory(this.target.id)?.theme || 'flower';
      $<HTMLButtonElement>('save-message').disabled = !this.available;
      this.openDialog($('message-dialog'));
    };
    $('edit-message').onclick = () => { if(this.visiting)return; $('message-view').hidden = true; $('message-editor').hidden = false; $<HTMLTextAreaElement>('message-text').focus(); };
    $<HTMLTextAreaElement>('message-text').oninput = e => { $('message-length').textContent = String((e.target as HTMLTextAreaElement).value.length); $('message-status').textContent = 'Cambios sin guardar'; };
    $('save-message').onclick = async () => {
      if (this.visiting || !this.messageTarget) return;
      const button = $<HTMLButtonElement>('save-message'); button.disabled = true;
      const field = $<HTMLTextAreaElement>('message-text'); field.disabled = true;
      try { await game.setMessage(this.messageTarget, field.value); $('message-status').textContent = field.value.trim() ? '♡ Mensaje guardado en este lugar.' : 'Mensaje eliminado.'; this.showCare('♡'); $('message-dedication').textContent = field.value.trim(); $('message-view').hidden = !field.value.trim(); $('message-editor').hidden = !!field.value.trim(); this.refresh(); }
      catch (e) { $('message-status').textContent = this.error(e); }
      finally { button.disabled = !this.available; field.disabled = false; }
    };
    $('album').onclick = () => this.journal.openAlbum();
    $('journal-progress').onclick = () => this.journal.openAlbum();
    const syncDock = () => { this.root.classList.toggle('garden-open', questPanel.open); if (questPanel.open) this.refresh(); $('nav-garden').setAttribute('aria-expanded', String(questPanel.open)); $('nav-explore').setAttribute('aria-pressed', String(!questPanel.open)); };
    questPanel.addEventListener('toggle', syncDock); syncDock();
    $('nav-explore').onclick = () => { questPanel.open = false; world.input.clear(); syncDock(); };
    $('nav-garden').onclick = () => { questPanel.open = !questPanel.open; syncDock(); };
    $('nav-avatar').onclick = () => { this.openDialog($('avatar-dialog')); try { this.avatarPreview ??= new AvatarPreview($<HTMLCanvasElement>('avatar-preview')); this.avatarPreview.show(world.avatar.appearance,world.avatar.style); resetAvatarDraft(); } catch { $('avatar-preview-status').textContent = 'La vista previa no está disponible. Puedes cambiar tu avatar igualmente.'; } };
    $('avatar-left').onclick = () => this.avatarPreview?.turn(-.5); $('avatar-right').onclick = () => this.avatarPreview?.turn(.5);
    $('settings').onclick = () => this.openDialog($('settings-dialog'));
    const avatarChoice = $<HTMLSelectElement>('avatar-choice');
    world.avatar.setAppearance(game.save.avatar ?? 'man');
    avatarChoice.value = world.avatar.appearance;
    world.avatar.setStyle(game.save.avatarStyle ?? defaultAvatarStyle);
    const styleDraft=():AvatarStyle=>({skin:$<HTMLSelectElement>('avatar-skin').value as AvatarStyle['skin'],robe:$<HTMLSelectElement>('avatar-robe').value as AvatarStyle['robe'],hair:$<HTMLSelectElement>('avatar-hair').value as AvatarStyle['hair']});
    const resetAvatarDraft=()=>{avatarChoice.value=world.avatar.appearance;for(const key of ['skin','robe','hair'] as const)$<HTMLSelectElement>('avatar-'+key).value=world.avatar.style[key];$('avatar-preview-status').textContent='Elige tu estilo y guarda cuando te guste.';};
    resetAvatarDraft();
    const previewDraft=()=>{this.avatarPreview?.show(avatarChoice.value==='woman'?'woman':'man',styleDraft());$('avatar-preview-status').textContent='Vista previa · aún sin guardar';};
    avatarChoice.onchange=previewDraft;for(const key of ['skin','robe','hair'])$('avatar-'+key).onchange=previewDraft;
    $('avatar-save').onclick=async()=>{if(this.visiting)return;const appearance=avatarChoice.value==='woman'?'woman':'man',style=styleDraft();const button=$<HTMLButtonElement>('avatar-save');button.disabled=true;try{await game.setAvatarLook(appearance,style);world.avatar.setAppearance(appearance);world.avatar.setStyle(style);$('avatar-preview-status').textContent='Tu apariencia está guardada.';}catch(e){$('avatar-preview-status').textContent=this.error(e);}finally{button.disabled=false;}};
    $('avatar-wave').onclick=()=>{world.avatar.wave();$<HTMLDialogElement>('avatar-dialog').close();};
    $('sound').onclick = () => this.openDialog($('music-dialog'));
    const tracks = $<HTMLSelectElement>('music-track');
    musicTracks.forEach(track => { const option = document.createElement('option'); option.value = track.id; option.textContent = track.title; tracks.append(option); });
    tracks.onchange = () => void this.music.select(tracks.value);
    $('music-play').onclick = () => void this.music.toggle();
    $('music-previous').onclick = () => void this.music.next(-1);
    $('music-next').onclick = () => void this.music.next(1);
    $<HTMLInputElement>('music-volume').oninput = e => this.music.setVolume(Number((e.target as HTMLInputElement).value) / 100);
    this.music.onChange = () => this.refreshMusic(); this.music.onError = message => this.toast(message);
    this.refreshMusic();
    const quality = $<HTMLSelectElement>('quality'); quality.value = matchMedia('(max-width: 800px)').matches ? 'low' : 'balanced'; quality.onchange = () => world.setQuality(quality.value);
    const themeButtons = this.root.querySelectorAll<HTMLButtonElement>('[data-sky-theme]');
    const refreshTheme = () => themeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.skyTheme === world.sky.theme)));
    themeButtons.forEach(button => button.onclick = () => {
      const theme = button.dataset.skyTheme;
      if (theme === 'garden' || theme === 'forest' || theme === 'celestial') world.sky.setTheme(theme);
      refreshTheme();
    });
    refreshTheme(); this.time(world.sky.hour);
    const reduced = $<HTMLInputElement>('reduced'); reduced.checked = world.reducedMotion; reduced.onchange = () => { world.reducedMotion = reduced.checked; };
    this.root.querySelectorAll<HTMLDialogElement>('dialog:not(#memory-dialog)').forEach(d => {
      d.querySelectorAll<HTMLElement>('[data-close]').forEach(b => b.onclick = () => d.close());
      d.addEventListener('close', () => { if(d.id==='settings-dialog') world.previewSky=false; world.paused = false; world.input.clear(); });
      d.addEventListener('click', e => { if (e.target === d) { const r = d.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close(); } });
    });
    $('export').onclick = () => { if(this.visiting)return;
      const url = URL.createObjectURL(new Blob([JSON.stringify(game.save, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `mi-jardin-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.toast('Tu copia del jardín está preparada.');
    };
    $('import').onclick = () => $<HTMLInputElement>('import-file').click();
    $<HTMLInputElement>('import-file').onchange = async e => {
      const input = e.target as HTMLInputElement, file = input.files?.[0]; if (!file) return;
      try {
        if (file.size > 1024 * 1024) throw new Error('La copia es demasiado grande.');
        this.importData = JSON.parse(await file.text()); this.importPending = true; $('import-confirm').hidden = false;
      } catch { this.toast('No se pudo leer esa copia del jardín.'); }
      input.value = '';
    };
    $('cancel-import').onclick = () => { this.importPending = false; this.importData = null; $('import-confirm').hidden = true; };
    $('confirm-import').onclick = async () => {
      if (!this.importPending) return;
      try { await game.import(this.importData); world.avatar.setAppearance(game.save.avatar ?? 'man'); world.avatar.setStyle(game.save.avatarStyle ?? defaultAvatarStyle); avatarChoice.value = world.avatar.appearance; if ((game.save.currentIsland === 'forest') !== world.forest) {location.reload();return;} world.refreshPlants(); this.refresh(); this.toast('Tu jardín ha vuelto a casa.'); this.importPending = false; this.importData = null; $('import-confirm').hidden = true; }
      catch (e) { this.toast(this.error(e)); }
    };
    world.input.bindJoystick($('joystick'), $('joystick-knob'));
    world.onBloom = () => this.toast('✿ Una flor de luna acaba de abrir sus pétalos.');
    world.onTarget = target => { this.target = target; this.refresh(); };
    world.onTime = hour => {
      this.time(hour);
      const p = world.avatar.root.position; $('map-player').setAttribute('cx', String(48 + p.x * 2.2)); $('map-player').setAttribute('cy', String(40 + p.z * 2));
    };
    world.onMetrics = fps => { $('fps').textContent = `${Math.round(fps)} fps`; };
    this.refresh();
  }
  ready(): void { document.getElementById('loading')?.remove(); }
  storageUnavailable(message: string): void { this.available = false; document.getElementById('save-state')!.textContent = 'Guardado no disponible'; this.toast(message, 12000); this.refresh(); }
  toast(message: string, duration = 5000): void { const el = document.getElementById('toast')!; el.textContent = message; const notice = document.getElementById('garden-notice')!; notice.textContent = message; notice.hidden = false; el.classList.add('visible'); clearTimeout(this.toastTimer); this.toastTimer = window.setTimeout(() => { el.classList.remove('visible'); notice.hidden = true; }, duration); }
  private async act(): Promise<void> {
    if (!this.world.entered || this.world.paused || !this.target || this.game.busy || this.world.avatar.caring) return;
    const target = this.target;
    if (this.visiting && target.kind !== 'memory' && target.kind !== 'bench') { this.toast('Estás de visita. Disfruta del paseo y las historias del jardín.'); return; }
    if (target.kind === 'travel') { this.openTravel(); return; }
    if (target.kind === 'lore') { const saved=!!this.game.save.forestStory; (document.getElementById('forest-story-save') as HTMLButtonElement).disabled=saved; document.getElementById('forest-story-status')!.textContent=saved ? '♡ Este encuentro ya está guardado.' : ''; this.openDialog(document.getElementById('forest-story-dialog') as HTMLDialogElement); return; }
    if (target.kind === 'refuge') { try {await this.game.forestAction('refuge');this.world.refreshPlants();this.toast('El refugio vuelve a tener luz. Este rincón ya te espera.');}catch(e){this.toast(this.error(e));}return; }
    if (target.kind === 'memory') {
      if (this.world.reducedMotion) { this.journal.openStory(target.id); return; }
      this.world.playCare(target.id, 'read');
      clearTimeout(this.readTimer); this.readTimer = window.setTimeout(() => { if (!this.world.paused && this.target?.id === target.id) this.journal.openStory(target.id); }, 700);
      return;
    }
    if (target.kind === 'bench') { this.world.sit(); this.toast('Respira. El jardín puede esperar. Camina para levantarte.'); return; }
    if (!this.available) { this.toast('El guardado no está disponible. Recarga para volver a intentarlo.'); return; }
    try { const kind = this.game.save.plants[target.id] ? 'water' : 'plant'; const result = this.game.act(target.id); this.refresh(); this.toast(await result); this.world.refreshPlants(); this.world.playCare(target.id, kind); this.showCare('✿'); }
    catch (e) { this.toast(this.error(e)); }
    finally { this.refresh(); }
  }
  private refresh(): void {
    const giftCompleted = this.game.save.giftProgress?.id === this.gift?.id ? this.game.save.giftProgress?.completed ?? 0 : 0;
    const messageButton = document.getElementById('object-message')!;
    messageButton.hidden = !this.world.entered || !this.target || !(this.target.kind === 'memory' || this.target.kind === 'plot' && !!this.game.save.plants[this.target.id]);
    if(this.visiting) messageButton.hidden = messageButton.hidden || !this.target || !this.game.save.messages?.[this.target.id];
    messageButton.textContent = this.visiting ? 'Leer dedicatoria' : this.target && this.game.save.messages?.[this.target.id] ? 'Leer / editar mensaje ♡' : 'Escribir mensaje ♡';
    const plots = this.world.activePlots;
    const count = plots.filter(p=>this.game.save.plants[p.id]).length;
    const cards = document.getElementById('garden-cards')!; cards.replaceChildren();
    plots.forEach((plot, index) => {
      const planted = this.game.save.plants[plot.id], phase = this.game.getStage(plot.id);
      const card = document.createElement('div'); card.className = 'garden-tile';
      const symbol = document.createElement('span'); symbol.className = 'tile-symbol'; symbol.textContent = !planted ? '◌' : phase === 2 ? '✿' : '♧'; symbol.setAttribute('aria-hidden','true');
      const name = document.createElement('strong'); name.textContent = (this.world.forest ? 'Helecho ' : 'Flor ') + (index + 1);
      const status = document.createElement('small'); status.textContent = !planted ? 'Por plantar' : phase === 2 ? 'En flor' : planted.wateredAt === null ? 'Necesita agua' : 'Creciendo';
      const note = document.createElement('small'); note.textContent = this.game.save.messages?.[plot.id] ? '♡ Con dedicatoria' : '';
      card.append(symbol,name,status,note); cards.append(card);
    });
    const collection = document.getElementById('memory-cards')!;
    const signature = JSON.stringify([this.game.save.memoriesRead, this.game.save.messages, giftCompleted]);
    if (collection.dataset.signature !== signature) {
      collection.dataset.signature = signature; collection.replaceChildren();
      stories.forEach(story => {
        if (!this.game.save.memoriesRead.includes(story.id)) return;
        if (this.gift && giftStops.indexOf(story.id as typeof giftStops[number]) > giftCompleted) return;
        const card = document.createElement('details'); card.className = 'memory-discovery';
        const summary = document.createElement('summary');
        const symbol = document.createElement('span'); symbol.className = 'discovery-icon'; symbol.innerHTML = storySymbol(story.theme); symbol.setAttribute('aria-hidden','true');
        const copy = document.createElement('span'); const title = document.createElement('strong'); title.textContent = story.object;
        const state = document.createElement('small'); const saved = this.game.save.memoriesRead.includes(story.id);
        state.textContent = saved ? '✓ Guardado' : '◇ Por descubrir'; card.dataset.saved = String(saved);
        copy.append(title,state); summary.append(symbol,copy);
        const hint = document.createElement('p'); hint.textContent = (this.world.forest ? 'En el Jardín de los Ecos: ' : '') + story.location + '. Acércate al objeto para abrir su historia.';
        if (this.game.save.messages?.[story.id]) { const note = document.createElement('span'); note.className = 'discovery-note'; note.textContent = '♡ Tiene tu dedicatoria'; hint.append(document.createElement('br'),note); }
        card.append(summary,hint); collection.append(card);
      });
      if (!collection.childElementCount) {
        const empty = document.createElement('p'); empty.className = 'discovery-empty';
        empty.textContent = 'Tu historia empieza explorando.'; collection.append(empty);
      }
    }
    document.getElementById('compact-progress')!.textContent = `${count} / ${plots.length} ${this.world.forest ? 'helechos' : 'flores'}`;
    document.getElementById('plant-count')!.textContent = `${count} de ${plots.length} ${this.world.forest ? 'helechos' : 'flores'}`;
    document.getElementById('memory-count')!.textContent = `${savedStoryCount(this.game.save.memoriesRead)} de ${stories.length} recuerdos guardados`;
    document.getElementById('progress-fill')!.style.width = `${count / plots.length * 100}%`;
    document.getElementById('quest-copy')!.textContent = count === 0 ? 'Acércate a un círculo de tierra y planta tu primera flor de luna.' : count === plots.length ? 'Tu jardín está sembrado. Las flores crecerán incluso cuando no estés aquí.' : 'Riega tus flores y descubre un recuerdo bajo el árbol de los ecos.';
    if(this.world.forest) document.getElementById('quest-copy')!.textContent = this.game.save.forestRefuge ? 'Tu refugio está restaurado. Encuentra la piedra luminosa para leer su historia.' : 'Planta dos helechos y acércate al refugio del fondo para restaurarlo.';
    if (this.gift && !this.world.forest) {
      const descriptions = ['Busca el buzón al inicio del camino.', 'Busca el farol del borde izquierdo, cerca del inicio del camino.', 'Busca la flor rosa grande que crece sola a la izquierda del árbol central.', 'Busca el pedestal dorado delante del arco de piedra.'];
      document.querySelector('.quest h2')!.textContent = giftCompleted < 4 ? `Tu siguiente carta · ${giftCompleted + 1} de 4` : 'Tu historia está guardada';
      document.getElementById('quest-copy')!.textContent = descriptions[giftCompleted] ?? 'Puedes releer tus cartas y seguir cuidando el jardín.';
    }
    const button = document.getElementById('action') as HTMLButtonElement;
    const label = document.getElementById('context-label')!;
    button.hidden = !this.target; button.disabled = this.game.busy;
    if (!this.target) { label.textContent = 'Sigue el camino. Algo bonito te espera.'; return; }
    let action = '', symbol: keyof typeof icons = 'leaf';
    if (this.target.kind === 'plot') {
      const p = this.game.save.plants[this.target.id];
      action = !p ? 'Plantar semilla' : p.wateredAt === null ? 'Regar flor' : 'Creciendo con calma';
      symbol = p ? 'drop' : 'leaf'; button.disabled ||= !this.available || !!p && p.wateredAt !== null;
      label.textContent = p ? (this.world.forest ? 'HELECHO ESTELAR' : 'FLOR DE LUNA') : 'UN LUGAR PARA FLORECER';
    } else if (this.target.kind === 'memory') { action = 'Abrir recuerdo'; symbol = 'book'; label.textContent = (findStory(this.target.id)?.object || 'Un recuerdo del jardín').toUpperCase(); }
    else if(this.target.kind === 'travel') {action='Ver viaje ✧';symbol='spark';label.textContent=this.world.forest ? 'REGRESO AL JARDÍN' : 'ARCO DEL BOSQUE LUNAR';}
    else if(this.target.kind === 'refuge') {action=this.game.save.forestRefuge ? 'Refugio restaurado' : 'Restaurar refugio';symbol='home';button.disabled ||= !!this.game.save.forestRefuge;label.textContent='UN LUGAR PARA QUEDARSE';}
    else if(this.target.kind === 'lore') {action='Leer la piedra';symbol='book';label.textContent='UN ENCUENTRO DEL BOSQUE';}
    else { action = 'Descansar'; symbol = 'sun'; label.textContent = 'QUÉDATE UN MOMENTO'; }
    const bubble = document.getElementById('target-bubble') as HTMLButtonElement; bubble.textContent = action === 'Abrir recuerdo' ? 'Leer ♡' : action; bubble.disabled = button.disabled;
    button.innerHTML = `${icon(symbol)}<span id="action-text">${this.game.busy ? 'Guardando…' : action}</span><kbd>E</kbd>`;
  }
  private openTravel(): void {
    const forest=this.world.forest;
    document.getElementById('travel-title')!.textContent=forest ? 'Regresar al jardín' : 'El Bosque Lunar';
    document.getElementById('travel-copy')!.textContent=forest ? 'Tus helechos y el refugio quedarán guardados.' : 'Una isla más amplia, con helechos estelares y un refugio que espera tu ayuda.';
    const list=document.getElementById('achievement-list')!;list.replaceChildren();
    if(!forest) forestAchievements(this.game.save,Date.now()).forEach(a=>{const row=document.createElement('p');row.className='achievement-row';row.textContent=(a.current===a.goal?'✓ ':'◇ ')+a.label+' · '+a.current+'/'+a.goal;list.append(row);});
    const near=this.target?.kind==='travel',unlocked=forest||canVisitForest(this.game.save,Date.now());
    const button=document.getElementById('travel-go') as HTMLButtonElement;button.disabled=!this.available||!near||!unlocked;
    button.textContent=forest?'Volver al jardín':'Cruzar al bosque';
    document.getElementById('travel-status')!.textContent=!near ? (forest?'Busca el aro de regreso al comienzo del sendero.':'Busca el arco de piedra al fondo del jardín.') : !unlocked ? 'Completa estos logros para abrir el camino.' : 'El camino está abierto. Puedes viajar.';
    this.openDialog(document.getElementById('travel-dialog') as HTMLDialogElement);
  }
  private careTimer = 0;
  private showCare(symbol: string): void {
    const mark = document.getElementById('care-feedback')!; mark.textContent = symbol; mark.hidden = false; mark.style.animation = this.world.reducedMotion ? 'none' : ''; 
    mark.classList.remove('celebrate'); void mark.offsetWidth; mark.classList.add('celebrate');
    clearTimeout(this.careTimer); this.careTimer = window.setTimeout(() => { mark.hidden = true; }, 1200);
  }
  private openDialog(dialog: HTMLDialogElement): void { if (dialog.open) return; this.world.paused = true; this.world.previewSky = dialog.id === 'settings-dialog'; this.world.input.clear(); dialog.showModal(); }
  private time(hour: number): void {
    const text = `${Math.floor(hour).toString().padStart(2, '0')}:${Math.floor(hour % 1 * 60).toString().padStart(2, '0')}`;
    document.getElementById('clock')!.textContent = text;
    const night = hour < 6 || hour >= 20;
    document.getElementById('sky-symbol')!.innerHTML = icon(night ? 'moon' : 'sun');
    document.getElementById('sky-name')!.textContent = night ? 'Bajo las estrellas' : hour < 9 ? 'Amanecer' : hour >= 16 ? 'Atardecer' : 'Un día para soñar';
    const now = new Date();
    const calendar=worldCalendar(worldTime(now.getTime(),this.game.save.createdAt).day);
    document.getElementById('world-day')!.textContent='Día '+calendar.day+' · Año '+calendar.year;
    const real = document.getElementById('real-date') as HTMLTimeElement;
    real.dateTime = now.toISOString();
    real.textContent = new Intl.DateTimeFormat('es', {dateStyle:'long', timeStyle:'short'}).format(now);
    const createdAt = this.game.save.createdAt;
    const age = createdAt === undefined ? 0 : Math.floor(Math.max(0,now.getTime()-createdAt)/86400000)+1;
    document.getElementById('garden-age')!.textContent = age ? 'Tu jardín lleva ' + age + (age === 1 ? ' día contigo' : ' días contigo') : '';

  }
  private refreshMusic(): void {
    const { track, playing, loading, volume } = this.music;
    const top = document.getElementById('sound')!; top.dataset.playing = String(playing); top.title = playing ? `Sonando: ${track.title}` : 'Música del jardín';
    (document.getElementById('music-track') as HTMLSelectElement).value = track.id;
    document.getElementById('music-description')!.textContent = track.description;
    document.getElementById('music-art')!.dataset.mood = track.mood;
    const play = document.getElementById('music-play') as HTMLButtonElement;
    play.innerHTML = `${icon(playing ? 'pause' : 'play')}<span>${loading ? 'Preparando…' : playing ? 'Pausar' : 'Reproducir'}</span>`;
    play.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
    (document.getElementById('music-volume') as HTMLInputElement).value = String(Math.round(volume * 100));
    document.getElementById('music-volume-value')!.textContent = `${Math.round(volume * 100)} %`;
    document.getElementById('music-status')!.textContent = loading ? 'Preparando tu canción…' : playing ? `Ahora suena: ${track.title}` : 'La música está en pausa. A tu ritmo.';
  }
  private error(e: unknown): string { return e instanceof Error ? e.message : 'Algo no salió bien. Inténtalo de nuevo.'; }
  dispose(): void { clearTimeout(this.readTimer); this.world.onBloom = () => {}; this.avatarPreview?.dispose(); clearTimeout(this.careTimer); this.world.onTargetScreen = () => {}; clearTimeout(this.toastTimer); this.music.dispose(); this.journal.dispose(); }
}
