import { supabase } from '../../infrastructure/cloud/supabase';
const svg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 4h16v12H9l-5 4Z"/></svg>';
export function mountComments(parent: HTMLElement, story: string, visitToken?: string): () => void {
 const section=document.createElement('details'); section.className='card-conversation';
 section.innerHTML=`<summary>${svg}<span>Voces que se quedan</span></summary><div class="conversation-body"><p class="comment-status" role="status"></p><div class="comment-list"></div><button class="secondary comment-more" hidden>Ver anteriores</button><form class="comment-form" hidden><label>Tu nombre<input name="nickname" maxlength="40" required value="Viajero"></label><label>Deja unas palabras<textarea name="body" maxlength="500" rows="2" required placeholder="Algo bonito de tu visita…"></textarea></label><button class="secondary" type="submit">Enviar mensaje</button></form><button class="secondary comment-login" hidden>Entrar con Google para comentar</button><button class="text-button comment-account" hidden>Cambiar mi cuenta</button><button class="text-button comment-refresh">Actualizar conversación</button></div>`;
 parent.append(section);let disposed=false,token=visitToken,before:string|undefined,busy=false;
 const status=section.querySelector<HTMLElement>('.comment-status')!,list=section.querySelector<HTMLElement>('.comment-list')!,form=section.querySelector<HTMLFormElement>('form')!,more=section.querySelector<HTMLButtonElement>('.comment-more')!,login=section.querySelector<HTMLButtonElement>('.comment-login')!;
 const report=(text:string)=>{if(!disposed)status.textContent=text;};
 async function refresh(append=false){
  if(busy)return;busy=true;report('Buscando mensajes…');
  try{
   if(!token){const r=await supabase.rpc('get_my_visit');if(r.error)throw r.error;token=r.data?.token;}
   if(!token){report('Activa una invitación para recibir mensajes aquí.');return;}
   const session=await supabase.auth.getSession();
   const {data,error}=await supabase.rpc('read_visit_comments',{p_token:token,p_story:story,p_before:append?before:null});if(error)throw error;if(disposed)return;
   if(!append)list.replaceChildren();
   for(const row of data ?? []){
    const article=document.createElement('article'),name=document.createElement('strong'),text=document.createElement('p'),date=document.createElement('time');
    name.textContent=row.nickname;text.textContent=row.body;date.textContent=new Date(row.created_at).toLocaleString('es');date.dateTime=row.created_at;article.append(name,date,text);
    if(row.can_delete){const remove=document.createElement('button');remove.className='text-button';remove.textContent='Eliminar';remove.onclick=async()=>{remove.disabled=true;const result=await supabase.rpc('delete_visit_comment',{p_token:token,p_id:row.id});if(disposed)return;if(result.error){report('No se pudo eliminar.');remove.disabled=false;}else await refresh();};article.append(remove);}
    list.append(article);
   }
   before=data?.at(-1)?.id;more.hidden=(data?.length??0)<30;
   form.hidden=!session.data.session;login.hidden=!!session.data.session;
   section.querySelector<HTMLButtonElement>('.comment-account')!.hidden=!session.data.session;
   report(list.childElementCount?'':'Sé la primera persona en dejar unas palabras.');
  }catch{report('No se pudo abrir la conversación. Comprueba la conexión o la invitación.');}finally{busy=false;}
 }
 section.addEventListener('toggle',()=>{if(section.open&&!list.childElementCount)void refresh();});
 more.onclick=()=>void refresh(true);section.querySelector<HTMLButtonElement>('.comment-refresh')!.onclick=()=>void refresh();
 login.onclick=async()=>{login.disabled=true;const result=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/?visit='+encodeURIComponent(token!)}});if(result.error){report('No se pudo abrir Google.');login.disabled=false;}};
 section.querySelector<HTMLButtonElement>('.comment-account')!.onclick=async()=>{const r=await supabase.auth.signOut({scope:'local'});if(r.error)report('No se pudo cerrar tu sesión.');else await refresh();};
 form.onsubmit=async event=>{event.preventDefault();if(busy)return;busy=true;const button=form.querySelector('button')!;button.disabled=true;
  const body=form.elements.namedItem('body') as HTMLTextAreaElement,nickname=form.elements.namedItem('nickname') as HTMLInputElement;
  try{const {error}=await supabase.rpc('add_visit_comment',{p_token:token,p_story:story,p_nickname:nickname.value.trim(),p_body:body.value.trim()});if(error)throw error;if(disposed)return;body.value='';busy=false;await refresh();}
  catch{report('No se pudo enviar. Revisa tu sesión y espera 15 segundos antes de intentar otra vez.');}finally{busy=false;button.disabled=false;}
 };
 return()=>{disposed=true;section.remove();};
}
