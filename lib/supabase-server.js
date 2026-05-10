import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for Route Handlers / server code.
 * Prefer SUPABASE_SERVICE_ROLE_KEY for inserts; falls back to anon key if unset.
 */
export function createSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key (anon or service role).",
    );
  }

  return createClient(url, key);
}
