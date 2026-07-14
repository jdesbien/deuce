import Link from "next/link";

import type { Game } from "@/lib/types/database";

const difficultyLabels = {
  easy: { label: "Easy", className: "bg-felt-soft text-felt" },
  medium: { label: "Medium", className: "bg-gold-soft text-gold" },
  hard: { label: "Hard", className: "bg-primary-soft text-primary-strong" },
} as const;

export function GameCard({ game }: { game: Game }) {
  const difficulty = difficultyLabels[game.difficulty];

  return (
    <Link
      href={`/games/${game.slug}`}
      className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold">{game.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficulty.className}`}
        >
          {difficulty.label}
        </span>
      </div>
      <p className="line-clamp-2 text-sm text-ink-soft">{game.summary}</p>
      <p className="mt-auto text-xs text-ink-soft">
        ~{game.avg_duration_minutes} min · {game.deck_requirements}
      </p>
    </Link>
  );
}
