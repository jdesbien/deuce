import Link from "next/link";
import { redirect } from "next/navigation";

import { getGame } from "@/lib/content/games";
import { getFinishedSessions } from "@/lib/queries/sessions";
import { getCurrentUser } from "@/lib/queries/profiles";
import type { GameSession, Json } from "@/lib/types/database";

export const metadata = { title: "Game history" };

function finalScoreText(session: GameSession): string {
  const scores = session.final_scores;
  if (
    typeof scores === "object" &&
    scores !== null &&
    !Array.isArray(scores)
  ) {
    const record = scores as Record<string, Json>;
    const p1 = record.player1;
    const p2 = record.player2;
    if (typeof p1 === "number" && typeof p2 === "number") {
      return `${p1} – ${p2}`;
    }
  }
  return "";
}

function winnerText(session: GameSession): string {
  switch (session.winner) {
    case "player1":
      return `${session.player1_name} won`;
    case "player2":
      return `${session.player2_name} won`;
    case "tie":
      return "A tie";
    case "abandoned":
      return "Unfinished";
    default:
      return "";
  }
}

export default async function HistoryPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login?next=/history");

  const sessions = await getFinishedSessions();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-bold">Game history</h1>
      <p className="mb-8 text-ink-soft">
        Every game you&apos;ve saved, newest first.
      </p>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-ink-soft">
          <p className="mb-1 text-3xl" aria-hidden>
            🂡
          </p>
          <p className="font-medium text-ink">No games saved yet</p>
          <p className="text-sm">
            Finish a game while signed in and it lands here.
          </p>
          <Link
            href="/games"
            className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-strong"
          >
            Pick a game
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {sessions.map((session) => {
            const game = getGame(session.game_slug);
            const score = finalScoreText(session);
            const date = session.ended_at
              ? new Date(session.ended_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "";
            return (
              <li
                key={session.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4"
              >
                <div className="min-w-0">
                  <Link
                    href={`/games/${session.game_slug}`}
                    className="font-semibold hover:underline"
                  >
                    {game?.name ?? session.game_slug}
                  </Link>
                  <p className="truncate text-sm text-ink-soft">
                    {winnerText(session)}
                    {score && ` · ${score}`}
                    {` · ${session.player1_name} & ${session.player2_name}`}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ink-soft">{date}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
