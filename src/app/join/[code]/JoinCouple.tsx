"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { clearPendingInvite } from "@/lib/couples/pendingInvite";
import { createClient } from "@/lib/supabase/client";

export function JoinCouple({ code }: { code: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("join_couple", { code });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      clearPendingInvite();
      router.push("/streak");
      router.refresh();
    } catch (err) {
      console.error("Join failed:", err);
      setError("Something went wrong linking you up. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink-soft">
        Use code <strong className="font-mono tracking-widest">{code}</strong>{" "}
        to link your accounts?
      </p>
      <button
        type="button"
        onClick={join}
        disabled={pending}
        className="rounded-xl bg-accent px-6 py-3.5 font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
      >
        {pending ? "Linking…" : "Link us up ♥"}
      </button>
      {error && (
        <p role="alert" className="text-sm font-medium text-primary-strong">
          {error}
        </p>
      )}
    </div>
  );
}
