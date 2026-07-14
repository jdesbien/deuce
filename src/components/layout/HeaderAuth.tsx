"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/client";

interface HeaderProfile {
  display_name: string;
  avatar_emoji: string;
}

type AuthState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authed"; profile: HeaderProfile };

/**
 * Client-side auth display for the header. Runs in the browser so server
 * pages never touch cookies and stay statically renderable.
 */
export function HeaderAuth() {
  // NEXT_PUBLIC_ env vars are inlined at build time, so this initial
  // value is identical on server and client — no hydration mismatch.
  const [state, setState] = useState<AuthState>(() =>
    isSupabaseConfigured() ? { status: "loading" } : { status: "guest" },
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setState({ status: "guest" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_emoji")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setState({
        status: "authed",
        profile: profile ?? { display_name: "Player", avatar_emoji: "♥" },
      });
    }

    void load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state.status === "loading") {
    // Reserve space to avoid layout shift while the session loads.
    return <div aria-hidden className="h-9 w-36" />;
  }

  if (state.status === "authed") {
    return (
      <div className="flex items-center gap-0.5 sm:gap-2">
        <Link
          href="/streak"
          className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-ink-soft hover:bg-primary-soft hover:text-ink sm:px-3"
        >
          Streak
        </Link>
        <Link
          href="/settings"
          className="flex max-w-24 items-center truncate rounded-lg px-2 py-2 text-sm font-medium hover:bg-primary-soft sm:max-w-40"
          title={`${state.profile.display_name} — settings`}
        >
          <span aria-hidden className="mr-1">
            {state.profile.avatar_emoji}
          </span>
          <span className="truncate">{state.profile.display_name}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link
        href="/login"
        className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-ink-soft hover:bg-primary-soft hover:text-ink sm:px-3"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        className="whitespace-nowrap rounded-lg bg-primary px-2.5 py-2 text-sm font-semibold text-white hover:bg-primary-strong sm:px-3"
      >
        Sign up
      </Link>
    </div>
  );
}
