"use client";

import { displayTotals } from "@/lib/scoring/engine";
import {
  PlayerCard,
  PLAYER_STYLES,
  ScoreDisplay,
  useFloatingDeltas,
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
  const { deltas, pushDelta } = useFloatingDeltas();

  return (
    <div className="grid grid-cols-2 gap-3">
      {([0, 1] as const).map((player) => {
        const style = PLAYER_STYLES[player];
        return (
          <PlayerCard
            key={player}
            player={player}
            name={names[player]}
            onName={(name) => setName(player, name)}
            ariaLabel={`${names[player]} game points left`}
          >
            <ScoreDisplay
              player={player}
              value={remaining[player]}
              suffix={`/ ${config.startValue}`}
              label={config.counterLabel}
              deltas={deltas}
            />
            <div className="grid grid-cols-3 gap-2">
              {config.quickValues.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={finished || remaining[player] === 0}
                  onClick={() => {
                    addEntry({ player, value });
                    pushDelta(player, `−${value}`);
                  }}
                  aria-label={`${names[player]} won ${value} game point${value > 1 ? "s" : ""}`}
                  className={`h-14 rounded-xl text-lg font-bold text-white shadow-sm disabled:opacity-40 ${style.button}`}
                >
                  −{value}
                </button>
              ))}
            </div>
          </PlayerCard>
        );
      })}
    </div>
  );
}
