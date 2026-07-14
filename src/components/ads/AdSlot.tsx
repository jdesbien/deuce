"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

import { PRO_STATUSES } from "@/lib/billing/stripe";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
export const AD_CONSENT_KEY = "c4c:ad-consent";

export type AdConsent = "granted" | "denied";

export function readAdConsent(): AdConsent | null {
  try {
    const raw = window.localStorage.getItem(AD_CONSENT_KEY);
    return raw === "granted" || raw === "denied" ? raw : null;
  } catch {
    return null;
  }
}

interface AdGateState {
  resolved: boolean;
  adsEnabled: boolean;
  isPro: boolean;
  consent: AdConsent | null;
}

/**
 * The one ad unit. Renders a real AdSense slot only when ALL of:
 * client id configured, admin ads_enabled flag on, user consented, and
 * the user is not Pro. Pro users never even load the ad script.
 * Without a client id: dashed placeholder in dev, nothing in prod —
 * the app must never look broken without ads.
 */
export function AdSlot({ slotId }: { slotId?: string }) {
  const [gate, setGate] = useState<AdGateState>({
    resolved: false,
    adsEnabled: false,
    isPro: false,
    consent: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      const consent = readAdConsent();
      let adsEnabled = false;
      let isPro = false;

      if (isSupabaseConfigured()) {
        try {
          const supabase = createClient();
          const [{ data: settings }, userResult] = await Promise.all([
            supabase
              .from("app_settings")
              .select("ads_enabled")
              .maybeSingle(),
            supabase.auth.getUser(),
          ]);
          adsEnabled = settings?.ads_enabled ?? false;
          const user = userResult.data.user;
          if (user) {
            const { data: subscription } = await supabase
              .from("subscriptions")
              .select("status")
              .eq("user_id", user.id)
              .maybeSingle();
            // Cosmetic client check only — ad removal costs nothing to
            // serve, so hiding here is fine (entitlement stays server-side
            // for anything that matters).
            isPro =
              subscription !== null && PRO_STATUSES.has(subscription.status);
          }
        } catch {
          adsEnabled = false;
        }
      }

      if (!cancelled) setGate({ resolved: true, adsEnabled, isPro, consent });
    }

    void resolve();

    function onConsentChange() {
      void resolve();
    }
    window.addEventListener("c4c:ad-consent-change", onConsentChange);
    return () => {
      cancelled = true;
      window.removeEventListener("c4c:ad-consent-change", onConsentChange);
    };
  }, []);

  if (!ADSENSE_CLIENT_ID) {
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="flex h-14 items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink-soft">
          Ad slot (hidden in production until AdSense is configured)
        </div>
      );
    }
    return null;
  }

  if (!gate.resolved || !gate.adsEnabled || gate.isPro) return null;
  if (gate.consent !== "granted") return null;

  return (
    <>
      {/* Ad script loads lazily and only for consented, non-Pro users. */}
      <Script
        id="adsense-script"
        strategy="lazyOnload"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        crossOrigin="anonymous"
      />
      <ins
        className="adsbygoogle block h-14 w-full"
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <Script id={`adsense-push-${slotId ?? "banner"}`} strategy="lazyOnload">
        {`(window.adsbygoogle = window.adsbygoogle || []).push({});`}
      </Script>
    </>
  );
}

/**
 * Sticky bottom banner for browse/rules pages. NEVER place on the
 * scoreboard (/play) — mis-taps mid-game are infuriating and risk
 * invalid-click policy trouble.
 */
export function StickyAdBanner({
  aboveMobileCta = false,
}: {
  /** Sit above the game page's mobile "Start scorekeeper" bar. */
  aboveMobileCta?: boolean;
}) {
  return (
    <div
      className={`fixed inset-x-0 z-30 px-3 ${
        aboveMobileCta ? "bottom-[4.75rem] sm:bottom-0" : "bottom-0"
      }`}
    >
      <div className="mx-auto max-w-5xl">
        <AdSlot slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER} />
      </div>
    </div>
  );
}
