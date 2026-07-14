"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  clearPendingInvite,
  readPendingInvite,
} from "@/lib/couples/pendingInvite";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Site-wide invite redeemer: whenever a signed-in, unlinked user has a
 * stored invite code, link them automatically and take them to the
 * streak page. Runs on load and again on every sign-in event.
 */
export function PendingInviteRedeemer() {
  const router = useRouter();
  const redeemingRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();

    async function redeemIfPending() {
      if (redeemingRef.current) return;
      const code = readPendingInvite();
      if (!code) return;

      redeemingRef.current = true;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return; // Keep the code for after they sign in.

        const { data: profile } = await supabase
          .from("profiles")
          .select("couple_id")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.couple_id) {
          // Already linked — the invite is moot.
          clearPendingInvite();
          return;
        }

        const { error } = await supabase.rpc("join_couple", { code });
        if (error) {
          // Invalid/expired codes are dropped; transient errors retry
          // on the next load because the code is kept.
          if (error.message.includes("Invalid invite code")) {
            clearPendingInvite();
          }
          console.warn("Auto-join failed:", error.message);
          return;
        }

        clearPendingInvite();
        router.push("/streak");
        router.refresh();
      } finally {
        redeemingRef.current = false;
      }
    }

    void redeemIfPending();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void redeemIfPending();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
