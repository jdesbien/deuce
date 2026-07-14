/**
 * Pure scorekeeping engine — no React, no browser APIs — so the same
 * logic can back the web UI today and a native wrapper later.
 *
 * Each game's `scoring.type` maps to a ScorekeeperConfig that drives one
 * of four board UIs:
 *   points    — numeric totals per player (up or down-is-good)
 *   tally     — counters for games/hands won
 *   countdown — start value counting down to zero (Schnapsen)
 *   partie    — fixed number of deals, then compare (Piquet)
 */

import type { GameScoring, ScoringType } from "@/lib/content/types";

export type PlayerIndex = 0 | 1;

export interface ScoreEntry {
  player: PlayerIndex;
  value: number;
  note?: string;
  /** 1-based deal number (partie boards only). */
  deal?: number;
  /** Entries the engine added itself (e.g. Yaniv halving). Undo removes them with their trigger. */
  auto?: boolean;
}

export type BoardKind = "points" | "tally" | "countdown" | "partie";

export type TargetMode =
  | "reach-to-win" // first to reach target wins (Gin 100, Cribbage 121)
  | "reach-to-lose" // reaching target loses; low is good (Twenty, Yaniv)
  | "none"; // open-ended; players decide when to stop

export interface ScorekeeperConfig {
  scoringType: ScoringType;
  kind: BoardKind;
  unit: string;
  target: number | null;
  targetMode: TargetMode;
  /** Countdown boards start here (Schnapsen: 7). */
  startValue: number;
  /** Low totals are good (penalty games). */
  lowIsGood: boolean;
  /** Values offered as one-tap buttons. */
  quickValues: number[];
  /** Offer a free-number input alongside quick buttons. */
  allowCustom: boolean;
  /** Label over each player's counter ("points", "games won", …). */
  counterLabel: string;
  /** Partie boards: number of deals before comparing. */
  dealsTotal?: number;
  /** Best-of boards: total hands in the series (display only). */
  seriesLength?: number;
  /** Named special behaviors the engine applies on entry. */
  specialRule?: "yaniv-halving";
  /** One-line reminder shown at the top of the board. */
  hint: string;
}

/** Per-game one-tap values reflecting each game's common scores. */
const QUICK_VALUES: Record<string, number[]> = {
  "gin-rummy": [5, 10, 20, 25],
  "cribbage-six-card": [1, 2, 3, 4, 6, 12],
  escoba: [1, 2, 3],
  porrazo: [1, 2, 3, 4, 12],
  "all-fives": [5, 10, 15, 20],
  "casino-swazi": [1, 2, 3],
  tartli: [10, 20, 50, 100],
  clobyosh: [10, 20, 50],
  twenty: [5, 10, 20],
  yaniv: [5, 10, 30],
  sedma: [1, 2, 3],
  "go-stop": [1, 2, 3, 5, 7],
};

export function getScorekeeperConfig(
  slug: string,
  scoring: GameScoring,
): ScorekeeperConfig {
  const quick = QUICK_VALUES[slug] ?? [1, 2, 5, 10];
  const base = {
    scoringType: scoring.type,
    unit: scoring.unit,
    startValue: 0,
    lowIsGood: false,
    quickValues: quick,
    allowCustom: true,
    counterLabel: scoring.unit,
  };

  switch (scoring.type) {
    case "running-total":
      return {
        ...base,
        kind: "points",
        target: scoring.target,
        targetMode: "reach-to-win",
        hint: `First to ${scoring.target} ${scoring.unit} wins.`,
      };
    case "penalty-to-limit":
      return {
        ...base,
        kind: "points",
        target: scoring.target,
        targetMode: "reach-to-lose",
        lowIsGood: true,
        hint: `Low is good — reach ${scoring.target} penalty points and you lose.`,
      };
    case "penalty-elimination":
      return {
        ...base,
        kind: "points",
        target: scoring.target,
        targetMode: "reach-to-lose",
        lowIsGood: true,
        specialRule: "yaniv-halving",
        hint: `Low is good — pass ${scoring.target} and you're out. Landing exactly on 100 or 200 halves your score.`,
      };
    case "match-countdown":
      return {
        ...base,
        kind: "countdown",
        target: 0,
        targetMode: "reach-to-win",
        startValue: scoring.startValue ?? 7,
        quickValues: [1, 2, 3],
        allowCustom: false,
        counterLabel: "game points left",
        hint: `Both players start at ${scoring.startValue ?? 7} and count down — first to 0 wins the Bummerl.`,
      };
    case "win-loss":
      return {
        ...base,
        kind: "tally",
        target: null,
        targetMode: "none",
        quickValues: [1],
        allowCustom: false,
        counterLabel: "games won",
        hint: "No points in this one — tap the winner after each game.",
      };
    case "instant-win":
      return {
        ...base,
        kind: "tally",
        target: null,
        targetMode: "none",
        quickValues: [1],
        allowCustom: false,
        counterLabel: "games won",
        hint: "Points live on the table during play — track games won here.",
      };
    case "best-of-series":
      return {
        ...base,
        kind: "tally",
        target: scoring.target,
        targetMode: "reach-to-win",
        quickValues: [1],
        allowCustom: false,
        counterLabel: "hands won",
        seriesLength: 11,
        hint: `Best of 11 — first to ${scoring.target} hands wins.`,
      };
    case "stake-based":
      return {
        ...base,
        kind: "points",
        target: null,
        targetMode: "none",
        counterLabel: "stakes",
        hint: "1 stake for most points, 2 for all 90, 3 for every trick. Play to any target you agree on.",
      };
    case "stop-or-go":
      return {
        ...base,
        kind: "points",
        target: null,
        targetMode: "none",
        counterLabel: "chips",
        hint: "After each deal, add the chips the winner collected (score × any multipliers).",
      };
    case "partie-total":
      return {
        ...base,
        kind: "partie",
        target: null,
        targetMode: "none",
        dealsTotal: 6,
        hint: "Six deals make a partie. Enter both scores after each deal; the rubicon is settled at the end.",
      };
  }
}

// ------------------------------------------------------------------
// Totals & entries
// ------------------------------------------------------------------

export function playerTotals(entries: ScoreEntry[]): [number, number] {
  const totals: [number, number] = [0, 0];
  for (const entry of entries) totals[entry.player] += entry.value;
  return totals;
}

/** What each player's counter should display (countdown boards count down). */
export function displayTotals(
  config: ScorekeeperConfig,
  entries: ScoreEntry[],
): [number, number] {
  const [a, b] = playerTotals(entries);
  if (config.kind === "countdown") {
    return [Math.max(0, config.startValue - a), Math.max(0, config.startValue - b)];
  }
  return [a, b];
}

/**
 * Append an entry, applying any special rule. Yaniv: landing exactly on
 * 100 or 200 halves the score (100→50, 200→100) via an auto entry.
 */
export function withEntry(
  config: ScorekeeperConfig,
  entries: ScoreEntry[],
  entry: ScoreEntry,
): ScoreEntry[] {
  const next = [...entries, entry];
  if (config.specialRule === "yaniv-halving") {
    const total = playerTotals(next)[entry.player];
    if (total === 200 || total === 100) {
      next.push({
        player: entry.player,
        value: -(total / 2),
        note: `Landed exactly on ${total} — halved to ${total / 2}!`,
        auto: true,
      });
    }
  }
  return next;
}

/** Remove the last manual entry plus any auto entries it triggered. */
export function undoLast(entries: ScoreEntry[]): ScoreEntry[] {
  let end = entries.length;
  while (end > 0 && entries[end - 1].auto) end -= 1;
  if (end === 0) return entries.slice(0, 0);
  return entries.slice(0, end - 1);
}

// ------------------------------------------------------------------
// Outcome
// ------------------------------------------------------------------

export interface Outcome {
  finished: boolean;
  /** Winning player, or null when unfinished / tied. */
  winner: PlayerIndex | null;
  detail: string;
}

const NO_OUTCOME: Outcome = { finished: false, winner: null, detail: "" };

export function evaluateOutcome(
  config: ScorekeeperConfig,
  entries: ScoreEntry[],
): Outcome {
  if (config.kind === "partie") return evaluatePartie(config, entries);
  if (config.target === null || config.targetMode === "none") {
    return NO_OUTCOME;
  }

  // Walk chronologically so the FIRST crossing decides, even if a later
  // correction changes totals.
  const running: [number, number] = [0, 0];
  for (const entry of entries) {
    running[entry.player] += entry.value;

    if (config.kind === "countdown") {
      if (config.startValue - running[entry.player] <= 0) {
        return {
          finished: true,
          winner: entry.player,
          detail: "Counted down to zero.",
        };
      }
      continue;
    }

    if (running[entry.player] >= config.target) {
      if (config.targetMode === "reach-to-win") {
        return {
          finished: true,
          winner: entry.player,
          detail: `Reached ${config.target} ${config.unit}.`,
        };
      }
      // reach-to-lose: the other player wins.
      const other: PlayerIndex = entry.player === 0 ? 1 : 0;
      return {
        finished: true,
        winner: other,
        detail: `Opponent hit the ${config.target}-point limit.`,
      };
    }
  }
  return NO_OUTCOME;
}

function evaluatePartie(
  config: ScorekeeperConfig,
  entries: ScoreEntry[],
): Outcome {
  const dealsTotal = config.dealsTotal ?? 6;
  if (completedDeals(entries) < dealsTotal) return NO_OUTCOME;

  const [a, b] = playerTotals(entries);
  if (a === b) {
    return {
      finished: false,
      winner: null,
      detail: "Tied after six deals — play an extra deal to decide it.",
    };
  }

  const winner: PlayerIndex = a > b ? 0 : 1;
  const winnerScore = Math.max(a, b);
  const loserScore = Math.min(a, b);
  // Rubicon: a loser short of 100 pays the SUM of both scores + 100.
  const margin =
    loserScore >= 100 ? winnerScore - loserScore + 100 : winnerScore + loserScore + 100;
  const rubicon = loserScore < 100 ? " Rubicon — the loser never crossed 100!" : "";
  return {
    finished: true,
    winner,
    detail: `Wins the partie by ${margin} game points.${rubicon}`,
  };
}

/** Number of deals with both players' scores recorded. */
export function completedDeals(entries: ScoreEntry[]): number {
  const seen = new Map<number, Set<PlayerIndex>>();
  for (const entry of entries) {
    if (entry.deal === undefined) continue;
    const players = seen.get(entry.deal) ?? new Set<PlayerIndex>();
    players.add(entry.player);
    seen.set(entry.deal, players);
  }
  let count = 0;
  for (const players of seen.values()) {
    if (players.size === 2) count += 1;
  }
  return count;
}
