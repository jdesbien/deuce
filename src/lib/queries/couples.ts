import { createClient } from "@/lib/supabase/server";
import type { Couple, Profile } from "@/lib/types/database";

/** The other member of a couple, or null while waiting for them. */
export async function getPartnerProfile(
  coupleId: string,
  myId: string,
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("couple_id", coupleId)
    .neq("id", myId)
    .maybeSingle();
  return data ?? null;
}

export async function getCouple(coupleId: string): Promise<Couple | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("couples")
    .select("*")
    .eq("id", coupleId)
    .maybeSingle();
  return data ?? null;
}
