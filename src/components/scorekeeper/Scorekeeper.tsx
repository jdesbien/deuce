"use client";

import { useMemo } from "react";

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
    addEntry,
    undo,
    reset,
    setName,
  } = useSyncedScoreSession(slug, config);

  if (!ready) {
    return (
      <div
        aria-busy
        className="h-72 animate-pulse rounded-2xl border border-line bg-card"
      />
    );
  }

  const Board = BOARDS[config.kind];

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

      <WinnerBanner outcome={outcome} names={names} onRematch={reset} />

      <Board
        config={config}
        names={names}
        entries={entries}
        outcome={outcome}
        addEntry={addEntry}
        setName={setName}
      />

      <BoardActions onUndo={undo} onReset={reset} canUndo={entries.length > 0} />

      <HistoryList entries={entries} names={names} />
    </div>
  );
}
