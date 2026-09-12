// Public browser configuration. This publishable key is not an administrative secret.
// Access to every world is enforced by Auth + RLS and the versioned SQL function.
export const cloudConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://lnjwbnhhwsmtonuxlasd.supabase.co',
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_60na6pMiEiNxpXcjUoFHVA_XdRRm0VL',
};
