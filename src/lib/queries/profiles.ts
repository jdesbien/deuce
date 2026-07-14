import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export interface CurrentUser {
  user: User;
  profile: Profile | null;
}

/**
 * The signed-in user and their profile, or null when signed out
 * (or when Supabase isn't configured yet). Server-side only.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: profile ?? null };
}

/** True when the current user has the admin role. Server-side only. */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const current = await getCurrentUser();
  return current?.profile?.role === "admin";
}
