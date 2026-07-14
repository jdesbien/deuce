"use client";

import { useState } from "react";

import { completedDeals, playerTotals } from "@/lib/scoring/engine";
import {
  PlayerCard,
  ScoreDisplay,
  useFloatingDeltas,
  type BoardProps,
} from "@/components/scorekeeper/parts";

/**
 * Partie-total (Piquet): six deals, both players score every deal, then
 * totals are compared and the rubicon settled.
 */
export function PartieBoard({
  config,
  names,
  entries,
  outcome,
  addEntry,
  setName,
}: BoardProps) {
  const totals = playerTotals(entries);
  const dealsTotal = config.dealsTotal ?? 6;
  const dealsDone = completedDeals(entries);
  const currentDeal = Math.min(dealsDone + 1, dealsTotal);
  const finished = outcome.finished || dealsDone >= dealsTotal;
  const { deltas, pushDelta } = useFloatingDeltas();

  const [dealScores, setDealScores] = useState<[string, string]>(["", ""]);

  function recordDeal() {
    const values = dealScores.map((raw) => Number(raw));
    if (values.some((v) => !Number.isFinite(v) || v < 0)) return;
    addEntry({ player: 0, value: Math.trunc(values[0]), deal: currentDeal });
    addEntry({ player: 1, value: Math.trunc(values[1]), deal: currentDeal });
    pushDelta(0, `+${Math.trunc(values[0])}`);
    pushDelta(1, `+${Math.trunc(values[1])}`);
    setDealScores(["", ""]);
  }

  const bothFilled = dealScores.every((raw) => raw.trim() !== "");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm font-semibold text-white/90">
        {finished
          ? `All ${dealsTotal} deals played`
          : `Deal ${currentDeal} of ${dealsTotal}`}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((player) => {
          const nearRubicon = totals[player] < 100;
          return (
            <PlayerCard
              key={player}
              player={player}
              name={names[player]}
              onName={(name) => setName(player, name)}
              ariaLabel={`${names[player]} partie score`}
            >
              <ScoreDisplay
                player={player}
                value={totals[player]}
                label={`${config.unit.split(" ")[0]}${
                  nearRubicon ? " · under the 100 rubicon" : ""
                }`}
                deltas={deltas}
              />
              <label className="flex flex-col gap-1 text-xs font-medium text-ink-soft">
                This deal
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={dealScores[player]}
                  disabled={finished}
                  aria-label={`${names[player]} score for deal ${currentDeal}`}
                  onChange={(e) =>
                    setDealScores((current) => {
                      const next: [string, string] = [...current];
                      next[player] = e.target.value;
                      return next;
                    })
                  }
                  className="h-14 rounded-xl border border-line bg-card px-3 text-center text-xl font-bold outline-none focus:border-ink-soft disabled:opacity-40"
                />
              </label>
            </PlayerCard>
          );
        })}
      </div>

      <button
        type="button"
        onClick={recordDeal}
        disabled={finished || !bothFilled}
        className="h-14 rounded-xl bg-card text-lg font-bold text-primary-strong shadow-sm disabled:opacity-40"
      >
        Record deal {currentDeal}
      </button>
    </div>
  );
}
