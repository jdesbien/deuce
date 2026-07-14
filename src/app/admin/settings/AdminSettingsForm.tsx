"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function AdminSettingsForm({
  initialAdsEnabled,
  initialBanner,
}: {
  initialAdsEnabled: boolean;
  initialBanner: string;
}) {
  const router = useRouter();
  const [adsEnabled, setAdsEnabled] = useState(initialAdsEnabled);
  const [banner, setBanner] = useState(initialBanner);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("app_settings")
        .update({
          ads_enabled: adsEnabled,
          announcement_banner: banner.trim() === "" ? null : banner.trim(),
        })
        .eq("id", true);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setMessage("Saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="flex max-w-lg flex-col gap-5">
      <label className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
        <input
          type="checkbox"
          checked={adsEnabled}
          onChange={(e) => setAdsEnabled(e.target.checked)}
          className="mt-1 h-5 w-5 accent-primary"
        />
        <span>
          <span className="font-semibold">Ads enabled</span>
          <span className="block text-sm text-ink-soft">
            Master switch. Nothing shows until an AdSense client id is also
            configured in the environment — currently it isn&apos;t, so ads
            stay off regardless.
          </span>
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-semibold">Announcement banner</span>
        <span className="text-sm text-ink-soft">
          Shows as a dismissible bar site-wide. Leave empty for none.
        </span>
        <textarea
          value={banner}
          onChange={(e) => setBanner(e.target.value)}
          rows={2}
          maxLength={280}
          className="rounded-xl border border-line bg-card px-4 py-3 outline-none focus:border-primary"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm font-medium text-primary-strong">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm font-medium text-accent-strong">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary-strong disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
