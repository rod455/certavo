import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser/anon Supabase client. Uses the public anon (publishable) key only.
 * The service role key is never exposed here — server-side writes go through
 * Edge Functions / RPC that revalidate input.
 */
let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null; // app still runs fully offline without a backend
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return cached;
}

export const isBackendConfigured = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
