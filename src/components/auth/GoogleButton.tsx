"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import {
  AUTH_NOT_CONFIGURED_MESSAGE,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export function GoogleButton({ next = "/" }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signInWithGoogle() {
    setError(null);
    setPending(true);
    try {
      if (!isSupabaseConfigured()) {
        setError(AUTH_NOT_CONFIGURED_MESSAGE);
        return;
      }
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (authError) setError(authError.message);
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong starting Google sign-in. Please try again.",
      );
    } finally {
      // On success the browser navigates away to Google moments later;
      // re-enabling briefly is harmless and guarantees no frozen button.
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-3 font-semibold disabled:opacity-60"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2 3.5-5 3.5-8.6"
          />
          <path
            fill="#34A853"
            d="M12 24c3.2 0 5.9-1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.1 0-5.8-2-6.7-4.9l-.14.01-3.6 2.8-.05.13C3.4 21.3 7.4 24 12 24"
          />
          <path
            fill="#FBBC05"
            d="M5.3 14.5c-.3-.7-.4-1.5-.4-2.5s.2-1.7.4-2.5l-.01-.16-3.7-2.8-.12.06C.5 8.1 0 10 0 12s.5 3.9 1.4 5.4l3.9-2.9"
          />
          <path
            fill="#EB4335"
            d="M12 4.6c2.2 0 3.7 1 4.5 1.8l3.3-3.2C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.6l3.9 3C6.2 6.6 8.9 4.6 12 4.6"
          />
        </svg>
        Continue with Google
      </button>
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary-strong"
        >
          {error}
        </p>
      )}
    </div>
  );
}
