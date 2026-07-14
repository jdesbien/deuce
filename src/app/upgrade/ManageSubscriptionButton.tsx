"use client";

import { useState } from "react";

export function ManageSubscriptionButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/portal", { method: "POST" });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not open billing. Please try again.");
        return;
      }
      window.location.assign(data.url);
    } catch (err) {
      console.error("Portal failed:", err);
      setError("Could not open billing. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={openPortal}
        disabled={pending}
        className="w-full rounded-xl border border-line px-4 py-3 font-semibold hover:border-ink-soft disabled:opacity-60"
      >
        {pending ? "Opening…" : "Manage subscription"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-primary-strong">
          {error}
        </p>
      )}
    </div>
  );
}
