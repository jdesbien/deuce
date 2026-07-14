"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CountdownBoard } from "@/components/scorekeeper/CountdownBoard";
import { PartieBoard } from "@/components/scorekeeper/PartieBoard";
import { PointsBoard } from "@/components/scorekeeper/PointsBoard";
import { TallyBoard } from "@/components/scorekeeper/TallyBoard";
import {
  BoardActions,
  HistoryList,
  WinnerBanner,
  type BoardProps,
} from "@/components/scorekeeper/parts";
import type { GameScoring } from "@/lib/content/types";
import { getScorekeeperConfig, type BoardKind } from "@/lib/scoring/engine";
import { useSyncedScoreSession } from "@/lib/scoring/useSyncedScoreSession";

const BOARDS: Record<BoardKind, (props: BoardProps) => React.ReactNode> = {
  points: PointsBoard,
  tally: TallyBoard,
  countdown: CountdownBoard,
  partie: PartieBoard,
};

/** Guests can finish this many games before signup is required. */
const GUEST_GAME_LIMIT = 2;
const GUEST_COUNT_KEY = "c4c:guest-finished-count";

function readGuestCount(): number {
  try {
    const raw = window.localStorage.getItem(GUEST_COUNT_KEY);
    const value = raw === null ? 0 : Number(raw);
    return Number.isFinite(value) && value >= 0 ? Math.trunc(value) : 0;
  } catch {
    return 0;
  }
}

function writeGuestCount(count: number): void {
  try {
    window.localStorage.setItem(GUEST_COUNT_KEY, String(count));
  } catch {
    // Storage blocked — the gate simply won't persist.
  }
}

export function Scorekeeper({
  slug,
  scoring,
}: {
  slug: string;
  scoring: GameScoring;
}) {
  const config = useMemo(
    () => getScorekeeperConfig(slug, scoring),
    [slug, scoring],
  );
  const {
    ready,
    names,
    entries,
    outcome,
    sync,
    authResolved,
    addEntry,
    undo,
    reset,
    setName,
  } = useSyncedScoreSession(slug, config);

  // SSR renders 0; safe because the gate is also hidden until
  // authResolved, so server and first client render match.
  const [guestFinished, setGuestFinished] = useState(() =>
    typeof window === "undefined" ? 0 : readGuestCount(),
  );
  const countedRef = useRef(false);

  useEffect(() => {
    if (
      outcome.finished &&
      authResolved &&
      sync.mode === "guest" &&
      !countedRef.current
    ) {
      countedRef.current = true;
      const next = readGuestCount() + 1;
      writeGuestCount(next);
      setGuestFinished(next);
    }
  }, [outcome.finished, authResolved, sync.mode]);

  if (!ready) {
    return (
      <div
        aria-busy
        className="h-72 animate-pulse rounded-2xl border border-line bg-card"
      />
    );
  }

  // Guests get two full games; a fresh board after that asks for signup.
  const gated =
    authResolved &&
    sync.mode === "guest" &&
    guestFinished >= GUEST_GAME_LIMIT &&
    entries.length === 0 &&
    !outcome.finished;

  if (gated) {
    return (
      <div className="rounded-2xl border border-line bg-card p-8 text-center">
        <p aria-hidden className="mb-2 text-4xl">
          ♥
        </p>
        <h2 className="text-xl font-bold">
          Two games on the house — you two are clearly into this
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">
          Create a free account to keep playing: your history gets saved,
          scores sync to both phones, and you start earning badges together.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <Link
            href={`/signup?next=/play/${slug}`}
            className="rounded-xl bg-accent px-6 py-3.5 font-semibold text-white hover:bg-accent-strong"
          >
            Sign up free — takes a minute
          </Link>
          <Link
            href={`/login?next=/play/${slug}`}
            className="rounded-xl border border-line px-6 py-3.5 font-semibold hover:border-ink-soft"
          >
            I already have an account
          </Link>
        </div>
      </div>
    );
  }

  const Board = BOARDS[config.kind];

  function handleReset() {
    countedRef.current = false;
    reset();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-xl bg-gold-soft px-4 py-2.5 text-center text-sm font-medium">
        {config.hint}
      </p>

      {sync.mode !== "guest" && (
        <p
          role="status"
          className="rounded-xl bg-accent-soft px-4 py-2 text-center text-xs font-semibold text-accent-strong"
        >
          {sync.mode === "shared"
            ? `♥ Live with ${sync.partnerName} — scores sync to both phones`
            : "Saving to your history"}
        </p>
      )}

      <WinnerBanner outcome={outcome} names={names} onRematch={handleReset} />

      <Board
        config={config}
        names={names}
        entries={entries}
        outcome={outcome}
        addEntry={addEntry}
        setName={setName}
      />

      <BoardActions
        onUndo={undo}
        onReset={handleReset}
        canUndo={entries.length > 0}
      />

      <HistoryList entries={entries} names={names} />
    </div>
  );
}
