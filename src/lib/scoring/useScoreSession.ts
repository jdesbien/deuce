"use client";

import { useCallback, useEffect, useState } from "react";

import {
  undoLast,
  withEntry,
  type ScoreEntry,
  type ScorekeeperConfig,
  type PlayerIndex,
} from "@/lib/scoring/engine";

const NAMES_KEY = "c4c:players";
const sessionKey = (slug: string) => `c4c:score:${slug}`;

interface StoredSession {
  version: 1;
  entries: ScoreEntry[];
}

interface SessionState {
  ready: boolean;
  names: [string, string];
  entries: ScoreEntry[];
}

const INITIAL_STATE: SessionState = {
  ready: false,
  names: ["Player 1", "Player 2"],
  entries: [],
};

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full/blocked — scoring still works for this visit.
  }
}

/**
 * Guest-first score session: entries persist per game and player names
 * persist across games, all in localStorage so a refresh mid-game loses
 * nothing. Loads after mount to keep server/client HTML identical.
 */
export function useScoreSession(slug: string, config: ScorekeeperConfig) {
  const [state, setState] = useState<SessionState>(INITIAL_STATE);

  useEffect(() => {
    const storedNames = readJson<[string, string]>(NAMES_KEY);
    const stored = readJson<StoredSession>(sessionKey(slug));
    // One-shot hydration from localStorage (an external system) after
    // mount, so server and first client render stay identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      ready: true,
      names:
        storedNames?.length === 2 ? storedNames : INITIAL_STATE.names,
      entries:
        stored?.version === 1 && Array.isArray(stored.entries)
          ? stored.entries
          : [],
    });
  }, [slug]);

  useEffect(() => {
    if (!state.ready) return;
    writeJson(sessionKey(slug), {
      version: 1,
      entries: state.entries,
    } satisfies StoredSession);
    writeJson(NAMES_KEY, state.names);
  }, [slug, state]);

  const addEntry = useCallback(
    (entry: ScoreEntry) => {
      setState((current) => ({
        ...current,
        entries: withEntry(config, current.entries, entry),
      }));
    },
    [config],
  );

  const undo = useCallback(() => {
    setState((current) => ({
      ...current,
      entries: undoLast(current.entries),
    }));
  }, []);

  const reset = useCallback(() => {
    setState((current) => ({ ...current, entries: [] }));
  }, []);

  const setName = useCallback((player: PlayerIndex, name: string) => {
    setState((current) => {
      const names: [string, string] = [...current.names];
      names[player] = name;
      return { ...current, names };
    });
  }, []);

  return {
    ready: state.ready,
    names: state.names,
    entries: state.entries,
    addEntry,
    undo,
    reset,
    setName,
  };
}
