/**
 * Couple badges — the milestone system that gives game nights a sense of
 * progress. Every badge is derived purely from finished sessions, so
 * there's nothing extra to store; earned badges can never be lost.
 *
 * If/when the cards4couples-engagement content file lands, reconcile
 * these definitions with it.
 */

import type { GameSession } from "@/lib/types/database";

export interface CoupleStats {
  totalGames: number;
  /** Distinct local dates with at least one finished game. */
  nights: number;
  distinctGames: number;
  maxGamesInOneNight: number;
  /** Any game finished between midnight and 5am. */
  hasLateNightGame: boolean;
  /** Longest same-winner run, and whether anyone broke a 3+ run. */
  longestRun: number;
  hasComeback: boolean;
}

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
  /** Progress toward earning, for count-based badges. */
  progress?: { current: number; target: number };
}

export function computeCoupleStats(sessions: GameSession[]): CoupleStats {
  const finished = sessions.filter((s) => s.ended_at !== null);

  const nightCounts = new Map<string, number>();
  const slugs = new Set<string>();
  let hasLateNightGame = false;

  for (const session of finished) {
    const ended = new Date(session.ended_at as string);
    const night = ended.toDateString();
    nightCounts.set(night, (nightCounts.get(night) ?? 0) + 1);
    slugs.add(session.game_slug);
    const hour = ended.getHours();
    if (hour >= 0 && hour < 5) hasLateNightGame = true;
  }

  // Winner runs, oldest → newest. Ties don't break a run.
  const decided = [...finished]
    .filter((s) => s.winner === "player1" || s.winner === "player2")
    .sort(
      (a, b) =>
        new Date(a.ended_at as string).getTime() -
        new Date(b.ended_at as string).getTime(),
    );
  let longestRun = 0;
  let hasComeback = false;
  let runWinner: string | null = null;
  let runLength = 0;
  for (const session of decided) {
    // Identify the winning *person* independent of seat: the creator id
    // for player1 wins, otherwise "other:<creator>".
    const key =
      session.winner === "player1"
        ? `creator:${session.created_by}`
        : `other:${session.created_by}`;
    if (key === runWinner) {
      runLength += 1;
    } else {
      if (runLength >= 3 && runWinner !== null) hasComeback = true;
      runWinner = key;
      runLength = 1;
    }
    longestRun = Math.max(longestRun, runLength);
  }

  return {
    totalGames: finished.length,
    nights: nightCounts.size,
    distinctGames: slugs.size,
    maxGamesInOneNight: Math.max(0, ...nightCounts.values()),
    hasLateNightGame,
    longestRun,
    hasComeback,
  };
}

interface CountBadgeDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  stat: "totalGames" | "nights" | "distinctGames";
  target: number;
}

const COUNT_BADGES: CountBadgeDef[] = [
  {
    id: "first-deal",
    name: "First Deal",
    emoji: "🂡",
    description: "Finish your first game together.",
    stat: "totalGames",
    target: 1,
  },
  {
    id: "ten-together",
    name: "Ten Together",
    emoji: "🃏",
    description: "Finish 10 games together.",
    stat: "totalGames",
    target: 10,
  },
  {
    id: "half-century",
    name: "Half-Century",
    emoji: "🏅",
    description: "Finish 50 games together.",
    stat: "totalGames",
    target: 50,
  },
  {
    id: "century-club",
    name: "The Century Club",
    emoji: "💯",
    description: "Finish 100 games together.",
    stat: "totalGames",
    target: 100,
  },
  {
    id: "regulars",
    name: "Regulars",
    emoji: "🕯️",
    description: "Five separate game nights.",
    stat: "nights",
    target: 5,
  },
  {
    id: "ritual",
    name: "It's a Ritual",
    emoji: "♥",
    description: "Twenty game nights — this is officially your thing.",
    stat: "nights",
    target: 20,
  },
  {
    id: "explorers",
    name: "Explorers",
    emoji: "🧭",
    description: "Play 5 different games.",
    stat: "distinctGames",
    target: 5,
  },
  {
    id: "whole-library",
    name: "The Whole Library",
    emoji: "📚",
    description: "Play 15 different games.",
    stat: "distinctGames",
    target: 15,
  },
];

export function computeBadges(stats: CoupleStats): Badge[] {
  const badges: Badge[] = COUNT_BADGES.map((def) => ({
    id: def.id,
    name: def.name,
    emoji: def.emoji,
    description: def.description,
    earned: stats[def.stat] >= def.target,
    progress: { current: Math.min(stats[def.stat], def.target), target: def.target },
  }));

  badges.push(
    {
      id: "full-house",
      name: "Full House",
      emoji: "🏠",
      description: "Three or more games in a single night.",
      earned: stats.maxGamesInOneNight >= 3,
      progress: {
        current: Math.min(stats.maxGamesInOneNight, 3),
        target: 3,
      },
    },
    {
      id: "night-owls",
      name: "Night Owls",
      emoji: "🦉",
      description: "Finish a game after midnight.",
      earned: stats.hasLateNightGame,
    },
    {
      id: "heater",
      name: "On a Heater",
      emoji: "🔥",
      description: "Someone wins 5 in a row.",
      earned: stats.longestRun >= 5,
      progress: { current: Math.min(stats.longestRun, 5), target: 5 },
    },
    {
      id: "comeback",
      name: "The Comeback",
      emoji: "🌅",
      description: "Break your partner's 3-game run.",
      earned: stats.hasComeback,
    },
  );

  return badges;
}

/** Earned first (most recent targets last), then nearest-to-earned. */
export function sortBadgesForDisplay(badges: Badge[]): Badge[] {
  return [...badges].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    const aPct = a.progress ? a.progress.current / a.progress.target : 0;
    const bPct = b.progress ? b.progress.current / b.progress.target : 0;
    return bPct - aPct;
  });
}
