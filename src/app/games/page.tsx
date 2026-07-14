import { GameCard } from "@/components/games/GameCard";
import { getPublishedGames } from "@/lib/queries/games";

export const metadata = {
  title: "Game library",
  description:
    "Rules and scoreboards for two-player card games — Gin Rummy, Cribbage, Speed, and more.",
};

// Milestone 2 replaces this with search, tag, and difficulty filters.
export default async function GamesPage() {
  const games = await getPublishedGames();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Game library</h1>
      <p className="mb-8 text-ink-soft">
        Every game works without an account — pick one and start scoring.
      </p>

      {games.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-ink-soft">
          <p className="mb-1 text-3xl" aria-hidden>
            🃏
          </p>
          <p className="font-medium text-ink">The library is being shuffled</p>
          <p className="text-sm">Game rules and scoreboards are coming soon.</p>
        </div>
      )}
    </div>
  );
}
