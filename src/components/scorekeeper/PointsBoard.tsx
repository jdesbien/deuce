"use client";

import { displayTotals, type PlayerIndex } from "@/lib/scoring/engine";
import {
  CustomAmount,
  EditableName,
  PLAYER_STYLES,
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

  return (
    <div className="grid grid-cols-2 gap-3">
      {([0, 1] as const).map((player) => (
        <PlayerColumn
          key={player}
          player={player}
          name={names[player]}
          total={totals[player]}
          config={config}
          disabled={finished}
          onName={(name) => setName(player, name)}
          onAdd={(value) => addEntry({ player, value })}
        />
      ))}
    </div>
  );
}

function PlayerColumn({
  player,
  name,
  total,
  config,
  disabled,
  onName,
  onAdd,
}: {
  player: PlayerIndex;
  name: string;
  total: number;
  config: BoardProps["config"];
  disabled: boolean;
  onName: (name: string) => void;
  onAdd: (value: number) => void;
}) {
  const style = PLAYER_STYLES[player];
  const progress =
    config.target !== null && config.target > 0
      ? Math.min(100, (total / config.target) * 100)
      : null;

  return (
    <section
      aria-label={`${name} score`}
      className={`flex flex-col gap-3 rounded-2xl border-t-4 ${style.ring} border-x border-b border-x-line border-b-line bg-card p-3`}
    >
      <EditableName name={name} onChange={onName} align="left" />

      <p className={`text-center text-5xl font-bold tabular-nums ${style.text}`}>
        {total}
      </p>
      <p className="-mt-2 text-center text-xs text-ink-soft">
        {config.counterLabel}
        {config.target !== null && config.targetMode !== "none"
          ? ` · ${config.lowIsGood ? "limit" : "target"} ${config.target}`
          : ""}
      </p>

      {progress !== null && (
        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 overflow-hidden rounded-full bg-line"
        >
          <div
            className={`h-full rounded-full ${config.lowIsGood ? "bg-gold" : style.button.split(" ")[0]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {config.quickValues.map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onAdd(value)}
            aria-label={`Add ${value} ${config.unit} to ${name}`}
            className={`h-14 rounded-xl text-lg font-bold text-white disabled:opacity-40 ${style.button}`}
          >
            +{value}
          </button>
        ))}
      </div>

      {config.allowCustom && <CustomAmount onAdd={onAdd} disabled={disabled} />}
    </section>
  );
}
