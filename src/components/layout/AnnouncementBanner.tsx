"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const DISMISSED_KEY = "c4c:announcement-dismissed";

/**
 * Site-wide dismissible announcement bar, controlled from Admin →
 * Settings. Fetched client-side so static pages stay static; dismissal
 * is remembered per message, so a new announcement reappears.
 */
export function AnnouncementBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("app_settings")
          .select("announcement_banner")
          .maybeSingle();
        if (cancelled) return;
        const banner = data?.announcement_banner ?? null;
        if (!banner) return;
        const dismissed = window.localStorage.getItem(DISMISSED_KEY);
        if (dismissed !== banner) setMessage(banner);
      } catch {
        // No banner is always a safe fallback.
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!message) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISSED_KEY, message ?? "");
    } catch {
      // Session-only dismissal is fine.
    }
    setMessage(null);
  }

  return (
    <div className="border-b border-line bg-gold-soft">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 text-sm">
        <p className="flex-1">{message}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-lg px-2 py-1 font-semibold text-ink-soft hover:bg-card"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
