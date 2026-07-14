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

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

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
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // With email confirmation enabled, no session is returned yet.
      if (!data.session) {
        setAwaitingConfirmation(true);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      console.error("Sign-up failed:", err);
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong while creating your account. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-line bg-accent-soft p-6 text-center"
      >
        <p className="mb-1 text-2xl" aria-hidden>
          ✉️
        </p>
        <h2 className="font-semibold">Check your email</h2>
        <p className="mt-1 text-sm text-ink-soft">
          We sent a confirmation link to <strong>{email}</strong>. Click it to
          finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={40}
            autoComplete="nickname"
            placeholder="What your partner calls you"
            className="rounded-xl border border-line bg-card px-4 py-3 text-base outline-none focus:border-primary"
          />
        </label>
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
            minLength={8}
            autoComplete="new-password"
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
          {pending ? "Creating account…" : "Sign up"}
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
