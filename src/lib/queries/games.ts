import { createPublicClient } from "@/lib/supabase/public";
import type { Game } from "@/lib/types/database";

/**
 * Published featured games for the landing page. Returns [] when
 * Supabase isn't configured or the query fails, so public pages
 * degrade to empty states instead of crashing.
 */
export async function getFeaturedGames(limit = 4): Promise<Game[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "published")
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .limit(limit);

  if (error) return [];
  return data;
}

/** All published games ordered for the library. */
export async function getPublishedGames(): Promise<Game[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) return [];
  return data;
}
