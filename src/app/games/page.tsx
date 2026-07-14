import { GameCard } from "@/components/games/GameCard";
import { getAllGames, getSourceCredit } from "@/lib/content/games";

export const metadata = {
  title: "Game library",
  description:
    "20 two-player card and domino games with clear rules and shared scoreboards — a date night you can start tonight.",
};

export default function GamesPage() {
  const games = getAllGames();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Game library</h1>
      <p className="mb-8 text-ink-soft">
        {games.length} two-player games, easiest first. Every one works
        without an account — pick a game and start scoring.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      <p className="mt-10 text-xs text-ink-soft">{getSourceCredit()}</p>
    </div>
  );
}
