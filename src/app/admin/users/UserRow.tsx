"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types/database";

export function UserRow({
  profile,
  isSelf,
}: {
  profile: Profile;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function toggleRole() {
    setPending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: profile.role === "admin" ? "user" : "admin" })
        .eq("id", profile.id);
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

  async function deleteUser() {
    setPending(true);
    setError(null);
    setConfirmingDelete(false);
    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Delete failed.");
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
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden className="text-2xl">
          {profile.avatar_emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {profile.display_name}
            {isSelf && <span className="ml-2 text-xs text-ink-soft">(you)</span>}
          </p>
          <p className="text-xs text-ink-soft">
            {profile.role === "admin" ? "Admin" : "User"}
            {profile.couple_id ? " · linked" : " · unlinked"} · joined{" "}
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggleRole}
            disabled={pending || isSelf}
            title={isSelf ? "You can't change your own role" : undefined}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold disabled:opacity-40"
          >
            {profile.role === "admin" ? "Demote" : "Make admin"}
          </button>
          {confirmingDelete ? (
            <button
              type="button"
              onClick={deleteUser}
              onBlur={() => setConfirmingDelete(false)}
              disabled={pending}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Really delete?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={pending || isSelf}
              title={isSelf ? "You can't delete yourself" : undefined}
              className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-soft disabled:opacity-40"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-primary-strong">
          {error}
        </p>
      )}
    </li>
  );
}
