"use client";

import { displayTotals } from "@/lib/scoring/engine";
import {
  CustomAmount,
  PlayerCard,
  PLAYER_STYLES,
  ScoreDisplay,
  useFloatingDeltas,
  type BoardProps,
} from "@/components/scorekeeper/parts";

/**
 * Numeric totals per player. Covers running-total, penalty games
 * (lowIsGood), stake-based and stop-or-go (no target).
 */
export function PointsBoard({
  config,
  names,
  entries,
  outcome,
  addEntry,
  setName,
}: BoardProps) {
  const totals = displayTotals(config, entries);
  const finished = outcome.finished;
  const { deltas, pushDelta } = useFloatingDeltas();

  return (
    <div className="grid grid-cols-2 gap-3">
      {([0, 1] as const).map((player) => {
        const style = PLAYER_STYLES[player];
        const total = totals[player];
        const progress =
          config.target !== null && config.target > 0
            ? Math.min(100, (total / config.target) * 100)
            : null;

        function add(value: number) {
          addEntry({ player, value });
          pushDelta(player, value > 0 ? `+${value}` : `${value}`);
        }

        return (
          <PlayerCard
            key={player}
            player={player}
            name={names[player]}
            onName={(name) => setName(player, name)}
            ariaLabel={`${names[player]} score`}
          >
            <ScoreDisplay
              player={player}
              value={total}
              label={`${config.counterLabel}${
                config.target !== null && config.targetMode !== "none"
                  ? ` · ${config.lowIsGood ? "limit" : "target"} ${config.target}`
                  : ""
              }`}
              deltas={deltas}
            />

            {progress !== null && (
              <div
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 overflow-hidden rounded-full bg-line"
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    config.lowIsGood ? "bg-gold" : style.button.split(" ")[0]
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {config.quickValues.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={finished}
                  onClick={() => add(value)}
                  aria-label={`Add ${value} ${config.unit} to ${names[player]}`}
                  className={`h-14 rounded-xl text-lg font-bold text-white shadow-sm disabled:opacity-40 ${style.button}`}
                >
                  +{value}
                </button>
              ))}
            </div>

            {config.allowCustom && (
              <CustomAmount onAdd={add} disabled={finished} />
            )}
          </PlayerCard>
        );
      })}
    </div>
  );
}
