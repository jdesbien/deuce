import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GameCard } from "@/components/games/GameCard";
import {
  difficultyLabel,
  getAllGames,
  getGame,
} from "@/lib/content/games";
import type { ContentGame, SectionValue } from "@/lib/content/types";

export function generateStaticParams() {
  return getAllGames().map((game) => ({ slug: game.id }));
}

export async function generateMetadata(
  props: PageProps<"/games/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const game = getGame(slug);
  if (!game) return {};
  return {
    title: `How to play ${game.name}`,
    description: game.summary,
  };
}

// ------------------------------------------------------------------
// Generic section rendering for the free-form content fields
// ------------------------------------------------------------------

const LABELS: Record<string, string> = {
  cardRanking: "Card ranking",
  cardRankingForSequences: "Card ranking for sequences",
  cardValues: "Card values",
  countValues: "Count values",
  melds: "Melds",
  combinations: "Combinations",
  roles: "Roles",
  specialRules: "Special rules",
  specialActions: "Special actions",
  declarations: "Declarations",
  transferRule: "The transfer rule",
  scoringDuringPlay: "Scoring during the play",
  theShow: "The show",
  cardEffects: "Card effects",
  endgame: "The endgame",
  ending: "Ending the round",
  comparingHands: "Comparing hands",
  bonuses: "Bonuses",
  oneOff: "One-off effects (resolved, then scrapped)",
  permanent: "Permanent effects (stay in play)",
  trump: "Trump suit",
  nonTrump: "Plain suits",
  perHand: "Each hand",
  perRound: "Each round",
  perDeal: "Each deal",
  pointsPerDeal: "Points each deal",
  gamePointsPerDeal: "Game points each deal",
  duringPlay: "During play",
  endOfHand: "End of the hand",
  scoringEvents: "Scoring events",
  endGameBonuses: "End-of-game bonuses",
  commonVariants: "Common variants",
  optionalPointScoring: "Optional point scoring",
  matchScoring: "Match scoring",
  stopOrGo: "Stop or Go",
  multipliers: "Multipliers",
  notes: "Good to know",
};

function labelFor(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const spaced = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isSectionValue(value: unknown): value is SectionValue {
  if (typeof value === "string" || isStringArray(value)) return true;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every(
    (v) => typeof v === "string" || isStringArray(v),
  );
}

function StepList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span
            aria-hidden
            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/60"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionBody({ value }: { value: SectionValue }) {
  if (typeof value === "string") return <p>{value}</p>;
  if (isStringArray(value)) return <StepList items={value} />;
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(value).map(([key, sub]) => (
        <div key={key}>
          <h4 className="mb-1.5 text-sm font-semibold text-ink-soft">
            {labelFor(key)}
          </h4>
          {typeof sub === "string" ? <p>{sub}</p> : <StepList items={sub} />}
        </div>
      ))}
    </div>
  );
}

function SubSections({ game, keys }: { game: ContentGame; keys: string[] }) {
  return (
    <>
      {keys.map((key) => {
        const value = game[key];
        if (value === undefined || !isSectionValue(value)) return null;
        return (
          <div key={key} className="mt-5">
            <h3 className="mb-2 font-semibold">{labelFor(key)}</h3>
            <SectionBody value={value} />
          </div>
        );
      })}
    </>
  );
}

// Extra fields folded into the five core sections.
const CARD_KEYS = [
  "cardRanking",
  "cardRankingForSequences",
  "cardValues",
  "countValues",
  "melds",
  "combinations",
  "roles",
];
const PLAY_KEYS = [
  "specialRules",
  "specialActions",
  "declarations",
  "transferRule",
  "scoringDuringPlay",
  "theShow",
  "cardEffects",
  "comparingHands",
  "bonuses",
  "endgame",
  "ending",
];
// Scoring object keys that are meta, not renderable lists.
const SCORING_META_KEYS = new Set(["type", "target", "unit", "startValue"]);

const NAV = [
  { id: "objective", label: "Objective" },
  { id: "setup", label: "Setup" },
  { id: "play", label: "How to play" },
  { id: "scoring", label: "Scoring" },
  { id: "winning", label: "Winning" },
] as const;

const difficultyChip: Record<string, string> = {
  Easy: "bg-gold-soft text-gold",
  Medium: "bg-accent-soft text-accent-strong",
  Hard: "bg-primary-soft text-primary-strong",
};

function relatedGames(game: ContentGame): ContentGame[] {
  const others = getAllGames().filter((g) => g.id !== game.id);
  const sameFamily = others.filter((g) => g.family === game.family);
  const byDifficulty = others
    .filter((g) => !sameFamily.includes(g))
    .sort(
      (a, b) =>
        Math.abs(a.difficulty - game.difficulty) -
        Math.abs(b.difficulty - game.difficulty),
    );
  return [...sameFamily, ...byDifficulty].slice(0, 3);
}

export default async function GamePage(props: PageProps<"/games/[slug]">) {
  const { slug } = await props.params;
  const game = getGame(slug);
  if (!game) notFound();

  const difficulty = difficultyLabel(game.difficulty);
  const related = relatedGames(game);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28">
      {/* Hero */}
      <header className="py-8">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className={`rounded-full px-2.5 py-1 ${difficultyChip[difficulty]}`}>
            {difficulty} · {game.difficulty}/5
          </span>
          {game.family && (
            <span className="rounded-full bg-card px-2.5 py-1 text-ink-soft ring-1 ring-line">
              {game.family}
            </span>
          )}
          {game.origin && (
            <span className="rounded-full bg-card px-2.5 py-1 text-ink-soft ring-1 ring-line">
              {game.origin}
            </span>
          )}
          {game.isDominoes && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-white">
              🁡 Dominoes
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {game.name}
        </h1>
        {game.aka && game.aka.length > 0 && (
          <p className="mt-1 text-sm text-ink-soft">
            Also known as {game.aka.join(", ")}
          </p>
        )}
        <p className="mt-3 text-lg text-ink-soft">{game.summary}</p>
        <p className="mt-3 rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-line">
          <span className="font-semibold">You&apos;ll need: </span>
          {game.equipment}
        </p>

        <Link
          href={`/play/${game.id}`}
          className="mt-5 inline-flex h-13 w-full items-center justify-center rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-sm hover:bg-primary-strong sm:w-auto"
        >
          Start the scorekeeper →
        </Link>
      </header>

      {/* Anchor nav */}
      <nav
        aria-label="Sections"
        className="sticky top-14 z-30 -mx-4 mb-6 overflow-x-auto border-y border-line bg-surface/95 px-4 py-2 backdrop-blur"
      >
        <div className="flex gap-2">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded-full bg-card px-3.5 py-1.5 text-sm font-medium text-ink-soft ring-1 ring-line hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <article className="flex flex-col gap-10">
        {/* Objective */}
        <section id="objective" className="scroll-mt-28">
          <h2 className="mb-3 text-xl font-bold">
            <span aria-hidden className="mr-2 text-primary">♠</span>Objective
          </h2>
          <p className="text-lg">{game.objective}</p>
          <SubSections game={game} keys={CARD_KEYS} />
        </section>

        {/* Setup */}
        <section id="setup" className="scroll-mt-28">
          <h2 className="mb-3 text-xl font-bold">
            <span aria-hidden className="mr-2 text-primary">♥</span>Setup
          </h2>
          <ol className="flex flex-col gap-2.5">
            {game.setup.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary-strong">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* How to play */}
        <section id="play" className="scroll-mt-28">
          <h2 className="mb-3 text-xl font-bold">
            <span aria-hidden className="mr-2 text-primary">♣</span>How to play
          </h2>
          <StepList items={game.play} />
          <SubSections game={game} keys={PLAY_KEYS} />
        </section>

        {/* Scoring */}
        <section id="scoring" className="scroll-mt-28">
          <h2 className="mb-3 text-xl font-bold">
            <span aria-hidden className="mr-2 text-primary">♦</span>Scoring
          </h2>
          <p className="mb-4 rounded-xl bg-accent-soft px-4 py-3 text-sm font-medium text-accent-strong">
            Scored in {game.scoring.unit}
            {game.scoring.target !== null &&
              ` · ${game.scoring.startValue !== undefined ? `count down from ${game.scoring.startValue} to ${game.scoring.target}` : `play to ${game.scoring.target}`}`}
          </p>
          {Object.entries(game.scoring).map(([key, value]) => {
            if (SCORING_META_KEYS.has(key) || !isSectionValue(value)) {
              return null;
            }
            return (
              <div key={key} className="mt-4">
                <h3 className="mb-2 font-semibold">{labelFor(key)}</h3>
                <SectionBody value={value} />
              </div>
            );
          })}
        </section>

        {/* Winning */}
        <section id="winning" className="scroll-mt-28">
          <h2 className="mb-3 text-xl font-bold">
            <span aria-hidden className="mr-2 text-primary">♛</span>Winning
          </h2>
          <p className="text-lg">{game.winning}</p>
        </section>
      </article>

      {/* Related games */}
      {related.length > 0 && (
        <aside className="mt-14">
          <h2 className="mb-4 text-lg font-bold">If you like {game.name}…</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </div>
        </aside>
      )}

      {game.sourceUrl && (
        <p className="mt-10 text-xs text-ink-soft">
          Game mechanics referenced from{" "}
          <a
            href={game.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink"
          >
            pagat.com
          </a>{" "}
          (John McLeod); rules text is our own wording.
        </p>
      )}

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 p-3 backdrop-blur sm:hidden">
        <Link
          href={`/play/${game.id}`}
          className="flex h-13 items-center justify-center rounded-xl bg-primary py-3.5 font-bold text-white"
        >
          Start the scorekeeper →
        </Link>
      </div>
    </div>
  );
}
