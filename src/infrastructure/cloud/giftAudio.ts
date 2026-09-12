import type { PrivateGift } from '../../domain/privateGift';
import { supabase } from './supabase';

export async function giftAudioUrl(gift: PrivateGift, index: number): Promise<string> {
  const file = gift.songs[index]?.file;
  if (!file) throw new Error('Esta canción todavía no está disponible.');
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('gift-preview') === '1') return `/__private-gift-audio?track=${index}`;
  const { data, error } = await supabase.storage.from('gift-audio').createSignedUrl(`${gift.id}/${file}`, 900);
  if (error || !data?.signedUrl) throw new Error('No se pudo abrir la canción. Inténtalo de nuevo.');
  return data.signedUrl;
}
