"use client";

import { playerTotals } from "@/lib/scoring/engine";
import {
  PlayerCard,
  PLAYER_STYLES,
  ScoreDisplay,
  useFloatingDeltas,
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
  const { deltas, pushDelta } = useFloatingDeltas();

  return (
    <div>
      {config.seriesLength !== undefined && config.target !== null && (
        <p className="mb-3 text-center text-sm font-semibold text-white/90">
          First to {config.target} of {config.seriesLength}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {([0, 1] as const).map((player) => {
          const style = PLAYER_STYLES[player];
          return (
            <PlayerCard
              key={player}
              player={player}
              name={names[player]}
              onName={(name) => setName(player, name)}
              ariaLabel={`${names[player]} wins`}
            >
              <ScoreDisplay
                player={player}
                value={totals[player]}
                label={config.counterLabel}
                deltas={deltas}
              />
              <button
                type="button"
                disabled={finished}
                onClick={() => {
                  addEntry({ player, value: 1 });
                  pushDelta(player, "+1");
                }}
                aria-label={`${names[player]} won`}
                className={`h-20 rounded-xl text-xl font-bold text-white shadow-sm disabled:opacity-40 ${style.button}`}
              >
                {names[player].trim() || "Player"} won
              </button>
            </PlayerCard>
          );
        })}
      </div>
    </div>
  );
}
