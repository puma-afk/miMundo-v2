import { supabase } from './supabase';
import { parseGift } from '../../domain/privateGift';
import type { PrivateGift } from '../../domain/privateGift';

/** No fallback recipient and no public cache. Fail closed when authorization/network is unavailable. */
export async function loadPrivateGift(ownerId: string | null): Promise<PrivateGift | null> {
  if (import.meta.env.DEV && !ownerId && new URLSearchParams(location.search).get('gift-preview') === '1') {
    const response = await fetch('/__private-gift-preview', { cache: 'no-store' });
    if (response.ok) return parseGift(await response.json());
    return null;
  }
  if (!ownerId) return null;
  const { data, error } = await supabase.from('world_gifts').select('payload').eq('owner_id', ownerId).maybeSingle();
  if (error) return null;
  if (data) return parseGift(data.payload);
  const claim = await supabase.rpc('claim_my_gift');
  if (claim.error || claim.data !== true) return null;
  const assigned = await supabase.from('world_gifts').select('payload').eq('owner_id',ownerId).maybeSingle();
  return assigned.error || !assigned.data ? null : parseGift(assigned.data.payload);
}
