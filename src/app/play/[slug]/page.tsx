import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Scorekeeper } from "@/components/scorekeeper/Scorekeeper";
import { getAllGames, getGame } from "@/lib/content/games";

export function generateStaticParams() {
  return getAllGames().map((game) => ({ slug: game.id }));
}

export async function generateMetadata(
  props: PageProps<"/play/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const game = getGame(slug);
  if (!game) return {};
  return {
    title: `${game.name} scorekeeper`,
    description: `Keep score for ${game.name} — free, no signup needed.`,
    robots: { index: false },
  };
}

export default async function PlayPage(props: PageProps<"/play/[slug]">) {
  const { slug } = await props.params;
  const game = getGame(slug);
  if (!game) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{game.name}</h1>
        <Link
          href={`/games/${game.id}`}
          className="shrink-0 rounded-lg bg-card px-3 py-2 text-sm font-medium text-ink-soft ring-1 ring-line hover:text-ink"
        >
          📖 Rules
        </Link>
      </div>

      <Scorekeeper slug={game.id} scoring={game.scoring} />

      <p className="mt-6 text-center text-xs text-ink-soft">
        Scores are saved on this device, so a refresh won&apos;t lose your
        game.
      </p>
    </div>
  );
}
