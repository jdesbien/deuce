/**
 * Types for the game content in `src/data/games.json`.
 *
 * Beyond the core fields, games carry extra free-form sections
 * (cardValues, specialRules, theShow, …) — those are surfaced through the
 * index signature and rendered generically by the learn-to-play page.
 */

export type ScoringType =
  | "running-total"
  | "win-loss"
  | "penalty-to-limit"
  | "penalty-elimination"
  | "match-countdown"
  | "stake-based"
  | "instant-win"
  | "best-of-series"
  | "stop-or-go"
  | "partie-total";

/** Extra content values: paragraph, list, or a keyed group of either. */
export type SectionValue =
  | string
  | string[]
  | Record<string, string | string[]>;

export interface GameScoring {
  type: ScoringType;
  target: number | null;
  unit: string;
  startValue?: number;
  [extra: string]: unknown;
}

export interface ContentGame {
  id: string;
  name: string;
  aka?: string[];
  origin?: string;
  /** 1 (easiest) to 5 (hardest). */
  difficulty: number;
  family?: string;
  isDominoes?: boolean;
  summary: string;
  equipment: string;
  objective: string;
  setup: string[];
  play: string[];
  scoring: GameScoring;
  winning: string;
  sourceUrl?: string;
  [extra: string]: unknown;
}

export interface GamesFile {
  meta: {
    title: string;
    description: string;
    gameCount: number;
    sourceCredit: string;
    [extra: string]: unknown;
  };
  games: ContentGame[];
}
