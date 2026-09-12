import { createClient } from '@supabase/supabase-js';
import { cloudConfig } from '../../content/cloud';
import type { PrivateGift } from '../../domain/privateGift';
import { supabase, boundedFetch } from './supabase';

export async function giftAudioUrl(gift: PrivateGift, index: number): Promise<string> {
  const file = gift.songs[index]?.file;
  if (!file) throw new Error('Esta canción todavía no está disponible.');
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('gift-preview') === '1') return `/__private-gift-audio?track=${index}`;
  const visit = new URLSearchParams(location.search).get('visit');
  let client = supabase;
  if (visit) {
    const result = await supabase.rpc('read_world_visit_v2', { p_key: visit });
    if (result.error || !result.data?.token) throw new Error('La invitación ya no está disponible.');
    client = createClient(cloudConfig.url, cloudConfig.publishableKey, { auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }, global: { fetch: boundedFetch, headers: { 'x-visit-token': result.data.token } } });
  }
  const { data, error } = await client.storage.from('gift-audio').createSignedUrl(`${gift.id}/${file}`, 60);
  if (error || !data?.signedUrl) throw new Error('No se pudo abrir la canción. Inténtalo de nuevo.');
  return data.signedUrl;
}
