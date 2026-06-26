import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser/anon Supabase client. Uses the public anon (publishable) key only —
 * these values are public by design (they ship in the client bundle) and the
 * data is protected by RLS. They default to the project's values so the app
 * works even when the Vercel env vars aren't set; override via
 * NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY to point elsewhere.
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://bbvxygtkkpqdurayhslr.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_EpInbv_WMSm-7USNa0qlPg_66hHvt7h';

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!cached) {
    cached = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return cached;
}

export const isBackendConfigured = (): boolean =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
