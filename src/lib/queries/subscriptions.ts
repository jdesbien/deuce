import { PRO_STATUSES } from "@/lib/billing/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export type Subscription =
  Database["public"]["Tables"]["subscriptions"]["Row"];

/** The signed-in user's subscription row, if any. Server-side only. */
export async function getMySubscription(): Promise<Subscription | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ?? null;
}

/**
 * Is the signed-in user Pro (ad-free)? Entitlement is decided here on
 * the server from webhook-written state — never trusted from the client.
 */
export async function getIsPro(): Promise<boolean> {
  const subscription = await getMySubscription();
  return subscription !== null && PRO_STATUSES.has(subscription.status);
}
