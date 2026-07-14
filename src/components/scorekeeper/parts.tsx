"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type {
  Outcome,
  PlayerIndex,
  ScoreEntry,
  ScorekeeperConfig,
} from "@/lib/scoring/engine";

/**
 * Player identities on the table: player 1 plays hearts (rosewood),
 * player 2 plays diamonds (terracotta).
 */
export const PLAYER_STYLES = [
  {
    glyph: "♥",
    pip: "text-primary",
    text: "text-primary-strong",
    button: "bg-primary hover:bg-primary-strong",
    soft: "bg-primary-soft",
    ring: "border-primary",
  },
  {
    glyph: "♦",
    pip: "text-accent",
    text: "text-accent-strong",
    button: "bg-accent hover:bg-accent-strong",
    soft: "bg-accent-soft",
    ring: "border-accent",
  },
] as const;

/**
 * A player's half of the table, styled as a playing card lying on the
 * rosewood surface: white face, corner pips, a slight tilt.
 */
export function PlayerCard({
  player,
  name,
  onName,
  ariaLabel,
  children,
}: {
  player: PlayerIndex;
  name: string;
  onName: (name: string) => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const style = PLAYER_STYLES[player];
  return (
    <section
      aria-label={ariaLabel}
      className={`relative flex flex-col gap-3 rounded-2xl bg-card p-3 pt-6 shadow-lg ring-1 ring-black/5 ${
        player === 0 ? "-rotate-1" : "rotate-1"
      }`}
    >
      <span
        aria-hidden
        className={`absolute left-2.5 top-2 text-sm font-bold leading-none ${style.pip}`}
      >
        {style.glyph}
      </span>
      <span
        aria-hidden
        className={`absolute bottom-2 right-2.5 rotate-180 text-sm font-bold leading-none ${style.pip}`}
      >
        {style.glyph}
      </span>
      <EditableName name={name} onChange={onName} align="left" />
      {children}
    </section>
  );
}

// ------------------------------------------------------------------
// Score display: the number pops on every change, and each entry
// floats a little "+5" chip off the card.
// ------------------------------------------------------------------

export interface FloatingDelta {
  id: number;
  player: PlayerIndex;
  text: string;
}

export function useFloatingDeltas() {
  const [deltas, setDeltas] = useState<FloatingDelta[]>([]);
  const nextIdRef = useRef(0);

  const pushDelta = useCallback((player: PlayerIndex, text: string) => {
    const id = nextIdRef.current++;
    setDeltas((current) => [...current, { id, player, text }]);
    window.setTimeout(() => {
      setDeltas((current) => current.filter((d) => d.id !== id));
    }, 950);
  }, []);

  return { deltas, pushDelta };
}

export function ScoreDisplay({
  player,
  value,
  suffix,
  label,
  deltas,
}: {
  player: PlayerIndex;
  value: number;
  suffix?: string;
  label: string;
  deltas: FloatingDelta[];
}) {
  const style = PLAYER_STYLES[player];
  return (
    <div className="relative text-center">
      <p
        key={value}
        className={`animate-score-pop font-serif text-5xl font-bold tabular-nums ${style.text}`}
      >
        {value}
        {suffix && (
          <span className="ml-1 align-baseline font-sans text-sm font-medium text-ink-soft">
            {suffix}
          </span>
        )}
      </p>
      <p className="mt-0.5 text-center text-xs text-ink-soft">{label}</p>
      {deltas
        .filter((d) => d.player === player)
        .map((d) => (
          <span
            key={d.id}
            aria-hidden
            className={`pointer-events-none absolute left-1/2 top-0 animate-rise-fade font-serif text-2xl font-bold ${style.text}`}
          >
            {d.text}
          </span>
        ))}
    </div>
  );
}

// ------------------------------------------------------------------

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

// ------------------------------------------------------------------
// Celebration
// ------------------------------------------------------------------

const CONFETTI_GLYPHS = ["♥", "♦", "♠", "♣"] as const;
const CONFETTI_COLORS = ["#7a2e3a", "#e07a5f", "#8f6b23", "#b3323f"] as const;

/** Deterministic scatter (render must be pure); plenty random to the eye. */
function scatter(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** A brief shower of suit glyphs. Client-only; renders after a win. */
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: scatter(i + 1) * 100,
        delay: scatter(i + 2) * 0.8,
        duration: 2.1 + scatter(i + 3) * 1.3,
        size: 13 + scatter(i + 4) * 15,
        glyph: CONFETTI_GLYPHS[i % CONFETTI_GLYPHS.length],
        color: CONFETTI_COLORS[(i + 1) % CONFETTI_COLORS.length],
      })),
    [],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="absolute top-0 animate-confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            fontSize: piece.size,
            color: piece.color,
          }}
        >
          {piece.glyph}
        </span>
      ))}
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
      <div className="animate-pop-in rounded-2xl border border-line bg-gold-soft p-4 text-center text-sm font-medium">
        {outcome.detail}
      </div>
    );
  }

  return (
    <div
      role="status"
      className={`animate-pop-in rounded-2xl border-2 p-6 text-center ${PLAYER_STYLES[outcome.winner].ring} ${PLAYER_STYLES[outcome.winner].soft}`}
    >
      <Confetti />
      <p aria-hidden className="mb-1 animate-bounce text-4xl">
        🎉
      </p>
      <p className="font-serif text-2xl font-bold">
        {names[outcome.winner]} wins!
      </p>
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
