"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Feedback, FeedbackStatus } from "@/lib/types/database";

const statusStyles: Record<FeedbackStatus, string> = {
  new: "bg-primary-soft text-primary-strong",
  read: "bg-gold-soft text-gold",
  resolved: "bg-accent-soft text-accent-strong",
};

const NEXT_STATUS: Record<FeedbackStatus, FeedbackStatus> = {
  new: "read",
  read: "resolved",
  resolved: "new",
};

export function FeedbackRow({ item }: { item: Feedback }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function advanceStatus() {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("feedback")
        .update({ status: NEXT_STATUS[item.status] })
        .eq("id", item.id);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
        <button
          type="button"
          onClick={advanceStatus}
          disabled={pending}
          title="Click to advance: new → read → resolved"
          className={`rounded-full px-2.5 py-1 font-semibold ${statusStyles[item.status]} disabled:opacity-50`}
        >
          {item.status}
        </button>
        <span>{new Date(item.created_at).toLocaleString()}</span>
        {item.email && <span>· {item.email}</span>}
        {item.page_context && <span>· from {item.page_context}</span>}
      </div>
      <p className="whitespace-pre-wrap text-sm">{item.message}</p>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-primary-strong">
          {error}
        </p>
      )}
    </li>
  );
}
