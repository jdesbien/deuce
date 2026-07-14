"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  AD_CONSENT_KEY,
  readAdConsent,
  type AdConsent,
} from "@/components/ads/AdSlot";
import { brand } from "@/config/brand";

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/**
 * Minimal consent gate for the ad script, stored in localStorage.
 * Structured so a Google-certified CMP can replace it for EEA/UK
 * traffic later: this component is the only consent writer, and ad
 * code reads consent through readAdConsent().
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT_ID) return;
    // One-shot read of stored consent (external system) after mount, so
    // server HTML (no banner) and the first client render stay identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (readAdConsent() === null) setVisible(true);
  }, []);

  function choose(consent: AdConsent) {
    try {
      window.localStorage.setItem(AD_CONSENT_KEY, consent);
    } catch {
      // Storage blocked: treat as session-only choice.
    }
    window.dispatchEvent(new Event("c4c:ad-consent-change"));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-card p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-ink-soft">
          We keep {brand.name} free with ads, which use cookies. See our{" "}
          <Link href="/privacy" className="underline hover:text-ink">
            privacy policy
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold sm:flex-none"
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white sm:flex-none"
          >
            Allow ads
          </button>
        </div>
      </div>
    </div>
  );
}
