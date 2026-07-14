import { createClient } from "@/lib/supabase/server";
import type { Feedback, Profile } from "@/lib/types/database";

/**
 * Admin-only reads. These run with the signed-in admin's session — the
 * "admins read all" RLS policies are what grant the visibility, so a
 * non-admin calling these gets empty results, not an error.
 */

export interface AdminCounts {
  users: number;
  couples: number;
  sessionsThisWeek: number;
  newFeedback: number;
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const supabase = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [users, couples, sessions, feedback] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("couples").select("*", { count: "exact", head: true }),
    supabase
      .from("sessions")
      .select("*", { count: "exact", head: true })
      .gte("started_at", weekAgo),
    supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  return {
    users: users.count ?? 0,
    couples: couples.count ?? 0,
    sessionsThisWeek: sessions.count ?? 0,
    newFeedback: feedback.count ?? 0,
  };
}

export async function searchProfiles(query: string): Promise<Profile[]> {
  const supabase = await createClient();
  let request = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (query.trim() !== "") {
    request = request.ilike("display_name", `%${query.trim()}%`);
  }
  const { data, error } = await request;
  if (error) return [];
  return data;
}

export async function getFeedbackList(): Promise<Feedback[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return [];
  return data;
}
