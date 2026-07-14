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

/** Oversized suits drifting slowly behind the hero, like a loose deck. */
const DRIFTERS = [
  { glyph: "♥", top: "6%", left: "4%", size: "5.5rem", delay: "0s", rot: "-14deg" },
  { glyph: "♠", top: "14%", left: "84%", size: "4rem", delay: "-5s", rot: "10deg" },
  { glyph: "♦", top: "66%", left: "8%", size: "3.5rem", delay: "-9s", rot: "8deg" },
  { glyph: "♣", top: "70%", left: "87%", size: "4.5rem", delay: "-12s", rot: "-9deg" },
] as const;

export default function HomePage() {
  const featured = getFeaturedGames();

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="relative flex flex-col items-center gap-6 py-16 text-center sm:py-24">
        <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
          {DRIFTERS.map((d) => (
            <span
              key={d.glyph}
              className="absolute animate-drift text-primary/10"
              style={
                {
                  top: d.top,
                  left: d.left,
                  fontSize: d.size,
                  animationDelay: d.delay,
                  "--drift-rot": d.rot,
                } as React.CSSProperties
              }
            >
              {d.glyph}
            </span>
          ))}
        </div>

        <p className="animate-fade-up rounded-full bg-accent-soft px-4 py-1.5 text-sm font-medium text-accent-strong">
          Free · First two games, no signup needed
        </p>
        <h1
          className="animate-fade-up max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ animationDelay: "0.1s" }}
        >
          Put the phones down. Deal the cards.
        </h1>
        <p
          className="animate-fade-up max-w-xl text-lg text-ink-soft"
          style={{ animationDelay: "0.2s" }}
        >
          Learn a game together, keep score on one phone, and turn any night
          into a date. Twenty two-player games, made for two.
        </p>
        <div
          className="animate-fade-up flex flex-col gap-3 sm:flex-row"
          style={{ animationDelay: "0.3s" }}
        >
          <Link
            href="/games"
            className="rounded-xl border border-line bg-card px-6 py-3.5 text-base font-semibold transition hover:-translate-y-0.5 hover:border-ink-soft hover:shadow-md"
          >
            Browse the games
          </Link>
          <Link
            href="/games"
            className="group rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-accent-strong hover:shadow-md"
          >
            Start date night{" "}
            <span aria-hidden className="inline-block group-hover:animate-heartbeat">
              ♥
            </span>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-it-works" className="py-10">
        <h2 id="how-it-works" className="sr-only">
          How it works
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group animate-fade-up rounded-2xl border border-line bg-card p-6 transition hover:-translate-y-1 hover:shadow-md"
              style={{ animationDelay: `${0.15 + i * 0.1}s` }}
            >
              <span
                aria-hidden
                className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-xl text-primary transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
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
            {featured.map((game, i) => (
              <div
                key={game.id}
                className="animate-deal-in"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <GameCard game={game} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <section className="relative my-16 overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-white">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-4 top-6 animate-drift select-none text-7xl text-white/10"
          style={{ "--drift-rot": "-12deg" } as React.CSSProperties}
        >
          ♥
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute -right-2 bottom-4 animate-drift select-none text-6xl text-white/10"
          style={
            { "--drift-rot": "10deg", animationDelay: "-7s" } as React.CSSProperties
          }
        >
          ♦
        </span>
        <h2 className="text-2xl font-bold">Deck&apos;s already on the table?</h2>
        <p className="mx-auto mt-2 max-w-md text-white/80">
          Jump straight into a scoreboard — save the result to your streak and
          keep your story going.
        </p>
        <Link
          href="/games"
          className="mt-6 inline-block rounded-xl bg-white px-6 py-3.5 font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-lg"
        >
          Start playing now
        </Link>
      </section>
    </div>
  );
}
