"use client";

import { displayTotals } from "@/lib/scoring/engine";
import {
  EditableName,
  PLAYER_STYLES,
  type BoardProps,
} from "@/components/scorekeeper/parts";

/**
 * Match-countdown (Schnapsen): both players start at 7 game points and
 * subtract what they win; first to zero takes the Bummerl.
 */
export function CountdownBoard({
  config,
  names,
  entries,
  outcome,
  addEntry,
  setName,
}: BoardProps) {
  const remaining = displayTotals(config, entries);
  const finished = outcome.finished;

  return (
    <div className="grid grid-cols-2 gap-3">
      {([0, 1] as const).map((player) => {
        const style = PLAYER_STYLES[player];
        return (
          <section
            key={player}
            aria-label={`${names[player]} game points left`}
            className={`flex flex-col gap-3 rounded-2xl border-t-4 ${style.ring} border-x border-b border-x-line border-b-line bg-card p-3`}
          >
            <EditableName
              name={names[player]}
              onChange={(name) => setName(player, name)}
              align="left"
            />
            <div className="flex items-baseline justify-center gap-1">
              <p
                className={`text-6xl font-bold tabular-nums ${style.text}`}
              >
                {remaining[player]}
              </p>
              <span className="text-sm text-ink-soft">
                / {config.startValue}
              </span>
            </div>
            <p className="-mt-2 text-center text-xs text-ink-soft">
              {config.counterLabel}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {config.quickValues.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={finished || remaining[player] === 0}
                  onClick={() => addEntry({ player, value })}
                  aria-label={`${names[player]} won ${value} game point${value > 1 ? "s" : ""}`}
                  className={`h-14 rounded-xl text-lg font-bold text-white disabled:opacity-40 ${style.button}`}
                >
                  −{value}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
