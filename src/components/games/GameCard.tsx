import Link from "next/link";

import { difficultyLabel } from "@/lib/content/games";
import type { ContentGame } from "@/lib/content/types";

const difficultyStyles = {
  Easy: "bg-felt-soft text-felt",
  Medium: "bg-gold-soft text-gold",
  Hard: "bg-primary-soft text-primary-strong",
} as const;

export function GameCard({ game }: { game: ContentGame }) {
  const difficulty = difficultyLabel(game.difficulty);

  return (
    <Link
      href={`/games/${game.id}`}
      className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold">{game.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyStyles[difficulty]}`}
        >
          {difficulty}
        </span>
      </div>
      <p className="line-clamp-2 text-sm text-ink-soft">{game.summary}</p>
      <p className="mt-auto text-xs text-ink-soft">
        {game.isDominoes ? "🁡 Dominoes" : "🂡 Cards"}
        {game.family ? ` · ${game.family}` : ""}
      </p>
    </Link>
  );
}
