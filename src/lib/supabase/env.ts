/** Shown in auth forms when the Supabase env vars are missing. */
export const AUTH_NOT_CONFIGURED_MESSAGE =
  "Accounts aren't available right now — the app isn't connected to its " +
  "account service. If you're the site owner: set NEXT_PUBLIC_SUPABASE_URL " +
  "and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment's environment " +
  "variables, then redeploy (they're baked in at build time).";

export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * True once NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are set. Pages that read
 * public data check this so the app still renders (with empty states)
 * before a Supabase project is connected.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).",
    );
  }
  return env;
}
