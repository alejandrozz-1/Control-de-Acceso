import { createClient } from '@supabase/supabase-js';

/** Cliente Supabase único (la autorización real vive en RLS, ver ADR-002). */
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
