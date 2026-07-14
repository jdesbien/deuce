"use client";

import { useEffect } from "react";

import { storePendingInvite } from "@/lib/couples/pendingInvite";

/**
 * Remembers the invite code as soon as anyone lands on a join link, so
 * the link survives signup, the confirmation-email detour, and even a
 * different browser tab — the redeemer picks it up after sign-in.
 */
export function StorePendingInvite({ code }: { code: string }) {
  useEffect(() => {
    storePendingInvite(code);
  }, [code]);

  return null;
}
