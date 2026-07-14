import Link from "next/link";

import { GameCard } from "@/components/games/GameCard";
import { brand } from "@/config/brand";
import { getFeaturedGames } from "@/lib/content/games";

const steps = [
  {
    title: "Pick a game",
    body: "Browse clear, skimmable rules for classic two-player card games. No account needed.",
    glyph: "♠",
  },
  {
    title: "Keep score together",
    body: "Open a scoreboard built for that game — big buttons made for passing one phone across the table.",
    glyph: "♥",
  },
  {
    title: "Build your rivalry",
    body: "Link up with your partner to sync scores live and track your all-time head-to-head record.",
    glyph: "♣",
  },
] as const;

export default async function HomePage() {
  const featured = await getFeaturedGames();

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <p className="rounded-full bg-felt-soft px-4 py-1.5 text-sm font-medium text-felt">
          Free · No signup needed to play
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          {brand.tagline}, scores settled forever.
        </h1>
        <p className="max-w-xl text-lg text-ink-soft">{brand.description}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/games"
            className="rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-primary-strong"
          >
            Browse the games
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-line bg-card px-6 py-3.5 text-base font-semibold hover:border-ink-soft"
          >
            Create a free account
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-it-works" className="py-10">
        <h2 id="how-it-works" className="sr-only">
          How it works
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-line bg-card p-6"
            >
              <span
                aria-hidden
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-xl text-primary"
              >
                {step.glyph}
              </span>
              <h3 className="mb-1 font-semibold">{step.title}</h3>
              <p className="text-sm text-ink-soft">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured games (empty until the library is seeded) */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-games" className="py-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="featured-games" className="text-xl font-bold">
              Featured games
            </h2>
            <Link
              href="/games"
              className="text-sm font-medium text-primary hover:text-primary-strong"
            >
              See all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="my-16 rounded-3xl bg-felt px-6 py-12 text-center text-white">
        <h2 className="text-2xl font-bold">Deck&apos;s already on the table?</h2>
        <p className="mx-auto mt-2 max-w-md text-white/80">
          Jump straight into a scoreboard — you can save the result later if
          you want bragging rights on record.
        </p>
        <Link
          href="/games"
          className="mt-6 inline-block rounded-xl bg-white px-6 py-3.5 font-semibold text-felt hover:bg-white/90"
        >
          Start playing now
        </Link>
      </section>
    </div>
  );
}
