"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { clearPendingInvite } from "@/lib/couples/pendingInvite";
import { createClient } from "@/lib/supabase/client";

export function CoupleManager({
  inviteCode,
  partnerName,
  partnerEmoji,
}: {
  inviteCode: string | null;
  partnerName: string | null;
  partnerEmoji: string | null;
}) {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingUnlink, setConfirmingUnlink] = useState(false);

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(null);
    try {
      await action();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function createCouple() {
    await run(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("create_couple");
      if (rpcError) throw new Error(rpcError.message);
    });
  }

  async function joinCouple() {
    await run(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("join_couple", {
        code: joinCode,
      });
      if (rpcError) throw new Error(rpcError.message);
      clearPendingInvite();
    });
  }

  async function leaveCouple() {
    setConfirmingUnlink(false);
    await run(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("leave_couple");
      if (rpcError) throw new Error(rpcError.message);
    });
  }

  async function copyInviteLink() {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/join/${inviteCode}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — long-press the code to copy it manually.");
    }
  }

  // Linked and partner has joined.
  if (inviteCode && partnerName) {
    return (
      <div className="flex flex-col gap-3">
        <p className="rounded-xl bg-accent-soft px-4 py-3 text-center font-semibold">
          <span aria-hidden className="mr-1">
            {partnerEmoji ?? "♥"}
          </span>
          Linked with {partnerName} ♥
        </p>
        {confirmingUnlink ? (
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-ink-soft">
              Unlink from {partnerName}? Your shared history stays saved and
              relinking is easy.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingUnlink(false)}
                className="flex-1 rounded-xl border border-line px-4 py-3 font-semibold"
              >
                Stay linked
              </button>
              <button
                type="button"
                onClick={leaveCouple}
                disabled={pending}
                className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                Unlink
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingUnlink(true)}
            className="text-sm text-ink-soft underline hover:text-ink"
          >
            Unlink
          </button>
        )}
        {error && (
          <p role="alert" className="text-sm font-medium text-primary-strong">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Couple created, waiting for the partner.
  if (inviteCode) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-soft">
          Share this code with your partner — they enter it after signing up
          (or just send them the link):
        </p>
        <p className="rounded-xl bg-surface px-4 py-4 text-center font-mono text-3xl font-bold tracking-[0.3em]">
          {inviteCode}
        </p>
        <button
          type="button"
          onClick={copyInviteLink}
          className="rounded-xl bg-accent px-4 py-3 font-semibold text-white hover:bg-accent-strong"
        >
          {copied ? "Copied! ♥" : "Copy invite link"}
        </button>
        {error && (
          <p role="alert" className="text-sm font-medium text-primary-strong">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Not linked yet.
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={createCouple}
        disabled={pending}
        className="rounded-xl bg-accent px-4 py-3 font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
      >
        Get your invite code
      </button>
      <div className="flex items-center gap-3 text-xs text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        or enter theirs
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          aria-label="Partner's invite code"
          className="w-full rounded-xl border border-line bg-card px-4 py-3 text-center font-mono text-lg tracking-[0.2em] outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={joinCouple}
          disabled={pending || joinCode.trim().length < 6}
          className="shrink-0 rounded-xl bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-strong disabled:opacity-60"
        >
          Link
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-primary-strong">
          {error}
        </p>
      )}
    </div>
  );
}
