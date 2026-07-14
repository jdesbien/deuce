"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
 * pages never touch cookies and stay statically renderable. Signed-in
 * users get an account menu: streak, history, settings, sign out.
 */
export function HeaderAuth() {
  // NEXT_PUBLIC_ env vars are inlined at build time, so this initial
  // value is identical on server and client — no hydration mismatch.
  const [state, setState] = useState<AuthState>(() =>
    isSupabaseConfigured() ? { status: "loading" } : { status: "guest" },
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      try {
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
      } catch (err) {
        // Never leave the nav invisible — fall back to guest links.
        console.warn("Header auth check failed:", err);
        if (!cancelled) setState({ status: "guest" });
      }
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

  // Close the menu on Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  if (state.status === "loading") {
    // Reserve space to avoid layout shift while the session loads.
    return <div aria-hidden className="h-9 w-36" />;
  }

  if (state.status === "authed") {
    const itemClass =
      "block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-primary-soft";
    return (
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex max-w-36 items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-primary-soft sm:max-w-48"
        >
          <span aria-hidden>{state.profile.avatar_emoji}</span>
          <span className="truncate">{state.profile.display_name}</span>
          <span aria-hidden className="text-xs text-ink-soft">
            ▾
          </span>
        </button>

        {menuOpen && (
          <>
            <div
              aria-hidden
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              aria-label="Account"
              className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-line bg-card p-1 shadow-lg"
            >
              <Link
                href="/streak"
                role="menuitem"
                className={itemClass}
                onClick={() => setMenuOpen(false)}
              >
                ♥ Your streak
              </Link>
              <Link
                href="/history"
                role="menuitem"
                className={itemClass}
                onClick={() => setMenuOpen(false)}
              >
                Game history
              </Link>
              <Link
                href="/settings"
                role="menuitem"
                className={itemClass}
                onClick={() => setMenuOpen(false)}
              >
                Settings
              </Link>
              <div aria-hidden className="my-1 h-px bg-line" />
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className={`${itemClass} text-ink-soft`}
                >
                  Sign out
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 sm:gap-2">
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
