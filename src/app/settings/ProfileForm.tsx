"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const EMOJI_CHOICES = [
  "♥",
  "♦",
  "♠",
  "♣",
  "🂡",
  "🃏",
  "😊",
  "😎",
  "🥰",
  "😏",
  "🤓",
  "🥳",
  "🦊",
  "🐻",
  "🐱",
  "🐶",
  "🦉",
  "🐢",
  "🌹",
  "☕",
  "🍷",
  "🌙",
  "⭐",
  "🔥",
] as const;

export function ProfileForm({
  initialName,
  initialEmoji,
}: {
  initialName: string;
  initialEmoji: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Your session expired — please log in again.");
        return;
      }
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: name.trim() || "Player",
          avatar_emoji: emoji,
        })
        .eq("id", user.id);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setMessage("Saved!");
      router.refresh();
    } catch (err) {
      console.error("Profile update failed:", err);
      setError("Something went wrong saving your profile. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Display name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={40}
          className="rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-primary"
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Your emoji</legend>
        <div className="grid grid-cols-8 gap-1.5">
          {EMOJI_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => setEmoji(choice)}
              aria-pressed={emoji === choice}
              aria-label={`Choose ${choice}`}
              className={`flex h-10 items-center justify-center rounded-lg text-xl transition ${
                emoji === choice
                  ? "bg-primary-soft ring-2 ring-primary"
                  : "bg-surface hover:bg-primary-soft"
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm font-medium text-primary-strong">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm font-medium text-accent-strong">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-strong disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
