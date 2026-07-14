"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types/database";
import { requireSupabaseEnv } from "@/lib/supabase/env";

/** Browser Supabase client for Client Components. */
export function createClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
