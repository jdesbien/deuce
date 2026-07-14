import Link from "next/link";
import { redirect } from "next/navigation";

import { CoupleManager } from "@/app/settings/CoupleManager";
import { ProfileForm } from "@/app/settings/ProfileForm";
import { getCouple, getPartnerProfile } from "@/lib/queries/couples";
import { getCurrentUser } from "@/lib/queries/profiles";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const current = await getCurrentUser();
  if (!current?.profile) redirect("/login?next=/settings");

  const { profile } = current;
  const couple = profile.couple_id ? await getCouple(profile.couple_id) : null;
  const partner = profile.couple_id
    ? await getPartnerProfile(profile.couple_id, profile.id)
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">Your profile</h2>
          <ProfileForm
            initialName={profile.display_name}
            initialEmoji={profile.avatar_emoji}
          />
        </section>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="mb-1 text-lg font-bold">Your partner</h2>
          <p className="mb-4 text-sm text-ink-soft">
            Link up to share live scoreboards, keep one history, and grow
            your streak together.
          </p>
          <CoupleManager
            inviteCode={couple?.invite_code ?? null}
            partnerName={partner?.display_name ?? null}
            partnerEmoji={partner?.avatar_emoji ?? null}
          />
        </section>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">Your games</h2>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/history"
              className="flex-1 rounded-xl border border-line px-4 py-3 text-center font-semibold hover:border-ink-soft"
            >
              Game history
            </Link>
            <Link
              href="/streak"
              className="flex-1 rounded-xl border border-line px-4 py-3 text-center font-semibold hover:border-ink-soft"
            >
              Your streak ♥
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-card p-5">
          <h2 className="mb-4 text-lg font-bold">Account</h2>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-xl border border-line px-4 py-3 font-semibold text-ink-soft hover:border-ink-soft hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
