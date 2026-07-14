"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  AUTH_NOT_CONFIGURED_MESSAGE,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        setError(AUTH_NOT_CONFIGURED_MESSAGE);
        return;
      }
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: insertError } = await supabase.from("feedback").insert({
        message: message.trim(),
        email: email.trim() === "" ? null : email.trim(),
        user_id: user?.id ?? null,
        page_context: document.referrer || null,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setSent(true);
    } catch (err) {
      console.error("Feedback failed:", err);
      setError("Something went wrong sending that — please try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-line bg-accent-soft p-6 text-center"
      >
        <p aria-hidden className="mb-1 text-2xl">
          ♥
        </p>
        <p className="font-semibold">Got it — thank you!</p>
        <p className="mt-1 text-sm text-ink-soft">
          Every note gets read.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Your note
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={3}
          maxLength={5000}
          rows={5}
          className="rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-primary"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Email (optional, if you&apos;d like a reply)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-primary"
        />
      </label>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary-strong"
        >
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-strong disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send it"}
      </button>
    </form>
  );
}
