"use client";

import { playerTotals } from "@/lib/scoring/engine";
import {
  EditableName,
  PLAYER_STYLES,
  type BoardProps,
} from "@/components/scorekeeper/parts";

/** Win counters for win-loss, instant-win, and best-of-series games. */
export function TallyBoard({
  config,
  names,
  entries,
  outcome,
  addEntry,
  setName,
}: BoardProps) {
  const totals = playerTotals(entries);
  const finished = outcome.finished;

  return (
    <div>
      {config.seriesLength !== undefined && config.target !== null && (
        <p className="mb-3 text-center text-sm font-medium text-ink-soft">
          First to {config.target} of {config.seriesLength}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((player) => {
          const style = PLAYER_STYLES[player];
          return (
            <section
              key={player}
              aria-label={`${names[player]} wins`}
              className={`flex flex-col gap-3 rounded-2xl border-t-4 ${style.ring} border-x border-b border-x-line border-b-line bg-card p-3`}
            >
              <EditableName
                name={names[player]}
                onChange={(name) => setName(player, name)}
                align="left"
              />
              <p
                className={`text-center text-6xl font-bold tabular-nums ${style.text}`}
              >
                {totals[player]}
              </p>
              <p className="-mt-2 text-center text-xs text-ink-soft">
                {config.counterLabel}
              </p>
              <button
                type="button"
                disabled={finished}
                onClick={() => addEntry({ player, value: 1 })}
                aria-label={`${names[player]} won`}
                className={`h-20 rounded-xl text-xl font-bold text-white disabled:opacity-40 ${style.button}`}
              >
                {names[player].trim() || "Player"} won
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
