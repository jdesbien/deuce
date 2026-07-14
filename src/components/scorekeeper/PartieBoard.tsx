"use client";

import { useState } from "react";

import { completedDeals, playerTotals } from "@/lib/scoring/engine";
import {
  EditableName,
  PLAYER_STYLES,
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

  const [dealScores, setDealScores] = useState<["", ""] | [string, string]>([
    "",
    "",
  ]);

  function recordDeal() {
    const values = dealScores.map((raw) => Number(raw));
    if (values.some((v) => !Number.isFinite(v) || v < 0)) return;
    addEntry({ player: 0, value: Math.trunc(values[0]), deal: currentDeal });
    addEntry({ player: 1, value: Math.trunc(values[1]), deal: currentDeal });
    setDealScores(["", ""]);
  }

  const bothFilled = dealScores.every((raw) => raw.trim() !== "");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm font-semibold">
        {finished ? `All ${dealsTotal} deals played` : `Deal ${currentDeal} of ${dealsTotal}`}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((player) => {
          const style = PLAYER_STYLES[player];
          const nearRubicon = totals[player] < 100;
          return (
            <section
              key={player}
              aria-label={`${names[player]} partie score`}
              className={`flex flex-col gap-3 rounded-2xl border-t-4 ${style.ring} border-x border-b border-x-line border-b-line bg-card p-3`}
            >
              <EditableName
                name={names[player]}
                onChange={(name) => setName(player, name)}
                align="left"
              />
              <p
                className={`text-center text-5xl font-bold tabular-nums ${style.text}`}
              >
                {totals[player]}
              </p>
              <p className="-mt-2 text-center text-xs text-ink-soft">
                {config.unit.split(" ")[0]}
                {nearRubicon ? " · under the 100 rubicon" : ""}
              </p>
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
            </section>
          );
        })}
      </div>

      <button
        type="button"
        onClick={recordDeal}
        disabled={finished || !bothFilled}
        className="h-14 rounded-xl bg-ink text-lg font-bold text-white disabled:opacity-40"
      >
        Record deal {currentDeal}
      </button>
    </div>
  );
}
