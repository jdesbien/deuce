import Link from "next/link";

import { GameCard } from "@/components/games/GameCard";
import { getFeaturedGames } from "@/lib/content/games";

const steps = [
  {
    title: "Pick a game together",
    body: "Skimmable rules for 20 two-player games, easiest first. No account needed to start.",
    glyph: "♠",
  },
  {
    title: "Play across the table",
    body: "One phone, big buttons, made to pass back and forth. Phones-down mode keeps the feeds out of it.",
    glyph: "♥",
  },
  {
    title: "Grow the ritual",
    body: "Link up to keep a streak of game nights, earn badges together, and unlock connection prompts.",
    glyph: "♣",
  },
] as const;

export default function HomePage() {
  const featured = getFeaturedGames();

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <p className="rounded-full bg-accent-soft px-4 py-1.5 text-sm font-medium text-accent-strong">
          Free · First two games, no signup needed
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Put the phones down. Deal the cards.
        </h1>
        <p className="max-w-xl text-lg text-ink-soft">
          Learn a game together, keep score on one phone, and turn any night
          into a date. Twenty two-player games, made for two.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/games"
            className="rounded-xl border border-line bg-card px-6 py-3.5 text-base font-semibold hover:border-ink-soft"
          >
            Browse the games
          </Link>
          <Link
            href="/games"
            className="rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-accent-strong"
          >
            Start date night ♥
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

      {/* Featured games */}
      {featured.length > 0 && (
        <section aria-labelledby="featured-games" className="py-10">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 id="featured-games" className="text-xl font-bold">
                Featured games
              </h2>
              <p className="text-sm text-ink-soft">
                Easy ones to start your first night.
              </p>
            </div>
            <Link
              href="/games"
              className="text-sm font-medium text-accent-strong hover:text-primary"
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
      <section className="my-16 rounded-3xl bg-primary px-6 py-12 text-center text-white">
        <h2 className="text-2xl font-bold">Deck&apos;s already on the table?</h2>
        <p className="mx-auto mt-2 max-w-md text-white/80">
          Jump straight into a scoreboard — save the result to your streak and
          keep your story going.
        </p>
        <Link
          href="/games"
          className="mt-6 inline-block rounded-xl bg-white px-6 py-3.5 font-semibold text-primary hover:bg-white/90"
        >
          Start playing now
        </Link>
      </section>
    </div>
  );
}
