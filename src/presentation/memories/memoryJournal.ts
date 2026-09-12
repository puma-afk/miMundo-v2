import { mountComments } from '../ui/cardComments';
import type { GardenGame } from '../../application/gardenGame';
import { findStory, savedStoryCount, stories } from '../../content/stories';
import type { GardenStory } from '../../content/stories';
import { storyArt, storySymbol } from './storyArt';
import './memories.css';
import type { PrivateGift } from '../../domain/privateGift';
import { personalizeStory } from '../../content/giftStories';
import { birthdayArt } from './birthdayArt';
import { giftStops } from '../../domain/privateGift';
import { GiftSongPlayer } from './giftSongPlayer';
const controlIcon = (name: 'next' | 'previous' | 'pause' | 'play' | 'save' | 'close') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${{
  next: '<path d="M5 12h14m-6-6 6 6-6 6"/>', previous: '<path d="M19 12H5m6-6-6 6 6 6"/>', pause: '<path d="M9 5v14M15 5v14"/>', play: '<path d="m9 5 10 7-10 7Z"/>', save: '<path d="m5 12 4 4L19 6"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>'
}[name]}</svg>`;

type JournalOptions = {
  visiting?: boolean;
  comments?: {token?: string};
  gift?: PrivateGift | null;
  pauseWorld: (paused: boolean) => void;
  reducedMotion: () => boolean;
  canSave: () => boolean;
  onSaved: () => void;
  pauseBackgroundMusic?: () => void;
};

export class MemoryJournal {
  private dialog: HTMLDialogElement;
  private disposeComments: (() => void) | undefined;
  private song: GiftSongPlayer | null = null;
  private active: GardenStory | null = null;
  private page = 0;
  private giftStep: number | null = null;
  private responseDraft = '';
  private get answered(): boolean { return !!(this.game.save.giftProgress?.id === this.options.gift?.id && this.game.save.giftProgress?.response?.trim()); }
  private get completed(): number { const gift = this.options.gift; return gift && this.game.save.giftProgress?.id === gift.id ? this.game.save.giftProgress.completed : 0; }
  private get saved(): boolean { return this.giftStep !== null ? this.completed > this.giftStep : !!this.active && this.game.save.memoriesRead.includes(this.active.id); }
  private get isBirthday(): boolean { return !!this.options.gift && this.giftStep === 0; }
  private get revealStory(): boolean { return this.giftStep === null && (this.active?.theme === 'letter' || this.active?.theme === 'flower'); }
  private motion = true;
  private saving = false;
  private abort = new AbortController();
  private returnFocus: HTMLElement | null = null;
  constructor(parent: HTMLElement, private game: GardenGame, private options: JournalOptions) {
    this.dialog = document.createElement('dialog');
    this.dialog.id = 'memory-dialog'; this.dialog.className = 'memory-journal';
    this.dialog.setAttribute('aria-labelledby', 'journal-title');
    parent.append(this.dialog);
    this.dialog.addEventListener('close', () => {
      this.song?.dispose(); this.song=null;
      this.disposeComments?.(); this.disposeComments=undefined;
      this.active = null; this.dialog.replaceChildren(); this.options.pauseWorld(false);
      this.returnFocus?.focus({ preventScroll: true });
    }, { signal: this.abort.signal });
    this.dialog.addEventListener('click', event => {
      if (event.target !== this.dialog) return;
      const rect = this.dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) this.dialog.close();
    }, { signal: this.abort.signal });
    this.dialog.addEventListener('keydown', event => {
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return;
      if (!this.active || this.saving) return;
      if (event.key === 'ArrowRight' && this.page < 2) { event.preventDefault(); this.changePage(1); }
      if (event.key === 'ArrowLeft' && this.page > 0) { event.preventDefault(); this.changePage(-1); }
    }, { signal: this.abort.signal });
  }
  openAlbum(): void { this.disposeComments?.(); this.disposeComments=undefined; this.song?.dispose(); this.song=null; this.active = null; this.giftStep = null; this.show(); this.renderAlbum(); }
  openStory(id: string): void {
    if (!this.options.visiting && this.options.gift && giftStops.indexOf(id as typeof giftStops[number]) > this.completed) return;
    const story = findStory(id); if (!story) return;
    const personalized = this.options.gift ? personalizeStory(story, this.options.gift, this.options.visiting ? 4 : this.completed) : { story, step: null };
    this.active = personalized.story; this.giftStep = personalized.step; this.page = 0;
    this.responseDraft = this.game.save.giftProgress?.id === this.options.gift?.id ? this.game.save.giftProgress?.response ?? '' : '';
    this.motion = !this.options.reducedMotion();
    this.show(); this.renderStory();
  }
  private show(): void {
    if (this.dialog.open) return;
    this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.options.pauseWorld(true); this.dialog.showModal();
  }
  private closeButton(): string { return '<button class="journal-close" aria-label="Cerrar recuerdos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button>'; }
  private renderAlbum(): void {
    this.dialog.dataset.birthday = 'false';
    this.dialog.dataset.gift = 'false'; this.dialog.dataset.proposal = 'false';
    this.dialog.dataset.view = 'album'; this.dialog.removeAttribute('data-theme');
    this.dialog.innerHTML = `
      ${this.closeButton()}
      <section class="journal-album">
        <header class="album-heading"><div><p class="journal-kicker">EL ÁLBUM DE TU ISLA</p><h2 id="journal-title" tabindex="-1">Pequeñas cosas<br><em>que se quedan.</em></h2><p class="album-intro">Lo que encuentras en tus paseos se queda aquí.</p></div><div class="album-counter"><strong>${savedStoryCount(this.game.save.memoriesRead)}</strong><small>recuerdos guardados</small></div></header>
        <div class="album-grid"></div>
        <p class="album-footer">Vuelve a su rincón para revivirlo.</p>
      </section>`;
    const grid = this.dialog.querySelector('.album-grid')!;
    stories.forEach((story) => {
      if (!this.options.visiting && !this.game.save.memoriesRead.includes(story.id)) return;
      if (!this.options.visiting && this.options.gift && giftStops.indexOf(story.id as typeof giftStops[number]) > this.completed) return;
      const card = document.createElement('article'); card.className = 'memory-card'; card.dataset.theme = story.theme;
      card.setAttribute('aria-label', `${story.object}: ${story.location}`);
      const saved = this.game.save.memoriesRead.includes(story.id);
      card.innerHTML = `<span class="memory-card-art" aria-hidden="true">${storySymbol(story.theme)}<span class="card-orbit"></span></span><span class="memory-card-copy"><span class="card-state ${saved ? 'is-saved' : ''}">DESCUBIERTO</span><strong></strong><span class="card-location"></span></span>`;
      card.querySelector('strong')!.textContent = story.title;
      card.querySelector('.card-location')!.textContent = story.location;
      grid.append(card);
    });
    if (!grid.childElementCount) {
      const empty = document.createElement('div'); empty.className = 'album-empty';
      empty.innerHTML = `<span aria-hidden="true">${storySymbol('seed')}</span><h3>Tu historia empieza explorando</h3><p>Un paseo, un encuentro, algo que se queda contigo.</p>`;
      grid.append(empty);
    }
    this.bindClose(); this.dialog.scrollTop = 0;
    this.dialog.querySelector<HTMLElement>('#journal-title')!.focus({ preventScroll: true });
  }
  private renderStory(): void {
    this.disposeComments?.(); this.disposeComments=undefined;
    this.song?.dispose();this.song=null;
    const story = this.active!;
    this.dialog.dataset.birthday = String(this.isBirthday);
    this.dialog.dataset.gift = String(this.giftStep !== null);
    this.dialog.dataset.reveal = String(this.revealStory);
    this.dialog.dataset.view = 'story'; this.dialog.dataset.theme = story.theme; this.dialog.dataset.motion = this.motion ? 'on' : 'off';
    this.dialog.innerHTML = `
      ${this.closeButton()}
      <div class="story-spread">
        <aside class="story-illustration" data-page="${this.page}">
          ${this.isBirthday ? birthdayArt() : storyArt(story.theme)}
          <button class="story-touch" aria-label="${story.theme === 'letter' ? 'Romper el sello' : 'Abrir los pétalos'}" ${this.revealStory ? '' : 'hidden'}>${story.theme === 'letter' ? '♡' : '✿'}</button>
          <span class="story-art-label">${this.isBirthday ? 'UNA ENTREGA DESDE LAS ESTRELLAS' : 'UN RECUERDO DEL JARDÍN'}</span>
          <div class="story-art-bottom"><span class="story-object-name"></span><span class="story-art-rule"></span><span class="story-art-number">0${stories.findIndex(s => s.id === story.id) + 1} / 0${stories.length}</span></div>
          <button class="story-motion" aria-pressed="${this.motion}" aria-label="${this.motion ? 'Pausar animación' : 'Activar animación'}">${this.motion ? 'Ⅱ Pausar animación' : '▷ Activar animación'}</button>
        </aside>
        <section class="story-reading">
          <button class="journal-back">← Volver al jardín</button>
          <p class="journal-kicker story-series"></p>
          <h2 id="journal-title"></h2>
          <div class="story-page-content"></div>
          <div class="story-pagination"><button class="story-prev" aria-label="Página anterior">←</button><span class="story-page-status" aria-live="polite"></span><span class="story-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>
          <button class="story-next"></button>
          <p class="story-save-status" role="status" aria-live="polite"></p>
        </section>
      </div>`;
    this.dialog.querySelector('.story-object-name')!.textContent = story.object;
    this.dialog.querySelector('.story-series')!.textContent = this.giftStep !== null ? `Carta ${this.giftStep + 1} de 4` : 'Recuerdos del jardín';
    this.dialog.querySelector('#journal-title')!.textContent = story.title;
    this.dialog.querySelector<HTMLButtonElement>('.journal-back')!.onclick = () => this.dialog.close();
    this.dialog.querySelector<HTMLButtonElement>('.story-prev')!.onclick = () => this.changePage(-1);
    this.dialog.querySelector<HTMLButtonElement>('.story-next')!.onclick = () => void this.advance();
    this.dialog.querySelector<HTMLButtonElement>('.story-motion')!.onclick = () => {
      this.motion = !this.motion; this.dialog.dataset.motion = this.motion ? 'on' : 'off';
      const button = this.dialog.querySelector<HTMLButtonElement>('.story-motion')!;
      button.textContent = this.motion ? 'Ⅱ Pausar animación' : '▷ Activar animación';
      button.setAttribute('aria-pressed', String(this.motion)); button.setAttribute('aria-label', this.motion ? 'Pausar animación' : 'Activar animación');
      button.innerHTML = controlIcon(this.motion ? 'pause' : 'play');
    };
    {
      const pagination = this.dialog.querySelector('.story-pagination')!;
      pagination.append(this.dialog.querySelector('.story-next')!);
      this.dialog.querySelector('.story-prev')!.innerHTML = controlIcon('previous');
      this.dialog.querySelector('.story-motion')!.innerHTML = controlIcon(this.motion ? 'pause' : 'play');
    }
    this.dialog.querySelector<HTMLButtonElement>('.story-touch')!.onclick = () => this.changePage(2);
    const songIndex=this.giftStep===0 ? 1 : this.giftStep===3 ? 0 : -1;
    if(this.options.gift && songIndex>=0 && this.options.gift.songs[songIndex]?.file) {
      this.song=new GiftSongPlayer(this.options.gift,songIndex,()=>this.options.pauseBackgroundMusic?.());
      this.dialog.querySelector('.story-pagination')!.before(this.song.element);
    }
    if(this.options.comments) this.disposeComments=mountComments(this.dialog.querySelector('.story-reading')!,story.id,this.options.comments.token);
    this.bindClose(); this.renderPage(); this.dialog.scrollTop = 0;
  }
  private renderPage(): void {
    const story = this.active!, page = story.pages[this.page];
    this.dialog.dataset.opened = String(this.page > 0);
    this.dialog.dataset.page = String(this.page);
    if (this.giftStep !== null) this.dialog.querySelector('#journal-title')!.textContent = page.heading;
    const touch = this.dialog.querySelector<HTMLButtonElement>('.story-touch')!; touch.hidden = !this.revealStory || this.page > 0;
    const content = this.dialog.querySelector('.story-page-content')!;
    content.replaceChildren();
    const paragraph = document.createElement('p'); paragraph.textContent = page.text;
    const quote = document.createElement('blockquote'); quote.textContent = page.line;
    content.append(paragraph); if (page.line && (!this.revealStory || this.page > 0)) content.append(quote);
    if (this.giftStep === 3) {
      // Avoid repeating the page heading above the question.
      if (this.page === 2) {
        paragraph.remove();
        this.dialog.querySelector('#journal-title')!.textContent = this.answered ? 'Un instante para guardar' : '¿Aceptas?';
        if (this.answered) {
          const seal = document.createElement('div'); seal.className = 'response-seal'; seal.innerHTML = controlIcon('save'); seal.setAttribute('aria-hidden','true');
          const answer = document.createElement('blockquote'); answer.className = 'sealed-answer'; answer.textContent = this.game.save.giftProgress!.response!;
          content.append(seal, answer);
        } else if (this.options.visiting) {
          const note=document.createElement('p'); note.className='shared-awaiting'; note.textContent='Esta carta aún espera su respuesta.'; content.append(note);
        } else {
        const label = document.createElement('label'); label.className = 'gift-response-label'; label.htmlFor = 'gift-response'; label.textContent = 'Tu respuesta';
        const field = document.createElement('textarea'); field.id = 'gift-response'; field.className = 'gift-response'; field.maxLength = 500; field.rows = 1; field.placeholder = 'Lo que te diga el corazón…'; field.value = this.responseDraft;
        field.oninput = () => { this.responseDraft = field.value; field.style.height = 'auto'; field.style.height = Math.min(140, field.scrollHeight) + 'px'; };
        const note = document.createElement('small'); note.className = 'response-once'; note.textContent = 'Al guardarla, tu respuesta queda cerrada.';
        content.append(label, field, note);
        }
      }
      this.dialog.dataset.proposal = 'true';
    } else this.dialog.dataset.proposal = 'false';
    content.classList.remove('story-reveal'); void (content as HTMLElement).offsetWidth; content.classList.add('story-reveal');
    this.dialog.querySelector<HTMLElement>('.story-illustration')!.dataset.page = String(this.page);
    (this.dialog.querySelector('.story-prev') as HTMLButtonElement).disabled = this.page === 0 || this.saving;
    this.dialog.querySelector('.story-page-status')!.textContent = `Página ${this.page + 1} de 3`;
    this.dialog.querySelectorAll('.story-dots i').forEach((dot, i) => dot.classList.toggle('active', i === this.page));
    const next = this.dialog.querySelector<HTMLButtonElement>('.story-next')!;
    const saved = this.saved;
    next.textContent = this.page < 2 ? story.actions[this.page] : saved ? 'Volver al jardín  →' : this.options.canSave() ? 'Guardar este recuerdo  ♡' : 'Volver al jardín  →';
    next.disabled = this.saving;
    if (this.giftStep !== null && this.page === 2 && !saved && this.options.canSave()) next.textContent = this.giftStep === 3 ? 'Guardar esta carta ♡' : 'Guardar pista y seguir ✧';
    if (this.giftStep === 3 && this.page === 2 && this.options.canSave()) next.textContent = this.answered ? 'Volver al jardín' : 'Guardar mi respuesta ♡';
    {
      const label = next.textContent ?? 'Continuar'; next.setAttribute('aria-label', label); next.title = label;
      next.innerHTML = controlIcon(this.page < 2 ? 'next' : this.options.canSave() && (this.giftStep === 3 && !this.answered || !saved) ? 'save' : 'close');
    }
    this.dialog.querySelector('.story-save-status')!.textContent = this.page === 2 && saved ? 'Guardado' : '';
    paragraph.tabIndex = -1; paragraph.focus({ preventScroll: true });
    if (this.giftStep !== null && this.giftStep < 3 && this.page === 2 && !saved && !this.saving && this.options.canSave()) void this.advance();
  }
  private changePage(direction: number): void {
    if (this.saving) return;
    this.page = Math.max(0, Math.min(2, this.page + (this.revealStory ? Math.sign(direction) * 2 : direction))); this.renderPage();
  }
  private async advance(): Promise<void> {
    if (!this.active || this.saving) return;
    if (this.page < 2) { this.changePage(this.revealStory ? 2 : 1); return; }
    const story = this.active;
    if (this.answered && this.giftStep === 3 || (this.saved && this.giftStep !== 3) || !this.options.canSave()) { this.dialog.close(); return; }
    this.saving = true;
    const button = this.dialog.querySelector<HTMLButtonElement>('.story-next')!;
    button.disabled = true;
    button.innerHTML = controlIcon('save'); button.setAttribute('aria-label', 'Guardando');
    try {
      if (this.giftStep === 3 && this.options.gift) await this.game.saveGiftResponse(this.options.gift.id, this.responseDraft);
      else if (this.giftStep !== null && this.options.gift) await this.game.completeGiftStep(this.options.gift.id, this.giftStep);
      else await this.game.readMemory(story.id);
      this.options.onSaved();
      if (this.dialog.open && this.active?.id === story.id) {
        this.dialog.classList.remove('memory-just-saved'); void this.dialog.offsetWidth; this.dialog.classList.add('memory-just-saved');
        this.renderPage(); this.dialog.querySelector('.story-save-status')!.textContent = 'Guardado';
      }
    } catch (error) {
      if (this.dialog.open && this.active?.id === story.id) {
        this.dialog.querySelector('.story-save-status')!.textContent = error instanceof Error ? error.message : 'No se pudo guardar. Inténtalo otra vez.';
        button.innerHTML = controlIcon('save'); button.setAttribute('aria-label', 'Volver a intentar'); button.title = 'Volver a intentar';
      }
    } finally {
      this.saving = false;
      if (button.isConnected) button.disabled = false;
      const current = this.dialog.querySelector<HTMLButtonElement>('.story-next'); if (current) current.disabled = false;
      const previous = this.dialog.querySelector<HTMLButtonElement>('.story-prev'); if (previous) previous.disabled = this.page === 0;
    }
  }
  private bindClose(): void { this.dialog.querySelector<HTMLButtonElement>('.journal-close')!.onclick = () => this.dialog.close(); }
  dispose(): void { this.disposeComments?.(); this.song?.dispose(); this.abort.abort(); this.dialog.remove(); }
}

