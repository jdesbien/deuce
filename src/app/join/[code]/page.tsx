import Link from "next/link";

import { JoinCouple } from "@/app/join/[code]/JoinCouple";
import { getCurrentUser } from "@/lib/queries/profiles";

export const metadata = {
  title: "Join your partner",
  robots: { index: false },
};

export default async function JoinPage(props: PageProps<"/join/[code]">) {
  const { code } = await props.params;
  const normalized = code.toUpperCase().slice(0, 6);
  const current = await getCurrentUser();

  return (
    <div className="mx-auto max-w-sm px-4 py-12 text-center">
      <p aria-hidden className="mb-2 text-4xl">
        ♥
      </p>
      <h1 className="mb-2 text-2xl font-bold">
        Your partner wants to link up
      </h1>

      {!current ? (
        <>
          <p className="mb-6 text-ink-soft">
            Create a free account (or log in) and you&apos;ll be linked
            automatically — shared scoreboards, one history, and a streak
            you build together.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/signup?next=/join/${normalized}`}
              className="rounded-xl bg-accent px-6 py-3.5 font-semibold text-white hover:bg-accent-strong"
            >
              Sign up and link
            </Link>
            <Link
              href={`/login?next=/join/${normalized}`}
              className="rounded-xl border border-line bg-card px-6 py-3.5 font-semibold hover:border-ink-soft"
            >
              I already have an account
            </Link>
          </div>
        </>
      ) : current.profile?.couple_id ? (
        <>
          <p className="mb-6 text-ink-soft">
            You&apos;re already linked with a partner. To join a different
            couple, unlink first in Settings.
          </p>
          <Link
            href="/settings"
            className="inline-block rounded-xl border border-line bg-card px-6 py-3.5 font-semibold hover:border-ink-soft"
          >
            Open settings
          </Link>
        </>
      ) : (
        <JoinCouple code={normalized} />
      )}
    </div>
  );
}
