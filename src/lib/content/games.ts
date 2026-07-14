import rawGames from "@/data/games.json";

import type { ContentGame, GamesFile } from "@/lib/content/types";

const gamesFile = rawGames as unknown as GamesFile;

/** Slugs highlighted on the landing page. */
const FEATURED_SLUGS = [
  "gin-rummy",
  "cribbage-six-card",
  "yaniv",
  "james-bond",
] as const;

export function getAllGames(): ContentGame[] {
  return [...gamesFile.games].sort(
    (a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name),
  );
}

export function getGame(slug: string): ContentGame | undefined {
  return gamesFile.games.find((game) => game.id === slug);
}

export function getFeaturedGames(): ContentGame[] {
  return FEATURED_SLUGS.map((slug) => getGame(slug)).filter(
    (game): game is ContentGame => game !== undefined,
  );
}

export function getSourceCredit(): string {
  return gamesFile.meta.sourceCredit;
}

export type DifficultyLabel = "Easy" | "Medium" | "Hard";

export function difficultyLabel(difficulty: number): DifficultyLabel {
  if (difficulty <= 2) return "Easy";
  if (difficulty === 3) return "Medium";
  return "Hard";
}
