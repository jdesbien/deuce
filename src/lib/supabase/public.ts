import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Cookie-less anon client for public, cacheable reads (published games,
 * app settings). Because it never touches request cookies, pages using it
 * can be statically rendered. Returns null when Supabase isn't configured
 * so callers can render empty states instead of crashing.
 */
export function createPublicClient() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createSupabaseClient<Database>(env.url, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
