"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { GoogleButton } from "@/components/auth/GoogleButton";
import { features } from "@/config/features";
import { createClient } from "@/lib/supabase/client";
import {
  AUTH_NOT_CONFIGURED_MESSAGE,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Seed with errors passed back from /auth/callback redirects.
  const [error, setError] = useState<string | null>(
    searchParams.get("error"),
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (!isSupabaseConfigured()) {
        setError(AUTH_NOT_CONFIGURED_MESSAGE);
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      console.error("Log-in failed:", err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong while logging in. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      {features.googleAuth && (
        <>
          <div className="flex items-center gap-3 text-xs text-ink-soft">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
          <GoogleButton next={next} />
        </>
      )}
    </div>
  );
}
