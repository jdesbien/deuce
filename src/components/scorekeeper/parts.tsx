"use client";

import { useState } from "react";

import type {
  Outcome,
  PlayerIndex,
  ScoreEntry,
  ScorekeeperConfig,
} from "@/lib/scoring/engine";

/** Player accent colors: player 1 = rosewood, player 2 = terracotta. */
export const PLAYER_STYLES = [
  {
    ring: "border-primary",
    text: "text-primary-strong",
    button: "bg-primary hover:bg-primary-strong",
    soft: "bg-primary-soft",
  },
  {
    ring: "border-accent",
    text: "text-accent-strong",
    button: "bg-accent hover:bg-accent-strong",
    soft: "bg-accent-soft",
  },
] as const;

export function EditableName({
  name,
  onChange,
  align,
}: {
  name: string;
  onChange: (name: string) => void;
  align: "left" | "right";
}) {
  return (
    <input
      type="text"
      value={name}
      maxLength={20}
      aria-label="Player name"
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        if (e.target.value.trim() === "") onChange("Player");
      }}
      className={`w-full bg-transparent text-sm font-semibold outline-none focus:underline ${
        align === "right" ? "text-right" : "text-left"
      }`}
    />
  );
}

export function CustomAmount({
  onAdd,
  disabled,
}: {
  onAdd: (value: number) => void;
  disabled: boolean;
}) {
  const [raw, setRaw] = useState("");

  function submit() {
    const value = Number(raw);
    if (!Number.isFinite(value) || value === 0) return;
    onAdd(Math.trunc(value));
    setRaw("");
  }

  return (
    <div className="flex gap-2">
      <input
        type="number"
        inputMode="numeric"
        value={raw}
        placeholder="Other…"
        aria-label="Custom amount"
        disabled={disabled}
        onChange={(e) => setRaw(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        className="h-12 w-full min-w-0 rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-ink-soft disabled:opacity-50"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        className="h-12 shrink-0 rounded-xl border border-line bg-card px-4 font-semibold disabled:opacity-50"
      >
        Add
      </button>
    </div>
  );
}

export function HistoryList({
  entries,
  names,
  formatValue,
}: {
  entries: ScoreEntry[];
  names: [string, string];
  formatValue?: (entry: ScoreEntry) => string;
}) {
  if (entries.length === 0) return null;
  const format =
    formatValue ?? ((e: ScoreEntry) => (e.value > 0 ? `+${e.value}` : `${e.value}`));

  return (
    <details className="rounded-2xl border border-line bg-card">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">
        History ({entries.length})
      </summary>
      <ol className="max-h-56 overflow-y-auto border-t border-line px-4 py-2 text-sm">
        {[...entries].reverse().map((entry, i) => (
          <li
            key={entries.length - i}
            className="flex justify-between gap-3 border-b border-line py-1.5 last:border-b-0"
          >
            <span className="truncate text-ink-soft">
              {entry.deal !== undefined ? `Deal ${entry.deal} · ` : ""}
              {names[entry.player]}
              {entry.note ? ` — ${entry.note}` : ""}
            </span>
            <span className={`shrink-0 font-semibold ${PLAYER_STYLES[entry.player].text}`}>
              {format(entry)}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function BoardActions({
  onUndo,
  onReset,
  canUndo,
}: {
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
}) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="h-12 flex-1 rounded-xl border border-line bg-card font-semibold disabled:opacity-40"
      >
        ↩ Undo
      </button>
      {confirmingReset ? (
        <button
          type="button"
          onClick={() => {
            onReset();
            setConfirmingReset(false);
          }}
          onBlur={() => setConfirmingReset(false)}
          className="h-12 flex-1 rounded-xl bg-primary font-semibold text-white"
        >
          Really reset?
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmingReset(true)}
          disabled={!canUndo}
          className="h-12 flex-1 rounded-xl border border-line bg-card font-semibold text-ink-soft disabled:opacity-40"
        >
          Reset
        </button>
      )}
    </div>
  );
}

export function WinnerBanner({
  outcome,
  names,
  onRematch,
}: {
  outcome: Outcome;
  names: [string, string];
  onRematch: () => void;
}) {
  if (outcome.winner === null && !outcome.detail) return null;

  if (outcome.winner === null) {
    return (
      <div className="rounded-2xl border border-line bg-gold-soft p-4 text-center text-sm font-medium">
        {outcome.detail}
      </div>
    );
  }

  return (
    <div
      role="status"
      className={`rounded-2xl border-2 p-6 text-center ${PLAYER_STYLES[outcome.winner].ring} ${PLAYER_STYLES[outcome.winner].soft}`}
    >
      <p aria-hidden className="mb-1 animate-bounce text-4xl">
        🎉
      </p>
      <p className="text-xl font-bold">{names[outcome.winner]} wins!</p>
      {outcome.detail && (
        <p className="mt-1 text-sm text-ink-soft">{outcome.detail}</p>
      )}
      <button
        type="button"
        onClick={onRematch}
        className="mt-4 h-12 w-full rounded-xl bg-ink font-semibold text-white"
      >
        Rematch
      </button>
    </div>
  );
}

export interface BoardProps {
  config: ScorekeeperConfig;
  names: [string, string];
  entries: ScoreEntry[];
  outcome: Outcome;
  addEntry: (entry: ScoreEntry) => void;
  setName: (player: PlayerIndex, name: string) => void;
}
