"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  evaluateOutcome,
  playerTotals,
  type Outcome,
  type ScoreEntry,
  type ScorekeeperConfig,
} from "@/lib/scoring/engine";
import { useScoreSession } from "@/lib/scoring/useScoreSession";
import type { Json, SessionWinner } from "@/lib/types/database";

export type SyncStatus =
  | { mode: "guest" }
  | { mode: "solo" }
  | { mode: "shared"; partnerName: string };

function isScoreEntry(value: unknown): value is ScoreEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (v.player === 0 || v.player === 1) && typeof v.value === "number";
}

function parseEntries(value: Json): ScoreEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: ScoreEntry[] = [];
  for (const item of value) {
    if (isScoreEntry(item)) entries.push(item);
  }
  return entries;
}

function winnerToEnum(outcome: Outcome): SessionWinner {
  if (outcome.winner === 0) return "player1";
  if (outcome.winner === 1) return "player2";
  return "tie";
}

/**
 * Local-first score session with an optional cloud layer:
 *  - guest: localStorage only (unchanged behavior)
 *  - signed in: the session is saved to Supabase for history
 *  - signed in + coupled: both partners share one live session row,
 *    synced via Supabase Realtime; last write wins
 */
export function useSyncedScoreSession(slug: string, config: ScorekeeperConfig) {
  const local = useScoreSession(slug, config);
  const { replaceEntries, replaceNames } = local;

  const [sync, setSync] = useState<SyncStatus>({ mode: "guest" });
  // Bumped on rematch to tear down and re-run adopt-or-create, so both
  // partners converge on one fresh session row instead of each making one.
  const [generation, setGeneration] = useState(0);
  const sessionIdRef = useRef<string | null>(null);
  const lastSyncedRef = useRef<string>("");
  const endedRef = useRef(false);
  const finishingRef = useRef(false);

  const outcome = useMemo(
    () => evaluateOutcome(config, local.entries),
    [config, local.entries],
  );

  // ---- adopt or create the cloud session once local state is loaded ----
  useEffect(() => {
    if (!local.ready || !isSupabaseConfigured()) return;

    const supabase = createClient();
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    async function connect() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      const { data: me } = await supabase
        .from("profiles")
        .select("display_name, couple_id")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || !me) return;

      let partnerName: string | null = null;
      if (me.couple_id) {
        const { data: partner } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("couple_id", me.couple_id)
          .neq("id", user.id)
          .maybeSingle();
        partnerName = partner?.display_name ?? null;
      }

      // Find the newest unfinished session for this game.
      let query = supabase
        .from("sessions")
        .select("*")
        .eq("game_slug", slug)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1);
      query = me.couple_id
        ? query.eq("couple_id", me.couple_id)
        : query.eq("created_by", user.id).is("couple_id", null);
      const { data: existing } = await query.maybeSingle();
      if (cancelled) return;

      let sessionId: string;
      if (existing) {
        sessionId = existing.id;
        const remoteEntries = parseEntries(existing.rounds);
        if (remoteEntries.length > 0) {
          replaceEntries(remoteEntries);
        }
        replaceNames([existing.player1_name, existing.player2_name]);
        lastSyncedRef.current = JSON.stringify(remoteEntries);
      } else {
        const player1 = me.display_name;
        const player2 = partnerName ?? "Player 2";
        const { data: created, error } = await supabase
          .from("sessions")
          .insert({
            game_slug: slug,
            couple_id: me.couple_id,
            created_by: user.id,
            player1_name: player1,
            player2_name: player2,
          })
          .select("id")
          .single();
        if (cancelled || error || !created) {
          if (error) console.warn("Could not start cloud session:", error.message);
          return;
        }
        sessionId = created.id;
        replaceNames([player1, player2]);
        lastSyncedRef.current = JSON.stringify([]);
      }

      sessionIdRef.current = sessionId;
      endedRef.current = false;
      setSync(
        me.couple_id && partnerName
          ? { mode: "shared", partnerName }
          : { mode: "solo" },
      );

      // Partners subscribe to the same row; last write wins.
      if (me.couple_id) {
        channel = supabase
          .channel(`session-${sessionId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "sessions",
              filter: `id=eq.${sessionId}`,
            },
            (payload) => {
              const row = payload.new as {
                rounds: Json;
                player1_name: string;
                player2_name: string;
              };
              const remoteEntries = parseEntries(row.rounds);
              const serialized = JSON.stringify(remoteEntries);
              if (serialized !== lastSyncedRef.current) {
                lastSyncedRef.current = serialized;
                replaceEntries(remoteEntries);
              }
              replaceNames([row.player1_name, row.player2_name]);
            },
          )
          .subscribe();
      }
    }

    void connect();
    return () => {
      cancelled = true;
      if (channel) void channel.unsubscribe();
      sessionIdRef.current = null;
      setSync({ mode: "guest" });
    };
  }, [local.ready, slug, generation, replaceEntries, replaceNames]);

  // ---- push local changes up (debounced, skip remote echoes) ----
  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || endedRef.current) return;
    const serialized = JSON.stringify(local.entries);
    if (serialized === lastSyncedRef.current) return;

    const timer = setTimeout(() => {
      lastSyncedRef.current = serialized;
      const supabase = createClient();
      void supabase
        .from("sessions")
        .update({
          rounds: local.entries as unknown as Json,
          final_scores: {
            player1: playerTotals(local.entries)[0],
            player2: playerTotals(local.entries)[1],
          },
          player1_name: local.names[0].trim() || "Player 1",
          player2_name: local.names[1].trim() || "Player 2",
        })
        .eq("id", sessionId)
        .then(({ error }) => {
          if (error) console.warn("Score sync failed:", error.message);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [local.entries, local.names]);

  // ---- record the result when the game finishes ----
  useEffect(() => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || !outcome.finished || endedRef.current || finishingRef.current) {
      return;
    }
    finishingRef.current = true;
    const supabase = createClient();
    void supabase
      .from("sessions")
      .update({
        winner: winnerToEnum(outcome),
        ended_at: new Date().toISOString(),
        rounds: local.entries as unknown as Json,
        final_scores: {
          player1: playerTotals(local.entries)[0],
          player2: playerTotals(local.entries)[1],
        },
      })
      .eq("id", sessionId)
      .then(({ error }) => {
        finishingRef.current = false;
        if (error) {
          console.warn("Could not save the finished game:", error.message);
        } else {
          endedRef.current = true;
        }
      });
  }, [outcome, local.entries]);

  // ---- reset / rematch ----
  const reset = useCallback(() => {
    if (sessionIdRef.current && endedRef.current) {
      // The finished game is saved. Reconnect: adopt the partner's fresh
      // session row if they already rematched, otherwise create one.
      sessionIdRef.current = null;
      endedRef.current = false;
      local.reset();
      setGeneration((g) => g + 1);
      return;
    }
    // Unfinished: clear entries; the push effect syncs the empty board.
    local.reset();
  }, [local]);

  return {
    ready: local.ready,
    names: local.names,
    entries: local.entries,
    outcome,
    sync,
    addEntry: local.addEntry,
    undo: local.undo,
    reset,
    setName: local.setName,
  };
}
