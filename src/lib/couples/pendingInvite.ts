/**
 * Pending-invite persistence. Opening /join/[code] stores the code;
 * the redeemer auto-links the account the moment its owner is signed
 * in — so the invite survives the signup → confirmation-email →
 * callback detour (and even a browser switch on the same device).
 */

const PENDING_KEY = "c4c:pending-invite";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // invites go stale after a week

interface PendingInvite {
  code: string;
  savedAt: number;
}

export function storePendingInvite(code: string): void {
  try {
    const value: PendingInvite = {
      code: code.toUpperCase().slice(0, 6),
      savedAt: Date.now(),
    };
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(value));
  } catch {
    // Storage blocked — the manual join button still works.
  }
}

export function readPendingInvite(): string | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PendingInvite>;
    if (
      typeof value.code !== "string" ||
      typeof value.savedAt !== "number" ||
      Date.now() - value.savedAt > MAX_AGE_MS
    ) {
      clearPendingInvite();
      return null;
    }
    return value.code;
  } catch {
    return null;
  }
}

export function clearPendingInvite(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // Nothing to do.
  }
}
