import { createClient } from "@/lib/supabase/server";
import type { GameSession } from "@/lib/types/database";

/**
 * Finished sessions visible to the signed-in user (their own plus their
 * couple's — RLS scopes the rows). Newest first.
 */
export async function getFinishedSessions(limit = 100): Promise<GameSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data;
}

/** Unfinished sessions (games in progress), newest first. */
export async function getActiveSessions(limit = 3): Promise<GameSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data;
}

/** Finished sessions belonging to a couple, newest first. */
export async function getCoupleSessions(
  coupleId: string,
  limit = 500,
): Promise<GameSession[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("couple_id", coupleId)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data;
}
