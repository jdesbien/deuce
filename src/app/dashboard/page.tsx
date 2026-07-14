import Link from "next/link";
import { redirect } from "next/navigation";

import { GameCard } from "@/components/games/GameCard";
import { getFeaturedGames, getGame } from "@/lib/content/games";
import {
  computeBadges,
  computeCoupleStats,
  sortBadgesForDisplay,
} from "@/lib/engagement/badges";
import { getPartnerProfile } from "@/lib/queries/couples";
import { getCurrentUser } from "@/lib/queries/profiles";
import {
  getActiveSessions,
  getCoupleSessions,
} from "@/lib/queries/sessions";

export const metadata = { title: "Your table" };

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Up late";
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

export default async function DashboardPage() {
  const current = await getCurrentUser();
  if (!current?.profile) redirect("/login?next=/dashboard");
  const { profile } = current;

  const partner = profile.couple_id
    ? await getPartnerProfile(profile.couple_id, profile.id)
    : null;
  const active = await getActiveSessions(3);
  const coupleSessions = profile.couple_id
    ? await getCoupleSessions(profile.couple_id)
    : [];

  const stats = computeCoupleStats(coupleSessions);
  const badges = sortBadgesForDisplay(computeBadges(stats));
  const earned = badges.filter((b) => b.earned);
  const nextUp = badges.filter((b) => !b.earned && b.progress).slice(0, 2);

  // Head-to-head for the snapshot card.
  const decided = coupleSessions.filter(
    (s) => s.winner === "player1" || s.winner === "player2",
  );
  const myWins = decided.filter((s) =>
    s.winner === "player1"
      ? s.created_by === profile.id
      : s.created_by !== profile.id,
  ).length;

  const activeWithGames = active
    .map((session) => ({ session, game: getGame(session.game_slug) }))
    .filter((item) => item.game !== undefined);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold">
        {greeting()}, {profile.display_name}{" "}
        <span aria-hidden>{profile.avatar_emoji}</span>
      </h1>
      <p className="mb-6 text-ink-soft">
        {partner
          ? `You and ${partner.display_name} — table's ready.`
          : "Your table's ready."}
      </p>

      <div className="flex flex-col gap-4">
        {/* Games in progress */}
        {activeWithGames.length > 0 && (
          <section className="rounded-2xl border border-line bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">Pick up where you left off</h2>
            <div className="flex flex-col gap-2">
              {activeWithGames.map(({ session, game }) => (
                <Link
                  key={session.id}
                  href={`/play/${session.game_slug}`}
                  className="flex items-center justify-between rounded-xl bg-surface px-4 py-3 font-semibold hover:bg-primary-soft"
                >
                  <span>{game?.name}</span>
                  <span aria-hidden>→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Couple snapshot or link nudge */}
        {partner ? (
          <section className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">You two</h2>
              <Link
                href="/streak"
                className="text-sm font-medium text-accent-strong hover:text-primary"
              >
                Full streak →
              </Link>
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              <span className="text-primary-strong">{myWins}</span>
              <span className="mx-2 text-lg text-ink-soft">–</span>
              <span className="text-accent-strong">
                {decided.length - myWins}
              </span>
            </p>
            <p className="text-sm text-ink-soft">
              {stats.totalGames} game{stats.totalGames === 1 ? "" : "s"} across{" "}
              {stats.nights} night{stats.nights === 1 ? "" : "s"}
            </p>
          </section>
        ) : (
          <section className="rounded-2xl bg-primary p-5 text-white">
            <h2 className="text-lg font-bold">Bring your partner in ♥</h2>
            <p className="mt-1 text-sm text-white/80">
              Link up to share live scoreboards, one history, and badges you
              earn together.
            </p>
            <Link
              href="/settings"
              className="mt-3 inline-block rounded-xl bg-white px-5 py-2.5 font-semibold text-primary hover:bg-white/90"
            >
              Get your invite code
            </Link>
          </section>
        )}

        {/* Badges */}
        {partner && (
          <section className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold">
                Badges{" "}
                <span className="text-sm font-medium text-ink-soft">
                  {earned.length} of {badges.length}
                </span>
              </h2>
              <Link
                href="/streak"
                className="text-sm font-medium text-accent-strong hover:text-primary"
              >
                See all →
              </Link>
            </div>

            {earned.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {earned.slice(0, 6).map((badge) => (
                  <span
                    key={badge.id}
                    title={badge.description}
                    className="rounded-full bg-gold-soft px-3 py-1.5 text-sm font-semibold"
                  >
                    {badge.emoji} {badge.name}
                  </span>
                ))}
              </div>
            )}

            {nextUp.length > 0 && (
              <div className="mt-4 flex flex-col gap-3">
                {nextUp.map((badge) => (
                  <div key={badge.id}>
                    <p className="flex justify-between text-sm">
                      <span className="font-medium">
                        {badge.emoji} {badge.name}
                      </span>
                      <span className="text-ink-soft">
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
        )}

        {/* Start something */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Start tonight&apos;s game</h2>
            <Link
              href="/games"
              className="text-sm font-medium text-accent-strong hover:text-primary"
            >
              All 20 →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {getFeaturedGames().map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
