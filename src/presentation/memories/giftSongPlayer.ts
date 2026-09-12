import type { PrivateGift } from '../../domain/privateGift';
import { giftAudioUrl } from '../../infrastructure/cloud/giftAudio';

const symbol = (pause: boolean) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${pause ? '<path d="M9 5v14M15 5v14"/>' : '<path d="m9 5 10 7-10 7Z"/>'}</svg>`;
export class GiftSongPlayer {
  readonly element = document.createElement('div');
  private audio = new Audio();
  private button = document.createElement('button');
  private status = document.createElement('span');
  private progress = document.createElement('progress');
  private version = 0;
  private disposed = false;
  private abort = new AbortController();
  constructor(private gift: PrivateGift, private index: number, private pauseBackground: () => void) {
    const song = gift.songs[index];
    this.element.className = 'gift-song';
    this.button.type='button';this.button.className='gift-song-toggle';
    const copy=document.createElement('div');copy.className='gift-song-copy';
    const invitation=document.createElement('small');invitation.textContent='Una canción para este momento';
    const title=document.createElement('strong');title.textContent=song.title;
    const artist=document.createElement('span');artist.textContent=song.artist;
    this.status.className='gift-song-status';this.status.setAttribute('role','status');
    this.progress.max=1;this.progress.value=0;this.progress.setAttribute('aria-label','Progreso de la canción');
    copy.append(invitation,title,artist,this.progress,this.status);
    this.audio.preload='none';this.audio.volume=.45;this.audio.hidden=true;
    this.element.append(this.button,copy,this.audio);
    this.button.onclick=()=>void this.toggle();
    this.audio.onplay=()=>this.render();this.audio.onpause=()=>this.render();this.audio.onended=()=>this.render();
    this.audio.ontimeupdate=()=>{this.progress.value=Number.isFinite(this.audio.duration) && this.audio.duration>0 ? this.audio.currentTime/this.audio.duration : 0;};
    this.audio.onerror=()=>{this.audio.pause();this.status.textContent='No pudo sonar. Toca para reintentar.';this.audio.removeAttribute('src');this.render();};
    document.addEventListener('visibilitychange',()=>{if(document.hidden){++this.version;this.audio.pause();this.button.disabled=false;}},{signal:this.abort.signal});
    this.render();
  }
  private render(): void {
    if(this.disposed)return;
    const playing=!this.audio.paused && !this.audio.ended;
    this.button.innerHTML=symbol(playing);this.button.setAttribute('aria-label',`${playing?'Pausar':'Reproducir'} ${this.gift.songs[this.index].title}`);this.button.setAttribute('aria-pressed',String(playing));
  }
  private async toggle(): Promise<void> {
    if(!this.audio.paused){++this.version;this.audio.pause();return;}
    const version=++this.version;this.button.disabled=true;this.status.textContent='';
    try {
      if(!this.audio.getAttribute('src')) {
        const url=await giftAudioUrl(this.gift,this.index);
        if(this.disposed || version!==this.version)return;
        this.audio.src=url;
      }
      if(this.disposed || version!==this.version)return;
      this.pauseBackground(); await this.audio.play();
      if(this.disposed || version!==this.version)this.audio.pause();
    } catch {if(!this.disposed && version===this.version)this.status.textContent='Toca para intentar reproducir de nuevo.';}
    finally {if(!this.disposed){this.button.disabled=false;this.render();}}
  }
  dispose(): void {this.disposed=true;++this.version;this.abort.abort();this.audio.onplay=null;this.audio.onpause=null;this.audio.onended=null;this.audio.onerror=null;this.audio.ontimeupdate=null;this.audio.pause();this.audio.removeAttribute('src');this.audio.load();this.element.remove();}
}
