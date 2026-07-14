import Link from "next/link";
import { redirect } from "next/navigation";

import { getGame } from "@/lib/content/games";
import {
  computeBadges,
  computeCoupleStats,
  sortBadgesForDisplay,
} from "@/lib/engagement/badges";
import { getPartnerProfile } from "@/lib/queries/couples";
import { getCoupleSessions } from "@/lib/queries/sessions";
import { getCurrentUser } from "@/lib/queries/profiles";
import type { GameSession } from "@/lib/types/database";

export const metadata = { title: "Your streak" };

interface PersonStats {
  name: string;
  emoji: string;
  wins: number;
}

/** Which side (0 = me, 1 = partner) won a session, or null for ties. */
function winnerSide(session: GameSession, myId: string): 0 | 1 | null {
  if (session.winner !== "player1" && session.winner !== "player2") {
    return null;
  }
  // Convention: player1 is always the session's creator.
  const creatorWon = session.winner === "player1";
  const iAmCreator = session.created_by === myId;
  return creatorWon === iAmCreator ? 0 : 1;
}

export default async function StreakPage() {
  const current = await getCurrentUser();
  if (!current?.profile) redirect("/login?next=/streak");

  const { profile } = current;

  if (!profile.couple_id) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p aria-hidden className="mb-2 text-4xl">
          ♥
        </p>
        <h1 className="mb-2 text-2xl font-bold">Your streak starts here</h1>
        <p className="mb-6 text-ink-soft">
          Link up with your partner and every game you finish together builds
          your shared story — records, runs, and your most-played games.
        </p>
        <Link
          href="/settings"
          className="inline-block rounded-xl bg-accent px-6 py-3.5 font-semibold text-white hover:bg-accent-strong"
        >
          Link your partner
        </Link>
      </div>
    );
  }

  const partner = await getPartnerProfile(profile.couple_id, profile.id);
  const sessions = await getCoupleSessions(profile.couple_id);
  const decided = sessions.filter((s) => winnerSide(s, profile.id) !== null);

  const me: PersonStats = {
    name: profile.display_name,
    emoji: profile.avatar_emoji,
    wins: decided.filter((s) => winnerSide(s, profile.id) === 0).length,
  };
  const them: PersonStats = {
    name: partner?.display_name ?? "Your partner",
    emoji: partner?.avatar_emoji ?? "♥",
    wins: decided.filter((s) => winnerSide(s, profile.id) === 1).length,
  };
  const ties = sessions.length - decided.length;

  // Current run: consecutive wins by the same person, newest first.
  let runHolder: PersonStats | null = null;
  let runLength = 0;
  for (const session of decided) {
    const side = winnerSide(session, profile.id);
    const person = side === 0 ? me : them;
    if (runHolder === null) {
      runHolder = person;
      runLength = 1;
    } else if (runHolder === person) {
      runLength += 1;
    } else {
      break;
    }
  }

  // Distinct days with at least one finished game.
  const nights = new Set(
    sessions
      .filter((s) => s.ended_at !== null)
      .map((s) => new Date(s.ended_at as string).toDateString()),
  ).size;

  // Per-game records.
  const perGame = new Map<string, { mine: number; theirs: number; total: number }>();
  for (const session of sessions) {
    const entry = perGame.get(session.game_slug) ?? {
      mine: 0,
      theirs: 0,
      total: 0,
    };
    entry.total += 1;
    const side = winnerSide(session, profile.id);
    if (side === 0) entry.mine += 1;
    if (side === 1) entry.theirs += 1;
    perGame.set(session.game_slug, entry);
  }
  const gameRows = [...perGame.entries()].sort(
    (a, b) => b[1].total - a[1].total,
  );

  const badges = sortBadgesForDisplay(
    computeBadges(computeCoupleStats(sessions)),
  );
  const earnedBadges = badges.filter((b) => b.earned);
  const upcomingBadges = badges.filter((b) => !b.earned && b.progress);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">
        {me.name} &amp; {them.name}
      </h1>
      <p className="mb-8 text-ink-soft">Your story so far, in cards.</p>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-ink-soft">
          <p className="mb-1 text-3xl" aria-hidden>
            ♥
          </p>
          <p className="font-medium text-ink">You&apos;re linked!</p>
          <p className="text-sm">
            Finish your first game together and this page comes alive.
          </p>
          <Link
            href="/games"
            className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-strong"
          >
            Start tonight&apos;s game
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Head-to-head record */}
          <section className="rounded-2xl border border-line bg-card p-5">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <p aria-hidden className="text-3xl">
                  {me.emoji}
                </p>
                <p className="truncate font-semibold">{me.name}</p>
                <p className="text-4xl font-bold text-primary-strong">
                  {me.wins}
                </p>
              </div>
              <div>
                <p aria-hidden className="text-3xl">
                  {them.emoji}
                </p>
                <p className="truncate font-semibold">{them.name}</p>
                <p className="text-4xl font-bold text-accent-strong">
                  {them.wins}
                </p>
              </div>
            </div>
            <p className="mt-3 text-center text-sm text-ink-soft">
              {sessions.length} game{sessions.length === 1 ? "" : "s"} together
              {ties > 0 && ` · ${ties} tie${ties === 1 ? "" : "s"}`}
              {` · ${nights} game night${nights === 1 ? "" : "s"}`}
            </p>
          </section>

          {/* Current run */}
          {runHolder && runLength >= 2 && (
            <section className="rounded-2xl bg-gold-soft p-5 text-center">
              <p className="font-semibold">
                🔥 {runHolder.name} is on a {runLength}-game run — someone&apos;s
                due a comeback.
              </p>
            </section>
          )}

          {/* Per-game records */}
          <section className="rounded-2xl border border-line bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">Game by game</h2>
            <ol className="flex flex-col gap-2">
              {gameRows.map(([slug, record]) => {
                const game = getGame(slug);
                return (
                  <li
                    key={slug}
                    className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-b-0 last:pb-0"
                  >
                    <Link
                      href={`/games/${slug}`}
                      className="min-w-0 truncate font-medium hover:underline"
                    >
                      {game?.name ?? slug}
                    </Link>
                    <span className="shrink-0 text-sm text-ink-soft">
                      <span className="font-semibold text-primary-strong">
                        {record.mine}
                      </span>
                      {" – "}
                      <span className="font-semibold text-accent-strong">
                        {record.theirs}
                      </span>
                      <span className="ml-2">({record.total} played)</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            {gameRows.length > 0 && (
              <p className="mt-3 text-center text-sm text-ink-soft">
                Most played: {getGame(gameRows[0][0])?.name ?? gameRows[0][0]} ♥
              </p>
            )}
          </section>

          {/* Badges */}
          <section className="rounded-2xl border border-line bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">
              Badges{" "}
              <span className="text-sm font-medium text-ink-soft">
                {earnedBadges.length} of {badges.length}
              </span>
            </h2>

            {earnedBadges.length > 0 && (
              <ul className="mb-4 flex flex-col gap-2">
                {earnedBadges.map((badge) => (
                  <li
                    key={badge.id}
                    className="flex items-center gap-3 rounded-xl bg-gold-soft px-4 py-3"
                  >
                    <span aria-hidden className="text-2xl">
                      {badge.emoji}
                    </span>
                    <div>
                      <p className="font-semibold">{badge.name}</p>
                      <p className="text-sm text-ink-soft">
                        {badge.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {upcomingBadges.length > 0 && (
              <div className="flex flex-col gap-3">
                {upcomingBadges.map((badge) => (
                  <div key={badge.id}>
                    <p className="flex justify-between text-sm">
                      <span className="font-medium">
                        {badge.emoji} {badge.name}
                        <span className="ml-2 text-ink-soft">
                          {badge.description}
                        </span>
                      </span>
                      <span className="shrink-0 text-ink-soft">
                        {badge.progress?.current}/{badge.progress?.target}
                      </span>
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${((badge.progress?.current ?? 0) / (badge.progress?.target ?? 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <Link
            href="/games"
            className="rounded-xl bg-accent px-6 py-3.5 text-center font-semibold text-white hover:bg-accent-strong"
          >
            Deal the next one
          </Link>
        </div>
      )}
    </div>
  );
}
