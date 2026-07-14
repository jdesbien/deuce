import Link from "next/link";

import { getAllGames } from "@/lib/content/games";
import { getAdminCounts } from "@/lib/queries/admin";

export const metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const counts = await getAdminCounts();
  const gamesPublished = getAllGames().length;

  const tiles = [
    { label: "Users", value: counts.users, href: "/admin/users" },
    { label: "Couples", value: counts.couples, href: "/admin/users" },
    {
      label: "Sessions this week",
      value: counts.sessionsThisWeek,
      href: "/admin",
    },
    {
      label: "New feedback",
      value: counts.newFeedback,
      href: "/admin/feedback",
    },
    { label: "Games in library", value: gamesPublished, href: "/games" },
  ] as const;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-2xl border border-line bg-card p-4 hover:border-ink-soft"
          >
            <p className="text-3xl font-bold tabular-nums">{tile.value}</p>
            <p className="text-sm text-ink-soft">{tile.label}</p>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        Game content ships with the app (src/data/games.json), so there&apos;s
        no games editor here — update the file and redeploy to change rules.
      </p>
    </div>
  );
}
